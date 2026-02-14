import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function RemoteConnections() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="remote-connections">{t('Remote File Management (SSH/SFTP)', '원격 서버 파일 관리 (SSH/SFTP)')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir로 다른 컴퓨터(서버)에 있는 파일도 관리할 수 있습니다.
            집 컴퓨터에서 회사 서버의 파일을 보거나, 클라우드 서버의 파일을 관리하는 등의 작업이
            가능합니다.
            이 기능은 SSH라는 원격 접속 기술을 사용합니다.
          </p>

          <TipBox variant="note">
            이 기능은 원격 서버 접속이 필요한 분들을 위한 것입니다.
            개인 컴퓨터의 파일만 관리하신다면 이 섹션은 건너뛰어도 됩니다.
          </TipBox>

          <SectionHeading id="remote-connect" level={3}>원격 서버에 연결하기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            터미널에서 cokacdir를 실행할 때 서버 주소를 함께 입력합니다:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://사용자이름@서버주소:/경로</span>
            </div>
          </div>
          <p className="text-zinc-400 mb-4">실제 예시:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 font-mono text-sm space-y-2">
            <div>
              <span className="text-zinc-500"># 서버의 홈 폴더에 접속</span>
            </div>
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://john@myserver.com:/home/john</span>
            </div>
            <div className="mt-2">
              <span className="text-zinc-500"># 포트 번호를 지정해서 접속 (기본은 22번)</span>
            </div>
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://john@myserver.com:2222:/home/john</span>
            </div>
          </div>

          <SectionHeading id="remote-usage" level={3}>원격 파일 다루기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            연결이 되면 로컬(내 컴퓨터) 파일을 다루는 것과 완전히 같은 방식으로 사용할 수 있습니다:
          </p>
          <div className="space-y-2 mb-6">
            {[
              '폴더 탐색 (Enter/Esc로 들어가기/나가기)',
              '파일 보기와 편집',
              '파일 복사, 이동, 삭제, 이름 변경',
              '폴더/파일 생성',
              '검색',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0">{'✓'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <SectionHeading id="remote-transfer" level={3}>내 컴퓨터 ↔ 서버 파일 전송</SectionHeading>
          <p className="text-zinc-400 mb-4">
            패널 시스템을 활용하면 로컬과 원격 사이에 파일을 주고받을 수 있습니다.
          </p>
          <StepByStep steps={[
            {
              title: '첫 번째 패널은 원격 서버에 연결된 상태입니다',
              description: 'cokacdir를 sftp://... 로 시작해서 서버 파일을 보고 있습니다.',
            },
            {
              title: '0을 눌러 두 번째 패널을 엽니다',
              description: '새 패널이 내 컴퓨터(로컬)의 파일을 보여줍니다.',
            },
            {
              title: '한쪽에서 파일을 선택하고 복사합니다',
              description: (
                <span>
                  <KeyBadge>Space</KeyBadge>로 파일을 선택하고 <KeyBadge>Ctrl+C</KeyBadge>로 복사합니다.
                </span>
              ),
            },
            {
              title: '다른 쪽 패널로 이동해서 붙여넣기합니다',
              description: (
                <span>
                  <KeyBadge>Tab</KeyBadge>으로 다른 패널로 이동한 뒤 <KeyBadge>Ctrl+V</KeyBadge>로 붙여넣기합니다.
                  파일이 네트워크를 통해 전송됩니다.
                </span>
              ),
            },
          ]} />

          <TipBox>
            원격 접속이 원활하려면 SSH 키가 설정되어 있어야 합니다.
            SSH 키는 비밀번호 대신 사용하는 인증 방식으로, 매번 비밀번호를 입력하지 않아도 됩니다.
            <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded ml-1">~/.ssh/config</code> 파일에
            서버 정보를 미리 설정해두면 더 편리합니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir can also manage files on remote computers (servers).
            Browse files on your work server from home, or manage cloud server files —
            all using SSH-based remote access.
          </p>

          <TipBox variant="note">
            This feature is for users who need remote server access.
            If you only manage files on your personal computer, feel free to skip this section.
          </TipBox>

          <SectionHeading id="remote-connect" level={3}>Connecting to a Remote Server</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Include the server address when launching cokacdir from the terminal:
          </p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-4 font-mono text-sm space-y-2">
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://username@server-address:/path</span>
            </div>
          </div>
          <p className="text-zinc-400 mb-4">Real examples:</p>
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6 font-mono text-sm space-y-2">
            <div>
              <span className="text-zinc-500"># Connect to server's home folder</span>
            </div>
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://john@myserver.com:/home/john</span>
            </div>
            <div className="mt-2">
              <span className="text-zinc-500"># Connect with a specific port (default is 22)</span>
            </div>
            <div>
              <span className="text-zinc-500">$ </span>
              <span className="text-accent-cyan">cokacdir sftp://john@myserver.com:2222:/home/john</span>
            </div>
          </div>

          <SectionHeading id="remote-usage" level={3}>Working with Remote Files</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Once connected, everything works exactly the same as with local files:
          </p>
          <div className="space-y-2 mb-6">
            {[
              'Browse folders (Enter/Esc to enter/go back)',
              'View and edit files',
              'Copy, move, delete, rename files',
              'Create folders/files',
              'Search',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0">{'✓'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <SectionHeading id="remote-transfer" level={3}>Transferring Files Between Local and Server</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Use the panel system to transfer files between local and remote.
          </p>
          <StepByStep steps={[
            {
              title: 'The first panel is connected to the remote server',
              description: 'You launched cokacdir with sftp://... and are viewing server files.',
            },
            {
              title: 'Press 0 to open a second panel',
              description: 'The new panel shows your local (computer) files.',
            },
            {
              title: 'Select and copy files from one side',
              description: (
                <span>
                  Select files with <KeyBadge>Space</KeyBadge> and copy with <KeyBadge>Ctrl+C</KeyBadge>.
                </span>
              ),
            },
            {
              title: 'Switch to the other panel and paste',
              description: (
                <span>
                  Press <KeyBadge>Tab</KeyBadge> to switch panels, then <KeyBadge>Ctrl+V</KeyBadge> to paste.
                  Files are transferred over the network.
                </span>
              ),
            },
          ]} />

          <TipBox>
            For smooth remote access, set up SSH keys for authentication.
            SSH keys replace password entry, so you don't have to type your password every time.
            Pre-configuring server info in <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded ml-1">~/.ssh/config</code> makes it even more convenient.
          </TipBox>
        </>
      )}
    </section>
  )
}
