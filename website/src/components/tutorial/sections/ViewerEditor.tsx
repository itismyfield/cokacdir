import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function ViewerEditor() {
  const { lang, t } = useLanguage()

  const shortcutTable = (
    header: string,
    items: { key: React.ReactNode; desc: string }[]
  ) => (
    <>
      <div className="px-4 py-2 bg-bg-elevated border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
        {header}
      </div>
      <div className="p-4 space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-36 flex-shrink-0">{item.key}</div>
            <span className="text-zinc-400 text-sm">{item.desc}</span>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <section className="mb-16">
      <SectionHeading id="file-editor">{t('File Editor', '파일 편집하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir에는 텍스트 편집기가 내장되어 있어서, 별도 프로그램 없이
            파일을 바로 열어 수정할 수 있습니다.
            구문 강조, 찾기/바꾸기, 멀티 커서 등 코드 편집에 필요한 기능들을 갖추고 있습니다.
          </p>

          {/* ===== 열기/저장/닫기 ===== */}
          <SectionHeading id="editor-basics" level={3}>열기 / 저장 / 닫기</SectionHeading>
          <StepByStep steps={[
            {
              title: '편집할 파일 위에서 E를 누릅니다',
              description: (
                <span>
                  파일 목록에서 편집하려는 파일에 커서를 놓고 <KeyBadge>E</KeyBadge>를 누르면
                  에디터가 열립니다. <KeyBadge>Enter</KeyBadge>로도 열 수 있습니다.
                  파일 내용이 표시되고 바로 타이핑할 수 있는 상태가 됩니다.
                </span>
              ),
            },
            {
              title: '원하는 내용을 수정합니다',
              description: '일반 텍스트 편집기처럼 화살표 키로 이동하고, 글자를 입력하거나 지울 수 있습니다. 수정 사항이 있으면 제목에 ✻ 표시가 나타납니다.',
            },
            {
              title: 'Ctrl+S로 저장합니다',
              description: (
                <span>
                  <KeyBadge>Ctrl+S</KeyBadge>를 누르면 변경 사항이 파일에 저장됩니다.
                  저장 성공 시 화면 상단에 메시지가 잠시 표시됩니다.
                </span>
              ),
            },
            {
              title: 'Esc로 에디터를 닫습니다',
              description: (
                <span>
                  저장하지 않은 변경사항이 있으면 경고 메시지가 나타납니다.
                  <KeyBadge>Esc</KeyBadge>를 한 번 더 누르면 저장 없이 닫고,
                  <KeyBadge>Ctrl+S</KeyBadge>를 누르면 저장 후 닫을 수 있습니다.
                </span>
              ),
            },
          ]} />

          <TipBox variant="note">
            편집 가능한 최대 파일 크기는 50MB입니다. 그보다 큰 파일은 에디터로 열 수 없습니다.
          </TipBox>

          {/* ===== 편집 단축키 ===== */}
          <SectionHeading id="editor-editing" level={3}>편집 단축키</SectionHeading>
          <p className="text-zinc-400 mb-3">대부분의 단축키가 메모장, VS Code 등과 동일하게 동작합니다:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            {shortcutTable(t('Basic Editing', '편집 기본'), [
              { key: <KeyBadge>Ctrl+S</KeyBadge>, desc: t('Save', '저장하기') },
              { key: <KeyBadge>Ctrl+Z</KeyBadge>, desc: t('Undo', '실행 취소 (방금 한 것 되돌리기)') },
              { key: <KeyBadge>Ctrl+Y</KeyBadge>, desc: t('Redo', '다시 실행 (되돌린 것 복원)') },
              { key: <KeyBadge>Ctrl+C</KeyBadge>, desc: t('Copy selection (or current line if nothing selected)', '선택한 텍스트 복사 (선택 없으면 현재 줄 복사)') },
              { key: <KeyBadge>Ctrl+X</KeyBadge>, desc: t('Cut selection or current line', '선택한 텍스트 잘라내기 (선택 없으면 현재 줄)') },
              { key: <KeyBadge>Ctrl+V</KeyBadge>, desc: t('Paste', '붙여넣기') },
              { key: <KeyBadge>Ctrl+A</KeyBadge>, desc: t('Select all', '전체 선택') },
            ])}
            {shortcutTable(t('Line Editing', '줄 편집'), [
              { key: <KeyBadge>Ctrl+K</KeyBadge>, desc: t('Delete current line', '현재 줄 삭제') },
              { key: <KeyBadge>Ctrl+J</KeyBadge>, desc: t('Duplicate current line', '현재 줄 복제') },
              { key: <><KeyBadge>Alt+↑</KeyBadge> / <KeyBadge>Alt+↓</KeyBadge></>, desc: t('Move line up/down', '현재 줄을 위아래로 이동') },
              { key: <><KeyBadge>Shift+Alt+↑</KeyBadge> / <KeyBadge>↓</KeyBadge></>, desc: t('Copy line up/down', '현재 줄을 위아래로 복사') },
              { key: <KeyBadge>Ctrl+Enter</KeyBadge>, desc: t('Insert blank line below', '아래에 빈 줄 삽입') },
              { key: <KeyBadge>Ctrl+Shift+Enter</KeyBadge>, desc: t('Insert blank line above', '위에 빈 줄 삽입') },
              { key: <KeyBadge>Ctrl+/</KeyBadge>, desc: t('Toggle comment', '주석 처리 토글') },
              { key: <KeyBadge>Tab</KeyBadge>, desc: t('Indent', '들여쓰기') },
              { key: <KeyBadge>Shift+Tab</KeyBadge>, desc: t('Outdent', '내어쓰기') },
            ])}
            {shortcutTable(t('Cursor Movement', '커서 이동'), [
              { key: <><KeyBadge>Home</KeyBadge> / <KeyBadge>End</KeyBadge></>, desc: t('Jump to start / end of line', '줄의 시작/끝으로 이동') },
              { key: <><KeyBadge>Ctrl+←</KeyBadge> / <KeyBadge>Ctrl+→</KeyBadge></>, desc: t('Move by word', '단어 단위로 이동') },
              { key: <><KeyBadge>Ctrl+Home</KeyBadge> / <KeyBadge>Ctrl+End</KeyBadge></>, desc: t('Jump to beginning / end of file', '파일의 맨 처음/맨 끝으로 이동') },
              { key: <><KeyBadge>PgUp</KeyBadge> / <KeyBadge>PgDn</KeyBadge></>, desc: t('Move up/down one screen', '한 화면 위/아래로 이동') },
              { key: <KeyBadge>Ctrl+G</KeyBadge>, desc: t('Go to specific line number', '줄 번호로 이동') },
            ])}
            {shortcutTable(t('Selection', '선택'), [
              { key: <><KeyBadge>Shift</KeyBadge> + {t('arrow keys', '방향키')}</>, desc: t('Extend selection', '선택 영역 확장') },
              { key: <><KeyBadge>Shift+Home</KeyBadge> / <KeyBadge>Shift+End</KeyBadge></>, desc: t('Select to line start / end', '줄의 시작/끝까지 선택') },
              { key: <><KeyBadge>Shift+Ctrl+←</KeyBadge> / <KeyBadge>→</KeyBadge></>, desc: t('Select word left / right', '단어 단위로 선택') },
              { key: <KeyBadge>Ctrl+L</KeyBadge>, desc: t('Select entire current line', '현재 줄 전체 선택') },
              { key: <KeyBadge>Ctrl+D</KeyBadge>, desc: t('Select word at cursor / add next occurrence (multi-cursor)', '커서 위의 단어 선택 / 다음 동일 단어 추가 선택 (멀티 커서)') },
            ])}
            {shortcutTable(t('Delete', '삭제'), [
              { key: <KeyBadge>Ctrl+Backspace</KeyBadge>, desc: t('Delete word before cursor', '커서 앞 단어 삭제') },
              { key: <KeyBadge>Ctrl+Delete</KeyBadge>, desc: t('Delete word after cursor', '커서 뒤 단어 삭제') },
            ])}
          </div>

          {/* ===== 찾기 & 바꾸기 ===== */}
          <SectionHeading id="editor-find" level={3}>찾기 & 바꾸기</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            에디터 내에서 텍스트를 검색하고, 원하는 단어를 다른 단어로 바꿀 수 있습니다.
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+F</KeyBadge>
                <span className="text-white font-semibold">{t('Find', '찾기')}</span>
              </div>
              <p className="text-zinc-400 text-sm">
                {t(
                  'Opens the find bar. Type a search term and matches are highlighted. Use Up/Down arrows or Enter to navigate between matches.',
                  '찾기 바가 열립니다. 검색어를 입력하면 일치하는 부분이 강조됩니다. 위/아래 화살표 또는 Enter로 매치 간 이동합니다.'
                )}
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+H</KeyBadge>
                <span className="text-white font-semibold">{t('Find & Replace', '찾아서 바꾸기')}</span>
              </div>
              <p className="text-zinc-400 text-sm">
                {t(
                  'Opens find with a replace field. Enter replaces the current match, Ctrl+A replaces all at once. Tab switches between the find and replace fields.',
                  '바꾸기 필드가 추가됩니다. Enter로 현재 매치를 바꾸고, Ctrl+A로 전체 바꾸기. Tab으로 찾기/바꾸기 필드 전환.'
                )}
              </p>
            </div>
          </div>

          <p className="text-zinc-400 mb-3">{t('Search options (toggle in find mode):', '찾기 모드에서 전환 가능한 검색 옵션:')}</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <KeyBadge>Ctrl+C</KeyBadge>
              <span className="text-zinc-400">{t('Toggle case-sensitive search', '대소문자 구분 전환')}</span>
              <KeyBadge>Ctrl+R</KeyBadge>
              <span className="text-zinc-400">{t('Toggle regex mode', '정규식 모드 전환')}</span>
              <KeyBadge>Ctrl+W</KeyBadge>
              <span className="text-zinc-400">{t('Toggle whole-word search', '전체 단어 일치 전환')}</span>
              <KeyBadge>Ctrl+A</KeyBadge>
              <span className="text-zinc-400">{t('Replace all (in replace mode)', '전체 바꾸기 (바꾸기 모드에서)')}</span>
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">{t('Close find/replace', '찾기/바꾸기 닫기')}</span>
            </div>
          </div>

          <TipBox>
            찾기 바에서 현재 매치 위치가 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">2/5 (5 matches)</code>처럼
            표시되어 전체 매치 수와 현재 위치를 한눈에 확인할 수 있습니다.
          </TipBox>

          {/* ===== 고급 기능 ===== */}
          <SectionHeading id="editor-features" level={3}>고급 기능</SectionHeading>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white font-semibold">구문 강조 (Syntax Highlighting)</span>
              </div>
              <p className="text-zinc-400 text-sm mb-2">
                파일 확장자에 따라 프로그래밍 언어를 자동 감지하여
                키워드, 문자열, 주석, 함수 등을 색상으로 구분합니다.
                에디터 상단에 감지된 언어가 표시됩니다.
              </p>
              <p className="text-zinc-500 text-xs">
                지원 언어: Rust, Python, JavaScript, TypeScript, C/C++, Java, Go, HTML, CSS, JSON, YAML, TOML,
                Markdown, Shell, SQL, XML, Ruby, PHP, Swift, Kotlin 등 20개 이상
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+D</KeyBadge>
                <span className="text-white font-semibold">멀티 커서 (Multi-Cursor)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                커서가 있는 단어 위에서 <KeyBadge>Ctrl+D</KeyBadge>를 반복해서 누르면
                같은 단어가 있는 위치마다 커서가 추가됩니다.
                이 상태에서 타이핑하면 모든 위치가 동시에 수정됩니다.
                변수 이름을 일괄 변경할 때 유용합니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+W</KeyBadge>
                <span className="text-white font-semibold">줄 바꿈 (Word Wrap)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                긴 줄이 화면 밖으로 넘어갈 때, <KeyBadge>Ctrl+W</KeyBadge>를 누르면 화면 너비에 맞게
                자동으로 줄을 바꿔서 표시합니다. 다시 누르면 원래대로 돌아갑니다.
                줄 바꿈이 활성화되면 하단에 "Wrap" 표시가 나타납니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+G</KeyBadge>
                <span className="text-white font-semibold">줄 번호로 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                특정 줄 번호를 입력하면 해당 줄로 바로 이동합니다.
                오류 메시지에 줄 번호가 표시되었을 때 빠르게 해당 위치로 갈 수 있습니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white font-semibold">에디터 상단 정보</span>
              </div>
              <p className="text-zinc-400 text-sm">
                에디터 상단에 파일명, 감지된 언어, 커서 위치(줄/칸), 실행취소 횟수가 표시됩니다.
                수정사항이 있으면 파일명 앞에 ✻ 표시가 나타납니다.
              </p>
            </div>
          </div>

          <TipBox>
            에디터의 단축키 대부분은 메모장이나 VS Code와 동일합니다.
            처음에는 <KeyBadge>Ctrl+S</KeyBadge>(저장), <KeyBadge>Ctrl+Z</KeyBadge>(취소),
            <KeyBadge>Ctrl+F</KeyBadge>(찾기)만 기억하면 충분합니다.
            나머지는 필요할 때 자연스럽게 익히면 됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir includes a built-in text editor, so you can open and modify files
            without any external programs.
            It features syntax highlighting, find & replace, multi-cursor editing, and more.
          </p>

          {/* ===== Open / Save / Close ===== */}
          <SectionHeading id="editor-basics" level={3}>Open / Save / Close</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press E on a file to open the editor',
              description: (
                <span>
                  Place the cursor on the file you want to edit and press <KeyBadge>E</KeyBadge>.
                  You can also press <KeyBadge>Enter</KeyBadge>.
                  The editor opens with the file contents ready for editing.
                </span>
              ),
            },
            {
              title: 'Make your edits',
              description: 'Navigate with arrow keys and type or delete text, just like any text editor. A ✻ mark appears in the title when there are unsaved changes.',
            },
            {
              title: 'Save with Ctrl+S',
              description: (
                <span>
                  Press <KeyBadge>Ctrl+S</KeyBadge> to save changes to the file.
                  A confirmation message briefly appears at the top of the screen.
                </span>
              ),
            },
            {
              title: 'Close with Esc',
              description: (
                <span>
                  If there are unsaved changes, a warning message appears.
                  Press <KeyBadge>Esc</KeyBadge> again to discard changes,
                  or <KeyBadge>Ctrl+S</KeyBadge> to save first.
                </span>
              ),
            },
          ]} />

          <TipBox variant="note">
            The maximum editable file size is 50 MB. Larger files cannot be opened in the editor.
          </TipBox>

          {/* ===== Editing shortcuts ===== */}
          <SectionHeading id="editor-editing" level={3}>Editing Shortcuts</SectionHeading>
          <p className="text-zinc-400 mb-3">Most shortcuts work the same as Notepad, VS Code, and other editors:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6">
            {shortcutTable('Basic Editing', [
              { key: <KeyBadge>Ctrl+S</KeyBadge>, desc: 'Save' },
              { key: <KeyBadge>Ctrl+Z</KeyBadge>, desc: 'Undo' },
              { key: <KeyBadge>Ctrl+Y</KeyBadge>, desc: 'Redo' },
              { key: <KeyBadge>Ctrl+C</KeyBadge>, desc: 'Copy selection (or current line if nothing selected)' },
              { key: <KeyBadge>Ctrl+X</KeyBadge>, desc: 'Cut selection or current line' },
              { key: <KeyBadge>Ctrl+V</KeyBadge>, desc: 'Paste' },
              { key: <KeyBadge>Ctrl+A</KeyBadge>, desc: 'Select all' },
            ])}
            {shortcutTable('Line Editing', [
              { key: <KeyBadge>Ctrl+K</KeyBadge>, desc: 'Delete current line' },
              { key: <KeyBadge>Ctrl+J</KeyBadge>, desc: 'Duplicate current line' },
              { key: <><KeyBadge>Alt+↑</KeyBadge> / <KeyBadge>Alt+↓</KeyBadge></>, desc: 'Move line up/down' },
              { key: <><KeyBadge>Shift+Alt+↑</KeyBadge> / <KeyBadge>↓</KeyBadge></>, desc: 'Copy line up/down' },
              { key: <KeyBadge>Ctrl+Enter</KeyBadge>, desc: 'Insert blank line below' },
              { key: <KeyBadge>Ctrl+Shift+Enter</KeyBadge>, desc: 'Insert blank line above' },
              { key: <KeyBadge>Ctrl+/</KeyBadge>, desc: 'Toggle comment' },
              { key: <KeyBadge>Tab</KeyBadge>, desc: 'Indent' },
              { key: <KeyBadge>Shift+Tab</KeyBadge>, desc: 'Outdent' },
            ])}
            {shortcutTable('Cursor Movement', [
              { key: <><KeyBadge>Home</KeyBadge> / <KeyBadge>End</KeyBadge></>, desc: 'Jump to start / end of line' },
              { key: <><KeyBadge>Ctrl+←</KeyBadge> / <KeyBadge>Ctrl+→</KeyBadge></>, desc: 'Move by word' },
              { key: <><KeyBadge>Ctrl+Home</KeyBadge> / <KeyBadge>Ctrl+End</KeyBadge></>, desc: 'Jump to beginning / end of file' },
              { key: <><KeyBadge>PgUp</KeyBadge> / <KeyBadge>PgDn</KeyBadge></>, desc: 'Move up/down one screen' },
              { key: <KeyBadge>Ctrl+G</KeyBadge>, desc: 'Go to specific line number' },
            ])}
            {shortcutTable('Selection', [
              { key: <><KeyBadge>Shift</KeyBadge> + arrow keys</>, desc: 'Extend selection' },
              { key: <><KeyBadge>Shift+Home</KeyBadge> / <KeyBadge>Shift+End</KeyBadge></>, desc: 'Select to line start / end' },
              { key: <><KeyBadge>Shift+Ctrl+←</KeyBadge> / <KeyBadge>→</KeyBadge></>, desc: 'Select word left / right' },
              { key: <KeyBadge>Ctrl+L</KeyBadge>, desc: 'Select entire current line' },
              { key: <KeyBadge>Ctrl+D</KeyBadge>, desc: 'Select word at cursor / add next occurrence (multi-cursor)' },
            ])}
            {shortcutTable('Delete', [
              { key: <KeyBadge>Ctrl+Backspace</KeyBadge>, desc: 'Delete word before cursor' },
              { key: <KeyBadge>Ctrl+Delete</KeyBadge>, desc: 'Delete word after cursor' },
            ])}
          </div>

          {/* ===== Find & Replace ===== */}
          <SectionHeading id="editor-find" level={3}>Find & Replace</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Search for text within the editor and replace words with other words.
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+F</KeyBadge>
                <span className="text-white font-semibold">Find</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Opens the find bar. Type a search term and matches are highlighted.
                Use Up/Down arrows or Enter to navigate between matches.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+H</KeyBadge>
                <span className="text-white font-semibold">Find & Replace</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Opens find with a replace field. Enter replaces the current match,
                Ctrl+A replaces all at once. Tab switches between the find and replace fields.
              </p>
            </div>
          </div>

          <p className="text-zinc-400 mb-3">Search options (toggle in find mode):</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <KeyBadge>Ctrl+C</KeyBadge>
              <span className="text-zinc-400">Toggle case-sensitive search</span>
              <KeyBadge>Ctrl+R</KeyBadge>
              <span className="text-zinc-400">Toggle regex mode</span>
              <KeyBadge>Ctrl+W</KeyBadge>
              <span className="text-zinc-400">Toggle whole-word search</span>
              <KeyBadge>Ctrl+A</KeyBadge>
              <span className="text-zinc-400">Replace all (in replace mode)</span>
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">Close find/replace</span>
            </div>
          </div>

          <TipBox>
            The find bar shows your current position like <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">2/5 (5 matches)</code>,
            so you can see the total number of matches and where you are at a glance.
          </TipBox>

          {/* ===== Advanced features ===== */}
          <SectionHeading id="editor-features" level={3}>Advanced Features</SectionHeading>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white font-semibold">Syntax Highlighting</span>
              </div>
              <p className="text-zinc-400 text-sm mb-2">
                Automatically detects the programming language from the file extension and
                color-codes keywords, strings, comments, functions, and more.
                The detected language is shown at the top of the editor.
              </p>
              <p className="text-zinc-500 text-xs">
                Supported: Rust, Python, JavaScript, TypeScript, C/C++, Java, Go, HTML, CSS, JSON, YAML, TOML,
                Markdown, Shell, SQL, XML, Ruby, PHP, Swift, Kotlin, and more (20+ languages)
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+D</KeyBadge>
                <span className="text-white font-semibold">Multi-Cursor</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>Ctrl+D</KeyBadge> repeatedly on a word to add cursors at each
                occurrence of that word. Then type to edit all locations simultaneously.
                Great for renaming variables across a file.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+W</KeyBadge>
                <span className="text-white font-semibold">Word Wrap</span>
              </div>
              <p className="text-zinc-400 text-sm">
                When long lines extend beyond the screen, press <KeyBadge>Ctrl+W</KeyBadge> to
                wrap them at the screen boundary. Press again to unwrap.
                A "Wrap" indicator appears in the footer when active.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Ctrl+G</KeyBadge>
                <span className="text-white font-semibold">Go to Line</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Enter a line number to jump there directly.
                Handy when an error message tells you the exact line number of a problem.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white font-semibold">Editor Header Info</span>
              </div>
              <p className="text-zinc-400 text-sm">
                The editor header shows: filename, detected language, cursor position (line/column),
                and undo count. A ✻ mark appears before the filename when there are unsaved changes.
              </p>
            </div>
          </div>

          <TipBox>
            Most editor shortcuts are identical to Notepad or VS Code.
            Start with just <KeyBadge>Ctrl+S</KeyBadge> (save), <KeyBadge>Ctrl+Z</KeyBadge> (undo),
            and <KeyBadge>Ctrl+F</KeyBadge> (find) — that's enough to get going.
            You'll pick up the rest naturally as needed.
          </TipBox>
        </>
      )}
    </section>
  )
}
