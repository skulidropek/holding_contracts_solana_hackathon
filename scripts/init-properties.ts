import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import fs from "node:fs/promises";
import path from "node:path";
import { PropertyShares } from "../target/types/property_shares";

// CHANGE: Batch initializer reads JSON config and calls init_property per entry.
// WHY: Users requested удобный способ описать несколько токенов через конфиг.
// QUOTE(TЗ): "Можем иметь JSON конфиг ... в котором будут описаны все токены"
// REF: USER-ARCH
// SOURCE: n/a

type PropertyConfig = {
  propertyId: string;
  totalShares: number;
  metadataUri: string;
  pricePerShare: number;
  usdcMint: string;
};

const PROPERTY_SEED = Buffer.from("property");
const VAULT_SEED = Buffer.from("vault");
const POOL_SEED = Buffer.from("pool");
const MINT_SEED = Buffer.from("property_mint");

const CONFIG_PATH = path.resolve(__dirname, "../config/properties.json");

async function loadConfig(): Promise<PropertyConfig[]> {
  const raw = await fs.readFile(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw) as PropertyConfig[];
  return parsed;
}

function derivePropertyPda(programId: PublicKey, propertyId: string): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [PROPERTY_SEED, Buffer.from(propertyId)],
    programId,
  );
  return pda;
}

function deriveMintPda(programId: PublicKey, property: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [MINT_SEED, property.toBuffer()],
    programId,
  );
  return pda;
}

function deriveVaultPda(programId: PublicKey, property: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [VAULT_SEED, property.toBuffer()],
    programId,
  );
  return pda;
}

function derivePoolPda(programId: PublicKey, property: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [POOL_SEED, property.toBuffer()],
    programId,
  );
  return pda;
}

async function main(): Promise<void> {
  const configs = await loadConfig();
  if (configs.length === 0) {
    console.log("Config empty – nothing to initialize.");
    return;
  }

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.propertyShares as Program<PropertyShares>;

  for (const entry of configs) {
    console.log(`\n⛳ Initializing property ${entry.propertyId}`);
    const propertyPda = derivePropertyPda(program.programId, entry.propertyId);
    const vaultPda = deriveVaultPda(program.programId, propertyPda);
    const poolPda = derivePoolPda(program.programId, propertyPda);
    const mintPda = deriveMintPda(program.programId, propertyPda);

    const usdcMint = new PublicKey(entry.usdcMint);
    const vaultSharesAta = getAssociatedTokenAddressSync(mintPda, vaultPda, true);
    const vaultUsdcAta = getAssociatedTokenAddressSync(usdcMint, vaultPda, true);
    const poolUsdcAta = getAssociatedTokenAddressSync(usdcMint, poolPda, true);

    try {
      await program.methods
        .initProperty(
          entry.propertyId,
          new BN(entry.totalShares),
          entry.metadataUri,
          new BN(entry.pricePerShare),
        )
        .accountsStrict({
          authority: provider.wallet.publicKey,
          property: propertyPda,
          vault: vaultPda,
          pool: poolPda,
          mint: mintPda,
          usdcMint,
          vaultSharesAta,
          vaultUsdcAta,
          poolUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();
      console.log(`✅ Property ${entry.propertyId} initialized (mint ${mintPda.toBase58()})`);
    } catch (error) {
      console.error(`❌ Failed to init ${entry.propertyId}:`, (error as Error).message);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error while initializing properties", error);
  process.exit(1);
});
