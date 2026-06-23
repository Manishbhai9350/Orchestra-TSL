import { defineConfig } from "vite";
import ViteGlsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [ViteGlsl()],
});
