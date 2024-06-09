const express = require("express");
require("dotenv").config();
require("./src/services/index");

const app = express();
const port = 3000;

app.listen(port, () => {
  console.log(`server is start listening on port ${port}`);
});
