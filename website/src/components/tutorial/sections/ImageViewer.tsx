import SectionHeading from '../ui/SectionHeading'
import KeyBadge from '../ui/KeyBadge'
import TipBox from '../ui/TipBox'
import StepByStep from '../ui/StepByStep'
import { useLanguage } from '../LanguageContext'

export default function ImageViewer() {
  const { lang, t } = useLanguage()

  return (
    <section className="mb-16">
      <SectionHeading id="image-viewer">{t('Image Viewer', '이미지 보기')}</SectionHeading>

      {lang === 'ko' ? (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir는 터미널 안에서 바로 이미지를 볼 수 있습니다.
            사진 폴더를 탐색하면서 일일이 다른 프로그램으로 열지 않아도
            어떤 이미지인지 빠르게 확인할 수 있습니다.
            PNG, JPG, GIF, BMP, WebP 등 일반적인 이미지 형식을 지원합니다.
          </p>

          <SectionHeading id="image-open" level={3}>이미지 열기</SectionHeading>
          <StepByStep steps={[
            {
              title: '이미지 파일로 커서를 이동합니다',
              description: '.jpg, .png 등의 이미지 파일 위에 커서를 놓으세요.',
            },
            {
              title: 'Enter를 누릅니다',
              description: '이미지가 터미널 화면에 표시됩니다. 터미널 특성상 픽셀 단위로 선명하지는 않지만, 어떤 이미지인지 충분히 알아볼 수 있습니다.',
            },
          ]} />

          <SectionHeading id="image-controls" level={3}>이미지 뷰어에서 할 수 있는 것들</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>+</KeyBadge> / <KeyBadge>-</KeyBadge>
                <span className="text-white font-semibold">확대 / 축소</span>
              </div>
              <p className="text-zinc-400 text-sm">
                이미지를 더 크게 또는 작게 볼 수 있습니다.
                <KeyBadge>R</KeyBadge>을 누르면 원래 크기로 돌아갑니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge> <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge>
                <span className="text-white font-semibold">이미지 이동 (패닝)</span>
              </div>
              <p className="text-zinc-400 text-sm">
                확대한 이미지의 다른 부분을 보고 싶을 때 화살표로 이미지를 움직일 수 있습니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>PgUp</KeyBadge> / <KeyBadge>PgDn</KeyBadge>
                <span className="text-white font-semibold">이전/다음 이미지</span>
              </div>
              <p className="text-zinc-400 text-sm">
                같은 폴더에 있는 이전/다음 이미지로 넘어갑니다.
                이미지 뷰어를 닫지 않고 사진첩을 넘기듯이 볼 수 있어서 편리합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Space</KeyBadge>
                <span className="text-white font-semibold">이미지 선택/해제</span>
              </div>
              <p className="text-zinc-400 text-sm">
                이미지를 보면서 마음에 드는 것을 선택할 수 있습니다.
                여러 이미지를 선택한 뒤 뷰어를 닫으면 선택이 유지되어 복사나 이동이 가능합니다.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Delete</KeyBadge>
                <span className="text-white font-semibold">이미지 삭제</span>
              </div>
              <p className="text-zinc-400 text-sm">
                보고 있는 이미지를 바로 삭제할 수 있습니다.
                불필요한 사진을 정리할 때 "보면서 삭제"가 가능합니다.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge> 또는 <KeyBadge>Q</KeyBadge>
              <span className="text-zinc-400">이미지 뷰어를 닫고 파일 목록으로 돌아갑니다</span>
            </div>
          </div>

          <TipBox>
            사진 폴더에서 <KeyBadge>PgUp</KeyBadge>/<KeyBadge>PgDn</KeyBadge>으로 사진을 넘기면서
            <KeyBadge>Space</KeyBadge>로 원하는 사진만 선택하고, 뷰어를 닫은 뒤 한 번에 복사하면
            효율적으로 사진을 골라낼 수 있습니다.
          </TipBox>

          <TipBox variant="note">
            터미널에서 이미지를 보여주는 것이라 일반 사진 뷰어보다 화질이 낮을 수 있습니다.
            Kitty, iTerm2 등 이미지 프로토콜을 지원하는 터미널을 사용하면 더 선명한 이미지를 볼 수 있습니다.
          </TipBox>
        </>
      ) : (
        <>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            cokacdir can display images right in the terminal.
            Browse through a photo folder and quickly preview images without opening a separate app.
            Supports common formats: PNG, JPG, GIF, BMP, WebP, and more.
          </p>

          <SectionHeading id="image-open" level={3}>Opening an Image</SectionHeading>
          <StepByStep steps={[
            {
              title: 'Move cursor to an image file',
              description: 'Navigate to a .jpg, .png, or other image file.',
            },
            {
              title: 'Press Enter',
              description: 'The image is displayed in the terminal. It may not be pixel-perfect due to terminal limitations, but you can easily identify the image.',
            },
          ]} />

          <SectionHeading id="image-controls" level={3}>Image Viewer Controls</SectionHeading>
          <div className="space-y-3 mb-6">
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>+</KeyBadge> / <KeyBadge>-</KeyBadge>
                <span className="text-white font-semibold">Zoom In / Out</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Make the image larger or smaller.
                Press <KeyBadge>R</KeyBadge> to reset to original size.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>{'\u2191'}</KeyBadge> <KeyBadge>{'\u2193'}</KeyBadge> <KeyBadge>{'\u2190'}</KeyBadge> <KeyBadge>{'\u2192'}</KeyBadge>
                <span className="text-white font-semibold">Pan Image</span>
              </div>
              <p className="text-zinc-400 text-sm">
                When zoomed in, use arrow keys to move around different parts of the image.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>PgUp</KeyBadge> / <KeyBadge>PgDn</KeyBadge>
                <span className="text-white font-semibold">Previous / Next Image</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Browse to the previous or next image in the same folder.
                Like flipping through a photo album without closing the viewer.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Space</KeyBadge>
                <span className="text-white font-semibold">Select / Deselect Image</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Mark images you like while browsing.
                Selections are preserved when you close the viewer, so you can copy or move them afterward.
              </p>
            </div>
            <div className="bg-bg-card border border-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <KeyBadge>Delete</KeyBadge>
                <span className="text-white font-semibold">Delete Image</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Delete the currently viewed image directly.
                Great for cleaning up unwanted photos while browsing.
              </p>
            </div>
          </div>

          <div className="bg-bg-card border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <KeyBadge>Esc</KeyBadge> or <KeyBadge>Q</KeyBadge>
              <span className="text-zinc-400">Close the image viewer and return to the file list</span>
            </div>
          </div>

          <TipBox>
            In a photo folder, flip through images with <KeyBadge>PgUp</KeyBadge>/<KeyBadge>PgDn</KeyBadge>,
            select favorites with <KeyBadge>Space</KeyBadge>, then close the viewer and copy them all at once
            for an efficient photo-picking workflow.
          </TipBox>

          <TipBox variant="note">
            Image quality may be lower than a dedicated photo viewer since it's rendered in the terminal.
            Using terminals that support image protocols (Kitty, iTerm2) will give you sharper images.
          </TipBox>
        </>
      )}
    </section>
  )
}
