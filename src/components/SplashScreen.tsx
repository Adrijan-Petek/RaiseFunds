'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 10
      })
    }, 100)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <Image src="/logo/logo.png" alt="RaiseFunds" width={100} height={100} className="mb-4 animate-pulse" />
      <h1 className="text-2xl font-bold mb-4">RaiseFunds</h1>
      <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-gray-600">Loading...</p>
    </div>
  )
}