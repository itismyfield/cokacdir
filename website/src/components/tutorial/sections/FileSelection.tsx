import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function FileSelection() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="file-selection">{t('Selecting Files', '파일 선택하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            파일을 복사하거나 삭제하려면 먼저 "어떤 파일을?" 정해야 합니다.
            cokacdir에서는 파일을 하나씩 또는 여러 개를 한꺼번에 선택할 수 있습니다.
            Windows에서 파일을 클릭해서 체크하는 것과 비슷한 개념입니다.
          </p>

          <SectionHeading id="select-one" level={3}>파일 하나 선택하기</SectionHeading>
          <StepByStep steps={[
            {
              title: '선택하고 싶은 파일로 커서를 이동합니다',
              description: (
                <span><KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> 화살표로 원하는 파일 위에 커서를 놓으세요.</span>
              ),
            },
            {
              title: 'Space(스페이스 바)를 누릅니다',
              description: (
                <span>
                  <KeyBadge>Space</KeyBadge>를 누르면 해당 파일이 "선택"됩니다.
                  선택된 파일은 색상이 바뀌어 표시됩니다.
                  다시 <KeyBadge>Space</KeyBadge>를 누르면 선택이 해제됩니다.
                </span>
              ),
            },
            {
              title: '다른 파일도 선택할 수 있습니다',
              description: '커서를 다른 파일로 옮기고 Space를 또 누르면 여러 파일을 동시에 선택할 수 있습니다. 선택한 파일 수가 하단에 표시됩니다.',
            },
          ]} />

          <SectionHeading id="select-many" level={3}>여러 파일 한번에 선택하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            파일이 수십 개인데 하나씩 Space를 누르기 힘들 때 유용한 방법들입니다:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+A</KeyBadge>
                <span className="text-white font-semibold">전체 선택</span>
              </div>
              <p className="text-zinc-400 text-sm">
                현재 폴더의 모든 파일을 한 번에 선택합니다.
                "이 폴더의 파일 전부 복사하고 싶다"할 때 유용합니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>*</KeyBadge>
                <span className="text-white font-semibold">선택 반전</span>
              </div>
              <p className="text-zinc-400 text-sm">
                선택된 파일은 해제하고, 선택 안 된 파일은 선택합니다.
                예를 들어, 대부분을 선택하고 몇 개만 빼고 싶을 때:
                먼저 빼고 싶은 것만 Space로 선택한 뒤 <KeyBadge>*</KeyBadge>를 누르면 나머지가 선택됩니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>;</KeyBadge>
                <span className="text-white font-semibold">확장자로 선택</span>
              </div>
              <p className="text-zinc-400 text-sm">
                같은 종류의 파일만 골라서 선택합니다.
                예를 들어, <KeyBadge>;</KeyBadge>를 누르면 현재 커서가 있는 파일과 같은 확장자(.jpg, .txt 등)의
                파일이 모두 선택됩니다. "사진 파일만 전부 선택"할 때 아주 편리합니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift</KeyBadge>+<KeyBadge>{'\u2191'}</KeyBadge>/<KeyBadge>{'\u2193'}</KeyBadge>
                <span className="text-white font-semibold">이동하면서 선택</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Shift를 누른 채로 위아래 화살표를 누르면 지나가는 파일이 자동으로 선택됩니다.
                연속된 파일 여러 개를 빠르게 선택할 때 유용합니다.
              </p>
            </div>
          </div>

          <TipBox>
            선택한 파일은 색상이 바뀌어 표시되고, 하단 상태바에 "N개 선택됨" 같은 정보가 나타납니다.
            선택한 상태에서 복사, 이동, 삭제 등의 작업을 하면 선택된 파일 전체에 적용됩니다.
          </TipBox>

          <TipBox variant="note">
            각 패널의 선택은 독립적입니다. 왼쪽 패널에서 파일을 선택하고 오른쪽 패널로 이동해도,
            왼쪽의 선택은 그대로 유지됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Before you can copy or delete files, you need to decide "which files?".
            In cokacdir, you can select files one by one or multiple at once.
            It's similar to clicking checkboxes on files in Windows.
          </p>

          <SectionHeading id="select-one" level={3}>Selecting a Single File</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Move the cursor to the file you want to select',
              description: (
                <span>Use <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> arrows to position the cursor on the desired file.</span>
              ),
            },
            {
              title: 'Press Space',
              description: (
                <span>
                  Press <KeyBadge>Space</KeyBadge> to "select" the file.
                  Selected files are shown with a different color.
                  Press <KeyBadge>Space</KeyBadge> again to deselect.
                </span>
              ),
            },
            {
              title: 'Select additional files',
              description: 'Move the cursor to another file and press Space again to select multiple files. The number of selected files is shown in the status bar.',
            },
          ]} />

          <SectionHeading id="select-many" level={3}>Selecting Multiple Files at Once</SectionHeading>
          <p className="text-zinc-400 mb-4">
            When there are dozens of files, pressing Space one by one is tedious. Here are faster methods:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+A</KeyBadge>
                <span className="text-white font-semibold">Select All</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Select all files in the current folder at once.
                Useful when you want to "copy everything in this folder".
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>*</KeyBadge>
                <span className="text-white font-semibold">Invert Selection</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Deselects selected files and selects unselected ones.
                For example, to select most files except a few:
                first select the ones you want to exclude with Space, then press <KeyBadge>*</KeyBadge> to invert.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>;</KeyBadge>
                <span className="text-white font-semibold">Select by Extension</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Select only files of the same type.
                Press <KeyBadge>;</KeyBadge> to select all files with the same extension (.jpg, .txt, etc.)
                as the file under the cursor. Very handy for "select all photos".
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift</KeyBadge>+<KeyBadge>{'\u2191'}</KeyBadge>/<KeyBadge>{'\u2193'}</KeyBadge>
                <span className="text-white font-semibold">Select While Moving</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Hold Shift and press up/down arrows to automatically select files as you move through them.
                Useful for quickly selecting a range of consecutive files.
              </p>
            </div>
          </div>

          <TipBox>
            Selected files are highlighted and the status bar shows "N selected".
            When you perform actions like copy, move, or delete, they apply to all selected files.
          </TipBox>

          <TipBox variant="note">
            Each panel's selection is independent. If you select files in the left panel and switch to the right panel,
            the left panel's selection is preserved.
          </TipBox>
        </>
      )}
    </section>
  )
}
