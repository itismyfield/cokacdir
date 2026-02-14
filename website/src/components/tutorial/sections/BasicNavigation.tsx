import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function BasicNavigation() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="basic-navigation">{t('Basic Navigation', '기본 이동법')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            파일 탐색의 핵심은 "이동"입니다. 폴더 사이를 자유롭게 돌아다니는 방법을 익혀봅시다.
            마우스 없이 키보드만으로 모든 것을 할 수 있습니다.
          </p>

          <SectionHeading id="basic-move" level={3}>위아래로 이동하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            가장 기본적인 동작입니다. 화살표 키로 파일 목록을 위아래로 움직여 보세요.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <KeyBadge>{'\u2191'}</KeyBadge>
              <span className="text-zinc-400">한 줄 위로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">한 줄 아래로 이동</span>
            </div>
          </div>
          <p className="text-zinc-400 mb-6">
            파일이 많아서 한 화면에 다 안 보일 때는 계속 아래로 내려가면 자동으로 스크롤됩니다.
          </p>

          <SectionHeading id="enter-exit" level={3}>폴더 열기와 뒤로 가기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            이것이 cokacdir에서 가장 많이 쓰는 동작입니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">안으로 들어가기</strong> — 폴더 위에서 누르면 그 폴더 안으로 이동합니다.
                파일 위에서 누르면 파일 내용을 볼 수 있습니다.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">밖으로 나가기</strong> — 현재 폴더의 상위 폴더(바깥 폴더)로 이동합니다.
              </span>
            </div>
          </div>

          <TipBox>
            Windows 파일 탐색기에서 폴더를 더블클릭해서 들어가고, 뒤로 버튼으로 나오는 것과 같습니다.
            다만 여기서는 <KeyBadge>Enter</KeyBadge> = 더블클릭,  <KeyBadge>Esc</KeyBadge> = 뒤로 가기입니다.
          </TipBox>

          <SectionHeading id="fast-move" level={3}>빠르게 이동하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            파일이 수백 개인 폴더에서 화살표로 하나씩 이동하면 느리겠죠? 빠른 이동 방법이 있습니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>PgUp</KeyBadge> <KeyBadge>PgDn</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">페이지 단위로 이동</strong> — 한 번에 10줄씩 위아래로 건너뜁니다.
                파일이 많을 때 유용합니다.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>Home</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">맨 위로</strong> — 파일 목록의 첫 번째 항목으로 한 번에 이동합니다.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>End</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">맨 아래로</strong> — 파일 목록의 마지막 항목으로 한 번에 이동합니다.
              </span>
            </div>
          </div>

          <SectionHeading id="jump-path" level={3}>특정 경로로 바로 이동하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            가고 싶은 폴더의 경로를 알고 있다면, 일일이 폴더를 하나씩 들어갈 필요 없이 바로 이동할 수 있습니다.
          </p>
          <StepByStep steps={[
            {
              title: '슬래시(/) 키를 누릅니다',
              description: '화면에 경로를 입력할 수 있는 입력창이 나타납니다.',
            },
            {
              title: '가고 싶은 경로를 입력합니다',
              description: (
                <span>
                  예를 들어 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/home/user/Downloads</code>처럼
                  전체 경로를 입력하세요.
                </span>
              ),
            },
            {
              title: 'Enter를 누릅니다',
              description: '해당 폴더로 바로 이동합니다. 폴더를 하나씩 열어가는 것보다 훨씬 빠릅니다.',
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>1</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">홈 폴더로 이동</strong> — 어디에 있든 홈 디렉토리(~)로 바로 갑니다.
                "길을 잃었다" 싶을 때 누르면 됩니다.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>2</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">새로고침</strong> — 현재 폴더의 파일 목록을 다시 불러옵니다.
                다른 프로그램에서 파일을 추가/삭제했을 때 유용합니다.
              </span>
            </div>
          </div>

          <TipBox>
            처음에는 <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge>와 <KeyBadge>Enter</KeyBadge><KeyBadge>Esc</KeyBadge>만
            사용하세요. 나머지 빠른 이동 키는 나중에 자연스럽게 쓰게 됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Navigation is the core of file browsing. Let's learn how to move freely between folders.
            Everything can be done with just your keyboard — no mouse needed.
          </p>

          <SectionHeading id="basic-move" level={3}>Moving Up and Down</SectionHeading>
          <p className="text-zinc-400 mb-4">
            The most basic action. Try moving through the file list with the arrow keys.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <KeyBadge>{'\u2191'}</KeyBadge>
              <span className="text-zinc-400">Move one line up</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">Move one line down</span>
            </div>
          </div>
          <p className="text-zinc-400 mb-6">
            When there are more files than fit on screen, the list scrolls automatically as you move down.
          </p>

          <SectionHeading id="enter-exit" level={3}>Opening Folders and Going Back</SectionHeading>
          <p className="text-zinc-400 mb-4">
            These are the most-used actions in cokacdir:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">Go in</strong> — Press on a folder to enter it.
                Press on a file to view its contents.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">Go back</strong> — Move to the parent folder (one level up).
              </span>
            </div>
          </div>

          <TipBox>
            It's just like double-clicking a folder in Windows File Explorer and clicking the back button.
            Here, <KeyBadge>Enter</KeyBadge> = double-click, <KeyBadge>Esc</KeyBadge> = back button.
          </TipBox>

          <SectionHeading id="fast-move" level={3}>Fast Movement</SectionHeading>
          <p className="text-zinc-400 mb-4">
            In folders with hundreds of files, moving one by one with arrows would be slow. Here are faster ways:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>PgUp</KeyBadge> <KeyBadge>PgDn</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">Page jump</strong> — Skip 10 lines at a time.
                Useful when there are many files.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>Home</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">Jump to top</strong> — Go to the first item in the file list.
              </span>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0"><KeyBadge>End</KeyBadge></div>
              <span className="text-zinc-400">
                <strong className="text-white">Jump to bottom</strong> — Go to the last item in the file list.
              </span>
            </div>
          </div>

          <SectionHeading id="jump-path" level={3}>Jump to a Specific Path</SectionHeading>
          <p className="text-zinc-400 mb-4">
            If you know the path of the folder you want, you can go there directly without navigating folder by folder.
          </p>
          <StepByStep steps={[
            {
              title: 'Press the slash (/) key',
              description: 'A path input field appears on screen.',
            },
            {
              title: 'Type the path you want to go to',
              description: (
                <span>
                  For example, type the full path like <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/home/user/Downloads</code>.
                </span>
              ),
            },
            {
              title: 'Press Enter',
              description: 'You\'ll jump directly to that folder. Much faster than opening folders one by one.',
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>1</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">Go to home folder</strong> — Jump to your home directory (~) from anywhere.
                Press this when you feel "lost".
              </span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>2</KeyBadge>
              <span className="text-zinc-400">
                <strong className="text-white">Refresh</strong> — Reload the current folder's file list.
                Useful when files were added/deleted by another program.
              </span>
            </div>
          </div>

          <TipBox>
            Start with just <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> and <KeyBadge>Enter</KeyBadge><KeyBadge>Esc</KeyBadge>.
            The other fast-move keys will come naturally later.
          </TipBox>
        </>
      )}
    </section>
  )
}
