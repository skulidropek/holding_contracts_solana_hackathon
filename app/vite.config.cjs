// CHANGE: CommonJS Vite config to avoid `exports` errors when `type` is module.
// WHY: Vite bundles TS configs as CJS; with package type=module Node rejects `exports`.
// REF: build failure "exports is not defined in ES module scope".
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");
const { nodePolyfills } = require("vite-plugin-node-polyfills");

module.exports = defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      include: ["buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer", "process"],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
