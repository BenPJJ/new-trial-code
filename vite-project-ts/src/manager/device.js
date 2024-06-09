import EventEmitter from "../libs/eventEmitter";

class Device extends EventEmitter {
  constructor({ platform }) {
    super();
  }

  getNetworkState() {}

  checkNetworkState() {}

  checkDeviceAuthority() {}
}

export default Device;
