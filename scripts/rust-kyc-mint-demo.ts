import {
    fetchAttestation,
    fetchSchema,
    deriveAttestationPda,
} from "sas-lib";
import { createSolanaClient } from "gill";
import { 
    Connection, 
    Keypair, 
    PublicKey, 
    Transaction, 
    sendAndConfirmTransaction, 
    clusterApiUrl,
    LAMPORTS_PER_SOL,
    SystemProgram
} from "@solana/web3.js";
import { 
    createInitializeMintInstruction,
    createMintToInstruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAccount,
} from "@solana/spl-token";
import { Program, AnchorProvider, Wallet, BN } from "@coral-xyz/anchor";
import fs from "fs";
import os from "os";

const CONFIG = {
    CLUSTER_OR_RPC: 'devnet',
    CREDENTIAL_PDA: "B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL",
    SCHEMA_PDA: "GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x",
    // Use the existing attestation we know works
    EXISTING_ATTESTATION_PDA: "Bhn8w6kFKMPvwVk6NpDzqQBnvZkMPXs2prybJZSFnmuL",
    EXISTING_USER: "Bdh5VebWhoUKUHmgUmycPKLBVySgBSBxDtbX8wXhfVfP",
    PROGRAM_ID: "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG", // Your program ID
};

async function loadKeypair(): Promise<Keypair> {
    const keypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
    const raw = fs.readFileSync(keypairPath, { encoding: "utf-8" });
    const secretArray: number[] = JSON.parse(raw);
    
    if (secretArray.length === 64) {
        return Keypair.fromSecretKey(Uint8Array.from(secretArray));
    } else if (secretArray.length === 32) {
        return Keypair.fromSecretKey(Uint8Array.from(secretArray));
    } else if (secretArray.length > 64) {
        return Keypair.fromSecretKey(Uint8Array.from(secretArray.slice(0, 32)));
    } else {
        throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
    }
}

// Derive attestation PDA using the same logic as Rust
async function deriveAttestationPdaRust(
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    userAddress: PublicKey
): Promise<PublicKey> {
    const [attestationPda] = await deriveAttestationPda({
        credential: credentialPda as any,
        schema: schemaPda as any,
        nonce: userAddress as any
    });
    return attestationPda as PublicKey;
}

