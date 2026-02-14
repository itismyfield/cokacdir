import SectionHeading from '../ui/SectionHeading'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import KeyBadge from '../ui/KeyBadge'
import { useLanguage } from '../LanguageContext'

export default function GettingStarted() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="getting-started">Getting Started</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir(코칵디르)는 터미널에서 동작하는 파일 관리 프로그램입니다.
            Windows의 파일 탐색기나 macOS의 Finder처럼 폴더를 열고, 파일을 복사하고,
            이름을 바꾸는 등의 작업을 키보드만으로 빠르게 할 수 있습니다.
          </p>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            "터미널이 무섭다"고 느끼시는 분도 괜찮습니다. cokacdir는 마우스 없이도 직관적으로 사용할 수 있도록 설계되었습니다. 이 튜토리얼을 따라가면 금방 익숙해질 거예요.
          </p>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir is a terminal-based file manager.
            Just like Windows File Explorer or macOS Finder, you can open folders, copy files,
            rename items, and more — all with just your keyboard.
          </p>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Don't worry if the terminal feels intimidating. cokacdir is designed to be intuitive even without a mouse. Follow this tutorial and you'll get the hang of it in no time.
          </p>
        </>
      )}

      <SectionHeading id="installation" level={3}>{t('Installation', '설치하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-4">
            설치는 터미널에 아래 명령어 한 줄만 입력하면 끝입니다. macOS와 Linux를 지원합니다.
          </p>
          <StepByStep steps={[
            {
              title: '터미널을 엽니다',
              description: (
                <span>
                  macOS라면 "터미널" 또는 "iTerm2"를, Linux라면 기본 터미널 앱을 열어주세요.
                  처음이라면 macOS에서 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">Cmd + Space</code>를 누르고 "Terminal"을 검색하면 됩니다.
                </span>
              ),
            },
            {
              title: '설치 명령어를 입력합니다',
              description: (
                <div>
                  <p className="mb-2">아래 명령어를 터미널에 그대로 복사해서 붙여넣고 Enter를 눌러주세요:</p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm">
                    <span className="text-zinc-500">$ </span>
                    <span className="text-accent-cyan">curl -sL https://cokac.com/cokacdir.sh | bash</span>
                  </div>
                  <p className="mt-2 text-zinc-500 text-xs">설치 프로그램이 자동으로 여러분의 운영체제를 감지하고 알맞은 버전을 다운로드합니다.</p>
                </div>
              ),
            },
            {
              title: '설치 완료를 확인합니다',
              description: (
                <span>
                  설치가 끝나면 화면에 완료 메시지가 나타납니다. 이제 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">cokacdir</code>라고 입력하면 프로그램이 실행됩니다.
                </span>
              ),
            },
          ]} />
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-4">
            Installation is just one command in the terminal. Supports macOS and Linux.
          </p>
          <StepByStep steps={[
            {
              title: 'Open a terminal',
              description: (
                <span>
                  On macOS, open "Terminal" or "iTerm2". On Linux, open your default terminal app.
                  If you're new, press <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">Cmd + Space</code> on macOS and search for "Terminal".
                </span>
              ),
            },
            {
              title: 'Run the install command',
              description: (
                <div>
                  <p className="mb-2">Copy and paste this command into your terminal, then press Enter:</p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm">
                    <span className="text-zinc-500">$ </span>
                    <span className="text-accent-cyan">curl -sL https://cokac.com/cokacdir.sh | bash</span>
                  </div>
                  <p className="mt-2 text-zinc-500 text-xs">The installer automatically detects your OS and downloads the appropriate version.</p>
                </div>
              ),
            },
            {
              title: 'Verify the installation',
              description: (
                <span>
                  Once installed, you'll see a completion message. Now you can type <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">cokacdir</code> to launch the program.
                </span>
              ),
            },
          ]} />
        </>
      )}

      <SectionHeading id="first-launch" level={3}>{t('First Launch', '처음 실행해보기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-4">
            자, 이제 처음으로 cokacdir를 실행해봅시다.
          </p>
          <StepByStep steps={[
            {
              title: 'cokacdir를 입력하고 Enter를 누릅니다',
              description: (
                <div>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm mb-2">
                    <span className="text-zinc-500">$ </span>
                    <span className="text-accent-cyan">cokacdir</span>
                  </div>
                  <p>화면이 바뀌면서 현재 폴더의 파일과 폴더 목록이 나타납니다. 이것이 cokacdir의 메인 화면입니다.</p>
                </div>
              ),
            },
            {
              title: '화면을 둘러봅니다',
              description: (
                <span>
                  화면에 파일과 폴더 목록이 보입니다. 폴더는 파란색으로, 파일은 흰색으로 표시됩니다.
                  지금 커서가 놓인 곳(하이라이트된 줄)이 현재 선택된 항목입니다.
                </span>
              ),
            },
            {
              title: '위아래로 움직여봅니다',
              description: (
                <span>
                  키보드의 <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge> 화살표 키를 눌러보세요.
                  하이라이트가 위아래로 움직이는 것이 보이시나요? 이렇게 파일을 골라서 이동합니다.
                </span>
              ),
            },
            {
              title: '폴더 안으로 들어가봅니다',
              description: (
                <span>
                  아무 폴더 위에 커서를 놓고 <KeyBadge>Enter</KeyBadge>를 눌러보세요.
                  그 폴더 안의 내용물이 표시됩니다. 뒤로 나가려면 <KeyBadge>Esc</KeyBadge>를 누르면 됩니다.
                  <strong className="text-white"> Enter로 들어가고, Esc로 나온다</strong> — 이것만 기억하면 기본 탐색은 끝입니다!
                </span>
              ),
            },
            {
              title: '종료하기',
              description: (
                <span>
                  cokacdir를 끝내려면 <KeyBadge>Q</KeyBadge>를 누르세요. 원래 터미널 화면으로 돌아갑니다.
                </span>
              ),
            },
          ]} />

          <TipBox>
            가장 중요한 세 가지만 기억하세요: <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge>로 이동,
            <KeyBadge>Enter</KeyBadge>로 열기, <KeyBadge>Esc</KeyBadge>로 뒤로 가기. 이것만으로도 파일 탐색이 가능합니다.
          </TipBox>

          <TipBox variant="note">
            터미널 화면이 너무 작으면 글자가 깨질 수 있습니다. 터미널 창을 충분히 크게 키워주세요.
            cokacdir는 터미널 크기에 맞춰 자동으로 화면을 조절합니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-4">
            Let's launch cokacdir for the first time.
          </p>
          <StepByStep steps={[
            {
              title: 'Type cokacdir and press Enter',
              description: (
                <div>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm mb-2">
                    <span className="text-zinc-500">$ </span>
                    <span className="text-accent-cyan">cokacdir</span>
                  </div>
                  <p>The screen changes and shows a list of files and folders in your current directory. This is the main screen of cokacdir.</p>
                </div>
              ),
            },
            {
              title: 'Look around the screen',
              description: (
                <span>
                  You'll see a list of files and folders. Folders are displayed in blue, files in white.
                  The highlighted line is the currently selected item.
                </span>
              ),
            },
            {
              title: 'Move up and down',
              description: (
                <span>
                  Try pressing the <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge> arrow keys.
                  See the highlight moving up and down? That's how you navigate through files.
                </span>
              ),
            },
            {
              title: 'Enter a folder',
              description: (
                <span>
                  Place the cursor on any folder and press <KeyBadge>Enter</KeyBadge>.
                  You'll see the contents of that folder. To go back, press <KeyBadge>Esc</KeyBadge>.
                  <strong className="text-white"> Enter to go in, Esc to go back</strong> — remember this and you've got the basics!
                </span>
              ),
            },
            {
              title: 'Quit',
              description: (
                <span>
                  To exit cokacdir, press <KeyBadge>Q</KeyBadge>. You'll return to the regular terminal.
                </span>
              ),
            },
          ]} />

          <TipBox>
            Just remember three things: <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> to move,
            <KeyBadge>Enter</KeyBadge> to open, <KeyBadge>Esc</KeyBadge> to go back. That's enough to navigate files.
          </TipBox>

          <TipBox variant="note">
            If the terminal window is too small, the display may break. Make sure your terminal window is large enough.
            cokacdir automatically adjusts to fit your terminal size.
          </TipBox>
        </>
      )}
    </section>
  )
}
