import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function ProcessManager() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="process-manager">{t('Process Manager', '프로세스 관리자')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            컴퓨터에서 지금 실행 중인 프로그램(프로세스)을 확인하고 관리할 수 있습니다.
            Windows의 "작업 관리자"나 macOS의 "활성 상태 보기"와 비슷한 기능입니다.
            프로그램이 멈추거나 컴퓨터가 느려질 때 어떤 프로그램이 자원을 많이 쓰는지 확인하고,
            필요하면 강제 종료할 수 있습니다.
          </p>

          <SectionHeading id="process-open" level={3}>프로세스 관리자 열기</SectionHeading>
          <StepByStep steps={[
            {
              title: 'P를 누릅니다',
              description: (
                <span>
                  <KeyBadge>P</KeyBadge>를 누르면 현재 실행 중인 프로그램 목록이 표시됩니다.
                  각 프로그램의 이름, CPU 사용량, 메모리 사용량이 나열됩니다.
                </span>
              ),
            },
            {
              title: '목록을 살펴봅니다',
              description: (
                <span>
                  <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge>로 목록을 탐색합니다.
                  CPU나 메모리를 많이 사용하는 프로그램이 있다면 해당 항목에서 수치가 높게 표시됩니다.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="process-sort" level={3}>정렬 방법</SectionHeading>
          <p className="text-zinc-400 mb-4">
            "어떤 프로그램이 CPU를 가장 많이 쓰고 있지?" 같은 질문에 답하려면 정렬을 활용하세요:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>C</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">CPU 사용량순</strong> — CPU를 많이 쓰는 프로그램이 위로 올라옵니다</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>M</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">메모리 사용량순</strong> — 메모리를 많이 쓰는 프로그램이 위로 올라옵니다</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>N</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">이름순</strong> — 프로그램 이름 순서로 정렬합니다</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>P</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">PID순</strong> — 프로세스 번호 순서로 정렬합니다 (고급)</span>
            </div>
          </div>

          <SectionHeading id="process-kill" level={3}>프로그램 강제 종료하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            프로그램이 응답하지 않거나 멈췄을 때, 강제로 종료할 수 있습니다:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>K</KeyBadge>
                <span className="text-white font-semibold">종료 요청</span>
              </div>
              <p className="text-zinc-400 text-sm">
                프로그램에게 "정상적으로 종료해달라"는 신호를 보냅니다.
                확인 창이 나오면 Y를 누르세요.
                대부분의 경우 이것으로 프로그램이 종료됩니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+K</KeyBadge>
                <span className="text-white font-semibold">강제 종료</span>
              </div>
              <p className="text-zinc-400 text-sm">
                프로그램이 종료 요청을 무시할 때 사용합니다.
                "무조건 즉시 끝내라"는 강력한 명령입니다.
                정상 종료(<KeyBadge>K</KeyBadge>)가 안 먹힐 때만 사용하세요.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>R</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">새로고침</strong> — 프로세스 목록을 최신 상태로 업데이트합니다</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">닫기</strong> — 프로세스 관리자를 닫고 파일 목록으로 돌아갑니다</span>
            </div>
          </div>

          <TipBox variant="warning">
            강제 종료(<KeyBadge>Shift+K</KeyBadge>)를 사용하면 프로그램이 작업 중이던 데이터를
            저장하지 못할 수 있습니다. 가급적 일반 종료(<KeyBadge>K</KeyBadge>)를 먼저 시도하세요.
          </TipBox>

          <TipBox>
            컴퓨터가 갑자기 느려졌다면 <KeyBadge>P</KeyBadge>로 프로세스 관리자를 열고
            <KeyBadge>C</KeyBadge>로 CPU순 정렬해보세요. 어떤 프로그램이 원인인지 금방 알 수 있습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            View and manage currently running programs (processes) on your computer.
            Similar to Windows "Task Manager" or macOS "Activity Monitor".
            When a program freezes or your computer slows down, you can check which program is using the most resources
            and force-quit it if needed.
          </p>

          <SectionHeading id="process-open" level={3}>Opening the Process Manager</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press P',
              description: (
                <span>
                  Press <KeyBadge>P</KeyBadge> to see a list of running programs.
                  Each entry shows the program name, CPU usage, and memory usage.
                </span>
              ),
            },
            {
              title: 'Browse the list',
              description: (
                <span>
                  Use <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> to scroll through the list.
                  Programs using a lot of CPU or memory will show high numbers.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="process-sort" level={3}>Sorting</SectionHeading>
          <p className="text-zinc-400 mb-4">
            To answer "Which program is using the most CPU?", use sorting:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>C</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Sort by CPU</strong> — Highest CPU usage at the top</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>M</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Sort by Memory</strong> — Highest memory usage at the top</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>N</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Sort by Name</strong> — Alphabetical order</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>P</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Sort by PID</strong> — Process ID order (advanced)</span>
            </div>
          </div>

          <SectionHeading id="process-kill" level={3}>Terminating Programs</SectionHeading>
          <p className="text-zinc-400 mb-4">
            When a program is unresponsive or frozen, you can force-quit it:
          </p>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>K</KeyBadge>
                <span className="text-white font-semibold">Graceful Terminate</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Sends a "please shut down gracefully" signal to the program.
                Press Y when prompted. This works in most cases.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Shift+K</KeyBadge>
                <span className="text-white font-semibold">Force Kill</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Use when the program ignores the graceful request.
                This is a forceful "terminate immediately" command.
                Only use when <KeyBadge>K</KeyBadge> doesn't work.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <KeyBadge>R</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Refresh</strong> — Update the process list to the latest state</span>
            </div>
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400"><strong className="text-white">Close</strong> — Close the process manager and return to the file list</span>
            </div>
          </div>

          <TipBox variant="warning">
            Force killing (<KeyBadge>Shift+K</KeyBadge>) may cause the program to lose unsaved data.
            Always try graceful termination (<KeyBadge>K</KeyBadge>) first.
          </TipBox>

          <TipBox>
            If your computer suddenly gets slow, open the process manager with <KeyBadge>P</KeyBadge> and
            sort by CPU with <KeyBadge>C</KeyBadge>. You'll quickly see which program is the culprit.
          </TipBox>
        </>
      )}
    </section>
  )
}
