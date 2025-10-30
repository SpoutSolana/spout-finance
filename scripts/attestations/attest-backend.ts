import { getCreateAttestationInstruction, serializeAttestationData, fetchSchema, deriveAttestationPda, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from "sas-lib";
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const USER_PUBKEY = new PublicKey(process.env.USER_PUBKEY || "HXpAw6gfWFfoJFy5UhtRN7cecEUyt3mgi1LGmxKyu6Jo");

// Load issuer from json/keypair-info.json for this test
function loadIssuer(): Keypair {
  const kp = JSON.parse(fs.readFileSync("./json/keypair-info.json", "utf8"));
  return Keypair.fromSecretKey(bs58.decode(kp.keypair.private_key_base58));
}

async function main() {
  const issuer = loadIssuer();
  const connection = new Connection(RPC_URL, "confirmed");

  // Existing PDAs from repo JSONs
  const credentialInfo = JSON.parse(fs.readFileSync("./json/credential-info.json", "utf8"));
  const schemaInfo = JSON.parse(fs.readFileSync("./json/schema-info.json", "utf8"));
  const CREDENTIAL_PDA = new PublicKey(credentialInfo.credential.pda);
  const SCHEMA_PDA = new PublicKey(schemaInfo.schema.pda);

  const [attestationPda] = await deriveAttestationPda({
    credential: CREDENTIAL_PDA.toBase58() as any,
    schema: SCHEMA_PDA.toBase58() as any,
    nonce: USER_PUBKEY.toBase58() as any,
  });

  const schema = await fetchSchema(connection, SCHEMA_PDA);
  const ATTESTATION_DATA = { kycCompleted: 1 } as any;
  const EXPIRY_SECONDS = 365 * 24 * 60 * 60;
  const expiryTs = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

  const ix = await getCreateAttestationInstruction({
    payer: issuer as any,
    authority: issuer as any,
    credential: CREDENTIAL_PDA.toBase58() as any,
    schema: SCHEMA_PDA.toBase58() as any,
    attestation: attestationPda as any,
    nonce: USER_PUBKEY.toBase58() as any,
    expiry: expiryTs,
    data: serializeAttestationData(schema.data, ATTESTATION_DATA),
    attestationProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
  });

  const tx = new Transaction().add(ix as any);
  const sig = await sendAndConfirmTransaction(connection, tx, [issuer], { commitment: "confirmed" });
  console.log("Attestation PDA:", attestationPda.toBase58());
  console.log("Tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


