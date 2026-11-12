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
    return () => dialog?.close();
  }, []);
  return <dialog className="equipment-dialog equipment-surface" ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!busy) onClose(); }}
    onClick={event => {
      event.stopPropagation();
      if (event.target !== event.currentTarget || busy) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="equipment-dialog-heading"><h2 id={titleId}>{title}</h2>
      <button type="button" className="equipment-button equipment-dialog-close" aria-label="Закрыть окно" disabled={busy} onClick={onClose}><span aria-hidden="true">×</span></button>
    </div>
    <div className="equipment-dialog-content">{children}</div>
  </dialog>;
}
