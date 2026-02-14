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
            cokacdir를 먼저 실행한 뒤, 앱 안에서 <KeyBadge>/</KeyBadge> 키(경로 이동)를 눌러 원격 서버 주소를 입력합니다.
            형식은 SSH 스타일의 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">사용자@서버주소:/경로</code>입니다.
          </p>
          <StepByStep steps={[
            {
              title: 'cokacdir를 실행합니다',
              description: '터미널에서 cokacdir를 먼저 실행합니다.',
            },
            {
              title: '/ 키를 눌러 경로 입력창을 엽니다',
              description: (
                <span>
                  <KeyBadge>/</KeyBadge>를 누르면 경로를 입력할 수 있는 입력창이 나타납니다.
                </span>
              ),
            },
            {
              title: '원격 서버 주소를 입력합니다',
              description: (
                <div>
                  <p className="mb-2">아래와 같은 형식으로 입력합니다:</p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm space-y-2">
                    <div>
                      <span className="text-zinc-500"># 기본 형식</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">사용자이름@서버주소:/경로</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># 예: 서버의 홈 폴더에 접속</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">john@myserver.com:/home/john</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># 포트 번호를 지정 (기본은 22번)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">john@myserver.com:2222:/home/john</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Enter를 누르면 연결됩니다',
              description: '처음 접속하는 서버라면 인증 정보(비밀번호 또는 SSH 키)를 묻는 화면이 나타납니다. 입력하면 서버에 연결되어 원격 파일을 탐색할 수 있습니다.',
            },
          ]} />

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
              title: '한 패널에서 원격 서버에 연결합니다',
              description: (
                <span>
                  <KeyBadge>/</KeyBadge>를 눌러 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">user@host:/path</code> 형식으로 서버에 접속합니다.
                </span>
              ),
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
            한번 접속한 서버는 프로필로 저장할 수 있어서, 다음에 <KeyBadge>/</KeyBadge>를 눌렀을 때 저장된 서버 목록에서 바로 선택할 수 있습니다.
            비밀번호 인증과 SSH 키 파일 인증 모두 지원합니다.
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
            First launch cokacdir, then press <KeyBadge>/</KeyBadge> (Go to Path) and type the remote server address.
            The format is SSH-style: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">user@host:/path</code>.
          </p>
          <StepByStep steps={[
            {
              title: 'Launch cokacdir',
              description: 'Start cokacdir from the terminal first.',
            },
            {
              title: 'Press / to open the path input',
              description: (
                <span>
                  Press <KeyBadge>/</KeyBadge> to bring up the path input dialog.
                </span>
              ),
            },
            {
              title: 'Type the remote server address',
              description: (
                <div>
                  <p className="mb-2">Enter the address in this format:</p>
                  <div className="bg-bg-elevated border border-zinc-800 rounded-lg p-3 font-mono text-sm space-y-2">
                    <div>
                      <span className="text-zinc-500"># Basic format</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">username@server-address:/path</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># Example: connect to server's home folder</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">john@myserver.com:/home/john</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-zinc-500"># With a specific port (default is 22)</span>
                    </div>
                    <div>
                      <span className="text-accent-cyan">john@myserver.com:2222:/home/john</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: 'Press Enter to connect',
              description: 'If this is a new server, you\'ll be prompted for authentication (password or SSH key). Once entered, you\'re connected and can browse remote files.',
            },
          ]} />

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
              title: 'Connect to the remote server in one panel',
              description: (
                <span>
                  Press <KeyBadge>/</KeyBadge> and type <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">user@host:/path</code> to connect.
                </span>
              ),
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
            Servers you've connected to can be saved as profiles, so next time you press <KeyBadge>/</KeyBadge>,
            you can quickly select from saved servers. Both password and SSH key file authentication are supported.
          </TipBox>
        </>
      )}
    </section>
  )
}
