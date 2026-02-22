"use client"

import { useTheme } from "next-themes"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { IconMoon, IconSun } from "@/components/Common/UnifiedIconPack"
import { useEffect, useState } from "react"

const NIGHT_STARS = [
  { top: "20%", left: "22%", delay: 0, size: 2.8 },
  { top: "28%", left: "70%", delay: 0.4, size: 2.3 },
  { top: "62%", left: "24%", delay: 0.8, size: 2.1 },
  { top: "72%", left: "68%", delay: 1.1, size: 2.6 },
]

const DAY_SPARKS = [
  { top: "24%", left: "24%", delay: 0, size: 3.2 },
  { top: "24%", left: "74%", delay: 0.45, size: 2.8 },
  { top: "72%", left: "30%", delay: 0.9, size: 2.7 },
  { top: "70%", left: "74%", delay: 1.25, size: 3.1 },
]

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 360, damping: 28, mass: 0.92 }

  useEffect(() => {
    setMounted(true)
  }, [])

  const effectiveTheme = resolvedTheme || theme
  const isDark = effectiveTheme === "dark"

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-10 w-10 rounded-full border border-slate-200/90 bg-white/85 dark:border-slate-700 dark:bg-slate-900/90"
      />
    )
  }

  return (
    <motion.button
      initial={false}
      animate={
        isDark
          ? {
              borderColor: "rgba(56,189,248,0.55)",
            }
          : {
              borderColor: "rgba(251,191,36,0.8)",
            }
      }
      whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -1.5 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.92, y: 0 }}
      transition={springTransition}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      type="button"
      className={`group relative isolate flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition-colors ${
        isDark ? "bg-slate-950 text-sky-200" : "bg-amber-50 text-amber-600"
      }`}
      aria-label="Promijeni temu"
      aria-pressed={isDark}
      title={isDark ? "Tamna tema je aktivna" : "Svijetla tema je aktivna"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="night-passive-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute inset-0"
          >
            {NIGHT_STARS.map((star, index) => (
              <motion.span
                key={`night-star-${index}`}
                className="absolute rounded-full bg-sky-200/90"
                style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 0.72 }
                    : { opacity: [0.2, 0.9, 0.25], scale: [0.85, 1.35, 0.9] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 2.6,
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: star.delay,
                        ease: "easeInOut",
                      }
                }
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="day-passive-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-none absolute inset-0"
          >
            {DAY_SPARKS.map((spark, index) => (
              <motion.span
                key={`day-spark-${index}`}
                className="absolute rounded-full bg-amber-300/90"
                style={{ top: spark.top, left: spark.left, width: spark.size, height: spark.size }}
                animate={
                  prefersReducedMotion
                    ? { opacity: 0.66 }
                    : { opacity: [0.2, 0.92, 0.25], scale: [0.8, 1.28, 0.82] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 2.8,
                        repeat: Infinity,
                        repeatType: "mirror",
                        delay: spark.delay,
                        ease: "easeInOut",
                      }
                }
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="theme-moon-icon"
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.62, rotate: -52, y: 2.5 }
            }
            animate={prefersReducedMotion ? { opacity: 1, scale: 1, rotate: 0, y: 0 } : { opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 52, y: -2.5 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
            className="relative z-[2] text-sky-200"
          >
            <motion.span
              animate={
                prefersReducedMotion
                  ? { y: 0, rotate: 0, scale: 1 }
                  : { y: [0, -0.6, 0], rotate: [0, -3, 0], scale: [1, 1.03, 1] }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <IconMoon size={17} strokeWidth={2.1} />
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            key="theme-sun-icon"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.62, rotate: 52, y: 2.5 }}
            animate={prefersReducedMotion ? { opacity: 1, scale: 1, rotate: 0, y: 0 } : { opacity: 1, scale: 1, rotate: 0, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -52, y: -2.5 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.32, ease: "easeOut" }}
            className="relative z-[2] text-amber-500"
          >
            <motion.span
              animate={
                prefersReducedMotion
                  ? { y: 0, rotate: 0, scale: 1 }
                  : { y: [0, -0.5, 0], rotate: [0, 8, 0], scale: [1, 1.05, 1] }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <IconSun size={17} strokeWidth={2.1} />
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
