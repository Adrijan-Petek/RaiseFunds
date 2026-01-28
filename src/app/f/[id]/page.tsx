'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmount: number
  beneficiaryAddress: string
  coverImageUrl?: string
  category: string
  totalRaisedCached: number
  donations: { id: string; donorName?: string; amount: number; message?: string; createdAt: string; status: string }[]
  updates: { id: string; text: string; imageUrl?: string; createdAt: string }[]
}

export default function FundraiserPage() {
  const { id } = useParams()
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null)
  const [donateAmount, setDonateAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [donationId, setDonationId] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetch(`/api/fundraisers/${id}`)
        .then(res => res.json())
        .then(setFundraiser)
    }
  }, [id])

  useEffect(() => {
    if (!fundraiser) return
    try {
      const text = `${fundraiser.title} - Help support this cause! ${typeof window !== 'undefined' ? window.location.href : ''}`
      // construct URL parts to avoid embedding `/~/` literal which Turbopack has parsed as a regex
      const url = 'https://warpcast.com/' + '~' + '/compose?text=' + encodeURIComponent(text)
      setShareUrl(url)
    } catch (e) {
      setShareUrl(null)
    }
  }, [fundraiser])

  const handleDonate = async () => {
    if (!donateAmount) return
    const res = await fetch(`/api/fundraisers/${id}/donate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(donateAmount),
        donorName: donorName || undefined,
        message: message || undefined,
      }),
    })
    const donation = await res.json()
    setDonationId(donation.id)
  }

  const handleConfirm = async () => {
    if (!donationId) return
    await fetch(`/api/donations/${donationId}/confirm`, {
      method: 'POST',
    })
    // Refresh
    window.location.reload()
  }

  // Temporarily disable share URL to avoid Turbopack regex parsing issues
  // const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`${fundraiser?.title} - Help support this cause! ${window.location.href}`)}`

  if (!fundraiser) return <div className="container mx-auto p-4">Loading...</div>

  const progress = (fundraiser.totalRaisedCached / fundraiser.goalAmount) * 100

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">{fundraiser.title}</h1>
        {fundraiser.coverImageUrl && <img src={fundraiser.coverImageUrl} alt={fundraiser.title} className="w-full h-64 object-cover my-4" />}
        <p className="text-lg">{fundraiser.description}</p>
        <p>Category: {fundraiser.category}</p>
        <div className="my-4">
          <div className="bg-gray-200 rounded-full h-4">
            <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
          <p>Raised: {fundraiser.totalRaisedCached} / {fundraiser.goalAmount} ETH</p>
        </div>
        <div className="my-4">
          <input
            type="number"
            placeholder="Amount in ETH"
            value={donateAmount}
            onChange={e => setDonateAmount(e.target.value)}
            className="p-2 border mr-2"
          />
          <input
            type="text"
            placeholder="Your Name (optional)"
            value={donorName}
            onChange={e => setDonorName(e.target.value)}
            className="p-2 border mr-2"
          />
          <input
            type="text"
            placeholder="Message (optional)"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="p-2 border mr-2"
          />
          <button onClick={handleDonate} className="px-4 py-2 bg-green-500 text-white rounded mr-2">Donate</button>
          {donationId && (
            <button onClick={handleConfirm} className="px-4 py-2 bg-blue-500 text-white rounded">Mark as Paid</button>
          )}
        </div>
        {shareUrl ? (
          <a href={shareUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-purple-500 text-white rounded mr-2">Share on Farcaster</a>
        ) : (
          <button disabled className="px-4 py-2 bg-purple-500 text-white rounded mr-2 opacity-60 cursor-not-allowed">Share on Farcaster</button>
        )}
        <button className="px-4 py-2 bg-red-500 text-white rounded">Report</button>
        <h2 className="text-2xl font-semibold mt-8">Donations</h2>
        <ul className="space-y-2">
          {fundraiser.donations.map(d => (
            <li key={d.id} className="border p-2 rounded">
              <p><strong>{d.donorName || 'Anonymous'}</strong> - {d.amount} ETH</p>
              {d.message && <p>{d.message}</p>}
              <p className="text-sm text-gray-500">{new Date(d.createdAt).toLocaleString()} - {d.status}</p>
            </li>
          ))}
        </ul>
        <h2 className="text-2xl font-semibold mt-8">Updates</h2>
        <ul className="space-y-2">
          {fundraiser.updates.map(u => (
            <li key={u.id} className="border p-2 rounded">
              <p>{u.text}</p>
              {u.imageUrl && <img src={u.imageUrl} alt="update" className="w-32 mt-2" />}
              <p className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
    </div>
  )
}