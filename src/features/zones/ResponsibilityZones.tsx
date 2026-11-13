import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearZones, createZone, deleteZone, getZoneHistory, getZones, telegramContactUrl, updateZone, type Zone, type ZoneBoard, type ZoneInput, type ZonePerson } from '../../api/zones';
import { TaskDialog } from '../tasks/TaskDialog';
import { formatDateTime } from '../../utils/date';
import '../tasks/tasks.css';
import './zones.css';
function Person({person}:{person:ZonePerson}) {
  const url=telegramContactUrl(person.telegram);
  return <span className={`zone-person${person.active?'':' zone-person-inactive'}`}><strong>{person.name}</strong>
    {person.telegram ? url ? <a href={url} target="_blank" rel="noreferrer">{person.telegram}</a> : <span>{person.telegram}</span> : <small>Telegram не указан</small>}
    {!person.active&&<small>Аккаунт неактивен</small>}</span>;
}
function ZoneForm({zone,board,onSave,onClose,onReload}:{zone?:Zone;board:ZoneBoard;onSave:(value:ZoneInput)=>Promise<void>;onClose:()=>void;onReload:()=>void}) {
  const [value,setValue]=useState<ZoneInput>({title:zone?.title||'',people_required:zone?.people_required||1,lead_user_id:zone?.lead_user_id||null,helper_ids:zone?.helper_ids||[]});
  const [search,setSearch]=useState('');const [error,setError]=useState('');const [saving,setSaving]=useState(false);
  const users=[...board.users,...[...(zone?.lead?[zone.lead]:[]),...(zone?.helpers||[])].filter(p=>!board.users.some(u=>u.id===p.id))];
  const cancel=()=>{if(!saving)onClose();};
  return <TaskDialog title={zone?'Редактировать зону':'Новая зона ответственности'} onClose={cancel}><form className="task-form zone-form" onSubmit={async event=>{event.preventDefault();setError('');setSaving(true);try{await onSave(value);}catch(reason){setError(reason instanceof Error?reason.message:'Не удалось сохранить');}finally{setSaving(false);}}}>
    <label>Название<input name="zone-title" autoFocus required maxLength={200} value={value.title} onChange={e=>setValue({...value,title:e.target.value})} /></label>
    <label>Нужно людей<input name="zone-required" type="number" min={1} max={1000} required value={value.people_required} onChange={e=>setValue({...value,people_required:Number(e.target.value)})} /></label>
    <p className="task-hint">Главный входит в общее число. Зона закрыта, когда назначен действующий главный и набрано нужное число людей.</p>
    <label>Главный ответственный<select name="zone-lead" value={value.lead_user_id||''} onChange={e=>{const id=e.target.value?Number(e.target.value):null;setValue({...value,lead_user_id:id,helper_ids:value.helper_ids.filter(uid=>uid!==id)});}}>
      <option value="">Пока не назначен</option>{users.map(user=><option value={user.id} key={user.id}>{user.name}{user.telegram?` · ${user.telegram}`:''}{user.active?'':' (неактивен)'}</option>)}</select></label>
    <fieldset className="task-picker"><legend>Помогаторы · {value.helper_ids.length}</legend><input type="search" aria-label="Поиск помогаторов" placeholder="Имя, логин или Telegram" value={search} onChange={e=>setSearch(e.target.value)} />
      <div className="task-picker-options">{users.filter(user=>user.id!==value.lead_user_id&&`${user.name} ${user.login} ${user.telegram||''}`.toLowerCase().includes(search.toLowerCase())).map(user=><label key={user.id}><input type="checkbox" checked={value.helper_ids.includes(user.id)} onChange={()=>setValue({...value,helper_ids:value.helper_ids.includes(user.id)?value.helper_ids.filter(id=>id!==user.id):[...value.helper_ids,user.id]})} />{user.name}{user.telegram?` · ${user.telegram}`:''}{user.active?'':' (неактивен)'}</label>)}</div></fieldset>
    {error&&<div className="task-error" role="alert">{error}<button type="button" className="task-link" onClick={()=>{if(window.confirm('Загрузить актуальные данные? Несохранённые поля формы будут сброшены.'))onReload();}}>Загрузить актуальные данные</button></div>}
    <div className="task-form-footer"><button type="button" className="task-button" disabled={saving} onClick={cancel}>Отмена</button><button className="task-button task-primary" type="submit" disabled={saving||!value.title.trim()}>{saving?'Сохраняем…':'Сохранить зону'}</button></div>
  </form></TaskDialog>;
}
function History({cardId,onClose}:{cardId:number;onClose:()=>void}) {
  const query=useQuery({queryKey:['zone-history',cardId],queryFn:({signal})=>getZoneHistory(cardId,signal)});
  const labels={create:'Создана зона',update:'Изменена зона',clear:'Очищены ответственные',delete:'Удалена зона'};
  return <TaskDialog title="История зон ответственности" onClose={onClose}>{query.isPending?<p role="status">Загружаем…</p>:query.isError?<p role="alert">{query.error.message}</p>:<ol className="task-timeline">{query.data.map(entry=><li key={entry.id}><div className="task-timeline-heading"><strong>{labels[entry.action]} · {entry.after?.title||entry.before?.title}</strong><time>{formatDateTime(entry.created_at)}</time></div><p className="task-hint">{entry.actor_name}</p>
    {entry.before&&<p className="task-hint">Было: главный — {entry.before.lead?.name||'не назначен'}; помогаторы — {entry.before.helpers.map(p=>p.name).join(', ')||'нет'}; нужно {entry.before.people_required}.</p>}
    {entry.after&&<p>Стало: главный — {entry.after.lead?.name||'не назначен'}; помогаторы — {entry.after.helpers.map(p=>p.name).join(', ')||'нет'}; нужно {entry.after.people_required}.</p>}</li>)}</ol>}</TaskDialog>;
}
export function ResponsibilityZones({cardId}:{cardId:number}) {
  const client=useQueryClient();const [form,setForm]=useState<{zone?:Zone}|null>(null);const [history,setHistory]=useState(false);const [error,setError]=useState('');
  const query=useQuery({queryKey:['zones',cardId],queryFn:({signal})=>getZones(cardId,signal),refetchInterval:30000});
  const changed=(board:ZoneBoard)=>{client.setQueryData(['zones',cardId],board);void client.invalidateQueries({queryKey:['zone-history',cardId]});setError('');};
  const clear=useMutation({mutationFn:()=>clearZones(cardId,query.data!.version),onSuccess:changed,onError:reason=>{setError(reason.message);void query.refetch();}});
  const remove=useMutation({mutationFn:(zone:Zone)=>deleteZone(cardId,zone,query.data!.version),onSuccess:changed,onError:reason=>{setError(reason.message);void query.refetch();}});
  if(query.isPending)return <p role="status">Загружаем зоны ответственности…</p>;
  if(query.isError)return <p role="alert">{query.error.message}</p>;
  const board=query.data;const busy=clear.isPending||remove.isPending;
  return <section className="zone-board" aria-label="Зоны ответственности"><div className="tasks-heading"><div><p className="tasks-eyebrow">Команда мероприятия</p><h1>Зоны ответственности</h1><p className="task-hint">{board.card.title} · главный и помогаторы для каждого направления работы.</p></div>{board.can_edit&&<button className="task-button task-primary" onClick={()=>setForm({})}>+ Добавить зону</button>}</div>
    <div className="zone-counters"><div><span>Всего зон</span><strong>{board.total}</strong></div><div className="zone-counter-closed"><span>Закрыто людьми</span><strong>{board.closed}</strong></div><div className="zone-counter-open"><span>Нужно назначить</span><strong>{board.open}</strong></div></div>
    <div className="zone-toolbar"><button className="task-button" onClick={()=>setHistory(true)}>История изменений</button>{board.can_edit&&<button className="task-button" disabled={busy||board.zones.every(zone=>!zone.lead&&!zone.helpers.length)} onClick={()=>{if(window.confirm('Очистить главных и помогаторов во всех зонах этого мероприятия? Сами зоны и нужное число людей сохранятся.'))clear.mutate();}}>Очистить ответственных</button>}</div>
    {error&&<p role="alert" className="task-error">{error}</p>}
    {!board.zones.length?<div className="task-empty"><h2>Пока нет зон ответственности</h2><p>{board.can_edit?'Добавьте первую зону и укажите, сколько людей нужно.':'Зоны добавят пользователи с правом редактирования мероприятия.'}</p></div>:<div className="zone-surface"><div className="task-table-scroll"><table className="zone-table"><thead><tr><th>Зона</th><th>Главный</th><th>Помогаторы</th><th>Люди</th><th>Статус</th>{board.can_edit&&<th>Действия</th>}</tr></thead><tbody>{board.zones.map(zone=><tr key={zone.id} data-zone-id={zone.id}><th scope="row">{zone.title}</th><td>{zone.lead?<Person person={zone.lead}/>:<span className="zone-unfilled">Не назначен</span>}</td><td>{zone.helpers.length?zone.helpers.map(p=><Person key={p.id} person={p}/>):<span className="task-muted">Пока никого</span>}</td><td><strong>{zone.filled}</strong> / {zone.people_required}<small className="zone-required">нужно {zone.people_required}</small></td><td><span className={`zone-status ${zone.closed?'zone-closed':'zone-open'}`}>{zone.closed?'Закрыта':'Не закрыта'}</span></td>{board.can_edit&&<td><div className="task-row-actions"><button className="task-link" disabled={busy} onClick={()=>setForm({zone})}>Редактировать</button><button className="task-link task-danger" disabled={busy} onClick={()=>{if(window.confirm(`Удалить зону «${zone.title}»?`))remove.mutate(zone);}}>Удалить</button></div></td>}</tr>)}</tbody></table></div></div>}
    {form&&<ZoneForm key={`${form.zone?.id||'new'}:${form.zone?.version||0}`} zone={form.zone} board={board} onClose={()=>setForm(null)} onReload={async()=>{const latest=await query.refetch();setForm(form.zone?{zone:latest.data?.zones.find(z=>z.id===form.zone?.id)}:{});}}
      onSave={async value=>{try{const result=form.zone?await updateZone(cardId,form.zone,value,board.version):await createZone(cardId,value,board.version);changed(result);setForm(null);}catch(reason){void query.refetch();throw reason;}}}/>} {history&&<History cardId={cardId} onClose={()=>setHistory(false)}/>} </section>;
}
