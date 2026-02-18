import Hero from '../components/Hero'
import PowerStrip from '../components/PowerStrip'
import AIShowcase from '../components/AIShowcase'
import TelegramShowcase from '../components/TelegramShowcase'
import Features from '../components/Features'
import AllInOne from '../components/AllInOne'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-dark overflow-x-hidden">
      <Hero />
      <PowerStrip />
      <AIShowcase />
      <TelegramShowcase />
      <Features />
      <AllInOne />
      <Footer />
    </div>
  )
}
