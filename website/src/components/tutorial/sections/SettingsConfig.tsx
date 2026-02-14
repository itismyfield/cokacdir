import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function SettingsConfig() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="settings-config">{t('Settings', '설정 바꾸기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir의 외관이나 동작 방식을 취향에 맞게 바꿀 수 있습니다.
            테마(색상), 비교 화면 스타일 등을 설정 화면에서 변경할 수 있습니다.
          </p>

          <SectionHeading id="settings-open" level={3}>설정 화면 열기</SectionHeading>
          <StepByStep steps={[
            {
              title: '백틱(`) 키를 누릅니다',
              description: (
                <span>
                  <KeyBadge>`</KeyBadge> (백틱 — 키보드 숫자 1 왼쪽, 물결표 ~ 와 같은 키)를 누르면 설정 화면이 열립니다.
                </span>
              ),
            },
            {
              title: '설정 항목을 선택합니다',
              description: (
                <span>
                  <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge>로 변경하고 싶은 설정 항목을 선택합니다.
                </span>
              ),
            },
            {
              title: '값을 변경합니다',
              description: (
                <span>
                  <KeyBadge>{'\u2190'}</KeyBadge><KeyBadge>{'\u2192'}</KeyBadge> 좌우 화살표로 값을 바꿉니다.
                  예를 들어 테마를 고를 때 좌우 화살표로 다른 테마를 미리보기할 수 있습니다.
                </span>
              ),
            },
            {
              title: 'Enter로 저장하거나 Esc로 취소합니다',
              description: (
                <span>
                  <KeyBadge>Enter</KeyBadge>를 누르면 변경사항이 저장됩니다.
                  마음에 안 들면 <KeyBadge>Esc</KeyBadge>를 눌러 변경 없이 나갈 수 있습니다.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="theme-change" level={3}>테마 (색상) 변경</SectionHeading>
          <p className="text-zinc-400 mb-4">
            cokacdir의 색상 조합을 바꿀 수 있습니다. 기본 테마가 마음에 안 들면 다른 테마로 바꿔보세요.
          </p>
          <p className="text-zinc-400 mb-4">
            테마 파일은 cokacdir를 처음 실행할 때 자동으로 생성됩니다.
            위치는 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/themes/</code> 폴더입니다.
          </p>

          <TipBox>
            JSON 파일을 직접 편집하면 더 세밀한 색상 커스터마이징이 가능합니다.
            하지만 처음에는 설정 화면에서 제공하는 테마 중 골라 쓰는 것으로 충분합니다.
          </TipBox>

          <TipBox variant="note">
            설정은 <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/</code> 폴더에
            저장되어 다음에 cokacdir를 실행할 때도 유지됩니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Customize cokacdir's appearance and behavior to your liking.
            Change themes (colors), diff view styles, and more from the settings screen.
          </p>

          <SectionHeading id="settings-open" level={3}>Opening Settings</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Press the backtick (`) key',
              description: (
                <span>
                  Press <KeyBadge>`</KeyBadge> (backtick — the key to the left of 1, same key as tilde ~) to open settings.
                </span>
              ),
            },
            {
              title: 'Select a setting',
              description: (
                <span>
                  Use <KeyBadge>{'\u2191'}</KeyBadge><KeyBadge>{'\u2193'}</KeyBadge> to choose the setting you want to change.
                </span>
              ),
            },
            {
              title: 'Change the value',
              description: (
                <span>
                  Use <KeyBadge>{'\u2190'}</KeyBadge><KeyBadge>{'\u2192'}</KeyBadge> left/right arrows to change values.
                  For example, when choosing a theme, you can preview different themes with the arrow keys.
                </span>
              ),
            },
            {
              title: 'Press Enter to save or Esc to cancel',
              description: (
                <span>
                  Press <KeyBadge>Enter</KeyBadge> to save changes.
                  Press <KeyBadge>Esc</KeyBadge> to exit without saving.
                </span>
              ),
            },
          ]} />

          <SectionHeading id="theme-change" level={3}>Changing Themes (Colors)</SectionHeading>
          <p className="text-zinc-400 mb-4">
            Change cokacdir's color scheme. If you don't like the default theme, try a different one.
          </p>
          <p className="text-zinc-400 mb-4">
            Theme files are automatically generated when you first run cokacdir.
            They're located in the <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/themes/</code> folder.
          </p>

          <TipBox>
            For more fine-grained color customization, you can directly edit the JSON files.
            But for beginners, the built-in themes from the settings screen are more than enough.
          </TipBox>

          <TipBox variant="note">
            Settings are saved in the <code className="text-accent-cyan font-mono bg-bg-elevated px-1 py-0.5 rounded">~/.cokacdir/</code> folder
            and persist across cokacdir sessions.
          </TipBox>
        </>
      )}
    </section>
  )
}
