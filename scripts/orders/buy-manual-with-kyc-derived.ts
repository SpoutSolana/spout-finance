import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'fs';
import BN from 'bn.js';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  const usdcMint = process.env.USDC_MINT ?? 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSZaNVYHfW9vXGX';
  const ticker = process.env.TICKER ?? 'LQD';
  const usdcAmount = process.env.USDC_AMOUNT ?? '100000000';
  const manualPrice = process.env.MANUAL_PRICE ?? '112000000';
  const credentialStr = process.env.CREDENTIAL ?? 'B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL';
  const schemaStr = process.env.SCHEMA ?? 'GvJbCuyqzTiACuYwFzqZt7cEPXSeD5Nq3GeWBobFfU8x';

  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);

  const user = payer.publicKey;
  const usdcMintPubkey = new PublicKey(usdcMint);
  const credentialAccount = new PublicKey(credentialStr);
  const schemaAccount = new PublicKey(schemaStr);

  const [ordersAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('orders_authority')],
    program.programId
  );
  const [userUsdcAccount] = PublicKey.findProgramAddressSync(
    [user.toBuffer(), Buffer.from('usdc')],
    program.programId
  );
  const [ordersUsdcAccount] = PublicKey.findProgramAddressSync(
    [ordersAuthority.toBuffer(), Buffer.from('usdc')],
    program.programId
  );
  const [orderEvents] = PublicKey.findProgramAddressSync(
    [Buffer.from('order_events')],
    program.programId
  );

  const sasProgram = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
  const [attestationAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('attestation'), credentialAccount.toBuffer(), schemaAccount.toBuffer(), user.toBuffer()],
    sasProgram
  );
  const priceFeed = new PublicKey('11111111111111111111111111111111');

  try {
    const tx = await program.methods
      .buyAssetManual(ticker, new BN(usdcAmount), new BN(manualPrice))
      .accounts({
        user,
        attestationAccount,
        credentialAccount,
        schemaAccount,
        userUsdcAccount,
        ordersUsdcAccount,
        ordersAuthority,
        orderEvents,
        usdcMint: usdcMintPubkey,
        sasProgram,
        priceFeed,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      })
      .rpc();
    console.log('Tx:', tx);
  } catch (e) {
    console.error('Error:', e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


