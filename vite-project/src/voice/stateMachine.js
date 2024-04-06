const StateMachine = require("./state-machine");

// 连麦状态
export const CONNECT_STATE = {
  UNLINKED: "unlinked", // 未连接
  APPLYING: "applying", // 申请中
  INVITING: "inviting", // 邀请中
  WAITING: "waiting", // 等待接通中
  LINKING: "linking", // 连接中
};

// action类型
export const ACTION_TYPE = {
  // ========= 讲师邀请正向链路 start =========
  INVITE: "invite", // 收到讲师邀请
  AGREEDINVITE: "agreedInvite", // 接受讲师邀请
  // ========= 讲师邀请正向链路 end =========

  // ========= 用户申请正向链路 start =========
  APPLY: "apply", // 用户申请
  AGREED: "agreed", // 讲师同意用户申请
  CONNECT: "connect", // 连接中
  // ========= 用户申请正向链路 end =========

  // ========= 讲师回退事件链路 start =========
  CLOSESWITCHCONNECT: "closeSwitchConnect", // 关闭连麦开关
  CANCELINVITE: "cancelInvite", // 讲师取消邀请
  CANCELINVITEWAITING: "cancelInviteWaiting", // 取消邀请等待接通中
  CANCELLINKING: "cancelLinking", // 讲师取消连接中的用户连麦
  STOPALIVE: "stopAlive", // 讲师暂停直播或者断流
  ENDALIVE: "endAlive", // 结束直播
  FORBIDS: "forbids", // 禁言
  // ========= 讲师回退事件链路 end =========

  // ========= 用户回退事件链路 start =========
  CANCELAUTHORIZATION: "cancelAuthorization", // 用户取消授权
  CANCELAPPLY: "cancelApply", // 用户取消申请
  REJECTINVITE: "rejectInvite", // 拒绝讲师邀请
  INVITETIMEOUT: "inviteTimeout", // 讲师邀请超时
  APPLYINGTIMEOUT: "applyingTimeout", // 用户申请连麦中超时
  WAITINGTIMEOUT: "waitingTimeout", // 等待接通中超时
  QUITROOM: "quitRoom", // 用户退房
  RECOVERCONNECT: "recoverConnect", // 恢复连接中（重新进入）
  SWITCHFRONTSTAGE: "switchFrontStage", // 后台切前台
  // ========= 用户回退事件链路 end =========

  // ========= 异常回退事件链路 start =========
  LINKINGFAILED: "linkingFailed", // 连麦过程中失败
  CANCELRETRY: "cancelRetry", // 取消trtc重试
  // ========= 异常回退事件链路 end =========
};

// tips：因为有限状态机机制不支持在上一个action未完成的情况下，执行下一步，通过异步setTimeout欺骗机制
// transition is invalid while previous transition is still in progress

