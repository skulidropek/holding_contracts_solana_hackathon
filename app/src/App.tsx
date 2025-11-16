// CHANGE: Replace the Vite placeholder with a Solana dashboard for property_shares.
// WHY: The user wants to exercise the business logic (buy/deposit/claim) via the browser.
// QUOTE(TZ): "Can you build a finished frontend? Use React, Vite. Write it in TypeScript"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Localize UI strings to English as requested.
// WHY: Keeping all visible copy in English ensures consistent user experience per the localization invariant.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { PropertyCard } from "./components/PropertyCard";
import { TokenList } from "./components/TokenList";
import { usePropertyShares } from "./hooks/usePropertyShares";
import { USDC_DECIMALS } from "./lib/constants";
import "./App.css";

const App = () => {
  const wallet = useAnchorWallet();
  const { properties, loading, error, buyShares, depositYield, claim, refresh } =
    usePropertyShares();

  const walletTokens = useMemo(() => {
    const map = new Map<
      string,
      { label: string; balance: bigint; decimals: number }
    >();
    const pushToken = (
      mint: string,
      label: string,
      amount: bigint,
      decimals: number,
    ) => {
      const existing = map.get(mint);
      if (existing) {
        existing.balance += amount;
      } else {
        map.set(mint, { label, balance: amount, decimals });
      }
    };

    properties.forEach((view) => {
      pushToken(
        view.addresses.mint.toBase58(),
        `${view.config.tokenSymbol} (${view.config.tokenName})`,
        view.userShares,
        0,
      );
      pushToken(
        view.usdcMint.toBase58(),
        `USDC (${view.config.propertyId})`,
        view.userUsdcBalance,
        Number(USDC_DECIMALS),
      );
    });

    return Array.from(map.entries())
      .filter(([, data]) => data.balance > 0n)
      .map(([mint, data]) => ({
        mint,
        label: data.label,
        balance: (Number(data.balance) / 10 ** data.decimals).toFixed(6),
      }));
  }, [properties]);

  return (
    <main className="app">
      <header className="app__header">
        <div>
          <p className="app__eyebrow">property_shares</p>
          <h1>Devnet control panel</h1>
          <p>You can buy shares, deposit income, and claim rewards here.</p>
        </div>
        <WalletMultiButton className="wallet-button" />
      </header>

      <section className="app__toolbar">
        <button onClick={() => void refresh()} disabled={loading}>
          Refresh state
        </button>
        <span>
          {wallet
            ? `Phantom: ${wallet.publicKey.toBase58()}`
            : "Connect Phantom"}
        </span>
      </section>

      {loading && <p className="app__status">Loading network state...</p>}
      {error && <p className="app__error">{error}</p>}

      {wallet && <TokenList tokens={walletTokens} />}

      <div className="app__grid">
        {properties.map((view) => (
          <PropertyCard
            key={view.config.propertyId}
            view={view}
            walletConnected={wallet !== null && wallet !== undefined}
            onBuyShares={(amount) => buyShares(view.config.propertyId, amount)}
            onDepositYield={(micro) =>
              depositYield(view.config.propertyId, micro)
            }
            onClaim={() => claim(view.config.propertyId)}
          />
        ))}
      </div>
    </main>
  );
};

export default App;
