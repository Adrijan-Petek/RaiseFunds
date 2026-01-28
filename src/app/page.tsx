'use client'

import { useEffect, useState } from 'react'

interface Fundraiser {
  id: string
  title: string
  description: string
  goalAmountWei: string
  beneficiaryAddress: string
  coverImageUrl?: string
  category: string
  donations: { amountWei: string }[]
}

export default function Home() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])

  useEffect(() => {
    fetch('/api/fundraisers')
      .then(res => res.json())
      .then(setFundraisers)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Fundraisers</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fundraisers.map(f => (
          <div key={f.id} className="border p-4 rounded">
            {f.coverImageUrl && <img src={f.coverImageUrl} alt={f.title} className="w-full h-32 object-cover mb-2" />}
            <h2 className="text-xl font-semibold">{f.title}</h2>
            <p>{f.description}</p>
            <p>Goal: {f.goalAmountWei} wei</p>
            <p>Raised: {f.donations.reduce((sum, d) => sum + BigInt(d.amountWei), 0n)} wei</p>
            <a href={`/f/${f.id}`} className="text-blue-600">View</a>
          </div>
        ))}
      </div>
    </div>
  )
}