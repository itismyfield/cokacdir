import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function PanelSystem() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="panel-system">{t('Panel System (Split View)', '패널 시스템 (화면 나누기)')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            파일을 다른 폴더로 복사하거나 옮기려면, 두 폴더를 동시에 볼 수 있으면 편리하겠죠?
            cokacdir에서는 화면을 여러 개의 "패널"로 나눌 수 있습니다. 각 패널은 독립적인 파일 탐색기처럼
            작동해서, 왼쪽에서는 사진 폴더를, 오른쪽에서는 백업 폴더를 보는 식으로 사용할 수 있습니다.
          </p>

          <SectionHeading id="panel-create" level={3}>패널 추가하고 닫기</SectionHeading>
          <StepByStep steps={[
            {
              title: '0을 눌러서 새 패널을 만듭니다',
              description: (
                <span>
                  <KeyBadge>0</KeyBadge>을 누르면 화면이 좌우로 나뉘면서 오른쪽에 새 패널이 나타납니다.
                  두 패널 모두 같은 폴더를 보여주고 있을 겁니다.
                </span>
              ),
            },
            {
              title: '패널 사이를 이동합니다',
              description: (
                <span>
                  <KeyBadge>Tab</KeyBadge>을 누르면 다음 패널로 이동합니다. 또는 <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge> 좌우 화살표로도
                  패널을 전환할 수 있습니다. 현재 활성화된 패널의 헤더가 강조 표시됩니다.
                </span>
              ),
            },
            {
              title: '각 패널에서 다른 폴더로 이동합니다',
              description: '오른쪽 패널에서 원하는 폴더로 이동하세요. 왼쪽 패널은 그대로 있습니다. 이제 두 개의 다른 폴더를 동시에 볼 수 있습니다.',
            },
            {
              title: '필요 없는 패널은 닫습니다',
              description: (
                <span>
                  <KeyBadge>9</KeyBadge>를 누르면 현재 활성화된 패널이 닫힙니다.
                  패널이 하나만 남으면 전체 화면으로 돌아갑니다.
                </span>
              ),
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-2 bg-bg-elevated border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              패널 관련 키 요약
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <KeyBadge>0</KeyBadge>
                <span className="text-zinc-400">새 패널 추가 (화면 나누기)</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>9</KeyBadge>
                <span className="text-zinc-400">현재 패널 닫기</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>Tab</KeyBadge>
                <span className="text-zinc-400">다음 패널로 전환</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge>
                <span className="text-zinc-400">좌우 패널 전환</span>
              </div>
            </div>
          </div>

          <SectionHeading id="panel-workflow" level={3}>실전 예시: 패널로 파일 복사하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            "Downloads 폴더에 있는 파일을 Documents 폴더로 복사하고 싶다"는 상황을 가정해봅시다.
          </p>
          <StepByStep steps={[
            {
              title: 'Downloads 폴더로 이동합니다',
              description: '첫 번째 패널에서 Downloads 폴더로 들어갑니다.',
            },
            {
              title: '0을 눌러 두 번째 패널을 엽니다',
              description: '화면이 둘로 나뉩니다. 오른쪽 패널에 자동으로 포커스가 갑니다.',
            },
            {
              title: '오른쪽 패널에서 Documents 폴더로 이동합니다',
              description: '오른쪽 패널에서 Esc로 상위 폴더로 나간 뒤, Documents 폴더로 들어갑니다.',
            },
            {
              title: 'Tab 또는 왼쪽 화살표로 왼쪽 패널로 돌아갑니다',
              description: '왼쪽 패널(Downloads)로 다시 이동합니다.',
            },
            {
              title: '복사할 파일을 선택하고 복사합니다',
              description: (
                <span>
                  Space로 파일을 선택하고, <KeyBadge>Ctrl+C</KeyBadge>로 복사합니다. (선택과 복사는 다음 섹션에서 자세히 배웁니다.)
                </span>
              ),
            },
            {
              title: '오른쪽 패널로 이동해서 붙여넣기합니다',
              description: (
                <span>
                  Tab으로 오른쪽 패널(Documents)로 이동한 뒤 <KeyBadge>Ctrl+V</KeyBadge>로 붙여넣기합니다. 완료!
                </span>
              ),
            },
          ]} />

          <TipBox>
            패널은 2개 이상도 만들 수 있습니다. <KeyBadge>0</KeyBadge>을 여러 번 누르면 패널이 계속 추가됩니다.
            하지만 보통은 2개면 충분합니다. 터미널 창이 너무 좁으면 패널을 많이 만들기 어렵습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Want to copy or move files to another folder? It's convenient to see both folders at once.
            In cokacdir, you can split the screen into multiple "panels". Each panel works as an independent file browser,
            so you can view your Photos folder on the left and your Backup folder on the right.
          </p>

          <SectionHeading id="panel-create" level={3}>Adding and Closing Panels</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press 0 to create a new panel',
              description: (
                <span>
                  Press <KeyBadge>0</KeyBadge> and the screen splits in half with a new panel on the right.
                  Both panels will show the same folder initially.
                </span>
              ),
            },
            {
              title: 'Switch between panels',
              description: (
                <span>
                  Press <KeyBadge>Tab</KeyBadge> to move to the next panel, or use <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge> arrow keys
                  to switch panels. The active panel's header is highlighted.
                </span>
              ),
            },
            {
              title: 'Navigate to different folders in each panel',
              description: 'Navigate to your desired folder in the right panel. The left panel stays put. Now you can see two different folders at once.',
            },
            {
              title: 'Close panels you no longer need',
              description: (
                <span>
                  Press <KeyBadge>9</KeyBadge> to close the currently active panel.
                  When only one panel remains, it returns to full-screen mode.
                </span>
              ),
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-2 bg-bg-elevated border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              Panel Key Summary
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <KeyBadge>0</KeyBadge>
                <span className="text-zinc-400">Add new panel (split screen)</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>9</KeyBadge>
                <span className="text-zinc-400">Close current panel</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>Tab</KeyBadge>
                <span className="text-zinc-400">Switch to next panel</span>
              </div>
              <div className="flex items-center gap-3">
                <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge>
                <span className="text-zinc-400">Switch between left/right panels</span>
              </div>
            </div>
          </div>

          <SectionHeading id="panel-workflow" level={3}>Example: Copying Files with Panels</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Let's say you want to copy files from your Downloads folder to your Documents folder.
          </p>
          <StepByStep steps={[
            {
              title: 'Navigate to the Downloads folder',
              description: 'In the first panel, go to your Downloads folder.',
            },
            {
              title: 'Press 0 to open a second panel',
              description: 'The screen splits in two. Focus automatically moves to the right panel.',
            },
            {
              title: 'Navigate to Documents in the right panel',
              description: 'In the right panel, press Esc to go to the parent folder, then enter the Documents folder.',
            },
            {
              title: 'Switch back to the left panel with Tab or left arrow',
              description: 'Move back to the left panel (Downloads).',
            },
            {
              title: 'Select and copy files',
              description: (
                <span>
                  Select files with Space, then copy with <KeyBadge>Ctrl+C</KeyBadge>. (Selection and copying are covered in detail in the next sections.)
                </span>
              ),
            },
            {
              title: 'Switch to the right panel and paste',
              description: (
                <span>
                  Press Tab to go to the right panel (Documents), then <KeyBadge>Ctrl+V</KeyBadge> to paste. Done!
                </span>
              ),
            },
          ]} />

          <TipBox>
            You can create more than 2 panels. Press <KeyBadge>0</KeyBadge> multiple times to keep adding panels.
            But usually 2 is enough. If the terminal window is too narrow, multiple panels become hard to use.
          </TipBox>
        </>
      )}
    </section>
  )
}
