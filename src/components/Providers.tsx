'use client'

import { useMemo } from 'react'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

const config = getDefaultConfig({
  appName: 'RaiseFunds',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [mainnet],
  ssr: true,
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  const authConfig = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://raisefunds.app'
    const domain = typeof window !== 'undefined' ? window.location.host : 'raisefunds.app'

    return {
      domain,
      siweUri: origin,
      rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      relay: process.env.NEXT_PUBLIC_FARCASTER_RELAY || 'https://relay.farcaster.xyz',
    }
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthKitProvider config={authConfig}>
            {children}
          </AuthKitProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
