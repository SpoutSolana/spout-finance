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
            // Add any other required properties
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
        
        const testUser = {
            address: "BD29wQ5Tj7b1MEFqquRxASsTqoN38oCrjxpU4riTZx7C" as any,
            sign: async (message: Uint8Array) => new Uint8Array(64)
        } as any;

        // Skip airdrop since we're using our funded keypair
        console.log(`    - Using funded keypair: ${payer.address}`);
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
                // Check if this is our funded keypair's address
                const isOurKeypair = pubkey.equals(keypair.publicKey);
                // Only our keypair should be a signer, not the generated signers
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
    console.log("Starting Solana Attestation Service Demo with Existing Credential & Schema\n");
    
    const client: SolanaClient = createSolanaClient({ urlOrMoniker: CONFIG.CLUSTER_OR_RPC });

    // Step 1: Setup wallets and fund payer
    console.log("1. Setting up wallets and funding payer...");
    const { payer, authorizedSigner1, authorizedSigner2, issuer, testUser } = await setupWallets(client);

    // Step 2: Use Existing Credential
    console.log("\n2. Using Existing Credential...");
    const credentialPda = "B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL" as any; // From credential-info.json
    console.log(`    - Using existing Credential PDA: ${credentialPda}`); 

    // Step 3: Use Existing Schema
    console.log("\n3. Using Existing Schema...");
    const schemaPda = "GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x" as any; // From schema-info.json
    console.log(`    - Using existing Schema PDA: ${schemaPda}`);

    // Step 4: Create Attestation
    console.log("\n4. Creating Attestation...");
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

    await sendAndConfirmInstructions(client, payer, [createAttestationInstruction], 'Attestation created');
    console.log(`    - Attestation PDA: ${attestationPda}`);

    // Step 5: Update Authorized Signers
    console.log("\n5. Updating Authorized Signers...");
    const changeAuthSignersInstruction = await getChangeAuthorizedSignersInstruction({
        payer,
        authority: issuer,
        credential: credentialPda,
        signers: [authorizedSigner1.address, authorizedSigner2.address]
    });
    await sendAndConfirmInstructions(client, payer, [changeAuthSignersInstruction], 'Authorized signers updated');

    // Step 6: Verify Attestations
    console.log("\n6. Verifying Attestations...");
    const isUserVerified = await verifyAttestation({
        client,
        schemaPda,
        userAddress: testUser.address
    });
    console.log(`    - Test User is ${isUserVerified ? 'verified' : 'not verified'}`);

    const randomUser = await generateKeyPairSigner();
    const isRandomVerified = await verifyAttestation({
        client,
        schemaPda,
        userAddress: randomUser.address
    });
    console.log(`    - Random User is ${isRandomVerified ? 'verified' : 'not verified'}`);

    // Step 7. Close Attestation
    console.log("\n7. Closing Attestation...");
    const eventAuthority = await deriveEventAuthorityAddress();
    const closeAttestationInstruction = await getCloseAttestationInstruction({
        payer,
        attestation: attestationPda,
        authority: authorizedSigner1,
        credential: credentialPda,
        eventAuthority,
        attestationProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS
    });
    await sendAndConfirmInstructions(client, payer, [closeAttestationInstruction], 'Closed attestation');
}

main()
    .then(() => console.log("\nSolana Attestation Service demo completed successfully!"))
    .catch((error) => {
        console.error("❌ Demo failed:", error);
        process.exit(1);
    });
