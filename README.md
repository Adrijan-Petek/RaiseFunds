# RaiseFunds

<p align="center">
  <img src="public/logo/logo1.png" alt="RaiseFunds Logo" width="400">
</p>

<p align="center">
  <strong>A decentralized crowdfunding platform empowering creators and donors through blockchain transparency and social engagement.</strong>
</p>

<p align="center">
  <a href="https://raise-funds.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-raise--funds.vercel.app-blue?style=for-the-badge&logo=vercel" alt="Live Demo">
  </a>
  <a href="https://github.com/Adrijan-Petek/RaiseFunds/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Adrijan-Petek/RaiseFunds?style=for-the-badge" alt="License">
  </a>
  <a href="https://github.com/Adrijan-Petek/RaiseFunds/stargazers">
    <img src="https://img.shields.io/github/stars/Adrijan-Petek/RaiseFunds?style=for-the-badge" alt="Stars">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## 🌟 Overview

RaiseFunds is a cutting-edge decentralized crowdfunding platform that combines the power of blockchain technology with social media integration to create transparent, community-driven fundraising campaigns. Built on the Base network, it enables creators to launch campaigns and donors to contribute directly onchain, fostering trust through immutable transaction records and real-time progress tracking.

### 🎯 Mission

To democratize fundraising by providing creators with powerful tools to launch campaigns and donors with confidence through blockchain transparency, while building vibrant communities around meaningful causes.

### 📊 Current Status

**MVP Release v1.0** - Production-ready with placeholder donation flow for optimal user experience testing. Full onchain donation implementation planned for v2.0.

---

## ✨ Features

### 🚀 Core Platform
- **Dual Currency Support**: Create fundraisers and make donations in both ETH and USDC
- **Intuitive Campaign Creation**: Streamlined form with rich metadata, cover images, and category selection
- **Real-time Progress Tracking**: Dynamic progress bars with donation history and milestone visualization
- **Social Integration**: One-click sharing to Farcaster with rich OpenGraph previews
- **Creator Updates**: Multimedia update system to keep supporters engaged and informed
- **Advanced Moderation**: Comprehensive reporting system with admin controls

### 💰 Donation Experience
- **Multi-Currency Donations**: Choose between ETH and USDC for contributions
- **Seamless Donation Flow**: Placeholder system for testing UX with future onchain implementation
- **Personalized Contributions**: Donor names, messages, and optional anonymity
- **Transaction Transparency**: Complete donation history with status tracking and currency display
- **Automated Updates**: Real-time fundraiser total calculations and progress synchronization

### 🔐 Wallet & Identity
- **Multi-wallet Support**: MetaMask, Rainbow, Coinbase Wallet, and WalletConnect integration
- **Auto-populated Beneficiary**: Connected wallet automatically fills beneficiary address
- **Social Authentication**: Farcaster login with seamless wallet connection
- **Name Resolution**: ENS and Base name support for user identification
- **Secure Architecture**: Built with Wagmi and Viem for robust blockchain interactions

### 🎨 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Themes**: Automatic theme detection with manual override
- **Professional Splash Screen**: Engaging animated loading experience with theme-aware colors
- **Accessibility First**: WCAG compliant with keyboard navigation and screen reader support
- **Performance Optimized**: Fast loading with Next.js 16 and modern web standards

### 🔧 Technical Excellence
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Modern Architecture**: Next.js 16 App Router with server and client components
- **API-First Design**: RESTful API with comprehensive documentation
- **Database Integration**: PostgreSQL with optimized queries and data relationships
- **Image Management**: Cloudinary integration for uploads, optimization, and CDN delivery

---

## 🏗️ Architecture

### Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS | Modern React framework with type safety and utility-first styling |
| **Backend** | Next.js API Routes, PostgreSQL | Serverless API with relational database |
| **Blockchain** | Base Network, Viem, Wagmi | Ethereum L2 for fast, low-cost transactions |
| **Authentication** | WalletConnect, Farcaster Auth | Decentralized identity and social login |
| **Media** | Cloudinary | Image upload, optimization, and CDN delivery |
| **UI/UX** | Custom Splash Screen, Favicon | Professional branding and loading experience |
| **Deployment** | Vercel | Global CDN with automatic scaling |

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Client   │    │   Next.js App   │    │   PostgreSQL    │
│                 │    │                 │    │   Database      │
│ • React SPA     │◄──►│ • API Routes    │◄──►│ • Fundraisers   │
│ • Wallet Conn.  │    │ • Server Comp.  │    │ • Donations     │
│ • Social Auth   │    │ • Middleware    │    │ • Users         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Base Network  │
                    │   (Ethereum L2) │
                    │                 │
                    │ • Smart Contracts│
                    │ • Onchain Txns   │
                    │ • Fund Vaults    │
                    └─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.17.0 or later (20+ recommended)
- **PostgreSQL** database (local or cloud)
- **Git** for version control
- **Web3 Wallet** for testing (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Adrijan-Petek/RaiseFunds.git
   cd RaiseFunds
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/raisefunds"

   # WalletConnect
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Farcaster (optional)
   NEXT_PUBLIC_FARCASTER_RELAY="https://relay.farcaster.xyz"
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Push schema to database
   npx prisma db push

   # Optional: Seed with sample data
   npx prisma db seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### 🧪 Testing

```bash
# Run test suite
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

---

## 📖 Usage Guide

### For Campaign Creators

1. **Connect Wallet** - Authenticate with your preferred Web3 wallet
2. **Create Campaign** - Visit `/new` and complete the creation form
3. **Set Goals** - Define funding targets and campaign details
4. **Share Widely** - Use built-in social sharing to reach supporters
5. **Update Supporters** - Post regular updates to maintain engagement

### For Donors

1. **Browse Campaigns** - Explore active fundraisers on the homepage
2. **Connect Wallet** - Link your wallet for seamless donations
3. **Make Contribution** - Choose amount and add personal message
4. **Track Impact** - Follow campaign progress and creator updates
5. **Share Support** - Amplify campaigns you believe in

### For Developers

- **API Testing** - Use Postman or similar tools for endpoint testing
- **Database Management** - Access Prisma Studio with `npx prisma studio`
- **Code Quality** - Run `npm run lint` and `npm run type-check`
- **Build Process** - Execute `npm run build` for production optimization

---

## 🔌 API Reference

### Authentication
```http
POST /api/auth/login
```
Wallet-based authentication for user sessions.

### Fundraisers
```http
GET    /api/fundraisers           # List fundraisers with filtering
POST   /api/fundraisers           # Create new fundraiser
GET    /api/fundraisers/[id]      # Get fundraiser details
PUT    /api/fundraisers/[id]      # Update fundraiser (creator only)
DELETE /api/fundraisers/[id]      # Delete fundraiser (creator only)
```

### Donations
```http
POST   /api/fundraisers/[id]/donate  # Create donation record
POST   /api/donations/verify         # Verify and confirm donation
POST   /api/donations/[id]/confirm   # Mark donation as paid
```

### Updates
```http
GET    /api/fundraisers/[id]/updates # Get fundraiser updates
POST   /api/fundraisers/[id]/updates # Add new update
```

### Moderation
```http
POST   /api/reports               # Report fundraiser
GET    /api/admin                 # Get reports (admin only)
POST   /api/admin                 # Moderate content (admin only)
```

### Media Upload
```http
POST   /api/upload                # Upload images to Cloudinary
```

**API Documentation**: Comprehensive OpenAPI/Swagger docs available at `/api/docs`

---

## 📁 Project Structure

```
raisefunds/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # API route handlers
│   │   ├── admin/              # Admin dashboard pages
│   │   ├── f/[id]/             # Dynamic fundraiser pages
│   │   ├── me/                 # Creator dashboard
│   │   ├── new/                # Campaign creation
│   │   └── globals.css         # Global styles
│   ├── components/             # Reusable UI components
│   │   ├── Header.tsx          # Navigation component
│   │   ├── WalletConnect.tsx   # Wallet connection modal
│   │   ├── ThemeToggle.tsx     # Theme switcher
│   │   └── ui/                 # Base UI components
│   └── lib/                    # Utility libraries
│       ├── supabase.ts         # Database client
│       ├── cloudinary.ts       # Media upload service
│       └── payments.ts         # Blockchain utilities
├── public/                     # Static assets
│   ├── icons/                  # Wallet and UI icons
│   └── logo/                   # Brand assets
├── prisma/                     # Database schema
│   ├── schema.prisma           # Database models
│   └── migrations/             # Schema migrations
├── tailwind.config.js          # Styling configuration
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure build settings (automatically detected)

2. **Environment Variables**
   - Set all required environment variables in Vercel dashboard
   - Enable preview deployments for pull requests

3. **Domain Configuration**
   - Configure custom domain (optional)
   - Set up SSL certificates (automatic)

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Current)
- [x] Campaign creation and management
- [x] Dual currency support (ETH/USDC)
- [x] Placeholder donation system
- [x] Social sharing integration
- [x] Responsive UI/UX with dark/light themes
- [x] Professional splash screen and branding
- [x] Wallet integration and auto-population
- [x] Database architecture with PostgreSQL
- [x] Image upload and management with Cloudinary

