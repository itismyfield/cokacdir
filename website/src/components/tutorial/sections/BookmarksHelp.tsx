import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function BookmarksHelp() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="bookmarks-help">{t('Bookmarks & Help', '북마크 & 도움말')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <SectionHeading id="bookmarks" level={3}>폴더 북마크</SectionHeading>
          <p className="text-zinc-400 mb-4">
            자주 가는 폴더가 있나요? 매번 폴더를 찾아 들어가는 대신 "북마크"에 등록해두면
            나중에 빠르게 이동할 수 있습니다. 웹 브라우저의 즐겨찾기와 비슷한 개념입니다.
          </p>
          <StepByStep steps={[
            {
              title: '북마크할 폴더로 이동합니다',
              description: '자주 방문하는 프로젝트 폴더, 다운로드 폴더 등으로 이동하세요.',
            },
            {
              title: "작은따옴표(') 키를 누릅니다",
              description: (
                <span>
                  <KeyBadge>'</KeyBadge>를 누르면 현재 폴더가 북마크에 추가됩니다.
                  이미 북마크된 폴더에서 다시 누르면 북마크가 해제됩니다.
                </span>
              ),
            },
            {
              title: '나중에 북마크 목록에서 바로 이동합니다',
              description: '북마크한 폴더는 저장되어 다음에 cokacdir를 실행할 때도 유지됩니다.',
            },
          ]} />

          <TipBox>
            자주 쓰는 폴더 2-3개만 북마크해두면 일상적인 파일 관리가 훨씬 빨라집니다.
            예를 들어 "프로젝트 폴더", "다운로드 폴더", "문서 폴더"를 북마크해보세요.
          </TipBox>

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
          <SectionHeading id="bookmarks" level={3}>Folder Bookmarks</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Have folders you visit often? Instead of navigating to them each time, add them to "bookmarks"
            for quick access later. It's like browser bookmarks, but for folders.
          </p>
          <StepByStep steps={[
            {
              title: 'Navigate to the folder you want to bookmark',
              description: 'Go to your frequently visited project folder, downloads folder, etc.',
            },
            {
              title: "Press the single quote (') key",
              description: (
                <span>
                  Press <KeyBadge>'</KeyBadge> to add the current folder to bookmarks.
                  Press again on an already bookmarked folder to remove it.
                </span>
              ),
            },
            {
              title: 'Jump to bookmarked folders later',
              description: 'Bookmarks are saved and persist across cokacdir sessions.',
            },
          ]} />

          <TipBox>
            Bookmark just 2-3 frequently used folders and your daily file management becomes much faster.
            For example, bookmark your "Project", "Downloads", and "Documents" folders.
          </TipBox>

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
