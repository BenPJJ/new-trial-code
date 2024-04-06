import FSM, { CONNECT_STATE, ACTION_TYPE } from "./stateMachine";
import { CONNECT_MODE, CONNECT_STATE_CODE } from "../constant/index";
import Http from "../manager/http";
import Layout from "../manager/layout";
import Rtc, { START_PUSHER_ERROR } from "../manager/rtc";
import Device from "../manager/device";
import Im from "../manager/im";
import EventEmitter from "../libs/eventEmitter";

// 跳过前置检测，异常回退事件不做检测（不要轻易添加，需要确认再确认）
const skipCheckList = [
  ACTION_TYPE.CLOSESWITCHCONNECT,
  ACTION_TYPE.CANCELINVITE,
  ACTION_TYPE.CANCELINVITEWAITING,
  ACTION_TYPE.CANCELLINKING,
  ACTION_TYPE.STOPALIVE,
  ACTION_TYPE.CANCELAPPLY,
  ACTION_TYPE.REJECTINVITE,
  ACTION_TYPE.APPLYINGTIMEOUT,
  ACTION_TYPE.INVITETIMEOUT,
  ACTION_TYPE.WAITINGTIMEOUT,
  ACTION_TYPE.QUITROOM,
  ACTION_TYPE.ENDALIVE,
  ACTION_TYPE.FORBIDS,
  ACTION_TYPE.CANCELAUTHORIZATION,
  ACTION_TYPE.LINKINGFAILED,
  ACTION_TYPE.CANCELRETRY,
];

class Voice extends EventEmitter {
  // ========= 公有数据 =========
  props = {};

  httpManager = null;
  layoutManager = null;
  rtcManager = null;
  deviceManager = null;
  imManager = null;

  data = {
    connectState: CONNECT_STATE.UNLINKED, // 连麦状态
    connectMode: CONNECT_MODE.VIDEO, // 连麦模式
    connectToken: "", // 连麦token
    connectBaseInfo: {}, // 连麦基础信息
    teacherRoomId: "", // 讲师tim房间id
    connectSwitch: false, // 连麦开关
    cameraOn: 0, // 摄像头状态
    micOn: 0, // 麦克风状态
  };

  // ========= 私有数据 =========
  #fsm = null; // 状态机
  #inviteMsg = null; // 邀请连麦msg
  #connectStateTimer = null; // 连麦状态定时器

  // ====== 小程序环境 ======
  #isInterJump = false; //内部跳转标识

  constructor(props = {}) {
    super();
    this.props = props;

    this.init();
  }

  init() {
    const { appId, aliveId, userId, userType } = this.props;

    // 初始化http
    this.httpManager = new Http({
      options: { appId, aliveId, userId, userType },
    });
    // 初始化im
    this.imManager = new Im({
      imSdk: this.props.imSdk,
    });
    // 初始化device
    this.deviceManager = new Device({
      platform: this.props.platform,
    });
    // 初始化rtc
    this.rtcManager = new Rtc({
      rtcSdk: this.props.rtcSdk,
      platform: this.props.platform,
    });
    // 初始化layout
    this.layoutManager = new Layout({
      http: this.httpManager,
      rtcSdk: this.rtcManager,
    });

    // 初始化状态机
    this.initFsm();
    // 注册Tim 监听事件
    this.initTimEventListener();
  }

