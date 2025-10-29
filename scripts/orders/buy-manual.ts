import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  const ticker = process.env.TICKER ?? 'LQD';
  const usdcAmount = new BN(process.env.USDC_AMOUNT ?? `${100 * 10 ** 6}`); // default 100 USDC
  const manualPrice = new BN(process.env.MANUAL_PRICE ?? `${100 * 10 ** 6}`); // default $100.00

  // Required external accounts
  const usdcMint = new PublicKey(requiredEnv('USDC_MINT'));
  const attestationAccount = new PublicKey(requiredEnv('ATTESTATION_ACCOUNT'));
  const schemaAccount = new PublicKey(requiredEnv('SCHEMA_ACCOUNT'));
  const credentialAccount = new PublicKey(requiredEnv('CREDENTIAL_ACCOUNT'));
  const priceFeed = new PublicKey(process.env.PRICE_FEED ?? PublicKey.default.toBase58()); // unused in manual

  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  // Address is embedded in IDL; provider supplies connection/wallet
  const program = new Program(idl as any, provider as any);

  // PDAs and ATAs
  const [orderEventsPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('order_events')],
    program.programId
  );
  const [ordersAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('orders_authority')],
    program.programId
  );
  const userUsdcAta = await getAssociatedTokenAddress(usdcMint, payer.publicKey);
  const ordersUsdcAta = await getAssociatedTokenAddress(usdcMint, ordersAuthorityPda, true);

  console.log('Calling buy_asset_manual...');
  console.log({ ticker, usdcAmount: usdcAmount.toString(), manualPrice: manualPrice.toString() });

  const sig = await program.methods
    .buyAssetManual(ticker, usdcAmount, manualPrice)
    .accounts({
      user: payer.publicKey,
      userUsdcAccount: userUsdcAta,
      orderEvents: orderEventsPda,
      ordersUsdcAccount: ordersUsdcAta,
      ordersAuthority: ordersAuthorityPda,
      usdcMint,
      attestationAccount,
      schemaAccount,
      credentialAccount,
      sasProgram: new PublicKey('SaS111111111111111111111111111111111111111'), // placeholder must match your on-chain config
      priceFeed,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .rpc();

  console.log('Transaction signature:', sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


