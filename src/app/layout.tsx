import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { config } from '@/lib/wagmi'
import { WagmiProvider } from 'wagmi/react'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RaiseFunds',
  description: 'Fundraising on Farcaster',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={config}>
          <Header />
          <main className="container mx-auto p-4">
            {children}
          </main>
        </WagmiProvider>
      </body>
    </html>
  )
}