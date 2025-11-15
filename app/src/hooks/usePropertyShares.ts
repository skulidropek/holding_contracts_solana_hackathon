// CHANGE: Bundle state management and contract mutations for the React UI.
// WHY: Пользователь запросил фронтенд, который может читать состояние и вызывать инструкции buy/claim/deposit.
// QUOTE(TЗ): "а можеш реализовать готовый фронтенд? Используй React, Vite. Пиши на тайп скрипт"
// REF: USER-FRONTEND
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram, PublicKey, Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import configEntries from "../data/properties.json";
import type { PropertyShares } from "../idl/property_shares_type";
import {
  ACC_SCALE,
  USDC_DECIMALS,
} from "../lib/constants";
import {
  SPL_PROGRAM_ID,
  deriveCoreAddresses,
  deriveUserRewardAddress,
  makeAtaBundle,
} from "../lib/addresses";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { usePropertyProgram } from "./usePropertyProgram";

export interface PropertyConfig {
  propertyId: string;
  totalShares: number;
  metadataUri: string;
  tokenName: string;
  tokenSymbol: string;
  pricePerShare: number;
  usdcMint: string;
}

const CONFIGS = configEntries as PropertyConfig[];
const USDC_FACTOR = 10 ** Number(USDC_DECIMALS);

type WalletState = ReturnType<typeof useAnchorWallet>;

interface ActionContext {
  program: Program<PropertyShares>;
  wallet: NonNullable<WalletState>;
  provider: AnchorProvider;
}

export interface PropertyView {
  config: PropertyConfig;
  isInitialized: boolean;
  pricePerShareUi: number;
  availableShares: bigint;
  userShares: bigint;
  userUsdcBalance: bigint;
  userUsdcAta: PublicKey | null;
  userSharesAta: PublicKey | null;
  pendingRewards: bigint;
  isAuthority: boolean;
  addresses: ReturnType<typeof deriveCoreAddresses>;
  usdcMint: PublicKey;
  atas: ReturnType<typeof makeAtaBundle>;
}

