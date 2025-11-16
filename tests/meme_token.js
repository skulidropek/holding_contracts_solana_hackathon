"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
// CHANGE: Applied deterministic formatting required by Prettier lint stage.
// WHY: `yarn lint` failed due to style drift; aligning with formatter unblocks verification invariant.
// QUOTE(TZ): "Verification must run through the linter"
// REF: REQ-LINT
// SOURCE: n/a
// CHANGE: Translate compiled test rationale to English per localization request.
// WHY: Even generated JS artifacts should not contain Russian comments for clarity.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
const chai_1 = require("chai");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
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
    const program = anchor.workspace.propertyShares;
    const wallet = provider.wallet;
    const SCALE = new anchor_1.BN("1000000000000");
    const propertyId = `villa-${Date.now().toString(36)}`;
    const metadataUri = "https://raw.githubusercontent.com/skulidropek/holding_contracts_solana_hackathon/main/config/metadata/villa-alpha.json";
    const metadataName = "Villa Test Share";
    const metadataSymbol = "VTES";
    const totalShares = new anchor_1.BN(1000);
    const pricePerShare = new anchor_1.BN(2000000); // 2 USDC with 6 decimals
    let usdcMint;
    let authorityUsdcAta;
    let buyer;
    let buyerUsdcAta;
    let buyerSharesAta;
    let propertyPda;
    let vaultPda;
    let poolPda;
    let mintPda;
    let metadataPda;
    let vaultSharesAta;
    let vaultUsdcAta;
    let poolUsdcAta;
    let userRewardPda;
    let sharesHeld = new anchor_1.BN(0);
    let poolAccPerShare = new anchor_1.BN(0);
    let userRewardSnapshot = new anchor_1.BN(0);
    const derivePropertyPda = (id) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("property"), Buffer.from(id)], program.programId);
    const deriveMintPda = (property) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("property_mint"), property.toBuffer()], program.programId);
    const deriveVaultPda = (property) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("vault"), property.toBuffer()], program.programId);
    const derivePoolPda = (property) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("pool"), property.toBuffer()], program.programId);
    const confirm = (signature) => __awaiter(void 0, void 0, void 0, function* () {
        yield provider.connection.confirmTransaction(signature, "confirmed");
    });
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        usdcMint = yield (0, spl_token_1.createMint)(provider.connection, wallet.payer, wallet.publicKey, null, 6);
        const authorityAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(provider.connection, wallet.payer, usdcMint, wallet.publicKey);
        authorityUsdcAta = authorityAta.address;
        buyer = web3_js_1.Keypair.generate();
        yield confirm(yield provider.connection.requestAirdrop(buyer.publicKey, 2 * web3_js_1.LAMPORTS_PER_SOL));
        const buyerAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(provider.connection, wallet.payer, usdcMint, buyer.publicKey);
        buyerUsdcAta = buyerAta.address;
        yield (0, spl_token_1.mintTo)(provider.connection, wallet.payer, usdcMint, authorityUsdcAta, wallet.payer, 10000000000);
        yield (0, spl_token_1.mintTo)(provider.connection, wallet.payer, usdcMint, buyerUsdcAta, wallet.payer, 10000000000);
        [propertyPda] = derivePropertyPda(propertyId);
        [mintPda] = deriveMintPda(propertyPda);
        [vaultPda] = deriveVaultPda(propertyPda);
        [poolPda] = derivePoolPda(propertyPda);
        [metadataPda] = deriveMetadataPda(mintPda);
        userRewardPda = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("user_reward"),
            poolPda.toBuffer(),
            buyer.publicKey.toBuffer(),
        ], program.programId)[0];
        vaultSharesAta = (0, spl_token_1.getAssociatedTokenAddressSync)(mintPda, vaultPda, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        vaultUsdcAta = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, vaultPda, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        poolUsdcAta = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, poolPda, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        yield program.methods
            .initProperty(propertyId, totalShares, metadataName, metadataSymbol, metadataUri, pricePerShare)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
            vault: vaultPda,
            pool: poolPda,
            mint: mintPda,
            usdcMint,
            metadata: metadataPda,
            tokenMetadataProgram: mpl_token_metadata_1.MPL_TOKEN_METADATA_PROGRAM_ID,
            vaultSharesAta,
            vaultUsdcAta,
            poolUsdcAta,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
            .rpc();
        const buyerShareAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(provider.connection, wallet.payer, mintPda, buyer.publicKey);
        buyerSharesAta = buyerShareAta.address;
    }));
    it("initializes property state and vault balances (REQ-INIT)", () => __awaiter(void 0, void 0, void 0, function* () {
        const propertyAccount = yield program.account.property.fetch(propertyPda);
        (0, chai_1.expect)(propertyAccount.mint.toBase58()).to.equal(mintPda.toBase58());
        (0, chai_1.expect)(propertyAccount.totalShares.toNumber()).to.equal(totalShares.toNumber());
        (0, chai_1.expect)(propertyAccount.metadataUri).to.equal(metadataUri);
        (0, chai_1.expect)(propertyAccount.active).to.equal(true);
        const vaultShareAccount = yield (0, spl_token_1.getAccount)(provider.connection, vaultSharesAta);
        (0, chai_1.expect)(Number(vaultShareAccount.amount)).to.equal(totalShares.toNumber());
    }));
    it("moves USDC and shares when buying + blocks inactive sales (REQ-BUY)", () => __awaiter(void 0, void 0, void 0, function* () {
        const sharesToBuy = new anchor_1.BN(10);
        const preBuyerUsdc = Number((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount);
        const preVaultUsdc = Number((yield (0, spl_token_1.getAccount)(provider.connection, vaultUsdcAta)).amount);
        yield program.methods
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
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .signers([buyer])
            .rpc();
        sharesHeld = sharesHeld.add(sharesToBuy);
        const postBuyerUsdc = Number((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount);
        const postVaultUsdc = Number((yield (0, spl_token_1.getAccount)(provider.connection, vaultUsdcAta)).amount);
        const expectedCost = sharesToBuy.toNumber() * pricePerShare.toNumber();
        (0, chai_1.expect)(preBuyerUsdc - postBuyerUsdc).to.equal(expectedCost);
        (0, chai_1.expect)(postVaultUsdc - preVaultUsdc).to.equal(expectedCost);
        const buyerSharesAccount = yield (0, spl_token_1.getAccount)(provider.connection, buyerSharesAta);
        (0, chai_1.expect)(Number(buyerSharesAccount.amount)).to.equal(sharesToBuy.toNumber());
        const inactivePropertyId = "villa-inactive";
        const { property: inactiveProperty, vault: inactiveVault, mint: inactiveMint, vaultShares, vaultUsdc, } = yield initSecondaryProperty(inactivePropertyId);
        yield program.methods
            .closeProperty()
            .accountsStrict({
            authority: wallet.publicKey,
            property: inactiveProperty,
        })
            .rpc();
        const inactiveBuyerAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(provider.connection, wallet.payer, inactiveMint, buyer.publicKey);
        let inactiveError;
        try {
            yield program.methods
                .buyShares(new anchor_1.BN(1))
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
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .signers([buyer])
                .rpc();
        }
        catch (error) {
            inactiveError = error;
        }
        (0, chai_1.expect)(inactiveError).to.not.equal(undefined);
    }));
    it("accepts yield only from authority and updates accumulator (REQ-DEPOSIT)", () => __awaiter(void 0, void 0, void 0, function* () {
        const depositAmount = new anchor_1.BN(1000000);
        const poolBefore = yield program.account.pool.fetch(poolPda);
        yield program.methods
            .depositYield(depositAmount)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
            pool: poolPda,
            mint: mintPda,
            usdcMint,
            authorityUsdcAta,
            poolUsdcAta,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        const poolAfter = yield program.account.pool.fetch(poolPda);
        poolAccPerShare = poolAfter.accPerShare;
        const expectedIncrement = depositAmount.mul(SCALE).div(totalShares);
        (0, chai_1.expect)(poolAfter.accPerShare.sub(poolBefore.accPerShare).toString()).to.equal(expectedIncrement.toString());
        let unauthorizedError;
        try {
            yield program.methods
                .depositYield(depositAmount)
                .accountsStrict({
                authority: buyer.publicKey,
                property: propertyPda,
                pool: poolPda,
                mint: mintPda,
                usdcMint,
                authorityUsdcAta: buyerUsdcAta,
                poolUsdcAta,
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            })
                .signers([buyer])
                .rpc();
        }
        catch (error) {
            unauthorizedError = error;
        }
        (0, chai_1.expect)(unauthorizedError).to.not.equal(undefined);
    }));
    it("updates metadata only for the authority (REQ-METADATA)", () => __awaiter(void 0, void 0, void 0, function* () {
        const newUri = `${metadataUri}?v=2`;
        yield program.methods
            .updateMetadataUri(newUri)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
        })
            .rpc();
        const updatedProperty = yield program.account.property.fetch(propertyPda);
        (0, chai_1.expect)(updatedProperty.metadataUri).to.equal(newUri);
        let unauthorizedError;
        try {
            yield program.methods
                .updateMetadataUri("https://malicious.example")
                .accountsStrict({
                authority: buyer.publicKey,
                property: propertyPda,
            })
                .signers([buyer])
                .rpc();
        }
        catch (error) {
            unauthorizedError = error;
        }
        (0, chai_1.expect)(unauthorizedError).to.not.equal(undefined);
        yield program.methods
            .updateMetadataUri(metadataUri)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
        })
            .rpc();
    }));
    it("allows proportional, idempotent claims (REQ-CLAIM)", () => __awaiter(void 0, void 0, void 0, function* () {
        const claimDeposit = new anchor_1.BN(2000000);
        yield program.methods
            .depositYield(claimDeposit)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
            pool: poolPda,
            mint: mintPda,
            usdcMint,
            authorityUsdcAta,
            poolUsdcAta,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        poolAccPerShare = (yield program.account.pool.fetch(poolPda)).accPerShare;
        const preClaimBalance = new anchor_1.BN((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount.toString());
        yield program.methods
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
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([buyer])
            .rpc();
        const postClaimBalance = new anchor_1.BN((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount.toString());
        const actualClaim = postClaimBalance.sub(preClaimBalance);
        const expectedClaim = poolAccPerShare
            .sub(userRewardSnapshot)
            .mul(sharesHeld)
            .div(SCALE);
        (0, chai_1.expect)(actualClaim.toString()).to.equal(expectedClaim.toString());
        userRewardSnapshot = poolAccPerShare;
        let idempotentError;
        try {
            yield program.methods
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
                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .signers([buyer])
                .rpc();
        }
        catch (error) {
            idempotentError = error;
        }
        (0, chai_1.expect)(idempotentError).to.not.equal(undefined);
        const recipient = web3_js_1.Keypair.generate();
        const recipientAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(provider.connection, wallet.payer, mintPda, recipient.publicKey);
        const transferIx = (0, spl_token_1.createTransferInstruction)(buyerSharesAta, recipientAta.address, buyer.publicKey, 5, [], spl_token_1.TOKEN_PROGRAM_ID);
        const transferTx = new web3_js_1.Transaction().add(transferIx);
        yield confirm(yield provider.sendAndConfirm(transferTx, [buyer]));
        sharesHeld = sharesHeld.sub(new anchor_1.BN(5));
        const reducedDeposit = new anchor_1.BN(3000000);
        yield program.methods
            .depositYield(reducedDeposit)
            .accountsStrict({
            authority: wallet.publicKey,
            property: propertyPda,
            pool: poolPda,
            mint: mintPda,
            usdcMint,
            authorityUsdcAta,
            poolUsdcAta,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
        })
            .rpc();
        poolAccPerShare = (yield program.account.pool.fetch(poolPda)).accPerShare;
        const beforeSecondClaim = new anchor_1.BN((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount.toString());
        yield program.methods
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
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .signers([buyer])
            .rpc();
        const afterSecondClaim = new anchor_1.BN((yield (0, spl_token_1.getAccount)(provider.connection, buyerUsdcAta)).amount.toString());
        const actualSecondClaim = afterSecondClaim.sub(beforeSecondClaim);
        const expectedSecondClaim = poolAccPerShare
            .sub(userRewardSnapshot)
            .mul(sharesHeld)
            .div(SCALE);
        (0, chai_1.expect)(actualSecondClaim.toString()).to.equal(expectedSecondClaim.toString());
        userRewardSnapshot = poolAccPerShare;
    }));
    const initSecondaryProperty = (id) => __awaiter(void 0, void 0, void 0, function* () {
        const [secondaryProperty] = derivePropertyPda(id);
        const [secondaryMint] = deriveMintPda(secondaryProperty);
        const [secondaryVault] = deriveVaultPda(secondaryProperty);
        const [secondaryPool] = derivePoolPda(secondaryProperty);
        const [secondaryMetadata] = deriveMetadataPda(secondaryMint);
        const secondaryVaultShares = (0, spl_token_1.getAssociatedTokenAddressSync)(secondaryMint, secondaryVault, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        const secondaryVaultUsdc = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, secondaryVault, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        const secondaryPoolUsdc = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, secondaryPool, true, spl_token_1.TOKEN_PROGRAM_ID, spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID);
        yield program.methods
            .initProperty(id, new anchor_1.BN(1), `${metadataName}-${id}`, `${metadataSymbol.slice(0, 4)}${id.slice(-2).toUpperCase()}`, metadataUri, new anchor_1.BN(1000000))
            .accountsStrict({
            authority: wallet.publicKey,
            property: secondaryProperty,
            vault: secondaryVault,
            pool: secondaryPool,
            mint: secondaryMint,
            usdcMint,
            metadata: secondaryMetadata,
            tokenMetadataProgram: mpl_token_metadata_1.MPL_TOKEN_METADATA_PROGRAM_ID,
            vaultSharesAta: secondaryVaultShares,
            vaultUsdcAta: secondaryVaultUsdc,
            poolUsdcAta: secondaryPoolUsdc,
            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
            associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3_js_1.SystemProgram.programId,
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
    });
});
const mpProgramId = new web3_js_1.PublicKey(mpl_token_metadata_1.MPL_TOKEN_METADATA_PROGRAM_ID);
const deriveMetadataPda = (mint) => web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("metadata"), mpProgramId.toBuffer(), mint.toBuffer()], mpProgramId);
