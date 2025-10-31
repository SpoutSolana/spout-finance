# Spout Finance - Solana Interface

A decentralized finance platform built on Solana that enables trading of tokenized real-world assets. This Next.js application provides a complete interface for managing your portfolio, trading assets, and tracking market data directly on-chain.

## What This Is

This is the frontend application for Spout Finance, connecting users to a Solana program that handles tokenized asset trading. The app integrates with Solana wallets (Phantom, Solflare), displays real-time market data, and manages token balances for assets like LQD (Spout US Corporate Bond Token), TSLA, AAPL, and GOLD synthetics.

The core functionality revolves around:
- **Wallet Integration**: Connect Solana wallets and manage transactions
- **Portfolio Management**: Track holdings across multiple tokenized assets
- **Trading Interface**: Buy and sell assets through the on-chain program
- **Market Data**: Real-time prices and analytics for various assets
- **Token Balances**: Query Token-2022 compatible SPL token balances

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Solana Web3.js** - Solana blockchain interaction
- **Anchor Framework** - Solana program integration
- **Wallet Adapter** - Wallet connection management
- **React Query** - Data fetching and caching
- **Supabase** - Authentication and user management
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

## Getting Started

### Prerequisites

You'll need:
- Node.js 18+ and npm
- A Solana wallet (Phantom or Solflare recommended)
- Solana devnet SOL for testing (get some from a faucet)
- Access to the Supabase project for auth

### Installation

```bash
# Clone and install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Variables

Set these in `.env.local`:

```env
# Solana RPC
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
# Or use your own RPC endpoint

# Supabase (for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Alpaca API (for market data)
NEXT_PUBLIC_ALPACA_API_KEY=your_alpaca_key
NEXT_PUBLIC_ALPACA_API_SECRET=your_alpaca_secret
NEXT_PUBLIC_ALPACA_DATA_URL=https://data.alpaca.markets

# MetalPrice API (for gold prices)
METALPRICE_API_KEY=your_metalprice_key
```

### Running Locally

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3000`.

## Project Structure

```
app/
├── app/                    # Dashboard pages (protected routes)
│   ├── portfolio/          # Portfolio overview and holdings
│   ├── trade/              # Trading interface
│   ├── markets/            # Market data and analytics
│   ├── profile/            # User profile and KYC
│   └── earn/               # Yield farming (coming soon)
├── auth/                   # Authentication pages
│   ├── login/
│   ├── register/
│   └── forgot-password/
└── api/                    # Next.js API routes
    ├── marketdata/         # Market data endpoints
    └── kyc-signature/      # KYC signature verification

components/
├── features/               # Feature-specific components
│   ├── portfolio/         # Portfolio-related components
│   ├── trade/             # Trading components
│   ├── markets/           # Market data components
│   └── reserve/           # Proof of reserve components
├── ui/                    # Reusable UI components
└── dashboardNavClient.tsx # Navigation component

hooks/
├── auth/                  # Authentication hooks
├── api/                   # API data fetching hooks
└── view/                  # On-chain data hooks
    ├── useBalanceToken.ts  # Token balance queries
    ├── useBalanceUSDC.ts  # USDC balance queries
    └── onChain/           # On-chain program interactions

lib/
├── supabase/              # Supabase client setup
├── services/              # External API services
└── utils/                 # Utility functions

idl/
└── spoutsolana.json       # Anchor program IDL
```

## How It Works

### Wallet Connection

The app uses Solana Wallet Adapter to manage wallet connections. Wallets are initialized in `components/providers.tsx`:

```typescript
const wallets = useMemo(
  () => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ],
  []
);
```

The `ConnectionProvider` sets the Solana network endpoint (currently devnet), and `WalletProvider` manages wallet state across the app. The `autoConnect` prop attempts to reconnect to previously connected wallets.

### Token Balances

Token balances are queried using custom hooks:

- **`useBalanceToken`**: Fetches Token-2022 compatible token balances. This is used for SLQD (Spout LQD token) which uses the Token-2022 program with 15 decimals.
- **`useBalanceUSDC`**: Fetches classic SPL token balances for USDC (6 decimals).

Both hooks:
1. Derive the Associated Token Address (ATA) for the user's wallet
2. Query the Solana RPC for token account balance
3. Convert raw amounts to UI-friendly decimals
4. Cache results using React Query

Example usage:
```typescript
const tokenBal = useBalanceToken(tokenMint, ownerPk);
const usdcBal = useBalanceUSDC(usdcMint, ownerPk);
```

### Trading Interface

The trading page (`app/app/trade/page.tsx`) allows users to buy and sell assets. It:
- Fetches current market prices from the Alpaca API
- Displays token and USDC balances
- Calculates estimated receive amounts including fees
- Validates balances before allowing trades

Trading transactions are prepared using the Anchor program IDL located at `idl/spoutsolana.json`. The program address is `EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB`.

### On-Chain Program Integration

The app interacts with an Anchor program deployed on Solana. Key interactions:

