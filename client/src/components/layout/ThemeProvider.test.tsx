import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

// A minimal consumer that drives setTheme directly, so these tests exercise the
// provider's behavior (class on <html> + persistence) without depending on the
// Radix dropdown's portal/pointer behavior in jsdom.
function ThemeProbe() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>go dark</button>
      <button onClick={() => setTheme('light')}>go light</button>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('light', 'dark')
})

describe('ThemeProvider', () => {
  it('applies the dark class when dark is selected, and switches to light', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('go dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement).not.toHaveClass('light')

    await user.click(screen.getByText('go light'))
    expect(document.documentElement).toHaveClass('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('persists the chosen theme across a reload (remount)', async () => {
    const user = userEvent.setup()
    const { unmount } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await user.click(screen.getByText('go dark'))
    expect(localStorage.getItem('running-log-theme')).toBe('dark')

    // Simulate a page reload: tear down and re-mount a fresh provider.
    unmount()
    document.documentElement.classList.remove('light', 'dark')
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('defaults to system when no choice has been made', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    // matchMedia is mocked to matches:false (light) in the test setup.
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(document.documentElement).toHaveClass('light')
  })
})

describe('ThemeToggle', () => {
  it('renders an accessible toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })
})
