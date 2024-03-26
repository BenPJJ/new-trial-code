// index.js
// const app = getApp()
import { randomUserID } from "../../utils/common";
import { genTestUserSig } from "../../debug/GenerateTestUserSig";

const app = getApp();

const userList = [
  {
    user_id: "u_61518e9ebfb70_yZll8kYIEP",
    user_sig:
      "eJwtzVsLgkAQBeD-ss8hs*asF*ihIGkrQjAofREvq2xuJqZdiP57pj7Odw5nPuS497WHaIhDdA3IbLhlJqpW5nLgLmIUqSVskeSJCdE7VMoqA772pvY9K*O6lhlxqAGAgAa1x0S8atmI3hFRB4BRW3n9m0mpoSNlbFqRRf-MZZvdqbtsVcmLZ1p5K7-1biz3D66N5zBWYcWDJQ*t*TxdkO8PkvA3fg__",
  },
  {
    user_id: "u_5fbca4c7c7f2b_9q2Ae8PxB0",
    user_sig:
      "eJw1zVELgjAABOD-sufQOTenQg9KBFFIZESKIDqnDanUzTCi-55pPd53B-cCx12oPXgHXIA0CBZTFgW-KVGKifuUlDnLMKOMlihPnRZ53N4P-n8tizprGlEA18AQEkiw4cwNHxrR8dEJIQhCOKsS169Rw8AmJtZvK0U1nsU9X3m4aiNZx4nequC8tXzTp5tE78L7QUYXFp8qxYLn2mZL8P4ACy44qw__",
  },
];

Page({
  data: {
    roomID: "1007992568",
    headerHeight: app.globalData.headerHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    localVideo: true,
    localAudio: true,
    userList,
    checkUser: userList[0],
  },

  onLoad() {},
  radioChange(e) {
    console.error(e);
    const index = e.detail.value;
    this.setData({
      checkUser: this.data.userList[index],
    });
  },
  enterRoomID(event) {
    this.setData({
      roomID: event.detail.value,
    });
  },
  enterRoom() {
    const { roomID, localVideo, localAudio } = this.data;
    const nowTime = new Date();
    if (nowTime - this.tapTime < 1000) {
      return;
    }
    if (!roomID) {
      wx.showToast({
        title: "请输入房间号",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    if (/^\d*$/.test(roomID) === false) {
      wx.showToast({
        title: "房间号只能为数字",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    if (roomID > 4294967295 || roomID < 1) {
      wx.showToast({
        title: "房间号取值范围为 1~4294967295",
        icon: "none",
        duration: 2000,
      });
      return;
    }
    // const userID = randomUserID();
    // const Signature = genTestUserSig(userID);
    const { user_id, user_sig } = this.data.checkUser;

    const url = `./room/room?roomID=${roomID}&localVideo=${localVideo}&localAudio=${localAudio}&userID=${user_id}&sdkAppID=1400505419&userSig=${user_sig}`;
    this.tapTime = nowTime;
    this.checkDeviceAuthorize()
      .then((result) => {
        console.log("授权成功", result);
        wx.navigateTo({ url });
      })
      .catch((error) => {
        console.log("没有授权", error);
      });
  },
  checkDeviceAuthorize() {
    this.hasOpenDeviceAuthorizeModal = false;
    return new Promise((resolve, reject) => {
      if (!wx.getSetting || !wx.getSetting()) {
        // 微信测试版 获取授权API异常，目前只能即使没授权也可以通过
        resolve();
      }
      wx.getSetting().then((result) => {
        console.log("getSetting", result);
        this.authorizeMic = result.authSetting["scope.record"];
        this.authorizeCamera = result.authSetting["scope.camera"];
        if (
          result.authSetting["scope.camera"] &&
          result.authSetting["scope.record"]
        ) {
          // 授权成功
          resolve();
        } else {
          // 没有授权，弹出授权窗口
          // 注意： wx.authorize 只有首次调用会弹框，之后调用只返回结果，如果没有授权需要自行弹框提示处理
          console.log("getSetting 没有授权，弹出授权窗口", result);
          wx.authorize({
            scope: "scope.record",
          })
            .then((res) => {
              console.log("authorize mic", res);
              this.authorizeMic = true;
              if (this.authorizeCamera) {
                resolve();
              }
            })
            .catch((error) => {
              console.log("authorize mic error", error);
              this.authorizeMic = false;
            });
          wx.authorize({
            scope: "scope.camera",
          })
            .then((res) => {
              console.log("authorize camera", res);
              this.authorizeCamera = true;
              if (this.authorizeMic) {
                resolve();
              } else {
                this.openConfirm();
                reject(new Error("authorize fail"));
              }
            })
            .catch((error) => {
              console.log("authorize camera error", error);
              this.authorizeCamera = false;
              this.openConfirm();
              reject(new Error("authorize fail"));
            });
        }
      });
    });
  },
  openConfirm() {
    if (this.hasOpenDeviceAuthorizeModal) {
      return;
    }
    this.hasOpenDeviceAuthorizeModal = true;
    return wx.showModal({
      content: "您没有打开麦克风和摄像头的权限，是否去设置打开？",
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        this.hasOpenDeviceAuthorizeModal = false;
        console.log(res);
        // 点击“确认”时打开设置页面
        if (res.confirm) {
          console.log("用户点击确认");
          wx.openSetting({
            success: (res) => {},
          });
        } else {
          console.log("用户点击取消");
        }
      },
    });
  },
  switchHandler(event) {
    const { key } = event.currentTarget.dataset;
    const data = {};
    data[key] = event.detail.value;
    this.setData(data, () => {
      console.log(`set ${key}:`, data[key]);
    });
  },
  onBack() {
    wx.navigateBack({
      delta: 1,
    });
  },
});
