# RaiseFunds

<p align="center">
  <img src="public/logo/logo1.png" alt="RaiseFunds Logo" width="400">
</p>

<p align="center">
  <strong>A decentralized fundraising platform built on Farcaster, enabling users to create, share, and donate to fundraisers directly onchain.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api-endpoints">API</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Overview

RaiseFunds is a modern, decentralized fundraising platform that leverages the power of blockchain and social media to create transparent, community-driven fundraising campaigns. Built on the Base network (an Ethereum Layer 2), it integrates seamlessly with Farcaster for social sharing and engagement.

### Current Status: MVP with Placeholder Donations

The platform is currently in its MVP phase, featuring offchain placeholder donation logic to prioritize UI/UX development and core functionality. Real onchain donations will be implemented in future iterations.

**MVP Flow:**
1. Creators submit fundraiser details via an intuitive form
2. Data is securely stored in PostgreSQL
3. Donors can simulate donations with "Mark as Paid" functionality
4. Progress tracking and sharing capabilities are fully functional

## Features

### 🚀 Core Functionality
- **Fundraiser Creation**: Easy-to-use form for creating campaigns with rich metadata
- **Progress Tracking**: Real-time progress bars and donation history
- **Social Sharing**: One-click sharing to Farcaster with OpenGraph previews
- **Creator Updates**: Post text and image updates to keep supporters engaged
- **Moderation System**: User reporting and admin controls for content management

### 💰 Donation System (MVP)
- Placeholder donation flow for testing user experience
- Donor name and message support
- Donation status tracking (Pending → Confirmed)
- Automatic fundraiser total updates

### 🔗 Wallet Integration
- Multi-wallet support: MetaMask, Rainbow, Coinbase Wallet, WalletConnect
- Farcaster social login integration
- ENS and Base name resolution for user identification
- Seamless connection experience with Wagmi and Viem

### 🎨 User Experience
- Responsive design with dark/light theme support
- Modern UI built with Tailwind CSS
- Accessible components and keyboard navigation
- Mobile-optimized interface

### 🔧 Technical Features
- TypeScript for type safety
- Next.js 16 with App Router
- API routes for backend functionality
- Prisma ORM for database management
- Comprehensive error handling and loading states

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Icons**: Custom SVG wallet icons

### Backend
- **Runtime**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Wallet-based (future: SIWE)

### Blockchain
- **Network**: Base (Ethereum Layer 2)
- **Libraries**: Viem, Wagmi
- **Wallets**: MetaMask, Rainbow, Coinbase, WalletConnect
- **Social**: Farcaster Auth Kit

### Development & Deployment
- **Package Manager**: npm
- **Linting**: ESLint
- **Deployment**: Vercel
- **Version Control**: Git

## Prerequisites

Before running RaiseFunds locally, ensure you have:

- **Node.js**: v18.17.0 or later (v20+ recommended)
- **Database**: PostgreSQL instance (local or cloud like Neon/Supabase)
- **Git**: For cloning the repository
- **Wallet**: For testing wallet connections (MetaMask, etc.)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Adrijan-Petek/RaiseFunds.git
cd RaiseFunds
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/raisefunds"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-walletconnect-project-id"

# Farcaster (optional for MVP)
NEXT_PUBLIC_FARCASTER_RELAY="https://relay.farcaster.xyz"

# RPC URLs (optional, defaults provided)
NEXT_PUBLIC_MAINNET_RPC_URL="https://cloudflare-eth.com"
NEXT_PUBLIC_OPTIMISM_RPC_URL="https://mainnet.optimism.io"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### 5. Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Users

1. **Browse Fundraisers**: Visit the homepage to explore active campaigns
2. **Connect Wallet**: Click the wallet button to connect your preferred wallet
3. **Create Fundraiser**: Navigate to `/new` and fill out the creation form
4. **Donate**: On any fundraiser page, enter donation details and confirm
5. **Share**: Use the share button to post on Farcaster

### For Developers

- **API Testing**: Use tools like Postman to test API endpoints
- **Database**: Use Prisma Studio (`npx prisma studio`) to view/edit data
- **Linting**: Run `npm run lint` to check code quality
- **Building**: Run `npm run build` for production builds

## API Endpoints

### Fundraisers
- `GET /api/fundraisers` - List fundraisers with filtering/pagination
- `POST /api/fundraisers` - Create new fundraiser
- `GET /api/fundraisers/[id]` - Get fundraiser details
- `PUT /api/fundraisers/[id]` - Update fundraiser (admin/creator only)

### Donations
- `POST /api/fundraisers/[id]/donate` - Create donation record
- `POST /api/donations/verify` - Verify and confirm donation

### Updates
- `GET /api/fundraisers/[id]/updates` - Get fundraiser updates
- `POST /api/fundraisers/[id]/updates` - Add new update

### Moderation
- `POST /api/reports` - Report fundraiser
- `GET /api/admin` - Get reports (admin only)
- `POST /api/admin` - Hide fundraiser (admin only)

### Authentication
- `POST /api/auth/login` - Wallet-based login

## Project Structure

```
raisefunds/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin dashboard
│   │   ├── f/[id]/         # Fundraiser detail pages
│   │   ├── me/             # Creator dashboard
│   │   ├── new/            # Create fundraiser
│   │   └── page.tsx        # Homepage
│   ├── components/         # Reusable React components
│   │   ├── Header.tsx      # Main navigation
│   │   ├── WalletConnect.tsx # Wallet connection modal
│   │   └── ...
│   └── lib/                # Utility functions
├── public/                 # Static assets
│   ├── icons/              # Wallet and UI icons
│   └── logo/               # Brand assets
├── prisma/                 # Database schema and migrations
└── tailwind.config.js      # Styling configuration
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Future Roadmap

### Phase 1: Onchain Donations ✅ (Planned)
- Smart contract development for fundraiser vaults
- Real ETH donation processing
- Transaction verification and indexing

### Phase 2: Enhanced Features
- Milestone-based fund releases
- Multi-token support
- Advanced analytics dashboard

### Phase 3: Ecosystem Integration
- Farcaster Frames v2 integration
- Cross-platform sharing
- Mobile app development

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/RaiseFunds.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes and test thoroughly
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request with detailed description

### Development Guidelines
- Follow TypeScript best practices
- Write clear, concise commit messages
- Test wallet connections and API endpoints
- Ensure responsive design across devices
- Maintain consistent code style

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Disclaimer

**RaiseFunds is not a verified charity platform.** Users should independently verify the legitimacy of fundraisers before donating. The platform does not guarantee the use of funds or the validity of causes. Always exercise caution and due diligence when participating in crowdfunding activities.

## Support

- **Issues**: [GitHub Issues](https://github.com/Adrijan-Petek/RaiseFunds/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Adrijan-Petek/RaiseFunds/discussions)
- **Email**: [contact@raisefunds.app](mailto:contact@raisefunds.app)

---

<p align="center">
  Built with ❤️ for the decentralized future
</p>
