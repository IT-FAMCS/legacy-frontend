import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { TaskApiError, archiveTask, createTask, getTaskOptions, getTasks, updateTask, type Task } from '../../api/tasks';
import { formatDateTime } from '../../utils/date';
import { TaskEditor, type CardContext } from './TaskEditor';
import { TaskHistory } from './TaskHistory';
import { TaskDialog } from './TaskDialog';
import { filterTasks, groupTasks, isOverdue, type GroupMode } from './task-view';
import './tasks.css';

function deadlineLabel(value: string | null) {
  if (!value) return 'Без срока';
  return new Date(value + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function TasksBoard({ context, assigneeId, profileName }: { context?: CardContext; assigneeId?: number; profileName?: string }) {
  const client = useQueryClient();
  const [mode, setMode] = useState<GroupMode>('departments');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [assignee, setAssignee] = useState('');
  const [archived, setArchived] = useState(false);
  const [form, setForm] = useState<{ task?: Task } | null>(null);
  const [history, setHistory] = useState<Task | null>(null);
  const [removing, setRemoving] = useState<Task | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const tasks = useQuery({ queryKey: ['tasks', context?.id ?? 'all', archived, assigneeId ?? 'all'], queryFn: ({ signal }) => getTasks(context?.id, archived, signal, { assigneeId, activeOnly: assigneeId !== undefined }), refetchInterval: 30000 });
  const options = useQuery({ queryKey: ['task-options'], queryFn: ({ signal }) => getTaskOptions(signal), staleTime: 0 });
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['tasks'] }), client.invalidateQueries({ queryKey: ['task-history'] })]); };
  const success = (text: string) => { setError(''); setNotice(text); void refresh(); };
  const fail = (reason: Error) => { setNotice(''); setError(reason.message); void refresh(); };
  const create = useMutation({ mutationFn: createTask });
  const update = useMutation({ mutationFn: ({ task, data }: { task: Task; data: Parameters<typeof updateTask>[1] }) => updateTask(task.id, data) });
  const archive = useMutation({ mutationFn: (task: Task) => archiveTask(task.id, task.version), onSuccess: () => { setRemoving(null); success('Таска перенесена в архив. История сохранена.'); }, onError: reason => { fail(reason); if (reason instanceof TaskApiError && reason.status === 409) setRemoving(null); } });
  const busy = create.isPending || update.isPending || archive.isPending;
  const allTasks = tasks.data || [];
  const effectiveMode = context ? context.category_name === 'Мероприятия' ? 'event-card' : 'department-card' : mode;
  const inView = effectiveMode === 'general' ? allTasks.filter(t => !t.event && !t.departments.length) : allTasks;
  const filtered = filterTasks(inView, { search, status, assignee });
  const groups = groupTasks(filtered, effectiveMode);
  const done = inView.filter(t => t.completed).length;
  const overdue = inView.filter(t => isOverdue(t)).length;
  const assignees = new Map(options.data?.users.map(u => [u.id, u]) || []);
  allTasks.forEach(task => task.assignees.forEach(user => assignees.set(user.id, user)));
  const chooseMode = (next: GroupMode) => { setMode(next); setNotice(''); };
  return <section className={`tasks-board${context ? ' tasks-embedded' : ''}`} aria-label="Таски">
    <div className="tasks-heading"><div><p className="tasks-eyebrow">{context ? 'Таски карточки' : 'Совместная работа'}</p>
      <h1>{context?.title || (assigneeId !== undefined ? 'Действующие таски' : 'Таски')}</h1><p className="tasks-subtitle">{assigneeId !== undefined ? `Ответственный: ${profileName || 'пользователь'}. Показаны невыполненные таски.` : context ? 'Планы, ответственные и результат — в одном месте.' : 'Все дела организации. По отделам, мероприятиям и без привязки.'}</p></div>
      {!archived && assigneeId === undefined && <button className="task-button task-primary" disabled={!options.data || busy} onClick={() => { setForm({}); setNotice(''); }}>+ Новая таска</button>}</div>
    <div className="task-metrics"><div><span>Всего тасок</span><strong>{inView.length}</strong></div><div><span>В работе</span><strong>{inView.length - done}</strong></div><div><span>Выполнено</span><strong>{done}<small> / {inView.length}</small></strong></div><div className={overdue ? 'task-metric-overdue' : ''}><span>Просрочено</span><strong>{overdue}</strong></div></div>
    {!context && <nav className="task-mode-switch" aria-label="Группировка тасок">{([['departments', 'По отделам'], ['events', 'По мероприятиям'], ['general', 'Общие']] as const).map(([key, label]) =>
      <button type="button" key={key} aria-pressed={mode === key} onClick={() => chooseMode(key)}>{label}</button>)}</nav>}
    <div className="task-toolbar"><label className="task-search"><span>Поиск</span><input type="search" placeholder="Название, описание, ответственный…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label><span>Статус</span><select value={status} onChange={e => setStatus(e.target.value)} aria-label="Статус"><option value="all">{assigneeId === undefined ? "Все статусы" : "Все действующие"}</option><option value="open">В работе</option>{assigneeId === undefined && <option value="done">Выполнены</option>}<option value="overdue">Просрочены</option></select></label>
      {assigneeId === undefined && <label><span>Ответственный</span><select value={assignee} onChange={e => setAssignee(e.target.value)} aria-label="Ответственный"><option value="">Все ответственные</option>{[...assignees.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
      {assigneeId === undefined && <label className="task-archive-filter"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} /> Архив</label>}</div>
    {options.data && !options.data.can_delete && !archived && <p className="task-hint">Переносить таски в архив могут председатель и заместители.</p>}
    {notice && <p role="status" className="task-notice">{notice}</p>}
    {(error || tasks.isError || options.isError) && <div role="alert" className="task-error">{error || tasks.error?.message || options.error?.message} <button className="task-link" onClick={() => { setError(''); void tasks.refetch(); void options.refetch(); }}>Обновить</button></div>}
    {tasks.isPending ? <p role="status" className="task-empty">Загружаем таски…</p> : !tasks.isError && groups.length === 0 ? <div className="task-empty"><span className="task-empty-mark" aria-hidden="true">✓</span><h2>{search || status !== 'all' || assignee ? 'Ничего не найдено' : archived ? 'В архиве пока нет тасок' : 'Здесь пока нет тасок'}</h2><p>{search || status !== 'all' || assignee ? 'Попробуйте изменить поиск или фильтры.' : assigneeId !== undefined ? 'Здесь появятся невыполненные таски, назначенные пользователю.' : 'Создайте первую таску — у каждого дела будет свой срок и ответственные.'}</p></div> :
      <div className="task-groups">{groups.map(group => { const completed = group.tasks.filter(t => t.completed).length; return <details className="task-group" key={`${effectiveMode}-${group.key}`} open>
        <summary><span className="task-group-arrow" aria-hidden="true">›</span><h2>{group.label}</h2><span className="task-group-count">{completed} из {group.tasks.length} выполнено</span><span className="task-progress" aria-hidden="true"><span style={{ width: `${completed / group.tasks.length * 100}%` }} /></span></summary>
        <div className="task-table-scroll"><table className="task-table"><caption className="task-sr-only">{group.label}</caption><thead><tr><th scope="col">Таска</th><th scope="col">Ответственные</th><th scope="col">Создана</th><th scope="col">Дедлайн</th><th scope="col">Статус</th><th scope="col"><span className="task-sr-only">Действия</span></th></tr></thead>
          <tbody>{group.tasks.map(task => <tr key={task.id} data-task-id={task.id} className={task.completed ? 'task-row-done' : ''}>
            <td className="task-title-cell"><button className="task-title-button" onClick={() => task.archived ? setHistory(task) : setForm({ task })} disabled={!options.data}>{task.title}</button>
              {task.description && <p className="task-description">{task.description}</p>}
              <div className="task-tags">{task.departments.map(dept => <span key={dept.id}>{dept.title}</span>)}{task.event && <span className="task-event-tag">{task.event.title}</span>}</div></td>
            <td><div className="task-assignees">{task.assignees.length ? task.assignees.map(user => <Link key={user.id} to={`/user/${encodeURIComponent(user.login)}`} title={user.active ? user.name : `${user.name} · аккаунт отключён`}><span className="task-avatar" aria-hidden="true">{user.name.slice(0, 1)}</span>{user.name}</Link>) : <span className="task-muted">Не назначены</span>}</div></td>
            <td><time dateTime={task.created_at} className="task-date">{formatDateTime(task.created_at)}</time></td>
            <td><span className={isOverdue(task) ? 'task-deadline task-overdue' : 'task-deadline'}>{deadlineLabel(task.deadline)}{isOverdue(task) && <small>Просрочено</small>}</span></td>
            <td><label className={`task-status ${task.completed ? 'task-complete' : ''}`}><input type="checkbox" checked={task.completed} disabled={busy || task.archived} aria-label={`Выполнена: ${task.title}`} onChange={() => { update.mutate({ task, data: { version: task.version, completed: !task.completed } }, { onSuccess: () => success(task.completed ? 'Таска возвращена в работу' : 'Таска выполнена'), onError: fail }); }} />{task.completed ? 'Выполнена' : 'В работе'}</label></td>
            <td><div className="task-row-actions"><button className="task-link" onClick={() => setHistory(task)}>История</button>{options.data?.can_delete && !task.archived && <button className="task-link task-archive-action" disabled={busy} onClick={() => setRemoving(task)}>В архив</button>}</div></td>
          </tr>)}</tbody></table></div></details>; })}</div>}
    {form && options.data && <TaskEditor key={form.task?.id || 'new'} task={form.task} context={context} options={options.data} onClose={() => setForm(null)} onArchive={options.data.can_delete && form.task ? latest => { setRemoving(latest); setForm(null); } : undefined}
      onSave={async (input, version) => { try { if (form.task) await update.mutateAsync({ task: form.task, data: { ...input, version: version ?? form.task.version } }); else await create.mutateAsync(input); setForm(null); success(form.task ? 'Изменения сохранены' : 'Таска создана'); } catch (reason) { void refresh(); throw reason; } }} />}
    {history && <TaskHistory task={history} onClose={() => setHistory(null)} />}
    {removing && <TaskDialog title="Перенести таску в архив?" onClose={() => { if (!archive.isPending) setRemoving(null); }}><p>«{removing.title}» перейдёт в архив. История изменений сохранится.</p>
      {error && <p role="alert" className="task-error">{error}</p>}<div className="task-form-footer"><button className="task-button" disabled={archive.isPending} onClick={() => setRemoving(null)}>Отмена</button><button className="task-button task-primary" disabled={archive.isPending} onClick={() => archive.mutate(removing)}>{archive.isPending ? 'Переносим…' : 'В архив'}</button></div></TaskDialog>}
  </section>;
}
export function TasksPage() { return <TasksBoard />; }
