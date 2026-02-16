import { motion } from 'framer-motion'
import { Columns, Search, Image, Bookmark, Wifi, Eye, Settings2, Activity, ArrowLeftRight, GitBranch, GitCommit, Keyboard, Lock } from 'lucide-react'

interface SubFeature {
  icon: typeof Columns
  label: string
}

interface Pillar {
  title: string
  description: string
  tint: string
  borderColor: string
  iconBg: string
  subFeatures: SubFeature[]
}

const pillars: Pillar[] = [
  {
    title: 'Navigate & Explore',
    description: 'Effortlessly browse, search, and organize files across local and remote systems.',
    tint: 'from-accent-cyan/5 to-transparent',
    borderColor: 'border-accent-cyan/20 hover:border-accent-cyan/40',
    iconBg: 'bg-accent-cyan/10 text-accent-cyan',
    subFeatures: [
      { icon: Columns, label: 'Multi-panel layout' },
      { icon: Search, label: 'File search with fuzzy matching' },
      { icon: Image, label: 'Terminal image viewer' },
      { icon: Bookmark, label: 'Directory bookmarks' },
      { icon: Wifi, label: 'Remote SSH / SFTP' },
    ],
  },
  {
    title: 'Edit & Create',
    description: 'Built-in tools to view, edit, and manage — no external apps needed.',
    tint: 'from-accent-purple/5 to-transparent',
    borderColor: 'border-accent-purple/20 hover:border-accent-purple/40',
    iconBg: 'bg-accent-purple/10 text-accent-purple',
    subFeatures: [
      { icon: Eye, label: 'Viewer & editor (20+ languages)' },
      { icon: Keyboard, label: 'Customizable keybindings' },
      { icon: Settings2, label: 'Custom file handlers' },
      { icon: Activity, label: 'Process manager' },
      { icon: Lock, label: 'AES-256 file encryption' },
    ],
  },
  {
    title: 'Compare & Version',
    description: 'Powerful diffing and git integration for seamless version control.',
    tint: 'from-accent-green/5 to-transparent',
    borderColor: 'border-accent-green/20 hover:border-accent-green/40',
    iconBg: 'bg-accent-green/10 text-accent-green',
    subFeatures: [
      { icon: ArrowLeftRight, label: 'Diff compare (folder & file)' },
      { icon: GitBranch, label: 'Git integration (commit, log, branch)' },
      { icon: GitCommit, label: 'Git commit diff' },
    ],
  },
]

export default function Features() {
  return (
    <section className="py-12 sm:py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Powerful Features</span>
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto">
            Everything you need in a terminal file manager, and more.
          </p>
        </motion.div>

        {/* Pillar blocks - zigzag layout */}
        <div className="space-y-10 sm:space-y-16">
          {pillars.map((pillar, index) => {
            const isReversed = index % 2 === 1

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 items-center`}
              >
                {/* Text side */}
                <div className="flex-1 lg:max-w-[50%]">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">{pillar.title}</h3>
                  <p className="text-zinc-400 mb-6">{pillar.description}</p>
                  <div className="space-y-3">
                    {pillar.subFeatures.map((sf, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: isReversed ? 20 : -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pillar.iconBg}`}>
                          <sf.icon className="w-4 h-4" />
                        </div>
                        <span className="text-zinc-300 text-sm">{sf.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Visual card side */}
                <div className="flex-1 lg:max-w-[50%] w-full">
                  <div className={`bg-gradient-to-br ${pillar.tint} border ${pillar.borderColor} rounded-2xl p-4 sm:p-8 transition-colors duration-300`}>
                    <PillarVisual index={index} />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Mini visual illustrations for each pillar
function PillarVisual({ index }: { index: number }) {
  if (index === 0) {
    // Navigate: multi-panel mockup
    return (
      <div className="font-mono text-xs space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 border border-accent-cyan/30 rounded p-2 bg-bg-dark/50">
            <div className="text-accent-cyan text-[10px] mb-1 border-b border-zinc-800 pb-1">~/documents</div>
            <div className="space-y-0.5">
              <div className="bg-primary/20 px-1 text-white">photos/</div>
              <div className="text-zinc-500">videos/</div>
              <div className="text-zinc-500">notes.md</div>
              <div className="text-zinc-500">report.pdf</div>
            </div>
          </div>
          <div className="flex-1 border border-zinc-700 rounded p-2 bg-bg-dark/50">
            <div className="text-zinc-500 text-[10px] mb-1 border-b border-zinc-800 pb-1">~/documents/photos</div>
            <div className="space-y-0.5">
              <div className="text-accent-green">vacation.jpg</div>
              <div className="text-accent-green">family.png</div>
              <div className="text-accent-green">sunset.jpg</div>
              <div className="text-zinc-500">thumbs.db</div>
            </div>
          </div>
        </div>
        <div className="text-center text-zinc-600 text-[10px]">4d 12f 2.4GB | Tab to switch</div>
      </div>
    )
  }

  if (index === 1) {
    // Edit: editor mockup
    return (
      <div className="font-mono text-xs space-y-2">
        <div className="border border-accent-purple/30 rounded bg-bg-dark/50 overflow-hidden">
          <div className="bg-bg-card px-2 py-1 border-b border-zinc-800 text-[10px] text-zinc-500 flex justify-between">
            <span>main.rs</span>
            <span className="text-accent-purple">Rust</span>
          </div>
          <div className="p-2 space-y-0.5">
            <div><span className="text-zinc-600">1</span> <span className="text-accent-purple">fn</span> <span className="text-accent-cyan">main</span>() {'{'}</div>
            <div><span className="text-zinc-600">2</span>   <span className="text-accent-purple">let</span> msg = <span className="text-accent-green">"Hello"</span>;</div>
            <div><span className="text-zinc-600">3</span>   <span className="text-zinc-400">println!</span>(<span className="text-accent-green">"{'{'}{'}'}"</span>, msg);</div>
            <div><span className="text-zinc-600">4</span> {'}'}</div>
          </div>
        </div>
        <div className="text-center text-zinc-600 text-[10px]">Syntax highlighting for 20+ languages</div>
      </div>
    )
  }

  // Compare: diff mockup
  return (
    <div className="font-mono text-xs space-y-2">
      <div className="border border-accent-green/30 rounded bg-bg-dark/50 overflow-hidden">
        <div className="bg-bg-card px-2 py-1 border-b border-zinc-800 text-[10px] flex justify-between">
          <span className="text-zinc-500">v1/config.json</span>
          <span className="text-zinc-600">vs</span>
          <span className="text-zinc-500">v2/config.json</span>
        </div>
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 p-2 border-b sm:border-b-0 sm:border-r border-zinc-800 space-y-0.5">
            <div className="text-zinc-400">  "name": "app",</div>
            <div className="bg-red-500/10 text-red-400">- "port": 3000,</div>
            <div className="text-zinc-400">  "debug": false</div>
          </div>
          <div className="flex-1 p-2 space-y-0.5">
            <div className="text-zinc-400">  "name": "app",</div>
            <div className="bg-green-500/10 text-green-400">+ "port": 8080,</div>
            <div className="text-zinc-400">  "debug": false</div>
          </div>
        </div>
      </div>
      <div className="text-center text-zinc-600 text-[10px]">Side-by-side with inline highlights</div>
    </div>
  )
}
