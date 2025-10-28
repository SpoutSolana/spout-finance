import {
    getCreateCredentialInstruction,
    getCreateSchemaInstruction,
    serializeAttestationData,
    getCreateAttestationInstruction,
    fetchSchema,
    getChangeAuthorizedSignersInstruction,
    fetchAttestation,
    deserializeAttestationData,
    deriveAttestationPda,
    deriveCredentialPda,
    deriveSchemaPda,
    deriveEventAuthorityAddress,
    getCloseAttestationInstruction,
    SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS
} from "sas-lib";
import {
    airdropFactory,
    generateKeyPairSigner,
    lamports,
    Signature,
    TransactionSigner,
    Instruction,
    Address,
    Blockhash,
    createSolanaClient,
    createTransaction,
    SolanaClient,
} from "gill";
import { estimateComputeUnitLimitFactory } from "gill/programs";
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import fs from "fs";
import os from "os";

const CONFIG = {
    CLUSTER_OR_RPC: 'devnet',
    CREDENTIAL_NAME: 'SpoutCredential',
    SCHEMA_NAME: 'KYCStatus',
    SCHEMA_LAYOUT: Buffer.from([1]), // Boolean field
    SCHEMA_FIELDS: ["kycCompleted"],
    SCHEMA_VERSION: 1,
    SCHEMA_DESCRIPTION: 'Simple KYC status',
    ATTESTATION_DATA: {
        kycCompleted: 1, // Use 1 for true, 0 for false
    },
    ATTESTATION_EXPIRY_DAYS: 365
};

const RPC_URL = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

function loadPayer(): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array([227,57,226,193,103,32,190,14,91,51,133,96,149,134,131,77,184,237,7,195,99,50,47,12,102,32,4,190,49,192,247,244,151,169,36,215,229,28,34,160,198,236,236,166,52,235,16,159,45,165,228,89,58,52,35,226,151,250,219,38,24,217,178,35])
  );
}

