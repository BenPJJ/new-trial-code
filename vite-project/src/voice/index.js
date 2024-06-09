import FSM, { CONNECT_STATE, ACTION_TYPE } from "./stateMachine";
import Http from "../manager/http";
import layoutIns, {
  DEVICE_TYPE,
  RENDERING_VOICE_LAYOUT,
} from "../manager/layout";
import deviceIns from "../manager/device";

import {
  CONNECT_MODE,
  CONNECT_STATE_CODE,
  BUSINESS_CODE,
  PLATFORM,
  BACKGROUND_COLOR_INIT,
  BACKGROUND_COLOR_MAP,
  UPDATE_RTC_PLAYER_LIST,
} from "../constant/index";
import * as VOICE_TOAST_TEXT from "../constant/toast";

import logIns from "../log/index";
import voiceMonitorIns from "../log/voiceMonitor";
import EventEmitter from "../libs/eventEmitter";
import { uuidVariableLength } from "../utils/index";

// 对外常量
export const VOICE_CONSTANT = {
  RENDERING_VOICE_LAYOUT,
  CONNECT_STATE,
  CONNECT_MODE,
  VOICE_TOAST_TEXT,
  UPDATE_RTC_PLAYER_LIST,
};

// 外部上报
export const voiceReport = {
  sendReport: logIns.sendReport,
  addTrackReport: logIns.addTrackReport,
  voiceMonitor: voiceMonitorIns,
};

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
  ACTION_TYPE.ENDCONNECT,
  ACTION_TYPE.ENDALIVE,
  ACTION_TYPE.FORBIDS,
  ACTION_TYPE.REJECTAUTHORIZATION,
  ACTION_TYPE.LINKINGFAILED,
  ACTION_TYPE.CANCELRETRY,
  ACTION_TYPE.INVITE,
];

class Voice extends EventEmitter {
  // ========= 公有数据 =========
  props = {};
  data = {};

  // ========= 私有数据 =========
  #fsm = null; // 状态机
  #httpManager = null;
  #layoutManager = null;
  #rtcManager = null;
  #deviceManager = null;
  #imManager = null;

  #connectStateCode = 0; // 接口连麦状态
  #connectBaseInfo = {}; // 连麦基础信息
  #inviteMsg = null; // 邀请连麦msg
  #connectStateTimer = null; // 连麦状态定时器
  #isInitialSdk = false; // 是否执行了sdk初始化
  #connectBackgroundValue = ""; // 连麦背景值
  #voiceUniqueId = ""; // 连麦sdk初始化唯一标识
  #autoConnectProcess = ""; // 启动连麦上台进程

  constructor() {
    super();

    this.data = {
      connectState: CONNECT_STATE.UNLINKED, // 连麦状态
      connectMode: CONNECT_MODE.VIDEO, // 连麦模式
      connectSwitch: false, // 连麦开关
      connectBackgroundStyle: "", // 连麦背景样式
    };
  }

  // 获取全局连麦sdk数据，包含主模块voice、子模块layout、rtc、device
  getVoiceSdkModelData() {
    return {
      ...this.data,
      ...layoutIns.getModelData(),
    };
  }

  init(props = {}) {
    if (this.#isInitialSdk) return new Error("Already initialized");

    this.#isInitialSdk = true;

    this.props = props;

    const {
      app_id,
      alive_id,
      user_id,
      user_type,
      role_type,
      alive_mode,
      wx_avatar,
      wx_nickname,
      universal_union_id,
      platform,
      kpi_client,
    } = this.props;

    this.#voiceUniqueId = uuidVariableLength();

    // 初始化日志
    logIns.init({
      options: {
        app_id,
        alive_id,
        user_id,
        user_type,
        alive_mode,
        kpi_client,
        platform,
        universal_union_id,
      },
      request: this.props.request,
    });

    // 初始化http
    this.#httpManager = new Http({
      options: {
        app_id,
        alive_id,
        user_id,
        user_type,
        role_type,
        alive_mode,
        wx_avatar,
        wx_nickname,
        universal_union_id,
        platform,
        request_unique_id: this.#voiceUniqueId,
      },
      request: this.props.request,
    });

    // 初始化im
    this.#imManager = this.props.imSdk;

