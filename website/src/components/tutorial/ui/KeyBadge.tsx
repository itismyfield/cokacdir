interface KeyBadgeProps {
  children: React.ReactNode
}

export default function KeyBadge({ children }: KeyBadgeProps) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 mx-0.5 text-sm font-mono font-semibold text-accent-cyan bg-bg-elevated border border-zinc-700 rounded-md shadow-[0_2px_0_0_rgba(63,63,70,0.8)] whitespace-nowrap">
      {children}
    </kbd>
  )
}
