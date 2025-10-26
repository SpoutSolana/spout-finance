import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl, TransactionInstruction } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import { createAttestationInstruction, deriveAttestationPdaManual, SAS_PROGRAM_ID } from "../implementations/PDAderivation";

async function main() {
  const [userAddressArg, kycStatusArg, rpcArg] = process.argv.slice(2);
  if (!userAddressArg || !kycStatusArg) {
    console.error("Usage: ts-node scripts/test-attestation.ts <USER_ADDRESS> <KYC_STATUS> [RPC_URL]");
    console.error("Example: ts-node scripts/test-attestation.ts 3L8Gbr6sP6xymMdax7GgBBSrXiH1tX5fV7ZyRwvg1nmj true");
    console.error("KYC_STATUS: 'true' or 'false'");
    process.exit(1);
  }

  const userAddress = new PublicKey(userAddressArg);
  const kycStatus = kycStatusArg.toLowerCase() === 'true';
  const rpcUrl = rpcArg || clusterApiUrl("devnet");
  const connection = new Connection(rpcUrl, "confirmed");

  // Load our SAS setup from JSON
  const credentialInfo = JSON.parse(fs.readFileSync('credential-info.json', 'utf-8'));
  const credentialPda = new PublicKey(credentialInfo.credential.pda);
  const credentialAuthority = new PublicKey(credentialInfo.credential.authority);

  const schemaInfo = JSON.parse(fs.readFileSync('schema-info.json', 'utf-8'));
  const schemaPda = new PublicKey(schemaInfo.schema.pda);

  console.log("🔐 === TESTING ATTESTATION WITH FIXED DATA TYPE ===");
  console.log("👤 User Address:", userAddress.toBase58());
  console.log("✅ KYC Status:", kycStatus ? "VERIFIED" : "NOT VERIFIED");
  console.log("🏢 Credential:", credentialInfo.credential.name);
  console.log("📍 Credential PDA:", credentialPda.toBase58());
  console.log("📋 Schema:", schemaInfo.schema.name);
  console.log("📍 Schema PDA:", schemaPda.toBase58());

  // Use default keypair for authority
  const keypairPath = process.env.SOLANA_KEYPAIR || os.homedir() + "/.config/solana/id.json";
  const raw = fs.readFileSync(keypairPath, { encoding: "utf-8" });
  const secretArray: number[] = JSON.parse(raw);
  
  let payer: Keypair;
  if (secretArray.length === 64) {
    payer = Keypair.fromSecretKey(Uint8Array.from(secretArray));
  } else if (secretArray.length === 32) {
    payer = Keypair.fromSecretKey(Uint8Array.from(secretArray));
  } else if (secretArray.length > 64) {
    payer = Keypair.fromSecretKey(Uint8Array.from(secretArray.slice(0, 32)));
  } else {
    throw new Error(`Invalid keypair format: expected 32, 64, or more bytes, got ${secretArray.length}`);
  }
  const authority = payer.publicKey;

  console.log("🔐 Authority:", authority.toBase58());

  // Derive attestation PDA
  const [attestationPda] = deriveAttestationPdaManual({
    credential: credentialPda,
    schema: schemaPda,
    holder: userAddress,
    nonce: 0
  });

  console.log("📍 Attestation PDA:", attestationPda.toBase58());

  // Test with proper boolean Uint8Array data (matching schema)
  const attestationData = new Uint8Array([kycStatus ? 1 : 0]);
  console.log("📊 Attestation data (Uint8Array):", Array.from(attestationData));

  // Use the SAS library to create attestation instruction with Uint8Array data
  const ix = await createAttestationInstruction({
    payer: payer.publicKey,
    authority: authority,
    credential: credentialPda,
    schema: schemaPda,
    holder: userAddress,
    data: attestationData, // Using proper Uint8Array for boolean
    nonce: 0,
    expiry: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days from now
    tokenAccount: userAddress // Use holder as token account for KYC
  });

  console.log("Attestation Instruction:", JSON.stringify(ix, null, 2));

  // Convert sas-lib instruction format to standard Solana instruction
  const programId = new PublicKey(ix.programAddress);
  const accounts = ix.accounts.map((acc: any) => {
    const pubkey = new PublicKey(acc.address);
    
    // Only the authority should be a signer, not PDAs
    const isAuthority = pubkey.equals(authority);
    const isSigner = isAuthority;
    
    // PDAs are writable when being created
    const isWritable = acc.role === 1 || acc.role === 2;
    
    return {
      pubkey,
      isSigner,
      isWritable,
    };
  });

  const dataBuffer = Object.values(ix.data) as number[];
  const solanaInstruction = new TransactionInstruction({
    programId,
    keys: accounts,
    data: Buffer.from(dataBuffer),
  });

  console.log("📝 Instruction created with SAS library");
  console.log("🚀 Sending attestation transaction...");
  try {
    const tx = new Transaction().add(solanaInstruction);
    const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
    
    console.log("\n🎉 === ATTESTATION SUCCESSFUL ===");
    console.log("✅ Transaction signature:", sig);
    console.log("👤 User:", userAddress.toBase58());
    console.log("🔐 KYC Status:", kycStatus ? "VERIFIED ✅" : "NOT VERIFIED ❌");
    console.log("📍 Attestation PDA:", attestationPda.toBase58());
    console.log("🏢 Issued by:", credentialInfo.credential.name);
    console.log("🌐 Network:", rpcUrl);
    console.log("🔗 View on Solana Explorer: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
    
  } catch (error: any) {
    console.error("\n❌ Attestation creation failed:");
    console.error("Error:", error.message);
    if (error.logs) {
      console.error("Logs:", error.logs);
    }
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
