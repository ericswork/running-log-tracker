import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppShell } from './AppShell'
import { ThemeProvider } from './ThemeProvider'

describe('AppShell branding', () => {
  it('renders the "Running Log" title and the logo mark in the header', () => {
    const { container } = render(
      // ThemeProvider supplies the context the header's theme toggle reads.
      <ThemeProvider defaultTheme="light">
        <AppShell>
          <div>content</div>
        </AppShell>
      </ThemeProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Running Log' }),
    ).toBeInTheDocument()

    // Decorative Footprints brand mark (aria-hidden; the h1 carries the name).
    const mark = container.querySelector('.lucide-footprints')
    expect(mark).toBeInTheDocument()
    expect(mark).toHaveAttribute('aria-hidden', 'true')
  })
})
