'use client'

import { useCallback, useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { SignInButton, useProfile, useSignIn } from '@farcaster/auth-kit'
import { EthereumProvider } from '@walletconnect/ethereum-provider'

export function WalletConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [wcLoading, setWcLoading] = useState(false)
  const [wcError, setWcError] = useState('')
  const [wcConnected, setWcConnected] = useState(false)
  const [wcProvider, setWcProvider] = useState<any>(null)
  
  const { isConnected: rainbowConnected, address: rainbowAddress } = useAccount()
  const { isAuthenticated: farcasterSignedIn, profile: farcasterProfile } = useProfile()
  const { signOut: farcasterSignOut } = useSignIn()

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setWcError('')
  }

  // Keyboard and scroll lock controls
  useEffect(() => {
    if (!isModalOpen) return
    
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    
    document.addEventListener('keydown', onKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isModalOpen])

  const handleWalletConnect = useCallback(async () => {
    setWcLoading(true)
    setWcError('')
    
    try {
      // Get project ID from environment or use default
      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c3a3c4e7c8e1f4a2b9d5e6f7a8b9c0d1'
      
      const provider = await EthereumProvider.init({
        projectId,
        chains: [1], // Ethereum mainnet
        showQrModal: true,
        metadata: {
          name: 'RaiseFunds',
          description: 'Decentralized fundraising platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://raisefunds.app',
          icons: ['https://walletconnect.com/walletconnect-logo.png']
        }
      })

      // Connect to wallet
      await provider.connect()
      
      // Check if connected successfully
      if (provider.accounts && provider.accounts.length > 0) {
        setWcConnected(true)
        setWcProvider(provider)
        console.log('✅ WalletConnect connected:', provider.accounts[0])
        
        // Listen for disconnect events
        provider.on('disconnect', () => {
          setWcConnected(false)
          setWcProvider(null)
          console.log('WalletConnect disconnected')
        })
      }
    } catch (err: any) {
      // Ignore user cancellation errors
      const isCancellation = 
        err.message?.includes('User rejected') ||
        err.message?.includes('User closed') ||
        err.message?.includes('Connection request reset') ||
        err.code === 4001 ||
        err.code === 'ACTION_REJECTED'
      
      if (!isCancellation) {
        setWcError(err.message || 'Failed to connect')
        console.error('WalletConnect error:', err)
      }
    } finally {
      setWcLoading(false)
    }
  }, [])

  const handleWalletDisconnect = useCallback(async () => {
    if (wcProvider) {
      try {
        await wcProvider.disconnect()
      } catch (err) {
        console.error('Error disconnecting WalletConnect:', err)
      }
    }
    setWcConnected(false)
    setWcProvider(null)
  }, [wcProvider])

  const handleFarcasterSignOut = useCallback(() => {
    if (farcasterSignOut) {
      farcasterSignOut()
    }
  }, [farcasterSignOut])

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors shadow-sm hover:shadow"
      >
        {rainbowConnected || farcasterSignedIn || wcConnected ? (
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Connected
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          aria-modal="true"
          role="dialog"
          aria-labelledby="wallet-modal-title"
        >
          <div className="w-full max-w-lg mx-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
              <div>
                <h2 id="wallet-modal-title" className="text-xl font-bold">
                  Connect Your Wallet
                </h2>
                <p className="text-sm text-[rgb(var(--muted))] mt-1">
                  Choose your preferred connection method
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] p-2 rounded-lg hover:bg-[rgb(var(--bg))] transition-all"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Rainbow Kit / Web3 Wallets */}
              <div className="group rounded-xl border-2 border-[rgb(var(--border))] p-4 hover:border-blue-500 hover:bg-[rgb(var(--bg))] transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      🌈
                    </div>
                    <div>
                      <div className="font-bold text-base">Web3 Wallets</div>
                      <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                        MetaMask, Coinbase, WalletConnect & more
                      </div>
                      {rainbowConnected && rainbowAddress && (
                        <div className="text-xs text-green-600 mt-1 font-mono">
                          {rainbowAddress.slice(0, 6)}...{rainbowAddress.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>
                  <ConnectButton.Custom>
                    {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
                      const connected = mounted && account && chain
                      return (
                        <button
                          onClick={connected ? openAccountModal : openConnectModal}
                          disabled={!mounted}
                          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            connected
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                        >
                          {connected ? '✓ Manage' : 'Connect'}
                        </button>
                      )
                    }}
                  </ConnectButton.Custom>
                </div>
              </div>

              {/* Farcaster */}
              <div className="group rounded-xl border-2 border-[rgb(var(--border))] p-4 hover:border-purple-500 hover:bg-[rgb(var(--bg))] transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      🎭
                    </div>
                    <div>
                      <div className="font-bold text-base">Farcaster</div>
                      <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                        Sign in with your Farcaster account
                      </div>
                      {farcasterSignedIn && farcasterProfile && (
                        <div className="text-xs text-green-600 mt-1">
                          @{farcasterProfile.username || 'user'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {farcasterSignedIn ? (
                      <button
                        onClick={handleFarcasterSignOut}
                        className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <div className="[&_button]:px-5 [&_button]:py-2.5 [&_button]:rounded-lg [&_button]:text-sm [&_button]:font-semibold [&_button]:bg-purple-500 [&_button]:text-white [&_button]:hover:bg-purple-600 [&_button]:transition-all">
                        <SignInButton />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* WalletConnect Direct */}
              <div className="group rounded-xl border-2 border-[rgb(var(--border))] p-4 hover:border-cyan-500 hover:bg-[rgb(var(--bg))] transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      📱
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base">WalletConnect</div>
                      <div className="text-xs text-[rgb(var(--muted))] mt-0.5">
                        Scan QR with your mobile wallet
                      </div>
                      {wcError && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                          {wcError}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={wcConnected ? handleWalletDisconnect : handleWalletConnect}
                    disabled={wcLoading}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      wcConnected
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : wcLoading
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-cyan-500 text-white hover:bg-cyan-600'
                    }`}
                  >
                    {wcLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connecting...
                      </span>
                    ) : wcConnected ? (
                      'Disconnect'
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 border-t border-[rgb(var(--border))] mt-4">
              <div className="flex items-center justify-center gap-2 text-xs text-[rgb(var(--muted))]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure connection. We never store your private keys.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}