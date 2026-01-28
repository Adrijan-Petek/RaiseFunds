'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      {/* LEFT: Logo with tagline underneath */}
      <div className="flex flex-col items-start gap-2">
        <img
          src="/logo/logo1.png"
          alt="RaiseFunds"
          className="h-30 w-60"
        />
        <div className="text-sm text-[rgb(var(--muted))]">
          Fund causes you care about.
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/me"
          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90"
        >
          My dashboard
        </Link>

        <Link
          href="/new"
          className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Create fundraiser
        </Link>

        <ThemeToggle />
        <WalletConnect />
      </div>
    </header>
  )
}
