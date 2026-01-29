'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { useAccount } from 'wagmi'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmount: number
  currency?: string
  beneficiaryAddress: string
  coverImageUrl?: string
  category: string
  totalRaisedCached: number
  creator?: { username: string }
  donations: { id: string; donorName?: string; donorUsername?: string; amount: number; currency?: string; message?: string; createdAt: string; status: string }[]
  updates: { id: string; title: string; content: string; imageUrl?: string; createdAt: string }[]
}

export default function FundraiserPage() {
  const { id } = useParams()
  const [fundraiser, setFundraiser] = useState<Fundraiser | null>(null)
  const [donateAmount, setDonateAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [donationId, setDonationId] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const { address, isConnected } = useAccount()

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
        currency: selectedCurrency,
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

  if (!fundraiser) return <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Header />
        <div className="container mx-auto p-4">Loading...</div>
      </div>
    </div>

  const progress = (fundraiser.totalRaisedCached / fundraiser.goalAmount) * 100

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Header />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            {fundraiser.coverImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-[rgb(var(--border))]">
                <img
                  src={fundraiser.coverImageUrl}
                  alt={fundraiser.title}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
            )}

            {/* Title and Description */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold leading-tight">{fundraiser.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[rgb(var(--muted))]">
                    <span>by @{fundraiser.creator?.username || 'creator'}</span>
                    <span>•</span>
                    <span className="px-2 py-1 rounded-full bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))] text-xs font-medium">
                      {fundraiser.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {shareUrl && (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      Share on Farcaster
                    </a>
                  )}
                  <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors">
                    Report
                  </button>
                </div>
              </div>

              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed">{fundraiser.description}</p>
              </div>
            </div>

            {/* Progress Section */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Progress</h2>
                <span className="text-sm text-[rgb(var(--muted))]">
                  {Math.round(progress)}% funded
                </span>
              </div>

              <div className="space-y-4">
                <div className="w-full bg-[rgb(var(--muted))]/20 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">
                    {fundraiser.totalRaisedCached.toFixed(3)} {fundraiser.currency || 'ETH'} raised
                  </span>
                  <span className="text-[rgb(var(--muted))]">
                    Goal: {fundraiser.goalAmount} {fundraiser.currency || 'ETH'}
                  </span>
                </div>
              </div>
            </div>

            {/* Donations List */}
            {fundraiser.donations.length > 0 && (
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
                <div className="space-y-3">
                  {fundraiser.donations.slice(0, 10).map(donation => (
                    <div key={donation.id} className="flex items-center justify-between p-3 rounded-xl bg-[rgb(var(--bg))] border border-[rgb(var(--border))]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {(donation.donorUsername || donation.donorName || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {donation.donorUsername || donation.donorName || 'Anonymous'}
                          </div>
                          {donation.message && (
                            <div className="text-xs text-[rgb(var(--muted))] mt-1">
                              "{donation.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {donation.amount.toFixed(3)} {donation.currency || 'ETH'}
                        </div>
                        <div className="text-xs text-[rgb(var(--muted))]">
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Updates */}
            {fundraiser.updates.length > 0 && (
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
                <h2 className="text-xl font-semibold mb-4">Updates</h2>
                <div className="space-y-4">
                  {fundraiser.updates.map(update => (
                    <div key={update.id} className="border-l-4 border-[rgb(var(--accent))] pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{update.title}</h3>
                        <span className="text-xs text-[rgb(var(--muted))]">
                          {new Date(update.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="prose prose-sm prose-gray dark:prose-invert max-w-none">
                        <p>{update.content}</p>
                      </div>
                      {update.imageUrl && (
                        <img
                          src={update.imageUrl}
                          alt="Update"
                          className="w-full max-w-md h-auto rounded-xl mt-3 border border-[rgb(var(--border))]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Form */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Make a Donation</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('ETH')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                        selectedCurrency === 'ETH'
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]'
                          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]'
                      }`}
                    >
                      ETH
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCurrency('USDC')}
                      className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                        selectedCurrency === 'USDC'
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]'
                          : 'border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]'
                      }`}
                    >
                      USDC
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount ({selectedCurrency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={selectedCurrency === 'ETH' ? '0.1' : '10'}
                    step={selectedCurrency === 'ETH' ? '0.001' : '1'}
                    min={selectedCurrency === 'ETH' ? '0.001' : '1'}
                    value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name <span className="text-[rgb(var(--muted))]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Anonymous"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message <span className="text-[rgb(var(--muted))]">(optional)</span>
                  </label>
                  <textarea
                    placeholder="Leave a message of support..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  {!donationId ? (
                    <button
                      onClick={handleDonate}
                      disabled={!donateAmount}
                      className="w-full px-6 py-3 bg-[rgb(var(--accent))] hover:opacity-90 text-white font-medium rounded-xl focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      Donate {donateAmount ? `${donateAmount} ${selectedCurrency}` : ''}
                    </button>
                  ) : (
                    <button
                      onClick={handleConfirm}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>

                <div className="text-xs text-[rgb(var(--muted))] text-center">
                  Donations are processed securely on Base network
                </div>
              </div>
            </div>

            {/* Beneficiary Info */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
              <h3 className="font-semibold mb-3">Beneficiary</h3>
              <div className={`p-3 rounded-xl border ${address && address.toLowerCase() === fundraiser.beneficiaryAddress.toLowerCase() ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'bg-[rgb(var(--bg))] border-[rgb(var(--border))]'}`}>
                <div className="font-mono text-sm break-all">
                  {fundraiser.beneficiaryAddress}
                </div>
                {address && address.toLowerCase() === fundraiser.beneficiaryAddress.toLowerCase() && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    ✓ This is your connected wallet
                  </div>
                )}
              </div>
              <p className="text-xs text-[rgb(var(--muted))] mt-2">
                All funds will be sent directly to this address
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}