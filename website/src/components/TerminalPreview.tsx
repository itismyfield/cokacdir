import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// --- Scenario A: Multi-panel file browsing ---
function ScenarioFiles() {
  const [cursor, setCursor] = useState(0)
  const files = [
    { name: '..', type: 'dir', color: 'text-zinc-500' },
    { name: 'src/', type: 'dir', color: 'text-accent-cyan' },
    { name: 'tests/', type: 'dir', color: 'text-accent-cyan' },
    { name: 'Cargo.toml', type: 'file', color: 'text-zinc-400' },
    { name: 'README.md', type: 'file', color: 'text-zinc-400' },
  ]
  const rightFiles = [
    { name: '..', color: 'text-zinc-500' },
    { name: 'main.rs', color: 'text-accent-green' },
    { name: 'lib.rs', color: 'text-accent-green' },
    { name: 'ui/', color: 'text-accent-cyan' },
    { name: 'utils/', color: 'text-accent-cyan' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCursor((prev) => (prev + 1) % files.length)
    }, 800)
    return () => clearInterval(interval)
  }, [files.length])

  return (
    <div className="p-4 font-mono text-sm">
      <div className="text-center text-accent-cyan mb-2 font-bold text-xs">COKACDIR</div>
      <div className="flex gap-2">
        {/* Panel 1 */}
        <div className="flex-1 border border-primary rounded p-2 bg-bg-card/50">
          <div className="text-primary text-xs mb-2 border-b border-zinc-700 pb-1">~/projects</div>
          <div className="space-y-0.5 text-xs">
            {files.map((f, i) => (
              <div key={i} className={`px-1 ${i === cursor ? 'bg-primary/30 text-white' : f.color}`}>
                {f.name}
              </div>
            ))}
          </div>
        </div>
        {/* Panel 2 */}
        <div className="flex-1 border border-zinc-600 rounded p-2 bg-bg-card/50">
          <div className="text-zinc-400 text-xs mb-2 border-b border-zinc-700 pb-1">~/projects/src</div>
          <div className="space-y-0.5 text-xs">
            {rightFiles.map((f, i) => (
              <div key={i} className={`px-1 ${f.color}`}>{f.name}</div>
            ))}
          </div>
        </div>
      </div>
      {/* Status bar */}
      <div className="flex justify-center gap-4 mt-3 text-xs border-t border-zinc-700 pt-2">
        <span>
          <span className="text-accent-cyan">3</span>
          <span className="text-zinc-500">d </span>
          <span className="text-accent-cyan">5</span>
          <span className="text-zinc-500">f </span>
          <span className="text-accent-cyan">1.2GB</span>
        </span>
        <span className="text-zinc-600">|</span>
        <span>
          <span className="text-accent-cyan">500MB</span>
          <span className="text-zinc-500">/</span>
          <span className="text-accent-cyan">1TB</span>
        </span>
      </div>
    </div>
  )
}

// --- Scenario B: AI prompt overlay ---
function ScenarioAI() {
  const prompt = 'Move all .log files to archive/'
  const result = 'Moved 12 files to archive/'
  const [phase, setPhase] = useState(0) // 0=overlay appear, 1=typing, 2=result
  const [typed, setTyped] = useState('')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setPhase(1), 600))
    // Start typing
    let i = 0
    timers.push(setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setTyped(prompt.slice(0, i))
        if (i >= prompt.length) {
          clearInterval(interval)
          const t = setTimeout(() => setPhase(2), 500)
          timers.push(t)
        }
      }, 40)
      timers.push(interval as unknown as ReturnType<typeof setTimeout>)
    }, 700))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="p-4 font-mono text-sm">
      <div className="text-center text-accent-cyan mb-2 font-bold text-xs">COKACDIR</div>
      {/* Dim background files */}
      <div className="opacity-30 mb-3">
        <div className="space-y-0.5 text-xs">
          <div className="text-zinc-400">src/</div>
          <div className="text-zinc-400">tests/</div>
          <div className="text-zinc-400">Cargo.toml</div>
        </div>
      </div>
      {/* AI overlay */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="border border-accent-purple/50 rounded-lg p-3 bg-bg-card/90"
      >
        <div className="text-accent-purple text-xs mb-2">AI Command</div>
        <div className="flex items-start gap-2">
          <span className="text-accent-purple shrink-0">&gt;</span>
          <span className="text-white text-xs">
            {phase >= 1 ? typed : ''}
            {phase === 1 && <span className="typing-cursor" />}
          </span>
        </div>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-accent-green text-xs"
          >
            {result}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// --- Scenario C: Diff view ---
function ScenarioDiff() {
  const diffs = [
    { name: 'config.json', status: 'modified', color: 'text-yellow-400' },
    { name: 'main.rs', status: 'modified', color: 'text-yellow-400' },
    { name: 'new_module.rs', status: 'left only', color: 'text-green-400' },
    { name: 'old_helper.rs', status: 'right only', color: 'text-blue-400' },
    { name: 'utils.rs', status: 'identical', color: 'text-zinc-500' },
  ]

  return (
    <div className="p-4 font-mono text-sm">
      <div className="text-center text-accent-cyan mb-2 font-bold text-xs">DIFF COMPARE</div>
      <div className="border border-zinc-700 rounded p-2 bg-bg-card/50">
        <div className="flex justify-between text-xs text-zinc-500 mb-2 border-b border-zinc-700 pb-1">
          <span>~/project-v1</span>
          <span className="text-zinc-600">vs</span>
          <span>~/project-v2</span>
        </div>
        <div className="space-y-1">
          {diffs.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.2 }}
              className="flex items-center justify-between text-xs"
            >
              <span className={d.color}>{d.name}</span>
              <span className={`${d.color} text-[10px]`}>{d.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-[10px]">
        <span className="text-yellow-400">Modified</span>
        <span className="text-green-400">Left only</span>
        <span className="text-blue-400">Right only</span>
      </div>
    </div>
  )
}

const scenarios = [ScenarioFiles, ScenarioAI, ScenarioDiff]
const labels = ['File Browser', 'AI Command', 'Diff Compare']

export default function TerminalPreview() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % scenarios.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const ActiveScene = scenarios[active]

  return (
    <div className="relative max-w-6xl mx-auto">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent-cyan to-accent-purple rounded-xl blur-lg opacity-30" />

      {/* Terminal window */}
      <div className="relative bg-bg-dark border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-bg-card border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex gap-2" aria-hidden="true">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-zinc-500 ml-2 font-mono">cokacdir — ~/projects</span>
          </div>
          {/* Scene indicator dots */}
          <div className="flex gap-1 sm:gap-1.5">
            {labels.map((label, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono transition-colors ${
                  i === active
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content area with transitions */}
        <div className="min-h-[240px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <ActiveScene />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