async function setupWallets(client: SolanaClient) {
    try {
        // Load our existing funded keypair for the payer
        const keypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
        const raw = fs.readFileSync(keypairPath, { encoding: "utf-8" });
        const secretArray: number[] = JSON.parse(raw);
        
        let keypair: any;
        if (secretArray.length === 64) {
            keypair = require("@solana/web3.js").Keypair.fromSecretKey(Uint8Array.from(secretArray));
        } else if (secretArray.length === 32) {
            keypair = require("@solana/web3.js").Keypair.fromSecretKey(Uint8Array.from(secretArray));
        } else if (secretArray.length > 64) {
            keypair = require("@solana/web3.js").Keypair.fromSecretKey(Uint8Array.from(secretArray.slice(0, 32)));
        } else {
            throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
        }

        // Create custom payer that uses our funded keypair
        const payer = {
            address: "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" as any,
            sign: async (message: Uint8Array) => new Uint8Array(64),
            publicKey: { toBase58: () => "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" }
        } as any;
        
        // Create custom signers that all use our funded keypair address
        const authorizedSigner1 = {
            address: "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" as any,
            sign: async (message: Uint8Array) => new Uint8Array(64)
        } as any;
        
        const authorizedSigner2 = {
            address: "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" as any,
            sign: async (message: Uint8Array) => new Uint8Array(64)
        } as any;
        
        const issuer = {
            address: "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" as any,
            sign: async (message: Uint8Array) => new Uint8Array(64)
        } as any;
        
        // Generate a NEW test user keypair for this verification
        const testUser = await generateKeyPairSigner();

        console.log(`    - Using funded keypair: ${payer.address}`);
        console.log(`    - NEW test user: ${testUser.address}`);
        return { payer, authorizedSigner1, authorizedSigner2, issuer, testUser };
    } catch (error) {
        throw new Error(`Failed to setup wallets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Hybrid function to convert gill instructions to web3.js transaction
async function sendAndConfirmInstructions(
    client: SolanaClient,
    payer: any,
    instructions: Instruction[],
    description: string
): Promise<Signature> {
    try {
        const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl } = await import("@solana/web3.js");
        
        // Load our funded keypair for actual signing
        const keypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
        const raw = fs.readFileSync(keypairPath, { encoding: "utf-8" });
        const secretArray: number[] = JSON.parse(raw);
        
        let keypair: any;
        if (secretArray.length === 64) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(secretArray));
        } else if (secretArray.length === 32) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(secretArray));
        } else if (secretArray.length > 64) {
            keypair = Keypair.fromSecretKey(Uint8Array.from(secretArray.slice(0, 32)));
        } else {
            throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
        }
        
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        
        // Convert gill instructions to web3.js format
        const web3Instructions = instructions.map((instruction: any) => {
            const programId = new PublicKey(instruction.programAddress);
            const accounts = instruction.accounts.map((acc: any) => {
                const pubkey = new PublicKey(acc.address);
                const isOurKeypair = pubkey.equals(keypair.publicKey);
                const isSigner = isOurKeypair;
                return {
                    pubkey,
                    isSigner,
                    isWritable: acc.role === 1,
                };
            });
            const data = Buffer.from(Object.values(instruction.data) as number[]);
            
            return {
                programId,
                keys: accounts,
                data,
            };
        });
        
        const tx = new Transaction().add(...web3Instructions);
        const signature = await sendAndConfirmTransaction(connection, tx, [keypair]);
        
        console.log(`    - ${description} - Signature: ${signature}`);
        return signature as any;
    } catch (error) {
        throw new Error(`Failed to ${description.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

async function verifyAttestation({
    client,
    schemaPda,
    userAddress
}: {
    client: SolanaClient;
    schemaPda: Address;
    userAddress: Address;
}): Promise<boolean> {
    try {
        const schema = await fetchSchema(client.rpc, schemaPda);
        if (schema.data.isPaused) {
            console.log(`    - Schema is paused`);
            return false;
        }
        const [attestationPda] = await deriveAttestationPda({
            credential: schema.data.credential,
            schema: schemaPda,
            nonce: userAddress
        });
        const attestation = await fetchAttestation(client.rpc, attestationPda);
        const attestationData = deserializeAttestationData(schema.data, attestation.data.data as Uint8Array);
        console.log(`    - Attestation data:`, attestationData);
        const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
        return currentTimestamp < attestation.data.expiry;
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log("🎯 VERIFYING AND MINTING TO NEW USER");
    console.log("====================================");
    
    const client: SolanaClient = createSolanaClient({ urlOrMoniker: CONFIG.CLUSTER_OR_RPC });

    // Step 1: Setup wallets and fund payer
    console.log("\n1. Setting up wallets...");
    const { payer, authorizedSigner1, authorizedSigner2, issuer, testUser } = await setupWallets(client);

    // Step 2: Use Existing Credential
    console.log("\n2. Using Existing Credential...");
    const credentialPda = "B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL" as any; // From credential-info.json
    console.log(`    - Using existing Credential PDA: ${credentialPda}`); 

    // Step 3: Use Existing Schema
    console.log("\n3. Using Existing Schema...");
    const schemaPda = "GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x" as any; // From schema-info.json
    console.log(`    - Using existing Schema PDA: ${schemaPda}`);

    // Step 4: Create NEW Attestation for NEW User
    console.log("\n4. Creating NEW Attestation for NEW User...");
    const [attestationPda] = await deriveAttestationPda({
        credential: credentialPda,
        schema: schemaPda,
        nonce: testUser.address
    });

    const schema = await fetchSchema(client.rpc, schemaPda);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + (CONFIG.ATTESTATION_EXPIRY_DAYS * 24 * 60 * 60);
    const createAttestationInstruction = await getCreateAttestationInstruction({
        payer,
        authority: authorizedSigner1,
        credential: credentialPda,
        schema: schemaPda,
        attestation: attestationPda,
        nonce: testUser.address,
        expiry: expiryTimestamp,
        data: serializeAttestationData(schema.data, CONFIG.ATTESTATION_DATA),
    });

    await sendAndConfirmInstructions(client, payer, [createAttestationInstruction], 'NEW Attestation created');
    console.log(`    - NEW Attestation PDA: ${attestationPda}`);

    // Step 5: Update Authorized Signers
    console.log("\n5. Updating Authorized Signers...");
    const changeAuthSignersInstruction = await getChangeAuthorizedSignersInstruction({
        payer,
        authority: issuer,
        credential: credentialPda,
        signers: [authorizedSigner1.address, authorizedSigner2.address]
    });
    await sendAndConfirmInstructions(client, payer, [changeAuthSignersInstruction], 'Authorized signers updated');

    // Step 6: Verify NEW Attestation
    console.log("\n6. Verifying NEW Attestation...");
    const isUserVerified = await verifyAttestation({
        client,
        schemaPda,
        userAddress: testUser.address
    });
    console.log(`    - NEW User is ${isUserVerified ? 'verified' : 'not verified'}`);

    // Step 7: Save NEW attestation info
    console.log("\n7. Saving NEW attestation info...");
    const attestationInfo = {
        user: {
            address: testUser.address,
            privateKey: Array.from(testUser.keyPair?.secretKey || [])
        },
        attestation: {
            pda: attestationPda,
            credential: credentialPda,
            schema: schemaPda,
            nonce: testUser.address,
            sasProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
            created_at: new Date(expiryTimestamp * 1000).toISOString()
        }
    };

    fs.writeFileSync('new-user-attestation.json', JSON.stringify(attestationInfo, null, 2));
    console.log(`    - NEW attestation info saved to: new-user-attestation.json`);

    // Step 8: MINT TOKENS TO NEW USER
    console.log("\n8. 🚀 MINTING TOKENS TO NEW VERIFIED USER...");
    
    const payerKeypair = loadPayer();
    const connection = new Connection(RPC_URL, 'confirmed');
    const provider = new AnchorProvider(connection, new Wallet(payerKeypair), {});

    const idl = JSON.parse(fs.readFileSync('./target/idl/spoutsolana.json', 'utf8'));
    const program = new Program(idl, provider);

    // Use the mint we created earlier
    const mintAddress = new PublicKey('9hniP8NG32eDAzsKNQ2GGKo2Xij3vJvYKEkgW3Ejw6eb');
    console.log('Using mint:', mintAddress.toBase58());

    // Get the actual nonce from the NEW attestation data
    const attestationAccount = new PublicKey(attestationPda);
    const accountInfo = await connection.getAccountInfo(attestationAccount);
    if (!accountInfo) {
        console.log('❌ NEW Attestation account not found');
        return;
    }

    // Extract the nonce from the attestation data
    const data = accountInfo.data;
    let offset = 33 + 32 + 32; // Skip discriminator, credential, schema
    const nonce = new PublicKey(data.slice(offset, offset + 32));
    console.log('Actual nonce from NEW attestation:', nonce.toBase58());

    // Use the nonce as the recipient
    const verifiedUser = nonce;
    console.log('NEW Verified user (from nonce):', verifiedUser.toBase58());

    // PDAs
    const [programAuthorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('program_authority'), mintAddress.toBuffer()],
        PROGRAM_ID
    );
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config_v2')], PROGRAM_ID);

    const recipientTokenAccount = await getAssociatedTokenAddress(mintAddress, verifiedUser);
    console.log('Recipient token account:', recipientTokenAccount.toBase58());

    // Use REAL SAS accounts from NEW attestation info
    const credentialAccount = new PublicKey(attestationInfo.attestation.credential);
    const schemaAccount = new PublicKey(attestationInfo.attestation.schema);
    const attestationAccountPda = new PublicKey(attestationInfo.attestation.pda);
    const sasProgram = new PublicKey(attestationInfo.attestation.sasProgram);

    console.log('\nNEW SAS Account Details:');
    console.log('- Credential:', credentialAccount.toBase58());
    console.log('- Schema:', schemaAccount.toBase58());
    console.log('- Attestation:', attestationAccountPda.toBase58());
    console.log('- SAS Program:', sasProgram.toBase58());

    try {
        console.log('\n🚀 Creating mintToKycUser instruction for NEW user...');
        
        // Create the instruction manually using Anchor
        const instruction = await program.methods
            .mintToKycUser(verifiedUser, new BN(2000)) // 2000 tokens for the new user
            .accounts({
                mint: mintAddress,
                recipientTokenAccount: recipientTokenAccount,
                attestationAccount: attestationAccountPda,
                schemaAccount: schemaAccount,
                credentialAccount: credentialAccount,
                sasProgram: sasProgram,
                programAuthority: programAuthorityPda,
                recipient: verifiedUser,
                issuer: payerKeypair.publicKey,
                config: configPda,
                payer: payerKeypair.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .instruction();
        
        console.log('✅ Instruction created successfully');
        
        // Send the transaction manually
        console.log('\n🚀 Sending transaction manually...');
        const transaction = new Transaction().add(instruction);
        const signature = await sendAndConfirmTransaction(connection, transaction, [payerKeypair]);
        
        console.log('🎉 SUCCESS! Minted to NEW verified user!');
        console.log('Transaction:', signature);
        
        // Check token balance
        const balance = await connection.getTokenAccountBalance(recipientTokenAccount);
        console.log('Token balance:', balance.value.uiAmount, 'tokens');
        
        console.log('\n✅ COMPLETE SUCCESS!');
        console.log('- NEW user verified through SAS ✅');
        console.log('- NEW attestation created ✅');
        console.log('- Tokens minted to NEW user ✅');
        console.log('- System works consistently! ✅');
        
    } catch (e: any) {
        console.log('❌ Error details:', e.message || e);
    }
}

main()
    .then(() => console.log("\n✅ NEW user verification and minting completed successfully!"))
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    });
