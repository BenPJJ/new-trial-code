import EventEmitter from "../libs/eventEmitter";
import { getVideoStyle } from "./layoutTemplate";

// 渲染连麦布局
export const RENDERING_VOICE_LAYOUT = "rendering_voice_layout";

export const DEVICE_TYPE = {
  MIC: "mic_on",
  CAMERA: "camera_on",
  BEAUTY: "beauty_on",
  MIRROR: "mirror_on",
};

const USER_TYPE = {
  PERSON: 0, // 真人
  WHITE_BOARD: 1, // 白板
  SCREEN_SHARING: 2, // 屏幕共享
};

class Layout extends EventEmitter {
  #options = {};
  #http = null;
  #pollPlayerListTimer = null; // 轮询连麦在线列表定时器
  data = {};

  constructor() {
    super();
    this.data = this.getModelData();
  }

  init({ options, http }) {
    this.#options = options;
    this.#http = http;
  }

  getModelData() {
    return {
      hasUseCourse: false, // 是否使用课件
      whiteBoard: null, // 白板
      shareScreen: null, // 屏幕共享
      pusherInfo: {}, // 本人连麦信息
      playerList: [], // 连麦真人列表
      videoStyle: [], // 单个播放器样式
      videoBoxStyle: "", // 播放器盒子样式
      mainTeacherUserId: "", // 主讲师userId
    };
  }

  getData(key) {
    return this.data[key];
  }

  /**
   *
   * @param {Object} {
   *  needCallback 视图执行回调
   *  requestSource 请求来源
   *  }
   * @returns
   */
  async updatePlayerList({ needCallback = false, requestSource = "" } = {}) {
    return new Promise(async (resolve, reject) => {
      let userList = [];
      try {
        userList = await this.#http.getOnlineTeacherList();

        const newPlayerList = [];
        const sortUserList = userList.sort((pre, next) => pre.sort - next.sort);
        let order = 0; // 维护一个排序，接口提供的会不准确
        this.data.whiteBoard = null;
        this.data.shareScreen = null;

        for (const item of sortUserList) {
          if (item.state !== 1 || item.on_stage !== 1) continue;

          // 真人
          if (item.user_type === USER_TYPE.PERSON) {
            item.sortIndex = order;
            order++;
            // 本人
            if (item.user_id === this.#options.user_id) {
              this.updatePusherInfo(item);
            } else {
              // 主讲师
              if (item.role_type === 0) {
                this.data.mainTeacherUserId = item.user_id;
              }

              newPlayerList.push(item);
            }
          } else if (item.user_type === USER_TYPE.WHITE_BOARD) {
            // 白板
            this.data.whiteBoard = item;
          } else if (item.user_type === USER_TYPE.SCREEN_SHARING) {
            // 屏幕共享
            this.data.shareScreen = item;
          }
        }
        this.data.hasUseCourse =
          !!this.data.whiteBoard || !!this.data.shareScreen;
        this.data.playerList = newPlayerList;

        this.#updateLayout();
        this.emit("updateData", {
          hasUseCourse: this.data.hasUseCourse,
          whiteBoard: this.data.whiteBoard,
          shareScreen: this.data.shareScreen,
          playerList: this.data.playerList,
          mainTeacherUserId: this.data.mainTeacherUserId,
        });
      } catch (error) {
        console.error("[layout] updatePlayerList error: ", error);
      }

      needCallback
        ? this.emit(RENDERING_VOICE_LAYOUT, () => {
            resolve();
          })
        : resolve();
    });
  }
  // 更新布局
  #updateLayout() {
    const total = this.data.playerList.length;

    // 横屏
    if (this.#options.alive_mode === 0) {
      this.data.videoStyle = getVideoStyle(
        this.data.hasUseCourse ? 3 : 2,
        total
      );
    } else if (this.#options.alive_mode === 1) {
      this.data.videoStyle = getVideoStyle(1, total);
    }
    this.emit("updateData", {
      videoStyle: this.data.videoStyle,
    });
  }

  // 更新本人连麦信息
  updatePusherInfo(data) {
    this.data.pusherInfo = Object.assign(this.data.pusherInfo, data);
    this.emit("updateData", { pusherInfo: this.data.pusherInfo });
  }

  // 定时轮询在线连麦列表
  pollPlayerList() {
    this.stopPollPlayerList();
    this.#pollPlayerListTimer = setInterval(() => {
      this.updatePlayerList();
    }, 1000 * 10);
  }

  // 停止轮询在线连麦列表
  stopPollPlayerList() {
    clearInterval(this.#pollPlayerListTimer);
    this.#pollPlayerListTimer = null;
  }

  // 操作开关设备
  async switchDevice(deviceType, targetState, operateUser) {
    const { user_id } = this.#options;
    let params = {
      operateUser,
      target_user_id: user_id,
    };
    if (deviceType === DEVICE_TYPE.MIC) {
      params.mic_on = Number(targetState);
      params.camera_on = this.data.pusherInfo.camera_on;
    } else {
      params.mic_on = this.data.pusherInfo.mic_on;
      params.camera_on = Number(targetState);
    }
    return await this.#http.switchDevice(params);
  }
}

export default new Layout();
