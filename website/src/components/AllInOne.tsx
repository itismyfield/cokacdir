import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const replacedTools = [
  'Finder / Nautilus',
  'vim / nano',
  'lazygit',
  'meld / diff',
  'htop',
  'FileZilla',
  'feh / sxiv',
]

export default function AllInOne() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-12 sm:py-24 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            One Tool, <span className="text-accent-cyan text-glow">Zero</span> Context Switching
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto">
            Stop juggling between file manager, editor, git client, diff tool, and terminal.
          </p>
        </motion.div>

        {/* Comparison visual */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          {/* Left: replaced tools */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            {replacedTools.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-3 text-zinc-500"
              >
                <span className="w-5 h-5 rounded-full border border-zinc-700 flex items-center justify-center text-xs text-zinc-600 shrink-0">
                  x
                </span>
                <span className="line-through decoration-zinc-600 text-base sm:text-lg">{tool}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Center: arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              {/* Arrow (horizontal on md, vertical on mobile) */}
              <div className="hidden md:block text-accent-cyan text-4xl">
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="text-accent-cyan">
                  <path d="M0 12H40M40 12L32 4M40 12L32 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="block md:hidden text-accent-cyan text-4xl">
                <svg width="24" height="48" viewBox="0 0 24 48" fill="none" className="text-accent-cyan">
                  <path d="M12 0V40M12 40L4 32M12 40L20 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Right: cokacdir */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent-cyan/20 to-accent-purple/20 rounded-2xl blur-2xl" />
              <div className="relative bg-bg-card border border-accent-cyan/30 rounded-2xl p-6 sm:p-10 text-center">
                <div className="text-4xl sm:text-5xl font-extrabold gradient-text mb-3">cokacdir</div>
                <div className="text-zinc-400 text-sm">All-in-one terminal file manager</div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Files', 'Editor', 'Git', 'Diff', 'Process', 'SSH', 'Encrypt', 'AI'].map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-accent-cyan/10 border border-accent-cyan/20 rounded text-xs text-accent-cyan">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
