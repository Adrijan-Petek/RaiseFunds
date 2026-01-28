"use client"

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved ? saved === 'dark' : document.documentElement.classList.contains('dark')
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] hover:opacity-90"
      aria-label="Toggle theme"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
