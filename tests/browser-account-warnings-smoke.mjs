// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const backend = "http://127.0.0.1:8012";
const origin = "http://127.0.0.1:4174";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-equipment-chrome-"));
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
      const result = await fetch(backend + pathname, { method: request.method, headers: request.headers,
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
await new Promise(resolveReady => server.listen(4174, "127.0.0.1", resolveReady));

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
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', {bubbles: true})); })()`);
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
  assert.equal((await fetch(backend)).status,200,"Start tests/serve_equipment_smoke.py first");
  const login = await (await fetch(backend+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'admin',password:'smoke-password'})})).json();
  const fixtureItem = await (await fetch(backend+'/api/equipment',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+login.access_token},body:JSON.stringify({name:'Тестовый проектор',description:'Для собраний'})})).json();
  assert.ok(fixtureItem.id);
  chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--in-process-gpu",
    "--disable-software-rasterizer", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${directory}`, "--remote-debugging-port=9226", "about:blank"],
  { windowsHide: true, stdio: "ignore" });
  let pages;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { pages = await (await fetch("http://127.0.0.1:9226/json/list")).json(); if (pages.length) break; } catch { /* booting */ }
    await delay(100);
  }
  assert.ok(pages?.length, "Chrome DevTools must start");
  websocket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  websocket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && calls.has(message.id)) {
      const pending = calls.get(message.id); calls.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error))); else pending.resolve(message.result);
    }
    if (message.method === "Network.requestWillBeSent" && message.params.request.url.includes("/api/"))
      apiRequests.push(message.params.request.url);
    if (message.method === "Runtime.exceptionThrown") runtimeErrors.push(message.params.exceptionDetails);
  });
  await new Promise((resolveOpen, rejectOpen) => { websocket.addEventListener("open", resolveOpen); websocket.addEventListener("error", rejectOpen); });
  await command("Page.enable"); await command("Runtime.enable"); await command("Network.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });



  const textButton = async text => {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(el=>el.innerText===${JSON.stringify(text)}).click()`);
    await delay(120);
  };
  const reason = async value => {
    await evaluate(`(() => {const el=document.querySelector('#warning-reason');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  };
  const close = () => click('dialog[open] [aria-label="Закрыть окно"]');
  const escape = async () => {await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});};

  await memberLogin('admin');
  await navigate('/user/member');
  await waitFor("document.body.innerText.includes('Тестовый Участник') && document.querySelector('.account-warnings')","member profile and warning access");
  await textButton('Редактировать');
  await waitFor("document.querySelector('.app-modal[open] input[name=phone]')","contact edit dialog");
  await fill('input[name=phone]','+375 (29) 123-45-67');
  await evaluate("(()=>{const el=document.querySelector('select[name=education_format]');el.value='платное';el.dispatchEvent(new Event('change',{bubbles:true}));})()");
  await textButton('Сохранить');
  await waitFor("!document.querySelector('.app-modal[open]') && document.body.innerText.includes('+375 (29) 123-45-67') && document.body.innerText.includes('платное')","contact saved and displayed");

  for(const value of ['Не вернул кабель','Пропустил дежурство']) {
    await textButton('Выдать предупреждение');
    await waitFor("document.querySelector('#warning-reason')","warning reason form");
    assert.equal(await evaluate("document.querySelector('dialog[open] button[type=submit]').disabled"),true,'Blank reason cannot be submitted');
    await reason(value);await click('dialog[open] button[type=submit]');
    await waitFor("!document.querySelector('#warning-reason')","warning issued");
  }
  assert.equal(await evaluate("document.querySelector('.warning-count').innerText"),'2');
  await textButton('История предупреждений');
  await waitFor("document.querySelectorAll('.warning-record').length===2","warning history");
  await textButton('Снять предупреждение');
  await waitFor("document.querySelector('#warning-reason') && document.querySelectorAll('dialog[open]').length===2","stacked removal reason dialog");
  await reason('Дежурство отработано');await click('dialog[open]:last-of-type button[type=submit]');
  await waitFor("!document.querySelector('#warning-reason') && document.querySelector('.warning-removal')?.innerText.includes('Дежурство отработано')","removal audited");
  assert.equal(await evaluate("document.querySelectorAll('dialog[open]').length"),1,'History remains open after removal');
  assert.equal(await evaluate("getComputedStyle(document.body).overflow"),'hidden','Scroll remains locked while parent modal is open');
  await command('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate("document.documentElement.scrollWidth<=innerWidth"),true,'Warning history fits phone');
  await writeFile(join(artifacts,'warnings-history-mobile.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await escape();await waitFor("!document.querySelector('dialog[open]')","history closes with Escape");
  assert.notEqual(await evaluate("getComputedStyle(document.body).overflow"),'hidden');
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await navigate('/accounts');
  await waitFor("document.querySelector('th') && document.body.innerText.includes('Предупреждения') && document.body.innerText.includes('+375 (29) 123-45-67')","account list has contact and private warnings column");
  const memberCount='button[aria-label="Предупреждения: Тестовый Участник"]';
  assert.equal(await evaluate(`document.querySelector(${JSON.stringify(memberCount)}).innerText`),'1');
  await click(memberCount);await waitFor("document.querySelector('.warning-removal')","list count opens history");await close();

  const memberStart=apiRequests.length;
  await memberLogin('member');await navigate('/account');
  await waitFor("document.body.innerText.includes('+375 (29) 123-45-67')","member sees contact fields");
  assert.equal(await evaluate("Boolean(document.querySelector('.account-warnings'))"),false,'Ordinary member cannot view own warnings');
  await navigate('/accounts');await waitFor("document.querySelector('table tbody')","ordinary account list");
  assert.equal(await evaluate("document.body.innerText.includes('Предупреждения')"),false,'Warnings column hidden for ordinary member');
  assert.equal(apiRequests.slice(memberStart).some(url=>url.includes('/warnings/counts')),false,'Private counts never requested by ordinary member');
  await navigate('/equipment');await waitFor("document.querySelector('.equipment-table tbody')","member equipment");
  assert.equal(await evaluate("document.body.innerText.includes('Удалить')"),false);
  await textButton('Взял предмет');await waitFor("document.querySelector('.equipment-feedback')?.innerText.includes('Вы взяли')","member checkout");
  await navigate('/account');await waitFor("document.querySelector('.profile-equipment-list')?.innerText.includes('Тестовый проектор')","held equipment in own profile");

  for(const viewer of ['head','studentchair']) {
    await memberLogin(viewer);await navigate('/user/member');
    await waitFor("document.querySelector('.account-warnings') && document.querySelector('.warning-count').innerText==='1'","leadership viewer can inspect count");
    assert.equal(await evaluate("document.body.innerText.includes('Выдать предупреждение')"),false,'Viewer cannot issue');
    await textButton('История предупреждений');await waitFor("document.querySelector('.warning-removal')","viewer history");
    assert.equal(await evaluate("document.querySelector('dialog').innerText.includes('Снять предупреждение')"),false,'Viewer cannot remove');await close();
    await navigate('/equipment');await waitFor("document.querySelector('.equipment-table tbody')","viewer equipment");
    assert.equal(await evaluate("document.body.innerText.includes('Удалить')"),false,'Nonexecutive cannot delete equipment');
  }

  await memberLogin('deputy');await navigate('/equipment');
  await waitFor("document.querySelector('.equipment-danger')","executive delete control");
  const before=await evaluate("(()=>{const r=document.querySelector('.equipment-button').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()");
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x:before.x+before.width/2,y:before.y+before.height/2});await delay(250);
  const after=await evaluate("(()=>{const r=document.querySelector('.equipment-button').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()");
  assert.deepEqual(after,before,'Hover never changes button bounds or overflows row');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.equipment-button')).transform"),'none');
  await textButton('Удалить');await waitFor("document.querySelector('dialog[open]')?.innerText.includes('Удалить предмет?')","delete confirmation");
  await writeFile(join(artifacts,'equipment-delete-dialog.png'),Buffer.from((await command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await escape();await waitFor("!document.querySelector('dialog[open]')","delete cancellation");
  assert.equal(await evaluate("Boolean(document.querySelector('.equipment-table tbody'))"),true);
  await textButton('Удалить');await textButton('Удалить предмет');
  await waitFor("document.body.innerText.includes('Здесь пока нет аппаратуры')","item archived");
  await navigate('/user/member');await waitFor("document.body.innerText.includes('Тестовый Участник')","profile after deletion");
  await delay(300);
  assert.equal(await evaluate("Boolean(document.querySelector('.profile-equipment-list'))"),false,'Archived equipment removed from profile');
  const deputyToken=await evaluate("localStorage.getItem('jwt_token')");
  const custody=await (await fetch(`${backend}/api/equipment/${fixtureItem.id}/history`,{headers:{Authorization:'Bearer '+deputyToken}})).json();
  assert.deepEqual(custody.map(event=>event.action),['deleted','taken','created']);
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  console.log('PASS: contact edit/profile/list, required issue/removal reasons, counts/history, stacked dialogs/Escape/mobile, ordinary privacy, head/studentchair view-only, equipment profile/deletion/archive audit, stable hover bounds, no runtime errors.');
} finally {
  for(const pending of calls.values())pending.reject(new Error('Browser test finished'));
  websocket?.close();if(chrome&&chrome.exitCode===null){chrome.kill();await delay(500);}
  await new Promise(resolveClosed=>server.close(resolveClosed));
  assert.equal(resolve(dirname(directory)),resolve(tmpdir()));assert.ok(basename(directory).startsWith('legacy-equipment-chrome-'));
  await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
