import EventEmitter from "../libs/eventEmitter";

class Im extends EventEmitter {
  #imSdk = null;
  constructor({ imSdk }) {
    super();

    this.#imSdk = imSdk;
  }

  checkOnlineState() {}

  joinGroup() {}

  quitGroup() {}
}

export default Im;
