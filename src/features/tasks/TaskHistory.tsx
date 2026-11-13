import { useQuery } from '@tanstack/react-query';
import { getTaskHistory, type Task } from '../../api/tasks';
import { formatDateTime } from '../../utils/date';
import { TaskDialog } from './TaskDialog';
const labels: Record<string, string> = { title: 'Название', description: 'Описание', deadline: 'Дедлайн', event_card_id: 'Мероприятие', department_card_ids: 'Отделы', assignee_ids: 'Ответственные', completed: 'Статус' };
function fieldValue(task: Task | null, key: string): string {
  if (!task) return '—';
  if (key === 'event_card_id') return task.event?.title || 'Без мероприятия';
  if (key === 'department_card_ids') return task.departments.map(c => c.title).join(', ') || 'Без отдела';
  if (key === 'assignee_ids') return task.assignees.map(u => u.name).join(', ') || 'Не назначены';
  if (key === 'completed') return task.completed ? 'Выполнена' : 'В работе';
  return String(task[key as keyof Task] || '—');
}
export function TaskHistory({ task, onClose }: { task: Task; onClose: () => void }) {
  const query = useQuery({ queryKey: ['task-history', task.id], queryFn: ({ signal }) => getTaskHistory(task.id, signal), staleTime: 0 });
  return <TaskDialog title="История задачи" onClose={onClose}>
    <p className="task-history-title">{task.title}</p>
    {query.isPending ? <p role="status">Загружаем историю…</p> : query.isError ? <p role="alert" className="task-error">{query.error.message}</p> :
      <ol className="task-timeline">{query.data.map(entry => <li key={entry.id}>
        <div className="task-timeline-heading"><strong>{entry.action === 'create' ? 'Создана задача' : entry.action === 'archive' ? 'Задача удалена в архив' : 'Изменена задача'}</strong><time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time></div>
        <p className="task-hint">{entry.actor_name}</p>
        {entry.restricted ? <p>Подробности скрыты из-за ограничений доступа к связанным карточкам.</p> :
          <dl className="task-changes">{Object.entries(labels).filter(([key]) => !entry.before || JSON.stringify(entry.before[key as keyof Task]) !== JSON.stringify(entry.after?.[key as keyof Task])).map(([key, label]) =>
            <div key={key}><dt>{label}</dt><dd>{entry.before && <><span className="task-old-value">{fieldValue(entry.before, key)}</span><span aria-hidden="true"> → </span></>}{fieldValue(entry.after, key)}</dd></div>)}</dl>}
      </li>)}</ol>}
  </TaskDialog>;
}
