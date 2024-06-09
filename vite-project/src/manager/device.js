import EventEmitter from "../libs/eventEmitter";
class Device extends EventEmitter {
  hasListenerDeviceChange = false;

  constructor() {
    super();
  }

  // 获取电脑设备网络情况
  getNetworkState() {
    return navigator.connection;
  }

  // 检查当前网络情况
  checkNetworkState() {
    return new Promise((resolve, reject) => {
      const onLine = navigator.onLine ?? true;
      if (onLine) {
        resolve();
      } else {
        reject(onLine);
      }
    });
  }

  // 获取设备权限
  getDevicePermission({ audio = false, video = false }) {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ audio, video })
        .then((stream) => {
          console.log("[deivceManager] getUserMedia success");
          stream.getTracks().forEach((track) => track.stop());
          resolve();
        })
        .catch((error) => {
          console.log(
            "[deivceManager] getUserMedia error",
            error.code,
            error.name,
            error
          );
          // TODO: 上报错误
          // https://developer.mozilla.org/zh-CN/docs/Web/API/DOMException#notallowederror
          // error.name：NotAllowedError是设备授权，NotReadableError是设备抢占
          reject(error);
        });
    });
  }

  // 监听设备变更
  listenerDeviceChange() {
    if (this.hasListenerDeviceChange) return;
    this.hasListenerDeviceChange = true;
    navigator.mediaDevices.addEventListener("devicechange", (event) => {
      this.emit("devicechange");
    });
  }
}

export default new Device();
