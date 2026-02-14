import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function DiffCompare() {
  const { lang, t } = useLanguage()

  const statusLegend = (
    <div className="space-y-1.5 ml-2">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm">
          <strong className="text-white">{t('Modified', '수정됨')}</strong>
          {t(' — File exists in both but contents differ', ' — 양쪽 다 있지만 내용이 다른 파일')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm">
          <strong className="text-white">{t('Left Only', '왼쪽에만 존재')}</strong>
          {t(' — File exists only on the left side', ' — 왼쪽에만 있는 파일')}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 text-sm">
          <strong className="text-white">{t('Right Only', '오른쪽에만 존재')}</strong>
          {t(' — File exists only on the right side', ' — 오른쪽에만 있는 파일')}
        </span>
      </div>
    </div>
  )

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

          <p className="text-zinc-400 mb-8 leading-relaxed">
            비교를 시작하는 방법은 <strong className="text-white">3가지</strong>가 있습니다.
            상황에 따라 가장 편리한 방법을 선택하세요.
          </p>

          {/* ========== 방법 1: 같은 패널에서 폴더 2개 선택 ========== */}
          <SectionHeading id="diff-select-two" level={3}>방법 1: 폴더 2개를 선택한 뒤 비교</SectionHeading>
          <p className="text-zinc-400 mb-4">
            같은 폴더 안에 비교하고 싶은 두 폴더가 나란히 있을 때 가장 빠른 방법입니다.
            패널을 여러 개 열 필요 없이, 현재 패널에서 바로 비교할 수 있습니다.
          </p>
          <StepByStep steps={[
            {
              title: '비교할 폴더 2개를 선택합니다',
              description: (
                <span>
                  비교하고 싶은 폴더에 커서를 놓고 <KeyBadge>Space</KeyBadge>를 눌러 선택합니다.
                  이렇게 정확히 <strong className="text-white">2개의 폴더</strong>를 선택하세요.
                  예: "v1.0" 폴더와 "v2.0" 폴더를 선택
                </span>
              ),
            },
            {
              title: '8을 눌러 비교를 시작합니다',
              description: (
                <span>
                  <KeyBadge>8</KeyBadge>을 누르면 선택된 두 폴더를 즉시 비교합니다.
                  별도의 선택 과정 없이 바로 비교 화면으로 들어갑니다.
                </span>
              ),
            },
            {
              title: '비교 결과를 확인합니다',
              description: (
                <div>
                  <p className="mb-2">각 파일 옆에 상태가 표시됩니다:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox>
            이 방법은 <strong>우선순위가 가장 높습니다.</strong> 패널이 몇 개 열려 있든 상관없이,
            현재 패널에서 폴더 2개가 선택되어 있으면 이 방법이 적용됩니다.
            선택은 비교 시작 후 자동으로 해제됩니다.
          </TipBox>

          {/* ========== 방법 2: 패널 2개 ========== */}
          <SectionHeading id="diff-two-panels" level={3}>방법 2: 패널 2개로 비교</SectionHeading>
          <p className="text-zinc-400 mb-4">
            두 개의 패널을 나란히 열어두고, 각각 비교하고 싶은 폴더로 이동한 뒤 비교하는 방법입니다.
            예를 들어 "프로젝트 폴더"와 "백업 폴더"가 서로 다른 경로에 있을 때 유용합니다.
          </p>
          <StepByStep steps={[
            {
              title: '패널 2개를 엽니다',
              description: (
                <span>
                  <KeyBadge>0</KeyBadge>을 눌러 패널을 추가합니다.
                  화면에 패널이 정확히 2개가 되도록 합니다.
                </span>
              ),
            },
            {
              title: '각 패널에서 비교할 폴더로 이동합니다',
              description: (
                <span>
                  <KeyBadge>Tab</KeyBadge>으로 패널 간 이동하면서, 각 패널에서 비교하고 싶은 폴더를 엽니다.
                  예: 왼쪽 패널 = "프로젝트 폴더", 오른쪽 패널 = "백업 폴더"
                </span>
              ),
            },
            {
              title: '8을 눌러 비교를 시작합니다',
              description: (
                <span>
                  <KeyBadge>8</KeyBadge>을 누르면 왼쪽 패널의 폴더와 오른쪽 패널의 폴더를 자동으로 비교합니다.
                  별도의 선택 없이 바로 비교 화면이 열립니다.
                </span>
              ),
            },
            {
              title: '비교 결과를 확인합니다',
              description: (
                <div>
                  <p className="mb-2">각 파일 옆에 상태가 표시됩니다:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox>
            패널이 정확히 2개일 때만 이 방법이 자동으로 적용됩니다.
            어떤 패널이 활성화되어 있든 상관없이, 항상 첫 번째(왼쪽) 패널과 두 번째(오른쪽) 패널을 비교합니다.
          </TipBox>

          {/* ========== 방법 3: 패널 3개 이상 ========== */}
          <SectionHeading id="diff-multi-panels" level={3}>방법 3: 패널 3개 이상에서 선택 비교</SectionHeading>
          <p className="text-zinc-400 mb-4">
            패널이 3개 이상 열려 있을 때는, 어떤 패널끼리 비교할지 직접 선택해야 합니다.
            <KeyBadge>8</KeyBadge>을 <strong className="text-white">두 번</strong> 눌러서 비교할 패널을 하나씩 지정합니다.
          </p>
          <StepByStep steps={[
            {
              title: '첫 번째 패널을 선택합니다',
              description: (
                <span>
                  비교의 "왼쪽"이 될 패널로 이동한 뒤 <KeyBadge>8</KeyBadge>을 누릅니다.
                  화면 하단에 <em className="text-accent-cyan">"Select second panel for diff (8) or ESC to cancel"</em> 메시지가 표시되고,
                  선택된 패널의 테두리 색이 바뀌어 시각적으로 표시됩니다.
                </span>
              ),
            },
            {
              title: '두 번째 패널을 선택합니다',
              description: (
                <span>
                  <KeyBadge>Tab</KeyBadge>으로 비교의 "오른쪽"이 될 패널로 이동한 뒤,
                  다시 <KeyBadge>8</KeyBadge>을 누릅니다.
                  두 패널의 폴더가 즉시 비교됩니다.
                </span>
              ),
            },
            {
              title: '비교 결과를 확인합니다',
              description: (
                <div>
                  <p className="mb-2">각 파일 옆에 상태가 표시됩니다:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox variant="note" title="취소하기">
            첫 번째 패널을 선택한 후 마음이 바뀌었다면, <KeyBadge>Esc</KeyBadge>를 눌러 선택을 취소할 수 있습니다.
            같은 패널을 두 번 선택하면 "Select a different panel for diff" 메시지가 나타나며,
            다른 패널을 선택해야 합니다.
          </TipBox>

          {/* ========== 비교 결과 보기 ========== */}
          <SectionHeading id="diff-result-view" level={3}>비교 결과 보기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            어떤 방법으로 비교를 시작했든, 비교 화면에서의 조작 방법은 동일합니다.
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Enter</KeyBadge>
                <span className="text-white font-semibold">파일 내용 비교 보기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                수정된 파일에 커서를 놓고 <KeyBadge>Enter</KeyBadge>를 누르면,
                파일 내용에서 정확히 어떤 줄이 바뀌었는지 보여줍니다.
                추가된 줄과 삭제된 줄이 각각 다른 색으로 구분되어 표시됩니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">비교 종료</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>Esc</KeyBadge>를 누르면 비교 화면을 닫고 일반 파일 목록으로 돌아갑니다.
                파일 내용 비교 중이었다면, 먼저 폴더 비교 목록으로 돌아간 뒤 한 번 더 누르면 종료됩니다.
              </p>
            </div>
          </div>

          {/* ========== 비교 화면 조작 ========== */}
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
                개별 폴더는 <KeyBadge>→</KeyBadge>로 펼치고 <KeyBadge>←</KeyBadge>로 접을 수 있습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>n</KeyBadge> / <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">변경 부분 사이 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                폴더 비교 목록에서: 다음/이전 변경된 항목으로 바로 이동합니다.
                파일 내용 비교에서: 다음/이전 변경된 줄로 바로 이동합니다.
                긴 목록이나 긴 파일에서 바뀐 곳만 빠르게 확인할 때 유용합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1">
                  <KeyBadge>n</KeyBadge><KeyBadge>N</KeyBadge>
                  <KeyBadge>s</KeyBadge><KeyBadge>S</KeyBadge>
                  <KeyBadge>d</KeyBadge><KeyBadge>D</KeyBadge>
                  <KeyBadge>y</KeyBadge><KeyBadge>Y</KeyBadge>
                </span>
                <span className="text-white font-semibold">정렬</span>
              </div>
              <p className="text-zinc-400 text-sm">
                비교 목록을 이름(n/N), 크기(s/S), 수정 날짜(d/D), 종류(y/Y) 순으로 정렬할 수 있습니다.
                대문자는 역순 정렬입니다.
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

          <p className="text-zinc-400 mb-8 leading-relaxed">
            There are <strong className="text-white">3 ways</strong> to start a comparison.
            Choose whichever is most convenient for your situation.
          </p>

          {/* ========== Method 1: Select two folders in same panel ========== */}
          <SectionHeading id="diff-select-two" level={3}>Method 1: Select Two Folders, Then Compare</SectionHeading>
          <p className="text-zinc-400 mb-4">
            The quickest method when the two folders you want to compare are in the same directory.
            No need to open multiple panels — just select and compare right from the current panel.
          </p>
          <StepByStep steps={[
            {
              title: 'Select exactly 2 folders',
              description: (
                <span>
                  Navigate to each folder and press <KeyBadge>Space</KeyBadge> to select it.
                  Select exactly <strong className="text-white">2 folders</strong>.
                  Example: Select the "v1.0" folder and the "v2.0" folder.
                </span>
              ),
            },
            {
              title: 'Press 8 to start the comparison',
              description: (
                <span>
                  Press <KeyBadge>8</KeyBadge> and the two selected folders will be compared immediately.
                  No additional steps needed — the diff screen opens right away.
                </span>
              ),
            },
            {
              title: 'Review the results',
              description: (
                <div>
                  <p className="mb-2">Each file shows its status:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox>
            This method has the <strong>highest priority.</strong> Regardless of how many panels are open,
            if 2 folders are selected in the current panel, this method is used.
            The selection is automatically cleared after entering the diff screen.
          </TipBox>

          {/* ========== Method 2: Two panels ========== */}
          <SectionHeading id="diff-two-panels" level={3}>Method 2: Two Panels Side by Side</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Open two panels, navigate each to a different folder, then compare.
            Ideal when the folders you want to compare are in different locations —
            for example, a "Project" folder and a "Backup" folder.
          </p>
          <StepByStep steps={[
            {
              title: 'Open two panels',
              description: (
                <span>
                  Press <KeyBadge>0</KeyBadge> to add a panel.
                  Make sure you have exactly 2 panels on screen.
                </span>
              ),
            },
            {
              title: 'Navigate each panel to the target folder',
              description: (
                <span>
                  Use <KeyBadge>Tab</KeyBadge> to switch between panels and navigate each one to the folder you want to compare.
                  Example: left panel = "Project folder", right panel = "Backup folder"
                </span>
              ),
            },
            {
              title: 'Press 8 to start the comparison',
              description: (
                <span>
                  Press <KeyBadge>8</KeyBadge> and the left panel's folder will be compared with the right panel's folder automatically.
                  No selection needed — the diff screen opens immediately.
                </span>
              ),
            },
            {
              title: 'Review the results',
              description: (
                <div>
                  <p className="mb-2">Each file shows its status:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox>
            This method only activates when you have exactly 2 panels.
            It doesn't matter which panel is active — it always compares the first (left) panel with the second (right) panel.
          </TipBox>

          {/* ========== Method 3: 3+ panels ========== */}
          <SectionHeading id="diff-multi-panels" level={3}>Method 3: Multi-Panel Selection</SectionHeading>
          <p className="text-zinc-400 mb-4">
            When 3 or more panels are open, you need to choose which two panels to compare.
            Press <KeyBadge>8</KeyBadge> <strong className="text-white">twice</strong> — once on each panel you want to compare.
          </p>
          <StepByStep steps={[
            {
              title: 'Select the first panel',
              description: (
                <span>
                  Navigate to the panel that will be the "left side" of the comparison, then press <KeyBadge>8</KeyBadge>.
                  A message <em className="text-accent-cyan">"Select second panel for diff (8) or ESC to cancel"</em> appears at the bottom,
                  and the selected panel's border changes color to indicate it's been chosen.
                </span>
              ),
            },
            {
              title: 'Select the second panel',
              description: (
                <span>
                  Press <KeyBadge>Tab</KeyBadge> to move to the panel that will be the "right side",
                  then press <KeyBadge>8</KeyBadge> again.
                  The two panels' folders are compared immediately.
                </span>
              ),
            },
            {
              title: 'Review the results',
              description: (
                <div>
                  <p className="mb-2">Each file shows its status:</p>
                  {statusLegend}
                </div>
              ),
            },
          ]} />

          <TipBox variant="note" title="Cancelling">
            If you change your mind after selecting the first panel, press <KeyBadge>Esc</KeyBadge> to cancel.
            If you accidentally select the same panel twice, you'll see a "Select a different panel for diff" message
            and need to choose a different panel.
          </TipBox>

          {/* ========== Viewing results ========== */}
          <SectionHeading id="diff-result-view" level={3}>Viewing Diff Results</SectionHeading>
          <p className="text-zinc-400 mb-4">
            No matter which method you used to start the comparison, the diff screen works the same way.
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Enter</KeyBadge>
                <span className="text-white font-semibold">View File Content Diff</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Place cursor on a modified file and press <KeyBadge>Enter</KeyBadge> to see
                exactly which lines changed within that file.
                Added and deleted lines are each highlighted in distinct colors.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">Exit Comparison</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>Esc</KeyBadge> to close the diff screen and return to the normal file list.
                If you're viewing a file content diff, the first Esc returns to the folder comparison list,
                and a second Esc exits the diff entirely.
              </p>
            </div>
          </div>

          {/* ========== Diff controls ========== */}
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
                Individual folders can be expanded with <KeyBadge>→</KeyBadge> and collapsed with <KeyBadge>←</KeyBadge>.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>n</KeyBadge> / <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">Jump Between Changes</span>
              </div>
              <p className="text-zinc-400 text-sm">
                In folder comparison list: jump to the next/previous changed item.
                In file content diff: jump to the next/previous changed line.
                Useful for quickly reviewing changes in long lists or files.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1">
                  <KeyBadge>n</KeyBadge><KeyBadge>N</KeyBadge>
                  <KeyBadge>s</KeyBadge><KeyBadge>S</KeyBadge>
                  <KeyBadge>d</KeyBadge><KeyBadge>D</KeyBadge>
                  <KeyBadge>y</KeyBadge><KeyBadge>Y</KeyBadge>
                </span>
                <span className="text-white font-semibold">Sorting</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sort the comparison list by name (n/N), size (s/S), modified date (d/D), or type (y/Y).
                Uppercase letters sort in reverse order.
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
