// CHANGE: Wrap the SPA with Solana wallet providers for devnet access.
// WHY: Without these providers the React components cannot perform Anchor RPC calls.
// QUOTE(TZ): "Can you build a finished frontend? Use React, Vite. Write it in TypeScript"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Translate initialization comments to English for localization.
// WHY: Provider bootstrapping instructions must remain readable without Russian text.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
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
// WHY: Vite externalizes Buffer, so we must manually expose the references for the frontend bundle.
// QUOTE(TZ): "Here is what I got ... Buffer is not defined"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Translate polyfill rationale to English per localization invariant.
// WHY: Runtime troubleshooting notes must be consistent for all developers.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
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
