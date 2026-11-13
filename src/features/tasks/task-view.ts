import type { Task } from '../../api/tasks';
export type GroupMode = 'departments' | 'events' | 'general' | 'department-card' | 'event-card';
export type TaskGroup = { key: string; label: string; tasks: Task[] };
export type TaskFilters = { search: string; status: string; assignee: string };
export function localToday(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function isOverdue(task: Task, today = localToday()): boolean {
  return !task.completed && !task.archived && !!task.deadline && task.deadline < today;
}
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  const search = filters.search.trim().toLocaleLowerCase('ru');
  return tasks.filter(task => {
    if (filters.status === 'done' && !task.completed) return false;
    if (filters.status === 'open' && task.completed) return false;
    if (filters.status === 'overdue' && !isOverdue(task)) return false;
    if (filters.assignee && !task.assignee_ids.includes(Number(filters.assignee))) return false;
    const text = [task.title, task.description, task.event?.title, ...task.departments.map(d => d.title),
      ...task.assignees.map(u => `${u.name} ${u.login}`)].join(' ').toLocaleLowerCase('ru');
    return !search || text.includes(search);
  });
}
export function groupTasks(tasks: Task[], mode: GroupMode): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();
  function add(key: string, label: string, task: Task) {
    if (!groups.has(key)) groups.set(key, { key, label, tasks: [] });
    groups.get(key)!.tasks.push(task);
  }
  for (const task of tasks) {
    if (mode === 'departments') {
      if (!task.departments.length) add('none', 'Без отдела', task);
      for (const department of task.departments) add(String(department.id), department.title, task);
    } else if (mode === 'events' || mode === 'department-card') {
      add(task.event ? String(task.event.id) : 'none', task.event?.title || (mode === 'department-card' ? 'Общие задачи отдела' : 'Без мероприятия'), task);
    } else if (mode === 'general') {
      if (!task.event && !task.departments.length) add('all', 'Общие задачи', task);
    } else add('all', 'Задачи мероприятия', task);
  }
  return [...groups.values()].sort((a, b) => a.key === 'none' ? 1 : b.key === 'none' ? -1 : a.label.localeCompare(b.label, 'ru'));
}

import type { TaskInput } from '../../api/tasks';
export function taskInput(task: Task): TaskInput {
  return { title: task.title, description: task.description, deadline: task.deadline, event_card_id: task.event_card_id,
    department_card_ids: task.department_card_ids, assignee_ids: task.assignee_ids };
}
export function rebaseDraft(original: TaskInput, draft: TaskInput, latest: TaskInput): TaskInput {
  const changes = Object.fromEntries((Object.keys(draft) as (keyof TaskInput)[])
    .filter(key => JSON.stringify(original[key]) !== JSON.stringify(draft[key])).map(key => [key, draft[key]]));
  return { ...latest, ...changes };
}
