'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { SignInButton, useProfile } from '@farcaster/auth-kit'
import { EthereumProvider } from '@walletconnect/ethereum-provider'

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
      {children}
    </div>
  )
}

function MetaMaskIcon() {
  // simple vector mark (not official, but professional-looking and consistent)
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#F6851B" d="M10 10l18 14-3 7L10 10zm44 0L36 24l3 7 15-21z" />
      <path fill="#E2761B" d="M28 24l8 0-4 9-4-9zm-3 7l7 5-9 8 2-13zm14 5l7-5 2 13-9-8z" />
      <path fill="#D7C1B3" d="M23 44l9 6 9-6-9 13-9-13z" />
    </svg>
  )
}

function RainbowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#7C3AED" d="M32 10c12 0 22 10 22 22h-8c0-7.7-6.3-14-14-14s-14 6.3-14 14H10C10 20 20 10 32 10z" />
      <path fill="#3B82F6" d="M32 18c7.7 0 14 6.3 14 14h-8c0-3.3-2.7-6-6-6s-6 2.7-6 6h-8c0-7.7 6.3-14 14-14z" />
      <path fill="#EC4899" d="M32 26c3.3 0 6 2.7 6 6h-4c0-1.1-.9-2-2-2s-2 .9-2 2h-4c0-3.3 2.7-6 6-6z" />
    </svg>
  )
}

function CoinbaseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#0052FF" />
      <circle cx="32" cy="32" r="14" fill="white" />
      <rect x="30" y="22" width="18" height="20" rx="2" fill="#0052FF" />
    </svg>
  )
}

function FarcasterIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="10" width="44" height="44" rx="12" fill="#7C3AED" />
      <path
        fill="white"
        d="M22 42V22h20v20h-4V30h-12v12h-4zm6-16h12v4H28v-4z"
      />
    </svg>
  )
}

function WalletConnectIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="10" y="10" width="44" height="44" rx="22" fill="#3396FF" />
      <path
        fill="white"
        d="M24.5 29.5a10.6 10.6 0 0 1 15 0l1.3 1.3-2.6 2.6-1.3-1.3a6.9 6.9 0 0 0-9.8 0l-1.3 1.3-2.6-2.6 1.3-1.3zm-4.2 4.2 2.6 2.6 3.9 3.9a3 3 0 0 0 4.2 0l0 0 3.9-3.9 2.6-2.6 2.6 2.6-2.6 2.6-6.5 6.5a6.7 6.7 0 0 1-9.4 0l-6.5-6.5-2.6-2.6 2.6-2.6zm23.4 0 2.6-2.6 2.6 2.6-2.6 2.6-2.6-2.6z"
      />
    </svg>
  )
}

