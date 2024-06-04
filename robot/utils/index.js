function getTime() {
  const today = new Date();
  let yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const year = yesterday.getFullYear();
  let month = yesterday.getMonth() + 1;
  const day = yesterday.getDate();
  const date = year + "-" + month + "-" + day;

  const startTime = year + "-" + month + "-" + day + " " + "00:00:00";
  const endTime = year + "-" + month + "-" + day + " " + "24:00:00";
  const startTimeStamp = new Date(startTime).getTime();
  const endTimeStamp = new Date(endTime).getTime();

  return { startTimeStamp, endTimeStamp, date };
}

module.exports = {
  getTime,
};
