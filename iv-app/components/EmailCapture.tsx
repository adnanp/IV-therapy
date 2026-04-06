"use client"

import { useState } from "react"
import { Mail, ArrowRight, CheckCircle } from "lucide-react"

interface EmailCaptureProps {
  variant?: "banner" | "inline"
  city?: string
}

export function EmailCapture({ variant = "banner", city }: EmailCaptureProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus("loading")
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus("success")
        setMessage(data.message ?? "You're on the list!")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error ?? "Something went wrong")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (variant === "inline") {
    return (
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-gray-900 text-sm">Stay in the loop</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {city
            ? `Get notified when new clinics open in ${city} or deals become available.`
            : "Get notified when new clinics open near you or deals become available."}
        </p>
        {status === "success" ? (
          <div className="flex items-center gap-2 text-teal-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {status === "loading" ? "..." : <><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>
        )}
        {status === "error" && <p className="text-xs text-red-500 mt-1">{message}</p>}
      </div>
    )
  }

  // Banner variant
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-teal-900 to-teal-800">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 bg-teal-700/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-teal-200" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          New Clinics. Better Deals. First.
        </h2>
        <p className="text-teal-200 text-sm mb-8 max-w-md mx-auto">
          Join thousands of wellness seekers. We&apos;ll let you know when new clinics open near you,
          share exclusive first-session discounts, and keep you updated on IV therapy news.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-white font-semibold text-lg">
            <CheckCircle className="w-6 h-6 text-teal-300" /> {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-4 py-3 rounded-xl border-0 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold px-6 py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {status === "loading" ? "Subscribing..." : <>Notify Me <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
        {status === "error" && <p className="text-red-300 text-sm mt-3">{message}</p>}
        <p className="text-teal-400 text-xs mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
