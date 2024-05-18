<template>
  <div class="chat">
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
        <li v-for="item in list" :key="item">{{ item.msg }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputVal: "",
      list: [],
    };
  },
  mounted() {
    this.initWs();
  },
  methods: {
    send() {
      const msgToJson = JSON.stringify({ msg: this.inputVal });
      this.ws.send(msgToJson);
      this.inputVal = "";
    },
    initWs() {
      const ws = new WebSocket("ws://localhost:1234");
      this.ws = ws;
      ws.open = () => {
        console.log("连接成功");
      };

      ws.onerror = (err) => {
        console.log("连接失败：", err);
      };

      ws.onclose = (res) => {
        console.log("连接关闭：", res);
      };

      ws.onmessage = (event) => {
        console.log("通信：", event);

        const info = JSON.parse(event?.data);

        this.list.push(info);
      };
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
