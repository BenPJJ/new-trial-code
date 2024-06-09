// 连麦模式
export const CONNECT_MODE = {
  VIDEO: 1, // 视频连麦
  AUDIO: 2, // 语音连麦
};

// 后端连接状态
export const CONNECT_STATE_CODE = {
  UNLINKED: 0, // 可连麦
  PROGRESS: 1, // 申请中|邀请中
  WAITING: 2, // 等待接通中
  LINKING: 3, // 连接中
};

// 终端平台
export const PLATFORM = {
  XE_LIVE_CLIENT: "xeLiveClient", // 鹅直播客户端观看端
  E_LIVE: "elive", // 鹅直播小程序
};

/**
 * 0-请求成功 1-请求失败
 * 100-断网 101-IM离线 102-设备未授权 103-设备被占用
 * 200-同意连麦申请后状态流转超时（如：授权） 201-邀请连麦超时 202-等待接通中超时
 */
export const BUSINESS_CODE = {
  SUCCESS: 0,
  FAIL: 1,
  NETWORK_DISCONNECTION: 100,
  IM_OFF_LIVE: 101,
  DEVICE_UNAUTHORIZED: 102,
  DEVICE_OCCUPY: 103,
  AGREED_APPLY_CONNECT_TIMEOUT: 200,
  INVITE_CONNECT_TIMEOUT: 201,
  WAITING_CONNECT_TIMEOUT: 202,
};

export const UPDATE_RTC_PLAYER_LIST = "updateRtcPlayerList"; // 远端拉流更新

// 背景颜色-6个自定义
const COLOR1 = "#18191f";
const COLOR2 = "#202129";
const COLOR3 = "#282a33";
const COLOR4 = "#404352";
const COLOR5 = "#54586b";
const COLOR6 = "#ffffff";
// 背景颜色-6个自定义对应的二进制
const BINARY1 = 1579295;
const BINARY2 = 2105641;
const BINARY3 = 2632243;
const BINARY4 = 4211538;
const BINARY5 = 5527659;
const BINARY6 = 16777215;

export const BACKGROUND_COLOR_MAP = {
  [BINARY1]: COLOR1,
  [BINARY2]: COLOR2,
  [BINARY3]: COLOR3,
  [BINARY4]: COLOR4,
  [BINARY5]: COLOR5,
  [BINARY6]: COLOR6,
};

export const BACKGROUND_COLOR_INIT = BINARY1;

export const BACKGROUND_COLOR_LIST = [
  {
    binary: BINARY1,
    value: COLOR1,
  },
  {
    binary: BINARY2,
    value: COLOR2,
  },
  {
    binary: BINARY3,
    value: COLOR3,
  },
  {
    binary: BINARY4,
    value: COLOR4,
  },
  {
    binary: BINARY5,
    value: COLOR5,
  },
  {
    binary: BINARY6,
    value: COLOR6,
  },
];
