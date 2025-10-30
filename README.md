# Spout Finance - Backend (Solana)

## 🏦 What is Spout Finance?

Spout Finance is a revolutionary DeFi platform that bridges traditional investment assets with blockchain technology. Built on the lightning-fast Solana blockchain, we tokenize investment-grade U.S. bonds and equities, making them accessible as secure, yield-bearing tokens backed 1:1 by real ETFs.

### 💡 The Vision
Transform how people invest by making high-quality traditional assets accessible, transparent, and efficient through blockchain technology - without sacrificing security or compliance.

---

## 🏗️ Project Architecture

This backend service is built with **NestJS** and handles the core blockchain interactions for the Spout Finance platform. It monitors Solana program events and automatically processes token minting/burning operations based on user orders.

### 📁 Project Structure

```
spout-backend-solana/
├── src/
│   ├── app.module.ts              # Main application module
│   ├── app.controller.ts          # Basic health check controller
│   ├── app.service.ts             # Basic application service
│   ├── main.ts                    # Application entry point
│   └── modules/
│       ├── pooling/               # Order monitoring & event handling
│       │   ├── pooling.module.ts
│       │   ├── pooling.service.ts # Event polling and processing
│       │   ├── decoder.ts         # Event data decoding utilities
│       │   └── idl/
│       │       └── program.json   # Solana program IDL
│       └── web3/                  # Blockchain interactions
│           ├── web3.module.ts
│           ├── web3.controller.ts # REST API endpoints
│           ├── web3.service.ts    # Token minting/burning logic
│           └── user-attestation.service.ts # KYC attestation handling
├── test/                          # E2E tests
├── package.json                   # Dependencies and scripts
└── README.md                      # This file
```

---

## 🔧 Core Components

### 1. **Pooling Service** (`src/modules/pooling/`)
- **Purpose**: Monitors Solana blockchain for buy/sell order events
- **Frequency**: Polls every 15 seconds using cron jobs
- **Functionality**:
  - Listens for `BuyOrderCreated` and `SellOrderCreated` events
  - Automatically triggers token operations when orders are detected
  - Decodes raw blockchain event data into structured formats

### 2. **Web3 Service** (`src/modules/web3/`)
- **Purpose**: Handles all blockchain interactions and token operations
- **Key Features**:
  - **Token Minting**: Creates new asset tokens when users place buy orders
  - **Token Burning**: Burns asset tokens when users place sell orders
  - **USDC Handling**: Automatically transfer USDC tokens to users after sell operations
  - **Associated Token Account (ATA) Management**: Creates and manages user token accounts

### 3. **User Attestation Service** (`src/modules/web3/`)
- **Purpose**: Manages KYC (Know Your Customer) compliance
- **Functionality**:
  - Creates on-chain attestations for verified users
  - Validates user eligibility for token operations
  - Integrates with Solana Attestation Service (SAS)

---

## 🔄 How Buy/Sell Orders Work

### 📈 Buy Order Process

1. **User Places Buy Order**: User submits a buy order through the Solana program
2. **Event Detection**: Pooling service detects `BuyOrderCreated` event
3. **Event Processing**: System decodes the order details:
   - User wallet address
   - Asset ticker (e.g., "SPY", "QQQ")
   - USDC amount spent
   - Asset amount to receive
   - Current price and oracle timestamp
4. **Token Minting**: Web3 service automatically mints asset tokens to user's wallet
5. **Compliance Check**: Validates user's KYC attestation before minting

### 📉 Sell Order Process

1. **User Places Sell Order**: User submits a sell order through the Solana program
2. **Event Detection**: Pooling service detects `SellOrderCreated` event
3. **Event Processing**: System processes the sell order details
4. **Token Burning**: Web3 service burns the specified amount of asset tokens from user's wallet
5. **USDC Compensation**: System automatically mints equivalent USDC tokens to user's wallet
6. **Compliance Verification**: Ensures all operations comply with attestation requirements

---

## 🛠️ Technology Stack

- **Framework**: NestJS (Node.js)
- **Blockchain**: Solana
- **Language**: TypeScript
- **Key Libraries**:
  - `@solana/web3.js` - Solana blockchain interactions
  - `@solana/spl-token` - Token program operations
  - `@coral-xyz/anchor` - Solana program framework
  - `@nestjs/schedule` - Cron job scheduling
  - `sas-lib` - Solana Attestation Service integration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Access to Solana devnet/mainnet
- Environment variables configured

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd spout-backend-solana

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Watch mode (auto-restart on changes)
npm run start:dev
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

*Built with ❤️ by the Spout Finance team*
