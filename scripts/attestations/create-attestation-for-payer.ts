import {
  getCreateAttestationInstruction,
  fetchSchema,
  serializeAttestationData,
  deriveAttestationPda,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from 'sas-lib';
import { createSolanaClient, SolanaClient } from 'gill';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';

async function main() {
  const rpc = 'devnet';
  const client: SolanaClient = createSolanaClient({ urlOrMoniker: rpc });

  // Load funded payer
  const raw = fs.readFileSync('./funded-keypair.json', 'utf8');
  const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));

  // Known existing schema/credential from repo
  const credentialPda = new PublicKey('B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL');
  const schemaPda = new PublicKey('GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x');

  // Nonce = payer pubkey (so we can sign as the attested user)
  const nonce = payer.publicKey;

  const [attestationPda] = await deriveAttestationPda({
    credential: credentialPda.toBase58() as any,
    schema: schemaPda.toBase58() as any,
    nonce: nonce.toBase58() as any,
  });

  const schema = await fetchSchema(client.rpc, schemaPda.toBase58() as any);
  const data = serializeAttestationData(schema.data, { kycCompleted: 1 });
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  // Build instruction
  const ixs = [await getCreateAttestationInstruction({
    payer: { address: payer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    authority: { address: payer.publicKey.toBase58() as any, sign: async () => new Uint8Array(64) } as any,
    credential: credentialPda.toBase58() as any,
    schema: schemaPda.toBase58() as any,
    attestation: attestationPda as any,
    nonce: nonce.toBase58() as any,
    expiry,
    data,
  })];

  // Convert to web3.js and send
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const web3Ixs = ixs.map((ix: any) => ({
    programId: new PublicKey(ix.programAddress),
    keys: ix.accounts.map((acc: any) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: new PublicKey(acc.address).equals(payer.publicKey),
      isWritable: acc.role === 1,
    })),
    data: Buffer.from(Object.values(ix.data)),
  }));
  const tx = new Transaction().add(...web3Ixs);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log('Created attestation for payer. Sig:', sig);

  const out = {
    user: { address: payer.publicKey.toBase58(), privateKey: JSON.parse(raw) },
    attestation: {
      pda: (attestationPda as any).toString(),
      credential: credentialPda.toBase58(),
      schema: schemaPda.toBase58(),
      nonce: payer.publicKey.toBase58(),
      sasProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
      created_at: new Date().toISOString(),
    },
  };
  fs.writeFileSync('real-attestation-for-minting.json', JSON.stringify(out, null, 2));
  console.log('Wrote real-attestation-for-minting.json for payer');
}

main().catch((e) => { console.error(e); process.exit(1); });


