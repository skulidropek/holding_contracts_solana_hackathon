// CHANGE: Show an aggregated view of wallet token balances so the user understands which tokens appeared.
// WHY: After calling buy_shares Phantom shows only "Unknown", so we display mint, symbol, and amount in the UI.
// QUOTE(TZ): "Can you show all the information including which tokens exist"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Translate token list UI copy to English for localization.
// WHY: Wallet summary text must follow the single-language invariant.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
import "./TokenList.css";

export interface TokenSummary {
  mint: string;
  label: string;
  balance: string;
}

export interface TokenListProps {
  tokens: TokenSummary[];
}

export const TokenList = ({ tokens }: TokenListProps) => {
  if (tokens.length === 0) {
    return null;
  }
  return (
    <section className="token-panel">
      <header>
        <h2>Your tokens</h2>
        <p>Balances are fetched directly from the devnet RPC.</p>
      </header>
      <ul>
        {tokens.map((token) => (
          <li key={token.mint}>
            <div>
              <span className="token-label">{token.label}</span>
              <code className="token-mint">{token.mint}</code>
            </div>
            <span className="token-balance">{token.balance}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
