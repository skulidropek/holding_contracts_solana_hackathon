// CHANGE: Present a single property's state along with buy/deposit/claim controls.
// WHY: The user asked for a web UI to manage tokens without the CLI.
// QUOTE(TZ): "Can you build a finished frontend? Use React, Vite. Write it in TypeScript"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Translate card UI text to English to satisfy localization.
// WHY: All user-facing instructions must live in one language for clarity.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
import { useState } from "react";
import type { FormEvent } from "react";
import { USDC_DECIMALS } from "../lib/constants";
import type { PropertyView } from "../hooks/usePropertyShares";

const MICRO_FACTOR = 10 ** Number(USDC_DECIMALS);

export interface PropertyCardProps {
  view: PropertyView;
  onBuyShares: (amountShares: number) => Promise<void>;
  onDepositYield: (microUsdc: number) => Promise<void>;
  onClaim: () => Promise<void>;
  walletConnected: boolean;
}

export const PropertyCard = ({
  view,
  onBuyShares,
  onDepositYield,
  onClaim,
  walletConnected,
}: PropertyCardProps) => {
  const [sharesInput, setSharesInput] = useState("1");
  const [depositInput, setDepositInput] = useState("0.1");
  const [message, setMessage] = useState<string | null>(null);

  const handleBuy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(sharesInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setMessage("Enter a valid share amount.");
      return;
    }
    try {
      await onBuyShares(parsed);
      setMessage(`Requested purchase of ${parsed} shares.`);
    } catch (buyError) {
      setMessage((buyError as Error).message);
    }
  };

  const handleDeposit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(depositInput);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setMessage("Enter a yield amount in USDC.");
      return;
    }
    const micro = Math.round(parsed * MICRO_FACTOR);
    try {
      await onDepositYield(micro);
      setMessage(`Sent deposit of ${parsed.toFixed(2)} USDC.`);
    } catch (depositError) {
      setMessage((depositError as Error).message);
    }
  };

  const handleClaim = async () => {
    try {
      await onClaim();
      setMessage("Payout submitted successfully.");
    } catch (claimError) {
      setMessage((claimError as Error).message);
    }
  };

  const pendingUi = Number(view.pendingRewards) / MICRO_FACTOR;

  return (
    <section className="card">
      <header className="card__header">
        <div>
          <p className="card__eyebrow">
            {view.config.tokenSymbol} • {view.config.propertyId}
          </p>
          <h2 className="card__title">
            {view.isInitialized
              ? view.config.tokenName
              : "Requires init_property"}
          </h2>
        </div>
        <a
          href={view.config.metadataUri}
          target="_blank"
          rel="noreferrer"
          className="card__link"
        >
          Metadata
        </a>
      </header>

      <dl className="card__stats">
        <div>
          <dt>Price per share</dt>
          <dd>{view.pricePerShareUi.toFixed(2)} USDC</dd>
        </div>
        <div>
          <dt>Available shares</dt>
          <dd>{view.availableShares.toString()}</dd>
        </div>
        <div>
          <dt>Your shares</dt>
          <dd>{view.userShares.toString()}</dd>
        </div>
        <div>
          <dt>USDC balance</dt>
          <dd>{(Number(view.userUsdcBalance) / MICRO_FACTOR).toFixed(4)}</dd>
        </div>
        <div>
          <dt>Pending yield</dt>
          <dd>{pendingUi.toFixed(4)} USDC</dd>
        </div>
      </dl>

      <div className="card__info">
        <p>
          <strong>Share mint:</strong>{" "}
          <code>{view.addresses.mint.toBase58()}</code>
        </p>
        <p>
          <strong>USDC Mint:</strong>{" "}
          <code>{view.usdcMint.toBase58()}</code>
        </p>
        {view.userSharesAta && (
          <p>
            <strong>Your share ATA:</strong>{" "}
            <code>{view.userSharesAta.toBase58()}</code>
          </p>
        )}
        {view.userUsdcAta && (
          <p>
            <strong>Your USDC ATA:</strong>{" "}
            <code>{view.userUsdcAta.toBase58()}</code>
          </p>
        )}
      </div>

      {message && <p className="card__message">{message}</p>}

      <form className="card__form" onSubmit={handleBuy}>
        <label>
          Buy shares
          <input
            type="number"
            min={1}
            step={1}
            value={sharesInput}
            onChange={(event) => setSharesInput(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={!walletConnected || !view.isInitialized}
        >
          Buy
        </button>
      </form>

      <form className="card__form" onSubmit={handleDeposit}>
        <label>
          Deposit yield (USDC)
          <input
            type="number"
            min="0"
            step="0.01"
            value={depositInput}
            onChange={(event) => setDepositInput(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={!walletConnected || !view.isAuthority}
        >
          Send yield
        </button>
      </form>

      <button
        className="card__action"
        type="button"
        onClick={() => void handleClaim()}
        disabled={!walletConnected || view.userShares === 0n}
      >
        Claim yield
      </button>
    </section>
  );
};
