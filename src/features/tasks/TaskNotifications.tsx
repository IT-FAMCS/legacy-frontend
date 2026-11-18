import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTaskNotifications, setTaskNotifications } from '../../api/tasks';
import { useUserStore } from '../../stores/user';

export function TaskNotifications({ taskId }: { taskId?: number }) {
  const client = useQueryClient();
  const userId = useUserStore(state => state.user?.id);
  const key = ['task-notifications', userId, taskId ?? 'all'];
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => getTaskNotifications(taskId, signal),
    enabled: !!userId,
  });
  const save = useMutation({
    mutationFn: (enabled: boolean) => setTaskNotifications(taskId, enabled),
    onSuccess: async value => {
      await client.cancelQueries({ queryKey: key, exact: true });
      client.setQueryData(key, value);
    },
  });
  return <div className="task-notifications">
    <label><input type="checkbox" checked={query.data?.enabled ?? false}
      disabled={!query.data || save.isPending}
      onChange={event => save.mutate(event.target.checked)} />
      {taskId === undefined ? 'Получать уведомления о тасках в Telegram' : 'Получать уведомления об этой таске в Telegram'}
    </label>
    {taskId === undefined && query.data?.enabled === false && <p>Уведомления отключены для всех тасок. Настройки отдельных тасок сохранены.</p>}
    {query.isPending && <p role="status">Загружаем настройки…</p>}
    {query.isError && <p role="alert">{query.error.message} <button type="button" onClick={() => void query.refetch()}>Повторить</button></p>}
    {save.isError && <p role="alert">{save.error.message}</p>}
  </div>;
}
