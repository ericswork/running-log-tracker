import { describe, it, expect } from 'vitest'
import { useQuery } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import { renderWithClient } from './renderWithClient'

// Proves the harness end-to-end: jsdom render, jest-dom matchers, and the
// renderWithClient QueryClientProvider wrapper driving a React Query hook.
function Probe() {
  const { data } = useQuery({
    queryKey: ['smoke'],
    queryFn: async () => 'harness ok',
  })
  return <span>{data ?? 'loading'}</span>
}

describe('frontend test harness', () => {
  it('renders the DOM and jest-dom matchers work', () => {
    renderWithClient(<span>hello</span>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('drives a React Query hook via renderWithClient', async () => {
    renderWithClient(<Probe />)
    expect(await screen.findByText('harness ok')).toBeInTheDocument()
  })
})
