import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { evaluatePortfolio } from '../tests/evaluation';

async function main() {
const report = await evaluatePortfolio();
const sourceFiles = ['src/lib/agent.ts', 'src/lib/run.ts', 'src/lib/demo-reasoner.ts', 'src/lib/fixtures.ts', 'tests/evaluation.ts'];
const hash = createHash('sha256');
for (const file of sourceFiles) { hash.update(file); hash.update(await readFile(file)); }
await writeFile('artifacts/evaluation-results.json', JSON.stringify({ ...report, sourceFiles, sourceHash: hash.digest('hex') }, null, 2) + '\n');
console.log(`${report.results.length} scenarios tested: ${report.results.filter(x => x.status === 'PASS').length} passed, ${report.results.filter(x => x.status === 'FAIL').length} failed.`);
if (report.results.some(x => x.status === 'FAIL')) process.exitCode = 1;
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
