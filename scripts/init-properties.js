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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const spl_token_1 = require("@solana/spl-token");
const mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
const web3_js_1 = require("@solana/web3.js");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const PROPERTY_SEED = Buffer.from("property");
const VAULT_SEED = Buffer.from("vault");
const POOL_SEED = Buffer.from("pool");
const MINT_SEED = Buffer.from("property_mint");
const METADATA_SEED = Buffer.from("metadata");
const CONFIG_PATH = node_path_1.default.resolve(__dirname, "../config/properties.json");
function loadConfig() {
    return __awaiter(this, void 0, void 0, function* () {
        const raw = yield promises_1.default.readFile(CONFIG_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        return parsed;
    });
}
function derivePropertyPda(programId, propertyId) {
    const [pda] = web3_js_1.PublicKey.findProgramAddressSync([PROPERTY_SEED, Buffer.from(propertyId)], programId);
    return pda;
}
function deriveMintPda(programId, property) {
    const [pda] = web3_js_1.PublicKey.findProgramAddressSync([MINT_SEED, property.toBuffer()], programId);
    return pda;
}
function deriveVaultPda(programId, property) {
    const [pda] = web3_js_1.PublicKey.findProgramAddressSync([VAULT_SEED, property.toBuffer()], programId);
    return pda;
}
function derivePoolPda(programId, property) {
    const [pda] = web3_js_1.PublicKey.findProgramAddressSync([POOL_SEED, property.toBuffer()], programId);
    return pda;
}
function deriveMetadataPda(mint) {
    const [pda] = web3_js_1.PublicKey.findProgramAddressSync([METADATA_SEED, mpl_token_metadata_1.PROGRAM_ID.toBuffer(), mint.toBuffer()], mpl_token_metadata_1.PROGRAM_ID);
    return pda;
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const configs = yield loadConfig();
        if (configs.length === 0) {
            console.log("Config empty – nothing to initialize.");
            return;
        }
        const provider = anchor.AnchorProvider.env();
        anchor.setProvider(provider);
        const program = anchor.workspace.propertyShares;
        for (const entry of configs) {
            console.log(`\n⛳ Initializing property ${entry.propertyId}`);
            const propertyPda = derivePropertyPda(program.programId, entry.propertyId);
            const vaultPda = deriveVaultPda(program.programId, propertyPda);
            const poolPda = derivePoolPda(program.programId, propertyPda);
            const mintPda = deriveMintPda(program.programId, propertyPda);
            const metadataPda = deriveMetadataPda(mintPda);
            const usdcMint = new web3_js_1.PublicKey(entry.usdcMint);
            const vaultSharesAta = (0, spl_token_1.getAssociatedTokenAddressSync)(mintPda, vaultPda, true);
            const vaultUsdcAta = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, vaultPda, true);
            const poolUsdcAta = (0, spl_token_1.getAssociatedTokenAddressSync)(usdcMint, poolPda, true);
            try {
                yield program.methods
                    .initProperty(entry.propertyId, new anchor_1.BN(entry.totalShares), entry.tokenName, entry.tokenSymbol, entry.metadataUri, new anchor_1.BN(entry.pricePerShare))
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
                    metadata: metadataPda,
                    tokenMetadataProgram: mpl_token_metadata_1.PROGRAM_ID,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID,
                    systemProgram: web3_js_1.SystemProgram.programId,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                })
                    .rpc();
                console.log(`✅ Property ${entry.propertyId} initialized (mint ${mintPda.toBase58()})`);
            }
            catch (error) {
                console.error(`❌ Failed to init ${entry.propertyId}:`, error.message);
            }
        }
    });
}
main().catch((error) => {
    console.error("Fatal error while initializing properties", error);
    process.exit(1);
});
