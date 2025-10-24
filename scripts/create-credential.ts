import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl, TransactionInstruction } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import { createCredentialInstruction, getSasProgramId } from "../implementations/PDAderivation.ts";

async function main() {
  const [authorityArg, nameArg, rpcArg] = process.argv.slice(2);
  if (!authorityArg || !nameArg) {
    console.error("Usage: ts-node scripts/create-credential.ts <AUTHORITY_PUBKEY> <NAME> [RPC_URL]");
    process.exit(1);
  }

  const authority = new PublicKey(authorityArg);
  const rpcUrl = rpcArg || clusterApiUrl("testnet");
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
    } catch (e) {
      console.log("Seed method failed:", e.message);
      throw e;
    }
  } else {
    throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
  }

  console.log("Payer public key:", payer.publicKey.toBase58());
  console.log("Authority public key:", authority.toBase58());
  
  if (!payer.publicKey.equals(authority)) {
    console.log("Note: Using different payer than authority (this is allowed)");
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
  const accounts = ix.accounts.map((acc: any, index: number) => {
    const pubkey = new PublicKey(acc.address);
    
    // Only the authority (first account) should be a signer
    // PDAs (like credential accounts) should not be signers
    const isSigner = index === 0 && acc.role === 1;
    
    // PDAs are typically writable when being created
    const isWritable = acc.role === 1 || index === 1; // authority or credential PDA
    
    return {
      pubkey,
      isSigner,
      isWritable,
    };
  });

  // Convert data from object format to Uint8Array
  const dataArray = Object.values(ix.data) as number[];
  const data = new Uint8Array(dataArray);

  const solanaInstruction = new TransactionInstruction({
    programId,
    keys: accounts,
    data,
  });

  const tx = new Transaction().add(solanaInstruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("Transaction signature:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


