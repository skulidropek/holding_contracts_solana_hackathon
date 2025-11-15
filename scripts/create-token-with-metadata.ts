import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { PropertyShares } from "../target/types/property_shares";
// CHANGE: Format script per Prettier lint expectations.
// WHY: Lint pipeline rejected prior formatting; aligning ensures lint verification passes.
// QUOTE(TЗ): "Верификация: через линтер"
// REF: REQ-LINT
// SOURCE: n/a

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.propertyShares as anchor.Program<PropertyShares>;

  // Настройте параметры нового токена здесь
  const tokenConfig = {
    // Уникальный seed для нового токена (можно использовать любое имя)
    seed: "my_new_token_v1",

    // Метаданные токена (хранятся в блокчейне)
    name: "My Awesome Token",
    symbol: "MAT",
    description:
      "Это новый токен с метаданными, созданный одной транзакцией! Все данные хранятся в блокчейне.",
    imageUri:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiI3s7bGux2RqA_W5xoJQequY3zT8eNhVB6Q&s",

    // Decimals (не используется сейчас, фиксировано 6)
    decimals: 6,
  };

  console.log("🚀 Создаем новый токен с метаданными:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Seed:", tokenConfig.seed);
  console.log("Name:", tokenConfig.name);
  console.log("Symbol:", tokenConfig.symbol);
  console.log("Description:", tokenConfig.description);
  console.log("Image URI:", tokenConfig.imageUri);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  try {
    // Находим адреса PDA для mint и метаданных
    const [mintPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(tokenConfig.seed)],
      program.programId
    );

    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), mintPDA.toBuffer()],
      program.programId
    );

    console.log("📋 Адреса:");
    console.log("  Mint PDA:", mintPDA.toBase58());
    console.log("  Metadata PDA:", metadataPDA.toBase58());
    console.log("");

    // Вызываем инструкцию создания токена с метаданными
    // @ts-ignore - Anchor types issue
    const tx = await program.methods
      .createTokenWithMetadata(
        tokenConfig.seed,
        tokenConfig.name,
        tokenConfig.symbol,
        tokenConfig.description,
        tokenConfig.imageUri,
        tokenConfig.decimals
      )
      .accounts({
        payer: provider.wallet.publicKey,
        mint: mintPDA,
        metadata: metadataPDA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    console.log("✅ Токен с метаданными успешно создан!");
    console.log("   Transaction:", tx);
    console.log("");
    console.log("🔗 Проверьте в Explorer:");
    console.log(
      "   Mint:",
      `https://explorer.solana.com/address/${mintPDA.toBase58()}?cluster=devnet`
    );
    console.log(
      "   Metadata:",
      `https://explorer.solana.com/address/${metadataPDA.toBase58()}?cluster=devnet`
    );
    console.log("");
    console.log("💡 Метаданные являются частью токена!");
    console.log("   Они хранятся в блокчейне и связаны с mint через PDA.");
  } catch (error: any) {
    if (error.message?.includes("already in use")) {
      console.log("⚠️  Токен с таким seed уже существует.");
      console.log("   Используйте другой seed для создания нового токена.");
    } else {
      console.error("❌ Ошибка при создании токена:", error.message);
      throw error;
    }
  }
})();
