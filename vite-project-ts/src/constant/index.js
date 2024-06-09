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
