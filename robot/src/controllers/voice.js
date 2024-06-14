const searchLog = require("../libs/cls-request");
const {
  AQS_TOPIC_ID,
  QUERY_MINI_MONITOR,
  QUERY_CLIENT_MONITOR,
  QUERY_CLIENT_USER_USED_COUNT,
  QUERY_CLIENT_SHOP_USED_COUNT,
} = require("../config/query");

async function commonQuery(req) {
  const { AnalysisRecords } = await searchLog({
    TopicId: AQS_TOPIC_ID,
    UseNewAnalysis: true,
    ...req,
  });

  return AnalysisRecords;
}

// 小程序连麦监控
async function getMiniVoiceMonitor(req) {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_MINI_MONITOR,
    ...req,
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
async function getClientVoiceMonitor(req) {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_MONITOR,
    ...req,
  });

  let result = {
    succussTotal: 0,
    failTotal: 0,
  };

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
async function getClientShopUsedCount(req) {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_SHOP_USED_COUNT,
    ...req,
  });

  let result = JSON.parse(AnalysisRecords[0]);

  return result;
}

// 用户使用数
async function getClientUserUsedCount(req) {
  const AnalysisRecords = await commonQuery({
    Query: QUERY_CLIENT_USER_USED_COUNT,
    ...req,
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
