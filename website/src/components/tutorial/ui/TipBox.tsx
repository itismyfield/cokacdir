import { Lightbulb, AlertTriangle, Info } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

type TipVariant = 'tip' | 'warning' | 'note'

interface TipBoxProps {
  variant?: TipVariant
  title?: string
  children: React.ReactNode
}

const variants: Record<TipVariant, { icon: typeof Lightbulb; color: string; border: string; bg: string; en: string; ko: string }> = {
  tip: {
    icon: Lightbulb,
    color: 'text-accent-cyan',
    border: 'border-accent-cyan/30',
    bg: 'bg-accent-cyan/5',
    en: 'Tip',
    ko: '팁',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/5',
    en: 'Warning',
    ko: '주의',
  },
  note: {
    icon: Info,
    color: 'text-accent-purple',
    border: 'border-accent-purple/30',
    bg: 'bg-accent-purple/5',
    en: 'Note',
    ko: '참고',
  },
}

export default function TipBox({ variant = 'tip', title, children }: TipBoxProps) {
  const { lang } = useLanguage()
  const v = variants[variant]
  const Icon = v.icon
  const defaultTitle = lang === 'en' ? v.en : v.ko

  return (
    <div className={`my-4 p-4 rounded-lg border ${v.border} ${v.bg}`}>
      <div className={`flex items-center gap-2 ${v.color} font-semibold mb-2`}>
        <Icon className="w-4 h-4" />
        <span>{title || defaultTitle}</span>
      </div>
      <div className="text-zinc-400 text-sm leading-relaxed">{children}</div>
    </div>
  )
}
