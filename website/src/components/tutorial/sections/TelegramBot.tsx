import SectionHeading from '../ui/SectionHeading'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function TelegramBot() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="telegram-bot">{t('Telegram Remote Control', 'Telegram \uc6d0\uaca9 \uc81c\uc5b4')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir의 AI 기능과 파일 관리 기능을 <strong className="text-white">Telegram 메신저</strong>를 통해 원격으로 사용할 수 있습니다.
            외출 중에 스마트폰으로 서버의 파일을 확인하거나, AI에게 질문하거나, 쉘 명령어를 실행하는 것이 가능합니다.
          </p>

          <TipBox variant="note">
            이 기능을 사용하려면 Telegram 계정과 Bot API 토큰이 필요합니다.
            아직 Telegram을 사용하지 않는다면 이 섹션은 건너뛰어도 됩니다.
          </TipBox>

          {/* ========== Bot 만들기 ========== */}
          <SectionHeading id="telegram-create-bot" level={3}>Telegram Bot 만들기</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            먼저 Telegram에서 나만의 Bot을 만들어야 합니다.
            Bot은 Telegram에서 자동으로 메시지를 주고받을 수 있는 특수한 계정입니다.
            Telegram이 공식 제공하는 <strong className="text-white">@BotFather</strong>라는 도구를 통해 만들 수 있으며,
            과정은 매우 간단합니다.
          </p>

          <StepByStep steps={[
            {
              title: 'Telegram 앱 설치',
              description: (
                <span>
                  아직 Telegram이 없다면 스마트폰(iOS/Android) 또는 PC에서 Telegram을 설치합니다.
                  계정 생성 시 전화번호 인증이 필요합니다.
                  이미 Telegram을 사용 중이라면 이 단계는 건너뛰세요.
                </span>
              )
            },
            {
              title: '@BotFather 검색하여 대화 시작',
              description: (
                <span>
                  Telegram 앱 상단의 검색창에 <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">@BotFather</code>를 입력합니다.
                  파란색 체크 표시가 있는 공식 계정을 선택하고, 대화 화면에서
                  <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">/start</code> 버튼을 누릅니다.
                  BotFather가 사용 가능한 명령어 목록과 함께 인사 메시지를 보내줍니다.
                </span>
              )
            },
            {
              title: '/newbot 명령어 입력',
              description: (
                <span>
                  BotFather에게 <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">/newbot</code>이라고 입력합니다.
                  BotFather가 새로운 Bot을 만들기 위한 질문을 시작합니다.
                </span>
              )
            },
            {
              title: 'Bot 이름 입력',
              description: (
                <span>
                  BotFather가 <strong className="text-zinc-300">"Alright, a new bot. How are we going to call it? Please choose a name for your bot."</strong>라고 물어봅니다.
                  Bot의 표시 이름을 입력합니다. 이것은 대화 목록에 보이는 이름으로, 자유롭게 정할 수 있습니다.
                  <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                    My Cokacdir Bot
                  </code>
                </span>
              )
            },
            {
              title: 'Bot 사용자명(username) 입력',
              description: (
                <span>
                  BotFather가 <strong className="text-zinc-300">"Good. Now let's choose a username for your bot. It must end in 'bot'."</strong>라고 물어봅니다.
                  Bot의 고유한 사용자명을 입력합니다. 반드시 <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">bot</code>으로 끝나야 합니다.
                  이미 사용 중인 이름이면 다른 이름을 시도하세요.
                  <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                    my_cokacdir_bot
                  </code>
                </span>
              )
            },
            {
              title: 'API 토큰 복사',
              description: (
                <span>
                  Bot 생성이 완료되면 BotFather가 축하 메시지와 함께 <strong className="text-white">API 토큰</strong>을 알려줍니다.
                  메시지 안에 다음과 같은 형태의 토큰이 있습니다:
                  <code className="block text-accent-cyan font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2 mb-2">
                    123456789:ABCdefGHIjklMNOpqrsTUVwxyz
                  </code>
                  이 토큰을 <strong className="text-zinc-300">길게 눌러서 복사</strong>해 두세요. 다음 단계에서 cokacdir에 등록할 때 사용합니다.
                </span>
              )
            },
          ]} />

          {/* BotFather 대화 시뮬레이션 */}
          <p className="text-zinc-400 mb-3 text-sm leading-relaxed">
            전체 과정을 대화로 보면 다음과 같습니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">나:</span>
                <code className="text-accent-cyan font-mono">/start</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">I can help you create and manage Telegram bots. ...</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">나:</span>
                <code className="text-accent-cyan font-mono">/newbot</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">Alright, a new bot. How are we going to call it? Please choose a name for your bot.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">나:</span>
                <span className="text-zinc-300">My Cokacdir Bot</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">나:</span>
                <span className="text-zinc-300">my_cokacdir_bot</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">
                  Done! Congratulations on your new bot. You will find it at t.me/my_cokacdir_bot.<br/>
                  Use this token to access the HTTP API:<br/>
                  <code className="text-accent-cyan font-mono bg-bg-elevated px-1.5 py-0.5 rounded">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>
                  <br/>Keep your token secure and store it safely.
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <p className="text-zinc-500 text-xs">
                {'↑'} 마지막 메시지의 <code className="text-accent-cyan font-mono">123456789:ABCdef...</code> 부분이 API 토큰입니다. 이것을 복사하세요.
              </p>
            </div>
          </div>

          <TipBox variant="warning">
            API 토큰은 비밀번호와 같습니다. 다른 사람에게 공유하지 마세요.
            토큰이 유출되면 누구나 여러분의 Bot을 조작할 수 있습니다.
            만약 토큰이 유출되었다면, BotFather에게 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">/revoke</code>를 보내서 토큰을 재발급 받으세요.
          </TipBox>

          {/* ========== 플랫폼별 준비사항 ========== */}
          <SectionHeading id="telegram-setup" level={3}>서버 설정 및 시작</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Bot 서버는 cokacdir가 설치된 컴퓨터에서 실행됩니다.
            운영체제에 따라 준비 방법이 다르므로, 해당하는 플랫폼의 안내를 따라주세요.
          </p>

          {/* 플랫폼별 안내 */}
          <div className="space-y-4 mb-6">
            {/* macOS */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center flex-shrink-0">{'🍎'}</span>
                macOS
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                macOS에서는 별도의 준비 없이 바로 사용할 수 있습니다.
                <strong className="text-zinc-300"> Terminal.app</strong> 또는 <strong className="text-zinc-300">iTerm2</strong>를 열고 아래 명령어를 실행하세요.
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
                <div className="text-zinc-500 mb-1"># 서버 시작</div>
                <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                macOS의 경로 예시: <code className="font-mono">/Users/username/Documents</code>
              </p>
            </div>

            {/* Linux */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 text-sm flex items-center justify-center flex-shrink-0">{'🐧'}</span>
                Linux
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                Linux에서도 별도의 준비 없이 바로 사용할 수 있습니다.
                Ubuntu, Debian, Fedora, Arch 등 모든 배포판에서 동작합니다.
                터미널을 열고 아래 명령어를 실행하세요.
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
                <div className="text-zinc-500 mb-1"># 서버 시작</div>
                <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                Linux의 경로 예시: <code className="font-mono">/home/username/projects</code>
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mt-3">
                <div className="text-zinc-500 mb-1">서버/헤드리스 환경에서 실행</div>
                <p className="text-zinc-400 leading-relaxed">
                  GUI가 없는 서버에서도 Bot 서버를 실행할 수 있습니다.
                  SSH로 서버에 접속한 뒤 동일한 명령어를 사용하면 됩니다.
                  서버가 재부팅되어도 자동으로 시작하려면 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">systemd</code> 서비스를 등록하거나
                  <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">crontab</code>에 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">@reboot</code> 항목을 추가하세요.
                </p>
              </div>
            </div>

            {/* Windows */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-sm flex items-center justify-center flex-shrink-0">{'🪟'}</span>
                Windows (WSL 필수)
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                cokacdir는 Unix 기반 프로그램이므로, Windows에서는 <strong className="text-white">WSL (Windows Subsystem for Linux)</strong>을 통해 실행해야 합니다.
                WSL은 Windows 안에서 Linux 환경을 실행할 수 있게 해주는 공식 기능입니다.
              </p>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
                <div className="text-zinc-400 font-semibold mb-2">WSL이 아직 설치되지 않은 경우:</div>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  <strong className="text-zinc-300">PowerShell</strong>을 <strong className="text-zinc-300">관리자 권한</strong>으로 열고 다음 명령어를 실행합니다:
                </p>
                <code className="block text-accent-cyan font-mono bg-bg-card px-3 py-2 rounded">
                  wsl --install
                </code>
                <p className="text-zinc-400 mt-2 leading-relaxed">
                  설치가 완료되면 컴퓨터를 재시작합니다. 재시작 후 자동으로 Ubuntu가 설치되며,
                  사용자 이름과 비밀번호를 설정하라는 안내가 나옵니다.
                </p>
              </div>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
                <div className="text-zinc-400 font-semibold mb-2">WSL에서 cokacdir 실행:</div>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  시작 메뉴에서 <strong className="text-zinc-300">Ubuntu</strong> (또는 설치한 Linux 배포판)를 실행합니다.
                  열리는 터미널이 Linux 환경입니다. 여기서 cokacdir를 설치하고 Bot 서버를 실행합니다.
                </p>
                <div className="font-mono">
                  <div className="text-zinc-500 mb-1"># WSL 터미널에서 실행</div>
                  <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
                </div>
              </div>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
                <div className="text-zinc-400 font-semibold mb-2">Windows 파일에 접근하기:</div>
                <p className="text-zinc-400 leading-relaxed">
                  WSL 안에서 Windows의 파일에 접근할 수 있습니다.
                  Windows의 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">C:\Users\username\Documents</code> 폴더는
                  WSL에서 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">/mnt/c/Users/username/Documents</code> 경로로 접근 가능합니다.
                </p>
                <code className="block text-zinc-500 font-mono text-xs bg-bg-card px-3 py-2 rounded mt-2">
                  /start /mnt/c/Users/username/Documents
                </code>
              </div>
            </div>
          </div>

          <TipBox variant="note">
            모든 플랫폼에서 공통으로 <strong className="text-zinc-300">Claude CLI</strong>가 설치되어 있어야 AI 기능이 동작합니다.
            Claude CLI가 없으면 Bot 서버는 시작되지만, AI 질문에는 에러가 발생합니다.
          </TipBox>

          {/* 백그라운드 실행 */}
          <h4 className="text-white font-semibold mt-6 mb-3">백그라운드에서 계속 실행하기</h4>
          <p className="text-zinc-400 mb-4 leading-relaxed text-sm">
            터미널을 닫아도 Bot 서버가 계속 동작하게 하려면 백그라운드 실행을 사용합니다.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono mb-3">
              <div className="text-zinc-500 mb-1"># 백그라운드 실행 (macOS, Linux, WSL 공통)</div>
              <div className="text-accent-cyan">nohup cokacdir --ccserver YOUR_BOT_TOKEN &amp;</div>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono mb-3">
              <div className="text-zinc-500 mb-1"># 실행 중인 Bot 서버 확인</div>
              <div className="text-accent-cyan">ps aux | grep ccserver</div>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
              <div className="text-zinc-500 mb-1"># Bot 서버 종료</div>
              <div className="text-accent-cyan">pkill -f "cokacdir --ccserver"</div>
            </div>
          </div>

          <TipBox>
            여러 봇을 동시에 운영하려면 토큰을 여러 개 전달하세요:
            <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">cokacdir --ccserver TOKEN1 TOKEN2</code>
          </TipBox>

          {/* ========== 사용 가능한 명령어 ========== */}
          <SectionHeading id="telegram-commands" level={3}>사용 가능한 명령어</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Telegram Bot에서 사용할 수 있는 명령어들입니다.
          </p>

          <div className="space-y-3 mb-6">
            {/* /start */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/start [path]</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                AI 세션을 시작합니다. <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">path</code>는 작업할 디렉토리 경로입니다.
                이미 해당 경로의 세션이 있으면 자동으로 복원되고, 마지막 5개의 대화 내역이 표시됩니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                경로 없이 <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code>만 입력하면
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/workspace/</code> 아래에 임시 작업 디렉토리가 자동 생성됩니다.
                경로를 몰라도 바로 시작할 수 있습니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">~</code> (틸드) 경로도 지원됩니다.
                예를 들어 <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start ~/project</code>는
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start /home/user/project</code>로 자동 변환됩니다.
              </p>
              <div className="bg-bg-elevated rounded p-3 mt-2 space-y-1">
                <code className="block text-zinc-500 font-mono text-sm">/start</code>
                <code className="block text-zinc-500 font-mono text-sm">/start ~/mywork</code>
                <code className="block text-zinc-500 font-mono text-sm">/start /home/user/project</code>
              </div>
            </div>

            {/* /help */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/help</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                사용 가능한 모든 명령어와 상세한 사용 방법을 보여줍니다.
              </p>
            </div>

            {/* /stop */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/stop</code>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                현재 진행 중인 AI 요청을 <strong className="text-white">즉시 중단</strong>합니다.
                AI가 긴 작업을 수행하고 있거나, 잘못된 방향으로 진행되고 있을 때 사용합니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                중단하면 그때까지 생성된 부분 응답이 <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">[Stopped]</code> 표시와 함께 보존됩니다.
                대화 히스토리에도 기록되므로 맥락이 유지됩니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                AI 응답이 진행 중이 아닐 때 <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/stop</code>을 입력하면
                "No active request to stop."이라고 안내됩니다.
              </p>
              <div className="bg-bg-elevated rounded p-3 mt-3 space-y-1 text-sm">
                <p className="text-zinc-500 mb-2">사용 예시:</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                  <span className="text-zinc-300">이 프로젝트 전체를 리팩토링해줘</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">🕐 Processing...</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                  <code className="text-red-400 font-mono">/stop</code>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(부분 응답) [Stopped]</span>
                </div>
              </div>
            </div>

            {/* /clear */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/clear</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                현재 AI 세션을 초기화합니다. 대화 기록이 삭제되고 새로운 대화를 시작할 수 있습니다.
              </p>
            </div>

            {/* /pwd */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/pwd</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                현재 세션이 바라보고 있는 작업 디렉토리 경로를 확인합니다.
              </p>
            </div>

            {/* /down */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/down &lt;filepath&gt;</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                서버의 파일을 Telegram으로 다운로드합니다. 절대 경로 또는 현재 세션 경로 기준 상대 경로를 사용할 수 있습니다.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /down report.txt
              </code>
            </div>

            {/* ! 쉘 명령어 */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">!&lt;command&gt;</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                쉘 명령어를 직접 실행합니다. 현재 세션 경로를 작업 디렉토리로 사용합니다.
                사용자 입력이 필요한 명령어(예: <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">read</code>)는 자동으로 종료됩니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code> 이전에도 쉘 명령어를 사용할 수 있으며,
                이 경우 홈 디렉토리를 기본 작업 경로로 사용합니다.
                예를 들어 <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">!pwd</code>를 입력하면 홈 디렉토리 경로가 출력됩니다.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                !ls -la
              </code>
            </div>

            {/* 파일 업로드 */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent-cyan font-semibold">File / Photo Upload</span>
                <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">ENHANCED</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Telegram에서 파일이나 사진을 보내면 현재 세션 경로에 자동으로 저장됩니다.
                스마트폰의 사진이나 문서를 서버로 빠르게 전송할 때 유용합니다.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                업로드된 파일 정보는 <strong className="text-white">AI 대화 맥락에 자동으로 기록</strong>됩니다.
                따라서 파일을 업로드한 후 "방금 올린 파일 분석해줘"라고 말하면, AI가 파일의 이름과 경로를 자동으로 인지합니다.
              </p>

              <div className="bg-bg-elevated rounded p-3 mt-3 mb-3">
                <p className="text-zinc-500 text-xs font-semibold mb-2">캡션(설명) 활용</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  파일을 보낼 때 <strong className="text-white">캡션(설명)</strong>을 함께 입력하면,
                  파일 저장 후 캡션이 AI에게 바로 전달됩니다.
                  별도의 메시지를 보낼 필요 없이 <strong className="text-zinc-300">파일 업로드 + 지시를 한 번에</strong> 할 수 있습니다.
                </p>
              </div>

              <div className="bg-bg-elevated rounded p-3 mb-3">
                <p className="text-zinc-500 text-xs font-semibold mb-2">여러 파일 업로드</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  여러 파일을 한 번에 보내도 모든 파일이 순서대로 저장되고 기록됩니다.
                  이후 텍스트 메시지를 보내면 <strong className="text-zinc-300">모든 파일 정보가 한꺼번에</strong> AI에게 전달됩니다.
                </p>
              </div>

              <div className="bg-bg-elevated rounded p-3 space-y-1 text-sm">
                <p className="text-zinc-500 mb-2">사용 예시 1: 파일 먼저 업로드 → 이후 요청</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                  <span className="text-zinc-300">(data.csv 파일 전송)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">Saved: /home/user/project/data.csv (1234 bytes)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                  <span className="text-zinc-300">방금 올린 파일 분석해줘</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(AI가 data.csv의 경로를 자동으로 인지하고 분석 수행)</span>
                </div>
              </div>

              <div className="bg-bg-elevated rounded p-3 space-y-1 text-sm mt-3">
                <p className="text-zinc-500 mb-2">사용 예시 2: 캡션과 함께 업로드 (한 번에 처리)</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                  <span className="text-zinc-300">(error_log.txt 전송 + 캡션: "이 로그에서 에러 원인을 찾아줘")</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">Saved: /home/user/project/error_log.txt (5678 bytes)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(AI가 즉시 error_log.txt를 읽고 에러 분석 시작)</span>
                </div>
              </div>
            </div>

            {/* 일반 텍스트 */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent-cyan font-semibold">General Text</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                명령어가 아닌 일반 텍스트를 입력하면 AI에게 전달됩니다.
                AI의 응답은 실시간으로 스트리밍되어 표시됩니다.
              </p>
            </div>
          </div>

          {/* ========== AI 도구 관리 ========== */}
          <SectionHeading id="telegram-tools" level={3}>AI 도구 관리</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Claude AI가 사용할 수 있는 도구(Tool)를 확인하고 동적으로 추가/제거할 수 있습니다.
            기본적으로 17개의 도구가 활성화되어 있으며, 필요에 따라 조정할 수 있습니다.
          </p>

          <div className="space-y-3 mb-6">
            {/* /availabletools */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/availabletools</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                사용 가능한 모든 도구 목록을 설명과 함께 표시합니다.
                각 도구가 어떤 기능을 하는지 확인할 때 유용합니다.
              </p>
            </div>

            {/* /allowedtools */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowedtools</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                현재 AI에게 허용된 도구 목록을 표시합니다. 번호가 매겨진 목록으로 보여줍니다.
              </p>
            </div>

            {/* /allowed +toolname */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowed +toolname</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                도구를 허용 목록에 추가합니다.
                도구 이름은 자동으로 정규화됩니다 (예: <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">bash</code> → <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">Bash</code>).
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /allowed +Bash
              </code>
            </div>

            {/* /allowed -toolname */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowed -toolname</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                도구를 허용 목록에서 제거합니다. 제거된 도구는 AI가 더 이상 사용할 수 없습니다.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /allowed -Bash
              </code>
            </div>
          </div>

          <TipBox>
            도구 설정은 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">~/.cokacdir/bot_settings.json</code>에 자동 저장되므로
            봇을 재시작해도 유지됩니다.
          </TipBox>

          <TipBox variant="warning">
            <code className="text-accent-cyan font-mono">Bash</code> 도구를 제거하면 AI가 쉘 명령어를 실행할 수 없게 됩니다.
            보안이 중요한 환경에서는 필요한 도구만 남기고 나머지를 제거하는 것을 고려하세요.
          </TipBox>

          {/* ========== 실전 사용 워크플로우 ========== */}
          <SectionHeading id="telegram-workflow" level={3}>실전 사용 워크플로우</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            실제로 어떻게 활용하는지 구체적인 예시를 통해 알아봅시다.
          </p>

          {/* 워크플로우 1: 빠른 시작 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">1</span>
              경로 없이 바로 시작하기
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/.cokacdir/workspace/a1b2c3.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">!ls</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">(빈 디렉토리)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">간단한 Python hello world 스크립트를 만들어줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 hello.py 파일을 생성)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 2: 프로젝트 파일 확인 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">2</span>
              프로젝트 파일 확인하기
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/my-project</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/my-project.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">!ls -la</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">drwxr-xr-x 5 user user 4096 ... src/<br/>-rw-r--r-- 1 user user 1234 ... README.md<br/>...</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">이 프로젝트의 구조를 설명해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 디렉토리 구조를 분석하여 설명)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 3: 로그 분석 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">3</span>
              서버 로그 분석하기
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start /var/log</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">!tail -20 syslog</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">(최근 20줄의 로그 출력)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">이 로그에서 에러가 있는지 분석해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 로그를 분석하여 에러 보고)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 4: 파일 전송 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">4</span>
              파일 주고받기
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/documents</code>
              </div>
              <p className="text-zinc-500 italic ml-16">서버에서 파일 다운로드:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/down report.pdf</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(report.pdf 파일이 Telegram으로 전송됨)</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-2">스마트폰에서 서버로 파일 업로드:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">(Telegram 첨부 버튼으로 사진/파일 전송)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: /home/user/documents/photo_abc123.jpg (45678 bytes)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 5: 파일 업로드 + AI 분석 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-green/20 text-accent-green text-sm flex items-center justify-center flex-shrink-0">5</span>
              파일 업로드 후 AI에게 분석 요청하기
              <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">NEW</span>
            </h4>
            <p className="text-zinc-500 text-sm mb-3">파일을 업로드하면 AI가 자동으로 파일 정보를 인식합니다.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start ~/my-project</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/my-project.</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">설정 파일 3개를 한꺼번에 업로드:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">(config.json, .env, docker-compose.yml 파일 3개 전송)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../config.json (512 bytes)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../.env (128 bytes)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../docker-compose.yml (2048 bytes)</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">이후 AI에게 요청:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">방금 올린 설정 파일들을 검토해서 문제가 있는지 확인해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 3개 파일을 모두 인지하고, 순서대로 읽어서 설정 오류 분석)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 6: /stop으로 AI 중단 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 text-sm flex items-center justify-center flex-shrink-0">6</span>
              AI 응답 중단하기
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
            </h4>
            <p className="text-zinc-500 text-sm mb-3">AI가 잘못된 방향으로 진행될 때 즉시 중단하고 방향을 수정할 수 있습니다.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">이 프로젝트의 모든 파일을 TypeScript로 변환해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">🕐 Processing...</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">잘못된 요청이었다고 판단하여 중단:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-red-400 font-mono">/stop</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">네, src/utils.js를 변환하겠습니다... [Stopped]</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">방향 수정 후 다시 요청:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">아니, src/utils.js 파일만 TypeScript로 변환해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 utils.js만 변환 수행)</span>
              </div>
            </div>
          </div>

          {/* 워크플로우 7: Git 작업 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">7</span>
              Git 상태 확인 및 관리
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/my-repo</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">!git status</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">On branch main<br/>Changes not staged for commit:<br/>&nbsp;&nbsp;modified: src/app.rs</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <code className="text-accent-cyan font-mono">!git diff src/app.rs</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(변경 내용 diff 출력)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">나:</span>
                <span className="text-zinc-300">이 변경사항을 요약해줘</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI가 코드 변경 내용을 분석하여 요약)</span>
              </div>
            </div>
          </div>

          <TipBox>
            <code className="text-accent-cyan font-mono">!</code> 명령어와 AI 질문을 조합하면 강력합니다.
            먼저 <code className="text-accent-cyan font-mono">!</code>로 현재 상태를 확인하고, 그 결과에 대해 AI에게 분석이나 조언을 요청해 보세요.
          </TipBox>

          <TipBox variant="warning">
            <code className="text-accent-cyan font-mono">!</code> 명령어는 서버에서 직접 실행되므로, 삭제나 수정 명령어는 신중하게 사용하세요.
            <code className="text-zinc-300 font-mono"> rm</code>, <code className="text-zinc-300 font-mono">mv</code> 같은 명령어는 되돌릴 수 없습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            You can use cokacdir's AI features and file management remotely through <strong className="text-white">Telegram messenger</strong>.
            Check server files from your smartphone while on the go, ask AI questions, or run shell commands.
          </p>

          <TipBox variant="note">
            This feature requires a Telegram account and a Bot API token.
            If you don't use Telegram, feel free to skip this section.
          </TipBox>

          {/* ========== Create Bot ========== */}
          <SectionHeading id="telegram-create-bot" level={3}>Creating a Telegram Bot</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            First, you need to create your own Bot on Telegram.
            A Bot is a special account that can send and receive messages automatically.
            You can create one through <strong className="text-white">@BotFather</strong>, Telegram's official bot management tool.
            The process is very simple.
          </p>

          <StepByStep steps={[
            {
              title: 'Install Telegram',
              description: (
                <span>
                  If you don't have Telegram yet, install it on your smartphone (iOS/Android) or PC.
                  Phone number verification is required when creating an account.
                  If you already use Telegram, skip this step.
                </span>
              )
            },
            {
              title: 'Search for @BotFather and start a chat',
              description: (
                <span>
                  In the Telegram app, type <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">@BotFather</code> in the search bar.
                  Select the official account with the blue checkmark, and tap
                  the <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">/start</code> button in the chat.
                  BotFather will send a welcome message with a list of available commands.
                </span>
              )
            },
            {
              title: 'Type /newbot',
              description: (
                <span>
                  Send <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">/newbot</code> to BotFather.
                  It will start asking questions to create your new bot.
                </span>
              )
            },
            {
              title: 'Enter a bot name',
              description: (
                <span>
                  BotFather asks: <strong className="text-zinc-300">"Alright, a new bot. How are we going to call it? Please choose a name for your bot."</strong>
                  Enter a display name for your bot. This is the name shown in chat lists — choose anything you like.
                  <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                    My Cokacdir Bot
                  </code>
                </span>
              )
            },
            {
              title: 'Enter a bot username',
              description: (
                <span>
                  BotFather asks: <strong className="text-zinc-300">"Good. Now let's choose a username for your bot. It must end in 'bot'."</strong>
                  Enter a unique username for your bot. It must end with <code className="text-accent-cyan font-mono bg-bg-card px-1.5 py-0.5 rounded">bot</code>.
                  If the name is already taken, try a different one.
                  <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                    my_cokacdir_bot
                  </code>
                </span>
              )
            },
            {
              title: 'Copy the API Token',
              description: (
                <span>
                  Once created, BotFather sends a congratulations message along with the <strong className="text-white">API token</strong>.
                  The token looks like this:
                  <code className="block text-accent-cyan font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2 mb-2">
                    123456789:ABCdefGHIjklMNOpqrsTUVwxyz
                  </code>
                  <strong className="text-zinc-300">Long-press to copy</strong> this token. You'll use it in the next step to register with cokacdir.
                </span>
              )
            },
          ]} />

          {/* BotFather conversation simulation */}
          <p className="text-zinc-400 mb-3 text-sm leading-relaxed">
            Here's how the full conversation looks:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">You:</span>
                <code className="text-accent-cyan font-mono">/start</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">I can help you create and manage Telegram bots. ...</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">You:</span>
                <code className="text-accent-cyan font-mono">/newbot</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">Alright, a new bot. How are we going to call it? Please choose a name for your bot.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">You:</span>
                <span className="text-zinc-300">My Cokacdir Bot</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">You:</span>
                <span className="text-zinc-300">my_cokacdir_bot</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-20">BotFather:</span>
                <span className="text-zinc-400">
                  Done! Congratulations on your new bot. You will find it at t.me/my_cokacdir_bot.<br/>
                  Use this token to access the HTTP API:<br/>
                  <code className="text-accent-cyan font-mono bg-bg-elevated px-1.5 py-0.5 rounded">123456789:ABCdefGHIjklMNOpqrsTUVwxyz</code>
                  <br/>Keep your token secure and store it safely.
                </span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-700">
              <p className="text-zinc-500 text-xs">
                {'↑'} The <code className="text-accent-cyan font-mono">123456789:ABCdef...</code> part in the last message is the API token. Copy this.
              </p>
            </div>
          </div>

          <TipBox variant="warning">
            The API token is like a password. Never share it with anyone.
            If the token is leaked, anyone can control your Bot.
            If your token has been compromised, send <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">/revoke</code> to BotFather to regenerate it.
          </TipBox>

          {/* ========== Setup and Start ========== */}
          <SectionHeading id="telegram-setup" level={3}>Setup and Start</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            The Bot server runs on the computer where cokacdir is installed.
            Setup differs slightly by platform, so follow the instructions for your operating system.
          </p>

          {/* Platform-specific guides */}
          <div className="space-y-4 mb-6">
            {/* macOS */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center flex-shrink-0">{'🍎'}</span>
                macOS
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                No additional setup required on macOS. Open <strong className="text-zinc-300">Terminal.app</strong> or <strong className="text-zinc-300">iTerm2</strong> and run the commands below.
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
                <div className="text-zinc-500 mb-1"># Start server</div>
                <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                macOS path example: <code className="font-mono">/Users/username/Documents</code>
              </p>
            </div>

            {/* Linux */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 text-sm flex items-center justify-center flex-shrink-0">{'🐧'}</span>
                Linux
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                No additional setup required on Linux. Works on all distributions including Ubuntu, Debian, Fedora, and Arch.
                Open your terminal and run the commands below.
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
                <div className="text-zinc-500 mb-1"># Start server</div>
                <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                Linux path example: <code className="font-mono">/home/username/projects</code>
              </p>
              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mt-3">
                <div className="text-zinc-500 mb-1">Running on headless servers</div>
                <p className="text-zinc-400 leading-relaxed">
                  The Bot server works on GUI-less servers too. SSH into your server and run the same commands.
                  To auto-start after reboot, register a <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">systemd</code> service
                  or add a <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">@reboot</code> entry to <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">crontab</code>.
                </p>
              </div>
            </div>

            {/* Windows */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-5">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 text-sm flex items-center justify-center flex-shrink-0">{'🪟'}</span>
                Windows (WSL Required)
              </h4>
              <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
                cokacdir is a Unix-based program, so on Windows you need <strong className="text-white">WSL (Windows Subsystem for Linux)</strong>.
                WSL is an official Windows feature that runs a Linux environment inside Windows.
              </p>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
                <div className="text-zinc-400 font-semibold mb-2">If WSL is not installed yet:</div>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  Open <strong className="text-zinc-300">PowerShell</strong> as <strong className="text-zinc-300">Administrator</strong> and run:
                </p>
                <code className="block text-accent-cyan font-mono bg-bg-card px-3 py-2 rounded">
                  wsl --install
                </code>
                <p className="text-zinc-400 mt-2 leading-relaxed">
                  After installation, restart your computer. Ubuntu will be installed automatically
                  and you'll be prompted to create a username and password.
                </p>
              </div>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
                <div className="text-zinc-400 font-semibold mb-2">Running cokacdir in WSL:</div>
                <p className="text-zinc-400 mb-2 leading-relaxed">
                  Open <strong className="text-zinc-300">Ubuntu</strong> (or your installed Linux distro) from the Start menu.
                  The terminal that opens is a Linux environment. Install cokacdir here and run the Bot server.
                </p>
                <div className="font-mono">
                  <div className="text-zinc-500 mb-1"># Run in WSL terminal</div>
                  <div className="text-accent-cyan">cokacdir --ccserver YOUR_BOT_TOKEN</div>
                </div>
              </div>

              <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
                <div className="text-zinc-400 font-semibold mb-2">Accessing Windows files:</div>
                <p className="text-zinc-400 leading-relaxed">
                  You can access your Windows files from inside WSL.
                  The Windows folder <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">C:\Users\username\Documents</code> is accessible
                  as <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">/mnt/c/Users/username/Documents</code> in WSL.
                </p>
                <code className="block text-zinc-500 font-mono text-xs bg-bg-card px-3 py-2 rounded mt-2">
                  /start /mnt/c/Users/username/Documents
                </code>
              </div>
            </div>
          </div>

          <TipBox variant="note">
            <strong className="text-zinc-300">Claude CLI</strong> must be installed on all platforms for AI features to work.
            Without Claude CLI, the Bot server will start but AI queries will return errors.
          </TipBox>

          {/* Background execution */}
          <h4 className="text-white font-semibold mt-6 mb-3">Running in the Background</h4>
          <p className="text-zinc-400 mb-4 leading-relaxed text-sm">
            To keep the Bot server running after closing the terminal, use background execution.
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono mb-3">
              <div className="text-zinc-500 mb-1"># Background execution (macOS, Linux, WSL)</div>
              <div className="text-accent-cyan">nohup cokacdir --ccserver YOUR_BOT_TOKEN &amp;</div>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono mb-3">
              <div className="text-zinc-500 mb-1"># Check if Bot server is running</div>
              <div className="text-accent-cyan">ps aux | grep ccserver</div>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm font-mono">
              <div className="text-zinc-500 mb-1"># Stop the Bot server</div>
              <div className="text-accent-cyan">pkill -f "cokacdir --ccserver"</div>
            </div>
          </div>

          <TipBox>
            To run multiple bots simultaneously, pass multiple tokens:
            <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">cokacdir --ccserver TOKEN1 TOKEN2</code>
          </TipBox>

          {/* ========== Available Commands ========== */}
          <SectionHeading id="telegram-commands" level={3}>Available Commands</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Here are all the commands you can use with the Telegram Bot.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/start [path]</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Start an AI session. <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">path</code> is the directory to work in.
                If a session already exists for that path, it will be restored with the last 5 conversation entries.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                If you type <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code> without a path,
                a temporary workspace is automatically created under
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/workspace/</code>.
                You can get started immediately without specifying a directory.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">~</code> (tilde) paths are supported.
                For example, <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start ~/project</code> is automatically
                expanded to <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start /home/user/project</code>.
              </p>
              <div className="bg-bg-elevated rounded p-3 mt-2 space-y-1">
                <code className="block text-zinc-500 font-mono text-sm">/start</code>
                <code className="block text-zinc-500 font-mono text-sm">/start ~/mywork</code>
                <code className="block text-zinc-500 font-mono text-sm">/start /home/user/project</code>
              </div>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/help</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Shows all available commands and detailed usage instructions.
              </p>
            </div>

            {/* /stop */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/stop</code>
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                <strong className="text-white">Immediately cancel</strong> the current AI request.
                Use this when the AI is working on a long task or heading in the wrong direction.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                When stopped, the partial response generated so far is preserved with a <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">[Stopped]</code> indicator.
                The interaction is recorded in conversation history, so context is maintained.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                If no AI request is in progress, typing <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/stop</code> will show
                "No active request to stop."
              </p>
              <div className="bg-bg-elevated rounded p-3 mt-3 space-y-1 text-sm">
                <p className="text-zinc-500 mb-2">Example:</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                  <span className="text-zinc-300">Refactor the entire project</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">🕐 Processing...</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                  <code className="text-red-400 font-mono">/stop</code>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(partial response) [Stopped]</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/clear</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Clear the current AI session. Conversation history is deleted and you can start fresh.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/pwd</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Show the current working directory of the session.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/down &lt;filepath&gt;</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Download a file from the server to Telegram. Supports absolute paths or relative paths based on the current session directory.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /down report.txt
              </code>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">!&lt;command&gt;</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Execute a shell command directly. Uses the current session path as the working directory.
                Commands that require user input (e.g., <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">read</code>) are automatically terminated.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                Shell commands can be used even before <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">/start</code>.
                In that case, the home directory is used as the default working directory.
                For example, typing <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">!pwd</code> will output the home directory path.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                !ls -la
              </code>
            </div>

            {/* File Upload */}
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent-cyan font-semibold">File / Photo Upload</span>
                <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">ENHANCED</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Send a file or photo through Telegram and it will be automatically saved to the current session directory.
                Useful for quickly transferring photos or documents from your smartphone to the server.
              </p>
              <p className="text-zinc-400 text-sm leading-relaxed mt-2">
                Upload information is <strong className="text-white">automatically recorded in the AI conversation context</strong>.
                So after uploading a file, you can say "analyze the file I just uploaded" and the AI will automatically know the file name and path.
              </p>

              <div className="bg-bg-elevated rounded p-3 mt-3 mb-3">
                <p className="text-zinc-500 text-xs font-semibold mb-2">Using Captions</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  When sending a file, you can include a <strong className="text-white">caption (description)</strong>.
                  After saving, the caption is immediately sent to AI as your message.
                  This lets you <strong className="text-zinc-300">upload a file and give instructions in one step</strong> — no extra message needed.
                </p>
              </div>

              <div className="bg-bg-elevated rounded p-3 mb-3">
                <p className="text-zinc-500 text-xs font-semibold mb-2">Multiple File Upload</p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Sending multiple files at once works seamlessly — all files are saved and recorded in order.
                  When you send a text message afterwards, <strong className="text-zinc-300">all file information is delivered to AI at once</strong>.
                </p>
              </div>

              <div className="bg-bg-elevated rounded p-3 space-y-1 text-sm">
                <p className="text-zinc-500 mb-2">Example 1: Upload first, then ask</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                  <span className="text-zinc-300">(send data.csv)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">Saved: /home/user/project/data.csv (1234 bytes)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                  <span className="text-zinc-300">Analyze the file I just uploaded</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(AI automatically knows the path and analyzes data.csv)</span>
                </div>
              </div>

              <div className="bg-bg-elevated rounded p-3 space-y-1 text-sm mt-3">
                <p className="text-zinc-500 mb-2">Example 2: Upload with caption (one step)</p>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                  <span className="text-zinc-300">(send error_log.txt + caption: "Find the error cause in this log")</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">Saved: /home/user/project/error_log.txt (5678 bytes)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                  <span className="text-zinc-400">(AI immediately reads error_log.txt and starts analysis)</span>
                </div>
              </div>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-accent-cyan font-semibold">General Text</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Any text that isn't a command is sent to AI.
                AI responses are streamed in real-time.
              </p>
            </div>
          </div>

          {/* ========== Tool Management ========== */}
          <SectionHeading id="telegram-tools" level={3}>AI Tool Management</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            You can view and dynamically add or remove the tools available to Claude AI.
            By default, 17 tools are enabled. Adjust them as needed for your workflow or security requirements.
          </p>

          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/availabletools</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Show all available tools with descriptions. Useful for discovering what each tool does.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowedtools</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Show the currently allowed tools as a numbered list.
              </p>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowed +toolname</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Add a tool to the allowed list.
                Tool names are automatically normalized (e.g., <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">bash</code> → <code className="text-zinc-300 font-mono bg-bg-elevated px-1 py-0.5 rounded">Bash</code>).
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /allowed +Bash
              </code>
            </div>

            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <code className="text-accent-cyan font-mono font-semibold">/allowed -toolname</code>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Remove a tool from the allowed list. The AI will no longer be able to use the removed tool.
              </p>
              <code className="block text-zinc-500 font-mono text-sm bg-bg-elevated px-3 py-2 rounded mt-2">
                /allowed -Bash
              </code>
            </div>
          </div>

          <TipBox>
            Tool settings are automatically saved to <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">~/.cokacdir/bot_settings.json</code> and
            persist across bot restarts.
          </TipBox>

          <TipBox variant="warning">
            Removing the <code className="text-accent-cyan font-mono">Bash</code> tool prevents AI from executing shell commands.
            For security-sensitive environments, consider keeping only the tools you need.
          </TipBox>

          {/* ========== Workflow Examples ========== */}
          <SectionHeading id="telegram-workflow" level={3}>Workflow Examples</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Let's walk through some practical examples of how to use the Telegram Bot.
          </p>

          {/* Workflow 1: Quick Start */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">1</span>
              Quick Start Without a Path
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/.cokacdir/workspace/a1b2c3.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">!ls</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">(empty directory)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Create a simple Python hello world script</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI creates hello.py file)</span>
              </div>
            </div>
          </div>

          {/* Workflow 2 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">2</span>
              Exploring Project Files
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/my-project</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/my-project.</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">!ls -la</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">drwxr-xr-x 5 user user 4096 ... src/<br/>-rw-r--r-- 1 user user 1234 ... README.md<br/>...</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Explain the structure of this project</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI analyzes and explains the directory structure)</span>
              </div>
            </div>
          </div>

          {/* Workflow 3 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">3</span>
              Analyzing Server Logs
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start /var/log</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">!tail -20 syslog</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">(last 20 lines of log output)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Are there any errors in this log?</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI analyzes the log and reports errors)</span>
              </div>
            </div>
          </div>

          {/* Workflow 4 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">4</span>
              Transferring Files
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/documents</code>
              </div>
              <p className="text-zinc-500 italic ml-16">Download from server:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/down report.pdf</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(report.pdf is sent to Telegram)</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-2">Upload from smartphone to server:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">(Send a file/photo via Telegram attachment)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: /home/user/documents/photo_abc123.jpg (45678 bytes)</span>
              </div>
            </div>
          </div>

          {/* Workflow 5: File Upload + AI Analysis */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-green/20 text-accent-green text-sm flex items-center justify-center flex-shrink-0">5</span>
              Upload Files and Ask AI to Analyze
              <span className="text-xs bg-accent-green/20 text-accent-green px-2 py-0.5 rounded-full">NEW</span>
            </h4>
            <p className="text-zinc-500 text-sm mb-3">AI automatically recognizes uploaded file information.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start ~/my-project</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Session started at /home/user/my-project.</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">Upload 3 config files at once:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">(send config.json, .env, docker-compose.yml — 3 files)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../config.json (512 bytes)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../.env (128 bytes)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">Saved: .../docker-compose.yml (2048 bytes)</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">Then ask AI:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Review the config files I just uploaded and check for any issues</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI recognizes all 3 files, reads them in order, and analyzes for config errors)</span>
              </div>
            </div>
          </div>

          {/* Workflow 6: /stop */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 text-sm flex items-center justify-center flex-shrink-0">6</span>
              Stopping an AI Response
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">NEW</span>
            </h4>
            <p className="text-zinc-500 text-sm mb-3">Immediately stop the AI when it's heading in the wrong direction and correct course.</p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Convert all files in this project to TypeScript</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">🕐 Processing...</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">Realize the request was too broad, so stop it:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-red-400 font-mono">/stop</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">OK, I'll convert src/utils.js... [Stopped]</span>
              </div>
              <p className="text-zinc-500 italic ml-16 mt-1">Correct the request and try again:</p>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">No, only convert src/utils.js to TypeScript</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI converts only utils.js)</span>
              </div>
            </div>
          </div>

          {/* Workflow 7 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">7</span>
              Git Status and Management
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">/start /home/user/my-repo</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">!git status</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400 font-mono text-xs">On branch main<br/>Changes not staged for commit:<br/>&nbsp;&nbsp;modified: src/app.rs</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <code className="text-accent-cyan font-mono">!git diff src/app.rs</code>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(diff output showing changes)</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">You:</span>
                <span className="text-zinc-300">Summarize these changes</span>
              </div>
              <div className="flex gap-3">
                <span className="text-zinc-500 flex-shrink-0 w-12">Bot:</span>
                <span className="text-zinc-400">(AI analyzes and summarizes the code changes)</span>
              </div>
            </div>
          </div>

          <TipBox>
            Combining <code className="text-accent-cyan font-mono">!</code> commands with AI questions is powerful.
            First check the current state with <code className="text-accent-cyan font-mono">!</code> commands, then ask AI for analysis or advice about the results.
          </TipBox>

          <TipBox variant="warning">
            <code className="text-accent-cyan font-mono">!</code> commands run directly on the server, so use destructive commands carefully.
            Commands like <code className="text-zinc-300 font-mono"> rm</code> and <code className="text-zinc-300 font-mono">mv</code> cannot be undone.
          </TipBox>
        </>
      )}
    </section>
  )
}
