'use client';

import report from '../../../artifacts/evaluation-results.json';
import { LanguageSwitch, Localized } from '@/components/language';

export default function EvaluationPage() {
  return <Localized><main className="shell"><div className="page-title"><div><h1>Portfolio evaluation</h1><p>Saved results from actual deterministic controller tests.</p></div><div className="header-controls"><LanguageSwitch/><a href="/">Back to BuyLens</a></div></div>
    <section className="surface evaluation-summary"><strong>{report.results.length} scenarios tested.</strong><p>{report.results.filter(x => x.status === 'PASS').length} passed · {report.results.filter(x => x.status === 'FAIL').length} failed</p><p className="small">Executed: {report.executedAt}<br/>Provider: deterministic. Forced invalid proposals are safety injections, not observed model behavior. Run npm run evaluate to refresh this snapshot.</p>
      <div className="evaluation-scroll"><table className="evaluation-table"><thead><tr><th>Scenario</th><th>Actual result</th><th>Duration</th></tr></thead><tbody>{report.results.map(result => <tr key={result.name}><td>{result.name}</td><td><span className={`pill ${result.status === 'PASS' ? 'positive' : 'caution'}`}>{result.status}</span><p>{result.observed}</p></td><td>{result.durationMs} ms</td></tr>)}</tbody></table></div>
      <h2>Measured boundaries</h2><ul><li>{report.metrics.citationsChecked} exact citations checked in the sufficient-evidence scenario.</li><li>{report.metrics.invalidCitationsRejected} injected invalid citation rejected.</li><li>{report.metrics.invalidFinalizationsBlocked} injected illegal FINALIZE blocked.</li><li>{report.metrics.unresolvedFitReferences} fit references to unresolved critical criteria in the sufficient-evidence scenario.</li></ul><p className="small">Reference validity is measured here. This is not a measurement of live model accuracy or unsupported natural-language claims.</p>
      <h2>Live verification</h2><p>{report.live}</p><details><summary>Test source fingerprint</summary><p className="small">SHA-256: {report.sourceHash}</p>{report.sourceFiles.map(file => <p className="small" key={file}>{file}</p>)}</details>
    </section>
  </main></Localized>;
}
