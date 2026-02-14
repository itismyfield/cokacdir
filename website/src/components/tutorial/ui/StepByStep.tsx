import { motion } from 'framer-motion'

interface Step {
  title: string
  description: React.ReactNode
}

interface StepByStepProps {
  steps: Step[]
}

export default function StepByStep({ steps }: StepByStepProps) {
  return (
    <div className="space-y-4 my-6">
      {steps.map((step, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/50 flex items-center justify-center text-accent-cyan font-bold text-sm">
            {i + 1}
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">{step.title}</h4>
            <div className="text-zinc-400 text-sm leading-relaxed">{step.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
