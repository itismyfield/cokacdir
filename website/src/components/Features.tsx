import { useState } from 'react'
import { motion } from 'framer-motion'
import { Columns, Search, Image, Bookmark, Wifi, Eye, Settings2, Activity, ArrowLeftRight, GitBranch, GitCommit, Keyboard, Lock, Copy, Check, Terminal } from 'lucide-react'
import { useLanguage } from './tutorial/LanguageContext'

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

function InstallCommand() {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const cmd = '/bin/bash -c "$(curl -fsSL https://cokacdir.cokac.com/install.sh)"'

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Terminal className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="text-xs font-medium tracking-wide uppercase text-zinc-400">{t('Quick Install', '빠른 설치')}</span>
      </div>
      <div
        onClick={handleCopy}
        className="flex items-center gap-3 bg-bg-card border border-zinc-800 hover:border-accent-cyan/40 rounded-lg px-4 py-3 cursor-pointer transition-colors group"
      >
        <code className="flex-1 text-accent-cyan text-xs sm:text-sm font-mono truncate">{cmd}</code>
        <button className="shrink-0 text-zinc-500 group-hover:text-accent-cyan transition-colors">
          {copied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-zinc-500 text-xs">
        <span>macOS</span>
        <span className="text-zinc-700">·</span>
        <span>Linux</span>
        <span className="text-zinc-700">·</span>
        <span>Windows WSL</span>
      </div>
    </div>
  )
}

export default function Features() {
  const { t } = useLanguage()

  const pillars: Pillar[] = [
    {
      title: t('Navigate & Explore', '탐색 & 탐험'),
      description: t(
        'Effortlessly browse, search, and organize files across local and remote systems.',
        '로컬과 원격 시스템의 파일을 손쉽게 탐색, 검색, 정리하세요.'
      ),
      tint: 'from-accent-cyan/5 to-transparent',
      borderColor: 'border-accent-cyan/20 hover:border-accent-cyan/40',
      iconBg: 'bg-accent-cyan/10 text-accent-cyan',
      subFeatures: [
        { icon: Columns, label: t('Multi-panel layout', '멀티 패널 레이아웃') },
        { icon: Search, label: t('File search with fuzzy matching', '퍼지 매칭 파일 검색') },
        { icon: Image, label: t('Terminal image viewer', '터미널 이미지 뷰어') },
        { icon: Bookmark, label: t('Directory bookmarks', '디렉토리 북마크') },
        { icon: Wifi, label: t('Remote SSH / SFTP', '원격 SSH / SFTP') },
      ],
    },
    {
      title: t('Edit & Create', '편집 & 생성'),
      description: t(
        'Built-in tools to view, edit, and manage — no external apps needed.',
        '보기, 편집, 관리를 위한 내장 도구 — 외부 앱이 필요 없습니다.'
      ),
      tint: 'from-accent-purple/5 to-transparent',
      borderColor: 'border-accent-purple/20 hover:border-accent-purple/40',
      iconBg: 'bg-accent-purple/10 text-accent-purple',
      subFeatures: [
        { icon: Eye, label: t('Viewer & editor (20+ languages)', '뷰어 & 에디터 (20+ 언어)') },
        { icon: Keyboard, label: t('Customizable keybindings', '커스터마이징 가능한 키 바인딩') },
        { icon: Settings2, label: t('Custom file handlers', '커스텀 파일 핸들러') },
        { icon: Activity, label: t('Process manager', '프로세스 매니저') },
        { icon: Lock, label: t('AES-256 file encryption', 'AES-256 파일 암호화') },
      ],
    },
    {
      title: t('Compare & Version', '비교 & 버전 관리'),
      description: t(
        'Powerful diffing and git integration for seamless version control.',
        '강력한 diff 비교와 git 통합으로 원활한 버전 관리.'
      ),
      tint: 'from-accent-green/5 to-transparent',
      borderColor: 'border-accent-green/20 hover:border-accent-green/40',
      iconBg: 'bg-accent-green/10 text-accent-green',
      subFeatures: [
        { icon: ArrowLeftRight, label: t('Diff compare (folder & file)', 'Diff 비교 (폴더 & 파일)') },
        { icon: GitBranch, label: t('Git integration (commit, log, branch)', 'Git 통합 (커밋, 로그, 브랜치)') },
        { icon: GitCommit, label: t('Git commit diff', 'Git 커밋 diff') },
      ],
    },
  ]

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
            {t(
              <>Plus, a <span className="gradient-text">Powerful File Manager</span></>,
              <>게다가, <span className="gradient-text">강력한 파일 관리자</span>까지</>
            )}
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto">
            {t(
              'cokacdir is also a full-featured terminal file manager. Navigate, edit, and version-control with ease.',
              'cokacdir는 본격적인 터미널 파일 관리자이기도 합니다. 탐색, 편집, 버전 관리를 손쉽게.'
            )}
          </p>
          <InstallCommand />
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
  const { t } = useLanguage()

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
        <div className="text-center text-zinc-600 text-[10px]">{t('4d 12f 2.4GB | Tab to switch', '4d 12f 2.4GB | Tab으로 전환')}</div>
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
        <div className="text-center text-zinc-600 text-[10px]">{t('Syntax highlighting for 20+ languages', '20+ 언어 구문 강조')}</div>
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
      <div className="text-center text-zinc-600 text-[10px]">{t('Side-by-side with inline highlights', '인라인 하이라이트와 나란히 비교')}</div>
    </div>
  )
}
