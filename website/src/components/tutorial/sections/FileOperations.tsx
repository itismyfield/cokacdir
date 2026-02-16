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
          </div>

          <SectionHeading id="file-encryption" level={3}>파일 암호화 / 복호화</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            현재 디렉토리의 모든 파일을 AES-256으로 암호화하거나, 암호화된 파일을 복호화할 수 있습니다.
            암호화된 파일은 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">.cokacenc</code> 확장자로 저장되며,
            큰 파일은 지정한 크기로 분할됩니다.
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+E</KeyBadge>
                <span className="text-white font-semibold">암호화</span>
              </div>
              <p className="text-zinc-400 text-sm">
                현재 디렉토리의 모든 파일을 암호화합니다.
                분할 크기(MB)를 입력할 수 있으며, 기본값은 1800MB입니다.
                0을 입력하면 분할 없이 단일 파일로 암호화됩니다.
                암호화 후 원본 파일은 삭제됩니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+D</KeyBadge>
                <span className="text-white font-semibold">복호화</span>
              </div>
              <p className="text-zinc-400 text-sm">
                현재 디렉토리의 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">.cokacenc</code> 파일들을
                원본 파일로 복원합니다. 복호화 후 암호화 파일은 삭제됩니다.
              </p>
            </div>
          </div>
          <TipBox>
            암호화 키는 처음 사용 시 자동으로 생성되어 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/</code>에 저장됩니다.
            이 키 파일을 분실하면 암호화된 파일을 복구할 수 없으니 반드시 백업하세요.
          </TipBox>

          <TipBox>
            가장 자주 쓰는 키 3개만 기억하세요: <KeyBadge>Ctrl+C</KeyBadge> 복사, <KeyBadge>Ctrl+V</KeyBadge> 붙여넣기, <KeyBadge>X</KeyBadge> 삭제.
            나머지는 필요할 때 이 페이지를 참고하면 됩니다.
          </TipBox>

          {/* ========== 파일 열기 프로그램 설정 ========== */}
          <SectionHeading id="extension-handler" level={3}>파일 열기 프로그램 설정 (U 키)</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            PDF 파일을 열 때 항상 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">evince</code>를 쓰고 싶다거나,
            이미지 파일을 열 때 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">feh</code>를 쓰고 싶다면?
            확장자별로 "이 파일은 이 프로그램으로 열어라"를 지정해 둘 수 있습니다.
            한 번 설정하면, 이후 <KeyBadge>Enter</KeyBadge>로 해당 확장자 파일을 열 때 지정된 프로그램이 자동으로 실행됩니다.
          </p>

          <h4 className="text-white font-semibold mb-3">새 핸들러 등록하기</h4>
          <StepByStep steps={[
            {
              title: '설정할 파일 위에 커서를 놓고 U를 누릅니다',
              description: (
                <span>
                  예를 들어 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">photo.jpg</code> 파일 위에서
                  <KeyBadge>U</KeyBadge>를 누르면, ".jpg" 확장자에 대한 핸들러 설정 화면이 열립니다.
                </span>
              ),
            },
            {
              title: '실행할 명령어를 입력합니다',
              description: (
                <div>
                  <p className="mb-2">
                    파일 경로가 들어갈 자리에 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">{'{{FILEPATH}}'}</code>를 넣어서 명령어를 작성합니다:
                  </p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm space-y-2">
                    <div>
                      <span className="text-zinc-500"># 이미지를 feh로 열기</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'feh {{FILEPATH}}'}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># PDF를 evince로 열기 (끝날 때까지 기다리지 않으려면 @를 붙임)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'@evince {{FILEPATH}}'}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># 끝날 때까지 기다리는 프로그램 (vim 등)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'vim {{FILEPATH}}'}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Enter를 누르면 저장 및 실행됩니다',
              description: '명령어가 저장되고, 즉시 해당 파일에 대해 실행됩니다. 이후 같은 확장자의 파일을 Enter로 열 때마다 이 프로그램이 사용됩니다.',
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="text-white font-semibold mb-2">
              <code className="text-accent-cyan font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-sm">@</code> 접두어 — 백그라운드 실행
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@</code><strong className="text-zinc-300"> 있음</strong> —
              프로그램을 띄우고 <strong className="text-zinc-300">cokacdir로 즉시 복귀</strong>합니다.
              프로그램이 끝날 때까지 기다리지 않습니다. (예: evince, feh, vlc, 백그라운드 스크립트 등)
              <br />
              <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@</code><strong className="text-zinc-300"> 없음</strong> —
              화면을 프로그램에 넘기고, <strong className="text-zinc-300">프로그램이 끝날 때까지 대기</strong>합니다.
              종료 후 cokacdir로 돌아옵니다. (예: vim, nano, less 등)
            </p>
          </div>

          <h4 className="text-white font-semibold mb-3 mt-6">기존 핸들러 수정 / 삭제하기</h4>
          <p className="text-zinc-400 mb-4">
            이미 핸들러가 설정된 확장자의 파일에서 <KeyBadge>U</KeyBadge>를 누르면,
            현재 설정된 명령어가 입력창에 표시됩니다.
          </p>
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-3 text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{'✎'}</span>
              <span><strong className="text-zinc-300">수정:</strong> 기존 명령어를 편집한 뒤 <KeyBadge>Enter</KeyBadge>를 누르면 새 명령어로 저장됩니다.</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{'✕'}</span>
              <span><strong className="text-zinc-300">삭제:</strong> 명령어를 모두 지운 뒤(빈 칸 상태에서) <KeyBadge>Enter</KeyBadge>를 누르면 핸들러가 제거됩니다. 이후 Enter로 파일을 열면 기본 동작(편집기)으로 돌아갑니다.</span>
            </div>
          </div>

          <TipBox>
            핸들러 설정은 확장자 단위로 적용됩니다.
            예를 들어 .jpg 파일에 핸들러를 설정하면, 모든 .jpg 파일에 동일하게 적용됩니다.
            설정은 자동 저장되어 cokacdir를 재시작해도 유지됩니다.
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
          </div>

          <SectionHeading id="file-encryption" level={3}>File Encryption / Decryption</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            You can encrypt all files in the current directory with AES-256, or decrypt previously encrypted files.
            Encrypted files are saved with the <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">.cokacenc</code> extension,
            and large files are split into chunks of a configurable size.
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+E</KeyBadge>
                <span className="text-white font-semibold">Encrypt</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Encrypts all files in the current directory.
                You can specify the split size in MB (default: 1800MB).
                Enter 0 for no splitting (single encrypted file).
                Original files are deleted after encryption.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+D</KeyBadge>
                <span className="text-white font-semibold">Decrypt</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Restores <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">.cokacenc</code> files
                in the current directory back to their original files. Encrypted files are deleted after decryption.
              </p>
            </div>
          </div>
          <TipBox>
            The encryption key is automatically generated on first use and stored in <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/</code>.
            Be sure to back up this key file — if lost, encrypted files cannot be recovered.
          </TipBox>

          <TipBox>
            Just remember 3 keys: <KeyBadge>Ctrl+C</KeyBadge> copy, <KeyBadge>Ctrl+V</KeyBadge> paste, <KeyBadge>X</KeyBadge> delete.
            Refer to this page for the rest when needed.
          </TipBox>

          {/* ========== File Handler Setup ========== */}
          <SectionHeading id="extension-handler" level={3}>File Handlers (U Key)</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Want to always open PDF files with <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">evince</code>,
            or images with <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">feh</code>?
            You can assign a program to each file extension.
            Once set, pressing <KeyBadge>Enter</KeyBadge> on files with that extension will automatically launch the assigned program.
          </p>

          <h4 className="text-white font-semibold mb-3">Setting Up a New Handler</h4>
          <StepByStep steps={[
            {
              title: 'Place cursor on a file and press U',
              description: (
                <span>
                  For example, press <KeyBadge>U</KeyBadge> on <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">photo.jpg</code> to
                  open the handler setup dialog for the ".jpg" extension.
                </span>
              ),
            },
            {
              title: 'Type the command to execute',
              description: (
                <div>
                  <p className="mb-2">
                    Use <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">{'{{FILEPATH}}'}</code> as a placeholder for the file path:
                  </p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm space-y-2">
                    <div>
                      <span className="text-zinc-500"># Open images with feh</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'feh {{FILEPATH}}'}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># Open PDFs with evince (@ = don't wait for it to finish)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'@evince {{FILEPATH}}'}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># Wait for the program to finish (vim, etc.)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">{'vim {{FILEPATH}}'}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Press Enter to save and execute',
              description: 'The command is saved and immediately executed on the current file. From now on, pressing Enter on any file with the same extension will use this program.',
            },
          ]} />

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="text-white font-semibold mb-2">
              <code className="text-accent-cyan font-mono bg-bg-elevated px-1.5 py-0.5 rounded text-sm">@</code> Prefix — Background Execution
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              <strong className="text-zinc-300">With </strong><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@</code> —
              launches the program and <strong className="text-zinc-300">returns to cokacdir immediately</strong>.
              Does not wait for the program to finish. (e.g., evince, feh, vlc, background scripts)
              <br />
              <strong className="text-zinc-300">Without </strong><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">@</code> —
              hands the screen to the program and <strong className="text-zinc-300">waits until it finishes</strong>.
              cokacdir resumes after the program exits. (e.g., vim, nano, less)
            </p>
          </div>

          <h4 className="text-white font-semibold mb-3 mt-6">Editing / Deleting a Handler</h4>
          <p className="text-zinc-400 mb-4">
            Press <KeyBadge>U</KeyBadge> on a file whose extension already has a handler,
            and the current command appears pre-filled in the input field.
          </p>
          <div className="space-y-2 mb-6">
            <div className="flex items-start gap-3 text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{'✎'}</span>
              <span><strong className="text-zinc-300">Edit:</strong> Modify the command and press <KeyBadge>Enter</KeyBadge> to save the updated command.</span>
            </div>
            <div className="flex items-start gap-3 text-zinc-400">
              <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{'✕'}</span>
              <span><strong className="text-zinc-300">Delete:</strong> Clear all text so the field is empty, then press <KeyBadge>Enter</KeyBadge>. The handler is removed and opening the file reverts to the default behavior (text editor).</span>
            </div>
          </div>

          <TipBox>
            Handlers are set per file extension.
            For example, setting a handler on a .jpg file applies to all .jpg files.
            Settings are saved automatically and persist across cokacdir sessions.
          </TipBox>
        </>
      )}
    </section>
  )
}
