'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { useAccount } from 'wagmi'

export default function NewFundraiser() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    goalAmount: '',
    currency: 'ETH' as 'ETH' | 'USDC',
    beneficiaryAddress: '',
    coverImageUrl: '',
    category: '',
    deadline: '',
    creatorUsername: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const router = useRouter()
  const { address, isConnected } = useAccount()

  // Auto-populate beneficiary address with connected wallet
  useEffect(() => {
    if (address && !form.beneficiaryAddress) {
      setForm(prev => ({ ...prev, beneficiaryAddress: address }))
    }
  }, [address, form.beneficiaryAddress])

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setForm({ ...form, coverImageUrl: data.url })
        setPreviewImage(data.url)
      } else {
        alert('Failed to upload image. Please try again.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Preview the image
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      handleImageUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/fundraisers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          goalAmount: parseFloat(form.goalAmount),
        }),
      })

      if (res.ok) {
        router.push('/')
      } else {
        alert('Failed to create fundraiser. Please try again.')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    'Medical',
    'Education',
    'Environment',
    'Community',
    'Open source',
    'Emergency',
    'Events',
    'Other'
  ]

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Header />

        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            ← Back to home
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/me"
              className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90"
            >
              My dashboard
            </Link>
          </div>
        </div>

        {/* Intro */}
        <div className="mb-8 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h1 className="text-3xl font-semibold tracking-tight">Create a fundraiser</h1>
          <p className="mt-2 text-[rgb(var(--muted))]">
            Share your cause and start raising funds from the community. Fill out the details below to get started.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Fundraiser Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Help fund emergency surgery costs"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Tell your story and explain why people should support your cause..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none resize-vertical"
                  required
                />
              </div>

              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, currency: 'ETH' })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                      form.currency === 'ETH'
                        ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]'
                    }`}
                  >
                    ETH
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, currency: 'USDC' })}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
                      form.currency === 'USDC'
                        ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]'
                        : 'border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:border-[rgb(var(--accent))]'
                    }`}
                  >
                    USDC
                  </button>
                </div>
              </div>

              {/* Goal Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Funding Goal ({form.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder={form.currency === 'ETH' ? '5.0' : '100'}
                  step={form.currency === 'ETH' ? '0.01' : '1'}
                  min={form.currency === 'ETH' ? '0.01' : '1'}
                  value={form.goalAmount}
                  onChange={e => setForm({ ...form, goalAmount: e.target.value })}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Beneficiary Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Beneficiary Wallet Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={form.beneficiaryAddress}
                  onChange={e => setForm({ ...form, beneficiaryAddress: e.target.value })}
                  className={`w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none ${isConnected ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                  required
                />
                {isConnected ? (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Auto-filled with your connected wallet address
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Connect your wallet to auto-populate this field
                  </p>
                )}
              </div>

              {/* Creator Username */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Your Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="your-username"
                  value={form.creatorUsername}
                  onChange={e => setForm({ ...form, creatorUsername: e.target.value })}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                  required
                />
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  This will be displayed as the fundraiser creator
                </p>
              </div>

              {/* Cover Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Cover Image <span className="text-[rgb(var(--muted))]">(optional)</span>
                </label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {previewImage && (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-xl border border-[rgb(var(--border))]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage('')
                          setForm({ ...form, coverImageUrl: '' })
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-full rounded-xl border-2 border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-8 text-center hover:border-[rgb(var(--accent))] transition-colors">
                      {isUploading ? (
                        <div className="text-sm text-[rgb(var(--muted))]">
                          Uploading image...
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium mb-1">
                            Click to upload cover image
                          </div>
                          <div className="text-xs text-[rgb(var(--muted))]">
                            PNG, JPG, GIF up to 10MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Add a compelling image to make your fundraiser stand out
                </p>
              </div>

              {/* Deadline */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Deadline <span className="text-[rgb(var(--muted))]">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={e => setForm({ ...form, deadline: e.target.value })}
                  className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none"
                />
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  Set a deadline to create urgency for your fundraiser
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[rgb(var(--border))]">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="w-full md:w-auto px-8 py-3 bg-[rgb(var(--accent))] text-white font-medium rounded-xl hover:opacity-90 focus:ring-2 focus:ring-[rgb(var(--accent))] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : isUploading ? 'Uploading...' : 'Create Fundraiser'}
              </button>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                By creating a fundraiser, you agree to our terms of service and will be responsible for managing donations appropriately.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
