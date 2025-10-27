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
import fs from "fs";
import os from "os";

const CONFIG = {
    CLUSTER_OR_RPC: 'devnet',
    CREDENTIAL_PDA: "B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL",
    SCHEMA_PDA: "GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x",
    ATTESTATION_PDA: "Bhn8w6kFKMPvwVk6NpDzqQBnvZkMPXs2prybJZSFnmuL", // From our test
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

// Verify user KYC status by checking SAS attestation
async function verifyUserKYC(
    userAddress: PublicKey,
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    client: any
): Promise<{ isVerified: boolean; attestationData?: any; error?: string }> {
    console.log(`🔍 Verifying KYC for user: ${userAddress.toBase58()}`);
    
    try {
        // 1. Derive attestation PDA
        const [attestationPda] = await deriveAttestationPda({
            credential: credentialPda as any,
            schema: schemaPda as any,
            nonce: userAddress as any
        });
        console.log(`📋 Attestation PDA: ${attestationPda}`);

        // 2. Fetch schema to get its data for deserialization
        const schema = await fetchSchema(client.rpc, schemaPda as any);
        if (schema.data.isPaused) {
            return { isVerified: false, error: "Schema is paused" };
        }

        // 3. Fetch attestation account
        const attestation = await fetchAttestation(client.rpc, attestationPda);
        
        // 4. Check expiry
        const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        const isExpired = currentTimestamp >= attestation.data.expiry;
        
        if (isExpired) {
            return { isVerified: false, error: "Attestation expired" };
        }
        
        // 5. Check KYC status (assuming kycCompleted field)
        const attestationData = attestation.data.data;
        let isKYCCompleted = false;
        
        if (attestationData instanceof Uint8Array) {
            isKYCCompleted = attestationData[0] === 1; // First byte should be 1 for true
            console.log(`📊 Attestation data:`, Array.from(attestationData));
        } else {
            console.log(`📊 Attestation data:`, attestationData);
            // Try to parse as array if it's not Uint8Array
            if (Array.isArray(attestationData)) {
                isKYCCompleted = attestationData[0] === 1;
            }
        }
        
        console.log(`✅ KYC Status: ${isKYCCompleted ? 'VERIFIED' : 'NOT VERIFIED'}`);
        
        return { 
            isVerified: isKYCCompleted, 
            attestationData: attestationData,
            error: isKYCCompleted ? undefined : "KYC not completed"
        };

    } catch (error) {
        console.log(`❌ KYC verification failed:`, error instanceof Error ? error.message : 'Unknown error');
        return { isVerified: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// KYC-gated mint function
async function mintToKycUser(
    connection: Connection,
    mintKeypair: Keypair,
    userAddress: PublicKey,
    amount: number,
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    client: any,
    payer: Keypair
): Promise<{ success: boolean; signature?: string; error?: string }> {
    console.log(`\n🪙 Attempting to mint ${amount} tokens to ${userAddress.toBase58()}`);
    
    try {
        // 1. Verify user KYC status FIRST
        const kycResult = await verifyUserKYC(userAddress, credentialPda, schemaPda, client);
        
        if (!kycResult.isVerified) {
            console.log(`❌ MINT BLOCKED: User is not KYC verified`);
            console.log(`   Reason: ${kycResult.error}`);
            return { 
                success: false, 
                error: `User not KYC verified: ${kycResult.error}` 
            };
        }
        
        console.log(`✅ KYC VERIFIED: User is eligible for minting`);
        
        // 2. Create user's token account if it doesn't exist
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
        
        // 3. Mint tokens to the verified user
        const mintAmount = amount * LAMPORTS_PER_SOL;
        const mintToIx = createMintToInstruction(
            mintKeypair.publicKey, // mint
            userTokenAccount, // destination
            payer.publicKey, // authority
            mintAmount // amount
        );
        
        const tx2 = new Transaction().add(mintToIx);
        const sig2 = await sendAndConfirmTransaction(connection, tx2, [payer]);
        
        console.log(`✅ MINT SUCCESSFUL: ${amount} tokens minted to verified user`);
        console.log(`   Transaction: ${sig2}`);
        
        // 4. Check final balance
        const userAccount = await getAccount(connection, userTokenAccount);
        console.log(`💰 Final balance: ${Number(userAccount.amount) / LAMPORTS_PER_SOL} tokens`);
        
        return { success: true, signature: sig2 };
        
    } catch (error) {
        console.log(`❌ Mint failed:`, error instanceof Error ? error.message : 'Unknown error');
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        };
    }
}

async function main() {
    console.log("🚀 KYC-Gated Token Minting Demo\n");
    
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
        
        // 2. Test minting to KYC-verified user
        console.log("\n2. 🧪 Testing KYC-Gated Minting...");
        
        const verifiedUser = new PublicKey("Bdh5VebWhoUKUHmgUmycPKLBVySgBSBxDtbX8wXhfVfP"); // From our attestation
        const unverifiedUser = Keypair.generate().publicKey;
        
        // Test 1: Mint to verified user (should succeed)
        console.log("\n📋 Test 1: Minting to KYC-verified user");
        const result1 = await mintToKycUser(
            connection,
            mintKeypair,
            verifiedUser,
            100, // 100 tokens
            new PublicKey(CONFIG.CREDENTIAL_PDA),
            new PublicKey(CONFIG.SCHEMA_PDA),
            client,
            payer
        );
        
        console.log(`Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);
        if (result1.error) console.log(`Error: ${result1.error}`);
        
        // Test 2: Mint to unverified user (should fail)
        console.log("\n📋 Test 2: Minting to unverified user");
        const result2 = await mintToKycUser(
            connection,
            mintKeypair,
            unverifiedUser,
            50, // 50 tokens
            new PublicKey(CONFIG.CREDENTIAL_PDA),
            new PublicKey(CONFIG.SCHEMA_PDA),
            client,
            payer
        );
        
        console.log(`Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`);
        if (result2.error) console.log(`Error: ${result2.error}`);
        
        console.log("\n🎉 KYC-Gated Minting Demo Completed!");
        console.log("\n📊 Summary:");
        console.log(`   - Verified user: ${result1.success ? '✅ MINTED' : '❌ BLOCKED'}`);
        console.log(`   - Unverified user: ${result2.success ? '✅ MINTED' : '❌ BLOCKED'}`);
        console.log(`   - KYC verification working: ${!result1.success || !result2.success ? '✅ YES' : '❌ NO'}`);
        
    } catch (error) {
        console.error("❌ Demo failed:", error);
    }
}

main().catch(console.error);