const FSM = StateMachine.factory({
  init: CONNECT_STATE.UNLINKED,
  transitions: [
    // ========= 讲师邀请正向链路 start =========
    {
      name: ACTION_TYPE.INVITE,
      from: [CONNECT_STATE.UNLINKED, CONNECT_STATE.INVITING],
      to: CONNECT_STATE.INVITING,
    },
    {
      name: ACTION_TYPE.AGREEDINVITE,
      from: [CONNECT_STATE.UNLINKED, CONNECT_STATE.INVITING],
      to: CONNECT_STATE.WAITING,
    },
    // ========= 讲师邀请正向链路 end =========

    // ========= 用户申请正向链路 start =========
    {
      name: ACTION_TYPE.APPLY,
      from: CONNECT_STATE.UNLINKED,
      to: CONNECT_STATE.APPLYING,
    },
    {
      name: ACTION_TYPE.AGREED,
      from: CONNECT_STATE.APPLYING,
      to: CONNECT_STATE.WAITING,
    },
    {
      name: ACTION_TYPE.CONNECT,
      from: CONNECT_STATE.WAITING,
      to: CONNECT_STATE.LINKING,
    },
    // ========= 用户申请正向链路 end =========

    // ========= 讲师回退事件链路 start =========
    {
      name: ACTION_TYPE.CLOSESWITCHCONNECT,
      from: "*",
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.CANCELINVITE,
      from: CONNECT_STATE.INVITING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.CANCELINVITEWAITING,
      from: CONNECT_STATE.WAITING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.CANCELLINKING,
      from: [CONNECT_STATE.WAITING, CONNECT_STATE.LINKING],
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.STOPALIVE,
      from: [
        CONNECT_STATE.APPLYING,
        CONNECT_STATE.INVITING,
        CONNECT_STATE.WAITING,
        CONNECT_STATE.LINKING,
      ],
      to: CONNECT_STATE.UNLINKED,
    },
    // ========= 讲师回退事件链路 end =========

    // ========= 用户回退事件链路 start =========
    {
      name: ACTION_TYPE.CANCELAUTHORIZATION,
      from: "*",
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.CANCELAPPLY,
      from: CONNECT_STATE.APPLYING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.REJECTINVITE,
      from: CONNECT_STATE.INVITING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.APPLYINGTIMEOUT,
      from: CONNECT_STATE.APPLYING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.INVITETIMEOUT,
      from: CONNECT_STATE.INVITING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.WAITINGTIMEOUT,
      from: CONNECT_STATE.WAITING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.QUITROOM,
      from: CONNECT_STATE.LINKING,
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.RECOVERCONNECT,
      from: [CONNECT_STATE.UNLINKED, CONNECT_STATE.WAITING],
      to: CONNECT_STATE.WAITING,
    },
    {
      name: ACTION_TYPE.SWITCHFRONTSTAGE,
      from: [CONNECT_STATE.WAITING, CONNECT_STATE.LINKING],
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.ENDALIVE,
      from: [
        CONNECT_STATE.APPLYING,
        CONNECT_STATE.INVITING,
        CONNECT_STATE.WAITING,
        CONNECT_STATE.LINKING,
      ],
      to: CONNECT_STATE.UNLINKED,
    },
    // ========= 用户回退事件链路 end =========

    {
      name: ACTION_TYPE.FORBIDS,
      from: [
        CONNECT_STATE.APPLYING,
        CONNECT_STATE.INVITING,
        CONNECT_STATE.WAITING,
        CONNECT_STATE.LINKING,
      ],
      to: CONNECT_STATE.UNLINKED,
    },

    // ========= 异常回退事件链路 start =========
    {
      name: ACTION_TYPE.LINKINGFAILED,
      from: [CONNECT_STATE.UNLINKED, CONNECT_STATE.WAITING],
      to: CONNECT_STATE.UNLINKED,
    },
    {
      name: ACTION_TYPE.CANCELRETRY,
      from: CONNECT_STATE.WAITING,
      to: CONNECT_STATE.UNLINKED,
    },
    // ========= 异常回退事件链路 end =========
  ],
  data: function (effect = {}) {
    return {
      effect,
    };
  },
  methods: {
    // 系统生命周期，自定义before之前
    onBeforeTransition: function (lifecycle) {
      return new Promise((resolve, reject) => {
        console.log(
          `BeforeTransition lifecycle is %c${lifecycle.transition}%c State changes from %c${lifecycle.from}%c to %c${lifecycle.to}`,
          "color: green",
          "",
          "color: green",
          "",
          "color: green"
        );
        this.effect?.transitionBeforeEffect(resolve, reject, lifecycle);
      });
    },
    // 系统生命周期，自定义before之后，系统onAfterTransition之前
    onTransition: function () {},
    // 系统生命周期，系统onTransition之后，自定义after之前
    onAfterTransition: function (lifecycle) {
      console.log(
        `AfterTransition lifecycle is %c${lifecycle.transition}%c State changes from %c${lifecycle.from}%c to %c${lifecycle.to}`,
        "color: green",
        "",
        "color: green",
        "",
        "color: green"
      );
      this.effect?.transitionAfterEffect(lifecycle);
    },

    // ========= 讲师邀请正向链路 start =========
    // 自定义生命周期，讲师邀请用户连麦
    onBeforeInvite: function () {
      return new Promise((resolve, reject) => {
        this.effect?.inviteBeforeEffect(resolve, reject);
      });
    },
    onInvite: function () {
      this.effect?.inviteAfterEffect();
    },
    // 自定义生命周期，用户接受讲师的邀请连麦
    onBeforeAgreedInvite: function () {},
    onAgreedInvite: function () {
      this.effect?.agreedInviteAfterEffect();
    },
    // ========= 讲师邀请正向链路 end =========

    // ========= 用户申请正向链路 start =========
    // 自定义生命周期，用户申请连麦
    onBeforeApply: function () {
      return new Promise((resolve, reject) => {
        this.effect?.applyBeforeEffect(resolve, reject);
      });
    },
    onApply: function () {},
    // 自定义生命周期，讲师同意用户申请连麦
    onBeforeAgreed: function () {
      return new Promise((resolve, reject) => {
        this.effect?.agreedBeforeEffect(resolve, reject);
      });
    },
    onAgreed: function () {
      setTimeout(() => {
        this.effect?.agreedAfterEffect();
      }, 1000);
    },
    // 自定义生命周期，连麦上台
    onBeforeConnect: function () {
      return new Promise((resolve, reject) => {
        this.effect?.connectBeforeEffect(resolve, reject);
      });
    },
    onConnect: function () {
      setTimeout(() => {
        this.effect?.connectAfterEffect();
      }, 1000);
    },
    // ========= 用户申请正向链路 end =========

    // ========= 讲师回退事件链路 start =========
    // 自定义生命周期，关闭连麦开关
    onBeforeCloseSwitchConnect: function () {
      return new Promise((resolve, reject) => {
        this.effect?.closeSwitchConnectBeforeEffect(resolve, reject);
      });
    },
    onCloseSwitchConnect: function () {},
    // 自定义生命周期，讲师取消连麦邀请
    onBeforeCancelInvite: function () {},
    onCancelInvite: function () {
      this.effect?.cancelInviteAfterEffect();
    },
    // 自定义生命周期，讲师取消等待接通中的邀请连麦
    onBeforeCancelInviteWaiting: function () {
      return new Promise((resolve, reject) => {
        this.effect?.cancelInviteWaitingBeforeEffect(resolve, reject);
      });
    },
    onCancelInviteWaiting: function () {
      this.effect?.cancelInviteWaitingAfterEffect();
    },
    // 自定义生命周期，讲师取消连接中的用户
    onBeforeCancelLinking: function () {},
    onCancelLinking: function () {
      this.effect?.cancelLinkingAfterEffect();
    },
    // 自定义生命周期，讲师结束直播
    onBeforeStopAlive: function () {},
    onStopAlive: function () {
      this.effect?.stopAliveAfterEffect();
    },
    // ========= 讲师回退事件链路 end =========

    // ========= 用户回退事件链路 start =========
    // 自定义生命周期，用户取消授权
    onBeforeCancelAuthorization: function () {
      return new Promise((resolve, reject) => {
        this.effect?.cancelAuthorizationBeforeEffect(resolve, reject);
      });
    },
    onAfterCancelAuthorization: function () {},
    // 自定义生命周期，取消申请连麦
    onBeforeCancelApply: function () {
      return new Promise((resolve, reject) => {
        this.effect?.cancelApplyBeforeEffect(resolve, reject);
      });
    },
    onCancelApply: function () {},
    // 自定义生命周期，用户拒绝讲师邀请连麦
    onBeforeRejectInvite: function () {
      return new Promise((resolve, reject) => {
        this.effect?.rejectInviteBeforeEffect(resolve, reject);
      });
    },
    onRejectInvite: function () {},
    // 自定义生命周期，讲师邀请连麦超时
    onBeforeApplyingTimeout: function () {},
    onApplyingTimeout: function () {
      this.effect?.applyingTimeoutAfterEffect();
    },
    // 自定义生命周期，讲师邀请连麦超时
    onBeforeInviteTimeout: function () {},
    onInviteTimeout: function () {
      this.effect?.inviteTimeoutAfterEffect();
    },
    // 自定义生命周期，等待接通中超时
    onBeforeWaitingTimeout() {},
    onWaitingTimeout() {
      this.effect?.waitingTimeoutAfterEffect();
    },
    // 自定义生命周期，用户连麦下台
    onBeforeQuitRoom: function () {
      return new Promise((resolve, reject) => {
        this.effect?.quitRoomBeforeEffect(resolve, reject);
      });
    },
    onQuitRoom: function () {
      this.effect?.quitRoomAfterEffect();
    },
    // 自定义生命周期，恢复连麦中
    onBeforeRecoverConnect: function () {},
    onRecoverConnect: function () {
      setTimeout(() => {
        this.effect?.recoverConnectAfterEffect();
      }, 1000);
    },
    // 自定义生命周期，后台切前台
    onBeforeSwitchFrontStage: function () {},
    onSwitchFrontStage: function () {
      setTimeout(() => {
        this.effect?.switchFrontStageAfterEffect();
      }, 1000);
    },
    // 自定义生命周期，结束直播
    onBeforeEndAlive: function () {},
    onEndAlive: function () {
      this.effect?.endAliveAfterEffect();
    },
    // ========= 用户回退事件链路 end =========
    // 个人被禁言
    onBeforeForbids: function () {
      return new Promise((resolve, reject) => {
        this.effect?.forbidsBeforeEffect(resolve, reject);
      });
    },
    onForbids: function () {},

    // ========= 异常回退事件链路 start =========
    // 连麦过程中失败
    onBeforeLinkingFailed: function () {
      return new Promise((resolve, reject) => {
        this.effect?.linkingFailedBeforeEffect(resolve, reject);
      });
    },
    onLinkingFailed: function () {},
    // 取消trtc重试
    onBeforeCancelRetry: function () {
      return new Promise((resolve, reject) => {
        this.effect?.cancelRetryBeforeEffect(resolve, reject);
      });
    },
    onCancelRetry: function () {},
    // ========= 异常回退事件链路 end =========

    // ========= 状态机异常 start =========
    onPendingTransition: function (transition, from, to) {
      console.log(
        `onPendingTransition lifecycle is %c${transition}%c State changes from %c${from}%c to %c${to}`,
        "color: green",
        "",
        "color: green",
        "",
        "color: green"
      );
      const error = {
        message:
          "transition is invalid while previous transition is still in progress",
        transition: transition,
        from: from,
        to: to,
        current: this.state,
      };

      this.effect?.pendingTransition(error);

      throw error;
    },
    onInvalidTransition: function (transition, from, to) {
      console.log(
        `onInvalidTransition lifecycle is %c${transition}%c State changes from %c${from}%c to %c${to}`,
        "color: green",
        "",
        "color: green",
        "",
        "color: green"
      );
      const error = {
        message: "transition is invalid in current state",
        transition: transition,
        from: from,
        to: to,
        current: this.state,
      };

      this.effect?.invalidTransition(error);

      throw error;
    },
    // ========= 状态机异常 end =========
  },
});

export default FSM;
