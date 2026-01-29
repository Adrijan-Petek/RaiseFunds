'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'

interface Report {
  id: string
  reason: string
  details?: string
  fundraiser: { id: string; title: string }
}

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    const res = await fetch('/api/admin', {
      headers: { 'x-admin-key': 'your-admin-key' }, // In real, from env or input
    })
    const data = await res.json()
    setReports(data)
  }

  const hideFundraiser = async (fundraiserId: string) => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'your-admin-key' },
      body: JSON.stringify({ fundraiserId, action: 'hide' }),
    })
    fetchReports()
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <Header />

        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
          <div className="space-y-4">
            {reports.map(r => (
              <div key={r.id} className="border p-4 rounded">
                <p><strong>{r.fundraiser.title}</strong></p>
                <p>Reason: {r.reason}</p>
                {r.details && <p>Details: {r.details}</p>}
                <button onClick={() => hideFundraiser(r.fundraiser.id)} className="px-4 py-2 bg-red-500 text-white rounded">Hide Fundraiser</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}