export interface PropertyActions {
  properties: PropertyView[];
  loading: boolean;
  error: string | null;
  buyShares: (propertyId: string, amount: number) => Promise<void>;
  depositYield: (propertyId: string, microUsdc: number) => Promise<void>;
  claim: (propertyId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const fetchTokenAmount = async (
  connection: ReturnType<typeof useConnection>["connection"],
  address: PublicKey,
): Promise<bigint> => {
  try {
    const balance = await connection.getTokenAccountBalance(address);
    return BigInt(balance.value.amount);
  } catch {
    return 0n;
  }
};

const ensureAtaExists = async (
  connection: ReturnType<typeof useConnection>["connection"],
  provider: AnchorProvider,
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> => {
  const ata = getAssociatedTokenAddressSync(mint, owner);
  const info = await connection.getAccountInfo(ata);
  if (info) {
    return ata;
  }
  const ix = createAssociatedTokenAccountInstruction(
    provider.wallet.publicKey,
    ata,
    owner,
    mint,
  );
  const tx = new Transaction().add(ix);
  await provider.sendAndConfirm(tx);
  return ata;
};

export const usePropertyShares = (): PropertyActions => {
  const { program, provider } = usePropertyProgram();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [properties, setProperties] = useState<PropertyView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const ensureActionContext = (): ActionContext => {
    if (!program || !wallet || !provider) {
      throw new Error("Подключите кошелёк Phantom для выполнения транзакций.");
    }
    return { program, wallet, provider };
  };

  const refresh = useCallback(async () => {
    if (!program) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const views = await Promise.all(
        CONFIGS.map(async (config) => {
          const addresses = deriveCoreAddresses(config.propertyId);
          const usdcMint = new PublicKey(config.usdcMint);
          const atas = makeAtaBundle(
            addresses.mint,
            usdcMint,
            addresses.vault,
            addresses.pool,
          );
          const propertyAccount =
            await program.account.property.fetchNullable(addresses.property);
          if (!propertyAccount) {
            return {
              config,
              isInitialized: false,
              pricePerShareUi: config.pricePerShare / USDC_FACTOR,
              availableShares: 0n,
              userShares: 0n,
               userUsdcBalance: 0n,
               userUsdcAta: null,
               userSharesAta: null,
              pendingRewards: 0n,
              isAuthority: false,
              addresses,
              usdcMint,
              atas,
            };
          }

          const vaultBalance = await fetchTokenAmount(
            connection,
            atas.vaultSharesAta,
          );

          const userShareAta =
            wallet?.publicKey !== undefined
              ? atas.userSharesAta(wallet.publicKey)
              : null;
          const userUsdcAta =
            wallet?.publicKey !== undefined
              ? atas.userUsdcAta(wallet.publicKey)
              : null;
          const userBalance =
            userShareAta !== null
              ? await fetchTokenAmount(connection, userShareAta)
              : 0n;
          const userUsdcBalance =
            userUsdcAta !== null
              ? await fetchTokenAmount(connection, userUsdcAta)
              : 0n;

          const poolAccount = await program.account.pool.fetch(addresses.pool);
          const userReward =
            wallet?.publicKey !== undefined
              ? await program.account.userReward.fetchNullable(
                  deriveUserRewardAddress(addresses.pool, wallet.publicKey),
                )
              : null;

          const accPerShare = BigInt(poolAccount.accPerShare.toString());
          const paidPerShare =
            userReward !== null
              ? BigInt(userReward.paidPerShare.toString())
              : 0n;
          const positiveDelta =
            accPerShare > paidPerShare ? accPerShare - paidPerShare : 0n;
          const pending =
            wallet?.publicKey !== undefined && userBalance > 0n
              ? (positiveDelta * userBalance) / ACC_SCALE
              : 0n;

          return {
            config,
            isInitialized: true,
            pricePerShareUi: config.pricePerShare / USDC_FACTOR,
            availableShares: vaultBalance,
            userShares: userBalance,
            userUsdcBalance,
            userUsdcAta,
            userSharesAta: userShareAta,
            pendingRewards: pending,
            isAuthority:
              wallet?.publicKey !== undefined &&
              wallet.publicKey.equals(propertyAccount.authority),
            addresses,
            usdcMint,
            atas,
          };
        }),
      );
      setProperties(views);
    } catch (refreshError) {
      setError((refreshError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [connection, program, wallet?.publicKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const findView = (propertyId: string): PropertyView => {
    const view = properties.find(
      (item) => item.config.propertyId === propertyId,
    );
    if (!view) {
      throw new Error("Не удалось найти указанный propertyId.");
    }
    if (!view.isInitialized) {
      throw new Error("Property ещё не инициализирован on-chain.");
    }
    return view;
  };

  const runAction = async (action: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const buyShares = async (propertyId: string, amount: number) => {
    await runAction(async () => {
      if (amount <= 0) {
        throw new Error("Количество долей должно быть больше нуля.");
      }
      const { program: liveProgram, wallet: liveWallet, provider: liveProvider } =
        ensureActionContext();
      const view = findView(propertyId);
      const userUsdcAta = await ensureAtaExists(
        connection,
        liveProvider,
        view.usdcMint,
        liveWallet.publicKey,
      );
      const userSharesAta = await ensureAtaExists(
        connection,
        liveProvider,
        view.addresses.mint,
        liveWallet.publicKey,
      );
      await liveProgram.methods
        .buyShares(new BN(amount))
        .accountsStrict({
          property: view.addresses.property,
          vault: view.addresses.vault,
          mint: view.addresses.mint,
          usdcMint: view.usdcMint,
          vaultSharesAta: view.atas.vaultSharesAta,
          vaultUsdcAta: view.atas.vaultUsdcAta,
          user: liveWallet.publicKey,
          userUsdcAta,
          userSharesAta,
          tokenProgram: SPL_PROGRAM_ID,
        })
        .rpc();
    });
  };

  const depositYield = async (propertyId: string, microUsdc: number) => {
    await runAction(async () => {
      if (microUsdc <= 0) {
        throw new Error("Сумма депозита должна быть положительной.");
      }
      const { program: liveProgram, wallet: liveWallet, provider: liveProvider } =
        ensureActionContext();
      const view = findView(propertyId);
      if (!view.isAuthority) {
        throw new Error("Только authority может депонировать доход.");
      }
      const authorityUsdcAta = await ensureAtaExists(
        connection,
        liveProvider,
        view.usdcMint,
        liveWallet.publicKey,
      );
      await liveProgram.methods
        .depositYield(new BN(microUsdc))
        .accountsStrict({
          authority: liveWallet.publicKey,
          property: view.addresses.property,
          pool: view.addresses.pool,
          mint: view.addresses.mint,
          usdcMint: view.usdcMint,
          authorityUsdcAta,
          poolUsdcAta: view.atas.poolUsdcAta,
          tokenProgram: SPL_PROGRAM_ID,
        })
        .rpc();
    });
  };

  const claim = async (propertyId: string) => {
    await runAction(async () => {
      const { program: liveProgram, wallet: liveWallet, provider: liveProvider } =
        ensureActionContext();
      const view = findView(propertyId);
      if (view.userShares === 0n) {
        throw new Error("Нет долей для получения дохода.");
      }
      const userSharesAta = await ensureAtaExists(
        connection,
        liveProvider,
        view.addresses.mint,
        liveWallet.publicKey,
      );
      const userUsdcAta = await ensureAtaExists(
        connection,
        liveProvider,
        view.usdcMint,
        liveWallet.publicKey,
      );
      await liveProgram.methods
        .claim()
        .accountsStrict({
          user: liveWallet.publicKey,
          property: view.addresses.property,
          pool: view.addresses.pool,
          userReward: deriveUserRewardAddress(
            view.addresses.pool,
            liveWallet.publicKey,
          ),
          userSharesAta,
          userUsdcAta,
          poolUsdcAta: view.atas.poolUsdcAta,
          mint: view.addresses.mint,
          usdcMint: view.usdcMint,
          tokenProgram: SPL_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });
  };

  return {
    properties,
    loading,
    error,
    buyShares,
    depositYield,
    claim,
    refresh,
  };
};
