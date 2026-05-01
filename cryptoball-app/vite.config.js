import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ["node_modules/**", "dist/**", ".vitest-coverage-src/**"],
    environment: "jsdom",
    globals: true,
    coverage: {
      reporter: ["text", "html"],
    },
    setupFiles: "./src/test/setup.ts",
  },
});
