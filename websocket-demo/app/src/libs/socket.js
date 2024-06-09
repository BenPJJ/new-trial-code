class Socket {
  constructor(options) {
    // 要连接的后端地址
    this.url = options.url;

    // 接收到消息后执行的方法
    this.callback = options.received;

    this.ws = null;

    // 当前状态
    this.status = null;

    this.pingInterval = null;

    // 心跳检测频率
    this.timeout = 3000;

    this.isHeart = options.isHeart;
    this.isReconnection = options.isReconnection;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    // 建立连接
    this.ws.onopen = (e) => {
      this.status = "open";
      console.log("连接成功", e);

      if (this.isHeart) {
        // 心跳
        this.heartCheck();
      }
    };

    // 接受服务器返回的信息
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.data.type !== "pong") {
        this.callback && this.callback(e.data);
      }
    };

    // 关闭连接
    this.ws.onclose = (e) => {
      console.log("关闭连接", e);
      this.closeSocket(e);
    };

    // 报错
    this.ws.onerror = (e) => {
      console.log("连接报错", e);
      this.closeSocket(e);
    };
  }

  sendMsg(data) {
    const msg = JSON.stringify(data);
    return this.ws.send(msg);
  }

  heartCheck() {
    this.pingInterval = setInterval(() => {
      if (this.ws.readyState === 1) {
        this.sendMsg({ type: "ping" });
      }
    }, this.timeout);
  }

  resetHeart() {
    clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  closeSocket(e) {
    this.resetHeart();

    if (this.status !== "close") {
      console.log("断开重连", e);
      if (this.isReconnection) {
        //重连
        this.connect();
      }
    } else {
      console.log("关闭连接", e);
    }
  }

  close() {
    this.status = "close";
    this.resetHeart();
    this.ws.close();
  }
}

export default Socket;
