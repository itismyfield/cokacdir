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

          {/* ========== 인증 방식 이해 ========== */}
          <SectionHeading id="remote-auth-concepts" level={3}>인증 방식 이해하기</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            원격 서버에 접속하려면 "내가 접속 권한이 있는 사람이다"라는 것을 증명해야 합니다.
            이것을 <strong className="text-white">인증(Authentication)</strong>이라고 합니다.
            cokacdir는 두 가지 인증 방식을 지원합니다.
          </p>

          {/* 비밀번호 인증 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">1</span>
              비밀번호 인증 (Password)
            </h4>
            <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
              가장 익숙한 방식입니다. 웹사이트에 로그인할 때처럼, 서버에 등록된 <strong className="text-zinc-300">사용자 이름</strong>과 <strong className="text-zinc-300">비밀번호</strong>를 입력하여 접속합니다.
            </p>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
              <div className="text-zinc-500 mb-1">장점</div>
              <p className="text-zinc-400 mb-2">설정이 간단합니다. 서버의 계정과 비밀번호만 알면 바로 접속할 수 있습니다.</p>
              <div className="text-zinc-500 mb-1">단점</div>
              <p className="text-zinc-400">비밀번호가 유출되면 누구나 접속할 수 있어 보안이 상대적으로 약합니다. 또한 매번 비밀번호를 입력해야 할 수 있습니다.</p>
            </div>
          </div>

          {/* 키 파일 인증 */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">2</span>
              키 파일 인증 (Key File)
            </h4>
            <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
              비밀번호 대신 <strong className="text-zinc-300">특수한 파일</strong>을 사용하여 본인을 증명하는 방식입니다.
              이 파일을 <strong className="text-zinc-300">"SSH 키"</strong>라고 부릅니다.
            </p>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
              <div className="text-zinc-500 mb-2">열쇠와 자물쇠 비유</div>
              <p className="text-zinc-400 leading-relaxed">
                SSH 키는 <strong className="text-zinc-300">열쇠(개인 키)</strong>와 <strong className="text-zinc-300">자물쇠(공개 키)</strong> 한 쌍으로 이루어집니다.
                자물쇠(공개 키)는 서버에 미리 등록해 두고, 열쇠(개인 키)는 내 컴퓨터에 보관합니다.
                접속할 때 내 컴퓨터의 열쇠로 서버의 자물쇠를 열 수 있는지 확인하여 인증이 이루어집니다.
              </p>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
              <div className="text-zinc-500 mb-2">개인 키 파일의 기본 위치</div>
              <p className="text-zinc-400 leading-relaxed">
                개인 키 파일은 보통 내 컴퓨터의 <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">~/.ssh/id_rsa</code> 경로에 저장됩니다.
                cokacdir의 접속 화면에서도 이 경로가 기본값으로 입력되어 있습니다.
                다른 위치에 키 파일이 있다면 직접 경로를 입력하면 됩니다.
              </p>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
              <div className="text-zinc-500 mb-2">패스프레이즈 (Passphrase)</div>
              <p className="text-zinc-400 leading-relaxed">
                키 파일 자체에 비밀번호(패스프레이즈)를 설정할 수도 있습니다.
                집 열쇠에 비유하면, 열쇠를 보관하는 금고에 추가로 비밀번호를 건 것과 같습니다.
                패스프레이즈가 설정된 키 파일을 사용할 때는 접속 화면에서 패스프레이즈도 함께 입력해야 합니다.
                패스프레이즈가 없는 키 파일이라면 이 칸은 비워두면 됩니다.
              </p>
            </div>
          </div>

          <TipBox>
            어떤 방식을 사용해야 할지 모르겠다면 서버 관리자에게 문의하세요.
            일반적으로 키 파일 인증이 보안상 더 안전하여 권장됩니다.
            클라우드 서버(AWS, GCP 등)는 대부분 키 파일 인증을 기본으로 사용합니다.
          </TipBox>

          {/* ========== 서버 연결하기 ========== */}
          <SectionHeading id="remote-connect" level={3}>원격 서버에 연결하기</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            서버에 연결하는 방법은 두 가지입니다: 경로 입력창에 직접 주소를 입력하거나, 접속 다이얼로그를 사용하는 방법입니다.
          </p>

          <h4 className="text-white font-semibold mb-3 mt-6">빠른 연결: 주소 직접 입력</h4>
          <p className="text-zinc-400 mb-4">
            서버 정보를 알고 있다면 가장 빠른 방법입니다.
          </p>
          <StepByStep steps={[
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
              title: 'Enter를 누르면 접속 화면이 열립니다',
              description: '입력한 주소를 인식하여 접속 다이얼로그가 자동으로 열리며, 인증 정보를 입력할 수 있습니다.',
            },
          ]} />

          <h4 className="text-white font-semibold mb-3 mt-8">접속 다이얼로그</h4>
          <p className="text-zinc-400 mb-4">
            주소를 입력하면 다음과 같은 접속 화면이 나타납니다. 각 항목의 의미는 다음과 같습니다:
          </p>
          <div className="space-y-2 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
                <span className="text-zinc-300 font-semibold">Host</span>
                <span className="text-zinc-400">서버 주소 (예: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">myserver.com</code> 또는 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">192.168.1.100</code>)</span>

                <span className="text-zinc-300 font-semibold">Port</span>
                <span className="text-zinc-400">SSH 포트 번호. 대부분의 서버는 기본값 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">22</code>를 사용합니다. 서버 관리자가 다른 포트를 지정한 경우에만 변경하세요.</span>

                <span className="text-zinc-300 font-semibold">User</span>
                <span className="text-zinc-400">서버에 등록된 사용자 이름 (예: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">root</code>, <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">ubuntu</code>)</span>

                <span className="text-zinc-300 font-semibold">Auth</span>
                <span className="text-zinc-400"><code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">Password</code> 또는 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">KeyFile</code> 중 선택. <KeyBadge>Tab</KeyBadge>으로 전환합니다.</span>

                <span className="text-zinc-300 font-semibold">Password</span>
                <span className="text-zinc-400">비밀번호 인증 선택 시 표시. 서버 비밀번호를 입력합니다. 입력한 내용은 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">****</code>로 가려집니다.</span>

                <span className="text-zinc-300 font-semibold">Key Path</span>
                <span className="text-zinc-400">키 파일 인증 선택 시 표시. 개인 키 파일 경로를 입력합니다. 기본값은 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.ssh/id_rsa</code>입니다.</span>

                <span className="text-zinc-300 font-semibold">Passphrase</span>
                <span className="text-zinc-400">키 파일 인증 선택 시 표시. 키 파일에 패스프레이즈가 설정되어 있으면 입력합니다. 없으면 비워두세요.</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="text-zinc-500 text-xs mb-2 font-mono">다이얼로그 조작법</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="flex gap-1"><KeyBadge>Tab</KeyBadge> <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge></span>
              <span className="text-zinc-400">항목 간 이동 (Auth 항목에서는 인증 방식 전환)</span>
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">연결 시작</span>
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">취소</span>
            </div>
          </div>

          <h4 className="text-white font-semibold mb-3 mt-8">저장된 서버로 빠르게 접속</h4>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            한번 접속에 성공한 서버는 자동으로 프로필에 저장됩니다.
            다음에 <KeyBadge>/</KeyBadge>를 눌러 경로 입력창을 열면, 저장된 서버 목록이 표시되어
            바로 선택할 수 있습니다. 저장된 프로필을 수정하려면 해당 항목에서 <KeyBadge>Ctrl+E</KeyBadge>를 누릅니다.
          </p>

          {/* ========== 원격 파일 다루기 ========== */}
          <SectionHeading id="remote-usage" level={3}>원격 파일 다루기</SectionHeading>
          <p className="text-zinc-400 mb-4">
            연결이 되면 로컬(내 컴퓨터) 파일을 다루는 것과 같은 방식으로 사용할 수 있습니다:
          </p>
          <div className="space-y-2 mb-4">
            {[
              '폴더 탐색 (Enter/Esc로 들어가기/나가기)',
              '파일 복사, 이동, 삭제, 이름 변경',
              '폴더/파일 생성',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0">{'✓'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-400 mb-2">
            다만, 원격 패널에서는 다음 기능이 지원되지 않습니다:
          </p>
          <div className="space-y-2 mb-6">
            {[
              '파일 내용 직접 보기/편집 (복사 후 로컬에서 열어야 함)',
              '파일 검색',
              '폴더 비교 (Diff)',
              '압축 파일 생성/해제',
              'AI 기능',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs flex items-center justify-center flex-shrink-0">{'✕'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <h4 className="text-white font-semibold mb-3">연결 해제하기</h4>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            원격 패널에서 <KeyBadge>Ctrl+E</KeyBadge>를 누르면 서버와의 연결이 해제되고,
            패널이 로컬(내 컴퓨터) 모드로 돌아갑니다.
          </p>

          {/* ========== 파일 전송 ========== */}
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
                  파일이 네트워크를 통해 전송되며, 진행 상황이 표시됩니다.
                </span>
              ),
            },
          ]} />

          <TipBox variant="note" title="서버 간 전송">
            두 개의 서로 다른 원격 서버 사이에서도 파일을 복사할 수 있습니다.
            이 경우 파일은 내 컴퓨터를 경유하여 전송됩니다.
            같은 서버 내에서의 복사/이동은 서버에서 직접 처리되어 훨씬 빠릅니다.
          </TipBox>

          <TipBox>
            파일 전송에는 내부적으로 rsync를 활용합니다. rsync가 설치되어 있으면 대용량 파일도
            효율적으로 전송됩니다. rsync가 없는 환경에서는 SFTP를 통해 직접 전송합니다.
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

          {/* ========== Auth concepts ========== */}
          <SectionHeading id="remote-auth-concepts" level={3}>Understanding Authentication</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            To connect to a remote server, you need to prove that you have permission to access it.
            This is called <strong className="text-white">authentication</strong>.
            cokacdir supports two authentication methods.
          </p>

          {/* Password auth */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-4">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">1</span>
              Password Authentication
            </h4>
            <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
              The most familiar method. Just like logging into a website, you enter your <strong className="text-zinc-300">username</strong> and <strong className="text-zinc-300">password</strong> registered on the server.
            </p>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
              <div className="text-zinc-500 mb-1">Pros</div>
              <p className="text-zinc-400 mb-2">Simple setup. Just need the account credentials to connect immediately.</p>
              <div className="text-zinc-500 mb-1">Cons</div>
              <p className="text-zinc-400">Less secure — if the password is compromised, anyone can access the server.</p>
            </div>
          </div>

          {/* Key file auth */}
          <div className="bg-bg-card border border-zinc-800 rounded-lg p-5 mb-6">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm flex items-center justify-center flex-shrink-0">2</span>
              Key File Authentication
            </h4>
            <p className="text-zinc-400 text-sm mb-3 leading-relaxed">
              Instead of a password, you prove your identity using a <strong className="text-zinc-300">special file</strong> called an <strong className="text-zinc-300">"SSH key"</strong>.
            </p>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
              <div className="text-zinc-500 mb-2">The Key and Lock Analogy</div>
              <p className="text-zinc-400 leading-relaxed">
                An SSH key comes as a pair: a <strong className="text-zinc-300">key (private key)</strong> and a <strong className="text-zinc-300">lock (public key)</strong>.
                The lock (public key) is registered on the server in advance, while the key (private key) stays on your computer.
                When you connect, the server checks whether your key can open its lock — that's how authentication works.
              </p>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm mb-3">
              <div className="text-zinc-500 mb-2">Default Key File Location</div>
              <p className="text-zinc-400 leading-relaxed">
                Private key files are typically stored at <code className="text-accent-cyan font-mono bg-bg-card px-1 py-0.5 rounded">~/.ssh/id_rsa</code> on your computer.
                This path is pre-filled as the default in cokacdir's connection dialog.
                If your key file is elsewhere, simply type the correct path.
              </p>
            </div>
            <div className="bg-bg-elevated border border-zinc-700 rounded p-3 text-sm">
              <div className="text-zinc-500 mb-2">Passphrase</div>
              <p className="text-zinc-400 leading-relaxed">
                A key file can optionally have its own password called a "passphrase."
                Think of it as a safe that holds your house key — an extra layer of protection.
                If your key file has a passphrase, you'll need to enter it in the connection dialog.
                If not, simply leave the passphrase field empty.
              </p>
            </div>
          </div>

          <TipBox>
            Not sure which method to use? Ask your server administrator.
            Key file authentication is generally more secure and recommended.
            Cloud servers (AWS, GCP, etc.) typically use key file authentication by default.
          </TipBox>

          {/* ========== Connecting ========== */}
          <SectionHeading id="remote-connect" level={3}>Connecting to a Remote Server</SectionHeading>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            There are two ways to connect: type the server address directly in the path input, or use the connection dialog.
          </p>

          <h4 className="text-white font-semibold mb-3 mt-6">Quick Connect: Direct Address Entry</h4>
          <p className="text-zinc-400 mb-4">
            The fastest method when you already know the server details.
          </p>
          <StepByStep steps={[
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
              title: 'Press Enter to open the connection dialog',
              description: 'The address is recognized and the connection dialog opens automatically, where you can enter your authentication details.',
            },
          ]} />

          <h4 className="text-white font-semibold mb-3 mt-8">Connection Dialog</h4>
          <p className="text-zinc-400 mb-4">
            After entering the address, the connection dialog appears. Here's what each field means:
          </p>
          <div className="space-y-2 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
                <span className="text-zinc-300 font-semibold">Host</span>
                <span className="text-zinc-400">Server address (e.g., <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">myserver.com</code> or <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">192.168.1.100</code>)</span>

                <span className="text-zinc-300 font-semibold">Port</span>
                <span className="text-zinc-400">SSH port number. Most servers use the default <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">22</code>. Only change this if your server admin specified a different port.</span>

                <span className="text-zinc-300 font-semibold">User</span>
                <span className="text-zinc-400">Username registered on the server (e.g., <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">root</code>, <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">ubuntu</code>)</span>

                <span className="text-zinc-300 font-semibold">Auth</span>
                <span className="text-zinc-400">Choose <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">Password</code> or <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">KeyFile</code>. Press <KeyBadge>Tab</KeyBadge> to toggle.</span>

                <span className="text-zinc-300 font-semibold">Password</span>
                <span className="text-zinc-400">Shown when Password auth is selected. Enter the server password. Input is masked as <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">****</code>.</span>

                <span className="text-zinc-300 font-semibold">Key Path</span>
                <span className="text-zinc-400">Shown when KeyFile auth is selected. Path to your private key file. Default: <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.ssh/id_rsa</code>.</span>

                <span className="text-zinc-300 font-semibold">Passphrase</span>
                <span className="text-zinc-400">Shown when KeyFile auth is selected. Enter the passphrase if your key file is encrypted. Leave empty if not.</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="text-zinc-500 text-xs mb-2 font-mono">Dialog Controls</div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <span className="flex gap-1"><KeyBadge>Tab</KeyBadge> <KeyBadge>↑</KeyBadge> <KeyBadge>↓</KeyBadge></span>
              <span className="text-zinc-400">Navigate between fields (toggles auth type when on Auth field)</span>
              <KeyBadge>Enter</KeyBadge>
              <span className="text-zinc-400">Start connection</span>
              <KeyBadge>Esc</KeyBadge>
              <span className="text-zinc-400">Cancel</span>
            </div>
          </div>

          <h4 className="text-white font-semibold mb-3 mt-8">Quick Connect via Saved Profiles</h4>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Servers you've successfully connected to are automatically saved as profiles.
            Next time you press <KeyBadge>/</KeyBadge> to open the path input, saved servers appear in the list
            for quick selection. To edit a saved profile, press <KeyBadge>Ctrl+E</KeyBadge> on the entry.
          </p>

          {/* ========== Working with remote files ========== */}
          <SectionHeading id="remote-usage" level={3}>Working with Remote Files</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Once connected, most operations work the same as with local files:
          </p>
          <div className="space-y-2 mb-4">
            {[
              'Browse folders (Enter/Esc to enter/go back)',
              'Copy, move, delete, rename files',
              'Create folders/files',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs flex items-center justify-center flex-shrink-0">{'✓'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-400 mb-2">
            However, the following features are not available on remote panels:
          </p>
          <div className="space-y-2 mb-6">
            {[
              'Direct file viewing/editing (download first, then open locally)',
              'File search',
              'Folder comparison (Diff)',
              'Archive creation/extraction',
              'AI features',
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-zinc-400">
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 text-xs flex items-center justify-center flex-shrink-0">{'✕'}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <h4 className="text-white font-semibold mb-3">Disconnecting</h4>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Press <KeyBadge>Ctrl+E</KeyBadge> in a remote panel to disconnect from the server.
            The panel switches back to local (your computer) mode.
          </p>

          {/* ========== File transfer ========== */}
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
                  Files are transferred over the network, with progress displayed.
                </span>
              ),
            },
          ]} />

          <TipBox variant="note" title="Server-to-Server Transfer">
            You can also copy files between two different remote servers.
            In this case, files are routed through your local computer.
            Copies/moves within the same server are handled directly on the server, which is much faster.
          </TipBox>

          <TipBox>
            File transfers use rsync internally for efficiency. If rsync is installed,
            even large files are transferred efficiently. Without rsync, transfers fall back to direct SFTP.
          </TipBox>
        </>
      )}
    </section>
  )
}
