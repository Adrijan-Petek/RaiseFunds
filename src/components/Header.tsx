'use client'

import Link from 'next/link'
import Image from 'next/image'
import { WalletConnect } from './WalletConnect'

export function Header() {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-100">
      <div className="flex items-center space-x-4">
        <Link href="/">
          <Image src="/logo/logo.png" alt="RaiseFunds" width={40} height={40} />
        </Link>
        <nav className="flex space-x-4">
          <Link href="/" className="text-blue-600 hover:underline">Home</Link>
          <Link href="/new" className="text-blue-600 hover:underline">New Fundraiser</Link>
          <Link href="/me" className="text-blue-600 hover:underline">My Fundraisers</Link>
          <Link href="/admin" className="text-blue-600 hover:underline">Admin</Link>
        </nav>
      </div>
      <WalletConnect />
    </header>
  )
}