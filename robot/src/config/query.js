const AQS_TOPIC_ID = "aa65e74f-5770-403e-ba2b-54a7a02bb063";

// 鹅直播小程序连麦监控
const QUERY_MINI_MONITOR =
  '"voice_monitor" | select params.api_code as code,count(*) as cnt group by params.api_code limit 10000';

// 鹅直播客户端连麦监控
const QUERY_CLIENT_MONITOR =
  '"voiceMonitor" | select params.api_code as code,count(*) as cnt group by params.api_code limit 10000';

// 鹅直播客户端连麦使用店铺数
const QUERY_CLIENT_SHOP_USED_COUNT =
  '(params.api_name:"receive_agree_apply" OR params.api_name:"agree_invite" OR params.api_name:"linking_connect") AND "voiceMonitor" | select approx_distinct("app_id") as cnt limit 10000';

// 鹅直播客户端连麦用户数
const QUERY_CLIENT_USER_USED_COUNT =
  '(params.api_name:"receive_agree_apply" OR params.api_name:"agree_invite" OR params.api_name:"linking_connect") AND "voiceMonitor" | select approx_distinct("user_id") as cnt limit 10000';

module.exports = {
  AQS_TOPIC_ID,
  QUERY_MINI_MONITOR,
  QUERY_CLIENT_MONITOR,
  QUERY_CLIENT_SHOP_USED_COUNT,
  QUERY_CLIENT_USER_USED_COUNT,
};
