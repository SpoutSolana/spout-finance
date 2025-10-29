import { getCreateAttestationInstruction, fetchSchema, serializeAttestationData, deriveAttestationPda, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from 'sas-lib';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';

async function main() {
  const userPath = process.env.USER_PATH ?? './json/new-user.json';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  const credentialStr = process.env.CREDENTIAL ?? 'B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL';
  const schemaStr = process.env.SCHEMA ?? 'GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x';

  const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(payerPath, 'utf8'))));
  const user = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(userPath, 'utf8'))));
  const credential = new PublicKey(credentialStr);
  const schema = new PublicKey(schemaStr);

  const [attestationPda] = await deriveAttestationPda({
    credential: credential.toBase58() as any,
    schema: schema.toBase58() as any,
    nonce: user.publicKey.toBase58() as any,
  });

  const conn = new Connection(clusterApiUrl('devnet'), 'confirmed');
  // Minimal schema fetch for layout
  const { fetchSchema: fetchSch } = await import('sas-lib');
  const sch = await fetchSch(conn as any, schema.toBase58() as any);
  const data = serializeAttestationData(sch.data, { kycCompleted: 1 });
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const ix = await getCreateAttestationInstruction({
    payer: { address: payer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    authority: { address: payer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    credential: credential.toBase58() as any,
    schema: schema.toBase58() as any,
    attestation: attestationPda as any,
    nonce: user.publicKey.toBase58() as any,
    expiry,
    data,
  });

  const web3Ix = {
    programId: new PublicKey(ix.programAddress),
    keys: ix.accounts.map((acc: any) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: new PublicKey(acc.address).equals(payer.publicKey),
      isWritable: acc.role === 1,
    })),
    data: Buffer.from(Object.values(ix.data)),
  };
  const tx = new Transaction().add(web3Ix as any);
  const sig = await sendAndConfirmTransaction(conn, tx, [payer]);
  console.log('Created attestation for', user.publicKey.toBase58(), 'PDA:', (attestationPda as any).toString(), 'sig:', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


