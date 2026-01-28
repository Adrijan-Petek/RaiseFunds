'use client'

import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SignInButton } from '@farcaster/auth-kit'

export function WalletConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90"
      >
        Connect Wallet
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
              <button
                onClick={closeModal}
                className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Rainbow Wallet */}
              <div className="rounded-xl border border-[rgb(var(--border))] p-3 hover:bg-[rgb(var(--bg))]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rainbow</span>
                  <ConnectButton />
                </div>
              </div>

              {/* Farcaster Connect */}
              <div className="rounded-xl border border-[rgb(var(--border))] p-3 hover:bg-[rgb(var(--bg))]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Farcaster</span>
                  <SignInButton />
                </div>
              </div>

              {/* WalletConnect */}
              <div className="rounded-xl border border-[rgb(var(--border))] p-3 hover:bg-[rgb(var(--bg))]">
                <button className="w-full text-left text-sm font-medium">
                  WalletConnect (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}