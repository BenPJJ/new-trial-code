import EventEmitter from "../libs/eventEmitter";
export const START_PUSHER_ERROR = "start_pusher_error"; // 启动推流异常

class Rtc extends EventEmitter {
  #rtcSdk = null;

  rtc = null;

  constructor({ rtcSdk, platform }) {
    super();

    this.#rtcSdk = rtcSdk;

    this.init();
    this.initEventListener();
  }

  init() {
    if (this.rtc) return;
    this.rtc = this.#rtcSdk.create();
  }

  initEventListener() {
    const RTC_EVENT = this.#rtcSdk.EVENT;
    this.#rtcSdk.on(RTC_EVENT.ERROR, this.handleError);
    this.#rtcSdk.on(RTC_EVENT.KICKED_OUT, this.handleKickedOut);
    this.#rtcSdk.on(RTC_EVENT.REMOTE_USER_ENTER, this.handleRemoteUserEnter);
    this.#rtcSdk.on(RTC_EVENT.REMOTE_USER_EXIT, this.handleRemoteUserExit);
    this.#rtcSdk.on(
      RTC_EVENT.REMOTE_VIDEO_AVAILABLE,
      this.handleRemoteVideoAvailable
    );
    this.#rtcSdk.on(
      RTC_EVENT.REMOTE_VIDEO_UNAVAILABLE,
      this.handleRemoteVideoUnavailable
    );
    this.#rtcSdk.on(
      RTC_EVENT.REMOTE_AUDIO_UNAVAILABLE,
      this.handleRemoteAudioUnavailable
    );
    this.#rtcSdk.on(
      RTC_EVENT.REMOTE_AUDIO_AVAILABLE,
      this.handleRemoteAudioAvailable
    );
    this.#rtcSdk.on(
      RTC_EVENT.SCREEN_SHARE_STOPPED,
      this.handleScreenShareStopped
    );
  }

  isSupported() {
    this.#rtcSdk.isSupported();
  }

  getCameraList() {}

  getMicrophoneList() {}

  initRtc() {
    return new Promise((resolve, reject) => {});
  }

  enterRoom() {}

  exitRoom() {}
}

export default Rtc;
