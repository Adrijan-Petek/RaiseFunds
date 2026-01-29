"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { SplashScreen } from '@/components/SplashScreen'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmount: number
  currency?: string
  totalRaisedCached: number
  coverImageUrl?: string
  category: string
  status?: string
  creator: { username?: string }
  _count: { donations: number }
}

export default function Home() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    async function fetchFundraisers() {
      try {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (category) params.set('category', category)
        params.set('sort', sort)

        const res = await fetch(`/api/fundraisers?${params}`)
        const data = await res.json()

        if (res.ok) {
          setFundraisers(Array.isArray(data) ? data : [])
        } else {
          console.error('Failed to fetch fundraisers:', data)
          setFundraisers([])
        }
      } catch (error) {
        console.error('Error fetching fundraisers:', error)
        setFundraisers([])
      }
    }

    fetchFundraisers()
  }, [search, category, sort])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Header />

        <div className="mb-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h1 className="text-2xl font-semibold tracking-tight">Raise funds for anything</h1>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Create a fundraiser, share it on Farcaster, and track donations in real time.</p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-12">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="md:col-span-7 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
            placeholder="Search fundraisers…"
          />

          <select value={category} onChange={e => setCategory(e.target.value)} className="md:col-span-3 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm">
            <option value="">All categories</option>
            <option value="Medical">Medical</option>
            <option value="Education">Education</option>
            <option value="Environment">Environment</option>
            <option value="Community">Community</option>
            <option value="Other">Other</option>
          </select>

          <select value={sort} onChange={e => setSort(e.target.value)} className="md:col-span-2 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm">
            <option value="newest">Newest</option>
            <option value="trending">Trending</option>
            <option value="most-funded">Most funded</option>
          </select>
        </div>

        <div className="mb-6 text-sm text-[rgb(var(--muted))]">Showing {fundraisers.length} fundraisers</div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {fundraisers.map(f => {
            const progress = f.goalAmount ? Math.min((Number(f.totalRaisedCached) / Number(f.goalAmount)) * 100, 100) : 0
            return (
              <div key={f.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden hover:opacity-95">
                <div className="relative aspect-[16/9] bg-gradient-to-br from-neutral-200 to-neutral-50 dark:from-neutral-900 dark:to-neutral-800">
                  {f.coverImageUrl && (
                    <img
                      src={f.coverImageUrl}
                      alt={f.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">{f.status || 'ACTIVE'}</span>
                  <span className="absolute right-3 top-3 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs">{f.category}</span>
                </div>

                <div className="p-4">
                  <div className="text-base font-semibold leading-snug line-clamp-2">{f.title}</div>
                  <div className="mt-1 text-xs text-[rgb(var(--muted))]">by @{f.creator?.username || 'creator'}</div>

                  <p className="mt-2 text-sm text-[rgb(var(--muted))] line-clamp-2">{f.description}</p>

                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10">
                      <div className="h-2 rounded-full bg-[rgb(var(--accent))]" style={{ width: `${progress}%` }} />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="font-medium">{Number(f.totalRaisedCached)} {f.currency || 'ETH'} raised</div>
                      <div className="text-[rgb(var(--muted))]">Goal {f.goalAmount} {f.currency || 'ETH'}</div>
                    </div>

                    <div className="mt-1 text-xs text-[rgb(var(--muted))]">{Math.round(progress)}% funded · {f._count?.donations || 0} donors · 3 days left</div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link href={`/f/${f.id}`} className="flex-1 rounded-xl bg-[rgb(var(--accent))] px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90">View fundraiser</Link>
                    <button className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm hover:opacity-90" type="button">Share</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}