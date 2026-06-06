import { useState } from 'react'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { AppShell } from './components/layout/AppShell'
import { RunForm } from './components/RunForm'
import { RunList } from './components/RunList'
import { RunFormDialog } from '@/features/runs/RunFormDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dashboard } from '@/features/dashboard/Dashboard'

function App() {
  // Mobile-only create overlay (the inline form is hidden below md).
  const [addOpen, setAddOpen] = useState(false)

  return (
    <ThemeProvider defaultTheme="system">
      <AppShell>
        {/* Top-level navigation: the run log (default) vs the analytics
            dashboard. Client-side tab state only — no router. */}
        <Tabs defaultValue="log">
          <TabsList className="mb-6">
            <TabsTrigger value="log">Log</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          {/* Log tab: the existing run-entry form + table, unchanged. */}
          <TabsContent value="log">
            <div className="grid items-start gap-8 md:grid-cols-[1fr_2fr]">
              {/* Run-entry form: inline on the left at md+, hidden on mobile (the
                  Add-run button below opens it in an overlay instead). */}
              <section className="hidden min-w-0 md:block">
                <h2 className="mb-2 text-lg font-medium">Add a run</h2>
                <RunForm />
              </section>
              {/* min-w-0 lets this grid column shrink below the table's intrinsic
                  width so the table's own overflow wrapper clamps to the column
                  instead of widening the whole page. */}
              <section className="min-w-0">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-medium">Runs</h2>
                  <Button className="md:hidden" size="sm" onClick={() => setAddOpen(true)}>
                    Add run
                  </Button>
                </div>
                <RunList />
              </section>
            </div>

            <RunFormDialog
              open={addOpen}
              onOpenChange={setAddOpen}
              title="Add a run"
              description="Log a new run."
            />
          </TabsContent>

          {/* Dashboard tab: analytics charts + summary cards. */}
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </AppShell>
    </ThemeProvider>
  )
}

export default App
