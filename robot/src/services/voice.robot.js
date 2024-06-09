const schedule = require("node-schedule");
const axios = require("axios");
const dayjs = require("dayjs");
const { VOICE_ROBOT_ADDRESS } = require("../config/robot");
const apis = require("../controllers/index");

const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

async function sendMsg() {
  const result = await apis.miniVoice.getSuccessRate();

  const successRate = (
    (1 - result.failTotal / (result.succussTotal + result.failTotal)) *
    100
  ).toFixed(2);

  axios.post(VOICE_ROBOT_ADDRESS, {
    msgtype: "markdown",
    markdown: {
      content: `${yesterday} 鹅直播小程序连麦成功率：<font color=\"warning\">${successRate}%</font>`,
    },
  });
}

const today = dayjs().format("YYYY-MM-DD HH:mm:ss");

console.log(yesterday, today);

/**
    * * * * * * * 每秒执行一次
    0 * * * * * 每分钟的第0秒执行一次
    0 0 * * * * 每小时的0分0秒执行一次
    0 0 7 * * * 每天早上7点的0分0秒执行一次
    0 0 7 1 * * 每月的1日早上7点0分0秒执行一次
    0 0 7 * * 1 每周1的早上7点0分0秒执行一次
 */
schedule.scheduleJob("0 0 9 * * *", sendMsg);
