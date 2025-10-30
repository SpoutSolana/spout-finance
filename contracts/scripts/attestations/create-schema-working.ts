import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl, TransactionInstruction } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import { createSchemaInstruction } from "../implementations/PDAderivation";

async function main() {
  const [credentialArg, nameArg, versionArg, descriptionArg, rpcArg] = process.argv.slice(2);
  if (!credentialArg || !nameArg || !versionArg || !descriptionArg) {
    console.error("Usage: ts-node scripts/create-schema-working.ts <CREDENTIAL_PDA> <NAME> <VERSION> <DESCRIPTION> [RPC_URL]");
    console.error("Example: ts-node scripts/create-schema-working.ts B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL KYCStatus 1 'Simple KYC status'");
    process.exit(1);
  }

  const credential = new PublicKey(credentialArg);
  const name = nameArg;
  const version = parseInt(versionArg);
  const description = descriptionArg;
  const rpcUrl = rpcArg || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");

  // Use default keypair
  const keypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
  const raw = fs.readFileSync(keypairPath, { encoding: "utf-8" });
  const secretArray: number[] = JSON.parse(raw);
  
  let payer: Keypair;
  
  // Handle different keypair formats
  if (secretArray.length === 64) {
    const secret = Uint8Array.from(secretArray);
    payer = Keypair.fromSecretKey(secret);
  } else if (secretArray.length === 32) {
    const privateKey = Uint8Array.from(secretArray);
    payer = Keypair.fromSecretKey(privateKey);
  } else if (secretArray.length > 64) {
    console.log(`Phantom export detected: ${secretArray.length} bytes`);
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
  console.log("Credential PDA:", credential.toBase58());
  console.log("Schema name:", name);
  console.log("Schema version:", version);
  console.log("Schema description:", description);

  // Simple schema with just kyc completed field
  const fieldNames = ["kycCompleted"];
  const layout = new Uint8Array([1]); // 1 byte for boolean field

  console.log("Field names:", fieldNames);

  // Use the existing createSchemaInstruction function
  const ix = await createSchemaInstruction({
    payer: payer.publicKey,
    authority: payer.publicKey,
    credential: credential,
    name: name,
    version: version,
    description: description,
    fieldNames: fieldNames,
    layout: layout
  });

  console.log("Schema Instruction:", JSON.stringify(ix, null, 2));

  // Convert sas-lib instruction format to standard Solana instruction
  const programId = new PublicKey(ix.programAddress);
  const accounts = ix.accounts.map((acc: any, index: number) => {
    const pubkey = new PublicKey(acc.address);
    const isSigner = index === 0 && acc.role === 1; // Only the payer should be a signer
    const isWritable = acc.role === 1 || index === 3; // Payer or schema PDA
    return {
      pubkey,
      isSigner,
      isWritable,
    };
  });

  const dataArray = Object.values(ix.data) as number[];
  const data = Buffer.from(dataArray);

  const solanaInstruction = new TransactionInstruction({
    programId,
    keys: accounts,
    data,
  });

  const tx = new Transaction().add(solanaInstruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("Schema creation transaction signature:", sig);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
