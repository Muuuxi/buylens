import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secrets = ['OPENAI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'].map(key => process.env[key]).filter(value => value?.length > 12);
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
const forbidden = /(^|\/)(node_modules|\.next|\.vercel|test-results|playwright-report)(\/|$)|(^|\/)\.env(?!\.example$)|artifacts\/(?!evaluation-results\.json$)|\.zip$|\.tsbuildinfo$/;
const leaks = [];
for (const file of files) {
  if (forbidden.test(file)) { leaks.push(file); continue; }
  const content = readFileSync(file).toString('utf8');
  if (secrets.some(secret => content.includes(secret)) || /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}|\bsb_secret_[A-Za-z0-9_-]{20,}|\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(content)) leaks.push(file);
}
if (leaks.length) { console.error('FAIL: excluded or sensitive content in candidate/tracked files: ' + leaks.join(', ')); process.exit(1); }
for (const path of ['.env.local', 'node_modules/package.json', '.next/BUILD_ID', 'artifacts/screenshots/check.png', 'nested.zip']) {
  execFileSync('git', ['check-ignore', '--quiet', path]);
}
for (const path of ['README.md', 'AGENT_FLOW.md', 'TOOL_SPEC.md', 'DATA_MODEL.md', 'VERIFICATION.md', 'artifacts/evaluation-results.json']) {
  assert.ok(existsSync(path) && files.includes(path), 'Required source/document missing: ' + path);
}
const synthetic = JSON.parse(readFileSync('tests/data/live-headphones-synthetic.json', 'utf8'));
assert.match(synthetic.label, /SYNTHETIC TEST DATA/);
function checkClientBundle(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) checkClientBundle(path);
    else assert.ok(!secrets.some(secret => readFileSync(path).includes(Buffer.from(secret))), 'Private key in browser artifact: ' + path);
  }
}
checkClientBundle('.next/static');
console.log(`PASS: ${files.length} repository files checked; secrets/caches/screenshots/archives excluded; architecture/evaluation retained; synthetic data labeled.`);
console.log('PASS: built browser assets contain no configured private key values.');
