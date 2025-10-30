import { createSolanaClient } from "gill";
import {
  getCreateAttestationInstruction,
  serializeAttestationData,
  fetchSchema,
  deriveAttestationPda,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from "sas-lib";
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";

// HARD-CODED CONFIG (devnet)
const RPC_URL = "https://api.devnet.solana.com";
// Trusted issuer (backend wallet) - base58 secret for dev only
const ISSUER_SECRET_KEY_B58 = "5YVaVn4orWxXTYLxMiCpy8GiLNnaAwwCm72XcrHL4LRLjMz5XQmNHwtCdPSMoBJJtfEyKtpyMULasmW2an69e5nz";
// SAS PDAs
const CREDENTIAL_PDA = new PublicKey("B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL");
const SCHEMA_PDA = new PublicKey("GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x");
// Target user to attest (change as needed)
const USER_PUBKEY = new PublicKey("HXpAw6gfWFfoJFy5UhtRN7cecEUyt3mgi1LGmxKyu6Jo");

async function main() {
  const issuer = Keypair.fromSecretKey(bs58.decode(ISSUER_SECRET_KEY_B58));
  const client = createSolanaClient({ urlOrMoniker: RPC_URL });
  const connection = new Connection(RPC_URL, "confirmed");

  const [attestationPdaRaw] = await deriveAttestationPda({
    credential: CREDENTIAL_PDA.toBase58() as any,
    schema: SCHEMA_PDA.toBase58() as any,
    nonce: USER_PUBKEY.toBase58() as any,
  });
  const attestationPda = new PublicKey(attestationPdaRaw as any);

  const schema = await fetchSchema(client.rpc, SCHEMA_PDA.toBase58() as any);
  const ATTESTATION_DATA = { kycCompleted: 1 } as any;
  const EXPIRY_SECONDS = 365 * 24 * 60 * 60;
  const expiryTs = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

  const ixSas = await getCreateAttestationInstruction({
    payer: issuer as any,
    authority: issuer as any,
    credential: CREDENTIAL_PDA.toBase58() as any,
    schema: SCHEMA_PDA.toBase58() as any,
    attestation: attestationPda.toBase58() as any,
    nonce: USER_PUBKEY.toBase58() as any,
    expiry: expiryTs,
    data: serializeAttestationData(schema.data, ATTESTATION_DATA),
    attestationProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
  });

  console.log("ixSas.accounts sample:", JSON.stringify((ixSas as any).accounts?.slice(0,3)));

  const toPubkey = (addr: any): PublicKey => {
    if (addr instanceof PublicKey) return addr;
    if (typeof addr === "string") return new PublicKey(addr);
    if (addr && typeof addr.toBase58 === "function") return new PublicKey(addr.toBase58());
    if (addr && addr.publicKey) {
      const pk = addr.publicKey;
      if (pk instanceof PublicKey) return pk;
      if (typeof pk.toBase58 === "function") return new PublicKey(pk.toBase58());
      if (pk?.data) {
        const bytes = Array.isArray(pk.data) ? Uint8Array.from(pk.data) : Uint8Array.from(pk.data.data ?? pk.data);
        return new PublicKey(bytes);
      }
    }
    if (addr && addr._keypair?.publicKey?.data) {
      const data: any = addr._keypair.publicKey.data;
      const bytes = Array.isArray(data) ? Uint8Array.from(data) : Uint8Array.from(data.data ?? data);
      return new PublicKey(bytes);
    }
    if (Array.isArray(addr)) return new PublicKey(Uint8Array.from(addr));
    if (addr && typeof addr === "object") {
      const vals = Object.values(addr);
      if (vals.every((v) => typeof v === "number")) return new PublicKey(Uint8Array.from(vals as number[]));
    }
    throw new Error("Unsupported address format in sas-lib account");
  };

  const programId = toPubkey((ixSas as any).programAddress);
  const keys: any[] = [];
  for (const [idx, a] of ((ixSas as any).accounts as any[]).entries()) {
    try {
      const pubkey = toPubkey(a.address);
      const isWritable = a.role === 1 || a.isWritable === true;
      const isSigner = a.isSigner === true || pubkey.equals(issuer.publicKey);
      keys.push({ pubkey, isSigner, isWritable });
    } catch (e) {
      console.error("Account conversion failed at index", idx, "value:", a);
      throw e;
    }
  }
  const data = Buffer.from(Object.values((ixSas as any).data) as number[]);

  const web3Ix = { programId, keys, data } as any;

  const tx = new Transaction().add(web3Ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [issuer], { commitment: "confirmed" });
  console.log("Attestation PDA:", attestationPda.toBase58());
  console.log("Tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


