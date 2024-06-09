import { PLATFORM } from "../constant/index";

// 终端前置路由
const PRE_ROUTE = {
  [PLATFORM.XE_LIVE_CLIENT]: "bff_pc_client",
  [PLATFORM.E_LIVE]: "elive",
};

let pre_route = "";

export function setPlatform(platform) {
  pre_route = "/_alive/" + PRE_ROUTE[platform];
}

const Api = {
  CONNECT_STATUS: "/alive_connect/status/v1", // 查询用户连麦状态
  APPLY_CONNECT: "/alive_connect/apply_connect/v1", // 用户申请连麦
  CANCEL_APPLY_CONNECT: "/alive_connect/cancel_apply_connect/v1", // 用户取消申请连麦
  REJECT_APPLY_CONNECT: "/alive_connect/reject_apply/v1", // 讲师拒绝连麦申请
  AGREE_APPLY: "/alive_connect/agree_apply/v1", // 讲师同意连麦申请
  INVITE_CONNECT: "/alive_connect/invite_connect/v1", // 讲师邀请连麦
  CANCEL_INVITE: "/alive_connect/cancel_invite/v1", // 讲师取消邀请连麦
  REJECT_INVITE: "/alive_connect/reject_invite/v1", // 用户拒绝连麦邀请
  AGREE_INVITATION: "/alive_connect/agree_invitation/v1", // 用户同意连麦邀请
  JOIN_LIVE: "/alive_connect/join_live/v1", // 加入直播
  QUIT_LIVE: "/alive_connect/quit_live/v1", // 退出直播
  GO_MINIPROGRAM: "/_alive/connect/go-miniprogram", // 获取连麦token
  BASE_INFO: "/alive_connect/base_info/v1", // 获取连麦配置数据
  ONLINE_TEACHER_LIST: "/alive_connect/online_teacher_list/v1", // 在线连麦列表
  SWITCH_DEVICE: "/alive_connect/switch_device/v1", // 设置设备开关
  REMOVE_USER: "/alive_connect/remove_user/v1", // 踢人切换终端连麦
};

const handler = {
  get: function (target, property) {
    const api = target[property] || "";
    if (api.includes("/_alive")) {
      return target[property];
    }

    return pre_route + target[property];
  },
};

const ApiProxy = new Proxy(Api, handler);

export default ApiProxy;
