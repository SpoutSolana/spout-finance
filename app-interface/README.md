# 🚀 Spout Finance - Frontend Interface

> *The sleek and intuitive web interface for the future of decentralized investing*

[![Next.js](https://img.shields.io/badge/Next.js-15.2.1-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Aptos](https://img.shields.io/badge/Built%20for-Aptos-00D4FF?style=for-the-badge)](https://aptos.dev/)

## 🌟 Overview

The **Spout Finance Frontend** is a modern, responsive web application that provides users with seamless access to tokenized real-world assets on the Aptos blockchain. Built with cutting-edge web technologies, it offers an institutional-grade trading experience with beautiful UI/UX design.

### 🎯 Key Highlights

- **🏛️ Tokenized Real Assets**: Trade investment-grade bonds (LQD) and blue-chip equities (TSLA, AAPL, GOLD) backed 1:1 by real ETFs
- **⚡ Lightning Fast**: Built on Aptos blockchain for sub-second transaction finality
- **🔐 Enterprise Security**: Advanced KYC integration and secure asset management
- **📊 Professional Analytics**: Real-time charts, portfolio tracking, and yield optimization
- **🌐 Responsive Design**: Optimized for desktop, tablet, and mobile experiences
- **🔗 Web3 Integration**: Seamless wallet connectivity and blockchain interactions

## ✨ Features

### 🚀 **Core Trading Platform**

- **Real-Time Trading**: Buy and sell tokenized assets with live price feeds
- **Interactive Charts**: Professional-grade charting with TradingView-style interface
- **Portfolio Management**: Track holdings, performance, and yield generation
- **Order Management**: Advanced order types and execution monitoring
- **Risk Analytics**: Real-time risk metrics and portfolio optimization tools

### 🔐 **Security & Compliance**

- **On-Chain KYC**: Decentralized identity verification system
- **Proof of Reserve**: Transparent verification of asset backing
- **Secure Authentication**: Multi-factor authentication and session management
- **Compliance Dashboard**: Regulatory compliance tracking and reporting

### 📊 **Market Data & Analytics**

- **Live Price Feeds**: Real-time pricing from Switchboard and Pyth oracles
- **Historical Data**: Comprehensive historical price and volume charts
- **Market Analytics**: Advanced market metrics and trend analysis
- **Yield Tracking**: Real-time yield calculation and distribution tracking

### 🎨 **User Experience**

- **Modern Design**: Clean, intuitive interface with smooth animations
- **Dark/Light Themes**: Customizable themes for optimal viewing
- **Responsive Layout**: Seamless experience across all devices
- **Accessibility**: WCAG compliant design for inclusive access

## 🛠 Tech Stack

### **Frontend Framework**
- **[Next.js 15.2.1](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Modern React with latest features
- **[TypeScript 5.8.2](https://www.typescriptlang.org/)** - Type-safe development

### **Styling & UI**
- **[Tailwind CSS 3.4.1](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible component library
- **[Radix UI](https://www.radix-ui.com/)** - Low-level UI primitives
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready motion library
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon toolkit

### **Data & State Management**
- **[TanStack Query](https://tanstack.com/query)** - Powerful data synchronization
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

### **Blockchain Integration**
- **[Ethers.js 6.14.4](https://ethers.org/)** - Ethereum JavaScript library
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service for user data

### **Charts & Visualization**
- **[Recharts 3.0](https://recharts.org/)** - Composable charting library
- **[Lightweight Charts](https://tradingview.github.io/lightweight-charts/)** - Professional trading charts

### **Development Tools**
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[PostCSS](https://postcss.org/)** - CSS transformation tool

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Git** - Version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AptosHackathon/spout-finance.git
   cd spout-finance/app-interface
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:

   ```env
   # Required - Add your API keys
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Optional - Analytics and monitoring
   NEXT_PUBLIC_VERCEL_ANALYTICS=true
   ```

4. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action! 🎉

## 📂 Project Structure

```
app-interface/
├── app/                     # Next.js App Router pages
│   ├── api/                # API routes and endpoints
│   ├── app/                # Main trading application
│   ├── auth/               # Authentication pages
│   ├── company/            # Company information
│   ├── how-spout-works/    # Educational content
│   ├── markets/            # Market data and analytics
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Landing page
├── components/             # Reusable React components
│   ├── features/           # Feature-specific components
│   ├── icons/              # Custom icon components
│   ├── interfaces/         # Type interfaces
│   ├── magicui/            # Magic UI components
│   └── ui/                 # Base UI components (Shadcn/ui)
├── context/               # React context providers
│   ├── AptosNetworkContext.tsx
│   ├── AuthContext.tsx
│   └── userContext.tsx
├── hooks/                 # Custom React hooks
│   ├── api/               # API-related hooks
│   ├── aptos/             # Aptos blockchain hooks
│   ├── auth/              # Authentication hooks
│   └── view/              # UI state hooks
├── lib/                   # Utility libraries
│   ├── cache/             # Caching utilities
│   ├── services/          # External service integrations
│   ├── supabase/          # Supabase client configuration
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── public/               # Static assets
└── style/                # Global styles and themes
```

## 🔗 Integration with Aptos Ecosystem

### **Smart Contract Integration**

The frontend seamlessly integrates with Spout Finance's Move smart contracts deployed on Aptos:

- **Trading Engine**: Direct integration with Move-based DEX contracts
- **Asset Management**: Real-time balance and portfolio tracking
- **Oracle Integration**: Live price feeds from Switchboard and Pyth
- **KYC System**: Decentralized identity verification on Aptos

### **Aptos Network Features**

- **Transaction Speed**: Sub-second finality for instant trading
- **Low Fees**: Cost-effective transactions for frequent trading
- **Scalability**: Handle high-frequency trading without congestion
- **Security**: Move language ensures memory-safe smart contracts

## 🚀 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality checks |
| `npm run format` | Format code with Prettier |

## 📱 Key Pages & Features

### 🏠 **Landing Page** (`/`)
- Hero section with value proposition
- Feature highlights and benefits
- Partner showcases and testimonials
- Call-to-action for getting started

### 📊 **Trading Dashboard** (`/app`)
- Real-time portfolio overview
- Live market data and charts
- Trading interface for buy/sell orders
- Transaction history and analytics

### 🔐 **Authentication** (`/auth`)
- Secure wallet connection
- KYC verification flow
- Profile management
- Security settings

### 🏢 **Markets** (`/markets`)
- Asset listings and details
- Market analytics and insights
- Price charts and historical data
- Trading pair information

### 📖 **How It Works** (`/how-spout-works`)
- Educational content about tokenized assets
- Step-by-step trading guides
- FAQ and support resources
- Platform documentation

## 🎨 Design System

### **Color Palette**
- **Primary**: Teal (`#14B8A6`) - Trust and stability
- **Secondary**: Emerald (`#10B981`) - Growth and prosperity  
- **Accent**: Blue (`#3B82F6`) - Technology and innovation
- **Neutral**: Gray scale for text and backgrounds

### **Typography**
- **Headings**: Custom serif font for elegance
- **Body Text**: Inter for readability
- **Code**: JetBrains Mono for technical content

### **Components**
Built with **Shadcn/ui** and **Radix UI** for:
- ✅ Accessibility (WCAG 2.1 compliant)
- 🎯 Consistency across the platform
- ⚡ Performance optimization
- 🔧 Easy customization and theming

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS customization |
| `tsconfig.json` | TypeScript compiler options |
| `components.json` | Shadcn/ui component configuration |
| `postcss.config.js` | PostCSS plugins configuration |

## 🌐 API Integration

### **External APIs**
- **Supabase**: User authentication and data storage
- **Aptos RPC**: Blockchain data and transaction submission
- **Market Data APIs**: Real-time and historical asset prices

### **Internal APIs** (`/api/`)
- Authentication endpoints
- Market data aggregation
- User profile management
- Transaction processing

## 🔒 Security Features

### **Frontend Security**
- **Environment Variable Protection**: Sensitive data secured
- **Input Validation**: Client-side validation with Zod schemas
- **XSS Protection**: Sanitized user inputs and outputs
- **CSRF Protection**: Built-in Next.js protection mechanisms

### **Blockchain Security**
- **Wallet Integration**: Secure connection to Aptos wallets
- **Transaction Signing**: User-controlled transaction approval
- **Key Management**: Non-custodial wallet approach
- **Smart Contract Interaction**: Type-safe contract calls

## 🚀 Performance Optimizations

### **Next.js Features**
- **App Router**: Latest routing with improved performance
- **Server Components**: Reduced client-side JavaScript
- **Image Optimization**: Automatic image optimization and lazy loading
- **Code Splitting**: Automatic bundle optimization

### **Loading & UX**
- **Loading States**: Smooth loading indicators
- **Error Boundaries**: Graceful error handling
- **Skeleton Screens**: Improved perceived performance
- **Progressive Enhancement**: Works with JavaScript disabled

## 🤝 Contributing

We welcome contributions to improve the Spout Finance frontend! Here's how to get started:

### **Development Workflow**

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Follow the coding standards**
   ```bash
   npm run lint
   npm run format
   ```
5. **Test your changes**
6. **Submit a pull request**

### **Code Standards**
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write descriptive commit messages
- Add appropriate documentation
- Ensure responsive design

## 📞 Support & Resources

### **Documentation**
- 📖 [Spout Finance Docs](https://docs.spout-finance.com) - Comprehensive guides
- 🔗 [Aptos Documentation](https://aptos.dev/docs) - Blockchain development
- ⚛️ [Next.js Documentation](https://nextjs.org/docs) - Framework reference

### **Community**
- 💬 [Discord Community](https://discord.gg/spout-finance) - Developer chat
- 🐦 [Twitter Updates](https://twitter.com/SpoutFinance) - Latest announcements
- 📧 [Developer Support](mailto:dev@spout-finance.com) - Technical assistance

### **Repository Links**
- 🏠 [Main Repository](https://github.com/AptosHackathon/spout-finance) - Complete project
- 📱 [Frontend Only](https://github.com/AptosHackathon/spout-finance/tree/main/app-interface) - This interface
- 🔗 [Smart Contracts](https://github.com/AptosHackathon/spout-finance/tree/main/Movecontracts) - Move contracts

---

<div align="center">

**Built with ❤️ by the Spout Finance team**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AptosHackathon/spout-finance/tree/main/app-interface)

</div>
