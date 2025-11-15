// CHANGE: Wrap the SPA with Solana wallet providers for devnet access.
// WHY: Без этих провайдеров React-компоненты не смогут выполнять Anchor RPC.
// QUOTE(TЗ): "а можеш реализовать готовый фронтенд? Используй React, Vite. Пиши на тайп скрипт"
// REF: USER-FRONTEND
import { StrictMode, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import App from "./App.tsx";
import "./index.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { DEVNET_ENDPOINT } from "./lib/constants.ts";
import { Buffer } from "buffer";
import process from "process";

// CHANGE: Polyfill Buffer/process for browser builds because SPL/Anchor libs expect Node globals.
// WHY: Vite внешнеализует buffer, поэтому нужно вручную пробросить ссылки для фронтенда.
// QUOTE(TЗ): "Вот что я получил ... Buffer is not defined"
// REF: USER-FRONTEND
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}
if (typeof globalThis.process === "undefined") {
  globalThis.process = process;
}
type BufferNamespace = typeof globalThis & {
  buffer?: {
    Buffer?: typeof Buffer;
  };
};
const globalWithBuffer = globalThis as BufferNamespace;
if (!globalWithBuffer.buffer) {
  globalWithBuffer.buffer = { Buffer };
} else if (!globalWithBuffer.buffer.Buffer) {
  globalWithBuffer.buffer.Buffer = Buffer;
}

export const RootApp = () => {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={DEVNET_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
);
