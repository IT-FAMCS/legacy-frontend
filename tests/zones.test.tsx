import test from 'node:test';
import assert from 'node:assert/strict';
import { telegramContactUrl } from '../src/api/zones';
test('zone Telegram contacts link only usernames and trusted t.me URLs',()=>{
  assert.equal(telegramContactUrl('@anna_name'),'https://t.me/anna_name');
  assert.equal(telegramContactUrl('https://t.me/anna_name'),'https://t.me/anna_name');
  assert.equal(telegramContactUrl('javascript:alert(1)'),undefined);
  assert.equal(telegramContactUrl('https://evil.example/anna_name'),undefined);
  assert.equal(telegramContactUrl(null),undefined);
});
