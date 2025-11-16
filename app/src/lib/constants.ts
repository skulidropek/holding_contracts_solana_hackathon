// CHANGE: Centralize frontend constants to keep blockchain configuration deterministic.
// WHY: React UI must share the same seeds/program identifiers as the on-chain contract to derive PDAs consistently.
// QUOTE(TZ): "Can you build a finished frontend? Use React, Vite. Write it in TypeScript"
// REF: USER-FRONTEND
// SOURCE: n/a
// CHANGE: Translate frontend commentary to English for localization compliance.
// WHY: Shared constants document invariants that every developer must understand in a single language.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
import { PublicKey } from "@solana/web3.js";

/** URL of the devnet RPC that mirrors Anchor.toml provider configuration. */
export const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

/** Address of the deployed property_shares program. */
export const PROGRAM_ID = new PublicKey(
  "Bvq9mwXmV95Mz848zK8FZ11JiKfLjGc7savK5u657H9Z",
);

export const PROPERTY_SEED = "property";
export const VAULT_SEED = "vault";
export const POOL_SEED = "pool";
export const MINT_SEED = "property_mint";
export const USER_REWARD_SEED = "user_reward";

/** SCALE constant reproduced from programs/property_shares/src/contract/constants.rs for reward math. */
export const ACC_SCALE = 1_000_000_000_000n;

/** SPL decimals used for the mocked USDC mint described in config/properties.json. */
export const USDC_DECIMALS = 6n;
