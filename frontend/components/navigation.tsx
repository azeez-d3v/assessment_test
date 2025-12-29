import Link from "next/link"
import { cn } from "@/lib/utils"

interface NavigationProps {
  maxWidth?: string
}

export function Navigation({ maxWidth = "max-w-5xl" }: NavigationProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-bg-300 bg-bg-0/95 backdrop-blur supports-[backdrop-filter]:bg-bg-0/60">
      <div className={cn("w-full mx-auto flex h-14 items-center justify-between px-4", maxWidth)}>
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <span className="text-base font-bold tracking-tight text-text-100">DocuQ&A</span>
          </Link>
          <nav className="flex gap-6">
            <Link href="/" className="text-sm font-medium text-text-300 transition-colors hover:text-text-100">
              Ask Questions
            </Link>
            <Link href="/docs" className="text-sm font-medium text-text-300 transition-colors hover:text-text-100">
              Manage Documents
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
