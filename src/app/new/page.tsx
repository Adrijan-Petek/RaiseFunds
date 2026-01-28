'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewFundraiser() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    goalAmount: '',
    beneficiaryAddress: '',
    coverImageUrl: '',
    category: '',
    deadline: '',
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Fundraiser</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 border"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border"
          required
        />
        <input
          type="number"
          placeholder="Goal Amount (ETH)"
          value={form.goalAmount}
          onChange={e => setForm({ ...form, goalAmount: e.target.value })}
          className="w-full p-2 border"
          required
        />
        <input
          type="text"
          placeholder="Beneficiary Address"
          value={form.beneficiaryAddress}
          onChange={e => setForm({ ...form, beneficiaryAddress: e.target.value })}
          className="w-full p-2 border"
          required
        />
        <input
          type="text"
          placeholder="Cover Image URL"
          value={form.coverImageUrl}
          onChange={e => setForm({ ...form, coverImageUrl: e.target.value })}
          className="w-full p-2 border"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          className="w-full p-2 border"
          required
        />
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={e => setForm({ ...form, deadline: e.target.value })}
          className="w-full p-2 border"
        />
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
      </form>
    </div>
  )
}