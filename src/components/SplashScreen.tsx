'use client'

import { useEffect, useState } from 'react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(onComplete, 300)
          return 100
        }
        return prev + 10
      })
    }, 120)

    return () => {
      clearInterval(progressInterval)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(96,165,250,0.18),rgba(0,0,0,0)_70%)] opacity-100" />

      <div className="relative w-full max-w-sm px-6">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-xl">
          <div className="mx-auto w-64">
            <div className="mb-5 flex items-center justify-center">
              <img src="/logo/logo1.png" alt="RaiseFunds" className="h-[48px] w-full object-contain" />
            </div>

            <div className="mb-2 flex items-center justify-between text-xs text-[rgb(var(--muted))]">
              <span>Loading</span>
              <span>{progress}%</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className="h-1.5 rounded-full bg-[rgb(var(--accent))] transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
