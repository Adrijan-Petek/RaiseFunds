'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Fundraiser {
  id: string
  title: string
  status: string
  totalRaisedCached: number
}

export default function MePage() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Check if logged in
    const session = document.cookie.includes('creator_session')
    setIsLoggedIn(session)
    if (session) {
      fetchFundraisers()
    }
  }, [])

  const fetchFundraisers = async () => {
    // For MVP, fetch all, but in real, filter by creator
    const res = await fetch('/api/fundraisers')
    const data = await res.json()
    setFundraisers(data)
  }

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setIsLoggedIn(true)
      fetchFundraisers()
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/fundraisers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchFundraisers()
  }

  const addUpdate = async (id: string, text: string) => {
    await fetch(`/api/fundraisers/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Creator Login</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 border mr-2"
        />
        <button onClick={handleLogin} className="px-4 py-2 bg-blue-500 text-white rounded">Login</button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Fundraisers</h1>
      <Link href="/new" className="px-4 py-2 bg-green-500 text-white rounded mb-4 inline-block">Create New</Link>
      <div className="space-y-4">
        {fundraisers.map(f => (
          <div key={f.id} className="border p-4 rounded">
            <h2 className="text-xl font-semibold">{f.title}</h2>
            <p>Status: {f.status}</p>
            <p>Raised: {f.totalRaisedCached} ETH</p>
            <select onChange={e => updateStatus(f.id, e.target.value)} defaultValue={f.status} className="border p-1 mr-2">
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="ENDED">Ended</option>
            </select>
            <input type="text" placeholder="Update text" id={`update-${f.id}`} className="border p-1 mr-2" />
            <button onClick={() => {
              const text = (document.getElementById(`update-${f.id}`) as HTMLInputElement).value
              addUpdate(f.id, text)
            }} className="px-4 py-1 bg-blue-500 text-white rounded">Add Update</button>
          </div>
        ))}
      </div>
    </div>
  )
}