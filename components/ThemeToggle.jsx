"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Vraćamo prazan div iste veličine da ne skače layout dok se učitava
    return <div className="w-10 h-10" /> 
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        relative flex items-center justify-center 
        w-10 h-10 rounded-full 
        bg-white/90 dark:bg-gray-800/90 
        border border-gray-200 dark:border-gray-700 
        shadow-sm hover:shadow-md 
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        backdrop-blur-sm
      "
      aria-label="Promijeni temu"
    >
      {/* SUNCE IKONA (Prikazuje se kad je LIGHT, skriva se kad je DARK) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          absolute w-5 h-5 text-yellow-500
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
        `}
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>

      {/* MJESEC IKONA (Skriven kad je LIGHT, prikazuje se kad je DARK) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`
          absolute w-5 h-5 text-blue-400
          transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
        `}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}