### 🚧 Phase 2: Onchain Integration (Q1 2025)
- [ ] Smart contract development for Base network
- [ ] Real ETH/USDC donation processing
- [ ] Multi-token support expansion
- [ ] Gas optimization and transaction efficiency
- [ ] Onchain progress tracking

### 🎯 Phase 3: Advanced Features (Q2 2025)
- [ ] Milestone-based fund releases
- [ ] Advanced analytics dashboard
- [ ] Mobile application (React Native)
- [ ] Cross-platform sharing enhancements
- [ ] Email notifications and updates

### 🌟 Phase 4: Ecosystem Expansion (Q3 2025)
- [ ] Farcaster Frames v2 integration
- [ ] NFT rewards and collectibles system
- [ ] DAO governance features
- [ ] Multi-chain support (Optimism, Arbitrum)
- [ ] DeFi integrations and yield opportunities

---

## 🤝 Contributing

We welcome contributions from developers, designers, and community members passionate about decentralized crowdfunding.

### Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes with tests
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your branch: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Development Guidelines

- **Code Style**: Follow TypeScript and React best practices
- **Testing**: Write tests for new features and bug fixes
- **Documentation**: Update README and API docs for changes
- **Security**: Follow Web3 security best practices
- **Accessibility**: Ensure WCAG compliance for all features

### Areas for Contribution

- **Smart Contracts**: Solidity development for onchain functionality
- **UI/UX**: Design improvements and user experience enhancements
- **Testing**: Comprehensive test coverage and QA automation
- **Documentation**: API docs, user guides, and developer resources
- **Internationalization**: Multi-language support and localization

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

**RaiseFunds is not a verified charity platform.** Users should independently verify the legitimacy of fundraisers before contributing. The platform does not guarantee fund utilization or campaign validity. Exercise caution and conduct due diligence when participating in crowdfunding activities.

---

## 📞 Support & Community

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Adrijan-Petek/RaiseFunds/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Adrijan-Petek/RaiseFunds/discussions)
- **📧 Email**: For security issues, email security@raisefunds.com
- **🌐 Website**: [raisefunds.com](https://raisefunds.com)

---

<p align="center">
  <strong>Built with ❤️ for the decentralized future</strong>
</p>

<p align="center">
  <em>Empowering creators, connecting donors, building communities</em>
</p>
