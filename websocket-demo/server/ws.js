const websocket = require("ws");
const https = require("https");
const runSchedule = require("./schedule/index");
const utils = require("./utils/index");

const port = 1234;

const wss = new websocket.Server({ port });

let onlineCount = 0;

// 客户端连接列表
const clients = new Map();
// 群组列表
const groups = new Map();

wss.on("open", () => {
  console.log("open");
});

wss.on("close", () => {
  console.log("close");
});

wss.on("connection", (ws, req) => {
  console.log("connection连接成功");

  // ---加群---
  // const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
  const clientId = utils.generateUniqueId();
  clients.set(clientId, ws);

  ws.on("join-group", (groupName) => {
    let group = groups.get(groupName);
    if (!group) {
      group = new Set();
      groups.set(groupName, group);
    }
    group.add(clientId);
  });

  onlineCount++;
  wss.clients.forEach((client) => {
    sendOnlineCount(client);
  });

  runSchedule(() => {
    sendOnlineCount(ws);
    sendRobot();
  });

  ws.on("message", (data) => {
    const msg = JSON.parse("" + data);

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ data: { type: "pong" } }));
    }

    wss.clients.forEach((client) => {
      if (msg.type === "msg") {
        client.send(JSON.stringify({ data: { ...msg } }));
      }
    });
  });

  ws.on("close", (ws) => {
    console.log("connection关闭连接");
    onlineCount--;
    wss.clients.forEach((client) => {
      sendOnlineCount(client);
    });
  });
});

function sendOnlineCount(ws) {
  ws.send(JSON.stringify({ data: { type: "system_msg", onlineCount } }));
}

runSchedule(() => {
  sendRobot();
});

function sendRobot() {
  const options = {
    hostname: "qyapi.weixin.qq.com",
    port: 443,
    path: "/cgi-bin/webhook/send?key=853307fd-f3a5-4947-8ff8-f76e30e76b36",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const postData = JSON.stringify({
    // 根据微信企业号机器人 API 要求的数据格式填写
    msgtype: "text",
    text: {
      content: "这是一条测试消息",
    },
  });

  const req = https.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);

    res.on("data", (chunk) => {
      console.log(`响应主体: ${chunk}`);
    });

    res.on("end", () => {
      console.log("没有更多数据");
    });
  });

  req.on("error", (e) => {
    console.error(`请求遇到问题: ${e.message}`);
  });

  req.write(postData);
  req.end();
}
