interface SectionHeadingProps {
  id: string
  level?: 2 | 3
  children: React.ReactNode
}

export default function SectionHeading({ id, level = 2, children }: SectionHeadingProps) {
  const Tag = level === 2 ? 'h2' : 'h3'
  const baseClass = level === 2
    ? 'text-2xl sm:text-3xl font-bold text-white border-l-4 border-accent-cyan pl-4 mb-6'
    : 'text-xl sm:text-2xl font-semibold text-white border-l-2 border-accent-cyan/50 pl-3 mb-4'

  return (
    <Tag id={id} className={`${baseClass} scroll-mt-24`}>
      <a href={`#${id}`} className="hover:text-accent-cyan transition-colors">
        {children}
      </a>
    </Tag>
  )
}
