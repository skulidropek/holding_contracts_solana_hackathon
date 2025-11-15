import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { MemeToken } from "../target/types/meme_token";

(async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemeToken as anchor.Program<MemeToken>;
  
  // Адрес вашего mint
  const mintAddress = new PublicKey("H9xRT2EbiABavkw9RCkhweacCnFY4AhM5vocTumy6rKG");

  // Находим PDA для метаданных (такой же, как при записи)
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), mintAddress.toBuffer()],
    program.programId
  );

  console.log("🔍 Читаем метаданные токена:");
  console.log("Program ID:", program.programId.toBase58());
  console.log("Mint Address:", mintAddress.toBase58());
  console.log("Metadata PDA:", metadataPDA.toBase58());
  console.log("");

  try {
    // Читаем метаданные из блокчейна
    const metadataAccount = await program.account.tokenMetadata.fetch(metadataPDA);
    
    console.log("✅ Метаданные найдены в блокчейне:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📛 Name:", metadataAccount.name);
    console.log("🔤 Symbol:", metadataAccount.symbol);
    console.log("📝 Description:", metadataAccount.description);
    console.log("🖼️  Image URI:", metadataAccount.imageUri || "(пусто)");
    console.log("👤 Update Authority:", metadataAccount.updateAuthority.toBase58());
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("💡 Важно:");
    console.log("   • Метаданные хранятся в ОТДЕЛЬНОМ аккаунте в блокчейне");
    console.log("   • Аккаунт метаданных связан с mint через PDA seeds");
    console.log("   • Это позволяет обновлять метаданные без изменения mint");
    console.log("   • Метаданные можно читать через программу Anchor");
    console.log("");
    console.log("🔗 Ссылки:");
    console.log("   Mint:", `https://explorer.solana.com/address/${mintAddress.toBase58()}?cluster=devnet`);
    console.log("   Metadata:", `https://explorer.solana.com/address/${metadataPDA.toBase58()}?cluster=devnet`);
  } catch (error: any) {
    if (error.code === "AccountNotFound") {
      console.log("❌ Метаданные не найдены для этого токена.");
      console.log("   Запустите скрипт add-metadata.ts для создания метаданных.");
    } else {
      console.error("❌ Ошибка при чтении метаданных:", error.message);
      throw error;
    }
  }
})();

