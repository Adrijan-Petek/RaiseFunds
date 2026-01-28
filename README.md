# RaiseFunds

A decentralized fundraising platform on Farcaster, built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Create and manage fundraisers
- Donate directly onchain to beneficiary addresses
- Share fundraisers on Farcaster
- Live progress tracking
- Creator updates and donor lists
- Basic moderation with reporting

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Base network via Wagmi and Viem
- **Wallet**: WalletConnect integration

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```
   DATABASE_URL="your-postgresql-connection-string"
   NEXT_PUBLIC_WAGMI_PROJECT_ID="your-wagmi-project-id"
   ```
4. Set up the database:
   ```
   npx prisma generate
   npx prisma db push
   ```
5. Run the development server: `npm run dev`

## Deployment

Deploy to Vercel with the following environment variables configured.

## Disclaimer

This is not a verified charity platform. Always verify causes independently.# RaiseFunds
