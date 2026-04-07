"use client"

import { ReactNode } from "react"

interface TrackLinkProps {
  href: string
  slug: string
  type: "book" | "call" | "website"
  children: ReactNode
  className?: string
  target?: string
  rel?: string
}

export function TrackLink({ href, slug, type, children, className, target, rel }: TrackLinkProps) {
  function handleClick() {
    // Fire-and-forget tracking
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type }),
    }).catch(() => {})
  }

  return (
    <a href={href} onClick={handleClick} className={className} target={target} rel={rel}>
      {children}
    </a>
  )
}