// KYC-gated mint using Rust program
async function mintToKycUserRust(
    connection: Connection,
    program: Program,
    mintKeypair: Keypair,
    userAddress: PublicKey,
    amount: number,
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    payer: Keypair
): Promise<{ success: boolean; signature?: string; error?: string }> {
    console.log(`\n🪙 Attempting to mint ${amount} tokens to ${userAddress.toBase58()} using Rust program`);
    
    try {
        // 1. Derive attestation PDA
        const attestationPda = await deriveAttestationPdaRust(credentialPda, schemaPda, userAddress);
        console.log(`📋 Attestation PDA: ${attestationPda.toBase58()}`);
        
        // 2. Verify attestation exists and is valid
        try {
            const attestation = await fetchAttestation(program.provider.connection as any, attestationPda as any);
            console.log(`✅ Attestation found and valid`);
        } catch (error) {
            console.log(`❌ Attestation not found or invalid:`, error instanceof Error ? error.message : 'Unknown error');
            return { 
                success: false, 
                error: `Attestation not found: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
        
        // 3. Create user's token account if it doesn't exist
        const userTokenAccount = await getAssociatedTokenAddress(
            mintKeypair.publicKey,
            userAddress
        );
        
        try {
            await getAccount(connection, userTokenAccount);
            console.log(`📁 User token account already exists: ${userTokenAccount.toBase58()}`);
        } catch {
            console.log(`📁 Creating user token account: ${userTokenAccount.toBase58()}`);
            const createTokenAccountIx = createAssociatedTokenAccountInstruction(
                payer.publicKey, // payer
                userTokenAccount, // ata
                userAddress, // owner
                mintKeypair.publicKey // mint
            );
            
            const tx1 = new Transaction().add(createTokenAccountIx);
            const sig1 = await sendAndConfirmTransaction(connection, tx1, [payer]);
            console.log(`   Token account created: ${sig1}`);
        }
        
        // 4. Call the Rust program's mint_to_kyc_user function
        const mintAmount = amount * LAMPORTS_PER_SOL;
        
        // Derive program authority PDA
        const [programAuthorityPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("program_authority")],
            new PublicKey(CONFIG.PROGRAM_ID)
        );
        
        const tx = await program.methods
            .mintToKycUser(new BN(mintAmount))
            .accounts({
                mint: mintKeypair.publicKey,
                userTokenAccount: userTokenAccount,
                attestationAccount: attestationPda,
                schemaAccount: schemaPda,
                credentialAccount: credentialPda,
                sasProgram: new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG"), // SAS program ID
                programAuthority: programAuthorityPda,
                user: userAddress,
                payer: payer.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .signers([payer])
            .rpc();
        
        console.log(`✅ MINT SUCCESSFUL: ${amount} tokens minted to verified user`);
        console.log(`   Transaction: ${tx}`);
        
        // 5. Check final balance
        const userAccount = await getAccount(connection, userTokenAccount);
        console.log(`💰 Final balance: ${Number(userAccount.amount) / LAMPORTS_PER_SOL} tokens`);
        
        return { success: true, signature: tx };
        
    } catch (error) {
        console.log(`❌ Mint failed:`, error instanceof Error ? error.message : 'Unknown error');
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

async function main() {
    console.log("🚀 Rust KYC-Gated Token Minting Demo\n");
    
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const payer = await loadKeypair();
    const client = createSolanaClient({ urlOrMoniker: CONFIG.CLUSTER_OR_RPC });
    
    console.log("Payer:", payer.publicKey.toBase58());
    
    try {
        // 1. Create a test mint
        console.log("\n1. 🪙 Creating Test Mint...");
        const mintKeypair = Keypair.generate();
        const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        
        const createMintAccountIx = SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mintKeypair.publicKey,
            space: MINT_SIZE,
            lamports: mintRent,
            programId: TOKEN_PROGRAM_ID,
        });
        
        const initMintIx = createInitializeMintInstruction(
            mintKeypair.publicKey,
            9, // decimals
            payer.publicKey, // mint authority
            payer.publicKey  // freeze authority
        );
        
        const tx = new Transaction().add(createMintAccountIx, initMintIx);
        const signature = await sendAndConfirmTransaction(connection, tx, [payer, mintKeypair]);
        
        console.log(`   ✅ Mint created: ${mintKeypair.publicKey.toBase58()}`);
        console.log(`   Transaction: ${signature}`);
        
        // 2. Initialize the KYC mint in our Rust program
        console.log("\n2. 🔧 Initializing KYC Mint in Rust Program...");
        
        // Note: You'll need to deploy your Rust program first
        // For now, we'll simulate the minting process
        
        // 3. Test minting to KYC-verified user
        console.log("\n3. 🧪 Testing KYC-Gated Minting with Rust Program...");
        
        const verifiedUser = new PublicKey(CONFIG.EXISTING_USER);
        const unverifiedUser = Keypair.generate().publicKey;
        
        // Test 1: Mint to verified user (should succeed)
        console.log("\n📋 Test 1: Minting to KYC-verified user");
        const result1 = await mintToKycUserRust(
            connection,
            null as any, // Program would be loaded here
            mintKeypair,
            verifiedUser,
            100, // 100 tokens
            new PublicKey(CONFIG.CREDENTIAL_PDA),
            new PublicKey(CONFIG.SCHEMA_PDA),
            payer
        );
        
        console.log(`Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
        if (result1.error) console.log(`Error: ${result1.error}`);
        
        console.log("\n🎉 Rust KYC-Gated Minting Demo Completed!");
        console.log("\n📊 Summary:");
        console.log(`   - This demo shows how to integrate with the Rust program`);
        console.log(`   - The Rust program will verify attestations before minting`);
        console.log(`   - Only verified users can receive tokens`);
        
    } catch (error) {
        console.error("❌ Demo failed:", error);
    }
}

main().catch(console.error);
