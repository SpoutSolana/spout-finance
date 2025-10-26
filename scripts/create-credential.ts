import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl, TransactionInstruction, SystemProgram } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import { createCredentialInstruction, getSasProgramId } from "../implementations/PDAderivation";

async function main() {
  const [authorityArg, nameArg, rpcArg] = process.argv.slice(2);
  if (!authorityArg || !nameArg) {
    console.error("Usage: ts-node scripts/create-credential.ts <AUTHORITY_PUBKEY> <NAME> [RPC_URL]");
    process.exit(1);
  }

  const authority = new PublicKey(authorityArg);
  const rpcUrl = rpcArg || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");

  // Use default keypair from SOLANA_KEYPAIR if available, else from default CLI path
  // For simplicity in Cursor sandbox, assume default CLI keypair loaded via Anchor/solana-keygen
  // You can adjust to load a specific keypair path if needed
  const defaultKeypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
  const raw = fs.readFileSync(defaultKeypairPath, { encoding: "utf-8" });
  const secretArray: number[] = JSON.parse(raw);
  
  let payer: Keypair;
  
  // Handle different keypair formats
  if (secretArray.length === 64) {
    // Standard Solana keypair format (64 bytes)
    const secret = Uint8Array.from(secretArray);
    payer = Keypair.fromSecretKey(secret);
  } else if (secretArray.length === 32) {
    // Raw private key format (32 bytes) - create keypair from private key
    const privateKey = Uint8Array.from(secretArray);
    payer = Keypair.fromSecretKey(privateKey);
  } else if (secretArray.length > 64) {
    // Phantom export format - try different approaches
    console.log(`Phantom export detected: ${secretArray.length} bytes`);
    
    // Try using the first 32 bytes as seed
    const seed = Uint8Array.from(secretArray.slice(0, 32));
    try {
      payer = Keypair.fromSeed(seed);
      console.log("Created keypair from seed, public key:", payer.publicKey.toBase58());
    } catch (e: any) {
      console.log("Seed method failed:", e.message);
      throw e;
    }
  } else {
    throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
  }

  console.log("Payer public key:", payer.publicKey.toBase58());
  console.log("Authority public key:", authority.toBase58());
  
  if (!payer.publicKey.equals(authority)) {
    console.log("❌ ERROR: Payer and authority must be the same for credential creation!");
    console.log("   Payer:", payer.publicKey.toBase58());
    console.log("   Authority:", authority.toBase58());
    console.log("   We need to use the keypair that corresponds to the authority address.");
    process.exit(1);
  }

  const ix = await createCredentialInstruction({
    payer: payer.publicKey,
    authority: authority,
    name: nameArg,
    signers: [authority],
  });

  console.log("Instruction:", JSON.stringify(ix, null, 2));

  // Convert sas-lib instruction format to standard Solana instruction
  const programId = new PublicKey(ix.programAddress);
  // Map accounts to Solana format - keep all accounts but handle duplicates properly
  const accounts = ix.accounts.map((acc: any, index: number) => {
    const pubkey = new PublicKey(acc.address);
    
    // The authority should be a signer
    const isAuthority = pubkey.equals(authority);
    const isSigner = isAuthority;
    
    // PDAs are typically writable when being created
    const isWritable = acc.role === 1 || isAuthority;
    
    return {
      pubkey,
      isSigner,
      isWritable,
    };
  });

  // Debug: Print account details
  console.log("\n=== ACCOUNT MAPPING DEBUG ===");
  console.log("Authority to match:", authority.toBase58());
  accounts.forEach((acc: any, index: number) => {
    const isAuthority = acc.pubkey.equals(authority);
    console.log(`Account ${index}: ${acc.pubkey.toBase58()}`);
    console.log(`  isAuthority: ${isAuthority}`);
    console.log(`  isSigner: ${acc.isSigner}`);
    console.log(`  isWritable: ${acc.isWritable}`);
  });

  // Convert data from object format to Uint8Array
  const dataArray = Object.values(ix.data) as number[];
  const data = Buffer.from(dataArray);

  const solanaInstruction = new TransactionInstruction({
    programId,
    keys: accounts,
    data,
  });

  const tx = new Transaction().add(solanaInstruction);
  
  // Since payer and authority are the same, we need to sign with the same keypair
  // but Solana expects each signer to be unique in the array
  const signers = [payer];
  
  console.log("Signing with keypair:", payer.publicKey.toBase58());
  const sig = await sendAndConfirmTransaction(connection, tx, signers);
  console.log("Transaction signature:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


