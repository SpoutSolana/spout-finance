import { deriveAttestationPda, SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS } from 'sas-lib';
import { PublicKey, Keypair } from '@solana/web3.js';
import fs from 'fs';

async function main() {
  const raw = fs.readFileSync('./funded-keypair.json', 'utf8');
  const secret = JSON.parse(raw);
  const payerKp = Keypair.fromSecretKey(Uint8Array.from(secret));
  const payer = payerKp.publicKey;

  const credential = new PublicKey('B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL');
  const schema = new PublicKey('GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x');

  const [attestationPda] = await deriveAttestationPda({
    credential: credential.toBase58() as any,
    schema: schema.toBase58() as any,
    nonce: payer.toBase58() as any,
  });

  const out = {
    user: { address: payer.toBase58(), privateKey: secret },
    attestation: {
      pda: (attestationPda as any).toString(),
      credential: credential.toBase58(),
      schema: schema.toBase58(),
      nonce: payer.toBase58(),
      sasProgram: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
      created_at: new Date().toISOString(),
    },
  };
  fs.writeFileSync('real-attestation-for-minting.json', JSON.stringify(out, null, 2));
  console.log('Wrote real-attestation-for-minting.json for payer with attestation PDA:', (attestationPda as any).toString());
}

main().catch((e) => { console.error(e); process.exit(1); });


