import { useEffect, useRef, type ReactNode } from 'react';
export function TaskDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="task-dialog" aria-labelledby="task-dialog-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <div className="task-dialog-heading"><h2 id="task-dialog-title">{title}</h2>
      <button type="button" className="task-icon-button" onClick={onClose} aria-label="Закрыть">×</button></div>
    {children}
  </dialog>;
}
