import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ViewerImage { src: string; title: string; description?: string }
type OpenViewer = (images: ViewerImage[], index?: number) => void;
const ViewerContext = createContext<OpenViewer>(() => {});
export const useImageViewer = () => useContext(ViewerContext);

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<{ images: ViewerImage[]; index: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback<OpenViewer>((images, index = 0) => {
    if (!images.length) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setView({ images, index });
  }, []);
  const isOpen = view !== null;
  useEffect(() => {
    if (!isOpen) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      opener.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);
  // Keep the last image on screen while the dialog fades out after closing.
  const [lastView, setLastView] = useState(view);
  if (view && view !== lastView) setLastView(view);
  const shown = view ?? lastView;
  const move = (delta: number) => setView(v => v ? { ...v, index: (v.index + delta + v.images.length) % v.images.length } : v);
  const current = shown?.images[shown.index];
  return <ViewerContext.Provider value={open}>
    {children}
    {createPortal(<dialog ref={dialog} className="image-viewer" aria-labelledby="viewer-title"
      onCancel={() => setView(null)} onClick={e => { if (e.target === e.currentTarget) setView(null); }}
      onKeyDown={e => { if (view && view.images.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); move(e.key === 'ArrowRight' ? 1 : -1); } }}>
      {current && <div className="image-viewer__content">
        <button type="button" className="viewer-close" onClick={() => setView(null)} aria-label="Закрыть изображение">Закрыть <span aria-hidden="true">×</span></button>
        <img key={current.src} src={current.src} alt={current.title} className="image-viewer__image" />
        <div className="image-viewer__footer">
          <div><h2 id="viewer-title">{current.title}</h2>{current.description && <p>{current.description}</p>}</div>
          {shown && shown.images.length > 1 && <div className="viewer-nav">
            <button type="button" className="arrow-control" onClick={() => move(-1)} aria-label="Предыдущее изображение">←</button>
            <span aria-live="polite">{shown.index + 1} / {shown.images.length}</span>
            <button type="button" className="arrow-control" onClick={() => move(1)} aria-label="Следующее изображение">→</button>
          </div>}
        </div>
      </div>}
    </dialog>, document.body)}
  </ViewerContext.Provider>;
}
