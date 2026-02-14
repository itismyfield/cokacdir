import SectionHeading from '../ui/SectionHeading'
import TipBox from '../ui/TipBox'
import { useLanguage } from '../LanguageContext'

export default function InterfaceOverview() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="interface-overview">{t('Understanding the Interface', '화면 구성 이해하기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir를 실행하면 여러 정보가 한 화면에 표시됩니다. 처음에는 복잡해 보일 수 있지만,
            구성을 알고 나면 간단합니다. 화면이 어떻게 나뉘어 있는지 살펴봅시다.
          </p>

          {/* Visual layout diagram */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6 font-mono text-xs sm:text-sm">
            <div className="bg-accent-cyan/10 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
              <div>
                <span className="text-accent-cyan font-bold">Panel 1</span>
                <span className="text-zinc-500 mx-2">|</span>
                <span className="text-zinc-400">/home/user/Documents</span>
              </div>
              <span className="text-zinc-500 text-xs">Name Asc</span>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 border-b border-zinc-800/50 text-zinc-600 text-xs">
              {'\u2191'} 여기가 "헤더" — 현재 위치(경로)와 정렬 방식이 표시됩니다
            </div>
            <div className="px-4 py-3 space-y-1">
              <div className="text-primary-light">{'\u{1F4C1}'} <span className="text-primary-light">Photos/</span> <span className="text-zinc-600 text-xs ml-2">{'\u2190'} 폴더는 파란색</span></div>
              <div className="text-primary-light">{'\u{1F4C1}'} <span className="text-primary-light">Work/</span></div>
              <div className="flex justify-between items-center">
                <span className="text-white bg-accent-cyan/20 px-1 rounded">{'\u{1F4C4}'} resume.pdf</span>
                <span className="text-zinc-500 text-xs">340 KB</span>
              </div>
              <div className="px-4 text-zinc-600 text-xs">{'\u2191'} 하이라이트 = 현재 커서 위치 (이 파일이 "선택"된 상태)</div>
              <div className="flex justify-between">
                <span className="text-zinc-300">{'\u{1F4C4}'} notes.txt</span>
                <span className="text-zinc-500 text-xs">1.2 KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">{'\u{1F4C4}'} photo.jpg</span>
                <span className="text-zinc-500 text-xs">2.8 MB</span>
              </div>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 border-t border-zinc-800/50 text-zinc-600 text-xs">
              {'\u2191'} 파일 목록 영역 — 화살표 키로 위아래 이동
            </div>
            <div className="bg-bg-elevated border-t border-zinc-800 px-4 py-2 flex justify-between text-zinc-500 text-xs">
              <span>5 items</span>
              <span>3 files, 2 dirs</span>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 text-zinc-600 text-xs">
              {'\u2191'} 하단 상태바 — 현재 폴더의 파일/폴더 수
            </div>
          </div>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            정리하면, 화면은 위에서 아래로 이렇게 구성되어 있습니다:
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/50 flex items-center justify-center text-accent-cyan font-bold text-sm">1</div>
              <div>
                <h4 className="text-white font-semibold mb-1">헤더 바 (맨 위)</h4>
                <p className="text-zinc-400 text-sm">지금 어떤 폴더에 있는지(경로), 어떤 패널인지, 파일 정렬 방식이 표시됩니다. "내가 지금 어디에 있지?" 싶을 때 여기를 보면 됩니다.</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary-light font-bold text-sm">2</div>
              <div>
                <h4 className="text-white font-semibold mb-1">파일 목록 (가운데, 가장 넓은 영역)</h4>
                <p className="text-zinc-400 text-sm">
                  현재 폴더에 있는 파일과 하위 폴더가 나열됩니다. 폴더가 먼저 표시되고 그 아래에 파일이 이어집니다.
                  하이라이트(색이 다른 줄)가 현재 커서 위치입니다. 화살표 키로 이동할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/50 flex items-center justify-center text-accent-purple font-bold text-sm">3</div>
              <div>
                <h4 className="text-white font-semibold mb-1">상태 바 (맨 아래)</h4>
                <p className="text-zinc-400 text-sm">현재 폴더에 파일이 몇 개인지, 폴더가 몇 개인지 등의 요약 정보가 표시됩니다.</p>
              </div>
            </div>
          </div>

          <TipBox>
            처음에는 파일 목록에만 집중하세요. 위아래 화살표로 움직이고, Enter로 들어가고, Esc로 나오는 것만
            하다 보면 나머지 정보는 자연스럽게 눈에 들어올 겁니다.
          </TipBox>

          <TipBox variant="note">
            파일 이름 오른쪽에 표시되는 숫자는 파일 크기입니다. KB(킬로바이트), MB(메가바이트) 등으로
            표시되어 파일이 얼마나 큰지 바로 알 수 있습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            When you launch cokacdir, you'll see lots of information on one screen. It might look complex at first,
            but once you understand the layout, it's simple. Let's take a look at how the screen is organized.
          </p>

          {/* Visual layout diagram */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg overflow-hidden mb-6 font-mono text-xs sm:text-sm">
            <div className="bg-accent-cyan/10 border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
              <div>
                <span className="text-accent-cyan font-bold">Panel 1</span>
                <span className="text-zinc-500 mx-2">|</span>
                <span className="text-zinc-400">/home/user/Documents</span>
              </div>
              <span className="text-zinc-500 text-xs">Name Asc</span>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 border-b border-zinc-800/50 text-zinc-600 text-xs">
              {'\u2191'} This is the "header" — shows your current path and sort method
            </div>
            <div className="px-4 py-3 space-y-1">
              <div className="text-primary-light">{'\u{1F4C1}'} <span className="text-primary-light">Photos/</span> <span className="text-zinc-600 text-xs ml-2">{'\u2190'} Folders are blue</span></div>
              <div className="text-primary-light">{'\u{1F4C1}'} <span className="text-primary-light">Work/</span></div>
              <div className="flex justify-between items-center">
                <span className="text-white bg-accent-cyan/20 px-1 rounded">{'\u{1F4C4}'} resume.pdf</span>
                <span className="text-zinc-500 text-xs">340 KB</span>
              </div>
              <div className="px-4 text-zinc-600 text-xs">{'\u2191'} Highlight = current cursor position (this file is "selected")</div>
              <div className="flex justify-between">
                <span className="text-zinc-300">{'\u{1F4C4}'} notes.txt</span>
                <span className="text-zinc-500 text-xs">1.2 KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-300">{'\u{1F4C4}'} photo.jpg</span>
                <span className="text-zinc-500 text-xs">2.8 MB</span>
              </div>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 border-t border-zinc-800/50 text-zinc-600 text-xs">
              {'\u2191'} File list area — use arrow keys to move up and down
            </div>
            <div className="bg-bg-elevated border-t border-zinc-800 px-4 py-2 flex justify-between text-zinc-500 text-xs">
              <span>5 items</span>
              <span>3 files, 2 dirs</span>
            </div>
            <div className="px-4 py-1 bg-bg-elevated/50 text-zinc-600 text-xs">
              {'\u2191'} Status bar — file/folder count in current directory
            </div>
          </div>

          <p className="text-zinc-400 mb-6 leading-relaxed">
            In summary, the screen is organized from top to bottom like this:
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/50 flex items-center justify-center text-accent-cyan font-bold text-sm">1</div>
              <div>
                <h4 className="text-white font-semibold mb-1">Header Bar (top)</h4>
                <p className="text-zinc-400 text-sm">Shows your current folder path, which panel you're in, and the sort method. Look here when you wonder "Where am I right now?"</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-primary-light font-bold text-sm">2</div>
              <div>
                <h4 className="text-white font-semibold mb-1">File List (center, largest area)</h4>
                <p className="text-zinc-400 text-sm">
                  Lists all files and subfolders in the current directory. Folders appear first, followed by files.
                  The highlighted line is your current cursor position. Use arrow keys to move around.
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-bg-card border border-zinc-800 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/50 flex items-center justify-center text-accent-purple font-bold text-sm">3</div>
              <div>
                <h4 className="text-white font-semibold mb-1">Status Bar (bottom)</h4>
                <p className="text-zinc-400 text-sm">Shows summary info like how many files and folders are in the current directory.</p>
              </div>
            </div>
          </div>

          <TipBox>
            At first, just focus on the file list. Move up and down with arrow keys, enter with Enter, go back with Esc.
            The rest of the information will naturally become familiar as you use it.
          </TipBox>

          <TipBox variant="note">
            The numbers on the right side of file names indicate file size. They're shown in KB (kilobytes),
            MB (megabytes), etc., so you can quickly see how large a file is.
          </TipBox>
        </>
      )}
    </section>
  )
}
