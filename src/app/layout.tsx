import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import '@farcaster/auth-kit/styles.css'
import './globals.css'
import { Providers } from '@/components/Providers'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'RaiseFunds',
//   description: 'Fundraising on Farcaster',
//   // icons: {
//   //   icon: '/icons/favicon.ico',
//   //   apple: '/icons/apple-touch-icon.png',
//   // },
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
