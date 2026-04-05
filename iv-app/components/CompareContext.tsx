"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import Link from "next/link"
import { X, GitCompare } from "lucide-react"

interface CompareContextValue {
  selected: string[]
  toggle: (slug: string, name: string) => void
  isSelected: (slug: string) => boolean
  clear: () => void
}

const CompareContext = createContext<CompareContextValue>({
  selected: [],
  toggle: () => {},
  isSelected: () => false,
  clear: () => {},
})

interface ClinicMeta {
  slug: string
  name: string
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<ClinicMeta[]>([])

  const toggle = useCallback((slug: string, name: string) => {
    setSelected((prev) => {
      if (prev.some((c) => c.slug === slug)) return prev.filter((c) => c.slug !== slug)
      if (prev.length >= 3) return prev // max 3
      return [...prev, { slug, name }]
    })
  }, [])

  const isSelected = useCallback((slug: string) => selected.some((c) => c.slug === slug), [selected])
  const clear = useCallback(() => setSelected([]), [])

  return (
    <CompareContext.Provider value={{ selected: selected.map((c) => c.slug), toggle, isSelected, clear }}>
      {children}
      {/* Sticky compare bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-3 flex-wrap sm:flex-nowrap">
            <GitCompare className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-sm font-semibold text-gray-700 shrink-0">Comparing:</span>
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {selected.map((c) => (
                <span
                  key={c.slug}
                  className="flex items-center gap-1 text-xs bg-teal-50 border border-teal-200 text-teal-700 px-2 py-1 rounded-full font-medium"
                >
                  {c.name}
                  <button onClick={() => toggle(c.slug, c.name)} className="hover:text-red-500 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {selected.length < 3 && (
                <span className="text-xs text-gray-400 italic">+ add {3 - selected.length} more</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selected.length >= 2 && (
                <Link
                  href={`/compare?slugs=${selected.map((c) => c.slug).join(",")}`}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Compare Now
                </Link>
              )}
              <button
                onClick={clear}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-2"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  return useContext(CompareContext)
}
