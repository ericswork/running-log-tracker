import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

// Application shell: a header (title + theme toggle) and a main content region.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight whitespace-nowrap">Running Log</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
