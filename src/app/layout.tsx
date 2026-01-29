import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import '@farcaster/auth-kit/styles.css'
import './globals.css'
import { Providers } from '@/components/Providers'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RaiseFunds',
  description: 'A decentralized crowdfunding platform empowering creators and donors through blockchain transparency and social engagement.',
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/icons/favicon.ico',
  },
  manifest: '/icons/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
