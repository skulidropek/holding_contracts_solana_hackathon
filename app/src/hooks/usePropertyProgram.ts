// CHANGE: Wrap Anchor provider/program wiring inside a hook for reuse across UI components.
// WHY: Frontend requests rely on the same connection/provider config that Anchor CLI uses.
// QUOTE(TЗ): "а можеш реализовать готовый фронтенд? Используй React, Vite. Пиши на тайп скрипт"
// REF: USER-FRONTEND
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../idl/property_shares.json";
import type { PropertyShares } from "../idl/property_shares_type";

interface ReadonlyWallet extends Wallet {
  readonly publicKey: PublicKey;
  readonly payer: Keypair;
}

const createReadonlyWallet = (): ReadonlyWallet => {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey,
    payer: keypair,
    signTransaction: async () => {
      throw new Error("Read-only wallet cannot sign transactions.");
    },
    signAllTransactions: async () => {
      throw new Error("Read-only wallet cannot sign transactions.");
    },
  };
};

export const usePropertyProgram = (): {
  program: Program<PropertyShares> | null;
  provider: AnchorProvider | null;
} => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const provider = useMemo(() => {
    if (!connection) {
      return null;
    }
    const wallet = anchorWallet ?? createReadonlyWallet();
    return new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions(),
    );
  }, [anchorWallet, connection]);

  const program = useMemo(() => {
    if (!provider) {
      return null;
    }
    return new Program<PropertyShares>(idl as PropertyShares, provider);
  }, [provider]);

  return { program, provider };
};
