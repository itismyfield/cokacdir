import { motion } from 'framer-motion'
import { BookOpen, Apple, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'
import CodeBlock from './ui/CodeBlock'
import TerminalPreview from './TerminalPreview'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-background opacity-50" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6"
        >
          <span className="gradient-text">cokacdir</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4"
        >
          Terminal File Manager
          <br />
          <span className="text-glow text-accent-cyan">for Vibe Coders</span>
        </motion.p>

        {/* Sub-tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-base sm:text-lg text-zinc-400 mb-4"
        >
          An easy terminal explorer for vibe coders who are scared of the terminal
        </motion.p>

        {/* Terminal preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mb-16"
        >
          <TerminalPreview />
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-6xl mx-auto mb-8"
          id="install"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Get Started in <span className="text-accent-cyan">Seconds</span>
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg mb-8">
            One command installation. No dependencies required.
          </p>

          <div className="relative space-y-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-accent-cyan/20 to-accent-purple/20 rounded-2xl blur-xl opacity-60 pointer-events-none" />
            <div className="relative">
              <CodeBlock code={`/bin/bash -c "$(curl -fsSL https://cokacdir.cokac.com/install.sh)"`} />
            </div>
            <div className="relative">
              <CodeBlock code="cokacdir [PATH...]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-zinc-500">
            <div className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              <span className="text-sm">macOS</span>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span className="text-sm">Linux</span>
            </div>
          </div>

          {/* Optional AI setup */}
          <div className="mt-12 p-4 sm:p-6 rounded-xl border border-zinc-800 bg-bg-card text-left">
            <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="text-accent-purple">✨</span>
              Enable AI Commands (Optional)
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Install Claude Code to unlock natural language file operations.
            </p>
            <div className="space-y-3">
              <CodeBlock code="npm install -g @anthropic-ai/claude-code" />
            </div>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
        >
          <Link
            to="/tutorial"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-accent-cyan text-bg-dark font-bold text-lg hover:bg-accent-cyan/90 shadow-lg shadow-accent-cyan/25 transition-all duration-200"
          >
            <BookOpen className="w-5 h-5" />
            Beginner Tutorial
          </Link>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 bg-accent-cyan rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
