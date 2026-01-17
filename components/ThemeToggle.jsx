"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { IconSun, IconMoon } from "@tabler/icons-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-10 h-10" />

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="
        relative flex items-center justify-center 
        w-10 h-10 rounded-full 
        
        
        
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        
      "
      aria-label="Promijeni temu"
    >
      {/* SUN */}
      <IconSun
        size={20}
        stroke={2}
        className={`
          absolute text-yellow-500
          transition-all duration-300
          ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
        `}
      />

      {/* MOON */}
      <IconMoon
        size={20}
        stroke={2}
        className={`
          absolute text-blue-400
          transition-all duration-300
          ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
        `}
      />
    </button>
  )
}
