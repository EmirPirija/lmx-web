"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function SmartThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Ovo je varijabla koja kaže koliko piksela od dna dugme treba biti
  const [bottomOffset, setBottomOffset] = useState(24) // Početno: 24px (bottom-6)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      // 1. Visina cijele stranice
      const totalHeight = document.documentElement.scrollHeight
      // 2. Trenutna pozicija skrola + visina prozora (gdje su nam oči)
      const scrollPosition = window.scrollY + window.innerHeight
      
      // 3. Koliko je piksela ostalo do potpunog dna?
      const distanceToBottom = totalHeight - scrollPosition

      // LOGIKA: Ako smo blizu dna (npr. u zoni Footera od 150px)
      // Podigni dugme gore da ne smeta
      if (distanceToBottom < 150) {
        // Matematika: Što smo bliže dnu, to dugme ide više gore
        // 150 - distance je koliko smo "zagazili" u footer + 24px margine
        setBottomOffset(100 - distanceToBottom + 24)
      } else {
        // Ako smo negdje u sredini stranice, vrati ga na 24px
        setBottomOffset(24)
      }
    }

    window.addEventListener("scroll", handleScroll)
    // Pozovi odmah jednom da provjeriš poziciju
    handleScroll() 

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) return <div className="fixed bottom-6 right-6 w-12 h-12" />

  return (
    <div
    style={{ 
      bottom: `${bottomOffset}px`,
      display: 'none'
    }}
      className="fixed left-8 z-[9999] transition-all duration-30000 ease-out will-change-[bottom]"
    >
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="
          group flex items-center justify-center 
          w-12 h-12 rounded-full 
          bg-white/90 dark:bg-gray-800/90 backdrop-blur-md
          border border-gray-200 dark:border-gray-700 
          shadow-lg hover:shadow-xl hover:scale-110 active:scale-95
          transition-all duration-300
        "
        aria-label="Promijeni temu"
      >
        {/* SUNCE (Vidljivo na Light) */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
             className={`absolute w-5 h-5 text-yellow-500 transition-all duration-500 ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
             <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>

        {/* MJESEC (Vidljivo na Dark) */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
             className={`absolute w-5 h-5 text-blue-400 transition-all duration-500 ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}>
             <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  )
}