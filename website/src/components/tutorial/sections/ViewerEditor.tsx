import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function ViewerEditor() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="viewer-editor">{t('Viewing & Editing Files', '파일 보기 & 편집하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir에는 파일 내용을 볼 수 있는 "뷰어"와 직접 수정할 수 있는 "에디터"가 내장되어 있습니다.
            별도 프로그램을 설치하지 않아도 텍스트 파일을 바로 열어보고 편집할 수 있습니다.
          </p>

          <SectionHeading id="file-viewer" level={3}>파일 보기 (뷰어)</SectionHeading>
          <p className="text-zinc-400 mb-4">
            파일 내용을 읽기만 하고 싶을 때 사용합니다. 실수로 내용을 바꿀 걱정이 없습니다.
          </p>
          <StepByStep steps={[
            {
              title: '보고 싶은 파일 위에 커서를 놓고 Enter를 누릅니다',
              description: (
                <span>
                  화면이 바뀌면서 파일 내용이 표시됩니다. 텍스트 파일이면 글자가, 코드 파일이면 코드가 보입니다.
                </span>
              ),
            },
            {
              title: '위아래로 스크롤해서 내용을 봅니다',
              description: (
                <span>
                  <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge>로 한 줄씩,
                  <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge>으로 한 페이지씩 스크롤할 수 있습니다.
                </span>
              ),
            },
            {
              title: '다 봤으면 Esc 또는 Q로 닫습니다',
              description: '파일 목록 화면으로 돌아갑니다.',
            },
          ]} />

          <p className="text-zinc-400 mb-4">뷰어에서 쓸 수 있는 유용한 기능들:</p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+F</KeyBadge>
                <span className="text-white font-semibold">내용 검색</span>
              </div>
              <p className="text-zinc-400 text-sm">
                파일 안에서 특정 단어나 문구를 찾고 싶을 때 사용합니다.
                검색어를 입력하면 해당 위치로 이동합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+G</KeyBadge> 또는 <KeyBadge>:</KeyBadge>
                <span className="text-white font-semibold">줄 번호로 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                "150번째 줄로 가고 싶다"할 때 줄 번호를 입력하면 해당 줄로 바로 이동합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>W</KeyBadge>
                <span className="text-white font-semibold">줄 바꿈 토글</span>
              </div>
              <p className="text-zinc-400 text-sm">
                긴 줄이 화면 밖으로 넘어갈 때, <KeyBadge>W</KeyBadge>를 누르면 자동으로 줄 바꿈해서 보여줍니다.
                다시 누르면 원래대로 돌아갑니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>H</KeyBadge>
                <span className="text-white font-semibold">16진수 모드</span>
              </div>
              <p className="text-zinc-400 text-sm">
                일반 텍스트가 아닌 파일(이미지, 실행 파일 등)의 바이너리 데이터를 16진수로 볼 수 있습니다.
                프로그래머가 아니라면 잘 쓸 일이 없지만, 혹시 파일이 깨져 보일 때 이 모드로 확인해볼 수 있습니다.
              </p>
            </div>
          </div>

          <SectionHeading id="file-editor" level={3}>파일 편집하기 (에디터)</SectionHeading>
          <p className="text-zinc-400 mb-4">
            파일 내용을 직접 수정하고 싶을 때 사용합니다.
            메모장이나 VS Code처럼 텍스트를 편집할 수 있습니다.
          </p>

          <StepByStep steps={[
            {
              title: '편집할 파일 위에 커서를 놓고 E를 누릅니다',
              description: (
                <span>
                  <KeyBadge>E</KeyBadge>를 누르면 에디터가 열립니다. 파일 내용이 표시되고, 커서가 깜빡이며
                  바로 타이핑할 수 있는 상태가 됩니다.
                </span>
              ),
            },
            {
              title: '원하는 내용을 수정합니다',
              description: '일반 텍스트 편집기처럼 화살표 키로 이동하고, 글자를 입력하거나 지울 수 있습니다.',
            },
            {
              title: 'Ctrl+S로 저장합니다',
              description: (
                <span>
                  <KeyBadge>Ctrl+S</KeyBadge>를 누르면 변경 사항이 파일에 저장됩니다.
                </span>
              ),
            },
            {
              title: 'Esc로 에디터를 닫습니다',
              description: '저장하지 않은 변경사항이 있으면 "저장하시겠습니까?" 묻는 창이 나타납니다. 실수로 닫아도 작업을 잃어버릴 걱정이 없습니다.',
            },
          ]} />

          <p className="text-zinc-400 mb-3">에디터에서 자주 쓰는 단축키들입니다. 대부분 메모장이나 워드와 같습니다:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-2 bg-bg-elevated border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              편집 기본
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { key: <KeyBadge>Ctrl+S</KeyBadge>, desc: '저장하기' },
                { key: <KeyBadge>Ctrl+Z</KeyBadge>, desc: '실행 취소 (방금 한 것 되돌리기)' },
                { key: <KeyBadge>Ctrl+Y</KeyBadge>, desc: '다시 실행 (되돌린 것 복원)' },
                { key: <KeyBadge>Ctrl+C</KeyBadge>, desc: '선택한 텍스트 복사 (선택 없으면 현재 줄 전체 복사)' },
                { key: <KeyBadge>Ctrl+X</KeyBadge>, desc: '선택한 텍스트 잘라내기' },
                { key: <KeyBadge>Ctrl+V</KeyBadge>, desc: '붙여넣기' },
                { key: <KeyBadge>Ctrl+A</KeyBadge>, desc: '전체 선택' },
                { key: <KeyBadge>Ctrl+F</KeyBadge>, desc: '찾기 (텍스트 검색)' },
                { key: <KeyBadge>Ctrl+H</KeyBadge>, desc: '찾아서 바꾸기 (예: "apple"을 모두 "orange"로)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">{item.key}</div>
                  <span className="text-zinc-400 text-sm">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-bg-elevated border-y border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              줄 편집
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { key: <KeyBadge>Ctrl+K</KeyBadge>, desc: '현재 줄 삭제' },
                { key: <KeyBadge>Ctrl+J</KeyBadge>, desc: '현재 줄 복제 (같은 줄을 한 줄 더 만들기)' },
                { key: <><KeyBadge>Alt+{'\u2191'}</KeyBadge>/<KeyBadge>{'\u2193'}</KeyBadge></>, desc: '현재 줄을 위아래로 이동' },
                { key: <KeyBadge>Ctrl+/</KeyBadge>, desc: '주석 처리 토글 (코드 편집 시 유용)' },
                { key: <><KeyBadge>Tab</KeyBadge></>, desc: '들여쓰기' },
                { key: <><KeyBadge>Shift+Tab</KeyBadge></>, desc: '내어쓰기 (들여쓰기 취소)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">{item.key}</div>
                  <span className="text-zinc-400 text-sm">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <TipBox>
            에디터에는 코드를 색상으로 구분해주는 "구문 강조(Syntax Highlighting)" 기능이 있어서
            프로그래밍 파일을 편집할 때도 편리합니다.
          </TipBox>

          <TipBox variant="note">
            에디터에서 <KeyBadge>Ctrl+D</KeyBadge>를 누르면 같은 단어를 여러 곳에서 동시에 수정할 수 있는
            "멀티 커서" 기능이 작동합니다. 같은 변수 이름을 한 번에 바꿀 때 아주 유용하지만,
            처음에는 몰라도 전혀 문제없습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir has a built-in "viewer" for reading file contents and an "editor" for modifying them.
            You can open and edit text files without installing any additional programs.
          </p>

          <SectionHeading id="file-viewer" level={3}>File Viewer</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Use this when you just want to read a file. No risk of accidentally modifying the contents.
          </p>
          <StepByStep steps={[
            {
              title: 'Place cursor on a file and press Enter',
              description: (
                <span>
                  The screen changes to show the file contents. Text files show text, code files show code.
                </span>
              ),
            },
            {
              title: 'Scroll up and down to read',
              description: (
                <span>
                  Use <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> to scroll line by line,
                  <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge> to scroll page by page.
                </span>
              ),
            },
            {
              title: 'Close with Esc or Q when done',
              description: 'Returns to the file list screen.',
            },
          ]} />

          <p className="text-zinc-400 mb-4">Useful features in the viewer:</p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+F</KeyBadge>
                <span className="text-white font-semibold">Find in File</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Search for a specific word or phrase within the file.
                Type the search term and it jumps to that location.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+G</KeyBadge> or <KeyBadge>:</KeyBadge>
                <span className="text-white font-semibold">Go to Line Number</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Want to jump to line 150? Enter the line number to go there directly.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>W</KeyBadge>
                <span className="text-white font-semibold">Toggle Word Wrap</span>
              </div>
              <p className="text-zinc-400 text-sm">
                When long lines extend beyond the screen, press <KeyBadge>W</KeyBadge> to wrap them automatically.
                Press again to unwrap.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>H</KeyBadge>
                <span className="text-white font-semibold">Hex Mode</span>
              </div>
              <p className="text-zinc-400 text-sm">
                View binary data of non-text files (images, executables) in hexadecimal.
                Rarely needed unless you're a programmer, but useful when a file appears corrupted.
              </p>
            </div>
          </div>

          <SectionHeading id="file-editor" level={3}>File Editor</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Use this when you want to directly modify file contents.
            Works like Notepad or VS Code for text editing.
          </p>

          <StepByStep steps={[
            {
              title: 'Place cursor on a file and press E',
              description: (
                <span>
                  Press <KeyBadge>E</KeyBadge> to open the editor. The file contents appear and you can
                  start typing immediately.
                </span>
              ),
            },
            {
              title: 'Make your edits',
              description: 'Use arrow keys to navigate and type or delete text, just like any text editor.',
            },
            {
              title: 'Save with Ctrl+S',
              description: (
                <span>
                  Press <KeyBadge>Ctrl+S</KeyBadge> to save your changes to the file.
                </span>
              ),
            },
            {
              title: 'Close with Esc',
              description: 'If there are unsaved changes, a "Save?" prompt appears. You won\'t lose work by accidentally closing.',
            },
          ]} />

          <p className="text-zinc-400 mb-3">Common editor shortcuts — most work the same as Notepad or Word:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-2 bg-bg-elevated border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              Basic Editing
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { key: <KeyBadge>Ctrl+S</KeyBadge>, desc: 'Save' },
                { key: <KeyBadge>Ctrl+Z</KeyBadge>, desc: 'Undo' },
                { key: <KeyBadge>Ctrl+Y</KeyBadge>, desc: 'Redo' },
                { key: <KeyBadge>Ctrl+C</KeyBadge>, desc: 'Copy selected text (or entire line if nothing selected)' },
                { key: <KeyBadge>Ctrl+X</KeyBadge>, desc: 'Cut selected text' },
                { key: <KeyBadge>Ctrl+V</KeyBadge>, desc: 'Paste' },
                { key: <KeyBadge>Ctrl+A</KeyBadge>, desc: 'Select all' },
                { key: <KeyBadge>Ctrl+F</KeyBadge>, desc: 'Find (text search)' },
                { key: <KeyBadge>Ctrl+H</KeyBadge>, desc: 'Find and replace (e.g., replace all "apple" with "orange")' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">{item.key}</div>
                  <span className="text-zinc-400 text-sm">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="px-4 py-2 bg-bg-elevated border-y border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
              Line Editing
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { key: <KeyBadge>Ctrl+K</KeyBadge>, desc: 'Delete current line' },
                { key: <KeyBadge>Ctrl+J</KeyBadge>, desc: 'Duplicate current line' },
                { key: <><KeyBadge>Alt+{'\u2191'}</KeyBadge>/<KeyBadge>{'\u2193'}</KeyBadge></>, desc: 'Move current line up/down' },
                { key: <KeyBadge>Ctrl+/</KeyBadge>, desc: 'Toggle comment (useful for code)' },
                { key: <><KeyBadge>Tab</KeyBadge></>, desc: 'Indent' },
                { key: <><KeyBadge>Shift+Tab</KeyBadge></>, desc: 'Outdent' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 flex-shrink-0">{item.key}</div>
                  <span className="text-zinc-400 text-sm">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <TipBox>
            The editor includes syntax highlighting, which color-codes programming languages
            for easier editing of code files.
          </TipBox>

          <TipBox variant="note">
            Press <KeyBadge>Ctrl+D</KeyBadge> in the editor to use "multi-cursor" mode — edit the same word
            in multiple places simultaneously. Great for renaming variables, but don't worry if you don't need it yet.
          </TipBox>
        </>
      )}
    </section>
  )
}
