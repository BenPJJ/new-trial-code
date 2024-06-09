<template>
  <div class="chat">
    <div>在线人数：{{ onlineCount }}</div>
    <div class="send">
      <input
        v-model="inputVal"
        class="send-input"
        type="text"
        placeholder="请输出内容"
      />
      <button class="send-button" @click="send">发送</button>
    </div>
    <div class="discuss">
      <ul>
        <li v-for="item in list" :key="item">{{ item }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import Socket from "../libs/socket";

export default {
  data() {
    return {
      inputVal: "",
      list: [],
      isAlreadyInit: false,
      onlineCount: 0,
    };
  },
  mounted() {
    this.initWs();
  },
  destroyed() {
    this.ws.close();
    this.ws = null;
  },
  methods: {
    send() {
      this.ws.sendMsg({ type: "msg", data: this.inputVal });
      this.inputVal = "";
    },
    initWs() {
      if (this.isAlreadyInit) return;
      this.ws = new Socket({
        url: "ws://localhost:1234",
        isHeart: true,
        isReconnection: false,
        received: (data) => {
          const msg = JSON.parse(data);
          console.error(msg);

          if (msg?.data?.type === "msg") {
            console.error("msg", msg.data.data);
            this.list.push(msg.data.data);
          }

          if (msg?.data?.type === "system_msg") {
            this.onlineCount = msg.data.onlineCount;
          }
        },
      });

      this.ws.connect();

      this.isAlreadyInit = true;
    },
  },
};
</script>

<style scoped>
.chat {
  width: 500px;
  height: 600px;
  border: 1px solid #333;
  margin: 0 auto;
}
.send {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #333;
}
.send-input {
  width: 60%;
  height: 40%;
}
.send-button {
  width: 20%;
  height: 40%;
  margin-left: 16px;
}
.discuss {
  width: 90%;
  height: 60%;
  border: 1px solid #999;
  margin: 16px auto 0;
}
</style>
