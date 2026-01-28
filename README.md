# RaiseFunds

A decentralized fundraising platform built on Farcaster, enabling users to create, share, and donate to fundraisers directly onchain. Developed with modern web technologies for a seamless and secure experience.

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