  initFsm() {
    this.#fsm = new FSM({
      // ========= 全局状态变更 start =========
      // 状态变更前
      transitionBeforeEffect: async (resolve, reject, lifecycle) => {
        // 实例初始化 || 回滚 都不校验
        if (
          lifecycle.transition === "init" ||
          skipCheckList.includes(lifecycle.transition)
        ) {
          resolve();
          return;
        }

        // 获取当前设备网络状态
        try {
          this.deviceManager.getNetworkState();
        } catch (error) {
          // TODO:toast
          reject();
        }

        // 校验TIM在线状态
        try {
          const onlineState = await this.imManager.checkOnlineState();

          if (!onlineState) {
            // TODO:toast
            reject();
          }
        } catch (error) {
          // TODO:toast
          reject();
        }

        // 检测设备授权状态
        try {
          // { type, state } = authorityState
          const authorityState =
            await this.deviceManager.checkDeviceAuthority();

          if (!authorityState.state) {
            // TODO:toast
            reject();
          }
        } catch (error) {
          // TODO:toast
          reject();
        }

        resolve();
      },
      // 状态变更后
      transitionAfterEffect: (lifecycle) => {
        // 同步状态
        this.data.connectState = this.#fsm.state;
      },
      // 状态流转未执行完成，禁止触发其他状态流转
      pendingTransition: (error) => {},
      // 状态流转规则未被定义
      invalidTransition: (error) => {},
      // ========= 全局状态变更 end =========

      // ========= 用户申请正向链路 start =========
      // 申请连麦
      applyBeforeEffect: async (resolve, reject) => {
        try {
          const res = await this.httpManager.applyConnect();
          // 申请连麦兜底，连麦状态非申请中、未连麦，停止轮训
          const condition =
            this.data.connectState !== CONNECT_STATE.PROGRESS &&
            this.data.connectState !== CONNECT_STATE.UNLINKED;
          this.pollConnectState(6, 10000, condition);
          resolve();

          this.props.onApplyBefore({ code: 0, data: res });
        } catch (error) {
          reject();

          // 重置数据
          this.resetData();

          this.props.onApplyBefore({ code: 1, data: error });
        }
      },
      // 接收讲师同意连麦申请
      agreedBeforeEffect: (resolve) => {
        // 清除连麦状态轮询定时器
        this.clearPollConnectState();

        resolve();

        this.props.onAgreedBefore();
      },
      agreedAfterEffect: () => {
        this.props.onAgreedAfter();
        this.fsm[ACTION_TYPE.CONNECT]();
      },
      // ========= 用户申请正向链路 end =========

      // ========= 讲师邀请正向链路 start =========
      inviteBeforeEffect: (resolve) => {
        this.props.inviteBefore();
        resolve();
      },
      inviteAfterEffect: () => {
        const { timeout, invited_at } = this.#inviteMsg;
        this.props.inviteAfter(
          {
            timeout,
            invited_at,
            connect_mode: this.data.connectMode,
          },
          (connectMode) => {
            // 执行同意回调
            this.agreeInvite(connectMode);
          },
          () => {
            // 执行拒绝回调
          }
        );
      },

      // ========= auto start =========
      connectBeforeEffect: async (resolve, reject) => {
        // 渲染布局
        try {
          await this.layoutManager.updatePlayerList();
        } catch (error) {
          reject();
        }

        // 获取连麦connectToken
        try {
          this.data.connectToken = await this.httpManager.getConnectToken();
        } catch (error) {
          // TODO:retry
          reject();
        }

        // 初始化麦克风、摄像头状态
        let enableCamera = this.data.connectMode === CONNECT_MODE.VIDEO ? 1 : 0;
        let enableMic = 1;

        // 连麦中，重进同步麦克风、摄像头状态
        if (this.data.connectState === CONNECT_STATE.LINKING) {
          enableCamera = this.data.cameraOn;
          enableMic = this.data.micOn;
        }

        try {
          this.data.connectBaseInfo = await this.httpManager.getConnectBaseInfo(
            this.data.connectMode,
            this.data.connectToken
          );

          this.data.teacherRoomId = "" + this.data.connectBaseInfo.roomId;
        } catch (error) {
          // TODO:retry
          reject();
        }

        // 初始化RTC进房推流
        try {
          await this.rtcManager.initRtc(this.data.connectBaseInfo);
        } catch (error) {}

        // 启动RTC管理器事件监听
        this.rtcEventListener();

        // 加入讲师群聊
        this.joinTeacherGroup(this.data.teacherRoomId);

        try {
          await this.httpManager.joinLive(
            enableCamera,
            enableMic,
            this.#isInterJump
          );
          this.props?.onSuccessJoinLive();
        } catch (error) {}

        resolve();
      },
      connectAfterEffect: async () => {
        // 更新连麦布局
        await this.layoutManager.updatePlayerList();

        // 启动在线讲师列表定时器轮询
        this.layoutManager.pollPlayerList();

        // 移除RTC事件监听
        this.removeRtcEventListener();
      },
      // ========= auto end =========
    });
  }

  initTimEventListener() {
    // this.imManager.on("AGREE_APPLY", (msg) => {
    //   if (msg.to_user_id !== this.props.userId) return;
    //   this.agreedConnect(msg);
    // });
  }

  // 获取当前连麦状态
  getConnectState() {
    this.httpManager
      .getConnectState()
      .then((res) => {
        if (res.code === 0) {
          const { switch: connect_switch, user_state } = res.data;
          const { camera_on, mic_on } = user_state;
          this.data.connectSwitch = connect_switch === 1;
          this.data.micOn = mic_on;
          this.data.cameraOn = camera_on;
          this.asyncConnectState(res.data.user_state);
        }
      })
      .catch((error) => {});
  }

  // 同步用户连麦状态
  asyncConnectState(userState) {
    const { connect_type, connect_state, connect_mode, timeout, invited_at } =
      userState;

    this.data.connectState = connect_state;

    switch (connect_state) {
      case CONNECT_STATE_CODE.PROGRESS:
        // 接收连麦邀请
        if (connect_type === 2) {
          this.inviteConnect({ connect_mode, timeout, invited_at });
        } else {
          // 申请连麦
          this.applyConnect(connect_mode);
        }
        break;
      case CONNECT_STATE_CODE.WAITING:
      case CONNECT_STATE_CODE.LINKING:
        // 重进恢复连麦
        this.recoverConnect();
        break;
      case CONNECT_STATE_CODE.UNLINKED:
        break;
      default:
        break;
    }
  }

  // 同意讲师连麦邀请
  agreeInvite(connectMode) {
    this.httpManager.agreeInvite();
    // 同步连麦模式
    this.changeConnectMode(connectMode);

    setTimeout(() => {
      this.fsm[ACTION_TYPE.AGREEDINVITE]();
    }, 1000);
  }

  // ========= 暴露外部API =========
  // ========= 用户申请正向链路 start =========
  // 申请连麦
  applyConnect(connectMode) {
    this.changeConnectMode(connectMode);
    this.#fsm[ACTION_TYPE.APPLY]();
  }

  // 接收讲师同意连麦申请
  agreedConnect() {
    this.fsm[ACTION_TYPE.AGREED]();
  }

  inviteConnect({ connect_mode: connectMode, timeout, invited_at }) {
    this.#inviteMsg = { timeout, invited_at };
    this.changeConnectMode(connectMode);
    this.fsm[ACTION_TYPE.INVITE]();
  }

  recoverConnect() {}

  // 轮询连麦状态定时器
  pollConnectState(total = 6, time = 10000, condition = true) {
    clearInterval(this.#connectStateTimer);

    let count = 1;

    this.#connectStateTimer = setInterval(() => {
      count++;
      if (count >= total || condition) {
        this.clearPollConnectState();
        count = 1;
        return;
      }

      this.getConnectState();
    }, time);
  }

  clearPollConnectState() {
    clearInterval(this.#connectStateTimer);
    this.#connectStateTimer = null;
  }

  // ========= TIM进房逻辑 =========
  joinTeacherGroup(roomId) {
    if (typeof roomId !== "string") throw new Error("连麦讲师房id需为字符串");
    this.imManager.joinGroup(roomId);
  }

  quitTeacherGroup(roomId) {
    if (typeof roomId !== "string") throw new Error("连麦讲师房id需为字符串");
    this.imManager.quitGroup(roomId);
  }

  // ========= RTC初始化异常重试逻辑 =========
  rtcEventListener() {
    this.rtcManager.on(START_PUSHER_ERROR, () => {});
  }

  removeRtcEventListener() {}

  // ========= utils =========
  // 是否自己的userId
  isSelfUserId(userId) {
    return this.props.userId === userId;
  }

  // 更新连麦模式
  changeConnectMode(connectMode) {
    this.data.connectMode = connectMode ?? this.data.connectMode;
  }

  // 重置业务
  resetData() {
    this.data = Object.assign(this.data, {
      connectState: CONNECT_STATE.UNLINKED,
      connectMode: CONNECT_MODE.VIDEO,
      connectToken: "",
      connectBaseInfo: {},
      teacherRoomId: "",
      cameraOn: 0,
      micOn: 0,
    });
  }

  // 销毁
  destroy() {}
}

export default Voice;
