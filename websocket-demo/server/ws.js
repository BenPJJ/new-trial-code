const websocket = require("ws");
const server = new websocket.Server({ port: 1234 });

server.on("open", () => {
  console.log("open");
});

server.on("close", () => {
  console.log("close");
});

server.on("connection", (ws, req) => {
  console.log("connection连接成功");

  ws.on("message", (data) => {
    server.clients.forEach((item) => {
      if (item.readyState === ws.OPEN) {
        item.send("" + data);
      }
    });
  });
});