1. **Event Parsing**: The `useRecentActivity` hook parses transaction logs to extract buy/sell order events from the program
2. **Program IDL**: The Anchor IDL is loaded from `idl/spoutsolana.json` to properly encode/decode instructions
3. **Transaction Building**: Instructions are built using the Anchor framework and sent through the connected wallet

### Market Data

Market data is fetched from multiple sources:
- **Alpaca API**: Stock prices (TSLA, AAPL, etc.) and market data
- **MetalPrice API**: Gold (XAU) prices
- **Custom API routes**: Next.js API routes cache and transform market data

The `useMarketData` hook provides a unified interface for fetching prices across different assets.

### Portfolio Tracking

The portfolio page aggregates:
- Token balances from on-chain queries
- Market prices from API sources
- Portfolio value calculations
- Performance metrics (day change, total return)

All calculations happen client-side using React hooks and memoization for performance.

### Authentication

User authentication is handled by Supabase. The auth flow:
1. Users register/login through Supabase Auth
2. Sessions are managed via cookies
3. Protected routes check authentication status
4. User profiles are stored in Supabase database

The `AuthContext` provides global auth state accessible throughout the app.

## Key Hooks Explained

### `useBalanceToken`

Queries Token-2022 token balances. Important notes:
- SLQD token uses 15 decimals (not the standard 9)
- Forces UI display to use 12-decimal precision for readability
- Handles Associated Token Address derivation automatically
- Returns null if account doesn't exist (common for new tokens)

### `useBalanceUSDC`

Queries classic SPL token balances for USDC:
- Uses standard SPL Token program (not Token-2022)
- 6 decimal places for USDC
- Same ATA derivation logic as other tokens

### `useRecentActivity`

Parses on-chain transaction history:
- Fetches signatures for the program address
- Decodes transaction logs to find BuyOrderCreated/SellOrderCreated events
- Filters by user wallet address
- Currently disabled (see code comments) to avoid rate limiting

### `useMarketData`

Fetches asset prices from various sources:
- Caches results to reduce API calls
- Handles errors gracefully
- Returns current price and previous close for calculations

## Token Addresses (Devnet)

- **LQD Mint**: `ChcZdMV4jwXcvZQUWHEjMqMJBu3v62up2cJqY8CUkSCj` (Token-2022)
- **USDC Mint**: `Bd8tBm8WNPhmW5FjvAkisw4C9G3NEE7NowEW6VUuMHjW` (Classic SPL Token)
- **Program ID**: `EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB`

## Important Notes

### Token Decimals

SLQD uses 15 decimals but the UI displays with 12 decimal precision. This is handled in `useBalanceToken`:
```typescript
const ui = Number(value.amount) / 1_000_000_000_000; // 1e12
```

If you're doing calculations, remember that 1 SLQD = 1e15 lamports, but displayed as 1e12 in the UI.

### Network Configuration

The app is currently configured for Solana devnet. To switch to mainnet:
1. Update `clusterApiUrl("devnet")` in `components/providers.tsx` to `clusterApiUrl("mainnet-beta")` or use a custom RPC URL
2. Update all token mint addresses to mainnet addresses
3. Ensure users have mainnet SOL for transaction fees

### Rate Limiting

The transaction history fetching was disabled due to RPC rate limits. If you re-enable it, consider:
- Using a dedicated RPC provider (Helius, QuickNode, etc.)
- Implementing proper pagination
- Adding request throttling
- Caching aggressively

### React Query Configuration

Most hooks disable automatic refetching to reduce RPC calls:
- `refetchOnWindowFocus: false`
- `refetchOnReconnect: false`
- `refetchOnMount: false`
- `staleTime: Infinity`

This means balances won't auto-update. Call `refetch()` manually after transactions complete.

## Development Tips

1. **Wallet Issues**: If wallets won't connect, clear browser storage and reconnect
2. **Balance Not Showing**: Check that the token account exists. New users won't have ATAs until they receive tokens
3. **Transaction Failures**: Check the browser console and Solana Explorer for transaction details
4. **Build Errors**: Make sure all TypeScript types are correct. The build process is strict

## Deployment

The app is ready for deployment on platforms like Vercel:

```bash
# Build locally to test
npm run build

# Deploy (Vercel automatically detects Next.js)
vercel
```

Make sure all environment variables are set in your deployment platform's dashboard.

## Contributing

When adding new features:
- Follow the existing hook patterns for data fetching
- Use React Query for all async data
- Keep components focused and composable
- Add proper TypeScript types
- Test with devnet wallets before mainnet

## Troubleshooting

**Wallet won't connect**: 
- Ensure you're using a Solana-compatible wallet (Phantom/Solflare)
- Check browser console for errors
- Try disconnecting and reconnecting

**Balances showing zero**:
- Verify token mint addresses are correct
- Check that the wallet has the token account (may need to receive tokens first)
- Confirm you're on the correct network (devnet vs mainnet)

**Build failing**:
- Run `npm run lint` to check for errors
- Ensure all TypeScript types are defined
- Check that all imports resolve correctly

## License

UNLICENSED

