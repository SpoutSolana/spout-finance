import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import * as crypto from 'crypto';
import fs from 'fs';

function disc(name: string): Buffer {
  const h = crypto.createHash('sha256').update(`global:${name}`).digest();
  return h.subarray(0, 8);
}
function u64le(n: bigint): Buffer { const b = Buffer.alloc(8); b.writeBigUInt64LE(n); return b; }

async function main() {
  const rpc = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
  const walletPath = process.env.ANCHOR_WALLET!;
  if (!walletPath) throw new Error('ANCHOR_WALLET not set');
  const payer = Keypair.fromSecretKey(Buffer.from(JSON.parse(fs.readFileSync(walletPath, 'utf8'))));
  const connection = new Connection(rpc, 'confirmed');

  const programId = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');
  const sasProgram = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');

  const { mint, programAuthority } = JSON.parse(fs.readFileSync('./json/slqd-mint-2022.json', 'utf8'));
  const mintPk = new PublicKey(mint);
  const programAuthorityPk = new PublicKey(programAuthority);

  const schemaInfo = JSON.parse(fs.readFileSync('./schema-info.json', 'utf8'));
  const credentialInfo = JSON.parse(fs.readFileSync('./credential-info.json', 'utf8'));
  const schemaPda = new PublicKey(schemaInfo.schema.pda);
  const credentialPda = new PublicKey(credentialInfo.credential.pda);

  const recipient = new PublicKey('Dd454fdtKRF5NEAbwCCVJnj8P4FroAD8Ei4dHRWUC4LW');
  const recipientAta = getAssociatedTokenAddressSync(mintPk, recipient, false, TOKEN_2022_PROGRAM_ID);

  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config_v2')], programId);

  // Derive attestation PDA: ["attestation", credential, schema, recipient]
  const [attestationPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('attestation'), credentialPda.toBuffer(), schemaPda.toBuffer(), recipient.toBuffer()],
    sasProgram,
  );

  const data = Buffer.concat([
    disc('mint_to_kyc_user_2022'),
    recipient.toBuffer(),
    u64le(10n),
  ]);

  const keys = [
    { pubkey: mintPk, isSigner: false, isWritable: true },
    { pubkey: recipientAta, isSigner: false, isWritable: true },
    { pubkey: attestationPda, isSigner: false, isWritable: false },
    { pubkey: schemaPda, isSigner: false, isWritable: false },
    { pubkey: credentialPda, isSigner: false, isWritable: false },
    { pubkey: sasProgram, isSigner: false, isWritable: false },
    { pubkey: programAuthorityPk, isSigner: false, isWritable: false },
    { pubkey: recipient, isSigner: false, isWritable: false },
    { pubkey: payer.publicKey, isSigner: true, isWritable: false }, // issuer
    { pubkey: config, isSigner: false, isWritable: false },
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // payer
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'), isSigner: false, isWritable: false },
    { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId, keys, data });
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: 'confirmed' });
  console.log('Mint-raw-2022 tx:', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


