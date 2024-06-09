import Api from "../api/index";

class Http {
  /**
   * role_type 角色类型 1-讲师 2-学员
   */

  // 请求相关参数
  options = {};

  // 网络请求体
  #request = null;

  constructor({ options, request }) {
    this.options = options;

    this.#request = request;
  }

  getConnectState() {
    return new Promise((resolve, reject) => {});
  }

  applyConnect(connectMode) {
    return new Promise(async (resolve, reject) => {
      const { appId, aliveId, userId } = this.options;
      this.#request
        .post(Api.APPLY_CONNECT, {
          app_id: appId,
          alive_id: aliveId,
          user_id: userId,
          connect_mode: connectMode,
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

  getConnectToken() {
    return new Promise((resolve, reject) => {});
  }

  getConnectBaseInfo() {
    return new Promise((resolve, reject) => {});
  }

  joinLive() {
    return new Promise((resolve, reject) => {});
  }

  getOnlineTeacherList() {}

  // 同意讲师连麦邀请
  agreeInvite() {
    return new Promise(async (resolve, reject) => {
      const { alive_id, app_id, user_id, user_type } = this.options;

      try {
        const res = await this.#request.post(Api.AGREE_INVITATION, {
          alive_id,
          app_id,
          user_id,
          role_type: user_type === 0 ? 2 : 1,
        });

        if (res.code === 0) {
          resolve(res);
        } else {
          reject(res);
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default Http;
