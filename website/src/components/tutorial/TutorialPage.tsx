import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Github, BookOpen } from 'lucide-react'
import TutorialSidebar from './TutorialSidebar'
import TutorialContent from './TutorialContent'
import { LanguageProvider, useLanguage } from './LanguageContext'

function LanguageToggle() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center border border-zinc-700 rounded-md overflow-hidden text-xs">
      <button
        onClick={() => setLang('en')}
        className={`px-2 py-1 font-semibold transition-colors ${
          lang === 'en'
            ? 'bg-accent-cyan/20 text-accent-cyan'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        EN
      </button>
      <div className="w-px h-4 bg-zinc-700" />
      <button
        onClick={() => setLang('ko')}
        className={`px-2 py-1 font-semibold transition-colors ${
          lang === 'ko'
            ? 'bg-accent-cyan/20 text-accent-cyan'
            : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        KO
      </button>
    </div>
  )
}

function TutorialPageInner() {
  const { lang, t } = useLanguage()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-bg-dark/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Home</span>
            </Link>
            <div className="hidden sm:block h-5 w-px bg-zinc-700" />
            <Link to="/" className="hidden sm:block">
              <span className="gradient-text font-bold text-lg">cokacdir</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-cyan" />
              <span className="hidden sm:inline">Beginner Tutorial</span>
            </span>
            <LanguageToggle />
          </div>

          <a
            href="https://github.com/kstost/cokacdir"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16 flex gap-8">
        <TutorialSidebar />

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Page title */}
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                {t('Beginner Tutorial', '초보자 튜토리얼')}
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl">
                {t(
                  'A step-by-step guide for first-time cokacdir users. Follow along from installation to advanced features, or jump to any topic from the sidebar.',
                  'cokacdir를 처음 사용하는 분을 위한 단계별 안내서입니다. 설치부터 고급 기능까지, 순서대로 따라하거나 왼쪽 목차에서 원하는 항목을 골라 읽을 수 있습니다.'
                )}
              </p>
            </div>

            <TutorialContent />

            {/* Bottom navigation */}
            <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-zinc-400 hover:text-accent-cyan transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('Back to Home', '홈으로 돌아가기')}
              </Link>
              <a
                href="https://github.com/kstost/cokacdir"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                Star on GitHub
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default function TutorialPage() {
  return (
    <LanguageProvider>
      <TutorialPageInner />
    </LanguageProvider>
  )
}
