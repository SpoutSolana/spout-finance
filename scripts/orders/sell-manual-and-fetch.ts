import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
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
  const attestationAccount = process.env.ATTESTATION_ACCOUNT ?? '11111111111111111111111111111111';
  const schemaAccount = process.env.SCHEMA_ACCOUNT ?? '11111111111111111111111111111111';
  const credentialAccount = process.env.CREDENTIAL_ACCOUNT ?? '11111111111111111111111111111111';
  const ticker = process.env.TICKER ?? 'LQD';
  const assetAmount = process.env.ASSET_AMOUNT ?? '1000000';
  const manualPrice = process.env.MANUAL_PRICE ?? '112000000';

  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);

  const user = payer.publicKey;
  const usdcMintPubkey = new PublicKey(usdcMint);
  const attestationAccountPubkey = new PublicKey(attestationAccount);
  const schemaAccountPubkey = new PublicKey(schemaAccount);
  const credentialAccountPubkey = new PublicKey(credentialAccount);

  // Derive PDAs
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

  // Additional accounts needed for SellAsset context
  const sasProgram = new PublicKey('22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG');
  const priceFeed = new PublicKey('11111111111111111111111111111111');

  console.log('Sell Asset Manual Test');
  console.log('=====================');
  console.log('User:', user.toString());
  console.log('Ticker:', ticker);
  console.log('Asset Amount:', assetAmount);
  console.log('Manual Price:', manualPrice);
  console.log('Orders Authority:', ordersAuthority.toString());
  console.log('User USDC Account:', userUsdcAccount.toString());
  console.log('Orders USDC Account:', ordersUsdcAccount.toString());
  console.log('Order Events:', orderEvents.toString());

  try {
    const tx = await program.methods
      .sellAssetManual(ticker, new BN(assetAmount), new BN(manualPrice))
      .accounts({
        user,
        attestationAccount: attestationAccountPubkey,
        credentialAccount: credentialAccountPubkey,
        schemaAccount: schemaAccountPubkey,
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

    console.log('Transaction signature:', tx);

    // Fetch transaction details
    const txDetails = await connection.getTransaction(tx, { maxSupportedTransactionVersion: 0 });
    if (txDetails) {
      console.log('\nTransaction logs:');
      txDetails.meta?.logMessages?.forEach((log, i) => {
        console.log(`${i}: ${log}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
