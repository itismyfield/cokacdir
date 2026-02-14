import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function FileOperations() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="file-operations">{t('File Operations', '파일 작업하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            이제 실제로 파일을 만들고, 이름을 바꾸고, 복사하고, 삭제하는 방법을 알아봅시다.
            Windows에서 마우스 오른쪽 클릭으로 하던 것들을 키보드 한 키로 할 수 있습니다.
          </p>

          <SectionHeading id="create-rename" level={3}>새 폴더/파일 만들기</SectionHeading>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>K</KeyBadge>
                <span className="text-white font-semibold">새 폴더 만들기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>K</KeyBadge>를 누르면 이름을 입력하는 창이 나타납니다.
                원하는 폴더 이름을 입력하고 Enter를 누르면 현재 위치에 새 폴더가 만들어집니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>M</KeyBadge>
                <span className="text-white font-semibold">새 파일 만들기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>M</KeyBadge>을 누르면 이름을 입력하는 창이 나타납니다.
                <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">memo.txt</code>처럼
                확장자까지 포함해서 입력하면 빈 파일이 생성됩니다.
              </p>
            </div>
          </div>

          <SectionHeading id="rename" level={3}>이름 바꾸기</SectionHeading>
          <StepByStep steps={[
            {
              title: '이름을 바꾸고 싶은 파일 위에 커서를 놓습니다',
              description: '화살표로 해당 파일로 이동하세요.',
            },
            {
              title: 'R을 누릅니다',
              description: (
                <span>
                  <KeyBadge>R</KeyBadge>을 누르면 현재 파일 이름이 입력창에 나타납니다.
                  기존 이름을 지우고 새 이름을 입력하세요.
                </span>
              ),
            },
            {
              title: 'Enter를 눌러 확인합니다',
              description: '새 이름이 적용됩니다. 취소하고 싶으면 Esc를 누르세요.',
            },
          ]} />

          <SectionHeading id="clipboard" level={3}>복사, 잘라내기, 붙여넣기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Windows나 macOS에서 Ctrl+C / Ctrl+V 하는 것과 똑같습니다. 파일을 선택한 뒤:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+C</KeyBadge>
                <span className="text-white font-semibold">복사</span>
              </div>
              <p className="text-zinc-400 text-sm">
                선택한 파일을 클립보드에 복사합니다. 원본은 그대로 남습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+X</KeyBadge>
                <span className="text-white font-semibold">잘라내기 (이동)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                선택한 파일을 "잘라내기"합니다. 붙여넣기하면 원래 위치에서 사라지고 새 위치로 이동합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+V</KeyBadge>
                <span className="text-white font-semibold">붙여넣기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                복사하거나 잘라낸 파일을 현재 폴더에 붙여넣습니다.
                같은 이름의 파일이 이미 있으면 어떻게 할지 묻는 창이 나타납니다 (덮어쓰기, 건너뛰기, 이름 바꾸기 중 선택).
              </p>
            </div>
          </div>

          <SectionHeading id="copy-example" level={3}>실전 예시: 파일 복사하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            "report.pdf 파일을 다른 폴더로 복사하고 싶다"는 상황입니다:
          </p>
          <StepByStep steps={[
            {
              title: 'report.pdf 위에 커서를 놓고 Space로 선택합니다',
              description: '파일이 하이라이트(선택 표시)됩니다.',
            },
            {
              title: 'Ctrl+C를 눌러 복사합니다',
              description: '화면에 변화가 없을 수 있지만, 파일이 클립보드에 복사된 상태입니다.',
            },
            {
              title: '붙여넣을 폴더로 이동합니다',
              description: (
                <span>
                  다른 패널로 이동하거나(<KeyBadge>Tab</KeyBadge>), 현재 패널에서 원하는 폴더로 이동하세요.
                </span>
              ),
            },
            {
              title: 'Ctrl+V를 눌러 붙여넣습니다',
              description: '파일이 현재 폴더에 복사됩니다. 복사 진행 상황이 표시됩니다.',
            },
          ]} />

          <SectionHeading id="delete-archive" level={3}>파일 삭제하기</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>X</KeyBadge> 또는 <KeyBadge>Delete</KeyBadge>
              <span className="text-white font-semibold">삭제</span>
            </div>
            <p className="text-zinc-400 text-sm">
              삭제할 파일 위에 커서를 놓고 (또는 여러 파일을 선택한 상태에서)
              <KeyBadge>X</KeyBadge> 또는 <KeyBadge>Delete</KeyBadge>를 누릅니다.
              "정말 삭제하시겠습니까?" 확인 창이 나타나며, Y를 누르면 삭제되고 N을 누르면 취소됩니다.
            </p>
          </div>

          <TipBox variant="warning">
            삭제된 파일은 휴지통으로 가지 않고 바로 영구 삭제됩니다.
            확인 창에서 꼭 파일 이름을 확인한 후 Y를 눌러주세요.
          </TipBox>

          <SectionHeading id="archive-info" level={3}>기타 작업</SectionHeading>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>T</KeyBadge>
                <span className="text-white font-semibold">압축 파일 만들기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                선택한 파일들을 하나의 tar 압축 파일로 묶습니다.
                여러 파일을 하나로 합쳐서 보관하거나 전송할 때 유용합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>I</KeyBadge>
                <span className="text-white font-semibold">파일 정보 보기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                선택한 파일의 상세 정보(크기, 수정 날짜, 권한 등)를 확인할 수 있습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>U</KeyBadge>
                <span className="text-white font-semibold">확장자 연결 프로그램 설정</span>
              </div>
              <p className="text-zinc-400 text-sm">
                특정 확장자의 파일을 열 때 어떤 프로그램을 사용할지 설정합니다.
                예를 들어 .pdf 파일을 열 때 항상 특정 프로그램을 사용하도록 지정할 수 있습니다.
              </p>
            </div>
          </div>

          <TipBox>
            가장 자주 쓰는 키 3개만 기억하세요: <KeyBadge>Ctrl+C</KeyBadge> 복사, <KeyBadge>Ctrl+V</KeyBadge> 붙여넣기, <KeyBadge>X</KeyBadge> 삭제.
            나머지는 필요할 때 이 페이지를 참고하면 됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Now let's learn how to create files, rename them, copy, and delete.
            Everything you'd do with a right-click in Windows can be done with a single key press.
          </p>

          <SectionHeading id="create-rename" level={3}>Creating New Folders/Files</SectionHeading>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>K</KeyBadge>
                <span className="text-white font-semibold">Create New Folder</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>K</KeyBadge> and a name input prompt appears.
                Type the folder name and press Enter to create a new folder in the current location.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>M</KeyBadge>
                <span className="text-white font-semibold">Create New File</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>M</KeyBadge> and type a file name including the extension, like
                <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">memo.txt</code>,
                to create an empty file.
              </p>
            </div>
          </div>

          <SectionHeading id="rename" level={3}>Renaming</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Move the cursor to the file you want to rename',
              description: 'Use arrow keys to navigate to the file.',
            },
            {
              title: 'Press R',
              description: (
                <span>
                  Press <KeyBadge>R</KeyBadge> and the current file name appears in an input field.
                  Clear the old name and type the new one.
                </span>
              ),
            },
            {
              title: 'Press Enter to confirm',
              description: 'The new name is applied. Press Esc to cancel.',
            },
          ]} />

          <SectionHeading id="clipboard" level={3}>Copy, Cut, and Paste</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Just like Ctrl+C / Ctrl+V in Windows or macOS. After selecting files:
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+C</KeyBadge>
                <span className="text-white font-semibold">Copy</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Copies the selected files to the clipboard. The originals remain in place.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+X</KeyBadge>
                <span className="text-white font-semibold">Cut (Move)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Cuts the selected files. When you paste, the files are removed from the original location and moved to the new one.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+V</KeyBadge>
                <span className="text-white font-semibold">Paste</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Pastes copied or cut files into the current folder.
                If a file with the same name already exists, a prompt appears asking what to do (overwrite, skip, or rename).
              </p>
            </div>
          </div>

          <SectionHeading id="copy-example" level={3}>Example: Copying a File</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Let's say you want to copy report.pdf to another folder:
          </p>
          <StepByStep steps={[
            {
              title: 'Move cursor to report.pdf and select it with Space',
              description: 'The file becomes highlighted (selected).',
            },
            {
              title: 'Press Ctrl+C to copy',
              description: 'Nothing visible may change, but the file is now in the clipboard.',
            },
            {
              title: 'Navigate to the destination folder',
              description: (
                <span>
                  Switch to another panel (<KeyBadge>Tab</KeyBadge>) or navigate to the desired folder in the current panel.
                </span>
              ),
            },
            {
              title: 'Press Ctrl+V to paste',
              description: 'The file is copied to the current folder. Copy progress is displayed.',
            },
          ]} />

          <SectionHeading id="delete-archive" level={3}>Deleting Files</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>X</KeyBadge> or <KeyBadge>Delete</KeyBadge>
              <span className="text-white font-semibold">Delete</span>
            </div>
            <p className="text-zinc-400 text-sm">
              Place the cursor on the file to delete (or select multiple files), then press
              <KeyBadge>X</KeyBadge> or <KeyBadge>Delete</KeyBadge>.
              A confirmation prompt appears — press Y to delete, N to cancel.
            </p>
          </div>

          <TipBox variant="warning">
            Deleted files are permanently removed — they don't go to a trash can.
            Always check the file name in the confirmation prompt before pressing Y.
          </TipBox>

          <SectionHeading id="archive-info" level={3}>Other Operations</SectionHeading>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>T</KeyBadge>
                <span className="text-white font-semibold">Create Archive</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Bundles the selected files into a single tar archive.
                Useful for combining multiple files for storage or transfer.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>I</KeyBadge>
                <span className="text-white font-semibold">File Info</span>
              </div>
              <p className="text-zinc-400 text-sm">
                View detailed information about the selected file (size, modification date, permissions, etc.).
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>U</KeyBadge>
                <span className="text-white font-semibold">Set File Association</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Configure which program to use when opening files with a specific extension.
                For example, always open .pdf files with a particular application.
              </p>
            </div>
          </div>

          <TipBox>
            Just remember 3 keys: <KeyBadge>Ctrl+C</KeyBadge> copy, <KeyBadge>Ctrl+V</KeyBadge> paste, <KeyBadge>X</KeyBadge> delete.
            Refer to this page for the rest when needed.
          </TipBox>
        </>
      )}
    </section>
  )
}
