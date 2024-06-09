import Api, { setPlatform } from "../api/index";
import { isEmptyParam } from "../utils/index";

class Http {
  /**
   * role_type 角色类型 1-讲师 2-学员
   */

  // 请求相关参数
  #options = {};

  // 网络请求体
  #request = null;

  constructor({ options, request }) {
    this.#options = options;
    this.#request = request;

    setPlatform(options.platform);
  }

  getConnectState() {
    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id } = this.#options;

      this.#request
        .post(Api.CONNECT_STATUS, { app_id, alive_id, user_id })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  applyConnect(connect_mode) {
    if (!connect_mode) return new Error("传入参数错误");

    return new Promise((resolve, reject) => {
      const {
        app_id,
        alive_id,
        user_id,
        role_type,
        wx_avatar,
        wx_nickname,
        universal_union_id,
        platform,
        request_unique_id
      } = this.#options;
      this.#request
        .post(Api.APPLY_CONNECT, {
          app_id,
          alive_id,
          user_id,
          wx_avatar,
          wx_nickname,
          role_type,
          universal_union_id,
          connect_mode,
          platform,
          request_unique_id
        })
        .then((res) => {
          if (res.code === 0 || res.code === 4 || res.code === 6) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  agreeInvite() {
    return new Promise((resolve, reject) => {
      const { alive_id, app_id, user_id, role_type, platform, request_unique_id } = this.#options;

      // Tips: 目前同意邀请不影响业务状态流转
      this.#request
        .post(Api.AGREE_INVITATION, {
          alive_id,
          app_id,
          user_id,
          role_type,
          platform,
          request_unique_id
        })
        .then((res) => {
          resolve(res.data);
        })
        .catch((error) => {
          resolve(error);
        });
    });
  }

  cancelApplyConnect() {
    return new Promise((resolve, reject) => {
      const { alive_id, app_id, user_id, role_type } = this.#options;
      this.#request
        .post(Api.CANCEL_APPLY_CONNECT, {
          alive_id,
          app_id,
          user_id,
          role_type,
          is_timeout: false,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  rejectInviteConnect(targetUserId) {
    return new Promise((resolve, reject) => {
      const { alive_id, app_id, user_id, role_type } = this.#options;

      this.#request
        .post(Api.REJECT_INVITE, {
          alive_id,
          app_id,
          from_user_id: user_id,
          to_user_id: targetUserId,
          role_type,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getConnectBaseInfo(connect_mode) {
    return new Promise((resolve, reject) => {
      const {
        app_id,
        alive_id,
        user_id,
        universal_union_id,
        universal_open_id,
        scene,
      } = this.#options;
      this.#request
        .post(Api.BASE_INFO, {
          app_id,
          alive_id,
          user_id,
          connect_mode,
          universal_open_id,
          universal_union_id,
          scene,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  joinLive(camera_on, mic_on, isInterJump = false) {
    if (isEmptyParam(camera_on) || isEmptyParam(mic_on))
      return new Error("非法传参");

    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id, platform } = this.#options;

      this.#request
        .post(Api.JOIN_LIVE, {
          app_id,
          alive_id,
          user_id,
          camera_on,
          mic_on,
          can_switch_camera: 1,
          platform,
          isInterJump,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  quitLive(toUserId) {
    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id, wx_nickname, wx_avatar } =
        this.#options;
      this.#request
        .post(Api.QUIT_LIVE, {
          app_id,
          alive_id,
          from_user_id: user_id,
          from_user_avatar: wx_avatar,
          from_user_name: wx_nickname,
          to_user_id: toUserId || user_id,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getOnlineTeacherList() {
    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id } = this.#options;
      this.#request
        .post(Api.ONLINE_TEACHER_LIST, {
          app_id,
          alive_id,
          user_id,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res.data);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  switchDevice({ mic_on, camera_on, target_user_id, operateUser }) {
    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id, wy_roomid, connect_mode, user_type } =
        this.#options;

      this.#request
        .post(Api.SWITCH_DEVICE, {
          app_id,
          alive_id,
          user_id: operateUser,
          target_user_id: target_user_id || user_id,
          wy_roomid,
          mic_on,
          camera_on,
          user_type,
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  removeUser() {
    return new Promise((resolve, reject) => {
      const { app_id, alive_id, user_id, platform, request_unique_id } = this.#options;
      this.#request
        .post(Api.REMOVE_USER, {
          app_id,
          alive_id,
          user_id,
          platform,
          request_unique_id
        })
        .then((res) => {
          if (res.code === 0) {
            resolve(res);
          } else {
            reject(res);
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}

export default Http;
