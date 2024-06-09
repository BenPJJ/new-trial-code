const searchLog = require("../libs/cls-request");
const { AQS_TOPIC_ID, CLIENT_VOICE } = require("../config/query");
const dayjs = require("dayjs");

const yesterday = dayjs().subtract(1, "day");
const from = yesterday.hour(0).minute(0).second(0).millisecond(0).valueOf();
const to = yesterday.hour(23).minute(59).second(59).millisecond(59).valueOf();

async function getSuccessRate() {
  const { AnalysisRecords } = await searchLog({
    TopicId: AQS_TOPIC_ID,
    Query: CLIENT_VOICE,
    From: from,
    To: to,
    UseNewAnalysis: true,
  });

  let result = {};

  AnalysisRecords.forEach((item) => {
    item = JSON.parse(item);
    if (item.code === null) return;
    if (item.code === "0") {
      result["succussTotal"] = item.cnt;
    } else if (item.code === "1") {
      result["failTotal"] = item.cnt;
    }
  });

  return result;
}

module.exports = {
  getSuccessRate,
};
