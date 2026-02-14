import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function SortingFiltering() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="sorting-filtering">{t('Sorting Files', '파일 정렬하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            파일이 많을 때 원하는 파일을 빨리 찾으려면 정렬이 유용합니다.
            "가장 최근에 수정한 파일은 뭐지?", "가장 큰 파일은?" 같은 질문에 정렬 한 번이면 답이 나옵니다.
          </p>

          <p className="text-zinc-400 mb-4">
            정렬 키는 영어 단어의 첫 글자로 되어 있어서 쉽게 외울 수 있습니다:
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">이름순 정렬 (<span className="text-accent-cyan">N</span>ame)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                가나다(ABC) 순서로 정렬합니다. 기본 정렬 방식입니다.
                한 번 더 누르면 역순(Z→A)으로 바뀝니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>S</KeyBadge>
                <span className="text-white font-semibold">크기순 정렬 (<span className="text-accent-cyan">S</span>ize)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                파일 크기 순서로 정렬합니다. "디스크 공간을 많이 차지하는 파일이 뭐지?" 궁금할 때 유용합니다.
                한 번 더 누르면 역순으로 바뀝니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>D</KeyBadge>
                <span className="text-white font-semibold">날짜순 정렬 (<span className="text-accent-cyan">D</span>ate)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                수정된 날짜 순서로 정렬합니다. "방금 수정한 파일이 어디 있지?" 할 때
                <KeyBadge>D</KeyBadge>를 누르면 가장 최근 파일이 맨 위에 나옵니다.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Y</KeyBadge>
                <span className="text-white font-semibold">종류별 정렬 (t<span className="text-accent-cyan">Y</span>pe)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                파일 확장자(종류)별로 모아서 정렬합니다. .jpg끼리, .txt끼리, .pdf끼리 모여서 보입니다.
                "같은 종류의 파일을 한눈에 보고 싶다"할 때 유용합니다.
              </p>
            </div>
          </div>

          <TipBox>
            같은 키를 한 번 더 누르면 정렬 순서가 반대로 바뀝니다.
            예를 들어 <KeyBadge>D</KeyBadge>를 한 번 누르면 최신 파일이 위에,
            한 번 더 누르면 오래된 파일이 위에 옵니다.
            현재 정렬 방식은 화면 상단 헤더바에 표시됩니다.
          </TipBox>

          <TipBox variant="note">
            어떤 정렬을 하든 폴더는 항상 파일보다 위에 표시됩니다.
            정렬은 폴더끼리, 파일끼리 각각 적용됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            When you have many files, sorting helps you find what you need quickly.
            "What's the most recently modified file?" or "What's the largest file?" — one sort gives you the answer.
          </p>

          <p className="text-zinc-400 mb-4">
            Sort keys are based on the first letter of each English word, making them easy to remember:
          </p>

          <div className="space-y-4 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>N</KeyBadge>
                <span className="text-white font-semibold">Sort by <span className="text-accent-cyan">N</span>ame</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sorts alphabetically (A-Z). This is the default sort method.
                Press again to reverse (Z-A).
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>S</KeyBadge>
                <span className="text-white font-semibold">Sort by <span className="text-accent-cyan">S</span>ize</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sorts by file size. Useful when wondering "Which file is eating up disk space?"
                Press again to reverse order.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>D</KeyBadge>
                <span className="text-white font-semibold">Sort by <span className="text-accent-cyan">D</span>ate</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sorts by modification date. When you think "Where's that file I just edited?",
                press <KeyBadge>D</KeyBadge> and the most recent file appears at the top.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Y</KeyBadge>
                <span className="text-white font-semibold">Sort by t<span className="text-accent-cyan">Y</span>pe</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Groups files by extension (type). All .jpg files together, all .txt files together, etc.
                Useful when you want to "see all files of the same type at a glance".
              </p>
            </div>
          </div>

          <TipBox>
            Pressing the same key again reverses the sort order.
            For example, press <KeyBadge>D</KeyBadge> once for newest first,
            press again for oldest first.
            The current sort method is shown in the header bar at the top of the screen.
          </TipBox>

          <TipBox variant="note">
            Regardless of sort method, folders always appear above files.
            Sorting is applied separately to folders and files.
          </TipBox>
        </>
      )}
    </section>
  )
}
