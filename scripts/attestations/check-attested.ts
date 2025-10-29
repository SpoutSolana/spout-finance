import { createSolanaClient } from 'gill';
import { deriveAttestationPda, fetchAttestation, fetchSchema, deserializeAttestationData } from 'sas-lib';
import { PublicKey, clusterApiUrl, Connection } from '@solana/web3.js';

async function main() {
  const userStr = process.env.USER_PUBKEY ?? '4V8HknUFXSynBZnfkeU96XSkPX2oL4kLmnzQFQ3pWkDi';
  const credentialStr = process.env.CREDENTIAL ?? 'B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL';
  const schemaStr = process.env.SCHEMA ?? 'GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x';
  const client = createSolanaClient({ urlOrMoniker: 'devnet' });

  const user = new PublicKey(userStr);
  const credential = new PublicKey(credentialStr);
  const schema = new PublicKey(schemaStr);

  const [attestationPda] = await deriveAttestationPda({
    credential: credential.toBase58() as any,
    schema: schema.toBase58() as any,
    nonce: user.toBase58() as any,
  });

  console.log('Derived attestation PDA:', attestationPda.toString());

  try {
    const att = await fetchAttestation(client.rpc, attestationPda);
    const sch = await fetchSchema(client.rpc, schema.toBase58() as any);
    const decoded = deserializeAttestationData(sch.data, att.data.data as Uint8Array);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const valid = now < att.data.expiry;
    console.log('Found attestation.');
    console.log('  expiry:', att.data.expiry.toString());
    console.log('  validNow:', valid);
    console.log('  data:', decoded);
  } catch (e) {
    console.log('No attestation found at PDA or fetch failed.');
    throw e;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


