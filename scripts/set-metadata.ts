import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MemeToken } from "../target/types/meme_token";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemeToken as anchor.Program<MemeToken>;
  
  // Адрес вашего mint
  const mintAddress = new PublicKey("H9xRT2EbiABavkw9RCkhweacCnFY4AhM5vocTumy6rKG");
  
  // Настройте метаданные токена здесь
  const metadata = {
    name: "Meme Token",                    // Максимум 64 символа
    symbol: "MEME",                         // Максимум 16 символов
    description: "Мой первый мем-токен на Solana! Хранится прямо в блокчейне.", // Максимум 512 символов
    imageUri: "https://example.com/token-image.png", // Максимум 256 символов (можно оставить пустым "")
  };

  // Находим PDA для метаданных
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), mintAddress.toBuffer()],
    program.programId
  );

  console.log("Program ID:", program.programId.toBase58());
  console.log("Mint Address:", mintAddress.toBase58());
  console.log("Metadata PDA:", metadataPDA.toBase58());
  console.log("\n📝 Устанавливаем метаданные в блокчейне:");
  console.log("  Name:", metadata.name);
  console.log("  Symbol:", metadata.symbol);
  console.log("  Description:", metadata.description);
  console.log("  Image URI:", metadata.imageUri || "(пусто)");

  try {
    // Вызываем инструкцию set_metadata
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
    console.error("\n❌ Ошибка при сохранении метаданных:", error.message);
    throw error;
  }
})();

