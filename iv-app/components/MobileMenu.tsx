"use client"
import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="sm:hidden p-2 text-gray-600 hover:text-teal-700"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 px-4 py-4 space-y-3">
          <Link href="/search" onClick={() => setOpen(false)} className="block text-gray-700 font-medium hover:text-teal-700 py-2 border-b border-gray-100">Browse Clinics</Link>
          <Link href="/blog" onClick={() => setOpen(false)} className="block text-gray-700 font-medium hover:text-teal-700 py-2 border-b border-gray-100">Guides</Link>
          <Link href="/pricing" onClick={() => setOpen(false)} className="block text-gray-700 font-medium hover:text-teal-700 py-2 border-b border-gray-100">For Clinics</Link>
          <Link href="/search" onClick={() => setOpen(false)} className="block bg-teal-600 text-white font-bold px-4 py-2.5 rounded-lg text-center hover:bg-teal-700 transition-colors">Find Near Me</Link>
        </div>
      )}
    </>
  )
}
