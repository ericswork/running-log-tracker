import { RunForm } from './components/RunForm'
import { RunList } from './components/RunList'

function App() {
  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Running Log</h1>
      <section>
        <h2>Add a run</h2>
        <RunForm />
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Runs</h2>
        <RunList />
      </section>
    </main>
  )
}

export default App
