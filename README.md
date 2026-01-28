# RaiseFunds

<p align="center">
  <img src="public/logo/logo.png" alt="RaiseFunds Logo" width="400">
</p>

A decentralized fundraising platform built on Farcaster, enabling users to create, share, and donate to fundraisers directly onchain. Developed with modern web technologies for a seamless and secure experience.

## How It Works

### Current MVP (Placeholder Donations)

RaiseFunds is currently in MVP stage with offchain placeholder donation logic to focus on UI/UX and core features. Donations are simulated:

1. **Fundraiser Creation**: Creators submit fundraiser details via a form. Data is stored in PostgreSQL.
2. **Donation Process**:
   - Donors enter amount, name, and message.
   - A PENDING donation record is created in the database.
   - Donors click "Mark as Paid" to confirm (simulating payment).
   - Donation status changes to CONFIRMED, and fundraiser total is updated.
3. **Sharing**: Fundraisers can be shared on Farcaster with prefilled posts and OpenGraph previews.
4. **Moderation**: Users can report fundraisers; admins can hide them.

This allows testing of the full user flow without onchain complexity.

### Future Onchain Implementation

Once visuals are finalized, we will write bulletproof smart contracts:

- **FundraiserRegistry**: Solidity contract to create and manage fundraiser configs. Deploys FundraisingVault for each campaign.
- **FundraisingVault**: ERC-4626-like vault that accepts ETH donations, tracks totals, and allows withdrawals with rules (e.g., milestones, escrow).
- **Integration**:
  - Replace placeholder donations with real tx submissions.
  - Verify tx receipts onchain.
  - Index events for real-time updates.
  - Add wallet connections for seamless donations.

The codebase uses fields like `registryCampaignId`, `vaultAddress`, and `paymentRef` to plug in onchain logic easily.

## Features

- **Fundraiser Creation**: Users can create fundraisers with titles, descriptions, goals, beneficiary addresses, and cover images.
- **Onchain Donations**: Direct ETH donations to beneficiary wallets on the Base network, verified via transaction receipts.
- **Farcaster Integration**: Share fundraisers on Farcaster with rich previews and potential for Frames v2 mini-apps.
- **Progress Tracking**: Real-time progress bars and donation lists.
- **Creator Updates**: Fundraiser creators can post updates with text and images.
- **Moderation**: Basic reporting system for inappropriate content.
- **Wallet Connectivity**: Seamless wallet connection using Wagmi and Viem.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Base Network (Ethereum Layer 2)
- **Wallet Integration**: Wagmi, Viem
- **Deployment**: Vercel

## Prerequisites

- Node.js v24.13.0 or later
- PostgreSQL database (e.g., Neon, Supabase)
- WalletConnect Project ID

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Adrijan-Petek/RaiseFunds.git
   cd RaiseFunds
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   DATABASE_URL="your-postgresql-connection-string"
   NEXT_PUBLIC_WAGMI_PROJECT_ID="your-wagmi-project-id"
   ```

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Home Page**: Browse active fundraisers.
- **Create Fundraiser**: Navigate to `/new` to start a new fundraiser.
- **View Fundraiser**: Click on a fundraiser to view details, donate, and share.
- **Wallet Connection**: Connect your wallet in the top-left to donate.

## API Endpoints

- `GET /api/fundraisers` - List fundraisers
- `POST /api/fundraisers` - Create fundraiser
- `GET /api/fundraisers/[id]` - Get fundraiser details
- `POST /api/fundraisers/[id]/updates` - Add update
- `POST /api/donations/verify` - Verify and record donation
- `POST /api/reports` - Report fundraiser

## Deployment

Deploy to Vercel:
1. Connect your GitHub repository to Vercel.
2. Set environment variables in Vercel dashboard.
3. Deploy.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Disclaimer

RaiseFunds is not a verified charity platform. Users should independently verify the legitimacy of fundraisers before donating. The platform does not guarantee the use of funds or the validity of causes.
