// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const backend = "http://127.0.0.1:8014";
const origin = "http://127.0.0.1:4176";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-telegram-chrome-"));
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
await new Promise(resolveReady => server.listen(4176, "127.0.0.1", resolveReady));

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
  assert.equal((await fetch(backend)).status,200,'Start serve_telegram_smoke.py');
  chrome=spawn(chromePath,['--headless','--no-sandbox','--disable-gpu','--in-process-gpu','--disable-software-rasterizer','--no-first-run','--no-default-browser-check',`--user-data-dir=${directory}`,'--remote-debugging-port=9228','about:blank'],{windowsHide:true,stdio:'ignore'});
  let pages;
  for(let attempt=0;attempt<60;attempt++){try{pages=await(await fetch('http://127.0.0.1:9228/json/list')).json();if(pages.length)break;}catch{}await delay(100);}
  assert.ok(pages?.length);websocket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  websocket.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id&&calls.has(msg.id)){const pending=calls.get(msg.id);calls.delete(msg.id);if(msg.error)pending.reject(new Error(JSON.stringify(msg.error)));else pending.resolve(msg.result);}if(msg.method==='Runtime.exceptionThrown')runtimeErrors.push(msg.params.exceptionDetails);if(msg.method==='Page.javascriptDialogOpening')void command('Page.handleJavaScriptDialog',{accept:true});});
  await new Promise((resolveOpen,rejectOpen)=>{websocket.addEventListener('open',resolveOpen);websocket.addEventListener('error',rejectOpen);});
  await command('Page.enable');await command('Runtime.enable');await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
  const byText=async text=>{await evaluate(`Array.from((document.querySelector('dialog[open]')||document).querySelectorAll('button')).find(b=>b.innerText.trim()===${JSON.stringify(text)}).click()`);await delay(100);};
  await navigate('/login');await memberLogin('member');await navigate('/account');
  await waitFor("document.querySelector('.telegram-link')?.innerText.includes('Создать ссылку')",'link widget');
  await byText('Создать ссылку для привязки');
  await waitFor("document.querySelector('.telegram-link a[href^=\"https://t.me/\"]')",'one time link');
  const link=await evaluate("document.querySelector('.telegram-link a[href^=\"https://t.me/\"]').href");
  const token=new URL(link).searchParams.get('start').slice(5);
  const botHeaders={'Content-Type':'application/json','X-Telegram-Service-Key':'telegram-browser-test-service-key-1234567890','X-Telegram-User-ID':'101'};
  assert.equal((await fetch(backend+'/api/telegram/bot/claim',{method:'POST',headers:botHeaders,body:JSON.stringify({token,telegram_user_id:101,chat_id:101,username:'anna_verified',display_name:'Анна Telegram'})})).status,200);
  assert.equal((await fetch(backend+'/api/telegram/bot/me',{headers:botHeaders})).status,403,'no account access before website confirmation');
  await waitFor("document.querySelector('.telegram-link')?.innerText.includes('Подтвердить этот Telegram')",'pending claimed identity');
  assert.ok(await evaluate("document.querySelector('.telegram-link').innerText.includes('101')"));
  await byText('Подтвердить этот Telegram');
  await waitFor("document.querySelector('.telegram-link-connected')",'linked identity');
  assert.equal((await fetch(backend+'/api/telegram/bot/me',{headers:botHeaders})).status,200);
  await writeFile(join(artifacts,'telegram-link-desktop.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await byText('Отключить Telegram');await waitFor("document.querySelector('.telegram-link')?.innerText.includes('Создать ссылку')",'unlinked');
  assert.equal((await fetch(backend+'/api/telegram/bot/me',{headers:botHeaders})).status,403);
  await navigate('/user/other');await waitFor("document.body.innerText.includes('Профиль пользователя')",'other profile');
  assert.equal(await evaluate("Boolean(document.querySelector('.telegram-link'))"),false,'no linking another user');
  await navigate('/card/1/1');await waitFor("document.querySelector('#card-tasks-tab')",'department card');
  assert.equal(await evaluate("Boolean(document.querySelector('#card-zones-tab'))"),false,'event only zones');
  await navigate('/card/2/3');await waitFor("document.querySelector('#card-zones-tab')",'event zones tab');await click('#card-zones-tab');
  await waitFor("document.querySelector('.zone-board')?.innerText.includes('Добавить зону')",'zone board');
  await byText('+ Добавить зону');await waitFor("document.querySelector('dialog[open] .zone-form')",'zone form');
  await fill('.zone-form input[name=zone-title]','Сцена');await fill('.zone-form input[name=zone-required]','2');
  await fill('.zone-form select[name=zone-lead]','1');await click('.zone-form .task-picker input[type=checkbox]');await byText('Сохранить зону');
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.zone-counter-closed strong')?.innerText==='1'",'staffed zone');
  assert.ok(await evaluate("document.querySelector('.zone-board').innerText.includes('@member_contact')"));
  await writeFile(join(artifacts,'event-zones-desktop.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await click('.zone-board tbody .task-link');await fill('.zone-form input[name=zone-title]','Сцена и выступления');await byText('Сохранить зону');
  await waitFor("!document.querySelector('dialog[open]') && document.querySelector('.zone-board').innerText.includes('Сцена и выступления')",'zone edit');
  await byText('Очистить ответственных');
  await waitFor("document.querySelector('.zone-counter-closed strong')?.innerText==='0' && document.querySelector('.zone-board').innerText.includes('Не назначен')",'clear assignments');
  assert.equal(await evaluate("document.querySelectorAll('.zone-board tbody tr').length"),1,'clear preserves zone');
  assert.ok(await evaluate("document.querySelector('.zone-board .zone-required').innerText.includes('2')"),'clear preserves required people');
  await byText('История изменений');await waitFor("document.querySelector('.task-timeline')?.innerText.includes('Очищены ответственные')",'clear audit');
  await click('dialog [aria-label="Закрыть"]');
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await command('Emulation.setPageScaleFactor',{pageScaleFactor:1});
  await navigate('/card/2/3');await waitFor("document.querySelector('#card-zones-tab')",'mobile zones tab');await click('#card-zones-tab');await waitFor("document.querySelector('.zone-table')",'mobile zone table');
  assert.equal(await evaluate('innerWidth'),390,'mobile viewport unchanged');assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true,'mobile zones fit');
  await writeFile(join(artifacts,'event-zones-mobile.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await memberLogin('other');await navigate('/card/2/3');await waitFor("document.querySelector('#card-zones-tab')",'viewer event');await click('#card-zones-tab');await waitFor("document.querySelector('.zone-table')",'viewer zones');
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.zone-board button')).some(b=>b.innerText.includes('Добавить зону')||b.innerText.includes('Очистить ответственных'))"),false,'viewer cannot edit zones');
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  console.log('PASS: private account link claim/confirm/unlink, profile ownership, event-only zones, counts, TG contacts, edit/clear/history, mobile, viewer permissions; no Telegram messages sent.');
} finally {
  for(const pending of calls.values())pending.reject(new Error('Browser test finished'));websocket?.close();
  if(chrome&&chrome.exitCode===null){chrome.kill();await delay(500);}
  await new Promise(resolveClosed=>server.close(resolveClosed));
  assert.equal(resolve(dirname(directory)),resolve(tmpdir()));assert.ok(basename(directory).startsWith('legacy-telegram-chrome-'));
  await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
