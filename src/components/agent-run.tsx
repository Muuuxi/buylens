import { runMetrics } from '@/lib/run';
import type { RunStep, Session } from '@/lib/types';
import { Localized } from './language';

export function AgentRun({ session, running, serverStartedAt }: { session: Session; running: RunStep[] | null; serverStartedAt: number | null }) {
  const steps = running ?? session.run ?? [];
  const metrics = runMetrics(steps);
  const modelCalls = session.mode === 'live' ? (session.modelRequests ?? metrics.modelCalls) : metrics.modelCalls;
  return <Localized><section className="execution-panel" aria-label="Observed agent execution">
    <details className="agent-run"><summary><span>Agent Run</span><span className="run-summary-metrics">{metrics.runtimeMs} ms · {modelCalls} model calls</span></summary>
    <p className="small">{session.mode === 'demo' ? 'Deterministic execution; no model requests.' : 'Actual model, tool and controller execution.'} Durations use actual timestamps. Nested calls count once in runtime; human waiting is excluded.</p>
    {!steps.length && <p className="small">No recorded execution yet. Older saved sessions have no timing data.</p>}
    <ol>{steps.map((entry, index) => <li key={entry.id} data-status={entry.status}>
      <strong>{String(index + 1).padStart(2, '0')} {entry.name}</strong>
      <span>{entry.type} · {entry.status} {entry.durationMs !== undefined ? `· ${entry.durationMs} ms` : ''} · v{entry.version}</span>
      <p>{entry.result}</p>
    </li>)}</ol>
    {serverStartedAt !== null && <div className="run-pending" role="status"><strong>Server execution</strong><span>CONTROLLER · RUNNING</span><p>Waiting for this request’s observed execution steps. Started {new Date(serverStartedAt).toLocaleTimeString()}.</p></div>}
    <dl className="run-metrics"><div><dt>Total recorded runtime</dt><dd>{metrics.runtimeMs} ms</dd></div><div><dt>Model call count</dt><dd>{modelCalls}</dd></div><div><dt>Tool call count</dt><dd>{metrics.toolCalls}</dd></div><div><dt>Agent decision count</dt><dd>{metrics.decisions}</dd></div></dl>
  </details></section></Localized>;
}
