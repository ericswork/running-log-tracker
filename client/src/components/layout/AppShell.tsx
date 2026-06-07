import type { ReactNode } from 'react'
import { Footprints } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

// Application shell: a header (logo mark + title + theme toggle) and a main content region.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Brand: Footprints mark (decorative) + title. The h1 carries the name. */}
          <div className="flex items-center gap-2">
            <Footprints className="size-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap">Running Log</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
