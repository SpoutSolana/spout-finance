import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'fs';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);

  const [orderEventsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('order_events')],
    program.programId
  );

  console.log('Initializing order events PDA:', orderEventsPda.toBase58());
  const sig = await program.methods
    .initializeOrderEvents()
    .accounts({
      payer: payer.publicKey,
      orderEvents: orderEventsPda,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .rpc();

  console.log('Init signature:', sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


