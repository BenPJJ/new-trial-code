<template>
  <div id="app">
    <button
      ref="floatingButton"
      class="floating-button"
      @mousedown="startDrag"
      style="position: fixed"
    >
      拖动我
    </button>
  </div>
</template>

<script>
export default {
  methods: {
    startDrag(event) {
      event.preventDefault();
      const button = this.$refs.floatingButton;

      // 记录初始位置
      let startX = event.clientX || event.touches[0].clientX;
      let startY = event.clientY || event.touches[0].clientY;

      console.log("startX:", startX, "startY:", startY);

      // 监听移动事件
      const moveListener = (moveEvent) => {
        console.log(
          "moveEvent.clientX || moveEvent.touches[0].clientX",
          moveEvent.clientX || moveEvent.touches[0].clientX
        );
        console.log(
          "moveEvent.clientY || moveEvent.touches[0].clientY",
          moveEvent.clientY || moveEvent.touches[0].clientY
        );
        // 计算移动的偏移量
        const moveX =
          (moveEvent.clientX || moveEvent.touches[0].clientX) - startX;
        const moveY =
          (moveEvent.clientY || moveEvent.touches[0].clientY) - startY;

        startX = 0;
        startY = 0;

        // 更新按钮位置
        button.style.transform = `translate(${moveX}px, ${moveY}px)`;
      };

      // 监听结束移动事件
      const upListener = () => {
        // 移除事件监听
        document.removeEventListener("mousemove", moveListener);
        document.removeEventListener("mouseup", upListener);
        // document.removeEventListener("touchmove", moveListener);
        // document.removeEventListener("touchend", upListener);
      };

      // 添加事件监听
      document.addEventListener("mousemove", moveListener);
      document.addEventListener("mouseup", upListener);
      // document.addEventListener("touchmove", moveListener);
      // document.addEventListener("touchend", upListener);
    },
  },
};
</script>

<style>
.floating-button {
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 50px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
  user-select: none;
  z-index: 1000;
}
</style>
