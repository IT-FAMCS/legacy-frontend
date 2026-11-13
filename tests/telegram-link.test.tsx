import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { TelegramLinkContent } from '../src/components/TelegramLink';
import { confirmTelegramLink } from '../src/api/telegram';
const noop = () => {};
test('Telegram linking does not grant access before explicit identity confirmation', () => {
  const state = { enabled: true, binding: null, pending: { id: 4, expires_at: '2030-01-01T00:00:00Z', telegram_user_id: 123456, username: 'anna', display_name: 'Анна' } };
  const html = renderToStaticMarkup(<TelegramLinkContent state={state} busy={false} error="" onIssue={noop} onConfirm={noop} onUnlink={noop} />);
  assert.match(html, /123456/);
  assert.match(html, /anna/);
  assert.match(html, /Подтвердить этот Telegram/);
  assert.doesNotMatch(html, /Telegram подключён/);
});
test('unconfigured integration and current binding have distinct controls', () => {
  const disabled = renderToStaticMarkup(<TelegramLinkContent state={{ enabled:false,binding:null,pending:null }} busy={false} error="" onIssue={noop} onConfirm={noop} onUnlink={noop} />);
  assert.match(disabled, /не настроена/);
  assert.doesNotMatch(disabled, /Создать ссылку/);
  const linked = renderToStaticMarkup(<TelegramLinkContent state={{enabled:true,pending:null,binding:{telegram_user_id:1,username:'anna',display_name:'Анна',linked_at:'2030-01-01T00:00:00Z'}}} busy={false} error="" onIssue={noop} onConfirm={noop} onUnlink={noop} />);
  assert.match(linked, /Telegram подключён/);
  assert.match(linked, /Отключить Telegram/);
  assert.doesNotMatch(linked, /Подтвердить этот Telegram/);
});
test('confirm Telegram link sends only the current member token and challenge ID', async () => {
  const original = globalThis.fetch;
  const previous = localStorage.getItem('jwt_token');
  localStorage.setItem('jwt_token','member-auth');
  try {
    globalThis.fetch = async (url, init) => {
      assert.ok(String(url).endsWith('/api/telegram/link/confirm'));
      assert.equal(init?.method,'POST');
      assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer member-auth');
      assert.deepEqual(JSON.parse(String(init?.body)),{challenge_id:4});
      return new Response('{}',{status:200});
    };
    await confirmTelegramLink(4);
  } finally { globalThis.fetch=original; if(previous)localStorage.setItem('jwt_token',previous);else localStorage.removeItem('jwt_token'); }
});
