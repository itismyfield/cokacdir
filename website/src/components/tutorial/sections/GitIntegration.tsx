import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function GitIntegration() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="git-integration">{t('Git Features', 'Git 기능')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Git은 프로그래머들이 코드의 변경 이력을 관리하는 도구입니다.
            Git을 사용 중이라면, cokacdir에서 바로 커밋 기록을 보고 브랜치를 확인할 수 있습니다.
          </p>

          <TipBox variant="note">
            Git을 사용하지 않는다면 이 섹션은 건너뛰어도 됩니다.
            Git은 주로 프로그래머들이 사용하는 도구입니다.
          </TipBox>

          <SectionHeading id="git-open" level={3}>Git 화면 열기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Git으로 관리되는 폴더(저장소) 안에서 <KeyBadge>G</KeyBadge>를 누르면 Git 화면이 열립니다.
            Git 저장소가 아닌 폴더에서는 동작하지 않습니다.
          </p>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>G</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Git 화면 열기</strong> — 커밋 기록, 브랜치, 스태시를 볼 수 있습니다</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>7</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Git 로그 비교</strong> — 두 커밋 사이의 차이를 비교합니다</span>
            </div>
          </div>

          <SectionHeading id="git-tabs" level={3}>Git 화면 구성</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Git 화면은 3개의 탭으로 나뉘어 있습니다. 숫자 키 또는 좌우 화살표로 탭을 전환할 수 있습니다:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>1</KeyBadge>
                <span className="text-white font-semibold">커밋 (Commit)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                현재 작업 상태를 보여줍니다. 수정된 파일, 스테이징된 파일을 확인하고 커밋을 만들 수 있습니다.
                <KeyBadge>Tab</KeyBadge>을 누르면 파일 목록과 커밋 메시지 입력 사이를 전환할 수 있습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>2</KeyBadge>
                <span className="text-white font-semibold">로그 (Log)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                지금까지의 커밋 기록을 시간순으로 보여줍니다.
                "누가, 언제, 무엇을 변경했는지" 확인할 수 있습니다.
                커밋을 선택하고 <KeyBadge>Enter</KeyBadge>를 누르면 해당 커밋에서 변경된 내용을 상세히 볼 수 있습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>3</KeyBadge>
                <span className="text-white font-semibold">브랜치 (Branch)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                현재 저장소의 모든 브랜치를 보여줍니다.
                브랜치는 "작업 분기"로, 같은 프로젝트에서 여러 버전을 동시에 관리할 때 사용합니다.
                브랜치를 선택하고 <KeyBadge>Enter</KeyBadge>를 누르면 해당 브랜치로 체크아웃할 수 있습니다.
              </p>
            </div>
          </div>

          <SectionHeading id="git-controls" level={3}>Git 화면에서 쓸 수 있는 키</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">목록에서 위아래로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Tab</KeyBadge>
              <span className="text-zinc-400">커밋 정보와 파일 목록 사이 전환</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>A</KeyBadge>
              <span className="text-zinc-400">액션 메뉴 열기 (추가 동작)</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">상세 보기 / 확인</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">Git 화면 닫기</span>
            </div>
          </div>

          <TipBox>
            Git 화면은 커밋 로그를 빠르게 훑어보거나, 특정 커밋에서 어떤 파일이 변경되었는지
            확인할 때 가장 유용합니다. 복잡한 Git 작업은 터미널에서 직접 하는 것을 추천합니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Git is a version control tool used by developers to track code changes.
            If you use Git, cokacdir lets you view commit history and browse branches directly.
          </p>

          <TipBox variant="note">
            If you don't use Git, feel free to skip this section.
            Git is primarily a tool for programmers.
          </TipBox>

          <SectionHeading id="git-open" level={3}>Opening the Git View</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Press <KeyBadge>G</KeyBadge> inside a Git-managed folder (repository) to open the Git view.
            This won't work in non-Git folders.
          </p>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>G</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Open Git view</strong> — Browse commits, branches, and stashes</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>7</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Git log compare</strong> — Compare differences between two commits</span>
            </div>
          </div>

          <SectionHeading id="git-tabs" level={3}>Git View Layout</SectionHeading>
          <p className="text-zinc-400 mb-4">
            The Git view has 3 tabs. Switch between them with number keys or left/right arrows:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>1</KeyBadge>
                <span className="text-white font-semibold">Commit</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Shows the current working state. View modified files, staged files, and create commits.
                Press <KeyBadge>Tab</KeyBadge> to switch between the file list and the commit message input.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>2</KeyBadge>
                <span className="text-white font-semibold">Log</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Shows the commit history in chronological order.
                See "who changed what, and when".
                Select a commit and press <KeyBadge>Enter</KeyBadge> to view the detailed changes in that commit.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>3</KeyBadge>
                <span className="text-white font-semibold">Branch</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Shows all branches in the repository.
                Branches are "work forks" used to manage multiple versions of the same project simultaneously.
                Select a branch and press <KeyBadge>Enter</KeyBadge> to check it out.
              </p>
            </div>
          </div>

          <SectionHeading id="git-controls" level={3}>Git View Controls</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">Move up/down in the list</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Tab</KeyBadge>
              <span className="text-zinc-400">Switch between commit info and file list</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>A</KeyBadge>
              <span className="text-zinc-400">Open action menu</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">View details / confirm</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">Close Git view</span>
            </div>
          </div>

          <TipBox>
            The Git view is most useful for quickly browsing commit logs or checking which files
            were changed in a specific commit. For complex Git operations, we recommend using the terminal directly.
          </TipBox>
        </>
      )}
    </section>
  )
}
