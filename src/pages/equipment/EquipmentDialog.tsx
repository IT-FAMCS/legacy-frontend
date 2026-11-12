import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export function EquipmentDialog({ title, children, onClose, busy = false }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog className="equipment-dialog equipment-surface" ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="equipment-dialog-heading"><h2 id={titleId}>{title}</h2>
      <button type="button" className="equipment-button" aria-label="Закрыть окно" disabled={busy} onClick={onClose}>Закрыть</button>
    </div>
    {children}
  </dialog>;
}
