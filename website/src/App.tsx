import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TutorialPage from './components/tutorial/TutorialPage'
import EC2Page from './components/ec2/EC2Page'
import MacOSPage from './components/macos/MacOSPage'
import WorkflowsPage from './components/workflows/WorkflowsPage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/ec2" element={<EC2Page />} />
        <Route path="/macos" element={<MacOSPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
      </Routes>
    </>
  )
}

export default App
