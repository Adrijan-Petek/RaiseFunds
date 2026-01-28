'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmountWei: string
  beneficiaryAddress: string
  coverImageUrl?: string
  category: string
  donations: { id: string; donorAddress: string; amountWei: string; createdAt: string }[]
  updates: { id: string; text: string; imageUrl?: string; createdAt: string }[]
}

export default function FundraiserPage() {
  const { id } = useParams()
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null)
  const [donateAmount, setDonateAmount] = useState('')
  const [txHash, setTxHash] = useState('')

  const { sendTransaction, data: hash } = useSendTransaction()
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (id) {
      fetch(`/api/fundraisers/${id}`)
        .then(res => res.json())
        .then(setFundraiser)
    }
  }, [id])

  useEffect(() => {
    if (isSuccess && hash) {
      setTxHash(hash)
      // Submit to verify
      fetch('/api/donations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundraiserId: id, txHash: hash }),
      }).then(() => {
        // Refresh
        window.location.reload()
      })
    }
  }, [isSuccess, hash, id])

  const handleDonate = () => {
    if (!donateAmount) return
    sendTransaction({
      to: fundraiser?.beneficiaryAddress as `0x${string}`,
      value: parseEther(donateAmount),
    })
  }

  if (!fundraiser) return <div>Loading...</div>

  const raised = fundraiser.donations.reduce((sum, d) => sum + BigInt(d.amountWei), 0n)
  const progress = (Number(raised) / Number(fundraiser.goalAmountWei)) * 100

  return (
    <div>
      <h1 className="text-2xl font-bold">{fundraiser.title}</h1>
      {fundraiser.coverImageUrl && <img src={fundraiser.coverImageUrl} alt={fundraiser.title} className="w-full h-64 object-cover" />}
      <p>{fundraiser.description}</p>
      <p>Category: {fundraiser.category}</p>
      <div className="my-4">
        <div className="bg-gray-200 rounded-full h-4">
          <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        <p>Raised: {raised.toString()} / {fundraiser.goalAmountWei} wei</p>
      </div>
      <div className="my-4">
        <input
          type="text"
          placeholder="Amount in ETH"
          value={donateAmount}
          onChange={e => setDonateAmount(e.target.value)}
          className="p-2 border mr-2"
        />
        <button onClick={handleDonate} className="px-4 py-2 bg-green-500 text-white rounded" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Donate'}
        </button>
      </div>
      <button className="px-4 py-2 bg-blue-500 text-white rounded mr-2">Share on Farcaster</button>
      <button className="px-4 py-2 bg-red-500 text-white rounded">Report</button>
      <h2 className="text-xl font-semibold mt-4">Donations</h2>
      <ul>
        {fundraiser.donations.map(d => (
          <li key={d.id}>{d.donorAddress.slice(0,6)}...{d.donorAddress.slice(-4)} - {d.amountWei} wei</li>
        ))}
      </ul>
      <h2 className="text-xl font-semibold mt-4">Updates</h2>
      <ul>
        {fundraiser.updates.map(u => (
          <li key={u.id}>
            <p>{u.text}</p>
            {u.imageUrl && <img src={u.imageUrl} alt="update" className="w-32" />}
          </li>
        ))}
      </ul>
    </div>
  )
}