import TRTC from "./libs/trtc-sdk-v5@5.5.0/trtc";
import Voice from "./voice/index";

const voice = new Voice({
  // 初始化参数...
  platform: "web",
  appId,
  aliveId,
  userId,
  userType,
  rtcSdk: TRTC,
  // =========事件钩子=========
  onApplyConnect({ code, data }) {
    // TODO:show toast
  },
  onAgreedConnect({ code, data }) {
    // TODO:close apply popup
  },
  onConnect({ code, data }) {},
});

voice.layout.on();
voice.applyConnect(1);
