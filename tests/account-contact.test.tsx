import assert from 'node:assert/strict';
import { contactPayload, contactError } from '../src/utils/account-contact';
assert.deepEqual(contactPayload({phone:'  ',education_format:''}), {phone:null,education_format:null});
assert.deepEqual(contactPayload({phone:' +375 (29) 123-45-67 ',education_format:'бюджет'}), {phone:'+375 (29) 123-45-67',education_format:'бюджет'});
assert.equal(contactError(''), null);
assert.equal(contactError('+375 (29) 123-45-67'), null);
assert.ok(contactError('123'));
assert.ok(contactError('+375abc291234567'));
assert.ok(contactError('1234567890123456'));

import test from 'node:test';
import { editUser } from '../src/api/user';
import { AccountContactFields } from '../src/components/AccountContactFields';
import { renderToStaticMarkup } from 'react-dom/server';
test('contact fields show optional legacy education and phone input', () => {
  const html = renderToStaticMarkup(<AccountContactFields phone="" education_format="" onChange={() => {}} />);
  assert.match(html, /type="tel"/);
  assert.match(html, /Не указан/);
  assert.match(html, /value="бюджет"/);
  assert.match(html, /value="платное"/);
});
test('user API preserves explicit null contact values when clearing fields', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, init) => {
      assert.deepEqual(JSON.parse(String(init?.body)), {phone:null,education_format:null});
      return new Response('{}', {status:200,headers:{'Content-Type':'application/json'}});
    };
    await editUser({userData:{login:'contact-target',phone:null,education_format:null}});
  } finally { globalThis.fetch = original; }
});
