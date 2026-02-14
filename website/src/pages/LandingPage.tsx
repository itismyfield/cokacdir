import Hero from '../components/Hero'
import PowerStrip from '../components/PowerStrip'
import AIShowcase from '../components/AIShowcase'
import Features from '../components/Features'
import AllInOne from '../components/AllInOne'
import Installation from '../components/Installation'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-dark">
      <Hero />
      <PowerStrip />
      <AIShowcase />
      <Features />
      <AllInOne />
      <Installation />
      <Footer />
    </div>
  )
}
