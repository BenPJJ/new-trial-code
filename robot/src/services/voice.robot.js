const schedule = require("node-schedule");
const axios = require("axios");
const dayjs = require("dayjs");
const { VOICE_ROBOT_ADDRESS } = require("../config/robot");
const apis = require("../controllers/index");
const {
  getMiniVoiceMonitor,
  getClientVoiceMonitor,
  getClientShopUsedCount,
  getClientUserUsedCount,
} = apis.voice;

async function sendMsg() {
  const date = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  const yesterday = dayjs().subtract(1, "day");
  const from = yesterday.hour(0).minute(0).second(0).millisecond(0).valueOf();
  const to = yesterday.hour(23).minute(59).second(59).millisecond(59).valueOf();

  // 小程序
  const miniRes = await Promise.all([
    getMiniVoiceMonitor({ From: from, To: to }),
  ]);
  const miniVoiceMonitor = miniRes[0];

  let miniSuccessRate = (
    (1 -
      miniVoiceMonitor.failTotal /
        (miniVoiceMonitor.succussTotal + miniVoiceMonitor.failTotal)) *
    100
  ).toFixed(2);

  // 客户端：
  const clientRes = await Promise.all([
    getClientVoiceMonitor({ From: from, To: to }),
    getClientShopUsedCount({ From: from, To: to }),
    getClientUserUsedCount({ From: from, To: to }),
  ]);

  const clientVoiceMonitor = clientRes[0];
  const clientShopUsedCount = clientRes[1].cnt || 0;
  const clientUserUsedCount = clientRes[2].cnt || 0;

  let clientSuccessRate = (
    (1 -
      clientVoiceMonitor.failTotal /
        (clientVoiceMonitor.succussTotal + clientVoiceMonitor.failTotal)) *
    100
  ).toFixed(2);

  clientSuccessRate = Number(clientSuccessRate);

  if (Number.isNaN(clientSuccessRate)) {
    clientSuccessRate = 0;
  }

  axios.post(VOICE_ROBOT_ADDRESS, {
    msgtype: "markdown",
    markdown: {
      content: `${date}\n
鹅直播小程序：\n
>学员连麦成功率：<font color=\"warning\">${miniSuccessRate}%</font>\n
鹅直播客户端：\n
>学员连麦成功率：<font color=\"warning\">${clientSuccessRate}%</font>
>学员连麦店铺使用数：<font color=\"warning\">${clientShopUsedCount}家</font>
>学员连麦用户使用数：<font color=\"warning\">${clientUserUsedCount}位</font>`,
    },
  });
}

sendMsg();

/**
    * * * * * * * 每秒执行一次
    0 * * * * * 每分钟的第0秒执行一次
    0 0 * * * * 每小时的0分0秒执行一次
    0 0 7 * * * 每天早上7点的0分0秒执行一次
    0 0 7 1 * * 每月的1日早上7点0分0秒执行一次
    0 0 7 * * 1 每周1的早上7点0分0秒执行一次
 */
schedule.scheduleJob("0 9 * * *", sendMsg);
schedule.scheduleJob("0 17 * * *", sendMsg);