    // 初始化layout
    this.#layoutManager = layoutIns;
    this.#layoutManager.init({
      options: {
        app_id,
        alive_id,
        user_id,
        user_type,
        alive_mode,
      },
      http: this.#httpManager,
    });
    this.#layoutManager.on("updateData", (data) => {
      this.props?.updateData?.(data);
    });
    this.#layoutManager.on(RENDERING_VOICE_LAYOUT, (callback) => {
      this.emit(RENDERING_VOICE_LAYOUT, callback);
    });

    // 初始化device
    this.#deviceManager = deviceIns;
    this.#deviceManager.on("devicechange", () => {
      this.#rtcManager.getDeviceList();
    });

    // 初始化rtc
    this.#rtcManager = this.props.rtcSdk;
    this.#rtcManager.setCommonReport(logIns.sendReport.bind(logIns));
    this.#rtcManager.on("updateData", (data) => {
      this.props?.updateData?.(data);
    });
    // 更新连麦布局
    this.#rtcManager.on("updateTrtcPlayerList", (event) => {
      this.#layoutManager.updatePlayerList();

      this.emit(UPDATE_RTC_PLAYER_LIST, event);
    });

    // 初始化状态机
    this.#initFsm();

    // 注册Tim 监听事件
    this.#initImEventListener();

    // 查询用户连麦状态
    this.#getConnectState();
  }

  #initFsm() {
    this.#fsm = new FSM({
      // ========= 全局状态变更 start =========
      // 状态变更前
      transitionBeforeEffect: async (resolve, reject, lifecycle) => {
        logIns.sendFsmReport({
          api_name: lifecycle.transition,
          current_state: this.#fsm?.state,
          api_msg: "transitionBefore",
        });

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
          const networkInfo = this.#deviceManager.getNetworkState();
          const rtcNetworkInfo = this.#rtcManager.getNetworkState();
          sendFsmReport({
            params: {
              network_info: networkInfo,
              rtc_network_info: rtcNetworkInfo,
              api_msg: "设备网络信息",
            },
          });
        } catch (error) {}

        try {
          await this.#deviceManager.checkNetworkState();
        } catch (error) {
          this.#handleTransitionBeforeFail(lifecycle.transition, {
            errorType: "networkOnlineState",
            error,
          });
          reject();
          return;
        }

        // 校验IM在线状态
        try {
          await this.#imManager.checkOnlineState();
        } catch (error) {
          this.#handleTransitionBeforeFail(lifecycle.transition, {
            errorType: "imOnlineState",
            error,
          });
          reject();
          return;
        }

        // 检测设备授权状态
        try {
          await this.#deviceManager.getDevicePermission({
            video: true,
          });
        } catch (error) {
          if (error.name === "NotAllowedError") {
            this.#handleTransitionBeforeFail(lifecycle.transition, {
              errorType: "devicePermission",
              deviceType: "video",
              error,
            });
            reject();
            return;
          }
        }

        try {
          await this.#deviceManager.getDevicePermission({
            audio: true,
          });
        } catch (error) {
          if (error.name === "NotAllowedError") {
            this.#handleTransitionBeforeFail(lifecycle.transition, {
              errorType: "devicePermission",
              deviceType: "audio",
              error,
            });
            reject();
            return;
          }
        }

        this.#deviceManager.listenerDeviceChange();
        await this.#rtcManager.getDeviceList();

        resolve();
      },
      // 状态变更后
      transitionAfterEffect: (lifecycle) => {
        logIns.sendFsmReport({
          api_name: lifecycle.transition,
          current_state: this.#fsm?.state,
          api_msg: "transitionAfter",
        });
        // 同步状态
        this.data.connectState = this.#fsm.state;
        this.#updateData({
          connectState: this.data.connectState,
        });
      },
      // 状态流转未执行完成，禁止触发其他状态流转
      pendingTransition: (error) => {
        logIns.sendFsmReport({
          api_name: error.transition,
          current_state: this.#fsm?.state,
          api_msg: "pendingTransition",
          error_msg: error,
        });
      },
      // 状态流转规则未被定义
      invalidTransition: (error) => {
        logIns.sendFsmReport({
          api_name: error.transition,
          current_state: this.#fsm?.state,
          api_msg: "invalidTransition",
          error_msg: error,
        });
      },
      // ========= 全局状态变更 end =========

      // ========= 用户申请正向链路 start =========
      // 申请连麦
      applyBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .applyConnect(this.data.connectMode)
          .then((res) => {
            // 申请连麦兜底，连麦状态非申请中、未连麦，停止轮训
            const condition =
              this.data.connectState !== CONNECT_STATE.APPLYING &&
              this.data.connectState !== CONNECT_STATE.UNLINKED;
            this.#pollConnectState(6, 10000, condition);
            resolve();

            this.props?.onApplyConnect?.(this.handleBeforeResponse());
            resolve();
          })
          .catch((error) => {
            reject();

            // 重置数据
            this.#resetData();

            this.props?.onApplyConnect?.(
              this.handleBeforeResponse(BUSINESS_CODE.FAIL, error)
            );
          });
      },
      // 代理申请连麦
      proxyApplyBeforeEffect: (resolve, reject) => {
        resolve();
        this.props?.onApplyConnect?.(this.handleBeforeResponse());
      },
      // 接收讲师同意连麦申请
      agreedBeforeEffect: (resolve) => {
        // 清除连麦状态轮询定时器
        this.#stopPollConnectState();

        resolve();

        this.props?.onAgreedConnect?.(this.handleBeforeResponse());
      },
      agreedAfterEffect: () => {
        this.#fsm[ACTION_TYPE.CONNECT]();

        this.props?.onAgreedConnect?.(this.handleAfterResponse());
      },
      // ========= 用户申请正向链路 end =========

      // ========= 用户回退事件链路 start =========
      // 拒绝授权
      rejectAuthorizationBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .quitLive(this.props.user_id)
          .then((res) => {
            resolve();

            this.#resetData();
            this.props?.onRejectAuthorization?.(this.handleBeforeResponse());
          })
          .catch((error) => {
            reject();

            this.props?.onRejectAuthorization?.(
              this.handleBeforeResponse(BUSINESS_CODE.FAIL, error)
            );
          });
      },
      // 取消申请
      cancelApplyBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .cancelApplyConnect()
          .then(() => {
            resolve();

            this.#stopPollConnectState();
            this.#resetData();

            this.props?.onCancelApplyConnect?.(this.handleBeforeResponse());
          })
          .catch((error) => {
            reject();

            this.props?.onCancelApplyConnect?.(
              this.handleBeforeResponse(BUSINESS_CODE.FAIL, error)
            );
          });
      },
      // 拒绝连麦邀请
      rejectInviteBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .rejectInviteConnect(this.#inviteMsg.from_user_id)
          .then((res) => {
            resolve();

            this.#resetData();

            this.props?.onRejectInviteConnect?.(this.handleBeforeResponse());
          })
          .catch((error) => {
            reject();

            this.props?.onRejectInviteConnect?.(
              this.handleBeforeResponse(BUSINESS_CODE.FAIL, error)
            );
          });
      },
      // 同意连麦超时
      applyingTimeoutAfterEffect: () => {
        this.#resetData();

        this.props?.onWaitingConnect?.(
          this.handleAfterResponse(BUSINESS_CODE.AGREED_APPLY_CONNECT_TIMEOUT)
        );
      },
      // 邀请连麦超时
      inviteTimeoutAfterEffect: () => {
        this.#resetData();

        this.props?.onWaitingConnect?.(
          this.handleAfterResponse(BUSINESS_CODE.INVITE_CONNECT_TIMEOUT)
        );
      },
      // 等待接通中超时
      waitingTimeoutAfterEffect: () => {
        this.#resetData();

        this.props?.onWaitingConnect?.(
          this.handleAfterResponse(BUSINESS_CODE.WAITING_CONNECT_TIMEOUT)
        );
      },
      // 结束连麦
      endConnectBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .quitLive()
          .then((res) => {
            resolve();

            this.#layoutManager.stopPollPlayerList();

            this.props?.onEndConnect?.(
              this.handleBeforeResponse(BUSINESS_CODE.SUCCESS)
            );
          })
          .catch((error) => {
            reject();

            this.props?.onEndConnect?.(
              this.handleBeforeResponse(BUSINESS_CODE.FAIL, error)
            );
          });
      },
      endConnectAfterEffect: () => {
        this.#rtcManager.exitRoom();
        this.#quitTeacherGroup(this.#connectBaseInfo.wy_roomid);

        this.props?.onSwitchMedialEl?.(false);

        this.#resetData();
      },
      // 个人禁言
      forbidsBeforeEffect: (resolve, reject) => {
        // TODO:目前看客户端调用禁言接口，会下发quitLive im，需要待测试小程序推流端情况
        // if (this.isLinkingConnect) {
        //   this.#httpManager
        //     .quitLive()
        //     .then(() => {
        //       resolve();
        //       this.props?.onPersonForbids(this.handleBeforeResponse());
        //     })
        //     .catch(() => {
        //       reject();
        //       this.props?.onPersonForbids(
        //         this.handleBeforeResponse(BUSINESS_CODE.FAIL)
        //       );
        //     });
        // } else {
        //   resolve();
        //   this.props?.onPersonForbids(this.handleBeforeResponse());
        // }
        this.props?.onPersonForbids?.(this.handleBeforeResponse());
        resolve();
      },
      // ========= 用户回退事件链路 end =========

      // ========= 讲师邀请正向链路 start =========
      // 邀请连麦
      inviteBeforeEffect: (resolve) => {
        resolve();

        this.props?.onInviteConnect?.(this.handleBeforeResponse());
      },
      inviteAfterEffect: () => {
        const { timeout } = this.#inviteMsg;

        this.props?.onInviteConnect?.(
          this.handleAfterResponse(BUSINESS_CODE.SUCCESS, {
            timeout: timeout / 1000,
          })
        );
      },
      // 同意连麦邀请
      agreedInviteBeforeEffect: (resolve, reject) => {
        this.#httpManager.agreeInvite();

        resolve();

        this.props?.onAgreedInviteConnect?.(this.handleBeforeResponse());
      },
      agreedInviteAfterEffect: () => {
        setTimeout(() => {
          this.#fsm[ACTION_TYPE.CONNECT]();
        }, 1000);

        this.props?.onAgreedInviteConnect?.(this.handleAfterResponse());
      },
      // ========= 讲师邀请正向链路 end =========

      // ========= 讲师回退事件链路 start =========
      // 关闭连麦开关
      closeSwitchConnectBeforeEffect: (resolve) => {
        resolve();

        this.#resetData();

        this.#stopPollConnectState();
      },
      // 取消邀请连麦
      cancelInviteAfterEffect: () => {
        this.#resetData();
        this.props?.onCancelInviteConnect?.(this.handleAfterResponse());
      },
      // 取消等待接通中连麦
      cancelInviteWaitingBeforeEffect: (resolve, reject) => {
        this.#httpManager
          .quitLive()
          .then((res) => {
            resolve();

            this.props?.onCancelInviteConnect?.(this.handleBeforeResponse());
          })
          .catch((error) => {
            reject();

            this.props?.onCancelInviteConnect?.(this.handleBeforeResponse());
          });
      },
      cancelInviteWaitingAfterEffect: () => {
        // TODO：清除启动进程
        this.#resetData();

        this.props?.onSwitchMedialEl?.(false);
      },
      // 中断连麦（等待、连接中）
      cancelLinkingAfterEffect: () => {
        // TODO：清除启动进程
        this.#rtcManager.exitRoom();
        this.#quitTeacherGroup(this.#connectBaseInfo.wy_roomid);
        this.#resetData();

        this.props?.onCancelConnect?.();
        this.props?.onSwitchMedialEl?.(false);

        logIns.sendFsmReport({
          params: {
            current_state: this.data.connectState,
            api_msg: "讲师取消连麦",
          },
        });
      },
      // TODO：1
      // 暂停直播
      stopAliveAfterEffect: () => {
        this.#resetData();

        // TODO:清除启动进程

        this.props?.onStopAlive?.(this.handleAfterResponse());
        this.props?.onSwitchMedialEl?.(false);

        logIns.sendFsmReport({
          params: {
            current_state: this.data.connectState,
            api_msg: "讲师暂停直播",
          },
        });
      },
      // 结束直播
      endAliveAfterEffect: () => {
        this.#resetData();

        // TODO:清除启动进程

        this.props?.onEndAlive?.(
          this.handleAfterResponse(BUSINESS_CODE.SUCCESS, { alive_status: 3 })
        );
        this.props?.onSwitchMedialEl?.(false);

        logIns.sendFsmReport({
          params: {
            current_state: this.data.connectState,
            api_msg: "讲师结束直播",
          },
        });
      },
      // ========= 讲师回退事件链路 end =========

      // ========= auto start =========
      connectBeforeEffect: async (resolve, reject) => {
        this.#autoConnectProcess = reject;

        // 渲染布局
        try {
          await this.#layoutManager.updatePlayerList({ needCallback: true });
        } catch (error) {
          // reject();
        }

        // 初始化麦克风、摄像头状态
        let cameraOn = this.data.connectMode === CONNECT_MODE.VIDEO ? 1 : 0;
        let micOn = 1;

        // 连麦中，重进同步麦克风、摄像头状态
        if (this.#connectStateCode === CONNECT_STATE_CODE.LINKING) {
          cameraOn =
            this.#layoutManager.getData("pusherInfo")?.camera_on ?? cameraOn;
          micOn = this.#layoutManager.getData("pusherInfo")?.mic_on ?? micOn;
        }

        try {
          this.#connectBaseInfo = await this.#httpManager.getConnectBaseInfo(
            this.data.connectMode
          );

          this.#changeBackground(this.#connectBaseInfo?.current_back_ground);
        } catch (error) {
          // TODO:retry
          reject();
        }

        // 初始化RTC进房推流
        try {
          const {
            wy_roomid,
            sdk_app_id,
            user_id,
            user_sign,
            trtc_pc_sdk_app_id,
            trtc_pc_sign,
          } = this.#connectBaseInfo;

          let sdkAppId, userSig;

          if (this.props.platform === PLATFORM.XE_LIVE_CLIENT) {
            sdkAppId = +trtc_pc_sdk_app_id;
            userSig = trtc_pc_sign;
          } else if (this.props.platform === PLATFORM.E_LIVE) {
            sdkAppId = +sdk_app_id;
            userSig = user_sign;
          }

          await this.#rtcManager.enterRoom({
            roomId: +wy_roomid,
            sdkAppId,
            userId: user_id,
            userSig,
          });

        } catch (error) {}

        // 初始化设备
        try {
          await this.#rtcManager.toggleCaptureCamera(cameraOn);
        } catch (error) {
          // 首次打开采集失败，如果是占用场景直接给关掉
          if (error.extraCode === 5303) {
            this.#handleTransitionBeforeFail(ACTION_TYPE.CONNECT, {
              errorType: "deviceOccupied",
              deviceType: "video",
              error,
            });
            cameraOn = false;
          }
        }
        await this.#rtcManager.toggleCaptureMic(true); // 先开采集
        this.#rtcManager.toggleMuteMic(!micOn); // 再判断那是否走静音帧

        // 加入讲师群聊
        this.#joinTeacherGroup(this.#connectBaseInfo.wy_roomid);

        try {
          await this.#httpManager.joinLive(cameraOn, micOn);
          this.props?.onSuccessJoinLive?.();
        } catch (error) {}

        resolve();
      },
      connectAfterEffect: async () => {
        // 更新连麦布局
        await this.#layoutManager.updatePlayerList();

        // 启动在线讲师列表定时器轮询
        this.#layoutManager.pollPlayerList();

        this.props?.onSwitchMedialEl?.(true);
        this.props?.onLinkingConnect?.(this.handleAfterResponse());
      },
      recoverConnectAfterEffect: () => {
        this.#fsm[ACTION_TYPE.CONNECT]();
      },
      // ========= auto end =========
    });
  }

  #initImEventListener() {
    this.#imManager.on("agree_apply", (msg) => {
      if (msg.to_user_id !== this.props.user_id) return;
      this.#agreedConnect(msg);
    });

    this.#imManager.on("invite_connect", (msg) => {
      if (msg.to_user_id !== this.props.user_id) return;
      this.#inviteConnect(msg);
    });

    this.#imManager.on("quitLive", (msg) => {
      // 被人操作结束别人的连麦 || 自己操作结束连麦
      if (
        msg.targetUserId !== this.props.user_id ||
        msg?.operatorUserId === msg.targetUserId
      )
        return;
      this.#interruptConnect(msg);
    });

    this.#imManager.on("connect_switch", (msg) => {
      this.#switchConnect(msg);
    });

    // 个人禁言
    this.#imManager.on("forbid_user_info", this.#personForbids.bind(this));

    // 解除个人禁言
    this.#imManager.on(
      "cancel_forbid_user",
      this.#relievePersonForbids.bind(this)
    );

    // 结束直播
    this.#imManager.on("stop_alive", (msg) => {
      this.#endAlive(msg);
    });

    // 暂停直播
    this.#imManager.on("onCustomGroupNotify", (msg) => {
      this.#stopAlive(msg);
    });

    this.#imManager.on("background_change", (msg) => {
      this.#changeBackground(msg);
    });

    // ------ 讲师群IM ------
    this.#imManager.on(
      "switchOthersCamera",
      this.#passiveSwitchCameraByIm.bind(this)
    );

    this.#imManager.on(
      "switchOthersMic",
      this.#passiveSwitchMicByIm.bind(this)
    );

    this.#imManager.on("updateOnlineList", () => {
      this.#layoutManager.updatePlayerList();
    });

    this.#imManager.on("timeout_connect", (msg) => {
      if (msg.to_user_id !== this.props.user_id) return;
      this.#timeoutConnect();
    });
  }

  // 获取当前连麦状态
  #getConnectState({ switchPlatform = false } = {}) {
    this.#httpManager
      .getConnectState()
      .then((data) => {
        const {
          switch: connect_switch,
          user_state,
          platform,
          request_unique_id,
        } = data;
        const { camera_on, mic_on, connect_state, on_stage } = user_state;
        this.data.connectSwitch = connect_switch === 1;
        this.#connectStateCode = connect_state;
        // 同步设备数据
        this.#layoutManager.updatePusherInfo({ mic_on, camera_on });
        this.#updateData({ connectSwitch: this.data.connectSwitch });

        // 查询是否多终端连麦
        const isSwitchPlatform = this.#checkRemoveUser({
          connect_state,
          on_stage,
          platform,
          switchPlatform,
          request_unique_id,
        });

        if (isSwitchPlatform) return;

        this.#asyncConnectState(data.user_state);
      })
      .catch((error) => {
        logIns.sendReport({});
      });
  }

  // 同步用户连麦状态
  #asyncConnectState(userState) {
    const { connect_type, connect_state, connect_mode, time_out, invited_at } =
      userState;

    switch (connect_state) {
      case CONNECT_STATE_CODE.PROGRESS:
        // 接收连麦邀请
        if (connect_type === 2) {
          this.#inviteConnect({
            connect_mode,
            timeout: time_out * 1000,
            invited_at,
          });
        } else {
          // 代理申请连麦
          this.#proxyApplyConnect(connect_mode);
        }
        break;
      case CONNECT_STATE_CODE.WAITING:
      case CONNECT_STATE_CODE.LINKING:
        // 重进恢复连麦
        this.#recoverConnect(connect_mode);
        break;
      case CONNECT_STATE_CODE.UNLINKED:
        break;
      default:
        break;
    }
  }

  // 检查多端登陆连麦踢人
  #checkRemoveUser({
    connect_state,
    on_stage,
    platform,
    switchPlatform,
    request_unique_id,
  }) {
    if (
      connect_state === CONNECT_STATE_CODE.LINKING &&
      on_stage === 1 &&
      request_unique_id !== this.#voiceUniqueId &&
      !switchPlatform
    ) {
      this.props?.onRemoveUser();
      return true;
    }

    return false;
  }

  // 更新连麦模式
  #changeConnectMode(connectMode) {
    this.data.connectMode = connectMode ?? this.data.connectMode;
    this.#updateData({ connectMode: this.data.connectMode });
  }

  // 更新响应数据
  #updateData(data = {}) {
    this.props?.updateData(data);
  }

  // 恢复连麦
  #recoverConnect(connectMode) {
    this.#changeConnectMode(connectMode);

    this.#fsm[ACTION_TYPE.RECOVERCONNECT]();
  }

  // ========= 处理IM事件 start =========
  // 超时处理
  #timeoutConnect() {
    switch (this.data.connectState) {
      case CONNECT_STATE.APPLYING:
        // 同意连麦申请，卡设备授权，等待接通中超时
        this.#fsm[ACTION_TYPE.APPLYINGTIMEOUT]();
        break;
      case CONNECT_STATE.INVITING:
        // 邀请连麦超时
        this.#fsm[ACTION_TYPE.INVITETIMEOUT]();
        break;
      case CONNECT_STATE.WAITING:
        // 等待接通中超时
        setTimeout(() => {
          this.#fsm[ACTION_TYPE.WAITINGTIMEOUT]();
        }, 1000);
        break;
      default:
        break;
    }
  }

  // 中断连麦
  #interruptConnect() {
    switch (this.data.connectState) {
      case CONNECT_STATE.INVITING:
        // 邀请中
        this.#fsm[ACTION_TYPE.CANCELINVITE]();
        break;
      case CONNECT_STATE.WAITING:
      case CONNECT_STATE.LINKING:
        this.#fsm[ACTION_TYPE.CANCELLINKING]();
        break;
      default:
        break;
    }
  }

  // 个人禁言
  #personForbids(msg) {
    if (msg.user_id !== this.props.user_id) return;
    this.#fsm[ACTION_TYPE.FORBIDS]();
  }

  // 解除个人禁言
  #relievePersonForbids(msg) {
    if (msg.user_id !== this.props.user_id) return;
  }

  // 接收讲师同意连麦申请
  #agreedConnect() {
    this.#fsm[ACTION_TYPE.AGREED]();
  }

  #proxyApplyConnect(connectMode) {
    this.#changeConnectMode(connectMode);
    this.#fsm[ACTION_TYPE.PROXYAPPLY]();
  }

  #inviteConnect(msg) {
    const { connect_mode, timeout, invited_at, from_user_id } = msg;
    this.#inviteMsg = { timeout, invited_at, from_user_id };
    this.#changeConnectMode(connect_mode);

    this.#fsm[ACTION_TYPE.INVITE]();
  }

  #switchConnect(msg) {
    this.data.connectSwitch = !!msg.switch;

    this.#updateData({ connectSwitch: this.data.connectSwitch });

    // off 连麦开关 && 非连麦中，重置连麦状态
    if (
      !this.data.connectSwitch &&
      this.data.connectState !== CONNECT_STATE.LINKING
    ) {
      this.#fsm[ACTION_TYPE.CLOSESWITCHCONNECT]();
    }

    this.props?.onSwitchConnect({ data: { state: msg.switch } });
  }

  #changeBackground(msg) {
    // 删除操作不处理
    if (!msg || (msg && parseInt(msg.operation_type) === 2)) return;

    const type = parseInt(msg.background_type) || 2;
    let value;

    if (Reflect.has(msg, "background_value")) {
      value = msg.background_value || BACKGROUND_COLOR_INIT;
    } else {
      value = type === 2 ? msg.background_color : msg.background_image;
    }

    if (this.#connectBackgroundValue === value) return;

    this.#connectBackgroundValue = value;

    // 1-背景图 2-背景色
    this.data.connectBackgroundStyle =
      type === 2
        ? `background:${BACKGROUND_COLOR_MAP[value]};`
        : `background:url(${value}) no-repeat;background-size:100% 100%;`;

    this.#updateData({
      connectBackgroundStyle: this.data.connectBackgroundStyle,
    });
  }

  #stopAlive(msg) {
    if (this.data.connectState === CONNECT_STATE.UNLINKED) return;

    // state : 0: 暂停直播 1 直播中 2 互动阶段未推流  3 结束直播
    const state = Math.floor(msg.UserDefinedField || msg.userDefinedField);

    if (state === 0) {
      this.#fsm[ACTION_TYPE.STOPALIVE]();
    }
  }

  #endAlive() {
    if (this.data.connectState === CONNECT_STATE.UNLINKED) return;

    this.#fsm[ACTION_TYPE.ENDALIVE]();
  }

  #passiveSwitchCameraByIm(msg) {
    if (msg.targetTeacherId !== this.props.user_id) return;
    if (msg.cameraOn) {
      // 邀请开
      this.props?.onInviteOpenDevice("camera", msg.targetTeacherId);
    } else {
      this.#switchCameraDevice(msg.cameraOn, msg.targetTeacherId);
    }
  }

  #passiveSwitchMicByIm(msg) {
    if (msg.targetTeacherId !== this.props.user_id) return;

    if (msg.micOn) {
      // 邀请开
      this.props?.onInviteOpenDevice("mic", msg.targetTeacherId);
    } else {
      this.#switchMicDevice(msg.micOn, msg.targetTeacherId);
    }
  }
  // ========= 处理IM事件 end =========

  // ========= 设备操作 start =========
  async #switchCameraDevice(targetState, operateUser) {
    // TODO:暂兜底，目前鹅直播小程序竖屏操作学员设备，只发送IM，未请求设备接口，容易造成设备状态不一致
    await this.#layoutManager
      .switchDevice(DEVICE_TYPE.CAMERA, targetState, operateUser)
      .then(async () => {
        await this.#rtcManager.toggleCaptureCamera(targetState);
        this.#layoutManager.updatePusherInfo({ camera_on: targetState });
      });
  }
  async #switchMicDevice(targetState, operateUser) {
    // TODO:暂兜底，目前鹅直播小程序竖屏操作学员设备，只发送IM，未请求设备接口，容易造成设备状态不一致
    await this.#layoutManager
      .switchDevice(DEVICE_TYPE.MIC, targetState, operateUser)
      .then(async () => {
        await this.#rtcManager.toggleMuteMic(true);
        this.#layoutManager.updatePusherInfo({ mic_on: targetState });
      });
  }
  // ========= 设备操作 end =========

  // ========= TIM进房逻辑 start =========
  #joinTeacherGroup(roomId) {
    if (typeof roomId !== "string") throw new Error("连麦讲师房id需为字符串");
    this.#imManager.joinSingleGroup(roomId);
  }

  #quitTeacherGroup(roomId) {
    if (typeof roomId !== "string") throw new Error("连麦讲师房id需为字符串");
    this.#imManager.quitGroup(roomId);
  }
  // ========= TIM进房逻辑 end =========

  // ========= 连麦兜底保障 start =========
  // 轮询连麦状态定时器
  #pollConnectState(total = 6, time = 10000, condition = true) {
    clearInterval(this.#connectStateTimer);

    let count = 0;

    this.#connectStateTimer = setInterval(() => {
      count++;
      if (count >= total || condition) {
        this.#stopPollConnectState();
        count = 0;
        return;
      }

      this.#getConnectState();
    }, time);
  }

  #stopPollConnectState() {
    if (!this.#connectStateTimer) return;
    clearInterval(this.#connectStateTimer);
    this.#connectStateTimer = null;
  }
  // ========= 连麦兜底保障 end =========

  // ========= 状态流程处理结果 start =========
  // 处理前置状态流转
  #handleTransitionBeforeFail(transition, data) {
    switch (transition) {
      case ACTION_TYPE.APPLY:
      case ACTION_TYPE.PROXYAPPLY:
        if (data.errorType === "networkOnlineState") {
          this.props?.onApplyConnect(
            this.handleBeforeResponse(BUSINESS_CODE.NETWORK_DISCONNECTION, data)
          );
        }

        if (data.errorType === "imOnlineState") {
          this.props?.onApplyConnect(
            this.handleBeforeResponse(BUSINESS_CODE.IM_OFF_LIVE, data)
          );
        }

        if (data.errorType === "devicePermission") {
          this.props?.onApplyConnect(
            this.handleBeforeResponse(BUSINESS_CODE.DEVICE_UNAUTHORIZED, data)
          );
        }
        break;
      case ACTION_TYPE.AGREED:
      case ACTION_TYPE.INVITE:
      case ACTION_TYPE.AGREEDINVITE:
      case ACTION_TYPE.RECOVERCONNECT:
      case ACTION_TYPE.CONNECT:
        if (data.errorType === "networkOnlineState") {
          this.props?.onLinkingConnect(
            this.handleBeforeResponse(BUSINESS_CODE.NETWORK_DISCONNECTION, data)
          );
        }

        if (data.errorType === "imOnlineState") {
          this.props?.onLinkingConnect(
            this.handleBeforeResponse(BUSINESS_CODE.IM_OFF_LIVE, data)
          );
        }

        if (data.errorType === "devicePermission") {
          this.props?.onLinkingConnect(
            this.handleBeforeResponse(BUSINESS_CODE.DEVICE_UNAUTHORIZED, data)
          );
        }

        if (data.errorType === "deviceOccupied") {
          this.props?.onApplyConnect(
            this.handleBeforeResponse(BUSINESS_CODE.DEVICE_OCCUPY, data)
          );
        }
        break;
      default:
        break;
    }
  }
  // 重置业务
  #resetData() {
    this.data = Object.assign(this.data, {
      connectState: CONNECT_STATE.UNLINKED,
      connectMode: CONNECT_MODE.VIDEO,
    });

    this.#inviteMsg = null;
    this.#autoConnectProcess = null;
  }
  // ========= 状态流程处理结果 end =========

  // ========= utils start =========
  // 是否已经初始化sdk
  get isAlreadyInitialSdk() {
    return this.#isInitialSdk;
  }

  get isUnlinkedConnect() {
    return this.data.connectState === CONNECT_STATE.UNLINKED;
  }

  get isApplyingConnect() {
    return this.data.connectState === CONNECT_STATE.APPLYING;
  }

  get isInvitingConnect() {
    return this.data.connectState === CONNECT_STATE.INVITING;
  }

  get isWaitingConnect() {
    return this.data.connectState === CONNECT_STATE.WAITING;
  }

  get isLinkingConnect() {
    return this.data.connectState === CONNECT_STATE.LINKING;
  }
  // ========= utils end =========

  // ========= 暴露外部API =========
  // 申请连麦
  applyConnect(connectMode) {
    this.#changeConnectMode(connectMode);
    this.#fsm[ACTION_TYPE.APPLY]();
  }

  // 拒绝设备授权
  rejectAuthorization() {
    setTimeout(() => {
      this.#fsm[ACTION_TYPE.REJECTAUTHORIZATION]();
    }, 1000);
  }

  // 取消申请连麦
  cancelApplyConnect() {
    this.#fsm[ACTION_TYPE.CANCELAPPLY]();
  }

  // 拒绝连麦邀请
  rejectInviteConnect() {
    this.#fsm[ACTION_TYPE.REJECTINVITE]();
  }

  // 接受连麦邀请
  acceptInviteConnect(connectMode) {
    this.#changeConnectMode(connectMode);

    setTimeout(() => {
      this.#fsm[ACTION_TYPE.AGREEDINVITE]();
    }, 1000);
  }

  // 结束连麦
  endConnect() {
    this.#autoConnectProcess && this.#autoConnectProcess();

    setTimeout(() => {
      this.#fsm[ACTION_TYPE.ENDCONNECT]();
    }, 1000);
  }

  // 切换多终端连麦
  async removeUser() {
    await this.#httpManager.removeUser();
    this.#getConnectState({ switchPlatform: true });
  }

  // 切换摄像头
  switchCamera(deviceId) {
    const pusherInfo = this.#layoutManager.getData("pusherInfo");
    if (pusherInfo.camera_on) {
      return this.#rtcManager.switchCamera(deviceId);
    } else {
      // 没开采集的情况下，直接切换摄像头会抛错，这里直接更新一下当前设备，为下次开采集做准备
      return this.#rtcManager.updateCurrentCameraId(deviceId);
    }
  }

  // 切换麦克风
  switchMic(deviceId) {
    return this.#rtcManager.switchMic(deviceId);
  }

  // 切换扬声器
  switchSpeaker(deviceId) {
    return this.#rtcManager.switchSpeaker(deviceId);
  }

  // 主动开关摄像头
  async toggleEnableCamera(target, operateUser = this.props.user_id) {
    console.log("[voice] toggleEnableCamera", target, operateUser);
    await this.#layoutManager.switchDevice(
      DEVICE_TYPE.CAMERA,
      target,
      operateUser
    );
    await this.#rtcManager.toggleCaptureCamera(target);
    this.#layoutManager.updatePusherInfo({ camera_on: target });
  }

  // 主动开关麦克风
  async toggleEnableMic(target, operateUser = this.props.user_id) {
    await this.#layoutManager.switchDevice(
      DEVICE_TYPE.MIC,
      target,
      operateUser
    );
    await this.#rtcManager.toggleMuteMic(!target);
    this.#layoutManager.updatePusherInfo({ mic_on: target });
  }

  // 开关镜像
  toggleMirror(target) {
    this.#rtcManager.toggleMirror(target);
  }

  // 开关美颜
  toggleEnableBeauty(target) {
    this.#rtcManager.toggleEnableBeauty(target);
  }

  // 处理响应结果
  handleBeforeResponse(code = BUSINESS_CODE.SUCCESS, data = {}) {
    return { type: "before", code, data };
  }

  handleAfterResponse(code = BUSINESS_CODE.SUCCESS, data = {}) {
    return { type: "after", code, data };
  }

  // 销毁
  destroyed() {
    this.#resetData();

    this.#fsm = null;
    this.#httpManager = null;
    this.#layoutManager = null;
    this.#rtcManager = null;
    this.#imManager = null;

    this.#isInitialSdk = false;
    this.#connectBaseInfo = {};
    this.#connectStateCode = 0;
    this.#voiceUniqueId = "";
  }
}

export default new Voice();
