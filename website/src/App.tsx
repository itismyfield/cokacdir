import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TutorialPage from './components/tutorial/TutorialPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />
    </Routes>
  )
}

export default App
