"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes in milliseconds
const WARNING_TIME = 5 * 60 * 1000 // Show warning 5 minutes before logout

export function AutoLogout() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimer = () => {
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Set warning timer (5 minutes before logout)
    warningRef.current = setTimeout(() => {
      toast.warning("You will be logged out in 5 minutes due to inactivity", {
        duration: 10000,
      })
    }, INACTIVITY_TIMEOUT - WARNING_TIME)

    // Set logout timer (30 minutes)
    timeoutRef.current = setTimeout(() => {
      toast.error("Logged out due to inactivity")
      signOut({ callbackUrl: "/login" })
    }, INACTIVITY_TIMEOUT)
  }

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ]

    // Reset timer on any activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimer)
    })

    // Start initial timer
    resetTimer()

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer)
      })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [])

  return null
}