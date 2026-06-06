import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppShell } from './components/layout/AppShell'
import { RunForm } from './components/RunForm'
import { RunList } from './components/RunList'

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <AppShell>
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-medium">Add a run</h2>
          <RunForm />
        </section>
        <section>
          <h2 className="mb-2 text-lg font-medium">Runs</h2>
          <RunList />
        </section>
      </AppShell>
    </ThemeProvider>
  )
}

export default App
