"use client"

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
  return (
    <div>
      <h1>RaiseFunds</h1>
      <p>Welcome</p>
    </div>
  )
}