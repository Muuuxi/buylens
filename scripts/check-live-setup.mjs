import nextEnv from '@next/env';

// Use Next's own local env precedence. Never log values or upstream bodies.
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const required = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const baseUrl = process.env.BUYLENS_BASE_URL ?? 'http://127.0.0.1:3000';
const missing = required.filter(name => !process.env[name]?.trim());
for (const name of missing) console.log(`BLOCKED: ${name} is missing in local configuration.`);
let failed = false;

async function checkModel() {
  if (!process.env.OPENAI_API_KEY?.trim()) return;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Connection check. Return ready=true.' }],
        response_format: { type: 'json_schema', json_schema: { name: 'connection_check', strict: true, schema: { type: 'object', properties: { ready: { type: 'boolean' } }, required: ['ready'], additionalProperties: false } } },
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) { failed = true; console.log(`FAIL: model connection returned HTTP ${response.status}.`); return; }
    const value = await response.json();
    const parsed = JSON.parse(value.choices?.[0]?.message?.content ?? '{}');
    if (parsed.ready !== true) { failed = true; console.log('FAIL: model structured connection output was invalid.'); return; }
    console.log('PASS: model connection and strict structured output.');
  } catch { failed = true; console.log('FAIL: model connection timed out or returned an unusable response.'); }
}

async function checkDatabase() {
  if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;
  try {
    const target = new URL(process.env.SUPABASE_URL);
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.supabase.co')) {
      failed = true; console.log('FAIL: expected an HTTPS hosted Supabase project URL.'); return;
    }
    // limit=0 verifies the table/columns without downloading any review data.
    const response = await fetch(new URL('/rest/v1/sessions?select=id,state,data,created_at,updated_at&limit=0', target), {
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
      signal: AbortSignal.timeout(20000), redirect: 'error',
    });
    if (!response.ok) { failed = true; console.log(`FAIL: Supabase sessions access returned HTTP ${response.status}.`); return; }
    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length !== 0) { failed = true; console.log('FAIL: unexpected database probe result.'); return; }
    console.log('PASS: Supabase Data API, service key and all five sessions columns.');
  } catch { failed = true; console.log('FAIL: Supabase connection timed out or could not be verified.'); }
}

await Promise.allSettled([checkModel(), checkDatabase()]);
if (!missing.length && !failed) {
  try {
    const response = await fetch(new URL('/api/config', baseUrl), { signal: AbortSignal.timeout(5000) });
    const config = await response.json();
    if (!response.ok || !config.live || !config.persistence) {
      failed = true; console.log('FAIL: local dev server has not loaded both integrations; restart it before live tests.');
    } else console.log('PASS: local development server has loaded the live configuration.');
  } catch { failed = true; console.log('FAIL: configured local development server is not available.'); }
}
if (failed || missing.length) process.exitCode = failed ? 1 : 2;
else console.log('Setup checks passed. Run npm run test:live against the running dev server.');
