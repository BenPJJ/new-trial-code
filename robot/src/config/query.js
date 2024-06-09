const AQS_TOPIC_ID = "aa65e74f-5770-403e-ba2b-54a7a02bb063";

const CLIENT_VOICE =
  '"voice_monitor" | select params.api_code as code,count(*) as cnt group by params.api_code limit 10000';

module.exports = {
  AQS_TOPIC_ID,
  CLIENT_VOICE,
};
