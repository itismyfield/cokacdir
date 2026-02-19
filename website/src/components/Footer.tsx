import { Github, Youtube, FileText, Cpu, GraduationCap, Cloud, Apple, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from './tutorial/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="py-12 px-4 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold gradient-text mb-1">cokacdir</h3>
            <p className="text-zinc-500 text-sm">{t('The blazing fast terminal file manager', '초고속 터미널 파일 관리자')}</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a
              href="https://github.com/kstost/cokacdir"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </a>
            <a
              href="https://www.youtube.com/@코드깎는노인"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Youtube className="w-5 h-5" />
              <span className="text-sm">YouTube</span>
            </a>
            <span className="flex items-center gap-2 text-zinc-500">
              <Cpu className="w-5 h-5" />
              <span className="text-sm">{t('Built with Rust', 'Rust로 제작')}</span>
            </span>
            <Link
              to="/workflows"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Zap className="w-5 h-5" />
              <span className="text-sm">{t('Workflows', '워크플로우')}</span>
            </Link>
            <Link
              to="/tutorial"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="text-sm">{t('Tutorial', '튜토리얼')}</span>
            </Link>
            <Link
              to="/ec2"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Cloud className="w-5 h-5" />
              <span className="text-sm">{t('EC2 Setup', 'EC2 설정')}</span>
            </Link>
            <Link
              to="/macos"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <Apple className="w-5 h-5" />
              <span className="text-sm">{t('macOS Setup', 'macOS 설정')}</span>
            </Link>
            <a
              href="https://github.com/kstost/cokacdir/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">{t('MIT License', 'MIT 라이선스')}</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm">
            © 2026 <a href="https://cokacdir.cokac.com" className="text-accent-cyan hover:underline">cokac</a>. {t('All rights reserved.', 'All rights reserved.')}
          </p>
        </div>
      </div>
    </footer>
  )
}
