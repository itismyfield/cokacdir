import { motion } from 'framer-motion'
import { Send, Terminal, FileUp, Bot, Wrench, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: Bot,
    title: 'Claude AI in Your Pocket',
    desc: 'Chat with Claude AI through Telegram. Ask questions, generate code, analyze files — all from your phone.',
  },
  {
    icon: Terminal,
    title: 'Remote Shell Access',
    desc: 'Execute shell commands on your server with ! prefix. Check logs, manage processes, run scripts.',
  },
  {
    icon: FileUp,
    title: 'File Transfer',
    desc: 'Download server files or upload from your phone. AI can also send generated files directly to you.',
  },
  {
    icon: Wrench,
    title: 'Dynamic Tool Control',
    desc: 'Add or remove AI tools on the fly. Fine-tune what Claude can do for security or workflow needs.',
  },
]

function ChatBubble({ from, children, delay }: { from: 'user' | 'bot'; children: React.ReactNode; delay: number }) {
  const isUser = from === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-cyan/20 border border-accent-cyan/30 text-zinc-200 rounded-br-sm'
            : 'bg-bg-card border border-zinc-700 text-zinc-300 rounded-bl-sm'
        }`}
      >
        {children}
      </div>
    </motion.div>
  )
}

function ChatDemo() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/20 via-primary/10 to-accent-cyan/20 rounded-xl blur-lg opacity-30" />
      <div className="relative bg-bg-dark border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-bg-card border-b border-zinc-800">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center">
            <Send className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <div className="text-sm text-white font-medium">cokacdir Bot</div>
            <div className="text-xs text-zinc-500">online</div>
          </div>
        </div>

        {/* Chat body */}
        <div className="p-4 space-y-3 min-h-[280px]">
          <ChatBubble from="user" delay={0.1}>
            <code className="text-accent-cyan font-mono text-xs">/start ~/my-project</code>
          </ChatBubble>
          <ChatBubble from="bot" delay={0.3}>
            Session started at <code className="text-accent-cyan font-mono text-xs">/home/user/my-project</code>
          </ChatBubble>
          <ChatBubble from="user" delay={0.5}>
            Find all TODO comments and create a summary
          </ChatBubble>
          <ChatBubble from="bot" delay={0.7}>
            <span className="text-zinc-400">Searching files...</span>
            <div className="mt-2 text-zinc-300">Found <strong className="text-white">12 TODOs</strong> across 5 files. Here's the summary:</div>
            <div className="mt-1 font-mono text-xs text-accent-cyan">
              src/main.rs:42 — TODO: add error handling<br />
              src/api.rs:18 — TODO: implement caching
            </div>
          </ChatBubble>
          <ChatBubble from="user" delay={0.9}>
            <code className="text-accent-cyan font-mono text-xs">!git status</code>
          </ChatBubble>
          <ChatBubble from="bot" delay={1.1}>
            <span className="font-mono text-xs text-zinc-400">On branch main<br />2 files changed, 48 insertions(+)</span>
          </ChatBubble>
        </div>
      </div>
    </div>
  )
}

export default function TelegramShowcase() {
  return (
    <section className="py-12 sm:py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 via-accent-cyan/8 to-accent-cyan/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-accent-cyan/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-sm text-accent-cyan mb-6">
            <Smartphone className="w-4 h-4" />
            Remote Control via Telegram
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Control <span className="text-accent-cyan">Claude Code</span> from Your Phone
          </h2>
          <p className="text-zinc-400 text-sm sm:text-lg max-w-2xl mx-auto">
            Run a Telegram bot on your server and get full Claude AI access anywhere.
            Execute commands, transfer files, and manage projects — all from a chat.
          </p>
        </motion.div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-10 sm:mb-16">
          {/* Left: Chat demo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <ChatDemo />
          </motion.div>

          {/* Right: Feature list */}
          <div className="space-y-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex gap-4"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-accent-cyan" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{f.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-bg-card border border-zinc-800 rounded-xl p-5 sm:p-8 text-center"
        >
          <h3 className="text-xl font-bold mb-3">Get Started in 2 Steps</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch max-w-2xl mx-auto mb-6">
            <div className="flex-1 bg-bg-elevated border border-zinc-700 rounded-lg p-4 text-left">
              <div className="text-accent-cyan font-mono text-sm mb-2">Step 1</div>
              <p className="text-zinc-400 text-sm">Create a bot via <strong className="text-white">@BotFather</strong> on Telegram and copy the API token</p>
            </div>
            <div className="flex-1 bg-bg-elevated border border-zinc-700 rounded-lg p-4 text-left">
              <div className="text-accent-cyan font-mono text-sm mb-2">Step 2</div>
              <code className="text-accent-cyan font-mono text-sm">cokacdir --ccserver YOUR_TOKEN</code>
            </div>
          </div>
          <Link
            to="/tutorial"
            onClick={() => setTimeout(() => {
              const el = document.getElementById('telegram-bot')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }, 100)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan font-semibold hover:bg-accent-cyan/20 transition-colors"
          >
            <Send className="w-4 h-4" />
            Full Setup Guide
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
