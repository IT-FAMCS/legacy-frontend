import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export function ModalWrapper({ setIsOpen, children }: {
  setIsOpen: (isOpen: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    // Existing forms supply their own heading; keep it as the accessible title.
    const heading = dialog?.querySelector('h1, h2, h3');
    if (heading) {
      if (!heading.id) heading.id = titleId;
      dialog?.setAttribute('aria-labelledby', heading.id);
      dialog?.removeAttribute('aria-label');
    }
    dialog?.showModal();
    return () => dialog?.close();
  }, [titleId]);

  return createPortal(
    <dialog ref={ref} className="app-modal" aria-label="Диалоговое окно"
      onCancel={event => { event.preventDefault(); event.stopPropagation(); setIsOpen(false); }}
      onClick={event => {
        event.stopPropagation();
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setIsOpen(false);
      }}>
      <button type="button" className="app-modal-close" aria-label="Закрыть окно" onClick={() => setIsOpen(false)}>
        <span aria-hidden="true">×</span>
      </button>
      <div className="app-modal-content">{children}</div>
    </dialog>, document.body
  );
}
