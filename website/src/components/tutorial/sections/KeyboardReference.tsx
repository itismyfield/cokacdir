import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

interface ShortcutGroup {
  en: string
  ko: string
  enDesc: string
  koDesc: string
  shortcuts: { key: React.ReactNode; en: string; ko: string }[]
}

const groups: ShortcutGroup[] = [
  {
    en: 'Navigation',
    ko: '이동',
    enDesc: 'Moving through the file list',
    koDesc: '파일 목록에서 돌아다니기',
    shortcuts: [
      { key: <><KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge></>, en: 'Move up/down', ko: '위아래로 이동' },
      { key: <KeyBadge>Enter</KeyBadge>, en: 'Open folder / View file', ko: '폴더 열기 / 파일 보기' },
      { key: <KeyBadge>Esc</KeyBadge>, en: 'Go to parent folder (back)', ko: '상위 폴더로 이동 (뒤로 가기)' },
      { key: <><KeyBadge>PgUp</KeyBadge> <KeyBadge>PgDn</KeyBadge></>, en: 'Jump 10 items', ko: '10개씩 건너뛰기' },
      { key: <><KeyBadge>Home</KeyBadge> <KeyBadge>End</KeyBadge></>, en: 'Jump to top / bottom', ko: '맨 위 / 맨 아래로' },
      { key: <KeyBadge>/</KeyBadge>, en: 'Go to path', ko: '경로를 입력해서 바로 이동' },
      { key: <KeyBadge>1</KeyBadge>, en: 'Go to home folder', ko: '홈 폴더로 이동' },
      { key: <KeyBadge>2</KeyBadge>, en: 'Refresh file list', ko: '파일 목록 새로고침' },
    ],
  },
  {
    en: 'Panels (Split View)',
    ko: '패널 (화면 나누기)',
    enDesc: 'View multiple folders at once',
    koDesc: '여러 폴더를 동시에 보기',
    shortcuts: [
      { key: <KeyBadge>0</KeyBadge>, en: 'Add new panel', ko: '새 패널 추가' },
      { key: <KeyBadge>9</KeyBadge>, en: 'Close current panel', ko: '현재 패널 닫기' },
      { key: <KeyBadge>Tab</KeyBadge>, en: 'Switch to next panel', ko: '다음 패널로 이동' },
      { key: <><KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge></>, en: 'Switch left/right panel', ko: '좌우 패널 전환' },
    ],
  },
  {
    en: 'File Selection',
    ko: '파일 선택',
    enDesc: 'Choose files to work with',
    koDesc: '작업할 파일 고르기',
    shortcuts: [
      { key: <KeyBadge>Space</KeyBadge>, en: 'Select / Deselect', ko: '선택 / 선택 해제' },
      { key: <KeyBadge>Ctrl+A</KeyBadge>, en: 'Select all', ko: '전체 선택' },
      { key: <KeyBadge>*</KeyBadge>, en: 'Select all / Deselect all', ko: '전체 선택 / 전체 해제' },
      { key: <KeyBadge>;</KeyBadge>, en: 'Select by extension', ko: '같은 확장자 파일 선택' },
      { key: <><KeyBadge>Shift</KeyBadge>+<KeyBadge>{'\u2191'}</KeyBadge>/<KeyBadge>{'\u2193'}</KeyBadge></>, en: 'Select while moving', ko: '이동하면서 선택' },
    ],
  },
  {
    en: 'Sorting',
    ko: '정렬',
    enDesc: 'Change file order',
    koDesc: '파일 순서 바꾸기',
    shortcuts: [
      { key: <KeyBadge>N</KeyBadge>, en: 'By Name', ko: '이름순 (Name)' },
      { key: <KeyBadge>S</KeyBadge>, en: 'By Size', ko: '크기순 (Size)' },
      { key: <KeyBadge>D</KeyBadge>, en: 'By Date', ko: '날짜순 (Date)' },
      { key: <KeyBadge>Y</KeyBadge>, en: 'By Type', ko: '종류별 (tYpe)' },
    ],
  },
  {
    en: 'File Operations',
    ko: '파일 작업',
    enDesc: 'Create, modify, delete',
    koDesc: '만들기, 바꾸기, 지우기',
    shortcuts: [
      { key: <KeyBadge>K</KeyBadge>, en: 'New folder', ko: '새 폴더 만들기' },
      { key: <KeyBadge>M</KeyBadge>, en: 'New file', ko: '새 파일 만들기' },
      { key: <KeyBadge>R</KeyBadge>, en: 'Rename', ko: '이름 바꾸기' },
      { key: <KeyBadge>E</KeyBadge>, en: 'Edit file', ko: '파일 편집' },
      { key: <KeyBadge>T</KeyBadge>, en: 'Create archive', ko: '압축 파일 만들기' },
      { key: <><KeyBadge>X</KeyBadge> / <KeyBadge>Del</KeyBadge></>, en: 'Delete', ko: '삭제' },
      { key: <KeyBadge>I</KeyBadge>, en: 'File info', ko: '파일 정보 보기' },
    ],
  },
  {
    en: 'Copy & Paste',
    ko: '복사 & 붙여넣기',
    enDesc: 'Copy and move files',
    koDesc: '파일 복사하고 옮기기',
    shortcuts: [
      { key: <KeyBadge>Ctrl+C</KeyBadge>, en: 'Copy', ko: '복사' },
      { key: <KeyBadge>Ctrl+X</KeyBadge>, en: 'Cut (move)', ko: '잘라내기 (이동)' },
      { key: <KeyBadge>Ctrl+V</KeyBadge>, en: 'Paste', ko: '붙여넣기' },
    ],
  },
  {
    en: 'Tools & Features',
    ko: '도구 & 기능',
    enDesc: 'Search, AI, diff, and more',
    koDesc: '검색, AI, 비교 등',
    shortcuts: [
      { key: <KeyBadge>F</KeyBadge>, en: 'File search', ko: '파일 검색' },
      { key: <KeyBadge>.</KeyBadge>, en: 'AI assistant', ko: 'AI 어시스턴트' },
      { key: <KeyBadge>G</KeyBadge>, en: 'Git view', ko: 'Git 화면' },
      { key: <KeyBadge>8</KeyBadge>, en: 'Folder diff', ko: '폴더 비교 (Diff)' },
      { key: <KeyBadge>7</KeyBadge>, en: 'Git log compare', ko: 'Git 로그 비교' },
      { key: <KeyBadge>P</KeyBadge>, en: 'Process manager', ko: '프로세스 관리자' },
      { key: <KeyBadge>'</KeyBadge>, en: 'Toggle bookmark', ko: '북마크 등록/해제' },
      { key: <KeyBadge>`</KeyBadge>, en: 'Settings', ko: '설정' },
      { key: <KeyBadge>H</KeyBadge>, en: 'Help', ko: '도움말' },
      { key: <KeyBadge>Q</KeyBadge>, en: 'Quit', ko: '종료' },
    ],
  },
]

export default function KeyboardReference() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="keyboard-reference">{t('Keyboard Shortcut Reference', '단축키 모아보기')}</SectionHeading>

      {lang === 'ko' ? (
        <p className="text-zinc-400 mb-6 leading-relaxed">
          지금까지 배운 모든 단축키를 한 곳에 모았습니다.
          처음에는 외울 필요 없이 필요할 때마다 이 페이지를 참고하세요.
          자주 쓰는 키는 금방 손에 익게 됩니다.
        </p>
      ) : (
        <p className="text-zinc-400 mb-6 leading-relaxed">
          All the shortcuts you've learned, collected in one place.
          No need to memorize them — just refer to this page whenever you need.
          Frequently used keys will quickly become second nature.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {groups.map((group) => (
          <div key={group.en} className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-bg-elevated border-b border-zinc-800">
              <h3 className="text-white font-semibold text-sm">{lang === 'en' ? group.en : group.ko}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">{lang === 'en' ? group.enDesc : group.koDesc}</p>
            </div>
            <div className="p-3 space-y-1.5">
              {group.shortcuts.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-2/5 flex-shrink-0">{s.key}</div>
                  <span className="text-zinc-400 text-sm">{lang === 'en' ? s.en : s.ko}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {lang === 'ko' ? (
        <>
          <TipBox>
            이 단축키들은 메인 파일 목록 화면에서 사용하는 키입니다.
            에디터, 뷰어, AI 화면 등 각 화면마다 고유한 단축키가 있으며,
            해당 화면에서 <KeyBadge>H</KeyBadge>를 누르면 그 화면의 단축키를 볼 수 있습니다.
          </TipBox>

          <div className="mt-8 p-6 bg-bg-card border border-zinc-800 rounded-lg text-center">
            <p className="text-zinc-400 mb-2">
              축하합니다! 튜토리얼을 모두 읽으셨습니다.
            </p>
            <p className="text-white font-semibold text-lg mb-3">
              이제 직접 사용해보면서 익숙해져 보세요.
            </p>
            <p className="text-zinc-500 text-sm">
              막히는 것이 있으면 언제든 <KeyBadge>H</KeyBadge>를 눌러 도움말을 확인하거나,
              이 페이지로 돌아와서 참고하세요.
            </p>
          </div>
        </>
      ) : (
        <>
          <TipBox>
            These shortcuts are for the main file list screen.
            Each screen (editor, viewer, AI, etc.) has its own shortcuts —
            press <KeyBadge>H</KeyBadge> in any screen to see its available shortcuts.
          </TipBox>

          <div className="mt-8 p-6 bg-bg-card border border-zinc-800 rounded-lg text-center">
            <p className="text-zinc-400 mb-2">
              Congratulations! You've finished the entire tutorial.
            </p>
            <p className="text-white font-semibold text-lg mb-3">
              Now try it yourself and get comfortable.
            </p>
            <p className="text-zinc-500 text-sm">
              If you get stuck, press <KeyBadge>H</KeyBadge> anytime for help,
              or come back to this page for reference.
            </p>
          </div>
        </>
      )}
    </section>
  )
}
