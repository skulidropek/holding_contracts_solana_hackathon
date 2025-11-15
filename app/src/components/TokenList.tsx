// CHANGE: Show an aggregated view of wallet token balances so пользователю понятно, какие токены появились.
// WHY: После buy_shares человек видит только "Unknown" в Phantom, поэтому в UI отображаем mint, символ и количество.
// QUOTE(TЗ): "А ты можешь сделать что бы мы отображали всю информацию включая токены которые есть"
// REF: USER-FRONTEND
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
        <h2>Ваши токены</h2>
        <p>Балансы берутся напрямую c devnet RPC.</p>
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
