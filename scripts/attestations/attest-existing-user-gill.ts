import { createSolanaClient, SolanaClient } from 'gill';
import { getCreateAttestationInstruction, fetchSchema, serializeAttestationData, deriveAttestationPda } from 'sas-lib';
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';

async function sendAndConfirm(instructions: any[]) {
  const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./funded-keypair.json', 'utf8'))));
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  const web3Instructions = instructions.map((instruction: any) => ({
    programId: new PublicKey(instruction.programAddress),
    keys: instruction.accounts.map((acc: any) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: new PublicKey(acc.address).equals(payer.publicKey),
      isWritable: acc.role === 1,
    })),
    data: Buffer.from(Object.values(instruction.data)),
  }));
  const tx = new Transaction().add(...(web3Instructions as any));
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);
  return sig;
}

async function main() {
  const userPath = process.env.USER_PATH ?? './json/new-user.json';
  const user = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(userPath, 'utf8'))));
  const client: SolanaClient = createSolanaClient({ urlOrMoniker: 'devnet' });
  const credential: any = 'B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL';
  const schema: any = 'GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x';

  const [attestationPda] = await deriveAttestationPda({ credential, schema, nonce: user.publicKey.toBase58() as any });
  const sch = await fetchSchema(client.rpc, schema);
  const data = serializeAttestationData(sch.data, { kycCompleted: 1 });
  const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  const ix = await getCreateAttestationInstruction({
    payer: { address: (JSON.parse(fs.readFileSync('./funded-keypair.json', 'utf8')) && (Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./funded-keypair.json', 'utf8')))).publicKey.toBase58())) as any, sign: async () => new Uint8Array(64) } as any,
    authority: { address: (Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync('./funded-keypair.json', 'utf8')))).publicKey.toBase58()) as any, sign: async () => new Uint8Array(64) } as any,
    credential,
    schema,
    attestation: attestationPda as any,
    nonce: user.publicKey.toBase58() as any,
    expiry,
    data,
  });

  const sig = await sendAndConfirm([ix]);
  console.log('Attested existing user', user.publicKey.toBase58(), 'PDA', (attestationPda as any).toString(), 'sig', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


