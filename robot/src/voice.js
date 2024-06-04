const axios = require("axios");
const { retrieveVoiceLogs } = require("./voiceMonitor");
const Utils = require("../utils/index");

// const options = {
//   hostname: "qyapi.weixin.qq.com",
//   port: 443,
//   path: "/cgi-bin/webhook/send?key=853307fd-f3a5-4947-8ff8-f76e30e76b36",
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
// };
// const req = https.request(options, (res) => {});

// const postData = JSON.stringify({
//   // 根据微信企业号机器人 API 要求的数据格式填写
//   msgtype: "text",
//   text: {
//     content: "这是一条测试消息",
//   },
// });

// req.write(postData);
// req.end();

const url =
  "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=853307fd-f3a5-4947-8ff8-f76e30e76b36";

const { date } = Utils.getTime();
let tryCount = 0;
const maxTryCount = 3;

async function send() {
  try {
    const res = await retrieveVoiceLogs();

    tryCount = 0;
    let succussTotal = "";
    let failTotal = "";
    res.forEach((item) => {
      if (item.code === "1") {
        failTotal = item.cnt;
      } else if (item.code === "0") {
        succussTotal = item.cnt;
      }
    });

    const rate = ((1 - failTotal / (succussTotal + failTotal)) * 100).toFixed(
      2
    );
    axios.post(url, {
      msgtype: "markdown",
      markdown: {
        content: `${date} 鹅直播小程序连麦成功率：<font color=\"warning\">${rate}%</font>`,
      },
    });
  } catch (error) {
    tryCount++;

    console.log(tryCount, maxTryCount);

    if (tryCount > maxTryCount) {
      axios.post(url, {
        msgtype: "text",
        text: {
          content: "数据获取异常",
        },
      });
      tryCount = 0;
      return;
    }

    send();
  }
}

module.exports = send;
