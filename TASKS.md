# Tasks frontend

`src/features/tasks` supplies the shared board used by `/tasks` and department/event card tabs. It uses the task API from the matching backend `feat/card-tasks` branch. Both parts must be released together.

Views: departments, events, and general tasks; expandable tables, status/responsible/search filters, task form, history, and archive. New task context preselects the current department/event. The backend decides deletion capability via task options. Optimistic version conflicts preserve the draft and require explicit review/rebase before saving.

Check with `npm test`, `npm run lint`, `npm run build`. Browser test: run backend `tests/serve_tasks_smoke.py` with a fresh temporary DB, build frontend with `VITE_API_BASE_URL=http://127.0.0.1:4175`, then run `node --experimental-websocket tests/browser-tasks-smoke.mjs`. Screenshots go to `../.tools/browser` by default. Stop the fixture when done. Chrome may be selected with CHROME_BIN.

No Telegram integration is delivered; the backend task IDs and audited changes are ready for a future notification service.
