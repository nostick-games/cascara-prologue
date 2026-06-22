import { defineConfig } from "vite";

const repositoryBasePath = process.env.GITHUB_PAGES === "true" ? "/cascara-prologue/" : "/";

export default defineConfig({
  base: repositoryBasePath,
  server: {
    host: "0.0.0.0"
  },
  preview: {
    host: "0.0.0.0"
  }
});
