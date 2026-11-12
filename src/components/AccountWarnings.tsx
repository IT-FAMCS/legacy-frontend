import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getWarnings, issueWarning, removeWarning } from "../api/warnings";
import type { MemberWarning } from "../api/warnings";
import { useWarningAccess, useWarningCounts } from "../hooks/use-warning-access";
import { EquipmentDialog } from "../pages/equipment/EquipmentDialog";
import { formatDateTime } from "../utils/date";
import "../pages/equipment/equipment.css";
import "./account-panels.css";

export function WarningHistoryContent({entries, canManage, onRemove}: {
  entries: MemberWarning[]; canManage: boolean; onRemove:(entry:MemberWarning)=>void;
}) {
  if (!entries.length) return <p className="warning-empty">Предупреждений пока нет.</p>;
  return <ol className="warning-records">{entries.map(entry=><li key={entry.id} className="warning-record">
    <div className="warning-record-heading"><span className={`warning-state ${entry.removed_at ? "warning-closed":"warning-active"}`}>
      {entry.removed_at ? "Снято":"Действует"}</span><span>№ {entry.id}</span></div>
    <p className="warning-reason">{entry.reason}</p>
    <p className="warning-meta">Выдал(а) <Link to={`/user/${encodeURIComponent(entry.issued_by.login)}`}>{entry.issued_by.name}</Link>
      {" · "}{formatDateTime(entry.issued_at)}</p>
    {entry.removed_at && <div className="warning-removal"><strong>Причина снятия</strong><p className="warning-reason">{entry.removal_reason}</p>
      <p className="warning-meta">Снял(а) {entry.removed_by && <Link to={`/user/${encodeURIComponent(entry.removed_by.login)}`}>{entry.removed_by.name}</Link>}
        {" · "}{formatDateTime(entry.removed_at)}</p></div>}
    {!entry.removed_at && canManage && <button type="button" className="equipment-button" onClick={()=>onRemove(entry)}>Снять предупреждение</button>}
  </li>)}</ol>;
}

function WarningReasonDialog({userId, removal, onClose}: {userId:number; removal?:MemberWarning; onClose:()=>void}) {
  const [reason,setReason]=useState("");
  const client=useQueryClient();
  const mutation=useMutation({mutationFn:()=>removal ? removeWarning(removal.id,reason.trim()) : issueWarning(userId,reason.trim()),
    onSuccess:async()=>{await client.invalidateQueries({queryKey:["warnings"]});onClose();},
    onError:()=>{void client.invalidateQueries({queryKey:["warnings"]});}});
  return <EquipmentDialog title={removal ? "Снять предупреждение":"Выдать предупреждение"} onClose={onClose} busy={mutation.isPending}>
    {removal && <p className="warning-original">{removal.reason}</p>}
    <form className="equipment-form" onSubmit={event=>{event.preventDefault();if(reason.trim())mutation.mutate();}}>
      <label htmlFor="warning-reason">{removal ? "Почему предупреждение снимается?":"За что выдаётся предупреждение?"}</label>
      <textarea id="warning-reason" name="reason" rows={4} maxLength={4000} required autoFocus value={reason}
        disabled={mutation.isPending} onChange={event=>setReason(event.target.value)} />
      <p className="equipment-muted">Причина обязательна и сохранится в истории вместе с вашим именем и временем.</p>
      {mutation.error && <p role="alert">{mutation.error.message}</p>}
      <div className="equipment-actions"><button type="submit" className="equipment-button equipment-primary" disabled={!reason.trim() || mutation.isPending}>
        {mutation.isPending ? "Сохранение…":removal ? "Снять предупреждение":"Выдать предупреждение"}</button>
        <button type="button" className="equipment-button" disabled={mutation.isPending} onClick={onClose}>Отмена</button></div>
    </form>
  </EquipmentDialog>;
}

export function WarningHistoryDialog({userId, name, canManage, onClose}: {
  userId:number; name:string; canManage:boolean; onClose:()=>void;
}) {
  const [removal,setRemoval]=useState<MemberWarning|null>(null);
  const history=useQuery({queryKey:["warnings","history",userId],queryFn:({signal})=>getWarnings(userId,signal),staleTime:0});
  return <><EquipmentDialog title={`Предупреждения: ${name}`} onClose={onClose}>
    <p className="equipment-muted">Новые записи сверху. Снятые предупреждения остаются в истории.</p>
    {history.isPending && <p role="status">Загрузка истории…</p>}
    {history.error && <p role="alert">{history.error.message} <button className="equipment-button" onClick={()=>void history.refetch()}>Повторить</button></p>}
    {!history.error && history.data && <WarningHistoryContent entries={history.data} canManage={canManage} onRemove={setRemoval} />}
  </EquipmentDialog>{removal && <WarningReasonDialog userId={userId} removal={removal} onClose={()=>setRemoval(null)} />}</>;
}

export function AccountWarnings({userId,name}: {userId:number;name:string}) {
  const {canView,canManage}=useWarningAccess();
  const counts=useWarningCounts(canView);
  const [history,setHistory]=useState(false);
  const [issue,setIssue]=useState(false);
  if (!canView) return null;
  const count=counts.data?.[String(userId)] || 0;
  return <section className="account-section account-warnings" aria-label="Предупреждения пользователя">
    <div className="account-section-heading"><div><h3>Предупреждения</h3><p>Действующие предупреждения и история решений</p></div>
      <span className="warning-count" aria-label={`Действующих предупреждений: ${count}`}>{counts.error ? "—":counts.isPending ? "…":count}</span></div>
    {counts.error && <p role="alert">{counts.error.message}</p>}
    <div className="equipment-actions"><button className="account-action" onClick={()=>setHistory(true)}>История предупреждений</button>
      {canManage && <button className="account-action account-action-primary" onClick={()=>setIssue(true)}>Выдать предупреждение</button>}</div>
    {history && <WarningHistoryDialog userId={userId} name={name} canManage={canManage} onClose={()=>setHistory(false)} />}
    {issue && <WarningReasonDialog userId={userId} onClose={()=>setIssue(false)} />}
  </section>;
}
