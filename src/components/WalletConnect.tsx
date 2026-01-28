'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="px-3 py-1 bg-blue-500 text-white rounded"
    >
      Connect Wallet
    </button>
  )
}