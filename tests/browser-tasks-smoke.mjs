// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const backend = "http://127.0.0.1:8013";
const origin = "http://127.0.0.1:4175";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-tasks-chrome-"));
const artifacts = resolve(process.env.SMOKE_ARTIFACT_DIR || "../.tools/browser");
await mkdir(artifacts, { recursive: true });
const dist = resolve("dist");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".gif": "image/gif" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, origin).pathname);
    const file = resolve(dist, "." + pathname);
    if (!file.startsWith(dist)) { response.writeHead(403).end(); return; }
    if (pathname.startsWith("/api/")) {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const result = await fetch(backend + pathname + new URL(request.url, origin).search, { method: request.method, headers: request.headers,
        body: chunks.length ? Buffer.concat(chunks) : undefined });
      response.writeHead(result.status, { "Content-Type": "application/json" });
      response.end(Buffer.from(await result.arrayBuffer()));
      return;
    }
    const extension = extname(file);
    const body = await readFile(extension ? file : join(dist, "index.html"));
    response.writeHead(200, { "Content-Type": types[extension || ".html"] || "application/octet-stream" });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolveReady => server.listen(4175, "127.0.0.1", resolveReady));

let chrome;
let websocket;
const calls = new Map();
let nextId = 0;
const apiRequests = [];
const runtimeErrors = [];
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
const command = (method, params = {}) => new Promise((resolveCommand, rejectCommand) => {
  const id = ++nextId;
  const timeout = setTimeout(() => { calls.delete(id); rejectCommand(new Error(`CDP timeout: ${method}`)); }, 15_000);
  calls.set(id, { resolve: result => { clearTimeout(timeout); resolveCommand(result); },
    reject: error => { clearTimeout(timeout); rejectCommand(error); } });
  websocket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const waitFor = async (expression, label) => {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try { if (await evaluate(`Boolean(${expression})`)) return; } catch { /* Navigation can replace the execution context. */ }
    await delay(100);
  }
  throw new Error(`Timed out: ${label}; body: ${await evaluate("document.body.innerText")}`);
};
const navigate = async path => {
  await command("Page.navigate", { url: origin + path });
  await waitFor("document.readyState === 'complete' && document.querySelector('#root')?.children.length > 0", path);
};
const click = async selector => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await delay(100);
};
const fill = async (selector, value) => {
  await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
    Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', {bubbles: true})); })()`);
  await delay(50);
};
const memberLogin = async login => {
  await evaluate("if (location.protocol === 'http:') localStorage.removeItem('jwt_token')");
  await navigate("/login");
  await fill("#login", login);
  await fill("#password", "smoke-password");
  await click("button[type=submit]");
  await waitFor("location.pathname === '/home' && document.querySelector('header')", "member login");
};


