import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppShell } from './components/layout/AppShell'
import { RunForm } from './components/RunForm'
import { RunList } from './components/RunList'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AppShell>
        <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr]">
          {/* Run-entry form: inline on the left at md+, hidden on mobile.
              Group 3 adds a mobile "Add run" overlay in its place. */}
          <section className="hidden md:block">
            <h2 className="mb-2 text-lg font-medium">Add a run</h2>
            <RunForm />
          </section>
          <section>
            <h2 className="mb-2 text-lg font-medium">Runs</h2>
            <RunList />
          </section>
        </div>
      </AppShell>
    </ThemeProvider>
  )
}

export default App
