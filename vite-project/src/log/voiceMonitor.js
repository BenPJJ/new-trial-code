import logIns from "./index";

function replyTimeout(cb = () => {}, time = 2000) {
  let replyTimer = null;
  replyTimer = setTimeout(() => {
    cb && cb();
    clearTimeout(replyTimer);
    replyTimer = null;
  }, time);
  return replyTimer;
}

// 获取节点结果
function getDotResult(targetArr = []) {
  return targetArr.every((item) => item.api_code === 0) ? 0 : 1;
}

class VoiceMonitor {
  constructor() {
    this.queueStack = [];
    this.origin = "";
  }
  init(params = {}) {
    this.origin = params.origin || "";
  }
  voiceReport(params = {}, report = false) {
    this.queueStack.push(params.params);

    if (report) {
      logIns.sendReport({
        kpi_key: params.kpi_key,
        params: {
          origin: this.origin,
          api_msg: params.api_msg,
          api_code: getDotResult(this.queueStack),
          report_content: JSON.stringify(this.queueStack),
        },
      });
      this.queueStack = [];
    }
  }
  applyButton() {
    return replyTimeout(() => {
      this.voiceReport({
        kpi_key: "apply_connect",
        api_msg: "申请连麦",
        params: {
          api_name: "点击申请按钮",
          api_code: 1,
          error_msg: "超时未响应",
        },
      });
    });
  }
  applyInterface(params = {}) {
    this.voiceReport(
      {
        kpi_key: "apply_connect",
        api_msg: "申请连麦",
        params: {
          api_name: "申请连麦接口",
          ...params,
        },
      },
      true
    );
  }
  cancelApplyButton() {
    return replyTimeout(() => {
      this.voiceReport({
        kpi_key: "cancel_apply",
        api_msg: "取消申请连麦",
        params: {
          api_name: "点击取消申请按钮",
          api_code: 1,
          error_msg: "超时未响应",
        },
      });
    });
  }
  cancelApplyInterface(params = {}) {
    this.voiceReport(
      {
        kpi_key: "cancel_apply",
        api_msg: "取消申请连麦",
        params: {
          api_name: "取消申请连麦接口",
          ...params,
        },
      },
      true
    );
  }
  receiveApplyMessage(params = {}) {
    this.voiceReport(
      {
        kpi_key: "receive_apply",
        api_msg: "接收连麦申请",
        params: {
          api_name: "接收连麦申请IM",
          api_code: 0,
          ...params,
        },
      },
      true
    );
  }
  agreeApplyInterface(params = {}) {
    this.voiceReport(
      {
        kpi_key: "agree_apply",
        api_msg: "同意连麦申请",
        params: {
          api_name: "同意连麦申请接口",
          ...params,
        },
      },
      true
    );
  }
  receiveAgreeApplyMessage(params = {}) {
    this.voiceReport(
      {
        kpi_key: "receive_agree_apply",
        api_msg: "接收同意连麦申请",
        params: {
          api_name: "接收同意连麦申请IM",
          api_code: 0,
          ...params,
        },
      },
      true
    );
  }
  inviteButton() {
    return replyTimeout(() => {
      this.voiceReport({
        kpi_key: "invite_connect",
        api_msg: "邀请连麦",
        params: {
          api_name: "点击邀请按钮",
          api_code: 1,
          error_msg: "超时未响应",
        },
      });
    });
  }
  inviteInterface(params = {}) {
    this.voiceReport(
      {
        kpi_key: "invite_connect",
        api_msg: "邀请连麦",
        params: {
          api_name: "邀请连麦接口",
          ...params,
        },
      },
      true
    );
  }
  receiveInviteMessage(params = {}) {
    this.voiceReport(
      {
        kpi_key: "receive_invite_connect",
        api_msg: "接收连麦邀请",
        params: {
          api_name: "接收连麦邀请IM",
          api_code: 0,
          ...params,
        },
      },
      true
    );
  }
  agreeInviteInterface(params = {}) {
    this.voiceReport(
      {
        kpi_key: "agree_invite",
        api_msg: "同意连麦邀请",
        params: {
          api_name: "同意连麦邀请接口",
          ...params,
        },
      },
      true
    );
  }
}

export default new VoiceMonitor();
