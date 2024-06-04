const axios = require("axios");
const Utils = require("../utils/index");

// const query =
//   '"alive:voice" AND "voiceMonitor" | select params.api_code as code,count(*) as cnt group by params.api_code limit 10000';

const url = "https://alivereport.xiaoeknow.com/_panel/video/cls";

const query =
  '"voice_monitor" | select params.api_code as code,count(*) as cnt group by params.api_code limit 10000';

function retrieveLogs(startTime, endTime, query) {
  return new Promise((resolve, reject) => {
    axios
      .get(url, {
        params: {
          start_time: startTime,
          end_time: endTime,
          query,
        },
      })
      .then((res) => {
        if (res.data.code === 0) {
          resolve(res.data.data.list);
        } else {
          reject(res);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function retrieveVoiceLogs() {
  const { startTimeStamp, endTimeStamp } = Utils.getTime();
  return retrieveLogs(startTimeStamp, endTimeStamp, query);
}

module.exports = { retrieveVoiceLogs };
