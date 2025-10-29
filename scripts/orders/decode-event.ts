import { AnchorProvider, Program, Wallet, EventParser } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'fs';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  const txSig = process.argv[2];
  if (!txSig) throw new Error('Usage: ts-node scripts/orders/decode-event.ts <TX_SIGNATURE>');

  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);

  const tx = await connection.getTransaction(txSig, { maxSupportedTransactionVersion: 0 });
  if (!tx) throw new Error('Transaction not found');
  const logs = tx.meta?.logMessages ?? [];

  const parser = new EventParser(program.programId, program.coder);
  const decoded: Array<{ name: string; data: any }> = [];
  for (const evt of parser.parseLogs(logs)) {
    decoded.push({ name: evt.name, data: evt.data });
  }

  if (decoded.length === 0) {
    console.log('No Anchor events found in logs. Raw logs:');
    for (const l of logs) console.log(l);
    return;
  }

  console.log('Decoded events:');
  for (const e of decoded) {
    console.log(`- ${e.name}:`, e.data);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


