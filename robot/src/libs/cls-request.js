// https://www.npmjs.com/package/tencentcloud-sdk-nodejs
const tencentcloud = require("tencentcloud-sdk-nodejs");

const Clslient = tencentcloud.cls.v20201016.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENTCLOUD_SECRET_ID,
    secretKey: process.env.TENCENTCLOUD_SECRET_KEY,
  },
  region: process.env.REGION,
  profile: {
    signMethod: "HmacSHA1",
    httpProfile: {
      reqMethod: "POST",
      reqTimeout: 30,
      endpoint: "cls.tencentcloudapi.com",
    },
  },
};

const client = new Clslient(clientConfig);

function searchLog(params) {
  return new Promise((resolve, reject) => {
    client.SearchLog(params).then(
      (data) => resolve(data),
      (error) => reject(error)
    );
  });
}

module.exports = searchLog;
