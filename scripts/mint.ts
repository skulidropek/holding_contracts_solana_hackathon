import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PropertyShares } from "../target/types/property_shares";
// CHANGE: Normalize formatting to satisfy Prettier lint.
// WHY: `yarn lint` flagged this script; matching formatter unblocks verification invariant.
// QUOTE(TЗ): "Верификация: через линтер"
// REF: REQ-LINT
// SOURCE: n/a

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.propertyShares as anchor.Program<PropertyShares>;
  const payer = provider.wallet.publicKey;

  // PDA mint'а — те же сиды, что в Rust: seeds = [b"meme_mint"]
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("meme_mint")],
    program.programId
  );

  console.log("Program ID:", program.programId.toBase58());
  console.log("Mint PDA: ", mintPda.toBase58());
  console.log("Payer: ", payer.toBase58());

  // 1) Создаём mint (один раз)
  try {
    // mint PDA будет автоматически разрешен Anchor по seeds = [b"meme_mint"]
    await program.methods
      .createMemeMint()
      .accounts({
        payer,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log("✅ create_meme_mint: Mint создан успешно");
  } catch (e: any) {
    const errorMessage = e?.message || String(e);
    const errorLogs = e?.transactionLogs || [];

    // Проверяем, если ошибка связана с тем, что аккаунт уже существует
    if (
      errorMessage.includes("already in use") ||
      errorLogs.some((log: string) => log.includes("already in use"))
    ) {
      console.log(
        "ℹ️  create_meme_mint: Mint уже существует, пропускаем создание"
      );
    } else {
      console.log("⚠️  create_meme_mint: Ошибка при создании mint");
      console.log("   Детали:", errorMessage.substring(0, 200));
    }
  }

  // 2) ATA под наш mint
  const userAta = getAssociatedTokenAddressSync(
    mintPda,
    payer,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  console.log("User ATA:", userAta.toBase58());

  // 3) Минтим 1_000_000 base units (при decimals = 6 → 1.000000 токен)
  const amount = 1_000_000;

  console.log(
    `\n🪙  Минтим ${amount.toLocaleString()} base units (1.000000 MEME)...`
  );

  try {
    // mint и userAta PDA будут автоматически разрешены Anchor по их seeds
    await program.methods
      .mintMeme(new anchor.BN(amount))
      .accounts({
        payer,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    console.log(
      `✅ Успешно заминчено ${amount.toLocaleString()} base units (1.000000 MEME)`
    );
    console.log(`   ATA адрес: ${userAta.toBase58()}`);
  } catch (e: any) {
    console.error("❌ Ошибка при минтинге:", e?.message || String(e));
    throw e;
  }
})();
