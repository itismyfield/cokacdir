import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import StepByStep from '../ui/StepByStep'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function SearchFind() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="search-find">{t('Searching for Files', '파일 검색하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            "이 파일 어디에 뒀더라?" — 파일 이름은 기억나는데 어느 폴더에 있는지 모를 때가 있죠.
            cokacdir의 검색 기능은 현재 폴더와 모든 하위 폴더를 뒤져서 파일을 찾아줍니다.
          </p>

          <SectionHeading id="how-to-search" level={3}>검색하는 방법</SectionHeading>
          <StepByStep steps={[
            {
              title: 'F를 누릅니다',
              description: (
                <span>
                  <KeyBadge>F</KeyBadge>를 누르면 화면 상단에 검색어를 입력하는 창이 나타납니다.
                </span>
              ),
            },
            {
              title: '찾고 싶은 파일 이름을 입력합니다',
              description: (
                <span>
                  파일 이름의 일부만 입력해도 됩니다.
                  예를 들어 "report"라고 입력하면 이름에 "report"가 포함된 모든 파일이 검색됩니다
                  (report.pdf, report_2024.xlsx, my_report.docx 등).
                </span>
              ),
            },
            {
              title: '검색 결과를 확인합니다',
              description: (
                <span>
                  검색 결과가 목록으로 나타납니다. 각 결과 옆에 파일이 위치한 폴더 경로가 함께 표시되어
                  어디에 있는 파일인지 알 수 있습니다.
                </span>
              ),
            },
            {
              title: '원하는 파일로 이동합니다',
              description: (
                <span>
                  <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> 화살표로 원하는 결과를 선택하고
                  <KeyBadge>Enter</KeyBadge>를 누르면 그 파일이 있는 폴더로 바로 이동합니다.
                  검색을 닫으려면 <KeyBadge>Esc</KeyBadge>를 누르세요.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="search-tips" level={3}>검색 결과 화면에서 쓸 수 있는 키</SectionHeading>
          <p className="text-zinc-400 mb-4">
            검색 결과가 많을 때 빠르게 탐색하는 방법입니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">결과 목록에서 위아래로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>PgUp</KeyBadge> <KeyBadge>PgDn</KeyBadge>
              <span className="text-zinc-400">페이지 단위로 빠르게 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Home</KeyBadge>
              <span className="text-zinc-400">첫 번째 결과로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>End</KeyBadge>
              <span className="text-zinc-400">마지막 결과로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">선택한 파일이 있는 폴더로 바로 이동</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">검색 닫기</span>
            </div>
          </div>

          <SectionHeading id="goto-path" level={3}>경로로 바로 이동하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            검색과는 다른 기능입니다. 이미 알고 있는 폴더 경로로 바로 이동하고 싶을 때 사용합니다.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>/</KeyBadge>
              <span className="text-white font-semibold">경로 이동</span>
            </div>
            <p className="text-zinc-400 text-sm">
              <KeyBadge>/</KeyBadge>를 누르고 이동할 경로를 직접 입력합니다.
              예: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/home/user/Documents</code>
            </p>
          </div>

          <TipBox>
            <KeyBadge>F</KeyBadge>는 "파일 이름을 검색"할 때, <KeyBadge>/</KeyBadge>는 "가고 싶은 경로를 알고 있을 때" 사용합니다.
            파일 이름만 기억나면 <KeyBadge>F</KeyBadge>, 폴더 위치를 알면 <KeyBadge>/</KeyBadge>가 더 빠릅니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            "Where did I put that file?" — You remember the name but not the folder.
            cokacdir's search scans the current folder and all subfolders to find files for you.
          </p>

          <SectionHeading id="how-to-search" level={3}>How to Search</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press F',
              description: (
                <span>
                  Press <KeyBadge>F</KeyBadge> and a search input field appears at the top of the screen.
                </span>
              ),
            },
            {
              title: 'Type the file name you\'re looking for',
              description: (
                <span>
                  You only need to type part of the name.
                  For example, typing "report" will find all files containing "report" in their name
                  (report.pdf, report_2024.xlsx, my_report.docx, etc.).
                </span>
              ),
            },
            {
              title: 'Review the search results',
              description: (
                <span>
                  Results appear as a list. Each result shows the folder path next to it,
                  so you know exactly where each file is located.
                </span>
              ),
            },
            {
              title: 'Jump to the desired file',
              description: (
                <span>
                  Use <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> arrows to select a result and
                  press <KeyBadge>Enter</KeyBadge> to jump directly to that file's folder.
                  Press <KeyBadge>Esc</KeyBadge> to close the search.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="search-tips" level={3}>Keys Available in Search Results</SectionHeading>
          <p className="text-zinc-400 mb-4">
            When there are many search results, use these keys to navigate quickly:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge>
              <span className="text-zinc-400">Move up/down in results</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>PgUp</KeyBadge> <KeyBadge>PgDn</KeyBadge>
              <span className="text-zinc-400">Jump by page</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Home</KeyBadge>
              <span className="text-zinc-400">Jump to first result</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>End</KeyBadge>
              <span className="text-zinc-400">Jump to last result</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">Go to the selected file's folder</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">Close search</span>
            </div>
          </div>

          <SectionHeading id="goto-path" level={3}>Jump to a Path</SectionHeading>
          <p className="text-zinc-400 mb-4">
            This is different from search. Use it when you already know the folder path you want to go to.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <KeyBadge>/</KeyBadge>
              <span className="text-white font-semibold">Go to Path</span>
            </div>
            <p className="text-zinc-400 text-sm">
              Press <KeyBadge>/</KeyBadge> and type the path directly.
              Example: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">/home/user/Documents</code>
            </p>
          </div>

          <TipBox>
            Use <KeyBadge>F</KeyBadge> when you want to "search by file name", and <KeyBadge>/</KeyBadge> when you "know the path".
            Remember the name? Use <KeyBadge>F</KeyBadge>. Know the location? <KeyBadge>/</KeyBadge> is faster.
          </TipBox>
        </>
      )}
    </section>
  )
}
