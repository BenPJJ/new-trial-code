import { defineConfig } from "vite";
import commonjs from "vite-plugin-commonjs";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/voice/index.js",
      name: "voice",
      fileName: "voice",
    },
  },
  plugins: [commonjs()],
});
