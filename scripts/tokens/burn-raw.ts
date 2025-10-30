import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as crypto from 'crypto';
import fs from 'fs';

function getDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  const hash = crypto.createHash('sha256').update(preimage).digest();
  return hash.subarray(0, 8);
}

function u64Le(n: bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(n);
  return buf;
}

async function main() {
  const rpc = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
  const walletPath = process.env.ANCHOR_WALLET!;
  if (!walletPath) throw new Error('ANCHOR_WALLET not set');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8'))));

  const connection = new Connection(rpc, 'confirmed');

  const programId = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

  const cfg = JSON.parse(fs.readFileSync('./json/slqd-mint-2022.json', 'utf8'));
  const mint = new PublicKey(cfg.mint);
  const programAuthority = new PublicKey(cfg.programAuthority);

  // Known attested user
  const owner = new PublicKey('Dd454fdtKRF5NEAbwCCVJnj8P4FroAD8Ei4dHRWUC4LW');
  const ownerAta = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config_v2')], programId);

  // Anchor instruction data: discriminator + amount (u64 le)
  const disc = getDiscriminator('burn_from_kyc_user');
  const amount = 1n; // 1 token; on-chain converts by decimals
  const data = Buffer.concat([disc, u64Le(amount)]);

  const keys = [
    { pubkey: mint, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: false, isWritable: false },
    { pubkey: ownerAta, isSigner: false, isWritable: true },
    { pubkey: payer.publicKey, isSigner: true, isWritable: false }, // issuer
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: programAuthority, isSigner: false, isWritable: false },
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId, keys, data });
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: 'confirmed' });
  console.log('Burn tx (raw):', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


