'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'

export function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-100">
      <div className="flex items-center space-x-4">
        <WalletConnect />
        <nav className="flex space-x-4">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <Link href="/new" className="text-blue-600 hover:underline">New Fundraiser</Link>
          <Link href="/me" className="text-blue-600 hover:underline">My Fundraisers</Link>
        </nav>
      </div>
    </header>
  )
}