'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface Fundraiser {
  id: string
  title: string
  status: string
  totalRaisedCached: number
}

export default function MePage() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    // Check if logged in with wallet
    const walletCookie = document.cookie.includes('creator_wallet')
    setIsLoggedIn(walletCookie && isConnected)
    if (walletCookie && isConnected) {
      fetchFundraisers()
    }
  }, [isConnected])

  const fetchFundraisers = async () => {
    // For MVP, fetch all, but in real, filter by creator
    const res = await fetch('/api/fundraisers')
    const data = await res.json()
    setFundraisers(data)
  }

  const handleWalletLogin = async () => {
    if (address) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })
      if (res.ok) {
        setIsLoggedIn(true)
        fetchFundraisers()
      }
    }
  }

  const handleLogout = () => {
    disconnect()
    document.cookie = 'creator_wallet=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setIsLoggedIn(false)
    setFundraisers([])
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/fundraisers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchFundraisers()
  }

  const addUpdate = async (id: string, text: string) => {
    await fetch(`/api/fundraisers/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              ← Back to home
            </Link>
          </div>

          {/* Login Prompt */}
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight mb-4">Creator Dashboard</h1>
            <p className="text-[rgb(var(--muted))] mb-6">
              Connect your wallet to access your fundraiser dashboard and manage your campaigns.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              ← Back to home
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[rgb(var(--muted))]">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Auth Prompt */}
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight mb-4">Verify Creator Access</h1>
            <p className="text-[rgb(var(--muted))] mb-6">
              Confirm your wallet to access creator features and manage your fundraisers.
            </p>
            <button
              onClick={handleWalletLogin}
              className="px-6 py-3 bg-[rgb(var(--accent))] text-white font-medium rounded-xl hover:opacity-90"
            >
              Verify Wallet Access
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            ← Back to home
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-[rgb(var(--muted))]">Creator: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90"
            >
              Logout
            </button>
            <Link
              href="/new"
              className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Create fundraiser
            </Link>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mb-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h1 className="text-2xl font-semibold tracking-tight">My Fundraisers</h1>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Manage your active fundraising campaigns
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {fundraisers.map(f => (
            <div key={f.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
              <h2 className="text-lg font-semibold leading-snug line-clamp-2 mb-2">{f.title}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted))]">Status:</span>
                  <select
                    onChange={e => updateStatus(f.id, e.target.value)}
                    defaultValue={f.status}
                    className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="ENDED">Ended</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[rgb(var(--muted))]">Raised:</span>
                  <span className="font-medium">{f.totalRaisedCached} ETH</span>
                </div>
                <div className="pt-2 border-t border-[rgb(var(--border))]">
                  <input
                    type="text"
                    placeholder="Share an update..."
                    id={`update-${f.id}`}
                    className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none mb-2"
                  />
                  <button
                    onClick={() => {
                      const text = (document.getElementById(`update-${f.id}`) as HTMLInputElement).value
                      if (text.trim()) {
                        addUpdate(f.id, text)
                        ;(document.getElementById(`update-${f.id}`) as HTMLInputElement).value = ''
                      }
                    }}
                    className="w-full px-4 py-2 bg-[rgb(var(--accent))] text-white font-medium rounded-lg hover:opacity-90 text-sm"
                  >
                    Post Update
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fundraisers.length === 0 && (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No fundraisers yet</h3>
            <p className="text-[rgb(var(--muted))] mb-4">
              Create your first fundraiser to start raising funds for your cause.
            </p>
            <Link
              href="/new"
              className="inline-block px-6 py-3 bg-[rgb(var(--accent))] text-white font-medium rounded-xl hover:opacity-90"
            >
              Create Your First Fundraiser
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
