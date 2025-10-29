import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { readFileSync } from 'fs';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './json/attested-user.json';
  const kp = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const sig = await connection.requestAirdrop(kp.publicKey, 1 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, 'confirmed');
  console.log('Airdropped 1 SOL to', kp.publicKey.toBase58(), 'sig:', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


