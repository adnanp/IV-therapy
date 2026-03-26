"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  defaultValue?: string
  placeholder?: string
  size?: "default" | "lg"
}

export function SearchBar({ defaultValue = "", placeholder = "City, state, or zip code...", size = "default" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    const trimmed = query.trim()
    // Detect zip code (5 digits)
    if (/^\d{5}$/.test(trimmed)) {
      router.push(`/search?zip=${encodeURIComponent(trimmed)}`)
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={size === "lg" ? "h-14 pl-10 text-base rounded-xl" : "pl-10"}
        />
      </div>
      <Button type="submit" size={size === "lg" ? "lg" : "default"} className={size === "lg" ? "h-14 px-8 rounded-xl" : ""}>
        Search
      </Button>
    </form>
  )
}
