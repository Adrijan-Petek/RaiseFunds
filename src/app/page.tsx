'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SplashScreen } from '@/components/SplashScreen'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmount: number
  totalRaisedCached: number
  coverImageUrl?: string
  category: string
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
    if (!showSplash) {
      fetchFundraisers()
    }
  }, [search, category, sort, showSplash])

  const fetchFundraisers = async () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (category) params.set('category', category)
    params.set('sort', sort)

    const res = await fetch(`/api/fundraisers?${params}`)
    const data = await res.json()
    setFundraisers(data)
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Fundraisers</h1>
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2"
        />
        <select value={category} onChange={e => setCategory(e.target.value)} className="border p-2">
          <option value="">All Categories</option>
          <option value="Charity">Charity</option>
          <option value="Project">Project</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)} className="border p-2">
          <option value="newest">Newest</option>
          <option value="trending">Trending</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fundraisers.map(f => (
          <div key={f.id} className="border p-4 rounded">
            {f.coverImageUrl && <img src={f.coverImageUrl} alt={f.title} className="w-full h-32 object-cover mb-2" />}
            <h2 className="text-xl font-semibold">{f.title}</h2>
            <p>{f.description.slice(0, 100)}...</p>
            <p>Goal: {f.goalAmount} ETH</p>
            <p>Raised: {Number(f.totalRaisedCached)} ETH</p>
            <p>Donations: {f._count.donations}</p>
            <Link href={`/f/${f.id}`} className="text-blue-600">View</Link>
          </div>
        ))}
      </div>
    </div>
  )
}