const schedule = require("node-schedule");

/**
    * * * * * * * 每秒执行一次
    0 * * * * * 每分钟的第0秒执行一次
    0 0 * * * * 每小时的0分0秒执行一次
    0 0 7 * * * 每天早上7点的0分0秒执行一次
    0 0 7 1 * * 每月的1日早上7点0分0秒执行一次
    0 0 7 * * 1 每周1的早上7点0分0秒执行一次
 */
function runSchedule(cb, rules = "0 0 9 * * *") {
  schedule.scheduleJob(rules, function () {
    cb && cb();
  });
}

module.exports = runSchedule;
