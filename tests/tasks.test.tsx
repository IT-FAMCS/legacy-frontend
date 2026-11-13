import test from 'node:test';
import assert from 'node:assert/strict';
import { groupTasks, filterTasks, isOverdue, rebaseDraft } from '../src/features/tasks/task-view';
import type { Task } from '../src/api/tasks';
test('shared task grouping, filtering and local deadline boundaries', () => {
const base: Task = { id: 1, title: 'План', description: '', deadline: '2026-11-12', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z', creator_id: 1, event_card_id: 20, event: { id: 20, title: 'Посвящение' }, department_card_ids: [10, 11], departments: [{ id: 10, title: 'IT' }, { id: 11, title: 'Культура' }], assignee_ids: [7], assignees: [{ id: 7, name: 'Анна', login: 'anna', active: true }], completed: false, archived: false, version: 1 };
const general = { ...base, id: 2, event_card_id: null, event: null, department_card_ids: [], departments: [] };
assert.deepEqual(Object.fromEntries(groupTasks([base, general], 'departments').map(g => [g.label, g.tasks.map(t => t.id)])), { IT: [1], 'Культура': [1], 'Без отдела': [2] });
assert.deepEqual(groupTasks([base, general], 'events').map(g => [g.label, g.tasks.map(t => t.id)]), [['Посвящение', [1]], ['Без мероприятия', [2]]]);
assert.deepEqual(groupTasks([base, general], 'general').flatMap(g => g.tasks.map(t => t.id)), [2]);
assert.deepEqual(groupTasks([base, general], 'department-card').map(g => g.label), ['Посвящение', 'Общие задачи отдела']);
assert.deepEqual(filterTasks([base, general], { search: 'анна', status: 'open', assignee: '7' }).map(t => t.id), [1, 2]);
assert.deepEqual(filterTasks([base, general], { search: 'культура', status: 'all', assignee: '' }).map(t => t.id), [1]);
assert.deepEqual(filterTasks([base, { ...general, completed: true }], { search: '', status: 'done', assignee: '' }).map(t => t.id), [2]);
assert.equal(isOverdue(base, '2026-11-13'), true);
assert.equal(isOverdue({ ...base, deadline: '2026-11-13' }, '2026-11-13'), false);
assert.equal(isOverdue({ ...base, completed: true }, '2026-11-13'), false);
assert.equal(isOverdue({ ...base, deadline: null }, '2026-11-13'), false);
});



test('conflict recovery reapplies only my changed fields and keeps other user updates', () => {
  const original = { title: 'План', description: 'Исходное описание', deadline: null, event_card_id: 3, department_card_ids: [1], assignee_ids: [7] };
  const draft = { ...original, title: 'Мой черновик' };
  const latest = { ...original, description: 'Новое описание другого участника', assignee_ids: [8] };
  assert.deepEqual(rebaseDraft(original, draft, latest), { title: 'Мой черновик', description: 'Новое описание другого участника', deadline: null, event_card_id: 3, department_card_ids: [1], assignee_ids: [8] });
});