try {
  assert.equal((await fetch(backend)).status, 200, 'Start tasks-back/tests/serve_tasks_smoke.py first');
  chrome = spawn(chromePath, ['--headless', '--no-sandbox', '--disable-gpu', '--in-process-gpu', '--disable-software-rasterizer', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${directory}`, '--remote-debugging-port=9227', 'about:blank'], { windowsHide:true, stdio:'ignore' });
  let pages;
  for(let attempt=0; attempt<60; attempt++) { try { pages=await (await fetch('http://127.0.0.1:9227/json/list')).json(); if(pages.length) break; } catch {} await delay(100); }
  assert.ok(pages?.length, 'Chrome started');
  websocket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  websocket.addEventListener('message', event=> { const message=JSON.parse(event.data); if(message.id && calls.has(message.id)) {const pending=calls.get(message.id); calls.delete(message.id); if(message.error) pending.reject(new Error(JSON.stringify(message.error))); else pending.resolve(message.result); } if(message.method==='Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails); });
  await new Promise((resolveOpen,rejectOpen)=>{websocket.addEventListener('open',resolveOpen);websocket.addEventListener('error',rejectOpen);});
  await command('Page.enable'); await command('Runtime.enable');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
  const byText=async text=>{ await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()===${JSON.stringify(text)}).click()`); await delay(100); };
  await navigate('/login');
  await memberLogin('member');
  await navigate('/tasks');
  await waitFor("document.querySelectorAll('.task-table tbody tr').length >= 5",'task tables');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('button')).some(b=>b.innerText==='Удалить')"),false,'member cannot delete');
  await writeFile(join(artifacts,'tasks-desktop.png'), Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await byText('+ Новая задача');
  await waitFor("document.querySelector('dialog[open] input[name=title]')",'create modal');
  await fill('dialog input[name=title]','Задача из браузера');
  await fill('dialog textarea[name=description]','Проверка общей задачи и истории');
  await fill('dialog input[name=deadline]','2026-12-01');
  await fill('dialog select[name=event_card_id]','3');
  await click('dialog .task-picker:first-of-type input[type=checkbox]');
  await click('dialog .task-picker:last-of-type input[type=checkbox]');
  await byText('Создать задачу');
  await waitFor("!document.querySelector('dialog[open]') && document.body.innerText.includes('Задача из браузера')",'task creation');
  await byText('Задача из браузера');
  await fill('dialog input[name=title]','Изменённая задача');
  await byText('Сохранить');
  await waitFor("!document.querySelector('dialog[open]') && document.body.innerText.includes('Изменённая задача')",'task edit');
  await byText('Изменённая задача');
  await fill('dialog textarea[name=description]', 'Мой черновик описания');
  await evaluate(`(async()=>{
    const row=Array.from(document.querySelectorAll('.task-table tbody tr')).find(r=>r.innerText.includes('Изменённая задача'));
    const token=localStorage.getItem('jwt_token');
    const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
    const task=await (await fetch('/api/tasks/'+row.dataset.taskId,{headers})).json();
    const other=await (await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'other',password:'smoke-password'})})).json();
    const response=await fetch('/api/tasks/'+task.id,{method:'PATCH',headers:{...headers,Authorization:'Bearer '+other.access_token},body:JSON.stringify({version:task.version,deadline:'2026-12-10'})});
    if(!response.ok) throw new Error('Concurrent edit failed: '+await response.text());
  })()`);
  await byText('Сохранить');
  await waitFor("document.querySelector('.task-conflict')", 'conflict recovery UI');
  assert.equal(await evaluate("document.querySelector('dialog textarea[name=description]').value"), 'Мой черновик описания', 'draft retained');
  await byText('Применить мои правки к новой версии');
  assert.equal(await evaluate("document.querySelector('dialog input[name=deadline]').value"), '2026-12-10', 'other user deadline retained');
  await byText('Сохранить');
  await waitFor("!document.querySelector('dialog[open]') && document.body.innerText.includes('Мой черновик описания')", 'conflict resolved');
  await evaluate("Array.from(document.querySelectorAll('.task-table tbody tr')).find(row=>row.innerText.includes('Изменённая задача')).querySelector('input[type=checkbox]').click()");
  await waitFor("Array.from(document.querySelectorAll('.task-table tbody tr')).find(r=>r.innerText.includes('Изменённая задача'))?.classList.contains('task-row-done')",'complete task');
  await evaluate("Array.from(document.querySelectorAll('.task-table tbody tr')).find(row=>row.innerText.includes('Изменённая задача')).querySelector('input[type=checkbox]').click()");
  await waitFor("!Array.from(document.querySelectorAll('.task-table tbody tr')).find(r=>r.innerText.includes('Изменённая задача'))?.classList.contains('task-row-done')",'reopen task');
  await evaluate("Array.from(document.querySelectorAll('.task-table tbody tr')).find(row=>row.innerText.includes('Изменённая задача')).querySelector('.task-link').click()");
  await waitFor("document.querySelectorAll('.task-timeline li').length === 6",'audited create edit complete reopen');
  await writeFile(join(artifacts,'tasks-history-desktop.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await waitFor("!document.querySelector('dialog[open]')",'Escape closes modal');
  await navigate('/card/1/1');
  await waitFor("document.querySelector('#card-tasks-tab')",'department tabs');
  await click('#card-tasks-tab');
  await waitFor("document.querySelector('#card-tasks-panel')?.innerText.includes('Изменённая задача')",'shared department task');
  assert.ok(await evaluate("document.body.innerText.includes('Общие задачи отдела')"));
  await navigate('/card/2/3');
  await waitFor("document.querySelector('#card-tasks-tab')",'event tabs');
  await click('#card-tasks-tab');
  await waitFor("document.querySelector('#card-tasks-panel')?.innerText.includes('Изменённая задача')",'shared event task');
  await navigate('/card/3/5');
  await waitFor("document.body.innerText.includes('Правила')",'general info');
  assert.equal(await evaluate("Boolean(document.querySelector('#card-tasks-tab'))"),false,'no task tab in general information');
  await navigate('/tasks');
  await waitFor("document.querySelector('.task-mode-switch')",'global page');
  await byText('Общие');
  await waitFor("document.querySelector('.task-table')?.innerText.includes('Подготовить отчёт за месяц')",'general tasks');
  assert.equal(await evaluate("document.querySelector('.task-table')?.innerText.includes('Изменённая задача')"),false,'linked task not global general');
  await byText('+ Новая задача');
  await fill('dialog input[name=title]','Общая задача из браузера');
  await byText('Создать задачу');
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.task-table')?.innerText.includes('Общая задача из браузера')",'create general task');
  await byText('По мероприятиям');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await command('Emulation.setPageScaleFactor', {pageScaleFactor:1});
  await navigate('/tasks');
  await waitFor("document.querySelector('.task-table')",'mobile fresh load');
  await byText('По мероприятиям');
  await delay(200);
  assert.equal(await evaluate('innerWidth'),390,'mobile layout viewport stays device width');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true,'mobile page fits');
  await writeFile(join(artifacts,'tasks-mobile.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await byText('+ Новая задача');
  assert.equal(await evaluate("document.querySelector('dialog').getBoundingClientRect().width <= innerWidth"),true,'mobile editor fits');
  await writeFile(join(artifacts,'tasks-editor-mobile.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await byText('Отмена');
  await memberLogin('deputy');
  await navigate('/tasks');
  await waitFor("Array.from(document.querySelectorAll('.task-table tbody tr')).some(r=>r.innerText.includes('Изменённая задача'))",'deputy tasks');
  await evaluate("Array.from(document.querySelectorAll('.task-table tbody tr')).find(row=>row.innerText.includes('Изменённая задача')).querySelector('.task-danger').click()");
  await byText('Удалить задачу');
  await waitFor("!document.querySelector('dialog[open]') && !document.querySelector('.task-table')?.innerText.includes('Изменённая задача')",'deputy archives task');
  await click('.task-archive-filter input');
  await waitFor("document.querySelector('.task-table')?.innerText.includes('Изменённая задача')",'archived task');
  await byText('История');
  await waitFor("document.querySelectorAll('.task-timeline li').length === 7",'archive audit retained');
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  console.log('PASS: shared tasks, create/edit/complete/reopen, history, card tabs, general tasks, role-specific archive, mobile page/editor, no runtime errors.');
} finally {
  for(const pending of calls.values()) pending.reject(new Error('Browser test finished'));
  websocket?.close();
  if(chrome && chrome.exitCode===null) {chrome.kill(); await delay(500);}
  await new Promise(resolveClosed=>server.close(resolveClosed));
  assert.equal(resolve(dirname(directory)),resolve(tmpdir()),'Temporary browser cleanup stays in temp root');
  assert.ok(basename(directory).startsWith('legacy-tasks-chrome-'));
  await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
