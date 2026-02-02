import { motion } from 'framer-motion'
import Card from './ui/Card'

const shortcutGroups = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: '↑ ↓', action: 'Navigate files' },
      { key: 'Enter', action: 'Open directory' },
      { key: 'Esc', action: 'Parent directory' },
      { key: 'Tab / ← →', action: 'Switch panels' },
      { key: 'Home / End', action: 'First / Last item' },
      { key: '/', action: 'Go to path / Search bookmarks' },
      { key: "'", action: 'Toggle bookmark' },
      { key: '1 / 2', action: 'Home / Refresh' },
    ],
  },
  {
    title: 'File Operations',
    shortcuts: [
      { key: 'k', action: 'Create directory' },
      { key: 'x', action: 'Delete' },
      { key: 'r', action: 'Rename' },
      { key: 't / f', action: 'Tar archive / Find' },
    ],
  },
  {
    title: 'Clipboard',
    shortcuts: [
      { key: 'Ctrl+C', action: 'Copy to clipboard' },
      { key: 'Ctrl+X', action: 'Cut to clipboard' },
      { key: 'Ctrl+V', action: 'Paste from clipboard' },
    ],
  },
  {
    title: 'View & Tools',
    shortcuts: [
      { key: 'h', action: 'Help' },
      { key: 'i', action: 'File info' },
      { key: 'e', action: 'Edit file' },
      { key: 'p', action: 'Process manager' },
      { key: '`', action: 'Settings' },
    ],
  },
  {
    title: 'macOS Only',
    shortcuts: [
      { key: 'o', action: 'Open in Finder (open command)' },
      { key: 'c', action: 'Open in VS Code (code/code-insiders)' },
    ],
  },
  {
    title: 'File Viewer',
    shortcuts: [
      { key: 'Ctrl+F / /', action: 'Search' },
      { key: 'Ctrl+G', action: 'Go to line' },
      { key: 'b', action: 'Toggle bookmark' },
      { key: 'H / W', action: 'Hex mode / Word wrap' },
      { key: 'E', action: 'Open in editor' },
    ],
  },
  {
    title: 'File Editor',
    shortcuts: [
      { key: 'Ctrl+S', action: 'Save' },
      { key: 'Ctrl+K', action: 'Delete line' },
      { key: 'Ctrl+J', action: 'Duplicate line' },
      { key: 'Ctrl+/', action: 'Toggle comment' },
      { key: 'Ctrl+F/H', action: 'Find / Replace' },
    ],
  },
  {
    title: 'Selection & AI',
    shortcuts: [
      { key: 'Space / *', action: 'Select / Select all' },
      { key: ';', action: 'Select by extension' },
      { key: 'n/s/d/y', action: 'Sort: name/size/date/type' },
      { key: '.', action: 'AI command' },
      { key: 'q', action: 'Quit' },
    ],
  },
]

export default function Shortcuts() {
  return (
    <section className="py-24 px-4" id="shortcuts">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">Keyboard Shortcuts</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Master these shortcuts and navigate at the speed of thought.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {shortcutGroups.map((group, groupIndex) => (
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: groupIndex * 0.1 }}
            >
              <Card>
                <h3 className="text-lg font-semibold mb-4 text-accent-cyan">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
                    >
                      <kbd className="px-2 py-1 bg-bg-elevated rounded text-sm font-mono text-white">
                        {shortcut.key}
                      </kbd>
                      <span className="text-zinc-400 text-sm">{shortcut.action}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
