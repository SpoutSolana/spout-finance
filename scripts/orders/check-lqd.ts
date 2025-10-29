import { Connection, PublicKey } from '@solana/web3.js';

// LQD feed used in on-chain code
const PYTH_LQD_FEED = new PublicKey('EUShAPT8QRmBnEicmHtUqXqQxg4X5yn5fEShwjMPACzf');

async function main() {
  const rpcUrl = process.env.RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  const info = await connection.getAccountInfo(PYTH_LQD_FEED);
  if (!info) {
    console.error('LQD price feed account not found');
    process.exit(1);
  }
  console.log('LQD price feed account found');
  console.log('Lamports:', info.lamports);
  console.log('Data length:', info.data.length);
  console.log('Owner:', info.owner.toBase58());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


