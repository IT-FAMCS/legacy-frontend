// Requires a built frontend, Chrome, Node 20 --experimental-websocket and the isolated backend fixture.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve, extname, join, dirname, basename } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const backend = "http://127.0.0.1:8016";
const origin = "http://127.0.0.1:4176";
const chromePath = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const directory = await mkdtemp(join(tmpdir(), "legacy-budget-chrome-"));
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
  assert.equal((await fetch(backend)).status, 200, "Start tests/serve_budget_smoke.py first");
  chrome = spawn(chromePath, ["--headless", "--no-sandbox", "--disable-gpu", "--in-process-gpu",
    "--disable-software-rasterizer", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${directory}`, "--remote-debugging-port=9228", "about:blank"],
  { windowsHide: true, stdio: "ignore" });
  let pages;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { pages = await (await fetch("http://127.0.0.1:9228/json/list")).json(); if (pages.length) break; } catch { /* booting */ }
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


  const byText = async text => {
    await evaluate(`Array.from(document.querySelectorAll('button')).find(el => el.innerText === ${JSON.stringify(text)}).click()`);
    await delay(100);
  };

  await memberLogin("admin");
  await navigate("/budget");
  await waitFor("document.querySelector('.budget-balances')", "budget balances");
  assert.equal(await evaluate("document.querySelectorAll('.budget-year').length"),2);
  assert.equal(await evaluate("document.querySelector('.budget-negative').innerText.includes('50,00')"),true);
  await byText("Добавить операцию");
  await fill('[name="amount"]',"12,34");
  await evaluate(`document.querySelector('[name="description"]').value='Browser expense'`);
  await evaluate(`document.querySelector('.budget-dialog form').requestSubmit()`);
  await waitFor("!document.querySelector('.budget-dialog') && document.body.innerText.includes('Browser expense')", "manual expense saved");
  assert.equal(await evaluate("document.querySelector('.budget-balances').innerText.includes('287,66')"),true);
  await evaluate(`Array.from(document.querySelectorAll('tr')).find(row=>row.innerText.includes('Browser expense')).querySelector('button').click()`);
  await fill('[name="amount"]',"20");
  await evaluate(`document.querySelector('.budget-dialog form').requestSubmit()`);
  await waitFor("!document.querySelector('.budget-dialog') && document.querySelector('.budget-balances').innerText.includes('280,00')", "edited balance");
  assert.equal(await evaluate("Array.from(document.querySelectorAll('.budget-month a')).some(a=>a.getAttribute('href')==='/user/admin')"),true,"creator profile shown");
  await evaluate("document.querySelector('.budget-month summary').click()");
  assert.equal(await evaluate("document.querySelector('.budget-month').open"),false,"month collapses");
  await evaluate("document.querySelector('.budget-month summary').click()");
  assert.equal(await evaluate("document.querySelector('.budget-month').open"),true,"month reopens");
  await evaluate(`Array.from(document.querySelectorAll('tr')).find(row=>row.innerText.includes('Browser expense')).querySelector('.budget-danger').click()`);
  assert.equal(await evaluate("document.querySelector('dialog[open]')?.contains(document.activeElement)"),true,"confirmation traps focus");
  await command("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await command("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape",windowsVirtualKeyCode:27});
  await waitFor("!document.querySelector('dialog[open]')", "Escape closes deletion confirmation");
  assert.equal(await evaluate("document.querySelector('.budget-balances').innerText.includes('280,00')"),true,"cancel preserves balance");
  await evaluate(`Array.from(document.querySelectorAll('tr')).find(row=>row.innerText.includes('Browser expense')).querySelector('.budget-danger').click()`);
  await byText("Удалить операцию");
  await waitFor("!document.querySelector('.budget-dialog') && !document.body.innerText.includes('Browser expense') && document.querySelector('.budget-balances').innerText.includes('300,00')", "deletion recalculates balance");
  await writeFile(join(artifacts,"budget-desktop.png"),Buffer.from((await command("Page.captureScreenshot",{format:"png"})).data,"base64"));
  await byText("Заявки (1)");
  await waitFor("document.body.innerText.includes('Иван Тестов')", "pending request");
  assert.equal(await evaluate("document.querySelector('.budget-request').innerHTML.includes('private-browser-receipt')"),false);
  await byText("Изменить сумму");await fill('[name="amount"]',"30");
  await evaluate(`document.querySelector('.budget-dialog form').requestSubmit()`);
  await waitFor("!document.querySelector('.budget-dialog') && document.querySelector('.budget-request').innerText.includes('30,00')", "amount correction");
  await command("Emulation.setDeviceMetricsOverride",{width:375,height:812,deviceScaleFactor:1,mobile:true});
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"),true,"requests fit phone");
  await writeFile(join(artifacts,"budget-requests-mobile.png"),Buffer.from((await command("Page.captureScreenshot",{format:"png"})).data,"base64"));
  await byText("Операции");
  assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"),true,"ledger fits phone");
  await command("Emulation.setDeviceMetricsOverride",{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await memberLogin("member");
  assert.equal(await evaluate("Array.from(document.querySelectorAll('header button')).some(el=>el.innerText==='Бюджет')"),false);
  await navigate("/budget");await waitFor("document.body.innerText.includes('Доступ только')", "member denied");
  assert.equal(await evaluate("!!document.querySelector('.budget-balances')"),false);
  await memberLogin("cashier");await navigate("/budget");
  await waitFor("document.querySelector('.budget-balances')", "cashier access");
  await navigate("/accounts");
  await waitFor("document.querySelector('input[type=search]') && document.querySelector('tbody')?.children.length===3", "member list loaded");
  await fill('input[type=search]',"МИША Семенов");
  await waitFor("document.querySelector('tbody')?.children.length===1 && document.querySelector('tbody').innerText.includes('Михаил')", "nickname and surname search");
  await fill('input[type=search]',"cashier");
  await waitFor("document.querySelector('tbody')?.children.length===1 && document.querySelector('tbody').innerText.includes('cashier')", "login search");
  await fill('input[type=search]',"неттакогопользователя");
  await waitFor("document.querySelector('tbody')?.children.length===0 && document.body.innerText.includes('Найдено: 0')", "empty search feedback");
  await byText("Очистить поиск");
  await waitFor("document.querySelector('tbody')?.children.length===3", "search clear restores users");
  assert.equal(runtimeErrors.length,0,JSON.stringify(runtimeErrors));
  console.log("PASS: admin/cashier access, member denied, year/month tables, negative balance, create/edit operation, request amount history, creator profiles, collapse/reopen months, delete/cancel and recalculation, smart user search and clear, receipt privacy, mobile layout, no runtime errors.");
} finally {
  for (const pending of calls.values()) pending.reject(new Error("Browser test finished"));
  websocket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await delay(500); }
  await new Promise(resolveClosed => server.close(resolveClosed));
  assert.equal(resolve(dirname(directory)), resolve(tmpdir()), "Cleanup stays inside temporary root");
  assert.ok(basename(directory).startsWith("legacy-budget-chrome-"));
  await rm(directory, {recursive:true, force:true, maxRetries:10, retryDelay:200});
}
