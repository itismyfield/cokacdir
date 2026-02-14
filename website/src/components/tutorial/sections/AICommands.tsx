import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function AICommands() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="ai-commands">{t('AI Assistant', 'AI 어시스턴트')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir의 가장 특별한 기능 중 하나입니다.
            AI에게 일상적인 말로 부탁하면 파일 작업을 대신해줍니다.
            예를 들어 "이 폴더에서 중복 파일을 찾아줘"라고 말하면 AI가 알아서 처리합니다.
          </p>

          <SectionHeading id="ai-setup" level={3}>AI 기능 사전 준비</SectionHeading>
          <p className="text-zinc-400 mb-4">
            AI 기능을 사용하려면 <strong className="text-white">Claude Code</strong>라는 프로그램이 먼저 설치되어 있어야 합니다.
            아래 명령어로 설치할 수 있습니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 font-mono text-sm">
            <span className="text-zinc-500">$ </span>
            <span className="text-accent-cyan">npm install -g @anthropic-ai/claude-code</span>
          </div>
          <p className="text-zinc-400 mb-6 text-sm">
            npm이 없다면 먼저 Node.js를 설치해야 합니다.
            <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline ml-1">nodejs.org</a>에서
            다운로드할 수 있습니다.
          </p>

          <SectionHeading id="ai-usage" level={3}>AI 사용하기</SectionHeading>
          <StepByStep steps={[
            {
              title: '마침표(.) 키를 누릅니다',
              description: (
                <span>
                  <KeyBadge>.</KeyBadge>을 누르면 AI 대화 화면이 열립니다.
                  하단에 메시지를 입력할 수 있는 입력창이 나타납니다.
                </span>
              ),
            },
            {
              title: '하고 싶은 작업을 일상적인 말로 입력합니다',
              description: (
                <div>
                  <p className="mb-2">복잡한 명령어를 외울 필요 없이, 평소 말하듯이 입력하면 됩니다. 예를 들어:</p>
                  <div className="space-y-2 ml-2">
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "오늘 수정된 파일만 찾아줘"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "이 폴더의 사진들을 연도별로 정리해줘"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "5MB보다 큰 파일을 모두 찾아줘"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      ".tmp 파일을 전부 삭제해줘"
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Enter를 눌러 AI에게 보냅니다',
              description: 'AI가 요청을 이해하고 처리 결과를 보여줍니다. 잠시 기다리면 응답이 나타납니다.',
            },
            {
              title: 'AI의 응답을 확인합니다',
              description: (
                <span>
                  응답이 길면 <KeyBadge>Ctrl+{'\u2191'}</KeyBadge><KeyBadge>Ctrl+{'\u2193'}</KeyBadge>으로
                  스크롤하거나 <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge>으로 페이지를 넘길 수 있습니다.
                </span>
              ),
            },
            {
              title: '추가 질문이나 요청을 할 수 있습니다',
              description: 'AI는 이전 대화 내용을 기억하므로, "방금 찾은 파일들을 백업 폴더로 복사해줘"처럼 이어서 대화할 수 있습니다.',
            },
          ]} />

          <SectionHeading id="ai-tips" level={3}>AI 화면 사용 팁</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+Enter</KeyBadge>
                <span className="text-white font-semibold">여러 줄 입력</span>
              </div>
              <p className="text-zinc-400 text-sm">
                긴 요청을 여러 줄에 걸쳐 입력하고 싶을 때 사용합니다.
                Enter는 "보내기", Shift+Enter는 "줄 바꿈"입니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">AI 화면 닫기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                첫 번째 <KeyBadge>Esc</KeyBadge>는 입력 중인 텍스트를 지우고,
                두 번째 <KeyBadge>Esc</KeyBadge>는 AI 화면을 닫고 파일 목록으로 돌아갑니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-accent-cyan font-mono bg-bg-elevated px-2 py-0.5 rounded text-sm">/clear</code>
                <span className="text-white font-semibold">대화 초기화</span>
              </div>
              <p className="text-zinc-400 text-sm">
                입력창에 <code className="text-accent-cyan font-mono">/clear</code>를 입력하면
                이전 대화 내용이 모두 지워지고 새로운 대화를 시작합니다.
              </p>
            </div>
          </div>

          <TipBox>
            AI에게 부탁할 때는 구체적으로 말하면 더 정확한 결과를 얻을 수 있습니다.
            "파일 정리해줘" 보다는 "이 폴더에서 .jpg 파일만 골라서 photos 폴더로 옮겨줘"라고 하면 좋습니다.
          </TipBox>

          <TipBox variant="warning">
            AI가 파일을 삭제하거나 이동하는 작업을 할 때는 결과를 꼼꼼히 확인하세요.
            중요한 파일에 대한 작업 전에는 먼저 백업하는 것을 추천합니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            One of cokacdir's most unique features.
            Ask the AI in plain language and it handles file operations for you.
            For example, saying "find duplicate files in this folder" will have the AI do just that.
          </p>

          <SectionHeading id="ai-setup" level={3}>Prerequisites</SectionHeading>
          <p className="text-zinc-400 mb-4">
            To use the AI feature, you need <strong className="text-white">Claude Code</strong> installed first.
            Install it with this command:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 font-mono text-sm">
            <span className="text-zinc-500">$ </span>
            <span className="text-accent-cyan">npm install -g @anthropic-ai/claude-code</span>
          </div>
          <p className="text-zinc-400 mb-6 text-sm">
            If you don't have npm, install Node.js first from
            <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-accent-cyan hover:underline ml-1">nodejs.org</a>.
          </p>

          <SectionHeading id="ai-usage" level={3}>Using the AI</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press the period (.) key',
              description: (
                <span>
                  Press <KeyBadge>.</KeyBadge> to open the AI chat screen.
                  A message input field appears at the bottom.
                </span>
              ),
            },
            {
              title: 'Describe what you want in plain language',
              description: (
                <div>
                  <p className="mb-2">No need to memorize complex commands — just type naturally. For example:</p>
                  <div className="space-y-2 ml-2">
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "Find files modified today"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "Organize photos in this folder by year"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "Find all files larger than 5MB"
                    </div>
                    <div className="bg-bg-elevated border border-zinc-800 rounded px-3 py-2 text-sm text-accent-purple font-mono">
                      "Delete all .tmp files"
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Press Enter to send',
              description: 'The AI processes your request and shows the results. Wait a moment for the response.',
            },
            {
              title: 'Review the AI\'s response',
              description: (
                <span>
                  If the response is long, scroll with <KeyBadge>Ctrl+{'\u2191'}</KeyBadge><KeyBadge>Ctrl+{'\u2193'}</KeyBadge> or
                  use <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge> to page through.
                </span>
              ),
            },
            {
              title: 'Ask follow-up questions',
              description: 'The AI remembers the conversation, so you can say things like "Copy the files you just found to the backup folder".',
            },
          ]} />

          <SectionHeading id="ai-tips" level={3}>AI Chat Tips</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+Enter</KeyBadge>
                <span className="text-white font-semibold">Multi-line Input</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Use this when you want to type a longer request across multiple lines.
                Enter sends the message, Shift+Enter adds a new line.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">Close AI Screen</span>
              </div>
              <p className="text-zinc-400 text-sm">
                First <KeyBadge>Esc</KeyBadge> clears the current input,
                second <KeyBadge>Esc</KeyBadge> closes the AI screen and returns to the file list.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <code className="text-accent-cyan font-mono bg-bg-elevated px-2 py-0.5 rounded text-sm">/clear</code>
                <span className="text-white font-semibold">Reset Conversation</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Type <code className="text-accent-cyan font-mono">/clear</code> in the input field
                to clear the conversation history and start fresh.
              </p>
            </div>
          </div>

          <TipBox>
            Be specific for better results.
            Instead of "organize files", try "move all .jpg files from this folder into a photos folder".
          </TipBox>

          <TipBox variant="warning">
            When the AI performs file operations like deleting or moving, always review the results carefully.
            We recommend backing up important files before letting the AI work on them.
          </TipBox>
        </>
      )}
    </section>
  )
}
