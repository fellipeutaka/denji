import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts"],
  outDir: "./dist",
  target: "es2024",
  format: "esm",
  minify: true,
  clean: true,
  platform: "node",
  tsconfig: true,
});