export function WalletConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [wcLoading, setWcLoading] = useState(false)
  const [wcError, setWcError] = useState('')
  const [wcConnected, setWcConnected] = useState(false)
  const [wcProvider, setWcProvider] = useState<any>(null)

  const { isConnected: web3Connected, address: web3Address, connector: activeConnector } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const farcasterProfileState: any = useProfile()
  const farcasterSignedIn = Boolean(farcasterProfileState?.isAuthenticated)
  const farcasterProfile = farcasterProfileState?.profile

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    setWcError('')
  }

  const buttonLabel = useMemo(() => {
    if (web3Connected && web3Address) {
      const name = activeConnector?.name ? `${activeConnector.name}: ` : ''
      return `${name}${web3Address.slice(0, 6)}...${web3Address.slice(-4)}`
    }
    if (farcasterSignedIn && farcasterProfile?.username) return `@${farcasterProfile.username}`
    if (wcConnected) return 'WalletConnect'
    return 'Connect Wallet'
  }, [activeConnector?.name, farcasterProfile?.username, farcasterSignedIn, wcConnected, web3Address, web3Connected])

  // Auto-close modal when wallet connects
  useEffect(() => {
    if (!isModalOpen) return
    if (web3Connected || farcasterSignedIn || wcConnected) {
      const timer = setTimeout(() => {
        closeModal()
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [web3Connected, farcasterSignedIn, wcConnected, isModalOpen])

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
      const projectId =
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c3a3c4e7c8e1f4a2b9d5e6f7a8b9c0d1'

      const provider = await EthereumProvider.init({
        projectId,
        chains: [1],
        showQrModal: true,
        metadata: {
          name: 'RaiseFunds',
          description: 'Decentralized fundraising platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://raisefunds.app',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      })

      await provider.connect()

      if (provider.accounts && provider.accounts.length > 0) {
        setWcConnected(true)
        setWcProvider(provider)

        provider.on('disconnect', () => {
          setWcConnected(false)
          setWcProvider(null)
        })
      }
    } catch (err: any) {
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

  const handleFarcasterSignOut = useCallback(async () => {
    // auth-kit versions differ; try common signOut methods safely.
    try {
      const maybeSignOut =
        (farcasterProfileState && (farcasterProfileState.signOut || farcasterProfileState.logout)) || null
      if (typeof maybeSignOut === 'function') {
        await maybeSignOut()
        return
      }
    } catch (e) {
      console.error('Farcaster sign out error:', e)
    }

    // Fallback: clear common persisted auth-kit keys (best-effort) then reload.
    try {
      if (typeof window !== 'undefined') {
        Object.keys(window.localStorage)
          .filter((k) => k.toLowerCase().includes('farcaster') || k.toLowerCase().includes('auth-kit'))
          .forEach((k) => window.localStorage.removeItem(k))
        window.location.reload()
      }
    } catch (e) {
      console.error('Farcaster sign out fallback error:', e)
    }
  }, [farcasterProfileState])

  const metaMaskConnector = useMemo(
    () =>
      connectors.find(
        (c) => c.id === 'io.metamask' || c.id === 'injected' || c.name.toLowerCase().includes('metamask'),
      ),
    [connectors],
  )
  const rainbowConnector = useMemo(
    () => connectors.find((c) => c.id === 'me.rainbow' || c.id === 'rainbow' || c.name.toLowerCase().includes('rainbow')),
    [connectors],
  )
  const coinbaseConnector = useMemo(
    () =>
      connectors.find(
        (c) =>
          c.id === 'coinbaseWallet' ||
          c.id === 'coinbaseWalletSDK' ||
          c.name.toLowerCase().includes('coinbase'),
      ),
    [connectors],
  )

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors shadow-sm hover:shadow"
      >
        {buttonLabel}
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          aria-modal="true"
          role="dialog"
          aria-labelledby="wallet-modal-title"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative px-6 py-4 border-b border-[rgb(var(--border))]">
              <button
                onClick={closeModal}
                className="absolute right-4 top-4 rounded-full p-2 text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--fg))] transition-all duration-200"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 id="wallet-modal-title" className="text-lg font-semibold leading-6 text-[rgb(var(--fg))]">
                Connect Wallet
              </h2>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Choose your preferred wallet to get started.</p>
            </div>

            {/* Body */}
            <div className="p-4">
              {/* Connected State */}
              {web3Connected && web3Address ? (
                <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="text-sm font-medium text-green-800 dark:text-green-200">Connected</div>
                      </div>
                      <div className="mt-1 truncate font-mono text-xs text-[rgb(var(--muted))]">
                        {activeConnector?.name ? `${activeConnector.name} • ` : ''}
                        {web3Address.slice(0, 6)}...{web3Address.slice(-4)}
                      </div>
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="shrink-0 rounded-xl border border-red-200 bg-white dark:bg-[rgb(var(--card))] px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-[rgb(var(--muted))] uppercase tracking-wide">Popular Wallets</div>

                  {/* MetaMask */}
                  <button
                    onClick={() => metaMaskConnector && connect({ connector: metaMaskConnector })}
                    disabled={!metaMaskConnector || isPending}
                    className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <IconBadge>
                        <MetaMaskIcon />
                      </IconBadge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-5">MetaMask</div>
                        <div className="text-xs text-[rgb(var(--muted))]">Browser extension</div>
                      </div>
                      <div className="text-sm font-medium text-[rgb(var(--accent))]">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting…
                          </div>
                        ) : (
                          'Connect'
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Rainbow */}
                  <button
                    onClick={() => rainbowConnector && connect({ connector: rainbowConnector })}
                    disabled={!rainbowConnector || isPending}
                    className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <IconBadge>
                        <RainbowIcon />
                      </IconBadge>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold leading-5">Rainbow</div>
                        <div className="text-sm text-[rgb(var(--muted))]">Mobile wallet</div>
                      </div>
                      <div className="text-sm font-medium text-[rgb(var(--accent))]">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting…
                          </div>
                        ) : (
                          'Connect'
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Base (Coinbase Wallet) */}
                  <button
                    onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
                    disabled={!coinbaseConnector || isPending}
                    className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <IconBadge>
                        <CoinbaseIcon />
                      </IconBadge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-5">Coinbase Wallet</div>
                        <div className="text-xs text-[rgb(var(--muted))]">Mobile & browser</div>
                      </div>
                      <div className="text-sm font-medium text-[rgb(var(--accent))]">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Connecting…
                          </div>
                        ) : (
                          'Connect'
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              )}

              <div className="my-6 h-px w-full bg-[rgb(var(--border))]" />

              <div className="space-y-3">
                <div className="text-sm font-medium text-[rgb(var(--muted))] uppercase tracking-wide">Other Options</div>

                {/* Farcaster */}
                <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 hover:bg-[rgb(var(--bg))] transition-colors">
                  <div className="flex items-center gap-3">
                    <IconBadge>
                      <FarcasterIcon />
                    </IconBadge>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-5">Farcaster</div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {farcasterSignedIn && farcasterProfile?.username ? `@${farcasterProfile.username}` : 'Social login'}
                      </div>
                    </div>

                    {farcasterSignedIn ? (
                      <button
                        onClick={handleFarcasterSignOut}
                        className="shrink-0 rounded-xl border border-red-200 bg-white dark:bg-[rgb(var(--card))] px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Sign out
                      </button>
                    ) : (
                      <div className="[&_button]:rounded-xl [&_button]:border [&_button]:border-[rgb(var(--border))] [&_button]:px-3 [&_button]:py-2 [&_button]:text-sm [&_button]:font-medium [&_button]:hover:bg-[rgb(var(--bg))] [&_button]:transition-colors [&_button_svg]:hidden">
                        <SignInButton />
                      </div>
                    )}
                  </div>
                </div>

                {/* WalletConnect */}
                <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 hover:bg-[rgb(var(--bg))] transition-colors">
                  <div className="flex items-center gap-3">
                    <IconBadge>
                      <WalletConnectIcon />
                    </IconBadge>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold leading-5">WalletConnect</div>
                      <div className="text-sm text-[rgb(var(--muted))]">
                        {wcError ? (
                          <span className="text-red-600 font-medium">{wcError}</span>
                        ) : wcConnected ? (
                          'Connected via QR code'
                        ) : (
                          'Scan with mobile wallet'
                        )}
                      </div>
                    </div>

                    <button
                      onClick={wcConnected ? handleWalletDisconnect : handleWalletConnect}
                      disabled={wcLoading}
                      className="shrink-0 rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--bg))] disabled:opacity-50 transition-colors"
                    >
                      {wcLoading ? (
                        <div className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {wcConnected ? 'Disconnecting…' : 'Connecting…'}
                        </div>
                      ) : wcConnected ? (
                        'Disconnect'
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[rgb(var(--border))] px-4 py-3">
              <p className="text-center text-xs leading-5 text-[rgb(var(--muted))]">
                By connecting, you agree to our{' '}
                <a href="#" className="text-[rgb(var(--accent))] hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[rgb(var(--accent))] hover:underline">
                  Privacy Policy
                </a>
                . Your keys stay secure.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}