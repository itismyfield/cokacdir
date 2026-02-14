import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function DiffCompare() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="diff-compare">{t('Comparing Folders/Files (Diff)', '폴더/파일 비교하기 (Diff)')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            "이 두 폴더에 어떤 차이가 있지?", "파일이 바뀐 부분이 어디지?"
            — 이런 질문에 답해주는 것이 비교(Diff) 기능입니다.
            두 폴더의 내용물을 나란히 비교하고, 어떤 파일이 추가/삭제/수정되었는지 한눈에 볼 수 있습니다.
          </p>

          <SectionHeading id="folder-diff" level={3}>두 폴더 비교하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            예를 들어, "프로젝트 폴더"와 "백업 폴더" 사이에 뭐가 다른지 확인하고 싶은 상황입니다.
          </p>
          <StepByStep steps={[
            {
              title: '두 개의 패널을 엽니다',
              description: (
                <span>
                  <KeyBadge>0</KeyBadge>을 눌러 패널을 추가하고, 각 패널에서 비교하고 싶은 폴더로 이동합니다.
                  예: 왼쪽 = "프로젝트 폴더", 오른쪽 = "백업 폴더"
                </span>
              ),
            },
            {
              title: '8을 눌러 비교를 시작합니다',
              description: (
                <span>
                  <KeyBadge>8</KeyBadge>을 누르면 두 패널의 폴더를 분석해서 비교 결과 화면이 나타납니다.
                </span>
              ),
            },
            {
              title: '비교 결과를 확인합니다',
              description: (
                <div>
                  <p className="mb-2">각 파일 옆에 색상으로 상태가 표시됩니다:</p>
                  <div className="space-y-1.5 ml-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-yellow-400/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-yellow-400">노란색</strong> — 양쪽 다 있지만 내용이 다른 파일 (수정됨)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-accent-green/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-accent-green">초록색</strong> — 왼쪽에만 있는 파일</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-light/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-primary-light">파란색</strong> — 오른쪽에만 있는 파일</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: '파일별 상세 차이를 봅니다',
              description: (
                <span>
                  수정된(노란색) 파일에 커서를 놓고 <KeyBadge>Enter</KeyBadge>를 누르면
                  그 파일 안에서 정확히 어떤 줄이 바뀌었는지 보여줍니다.
                  추가된 줄은 초록색으로, 삭제된 줄은 빨간색으로 표시됩니다.
                </span>
              ),
            },
            {
              title: '비교를 종료합니다',
              description: (
                <span><KeyBadge>Esc</KeyBadge>를 누르면 일반 파일 목록으로 돌아갑니다.</span>
              ),
            },
          ]} />

          <SectionHeading id="diff-controls" level={3}>비교 화면에서 쓸 수 있는 기능</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>F</KeyBadge>
                <span className="text-white font-semibold">필터 전환</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>F</KeyBadge>를 반복해서 누르면 보기 모드가 바뀝니다:
                "전체 보기" → "다른 파일만" → "왼쪽에만 있는 파일" → "오른쪽에만 있는 파일".
                차이점만 빠르게 확인하고 싶을 때 "다른 파일만" 모드가 유용합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>E</KeyBadge> / <KeyBadge>C</KeyBadge>
                <span className="text-white font-semibold">폴더 펼치기/접기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>E</KeyBadge>를 누르면 모든 하위 폴더가 펼쳐져서 전체 구조를 볼 수 있고,
                <KeyBadge>C</KeyBadge>를 누르면 다시 접힙니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>n</KeyBadge> / <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">변경 부분 사이 이동 (파일 상세 보기에서)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                파일 내용 비교 화면에서 <KeyBadge>n</KeyBadge>을 누르면 다음 변경된 부분으로,
                <KeyBadge>N</KeyBadge>을 누르면 이전 변경된 부분으로 바로 이동합니다.
                긴 파일에서 바뀐 곳만 빠르게 확인할 때 유용합니다.
              </p>
            </div>
          </div>

          <TipBox>
            비교 기능은 프로그래머뿐 아니라 일반 사용자에게도 유용합니다.
            예를 들어 "USB에 백업한 폴더와 원본 폴더에 차이가 있는지" 확인할 때 쓸 수 있습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            "What's different between these two folders?" or "Which parts of this file changed?"
            — The Diff feature answers these questions.
            It compares the contents of two folders side by side, showing which files were added, deleted, or modified.
          </p>

          <SectionHeading id="folder-diff" level={3}>Comparing Two Folders</SectionHeading>
          <p className="text-zinc-400 mb-4">
            For example, you want to check what's different between your "Project" folder and your "Backup" folder.
          </p>
          <StepByStep steps={[
            {
              title: 'Open two panels',
              description: (
                <span>
                  Press <KeyBadge>0</KeyBadge> to add a panel, then navigate to the folders you want to compare.
                  Example: left = "Project folder", right = "Backup folder"
                </span>
              ),
            },
            {
              title: 'Press 8 to start the comparison',
              description: (
                <span>
                  Press <KeyBadge>8</KeyBadge> to analyze both folders and show the comparison results.
                </span>
              ),
            },
            {
              title: 'Review the results',
              description: (
                <div>
                  <p className="mb-2">Each file is color-coded by status:</p>
                  <div className="space-y-1.5 ml-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-yellow-400/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-yellow-400">Yellow</strong> — File exists in both but contents differ (modified)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-accent-green/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-accent-green">Green</strong> — File exists only on the left side</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary-light/60 flex-shrink-0" />
                      <span className="text-zinc-400 text-sm"><strong className="text-primary-light">Blue</strong> — File exists only on the right side</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'View detailed file differences',
              description: (
                <span>
                  Place cursor on a modified (yellow) file and press <KeyBadge>Enter</KeyBadge> to see
                  exactly which lines changed within that file.
                  Added lines appear in green, deleted lines in red.
                </span>
              ),
            },
            {
              title: 'Exit the comparison',
              description: (
                <span>Press <KeyBadge>Esc</KeyBadge> to return to the normal file list.</span>
              ),
            },
          ]} />

          <SectionHeading id="diff-controls" level={3}>Diff View Controls</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>F</KeyBadge>
                <span className="text-white font-semibold">Toggle Filter</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>F</KeyBadge> repeatedly to cycle through view modes:
                "All files" → "Different files only" → "Left-only files" → "Right-only files".
                The "Different only" mode is great for quickly spotting changes.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>E</KeyBadge> / <KeyBadge>C</KeyBadge>
                <span className="text-white font-semibold">Expand / Collapse Folders</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>E</KeyBadge> to expand all subfolders and see the full tree structure,
                <KeyBadge>C</KeyBadge> to collapse them back.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>n</KeyBadge> / <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">Jump Between Changes (in file detail view)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                In the file content comparison view, press <KeyBadge>n</KeyBadge> to jump to the next change,
                <KeyBadge>N</KeyBadge> to jump to the previous one.
                Useful for quickly reviewing changes in long files.
              </p>
            </div>
          </div>

          <TipBox>
            The diff feature is useful for everyone, not just programmers.
            For example, you can check if your USB backup folder matches the original.
          </TipBox>
        </>
      )}
    </section>
  )
}
