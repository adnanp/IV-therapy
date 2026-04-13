"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "lucide-react"

export function NearMeButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleClick() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser")
      return
    }
    setLoading(true)
    setError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "IVDirectory/1.0 (ivdirectory.com)" } }
          )
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ""
          const state = data.address?.state_code || data.address?.state || ""
          if (city && state) {
            router.push(`/search?q=${encodeURIComponent(`${city}, ${state}`)}`)
          } else {
            setError("Couldn't detect your city. Try typing it instead.")
          }
        } catch {
          setError("Location lookup failed. Try typing your city.")
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError("Location access denied. Type your city above.")
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-2 text-teal-300 hover:text-white text-sm font-medium transition-colors disabled:opacity-60 ${className ?? ""}`}
      >
        <Navigation className="w-4 h-4" />
        {loading ? "Detecting location..." : "Use my current location"}
      </button>
      {error && <p className="text-red-300 text-xs mt-1">{error}</p>}
    </div>
  )
}
