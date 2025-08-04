import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import "react";
import "react-dom";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  root: "./client",
  // optimizeDeps: {
  //
  // },
  build: {
    target: "esnext",
    minify: false,
    // sourcemap: true,
    commonjsOptions: {
      // Transform CommonJS to ESM more aggressively
      transformMixedEsModules: true,
      extensions: [".js", ".cjs"],
      // Needed for Node.js modules
      ignoreDynamicRequires: true,
    },
  },
  // esbuild: {
  //   supported: {
  //     "top-level-await": true, //browsers can handle top-level-await features
  //   },
  // },
  server: {
    port: 4001,
    open: true,
  },
  plugins: [
    react(),
    deno(),
    nodePolyfills({
      overrides: {
        // Since `fs` is not supported in browsers, we can use the `memfs` package to polyfill it.
        fs: "memfs",
        "node:fs": "memfs",
      },
    }),
    // topLevelAwait(),
    wasm(),
    viteStaticCopy({
      targets: [
        {
          src: "src/contract/src/managed/counter/keys/*",
          dest: "keys",
        },
        {
          src: "src/contract/src/managed/counter/zkir/*",
          dest: "zkir",
        },
      ],
    }),
  ],

  optimizeDeps: {
    exclude: ["@midnight-ntwrk/onchain-runtime"],
    include: [
      // "@midnight-ntwrk/midnight-js-network-id",
      "react/jsx-runtime",
      "npm:@midnight-ntwrk/compact-runtime",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
});
