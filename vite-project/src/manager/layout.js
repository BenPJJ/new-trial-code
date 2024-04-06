import EventEmitter from "../libs/eventEmitter";

// 更新连麦成员列表
export const UPDATE_LAYOUT = "update_layout";

class Layout extends EventEmitter {
  #http = null;
  constructor({ http }) {
    super();
    this.#http = http;
  }

  updatePlayerList() {
    this.#http.getOnlineTeacherList();

    // TODO:filter resource

    this.updateLayout();

    this.emit(UPDATE_LAYOUT);
  }
  async updateLayout() {}

  pollPlayerList() {}

  clearPollPlayerList() {}
}

export default Layout;
