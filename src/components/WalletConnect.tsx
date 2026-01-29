'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import { SignInButton, useProfile } from '@farcaster/auth-kit'
import { EthereumProvider } from '@walletconnect/ethereum-provider'
import { createPublicClient, http, toCoinType } from 'viem'
import { base, mainnet } from 'viem/chains'

const mainnetPublicClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://cloudflare-eth.com'),
})

function IconBadge({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
      <img src={src} alt={alt} className="h-5 w-5 object-contain" />
    </div>
  )
}

function normalizeAvatarUrl(input: string | null | undefined): string | null {
  if (!input) return null
  if (input.startsWith('ipfs://')) {
    const cid = input.replace('ipfs://', '')
    return `https://ipfs.io/ipfs/${cid}`
  }
  if (input.startsWith('http://') || input.startsWith('https://')) return input
  // ENS avatars can be NFT references (e.g., eip155:...); ignore for now.
  return null
}

export function WalletConnect() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [wcLoading, setWcLoading] = useState(false)
  const [wcError, setWcError] = useState('')
  const [wcConnected, setWcConnected] = useState(false)
  const [wcProvider, setWcProvider] = useState<any>(null)
  const [baseName, setBaseName] = useState<string | null>(null)

  const { isConnected: web3Connected, address: web3Address, connector: activeConnector } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const farcasterProfileState: any = useProfile()
  const farcasterSignedIn = Boolean(farcasterProfileState?.isAuthenticated)
  const farcasterProfile = farcasterProfileState?.profile
  const farcasterLabel = farcasterProfile?.username
    ? `@${farcasterProfile.username}`
    : farcasterProfile?.displayName
  const { data: ensName } = useEnsName({
    address: web3Address,
    chainId: mainnet.id,
    query: { enabled: Boolean(web3Address) },
  })
  const resolvedPrimaryName = useMemo(() => ensName || baseName || null, [baseName, ensName])
  const { data: ensAvatar } = useEnsAvatar({
    name: resolvedPrimaryName || undefined,
    chainId: mainnet.id,
    query: { enabled: Boolean(resolvedPrimaryName) },
  })

  const buttonAvatar = useMemo(() => {
    if (web3Connected) return normalizeAvatarUrl(ensAvatar)
    if (farcasterSignedIn) return normalizeAvatarUrl(farcasterProfile?.pfpUrl)
    return null
  }, [ensAvatar, farcasterProfile?.pfpUrl, farcasterSignedIn, web3Connected])

  useEffect(() => {
    let cancelled = false
    setBaseName(null)

    if (!web3Address || ensName) return

    const fetchBaseName = async () => {
      try {
        const name = await mainnetPublicClient.getEnsName({
          address: web3Address,
          coinType: toCoinType(base.id),
        })
        if (!cancelled) setBaseName(name ?? null)
      } catch (error) {
        if (!cancelled) setBaseName(null)
      }
    }

    fetchBaseName()

    return () => {
      cancelled = true
    }
  }, [ensName, web3Address])

  const openModal = () => setIsModalOpen(true)
  const closeMenu = () => setIsMenuOpen(false)
  const closeModal = () => {
    setIsModalOpen(false)
    setWcError('')
  }
  const anyConnected = web3Connected || farcasterSignedIn || wcConnected

  const buttonLabel = useMemo(() => {
    if (web3Connected && web3Address) {
      const resolvedName = ensName || baseName
      const addressLabel = `${web3Address.slice(0, 6)}...${web3Address.slice(-4)}`
      return resolvedName || addressLabel
    }
    if (farcasterSignedIn && farcasterLabel) return farcasterLabel
    if (wcConnected) return 'WalletConnect'
    return 'Connect Wallet'
  }, [activeConnector?.name, baseName, ensName, farcasterLabel, farcasterSignedIn, wcConnected, web3Address, web3Connected])

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

  useEffect(() => {
    if (!isMenuOpen) return

    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        closeMenu()
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    if (!anyConnected && isMenuOpen) {
      closeMenu()
    }
  }, [anyConnected, isMenuOpen])

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

  const panel = (showConnectOptions: boolean) => (
    <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[rgb(var(--border))]">
        <h2 id="wallet-modal-title" className="text-lg font-semibold leading-6 text-[rgb(var(--fg))]">
          Connect Wallet
        </h2>
        <button
          onClick={showConnectOptions ? closeModal : closeMenu}
          className="rounded-full p-2 text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--fg))] transition-all duration-200"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-2">
        {/* Connected State */}
        {web3Connected && web3Address && (
          <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">Connected</div>
                </div>
                <div className="mt-1 truncate font-mono text-xs text-[rgb(var(--muted))]">
                  {web3Address.slice(0, 6)}...{web3Address.slice(-4)}
                </div>
              </div>
              <button
                onClick={() => disconnect()}
                className="shrink-0 rounded-xl border border-red-200 bg-white dark:bg-[rgb(var(--card))] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {showConnectOptions ? (
          <div className="space-y-2">
                <div className="text-sm font-medium text-[rgb(var(--muted))] uppercase tracking-wide mt-3">Popular Wallets</div>

            {/* MetaMask */}
            <button
              onClick={() => metaMaskConnector && connect({ connector: metaMaskConnector })}
              disabled={!metaMaskConnector || isPending}
              className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <IconBadge src="/icons/wallets/metamask.svg" alt="MetaMask" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-5">MetaMask</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Browser extension</div>
                </div>
                <div className="flex items-center justify-center h-8 w-20 text-sm font-medium text-[rgb(var(--accent))]">
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
              className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <IconBadge src="/icons/wallets/rainbow.svg" alt="Rainbow" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-5">Rainbow</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Mobile wallet</div>
                </div>
                <div className="flex items-center justify-center h-8 w-20 text-sm font-medium text-[rgb(var(--accent))]">
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

            {/* Base (Coinbase L2) */}
            <button
              onClick={() => coinbaseConnector && connect({ connector: coinbaseConnector })}
              disabled={!coinbaseConnector || isPending}
              className="group w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 text-left hover:bg-[rgb(var(--bg))] hover:border-[rgb(var(--accent))] transition-all duration-200 disabled:opacity-50 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <IconBadge src="/icons/wallets/base.svg" alt="Base" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-5">Base</div>
                  <div className="text-xs text-[rgb(var(--muted))]">Mobile & browser</div>
                </div>
                <div className="flex items-center justify-center h-8 w-20 text-sm font-medium text-[rgb(var(--accent))]">
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

            <div className="my-3 h-px w-full bg-[rgb(var(--border))]" />

            <div className="text-sm font-medium text-[rgb(var(--muted))] uppercase tracking-wide">Other Options</div>

            {/* Farcaster */}
            <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 hover:bg-[rgb(var(--bg))] transition-colors">
              <div className="flex items-center gap-3">
                <IconBadge src="/icons/wallets/farcaster.svg" alt="Farcaster" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-5">Farcaster</div>
                  <div className="text-xs text-[rgb(var(--muted))]">
                    {farcasterSignedIn && farcasterLabel ? farcasterLabel : 'Social login'}
                  </div>
                </div>

                {farcasterSignedIn ? (
                  <button
                    onClick={handleFarcasterSignOut}
                    className="shrink-0 rounded-xl border border-red-200 bg-white dark:bg-[rgb(var(--card))] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    Sign out
                  </button>
                ) : (
                  <div className="flex items-center justify-center h-8 w-20 [&_button]:bg-transparent [&_button]:border-0 [&_button]:p-0 [&_button]:m-0 [&_button]:text-sm [&_button]:font-medium [&_button]:text-[rgb(var(--accent))] [&_button]:hover:underline [&_button_svg]:hidden">
                    <SignInButton />
                  </div>
                )}
              </div>
            </div>

            {/* WalletConnect */}
            <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 hover:bg-[rgb(var(--bg))] transition-colors">
              <div className="flex items-center gap-3">
                <IconBadge src="/icons/wallets/walletconnect.svg" alt="WalletConnect" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-5">WalletConnect</div>
                  <div className="text-xs text-[rgb(var(--muted))]">
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
                  className="flex items-center justify-center h-8 w-20 shrink-0 rounded-xl px-3 text-sm font-medium hover:bg-[rgb(var(--bg))] disabled:opacity-50 transition-colors"
                >
                  {wcLoading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {wcConnected ? 'Disconnecting…' : 'Connecting…'}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-[rgb(var(--accent))]">
                      {wcConnected ? 'Disconnect' : 'Connect'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {farcasterSignedIn && (
              <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 hover:bg-[rgb(var(--bg))] transition-colors">
                <div className="flex items-center gap-3">
                  <IconBadge src="/icons/wallets/farcaster.svg" alt="Farcaster" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-5">Farcaster</div>
                    <div className="text-xs text-[rgb(var(--muted))]">{farcasterLabel}</div>
                  </div>
                  <button
                    onClick={handleFarcasterSignOut}
                    className="shrink-0 rounded-xl border border-red-200 bg-white dark:bg-[rgb(var(--card))] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {wcConnected && (
              <div className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1.5 hover:bg-[rgb(var(--bg))] transition-colors">
                <div className="flex items-center gap-3">
                  <IconBadge src="/icons/wallets/walletconnect.svg" alt="WalletConnect" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-5">WalletConnect</div>
                    <div className="text-xs text-[rgb(var(--muted))]">Connected</div>
                  </div>

                  <button
                    onClick={handleWalletDisconnect}
                    disabled={wcLoading}
                    className="flex items-center justify-center h-8 w-20 shrink-0 rounded-xl px-3 text-sm font-medium hover:bg-[rgb(var(--bg))] disabled:opacity-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-[rgb(var(--accent))]">Disconnect</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {showConnectOptions && (
        <div className="border-t border-[rgb(var(--border))] px-4 py-1.5">
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
      )}
    </div>
  )

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          if (anyConnected) {
            setIsMenuOpen((prev) => !prev)
            return
          }
          openModal()
        }}
        className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2.5 text-sm font-medium hover:bg-[rgb(var(--bg))] transition-colors shadow-sm hover:shadow"
        aria-expanded={isModalOpen || isMenuOpen}
        aria-haspopup="menu"
      >
        <span className="flex items-center gap-2">
          {buttonAvatar ? (
            <img
              src={buttonAvatar}
              alt=""
              className="h-6 w-6 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] object-cover"
            />
          ) : (
            <span className="h-6 w-6 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))]" />
          )}
          <span className="truncate">{buttonLabel}</span>
        </span>
      </button>

      {isMenuOpen && anyConnected && (
        <div
          className="absolute right-0 z-50 mt-2 w-[360px] max-w-[90vw]"
          role="menu"
          aria-labelledby="wallet-modal-title"
        >
          {panel(false)}
        </div>
      )}

      {isModalOpen && !anyConnected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          aria-modal="true"
          role="dialog"
          aria-labelledby="wallet-modal-title"
        >
          {panel(true)}
        </div>
      )}
    </div>
  )
}
