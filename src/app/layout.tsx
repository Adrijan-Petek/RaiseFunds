import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/Header'
import { SplashScreen } from '@/components/SplashScreen'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <html lang="en">
      <head>
        <title>RaiseFunds</title>
        <meta name="description" content="Fundraising on Farcaster" />
        <link rel="icon" href="/icons/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <>
            <Header />
            <main className="container mx-auto p-4">
              {children}
            </main>
          </>
        )}
      </body>
    </html>
  )
}