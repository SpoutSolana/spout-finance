import { clusterApiUrl, Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  deriveAttestationPda,
  fetchSchema,
  serializeAttestationData,
  getCreateAttestationInstruction,
} from "sas-lib";
import { createSolanaClient } from "gill";
import fs from "fs";

async function main() {
  const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
  const RECIPIENT = process.env.RECIPIENT; // base58 pubkey
  const ISSUER_PATH = process.env.ISSUER_PATH || "./funded-keypair.json";

  if (!RECIPIENT) throw new Error("RECIPIENT env var (base58) is required");

  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  const client = createSolanaClient({ urlOrMoniker: RPC_URL });

  const issuer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(ISSUER_PATH, "utf8")))
  );

  const schemaInfo = JSON.parse(fs.readFileSync("./schema-info.json", "utf8"));
  const credInfo = JSON.parse(fs.readFileSync("./credential-info.json", "utf8"));

  const recipientPk = new PublicKey(RECIPIENT);
  const schemaPda = schemaInfo.schema.pda as string;
  const credentialPda = credInfo.credential.pda as string;

  // Derive attestation PDA with nonce = recipient (pass base58 strings)
  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda as any,
    schema: schemaPda as any,
    nonce: RECIPIENT as any,
  });

  // Load schema for proper data serialization
  const schema = await fetchSchema(client.rpc, schemaPda as any);
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const data = serializeAttestationData(schema.data, { kycCompleted: 1 });

  // Build the SAS create attestation instruction (gill Instruction)
  const gillIx = await getCreateAttestationInstruction({
    payer: { address: issuer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    authority: { address: issuer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    credential: credentialPda as any,
    schema: schemaPda as any,
    attestation: attestationPda as any,
    nonce: RECIPIENT as any,
    expiry,
    data,
  });

  // Convert gill Instruction to web3.js TransactionInstruction
  const web3Ix = {
    programId: new PublicKey(gillIx.programAddress),
    keys: gillIx.accounts.map((a: any) => ({
      pubkey: new PublicKey(a.address),
      isSigner: new PublicKey(a.address).equals(issuer.publicKey),
      isWritable: a.role === 1,
    })),
    data: Buffer.from(Object.values(gillIx.data) as number[]),
  } as any;

  const tx = new Transaction().add(web3Ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [issuer]);

  console.log("Attestation created for:", recipientPk.toBase58());
  console.log("Attestation PDA:", attestationPda.toString());
  console.log("Tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
