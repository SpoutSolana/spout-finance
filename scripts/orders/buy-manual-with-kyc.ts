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

  // Load real SAS attestation data
  const attestationData = JSON.parse(readFileSync('./real-attestation-for-minting.json', 'utf8'));
  const attestationAccount = new PublicKey(attestationData.attestation.pda);
  const credentialAccount = new PublicKey(attestationData.attestation.credential);
  const schemaAccount = new PublicKey(attestationData.attestation.schema);
  const sasProgram = new PublicKey(attestationData.attestation.sasProgram);

  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);

  const user = payer.publicKey;
  const usdcMintPubkey = new PublicKey(usdcMint);

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

  const priceFeed = new PublicKey('11111111111111111111111111111111');

  console.log('Buy Asset Manual with KYC Test');
  console.log('===============================');
  console.log('User:', user.toString());
  console.log('Ticker:', ticker);
  console.log('USDC Amount:', usdcAmount);
  console.log('Manual Price:', manualPrice);
  console.log('Attestation Account:', attestationAccount.toString());
  console.log('Credential Account:', credentialAccount.toString());
  console.log('Schema Account:', schemaAccount.toString());
  console.log('SAS Program:', sasProgram.toString());
  console.log('Orders Authority:', ordersAuthority.toString());
  console.log('User USDC Account:', userUsdcAccount.toString());
  console.log('Orders USDC Account:', ordersUsdcAccount.toString());
  console.log('Order Events:', orderEvents.toString());

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

    console.log('\nTransaction signature:', tx);

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
