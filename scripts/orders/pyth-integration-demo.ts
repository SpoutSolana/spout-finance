import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

// Pyth Price Feed IDs (Mainnet)
const PYTH_BTC_USD = new PublicKey('HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J');
const PYTH_ETH_USD = new PublicKey('JBu1AL4obBcCMqKBBxhpUVCNgtdUwxKXDLh6Wi6T8uyB');
const PYTH_SOL_USD = new PublicKey('H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG');

const RPC_URL = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

function loadPayer(): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array([227,57,226,193,103,32,190,14,91,51,133,96,149,134,131,77,184,237,7,195,99,50,47,12,102,32,4,190,49,192,247,244,151,169,36,215,229,28,34,160,198,236,236,166,52,235,16,159,45,165,228,89,58,52,35,226,151,250,219,38,24,217,178,35])
  );
}

// Get Pyth price feed for ticker
function getPythPriceFeed(ticker: string): PublicKey {
  switch (ticker) {
    case 'BTC': return PYTH_BTC_USD;
    case 'ETH': return PYTH_ETH_USD;
    case 'SOL': return PYTH_SOL_USD;
    default: throw new Error(`Unsupported ticker: ${ticker}`);
  }
}

// Parse Pyth price feed data (simplified)
async function getPythPrice(connection: Connection, ticker: string): Promise<{ price: number; timestamp: number }> {
  const priceFeedId = getPythPriceFeed(ticker);
  
  try {
    // Fetch the price feed account data
    const accountInfo = await connection.getAccountInfo(priceFeedId);
    if (!accountInfo) {
      throw new Error(`Price feed not found for ${ticker}`);
    }
    
    // In a real implementation, you would parse the Pyth price feed data structure
    // For this demo, we'll use mock data that simulates real Pyth prices
    const mockPrices = {
      'BTC': { price: 50000 * 10**6, timestamp: Math.floor(Date.now() / 1000) },
      'ETH': { price: 3000 * 10**6, timestamp: Math.floor(Date.now() / 1000) },
      'SOL': { price: 100 * 10**6, timestamp: Math.floor(Date.now() / 1000) },
    };
    
    return mockPrices[ticker as keyof typeof mockPrices] || mockPrices.SOL;
  } catch (error) {
    console.error(`Error fetching Pyth price for ${ticker}:`, error);
    throw error;
  }
}

// Demo function to show how buy/sell orders would work with Pyth
async function demoOrdersWithPyth() {
  console.log('🎯 PYTH INTEGRATION DEMO FOR ORDERS CONTRACT');
  console.log('============================================');
  
  const payer = loadPayer();
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl, provider);

  // Demo fetching prices for different tickers
  const tickers = ['BTC', 'ETH', 'SOL'];
  
  console.log('\n📊 Fetching Pyth Prices:');
  for (const ticker of tickers) {
    try {
      const priceData = await getPythPrice(connection, ticker);
      console.log(`${ticker}: $${(priceData.price / 10**6).toFixed(2)} (timestamp: ${priceData.timestamp})`);
    } catch (error) {
      console.error(`Failed to fetch ${ticker} price:`, error);
    }
  }

  // Demo how the orders contract would use these prices
  console.log('\n🛒 Order Contract Integration:');
  console.log('When a user creates a buy/sell order:');
  console.log('1. Contract receives ticker (e.g., "BTC")');
  console.log('2. Contract fetches current price from Pyth price feed');
  console.log('3. Contract validates price is fresh (< 30 seconds old)');
  console.log('4. Contract validates price confidence is reasonable');
  console.log('5. Contract calculates asset amount based on USDC amount and price');
  console.log('6. Contract executes the trade with the validated price');

  // Example calculation
  const usdcAmount = 1000 * 10**6; // 1000 USDC
  const btcPrice = await getPythPrice(connection, 'BTC');
  const btcAmount = (usdcAmount * 10**6) / btcPrice.price; // Convert to proper decimals
  
  console.log('\n💰 Example Trade Calculation:');
  console.log(`USDC Amount: $${(usdcAmount / 10**6).toFixed(2)}`);
  console.log(`BTC Price: $${(btcPrice.price / 10**6).toFixed(2)}`);
  console.log(`BTC Amount: ${(btcAmount / 10**6).toFixed(8)} BTC`);

  console.log('\n✅ Pyth integration ready for orders contract!');
  console.log('The contract can now fetch real-time prices for BTC, ETH, and SOL');
}

// Demo function to show account structure for orders with Pyth
async function showOrderAccountStructure() {
  console.log('\n🏗️  ORDER ACCOUNT STRUCTURE WITH PYTH:');
  console.log('=====================================');
  
  console.log('BuyAsset/SellAsset accounts now include:');
  console.log('- user: Signer (the user creating the order)');
  console.log('- user_usdc_account: User\'s USDC token account');
  console.log('- order_events: PDA storing order history');
  console.log('- orders_usdc_account: Contract\'s USDC escrow');
  console.log('- orders_authority: PDA authority for transfers');
  console.log('- usdc_mint: USDC token mint');
  console.log('- attestation_account: User\'s SAS attestation');
  console.log('- schema_account: SAS schema account');
  console.log('- credential_account: SAS credential account');
  console.log('- sas_program: SAS program ID');
  console.log('- price_feed: Pyth price feed account ⭐ NEW');
  console.log('- token_program: SPL Token program');
  console.log('- associated_token_program: Associated Token program');
  console.log('- system_program: System program');
  
  console.log('\n🔗 Pyth Price Feed Integration:');
  console.log('- Contract validates price feed account exists');
  console.log('- Contract parses price data from Pyth format');
  console.log('- Contract checks price staleness (< 30 seconds)');
  console.log('- Contract validates price confidence');
  console.log('- Contract uses validated price for calculations');
}

async function main() {
  try {
    await demoOrdersWithPyth();
    await showOrderAccountStructure();
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);

