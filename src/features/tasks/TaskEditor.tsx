import { TaskApiError, getTask } from '../../api/tasks';
import { rebaseDraft, taskInput } from './task-view';
import { useState } from 'react';
import type { Task, TaskInput, TaskOptions } from '../../api/tasks';
import { TaskDialog } from './TaskDialog';
export type CardContext = { id: number; title: string; category_name?: string };
function Picker({ label, options, values, onChange }: { label: string; options: { id: number; label: string }[]; values: number[]; onChange: (ids: number[]) => void }) {
  const [search, setSearch] = useState('');
  return <fieldset className="task-picker"><legend>{label} <span>{values.length || ''}</span></legend>
    <input type="search" placeholder="Найти…" aria-label={`Поиск: ${label}`} value={search} onChange={e => setSearch(e.target.value)} />
    <div className="task-picker-options">{options.filter(o => o.label.toLowerCase().includes(search.trim().toLowerCase())).map(option =>
      <label key={option.id}><input type="checkbox" checked={values.includes(option.id)} onChange={() => onChange(values.includes(option.id) ? values.filter(id => id !== option.id) : [...values, option.id])} />{option.label}</label>)}
      {!options.length && <p>Пока нет доступных вариантов</p>}</div></fieldset>;
}
export function TaskEditor({ task, context, options, onSave, onClose, onArchive }: { task?: Task; context?: CardContext; options: TaskOptions; onSave: (input: TaskInput, version?: number) => Promise<void>; onClose: () => void; onArchive?: (task: Task) => void }) {
  const [baseline, setBaseline] = useState(task);
  const [conflict, setConflict] = useState<Task | null>(null);
  const initial: TaskInput = { title: baseline?.title || '', description: baseline?.description || '', deadline: baseline?.deadline || null,
    event_card_id: baseline ? baseline.event_card_id : context?.category_name === 'Мероприятия' ? context.id : null,
    department_card_ids: baseline ? baseline.department_card_ids : context?.category_name === 'Отделы и направления' ? [context.id] : [],
    assignee_ids: baseline?.assignee_ids || [] };
  const [value, setValue] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof TaskInput>(key: K, next: TaskInput[K]) => setValue(previous => ({ ...previous, [key]: next }));
  const close = () => { if (!saving && (JSON.stringify(initial) === JSON.stringify(value) || window.confirm('Закрыть без сохранения изменений?'))) onClose(); };
  const users = [...options.users, ...(baseline?.assignees.filter(u => !options.users.some(o => o.id === u.id)) || [])];
  return <TaskDialog title={task ? 'Редактировать таску' : 'Новая таска'} onClose={close}>
    <form className="task-form" onSubmit={async event => { event.preventDefault(); setError(''); setSaving(true);
      try { await onSave({ ...value, title: value.title.trim() }, baseline?.version); }
      catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Не удалось сохранить таску');
        if (baseline && reason instanceof TaskApiError && reason.status === 409) {
          try { setConflict(await getTask(baseline.id)); } catch { setError('Таска больше недоступна. Ваш черновик остался в форме.'); }
        }
      } finally { setSaving(false); } }}>
      <label><span>Название <span className="task-required">*</span></span><input autoFocus name="title" value={value.title} required maxLength={300} onChange={e => set('title', e.target.value)} placeholder="Что нужно сделать?" /></label>
      <label>Описание<textarea name="description" rows={4} maxLength={20000} value={value.description} onChange={e => set('description', e.target.value)} placeholder="Детали, ссылки и ожидаемый результат" /></label>
      <div className="task-form-columns"><label>Дедлайн<input type="date" name="deadline" value={value.deadline || ''} onChange={e => set('deadline', e.target.value || null)} /></label>
        <label>Мероприятие<select name="event_card_id" value={value.event_card_id || ''} onChange={e => set('event_card_id', e.target.value ? Number(e.target.value) : null)}>
          <option value="">Без мероприятия</option>{options.events.map(card => <option key={card.id} value={card.id}>{card.title}</option>)}</select></label></div>
      <div className="task-form-columns"><Picker label="Отделы и направления" options={options.departments.map(c => ({ id: c.id, label: c.title }))} values={value.department_card_ids} onChange={ids => set('department_card_ids', ids)} />
        <Picker label="Ответственные" options={users.map(u => ({ id: u.id, label: `${u.name} · ${u.login}${u.active ? '' : ' (аккаунт отключён)'}` }))} values={value.assignee_ids} onChange={ids => set('assignee_ids', ids)} /></div>
      <p className="task-hint">Одна таска появится во всех выбранных отделах и в мероприятии. Дата создания выставляется автоматически.</p>
      {error && <p role="alert" className="task-error">{error}</p>}
      {conflict && <div className="task-conflict" role="status"><strong>{conflict.archived ? 'Таска уже перенесена в архив' : 'Другой участник изменил таску'}</strong>
        <p>Ваш черновик сохранён в форме. Проверьте актуальные данные перед сохранением.</p>
        <dl className="task-changes"><div><dt>Название</dt><dd>{conflict.title}</dd></div><div><dt>Описание</dt><dd>{conflict.description || '—'}</dd></div><div><dt>Дедлайн</dt><dd>{conflict.deadline || 'Без срока'}</dd></div>
          <div><dt>Ответственные</dt><dd>{conflict.assignees.map(u => u.name).join(', ') || 'Не назначены'}</dd></div><div><dt>Отделы</dt><dd>{conflict.departments.map(c => c.title).join(', ') || 'Без отдела'}</dd></div><div><dt>Мероприятие</dt><dd>{conflict.event?.title || 'Без мероприятия'}</dd></div></dl>
        {!conflict.archived && <button type="button" className="task-button" onClick={() => { setValue(rebaseDraft(initial, value, taskInput(conflict))); setBaseline(conflict); setConflict(null); setError(''); }}>Применить мои правки к новой версии</button>}
      </div>}
      <div className="task-form-footer">{task && onArchive && <button type="button" className="task-button task-editor-archive" disabled={saving} onClick={() => { if (JSON.stringify(initial) === JSON.stringify(value) || window.confirm("Несохранённые изменения не попадут в архив. Продолжить?")) { if (baseline) onArchive(baseline); } }}>В архив</button>}<button type="button" className="task-button" disabled={saving} onClick={close}>Отмена</button>
        <button type="submit" className="task-button task-primary" disabled={saving || !!conflict || !value.title.trim()}>{saving ? 'Сохраняем…' : task ? 'Сохранить' : 'Создать таску'}</button></div>
    </form>
  </TaskDialog>;
}
