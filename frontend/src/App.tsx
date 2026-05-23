import { Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/shared/BottomNav'
import { ProjectsPage } from './pages/ProjectsPage'
import { ComposePage } from './pages/ComposePage'
import { SchedulePage } from './pages/SchedulePage'
import { RedditPage } from './pages/RedditPage'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/compose" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/reddit" element={<RedditPage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
