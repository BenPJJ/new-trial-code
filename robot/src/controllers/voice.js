const searchLog = require("../libs/cls-request");
const {
  AQS_TOPIC_ID,
  QUERY_MINI_MONITOR,
  QUERY_CLIENT_MONITOR,
  QUERY_CLIENT_USER_USED_COUNT,
  QUERY_CLIENT_SHOP_USED_COUNT,
} = require("../config/query");
const dayjs = require("dayjs");

const yesterday = dayjs().subtract(1, "day");
const from = yesterday.hour(0).minute(0).second(0).millisecond(0).valueOf();
const to = yesterday.hour(23).minute(59).second(59).millisecond(59).valueOf();

async function commonQuery(req) {
  const { AnalysisRecords } = await searchLog({
    TopicId: AQS_TOPIC_ID,
    UseNewAnalysis: true,
    ...req,
  });

  return AnalysisRecords;
}

// 小程序连麦监控
async function getMiniVoiceMonitor() {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_MINI_MONITOR,
    From: from,
    To: to,
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

// 连麦监控
async function getClientVoiceMonitor() {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_MONITOR,
    From: from,
    To: to,
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

// 店铺使用数
async function getClientShopUsedCount() {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_SHOP_USED_COUNT,
    From: from,
    To: to,
  });

  let result = JSON.parse(AnalysisRecords[0]);

  return result;
}

// 用户使用数
async function getClientUserUsedCount() {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_USER_USED_COUNT,
    From: from,
    To: to,
  });

  let result = JSON.parse(AnalysisRecords[0]);

  return result;
}

module.exports = {
  getMiniVoiceMonitor,
  getClientVoiceMonitor,
  getClientShopUsedCount,
  getClientUserUsedCount,
};
