<template>
  <div>
    <div class="device-list">
      <div class="device-item"></div>
      <label class="device" for="">摄像头</label>
      <select>
        <option>1</option>
        <option>1</option>
      </select>
    </div>
  </div>
</template>

<script>
import TRTC from "../libs/trtc-sdk-v5@5.5.0/trtc";

export default {
  data() {
    return {};
  },
  created() {
    this.isSupported();
    this.initDevice();
  },
  mounted() {
    // console.log(TRTC);
  },
  methods: {
    isSupported() {
      TRTC.isSupported().then((checkResult) => {
        if (!checkResult.result) {
        }
      });
    },
    initDevice() {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: true,
        })
        .then((stream) => {
          stream?.getTracks().forEach((track) => track.stop());
        })
        .catch((error) => {
          console.error(error.name, "111", error.message);
        });

      const updateDevice = async () => {
        const cameras = await TRTC.getCameraList();
        cameras?.forEach((camera) => {
          console.log(camera);
        });

        const microphones = await TRTC.getMicrophoneList();
        microphones.forEach((microphone) => {});
      };

      updateDevice();

      // 监听设备更换
      navigator.mediaDevices.addEventListener("devicechange", function () {
        updateDevice();
      });
    },
  },
};
</script>

<style>
.device-list {
}

.device {
}
</style>
