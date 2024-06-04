const express = require("express");
const runSchedule = require("./middle/schedule");
const sendVoice = require("./src/voice");

const app = express();
const port = 10086;

runSchedule(() => {
  sendVoice();
});

app.listen(port, () => {
  console.log(`server is start listening on port ${port}`);
});
