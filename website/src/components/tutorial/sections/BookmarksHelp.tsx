import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function BookmarksHelp() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="bookmarks-help">{t('Bookmarks & Help', '북마크 & 도움말')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          {/* ========== Go to Path 다이얼로그 ========== */}
          <SectionHeading id="goto-dialog" level={3}>경로 이동 (Go to Path)</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            <KeyBadge>/</KeyBadge> 키를 누르면 열리는 "Go to Path" 다이얼로그는
            경로 입력, 북마크 이동, 저장된 원격 서버 접속을 한곳에서 할 수 있는 통합 이동 창입니다.
          </p>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            이 다이얼로그는 입력 내용에 따라 <strong className="text-white">두 가지 모드</strong>로 자동 전환됩니다:
          </p>

          <div className="grid gap-4 mb-6 sm:grid-cols-2">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">경로 입력 모드</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/</code> 또는 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~</code>로 시작하는 경로를 입력하면 활성화됩니다.
                디렉토리 내용을 자동완성 목록으로 보여줍니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">북마크 검색 모드</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                그 외의 입력(빈 입력 포함)일 때 활성화됩니다.
                저장된 북마크와 원격 서버 프로필 목록을 보여주고, 입력으로 필터링할 수 있습니다.
              </p>
            </div>
          </div>

          {/* ===== 경로 입력 모드 상세 ===== */}
          <SectionHeading id="goto-path-mode" level={3}>경로 자동완성</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            경로를 직접 타이핑하면 해당 디렉토리의 내용이 자동완성 목록으로 나타납니다.
            파일명 일부만 입력해도 일치하는 항목이 필터링됩니다.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Tab</KeyBadge>
                <span className="text-white font-semibold">자동완성 적용</span>
              </div>
              <p className="text-zinc-400 text-sm">
                목록에서 선택된 항목을 경로에 적용합니다.
                일치하는 항목이 하나뿐이면 즉시 적용되고, 여러 개이면 공통 접두어까지 적용한 뒤 목록을 보여줍니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge>
                <span className="text-white font-semibold">목록 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                자동완성 목록에서 위아래로 이동합니다. 목록의 끝에서 반대쪽 끝으로 순환됩니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Enter</KeyBadge>
                <span className="text-white font-semibold">이동 실행</span>
              </div>
              <p className="text-zinc-400 text-sm">
                목록이 보이면 선택된 항목을 적용한 뒤 해당 경로로 이동합니다.
                경로가 폴더이면 해당 폴더로, 파일이면 파일이 있는 폴더로 이동하면서 커서를 해당 파일에 맞춥니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">닫기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                자동완성 목록이 보이면 목록만 닫고, 다시 누르면 다이얼로그를 닫습니다.
              </p>
            </div>
          </div>

          <TipBox>
            <KeyBadge>~</KeyBadge>를 입력하면 홈 디렉토리 경로로 자동 확장됩니다.
            예를 들어 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/Documents</code>처럼 입력하면
            홈 폴더 아래의 Documents로 바로 이동할 수 있습니다.
          </TipBox>

          {/* ===== 북마크 검색 모드 상세 ===== */}
          <SectionHeading id="goto-bookmark-mode" level={3}>북마크 목록</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            <KeyBadge>/</KeyBadge>를 눌러 다이얼로그를 열면, 기본으로 저장된 북마크와 원격 서버 프로필 목록이 표시됩니다.
            글자를 입력하면 목록이 실시간으로 필터링됩니다.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge>
                <span className="text-white font-semibold">목록 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                북마크 목록에서 위아래로 이동합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex gap-1"><KeyBadge>Tab</KeyBadge> 또는 <KeyBadge>Enter</KeyBadge></span>
                <span className="text-white font-semibold">선택한 항목으로 이동</span>
              </div>
              <p className="text-zinc-400 text-sm">
                로컬 북마크를 선택하면 해당 폴더로 바로 이동합니다.
                원격 서버 프로필을 선택하면 서버에 연결합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-zinc-400 text-sm font-mono">문자 입력</span>
                <span className="text-white font-semibold">검색 필터</span>
              </div>
              <p className="text-zinc-400 text-sm">
                글자를 입력하면 북마크 이름에 해당 글자가 포함된 항목만 필터링됩니다.
                예를 들어 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">proj</code>를 입력하면
                경로에 "proj"가 포함된 북마크만 표시됩니다.
              </p>
            </div>
          </div>

          {/* ===== 북마크 관리 ===== */}
          <SectionHeading id="bookmark-manage" level={3}>북마크 관리</SectionHeading>

          <h4 className="text-white font-semibold mb-3">북마크 추가/제거</h4>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            북마크를 추가하는 방법은 두 가지입니다:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">방법 1: 파일 목록에서 직접 추가</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                북마크하고 싶은 폴더에서 <KeyBadge>'</KeyBadge> (작은따옴표) 키를 누릅니다.
                현재 폴더가 북마크에 추가됩니다. 이미 북마크된 폴더에서 다시 누르면 북마크가 해제됩니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">방법 2: Go to Path 다이얼로그 안에서 추가</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                <KeyBadge>/</KeyBadge>를 눌러 다이얼로그를 연 상태에서도 <KeyBadge>'</KeyBadge>를 누르면
                현재 패널의 경로를 북마크에 추가(또는 해제)합니다.
                원격 서버에 연결된 패널이라면 원격 경로가 북마크됩니다.
              </p>
            </div>
          </div>

          <h4 className="text-white font-semibold mb-3">북마크 삭제</h4>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Ctrl+D</KeyBadge>
              <span className="text-white font-semibold">선택한 북마크 삭제</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Go to Path 다이얼로그의 북마크 목록에서 삭제하고 싶은 항목에 커서를 놓고
              <KeyBadge>Ctrl+D</KeyBadge>를 누르면 해당 북마크가 즉시 삭제됩니다.
              원격 서버 프로필을 삭제하면 저장된 접속 정보도 함께 제거됩니다.
            </p>
          </div>

          <h4 className="text-white font-semibold mb-3">원격 서버 프로필 편집</h4>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Ctrl+E</KeyBadge>
              <span className="text-white font-semibold">원격 프로필 편집</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              북마크 목록에서 원격 서버 항목에 커서를 놓고 <KeyBadge>Ctrl+E</KeyBadge>를 누르면
              해당 서버의 접속 정보(호스트, 포트, 사용자, 인증 방식 등)를 수정할 수 있는 편집 화면이 열립니다.
              비밀번호나 키 파일 경로를 변경해야 할 때 유용합니다.
            </p>
          </div>

          <TipBox>
            북마크는 설정 파일에 자동 저장되어 cokacdir를 종료한 뒤 다시 실행해도 유지됩니다.
            자주 쓰는 폴더 2-3개만 북마크해두면 일상적인 파일 관리가 훨씬 빨라집니다.
          </TipBox>

          {/* ===== 도움말 ===== */}
          <SectionHeading id="help-screen" level={3}>도움말 화면</SectionHeading>
          <p className="text-zinc-400 mb-4">
            사용 중에 "이 키가 뭐였지?" 싶을 때 도움말을 바로 확인할 수 있습니다.
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>H</KeyBadge>
                <span className="text-white font-semibold">도움말 열기</span>
              </div>
              <p className="text-zinc-400 text-sm">
                <KeyBadge>H</KeyBadge>를 누르면 현재 화면에서 사용할 수 있는 모든 단축키 목록이 표시됩니다.
                위아래 화살표나 <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge>으로 스크롤할 수 있습니다.
                다 봤으면 <KeyBadge>Esc</KeyBadge>나 <KeyBadge>Q</KeyBadge> 또는 <KeyBadge>H</KeyBadge>를 다시 눌러 닫습니다.
              </p>
            </div>
          </div>

          <SectionHeading id="quit" level={3}>프로그램 종료</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Q</KeyBadge>
              <span className="text-white font-semibold">cokacdir 종료</span>
            </div>
            <p className="text-zinc-400 text-sm">
              메인 파일 목록 화면에서 <KeyBadge>Q</KeyBadge>를 누르면 cokacdir가 종료되고
              원래 터미널 화면으로 돌아갑니다.
            </p>
          </div>

          <TipBox>
            언제든 <KeyBadge>H</KeyBadge>를 누르면 도움말이 나오니 단축키를 무리해서 외울 필요가 없습니다.
            자주 쓰는 키는 자연스럽게 손에 익고, 가끔 쓰는 키는 그때그때 <KeyBadge>H</KeyBadge>로 확인하면 됩니다.
          </TipBox>
        </>
      ) : (
        <>
          {/* ========== Go to Path dialog ========== */}
          <SectionHeading id="goto-dialog" level={3}>Go to Path</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Press <KeyBadge>/</KeyBadge> to open the "Go to Path" dialog —
            a unified navigation hub for path input, bookmark access, and saved remote server connections.
          </p>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            The dialog automatically switches between <strong className="text-white">two modes</strong> based on what you type:
          </p>

          <div className="grid gap-4 mb-6 sm:grid-cols-2">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Path Input Mode</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Activated when input starts with <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/</code> or <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~</code>.
                Shows directory contents as autocomplete suggestions.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Bookmark Search Mode</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Activated for all other input (including empty input).
                Shows saved bookmarks and remote server profiles, filterable by typing.
              </p>
            </div>
          </div>

          {/* ===== Path input mode ===== */}
          <SectionHeading id="goto-path-mode" level={3}>Path Autocomplete</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            When you type a path, the dialog shows directory contents as an autocomplete list.
            You only need to type part of a name to filter matching items.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Tab</KeyBadge>
                <span className="text-white font-semibold">Apply Autocomplete</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Applies the selected item to the path.
                If only one match exists, it's applied immediately. If multiple matches exist, the common prefix is filled in and the list is shown.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge>
                <span className="text-white font-semibold">Navigate List</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Move up and down through the autocomplete list. Wraps around at the ends.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Enter</KeyBadge>
                <span className="text-white font-semibold">Go to Path</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Applies the selected completion and navigates to the path.
                If the path is a folder, it opens that folder. If it's a file, it opens the parent folder with the cursor on that file.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Esc</KeyBadge>
                <span className="text-white font-semibold">Close</span>
              </div>
              <p className="text-zinc-400 text-sm">
                If the autocomplete list is visible, hides it first. Press again to close the dialog entirely.
              </p>
            </div>
          </div>

          <TipBox>
            Typing <KeyBadge>~</KeyBadge> automatically expands to your home directory path.
            For example, type <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/Documents</code> to
            navigate directly to Documents under your home folder.
          </TipBox>

          {/* ===== Bookmark search mode ===== */}
          <SectionHeading id="goto-bookmark-mode" level={3}>Bookmark List</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            When you open the dialog with <KeyBadge>/</KeyBadge>, it starts in bookmark mode by default,
            showing your saved bookmarks and remote server profiles. Type to filter the list in real time.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge>
                <span className="text-white font-semibold">Navigate List</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Move up and down through the bookmark list.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex gap-1"><KeyBadge>Tab</KeyBadge> or <KeyBadge>Enter</KeyBadge></span>
                <span className="text-white font-semibold">Go to Selection</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Jumps to the selected local bookmark, or connects to the selected remote server profile.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-zinc-400 text-sm font-mono">Type characters</span>
                <span className="text-white font-semibold">Search Filter</span>
              </div>
              <p className="text-zinc-400 text-sm">
                As you type, only bookmarks containing the typed characters are shown.
                For example, type <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">proj</code> to
                see only bookmarks with "proj" in their path.
              </p>
            </div>
          </div>

          {/* ===== Bookmark management ===== */}
          <SectionHeading id="bookmark-manage" level={3}>Managing Bookmarks</SectionHeading>

          <h4 className="text-white font-semibold mb-3">Adding / Removing Bookmarks</h4>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            There are two ways to add a bookmark:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Method 1: From the File List</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Navigate to the folder you want to bookmark and press <KeyBadge>'</KeyBadge> (single quote).
                The current folder is added to bookmarks. Press again on an already bookmarked folder to remove it.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="text-white font-semibold mb-2">Method 2: Inside the Go to Path Dialog</div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                You can also press <KeyBadge>'</KeyBadge> while the dialog is open to
                add (or remove) the current panel's path as a bookmark.
                If the panel is connected to a remote server, the remote path is bookmarked.
              </p>
            </div>
          </div>

          <h4 className="text-white font-semibold mb-3">Deleting Bookmarks</h4>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Ctrl+D</KeyBadge>
              <span className="text-white font-semibold">Delete Selected Bookmark</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              In the Go to Path dialog's bookmark list, move the cursor to the item you want to remove
              and press <KeyBadge>Ctrl+D</KeyBadge>. The bookmark is deleted immediately.
              Deleting a remote server profile also removes the saved connection credentials.
            </p>
          </div>

          <h4 className="text-white font-semibold mb-3">Editing Remote Server Profiles</h4>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Ctrl+E</KeyBadge>
              <span className="text-white font-semibold">Edit Remote Profile</span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              In the bookmark list, move the cursor to a remote server entry
              and press <KeyBadge>Ctrl+E</KeyBadge> to open the connection editor.
              You can change the host, port, user, authentication method, password, or key file path.
            </p>
          </div>

          <TipBox>
            Bookmarks are automatically saved to your settings file and persist across cokacdir sessions.
            Bookmark just 2-3 frequently used folders and your daily file management becomes much faster.
          </TipBox>

          {/* ===== Help screen ===== */}
          <SectionHeading id="help-screen" level={3}>Help Screen</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Can't remember a shortcut? Pull up the help screen anytime.
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>H</KeyBadge>
                <span className="text-white font-semibold">Open Help</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Press <KeyBadge>H</KeyBadge> to see all available keyboard shortcuts for the current screen.
                Scroll with arrow keys or <KeyBadge>PgUp</KeyBadge><KeyBadge>PgDn</KeyBadge>.
                Close with <KeyBadge>Esc</KeyBadge>, <KeyBadge>Q</KeyBadge>, or press <KeyBadge>H</KeyBadge> again.
              </p>
            </div>
          </div>

          <SectionHeading id="quit" level={3}>Quitting the Program</SectionHeading>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>Q</KeyBadge>
              <span className="text-white font-semibold">Quit cokacdir</span>
            </div>
            <p className="text-zinc-400 text-sm">
              Press <KeyBadge>Q</KeyBadge> from the main file list screen to exit cokacdir
              and return to the regular terminal.
            </p>
          </div>

          <TipBox>
            You can always press <KeyBadge>H</KeyBadge> for help, so there's no need to memorize every shortcut.
            Frequently used keys will become muscle memory, and for rarely used ones, just check <KeyBadge>H</KeyBadge>.
          </TipBox>
        </>
      )}
    </section>
  )
}
