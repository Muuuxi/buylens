import assert from 'node:assert/strict';

const baseUrl = process.env.BUYLENS_BASE_URL ?? 'http://127.0.0.1:3102';
const origin = new URL(baseUrl).origin;
const config = await fetch(new URL('/api/config', baseUrl));
assert.equal(config.status, 200);
assert.deepEqual(await config.json(), { live: false, persistence: false });
const cookie = 'buylens_guest=00000000-0000-4000-8000-000000000000';
const restore = await fetch(new URL('/api/session', baseUrl), { headers: { Cookie: cookie } });
assert.equal(restore.status, 200);
assert.deepEqual(await restore.json(), { session: null });
for (const command of [
  { action: 'create', mode: 'live', product: 'Synthetic validation headphones', need: 'Library and subway', reviewText: 'Synthetic test review.' },
  { action: 'step' },
]) {
  const response = await fetch(new URL('/api/session', baseUrl), {
    method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(command),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, 'Live sessions are disabled in the public portfolio demo.');
}
const deletion = await fetch(new URL('/api/session', baseUrl), { method: 'DELETE', headers: { Origin: origin, Cookie: cookie } });
assert.equal(deletion.status, 403);
console.log('PASS: public configuration, session restoration, direct live creation, live step and deletion are disabled before model/database access.');
