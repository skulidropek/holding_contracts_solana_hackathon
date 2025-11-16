import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// CHANGE: Applied deterministic formatting required by Prettier lint stage.
// WHY: `yarn lint` failed due to style drift; aligning with formatter unblocks verification invariant.
// QUOTE(TZ): "Verification must run through the linter"
// REF: REQ-LINT
// SOURCE: n/a
// CHANGE: Translate test rationale to English for localization compliance.
// WHY: Contributors reviewing automated verification must read a single language.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
import { expect } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { PropertyShares } from "../target/types/property_shares";

// CHANGE: Replace placeholder test with coverage for property tokenization flows.
// WHY: Need deterministic verification for REQ-INIT/REQ-BUY/REQ-DEPOSIT/REQ-CLAIM behavioural guarantees.
// QUOTE(TZ): "Write Anchor tests" (see section 6) covering init_property, buy_shares, deposit_yield, claim.
// REF: REQ-INIT,REQ-BUY,REQ-DEPOSIT,REQ-CLAIM
// SOURCE: n/a
describe("property_shares", () => {
  // CHANGE: Use `accountsStrict` to satisfy Anchor TS typing by explicitly specifying every account.
  // WHY: TypeScript error TS2353 occurred because `.accounts` disallows PDA-resolvable entries such as `property`.
  // QUOTE(TZ): "Verification must run through the linter" — type errors break verification stage.
  // REF: USER-TS2353
  // SOURCE: n/a
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.propertyShares as Program<PropertyShares>;
  const wallet = provider.wallet as anchor.Wallet;

  const SCALE = new BN("1000000000000");

  const propertyId = `villa-${Date.now().toString(36)}`;
const metadataUri = "https://raw.githubusercontent.com/skulidropek/holding_contracts_solana_hackathon/main/config/metadata/villa-alpha.json";
const metadataName = "Villa Test Share";
const metadataSymbol = "VTES";
  const totalShares = new BN(1_000);
  const pricePerShare = new BN(2_000_000); // 2 USDC with 6 decimals

  let usdcMint: PublicKey;
  let authorityUsdcAta: PublicKey;
  let buyer: Keypair;
  let buyerUsdcAta: PublicKey;
  let buyerSharesAta: PublicKey;
  let propertyPda: PublicKey;
  let vaultPda: PublicKey;
  let poolPda: PublicKey;
  let mintPda: PublicKey;
  let metadataPda: PublicKey;
  let vaultSharesAta: PublicKey;
  let vaultUsdcAta: PublicKey;
  let poolUsdcAta: PublicKey;
  let userRewardPda: PublicKey;

  let sharesHeld = new BN(0);
  let poolAccPerShare = new BN(0);
  let userRewardSnapshot = new BN(0);

  const derivePropertyPda = (id: string): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("property"), Buffer.from(id)],
      program.programId
    );
  const deriveMintPda = (property: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("property_mint"), property.toBuffer()],
      program.programId
    );
  const deriveVaultPda = (property: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), property.toBuffer()],
      program.programId
    );
  const derivePoolPda = (property: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), property.toBuffer()],
      program.programId
    );

  const confirm = async (signature: string): Promise<void> => {
    await provider.connection.confirmTransaction(signature, "confirmed");
  };

  before(async () => {
    usdcMint = await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6
    );

    const authorityAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      usdcMint,
      wallet.publicKey
    );
    authorityUsdcAta = authorityAta.address;

    buyer = Keypair.generate();
    await confirm(
      await provider.connection.requestAirdrop(
        buyer.publicKey,
        2 * LAMPORTS_PER_SOL
      )
    );
    const buyerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      usdcMint,
      buyer.publicKey
    );
    buyerUsdcAta = buyerAta.address;

    await mintTo(
      provider.connection,
      wallet.payer,
      usdcMint,
      authorityUsdcAta,
      wallet.payer,
      10_000_000_000
    );
    await mintTo(
      provider.connection,
      wallet.payer,
      usdcMint,
      buyerUsdcAta,
      wallet.payer,
      10_000_000_000
    );

    [propertyPda] = derivePropertyPda(propertyId);
    [mintPda] = deriveMintPda(propertyPda);
    [vaultPda] = deriveVaultPda(propertyPda);
    [poolPda] = derivePoolPda(propertyPda);
    [metadataPda] = deriveMetadataPda(mintPda);
    userRewardPda = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_reward"),
        poolPda.toBuffer(),
        buyer.publicKey.toBuffer(),
      ],
      program.programId
    )[0];
    vaultSharesAta = getAssociatedTokenAddressSync(
      mintPda,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    vaultUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      vaultPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    poolUsdcAta = getAssociatedTokenAddressSync(
      usdcMint,
      poolPda,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await program.methods
      .initProperty(
        propertyId,
        totalShares,
        metadataName,
        metadataSymbol,
        metadataUri,
        pricePerShare
      )
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
        vault: vaultPda,
        pool: poolPda,
        mint: mintPda,
        usdcMint,
        metadata: metadataPda,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        vaultSharesAta,
        vaultUsdcAta,
        poolUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const buyerShareAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      mintPda,
      buyer.publicKey
    );
    buyerSharesAta = buyerShareAta.address;
  });

  it("initializes property state and vault balances (REQ-INIT)", async () => {
    const propertyAccount = await program.account.property.fetch(propertyPda);
    expect(propertyAccount.mint.toBase58()).to.equal(mintPda.toBase58());
    expect(propertyAccount.totalShares.toNumber()).to.equal(
      totalShares.toNumber()
    );
    expect(propertyAccount.metadataUri).to.equal(metadataUri);
    expect(propertyAccount.active).to.equal(true);

    const vaultShareAccount = await getAccount(
      provider.connection,
      vaultSharesAta
    );
    expect(Number(vaultShareAccount.amount)).to.equal(totalShares.toNumber());
  });

  it("moves USDC and shares when buying + blocks inactive sales (REQ-BUY)", async () => {
    const sharesToBuy = new BN(10);
    const preBuyerUsdc = Number(
      (await getAccount(provider.connection, buyerUsdcAta)).amount
    );
    const preVaultUsdc = Number(
      (await getAccount(provider.connection, vaultUsdcAta)).amount
    );

    await program.methods
      .buyShares(sharesToBuy)
      .accountsStrict({
        property: propertyPda,
        vault: vaultPda,
        mint: mintPda,
        usdcMint,
        vaultSharesAta,
        vaultUsdcAta,
        user: buyer.publicKey,
        userUsdcAta: buyerUsdcAta,
        userSharesAta: buyerSharesAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    sharesHeld = sharesHeld.add(sharesToBuy);

    const postBuyerUsdc = Number(
      (await getAccount(provider.connection, buyerUsdcAta)).amount
    );
    const postVaultUsdc = Number(
      (await getAccount(provider.connection, vaultUsdcAta)).amount
    );
    const expectedCost = sharesToBuy.toNumber() * pricePerShare.toNumber();
    expect(preBuyerUsdc - postBuyerUsdc).to.equal(expectedCost);
    expect(postVaultUsdc - preVaultUsdc).to.equal(expectedCost);
    const buyerSharesAccount = await getAccount(
      provider.connection,
      buyerSharesAta
    );
    expect(Number(buyerSharesAccount.amount)).to.equal(sharesToBuy.toNumber());

    const inactivePropertyId = "villa-inactive";
    const {
      property: inactiveProperty,
      vault: inactiveVault,
      mint: inactiveMint,
      vaultShares,
      vaultUsdc,
    } = await initSecondaryProperty(inactivePropertyId);
    await program.methods
      .closeProperty()
      .accountsStrict({
        authority: wallet.publicKey,
        property: inactiveProperty,
      })
      .rpc();

    const inactiveBuyerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      inactiveMint,
      buyer.publicKey
    );

    let inactiveError: unknown;
    try {
      await program.methods
        .buyShares(new BN(1))
        .accountsStrict({
          property: inactiveProperty,
          vault: inactiveVault,
          mint: inactiveMint,
          usdcMint,
          vaultSharesAta: vaultShares,
          vaultUsdcAta: vaultUsdc,
          user: buyer.publicKey,
          userUsdcAta: buyerUsdcAta,
          userSharesAta: inactiveBuyerAta.address,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
    } catch (error) {
      inactiveError = error;
    }
    expect(inactiveError).to.not.equal(undefined);
  });

  it("accepts yield only from authority and updates accumulator (REQ-DEPOSIT)", async () => {
    const depositAmount = new BN(1_000_000);
    const poolBefore = await program.account.pool.fetch(poolPda);

    await program.methods
      .depositYield(depositAmount)
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
        pool: poolPda,
        mint: mintPda,
        usdcMint,
        authorityUsdcAta,
        poolUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolAfter = await program.account.pool.fetch(poolPda);
    poolAccPerShare = poolAfter.accPerShare;
    const expectedIncrement = depositAmount.mul(SCALE).div(totalShares);
    expect(
      poolAfter.accPerShare.sub(poolBefore.accPerShare).toString()
    ).to.equal(expectedIncrement.toString());

    let unauthorizedError: unknown;
    try {
      await program.methods
        .depositYield(depositAmount)
        .accountsStrict({
          authority: buyer.publicKey,
          property: propertyPda,
          pool: poolPda,
          mint: mintPda,
          usdcMint,
          authorityUsdcAta: buyerUsdcAta,
          poolUsdcAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();
    } catch (error) {
      unauthorizedError = error;
    }
    expect(unauthorizedError).to.not.equal(undefined);
  });

  it("updates metadata only for the authority (REQ-METADATA)", async () => {
    const newUri = `${metadataUri}?v=2`;

    await program.methods
      .updateMetadataUri(newUri)
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
      })
      .rpc();

    const updatedProperty = await program.account.property.fetch(propertyPda);
    expect(updatedProperty.metadataUri).to.equal(newUri);

    let unauthorizedError: unknown;
    try {
      await program.methods
        .updateMetadataUri("https://malicious.example")
        .accountsStrict({
          authority: buyer.publicKey,
          property: propertyPda,
        })
        .signers([buyer])
        .rpc();
    } catch (error) {
      unauthorizedError = error;
    }
    expect(unauthorizedError).to.not.equal(undefined);

    await program.methods
      .updateMetadataUri(metadataUri)
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
      })
      .rpc();
  });

  it("allows proportional, idempotent claims (REQ-CLAIM)", async () => {
    const claimDeposit = new BN(2_000_000);
    await program.methods
      .depositYield(claimDeposit)
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
        pool: poolPda,
        mint: mintPda,
        usdcMint,
        authorityUsdcAta,
        poolUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    poolAccPerShare = (await program.account.pool.fetch(poolPda)).accPerShare;
    const preClaimBalance = new BN(
      (await getAccount(provider.connection, buyerUsdcAta)).amount.toString()
    );
    await program.methods
      .claim()
      .accountsStrict({
        user: buyer.publicKey,
        property: propertyPda,
        pool: poolPda,
        userReward: userRewardPda,
        userSharesAta: buyerSharesAta,
        userUsdcAta: buyerUsdcAta,
        poolUsdcAta,
        mint: mintPda,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const postClaimBalance = new BN(
      (await getAccount(provider.connection, buyerUsdcAta)).amount.toString()
    );
    const actualClaim = postClaimBalance.sub(preClaimBalance);
    const expectedClaim = poolAccPerShare
      .sub(userRewardSnapshot)
      .mul(sharesHeld)
      .div(SCALE);
    expect(actualClaim.toString()).to.equal(expectedClaim.toString());
    userRewardSnapshot = poolAccPerShare;

    let idempotentError: unknown;
    try {
      await program.methods
        .claim()
        .accountsStrict({
          user: buyer.publicKey,
          property: propertyPda,
          pool: poolPda,
          userReward: userRewardPda,
          userSharesAta: buyerSharesAta,
          userUsdcAta: buyerUsdcAta,
          poolUsdcAta,
          mint: mintPda,
          usdcMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();
    } catch (error) {
      idempotentError = error;
    }
    expect(idempotentError).to.not.equal(undefined);

    const recipient = Keypair.generate();
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      wallet.payer,
      mintPda,
      recipient.publicKey
    );
    const transferIx = createTransferInstruction(
      buyerSharesAta,
      recipientAta.address,
      buyer.publicKey,
      5,
      [],
      TOKEN_PROGRAM_ID
    );
    const transferTx = new Transaction().add(transferIx);
    await confirm(await provider.sendAndConfirm(transferTx, [buyer]));
    sharesHeld = sharesHeld.sub(new BN(5));

    const reducedDeposit = new BN(3_000_000);
    await program.methods
      .depositYield(reducedDeposit)
      .accountsStrict({
        authority: wallet.publicKey,
        property: propertyPda,
        pool: poolPda,
        mint: mintPda,
        usdcMint,
        authorityUsdcAta,
        poolUsdcAta,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    poolAccPerShare = (await program.account.pool.fetch(poolPda)).accPerShare;

    const beforeSecondClaim = new BN(
      (await getAccount(provider.connection, buyerUsdcAta)).amount.toString()
    );
    await program.methods
      .claim()
      .accountsStrict({
        user: buyer.publicKey,
        property: propertyPda,
        pool: poolPda,
        userReward: userRewardPda,
        userSharesAta: buyerSharesAta,
        userUsdcAta: buyerUsdcAta,
        poolUsdcAta,
        mint: mintPda,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([buyer])
      .rpc();

    const afterSecondClaim = new BN(
      (await getAccount(provider.connection, buyerUsdcAta)).amount.toString()
    );
    const actualSecondClaim = afterSecondClaim.sub(beforeSecondClaim);
    const expectedSecondClaim = poolAccPerShare
      .sub(userRewardSnapshot)
      .mul(sharesHeld)
      .div(SCALE);
    expect(actualSecondClaim.toString()).to.equal(
      expectedSecondClaim.toString()
    );
    userRewardSnapshot = poolAccPerShare;
  });

  const initSecondaryProperty = async (
    id: string
  ): Promise<{
    property: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    mint: PublicKey;
    vaultShares: PublicKey;
    vaultUsdc: PublicKey;
  }> => {
    const [secondaryProperty] = derivePropertyPda(id);
    const [secondaryMint] = deriveMintPda(secondaryProperty);
    const [secondaryVault] = deriveVaultPda(secondaryProperty);
    const [secondaryPool] = derivePoolPda(secondaryProperty);
    const [secondaryMetadata] = deriveMetadataPda(secondaryMint);
    const secondaryVaultShares = getAssociatedTokenAddressSync(
      secondaryMint,
      secondaryVault,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const secondaryVaultUsdc = getAssociatedTokenAddressSync(
      usdcMint,
      secondaryVault,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    const secondaryPoolUsdc = getAssociatedTokenAddressSync(
      usdcMint,
      secondaryPool,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await program.methods
      .initProperty(
        id,
        new BN(1),
        `${metadataName}-${id}`,
        `${metadataSymbol.slice(0, 4)}${id.slice(-2).toUpperCase()}`,
        metadataUri,
        new BN(1_000_000)
      )
      .accountsStrict({
        authority: wallet.publicKey,
        property: secondaryProperty,
        vault: secondaryVault,
        pool: secondaryPool,
        mint: secondaryMint,
        usdcMint,
        metadata: secondaryMetadata,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        vaultSharesAta: secondaryVaultShares,
        vaultUsdcAta: secondaryVaultUsdc,
        poolUsdcAta: secondaryPoolUsdc,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    return {
      property: secondaryProperty,
      vault: secondaryVault,
      pool: secondaryPool,
      mint: secondaryMint,
      vaultShares: secondaryVaultShares,
      vaultUsdc: secondaryVaultUsdc,
    };
  };
});
  const mpProgramId = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);
  const deriveMetadataPda = (mint: PublicKey): [PublicKey, number] =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), mpProgramId.toBuffer(), mint.toBuffer()],
      mpProgramId
    );
