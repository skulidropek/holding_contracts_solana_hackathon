import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PropertyShares } from "../target/types/property_shares";
// CHANGE: Normalized formatting per Prettier requirements.
// WHY: Lint gate failed; aligning with formatter is required by verification invariant.
// QUOTE(TЗ): "Верификация: через линтер"
// REF: REQ-LINT
// SOURCE: n/a

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.propertyShares as anchor.Program<PropertyShares>;

  // Адрес вашего mint
  const mintAddress = new PublicKey(
    "H9xRT2EbiABavkw9RCkhweacCnFY4AhM5vocTumy6rKG"
  );

  // Настройте метаданные токена здесь
  // Все параметры передаются напрямую, хранятся в блокчейне
  const metadata = {
    name: "Meme Token", // Название токена (максимум 64 символа)
    symbol: "MEME", // Символ токена (максимум 16 символов)
    description: "Мой первый мем-токен на Solana! Хранится прямо в блокчейне.", // Описание (максимум 512 символов)
    imageUri:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiI3s7bGux2RqA_W5xoJQequY3zT8eNhVB6Q&s", // URI изображения (максимум 256 символов, можно оставить пустым "")
  };

  // Находим PDA для метаданных
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), mintAddress.toBuffer()],
    program.programId
  );

  console.log("Program ID:", program.programId.toBase58());
  console.log("Mint Address:", mintAddress.toBase58());
  console.log("Metadata PDA:", metadataPDA.toBase58());
  console.log("\n📝 Добавляем метаданные в блокчейне:");
  console.log("  Name:", metadata.name);
  console.log("  Symbol:", metadata.symbol);
  console.log("  Description:", metadata.description);
  console.log("  Image URI:", metadata.imageUri || "(пусто)");

  try {
    // Вызываем инструкцию set_metadata из программы
    // Метаданные хранятся прямо в блокчейне, не через внешний URI
    // @ts-ignore - Anchor types issue
    const tx = await program.methods
      .setMetadata(
        metadata.name,
        metadata.symbol,
        metadata.description,
        metadata.imageUri
      )
      .accounts({
        payer: provider.wallet.publicKey,
        mint: mintAddress,
        metadata: metadataPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      } as any)
      .rpc();

    console.log("\n✅ Метаданные успешно сохранены в блокчейне!");
    console.log("   Transaction:", tx);
    console.log(
      "\n🔗 Проверьте токен в Explorer:",
      `https://explorer.solana.com/address/${mintAddress.toBase58()}?cluster=devnet`
    );
    console.log(
      "\n📋 Метаданные аккаунт:",
      `https://explorer.solana.com/address/${metadataPDA.toBase58()}?cluster=devnet`
    );
  } catch (error: any) {
    if (
      error.message?.includes("already in use") ||
      error.message?.includes("already exists") ||
      error.message?.includes("0x0")
    ) {
      console.log("\n⚠️  Метаданные уже существуют для этого токена.");
      console.log(
        "   Чтобы обновить метаданные, просто запустите скрипт снова с новыми данными."
      );
    } else {
      console.error("\n❌ Ошибка при сохранении метаданных:", error.message);
      throw error;
    }
  }
})();
