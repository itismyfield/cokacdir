import { useState, useEffect } from 'react'
import { X, Menu } from 'lucide-react'
import { useLanguage } from './LanguageContext'

interface TocItem {
  id: string
  en: string
  ko: string
  indent?: boolean
}

const tocItems: TocItem[] = [
  { id: 'getting-started', en: 'Getting Started', ko: 'Getting Started' },
  { id: 'installation', en: 'Installation', ko: '설치하기', indent: true },
  { id: 'first-launch', en: 'First Launch', ko: '처음 실행해보기', indent: true },
  { id: 'interface-overview', en: 'Interface Overview', ko: '화면 구성 이해하기' },
  { id: 'basic-navigation', en: 'Basic Navigation', ko: '기본 이동법' },
  { id: 'enter-exit', en: 'Open / Go Back', ko: '폴더 열기/뒤로 가기', indent: true },
  { id: 'fast-move', en: 'Fast Movement', ko: '빠르게 이동하기', indent: true },
  { id: 'panel-system', en: 'Panel System', ko: '패널 시스템' },
  { id: 'file-selection', en: 'File Selection', ko: '파일 선택하기' },
  { id: 'sorting-filtering', en: 'Sorting Files', ko: '파일 정렬하기' },
  { id: 'file-operations', en: 'File Operations', ko: '파일 작업하기' },
  { id: 'create-rename', en: 'Create / Rename', ko: '만들기/이름 바꾸기', indent: true },
  { id: 'clipboard', en: 'Copy / Paste', ko: '복사/붙여넣기', indent: true },
  { id: 'delete-archive', en: 'Delete / Archive', ko: '삭제/압축', indent: true },
  { id: 'search-find', en: 'Search Files', ko: '파일 검색하기' },
  { id: 'viewer-editor', en: 'View & Edit', ko: '보기 & 편집하기' },
  { id: 'file-viewer', en: 'File Viewer', ko: '파일 보기', indent: true },
  { id: 'file-editor', en: 'File Editor', ko: '파일 편집', indent: true },
  { id: 'diff-compare', en: 'Diff / Compare', ko: '폴더/파일 비교' },
  { id: 'git-integration', en: 'Git Features', ko: 'Git 기능' },
  { id: 'ai-commands', en: 'AI Assistant', ko: 'AI 어시스턴트' },
  { id: 'process-manager', en: 'Process Manager', ko: '프로세스 관리자' },
  { id: 'image-viewer', en: 'Image Viewer', ko: '이미지 보기' },
  { id: 'settings-config', en: 'Settings', ko: '설정 바꾸기' },
  { id: 'remote-connections', en: 'Remote (SSH)', ko: '원격 서버 (SSH)' },
  { id: 'bookmarks-help', en: 'Bookmarks & Help', ko: '북마크 & 도움말' },
  { id: 'keyboard-reference', en: 'Keyboard Reference', ko: '단축키 모아보기' },
]

export default function TutorialSidebar() {
  const { lang, t } = useLanguage()
  const [activeId, setActiveId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const ids = tocItems.map((item) => item.id)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleClick = (id: string) => {
    setMobileOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const navContent = (
    <nav className="space-y-0.5">
      {tocItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleClick(item.id)}
          className={`block w-full text-left text-sm py-1.5 transition-colors rounded px-3 ${
            item.indent ? 'pl-6' : ''
          } ${
            activeId === item.id
              ? 'text-accent-cyan bg-accent-cyan/10 font-medium'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {lang === 'en' ? item.en : item.ko}
        </button>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-accent-cyan/20 border border-accent-cyan/50 rounded-full flex items-center justify-center text-accent-cyan backdrop-blur-sm"
        aria-label="Toggle table of contents"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-40 h-full w-72 bg-bg-dark border-r border-zinc-800 p-6 pt-20 overflow-y-auto transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <h3 className="text-white font-bold text-lg mb-4">{t('Contents', '목차')}</h3>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[250px] flex-shrink-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 tutorial-sidebar-scroll">
          <h3 className="text-white font-bold text-lg mb-4 px-3">{t('Contents', '목차')}</h3>
          {navContent}
        </div>
      </aside>
    </>
  )
}
