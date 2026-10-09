'use client';

import { useEffect, useRef, useState } from 'react';
import { addEvidence, confirm, createSession, criticalGaps, editConstraintValue, editCriteria, interpret, revisePurchase, skipEvidence, step } from '@/lib/agent';
import { demoReasoner } from '@/lib/demo-reasoner';
import { createDemoSession, scenarios, subwayReviews, type ScenarioKey } from '@/lib/fixtures';
import { human, observeRun } from '@/lib/run';
import { markdownBrief } from '@/lib/markdown';
import { AgentRun } from './agent-run';
import { LanguageSwitch, Localized, useLanguage } from './language';
import { localizedMarkdown } from '@/lib/i18n';
import { codeForError, errorMessage } from '@/lib/error-code';
import { guidedClarification, guidedNeed, guidedReviews, isGuidedCarryOnNeed, untouchedExample } from '@/lib/guided-examples';
import type { Criterion, Evidence, RunStep, Session } from '@/lib/types';

const STORAGE = 'buylens-normal-v2';
const DEMO_STORAGE = 'buylens-demo-v1';
const DEMO_SELECTED = 'buylens-demo-selected-v2';
const GUIDED_TOUCHED = 'buylens-guided-touched-v1';
type GuidedField = 'need' | 'clarify' | 'additional';
const untouchedFields = { need: false, clarify: false, additional: false };
const actionLabels: Record<string, string> = { preparing: 'Preparing the reviews', extracting: 'Finding evidence for your criteria', deciding: 'Choosing the next action', investigating: 'Investigating the evidence conflict', waiting: 'More evidence would help', composing: 'Preparing your decision brief', complete: 'Analysis complete', stopped: 'Stopped with critical unknowns' };
const decisionLabels = {
  INVESTIGATE_CONFLICT: 'Investigate conflict',
  REQUEST_EVIDENCE: 'Request evidence',
  FINALIZE: 'Finalize decision brief',
  STOP_INSUFFICIENT: 'Stop with insufficient evidence',
};
type Screen = 'criteria' | 'workspace' | 'brief';
type Config = { live: boolean; persistence: boolean };

function HeadphoneIllustration() {
  return <Localized><svg viewBox="0 0 260 220" role="img" aria-label="Illustration of over-ear headphones" className="headphones"><defs><linearGradient id="band" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#72829e"/><stop offset="1" stopColor="#243755"/></linearGradient></defs><path d="M57 135V97a73 73 0 0 1 146 0v38" fill="none" stroke="#c6d0e3" strokeWidth="24"/><path d="M57 135V97a73 73 0 0 1 146 0v38" fill="none" stroke="url(#band)" strokeWidth="16"/><path d="M57 121v39m146-39v39" stroke="#526681" strokeWidth="8"/><g transform="rotate(-9 60 152)"><rect x="36" y="109" width="49" height="87" rx="23" fill="#2c3e59"/><rect x="44" y="117" width="26" height="70" rx="13" fill="#71819b"/><path d="M77 122v60" stroke="#aab7ca" strokeWidth="2"/></g><g transform="rotate(9 200 152)"><rect x="175" y="109" width="49" height="87" rx="23" fill="#2c3e59"/><rect x="190" y="117" width="26" height="70" rx="13" fill="#71819b"/><path d="M182 122v60" stroke="#aab7ca" strokeWidth="2"/></g></svg></Localized>;
}

export default function BuyLens() {
  const { language } = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [screen, setScreen] = useState<Screen>('criteria');
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const [scenario, setScenario] = useState<ScenarioKey>('conflict');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [additional, setAdditional] = useState('');
  const [touched, setTouched] = useState(untouchedFields);
  const [source, setSource] = useState<string | null>(null);
  const [sourceEvidence, setSourceEvidence] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [running, setRunning] = useState<RunStep[] | null>(null);
  const [serverStartedAt, setServerStartedAt] = useState<number | null>(null);
  const [config, setConfig] = useState<Config>({ live: false, persistence: false });
  const [configReady, setConfigReady] = useState(false);
  const [serverSession, setServerSession] = useState(false);
  const sourceClose = useRef<HTMLButtonElement>(null);
  const sourceOpener = useRef<HTMLElement | null>(null);
  const pendingReset = useRef<Promise<unknown> | null>(null);
  const intent = useRef(0);
  useEffect(() => {
    const initialIntent = intent.current;
    let demoSelected = false;
    try {
      const savedTouched = sessionStorage.getItem(GUIDED_TOUCHED);
      if (savedTouched) {
        const parsed = JSON.parse(savedTouched) as Partial<typeof untouchedFields>;
        setTouched({ need: parsed.need === true, clarify: parsed.clarify === true, additional: parsed.additional === true });
      }
      demoSelected = localStorage.getItem(DEMO_SELECTED) === '1';
      const saved = localStorage.getItem(demoSelected ? DEMO_STORAGE : STORAGE);
      const parsed = saved ? JSON.parse(saved) as Session : null;
      setSession(parsed?.snapshotVersion === 2 && Array.isArray(parsed.log) && parsed.mode === (demoSelected ? 'demo' : 'live') ? parsed : createSession());
    } catch { setSession(createSession()); }
    fetch('/api/config').then(r => r.ok ? r.json() : null).then(async c => {
      setConfigReady(true);
      if (!c) return;
      setConfig(c);
      if (c.persistence && !demoSelected && intent.current === initialIntent) {
        const response = await fetch('/api/session');
        const data = await response.json();
        if (intent.current !== initialIntent) return;
        if (!response.ok) { setError(data.code ?? 'PERSISTENCE'); return; }
        if (data.session?.snapshotVersion === 2 && data.session.mode === 'live') { setServerSession(true); setSession(data.session); }
        else if (data.session) pendingReset.current = fetch('/api/session', { method: 'DELETE' });
      }
    }).catch(() => setConfigReady(true));
  }, []);
  useEffect(() => { if (session && !serverSession) { try { localStorage.setItem(session.mode === 'demo' ? DEMO_STORAGE : STORAGE, JSON.stringify(session)); } catch { setError('Browser storage is unavailable. This task will not survive a reload.'); } } }, [session, serverSession]);
  useEffect(() => { if (source) sourceClose.current?.focus(); }, [source]);
  useEffect(() => {
    if (!source) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [source]);
  const s = session;
  const commit = (next: Session) => setSession(structuredClone(next));
  function markTouched(field: GuidedField) {
    setTouched(previous => {
      const next = { ...previous, [field]: true };
      try { sessionStorage.setItem(GUIDED_TOUCHED, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function resetTouched() {
    setTouched(untouchedFields);
    try { sessionStorage.removeItem(GUIDED_TOUCHED); } catch {}
  }
  async function command(action: string, payload: Record<string, unknown> = {}, materializedNeed?: string) {
    const current = materializedNeed && s?.mode === 'live' ? { ...s, need: materializedNeed } : s;
    if (!current) return;
    if (materializedNeed) commit(current);
    setBusy(true); setError('');
    try {
      if (current.mode === 'live') {
        if (!config.live || !config.persistence) throw new Error('LIVE_UNAVAILABLE');
        if (!serverSession) {
          if (action !== 'interpret') throw new Error('INVALID_REQUEST');
          await pendingReset.current; pendingReset.current = null;
          const created = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', mode: 'live', product: current.product, need: current.need, reviewText: current.reviewText }) });
          const data = await created.json();
          if (!created.ok) throw new Error(data.code ?? 'ANALYSIS_FAILED');
          setServerSession(true); commit(data.session);
        }
        setServerStartedAt(Date.now());
        const response = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
        const data = await response.json();
        if (!response.ok) { if (data.session) commit(data.session); throw new Error(data.code ?? 'ANALYSIS_FAILED'); }
        commit(data.session);
      } else {
        const next = structuredClone(current);
        const unobserve = observeRun(next, () => setRunning(structuredClone(next.run ?? [])));
        try {
        if (action === 'interpret') await interpret(next, demoReasoner);
        if (action === 'clarify') { next.need += `\n${String(payload.answer)}`; next.clarifications++; human(next, 'Clarify needs', 'Clarification answer received'); await interpret(next, demoReasoner); }
        if (action === 'confirm') confirm(next, payload.criteria as Criterion[]);
        if (action === 'step') { try { await step(next, demoReasoner); } catch (e) { commit(next); throw e; } }
        if (action === 'add') addEvidence(next, String(payload.text));
        if (action === 'skip') skipEvidence(next);
        if (action === 'edit') editCriteria(next);
        commit(next);
        } finally { unobserve(); }
      }
      return true;
    } catch (e) { setError(codeForError(e)); }
    finally { setBusy(false); setRunning(null); setServerStartedAt(null); }
    return false;
  }
  // Each rendered step is an actual engine operation, never a decorative fixed timeline.
  useEffect(() => {
    if (!s || busy || error || screen !== 'workspace' || !['preparing', 'extracting', 'deciding', 'investigating', 'composing'].includes(s.phase)) return;
    const timer = setTimeout(() => { void command('step'); }, 0);
    return () => clearTimeout(timer);
    // command deliberately reads the latest session on each phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, busy, error, screen]);
  function abandonServer() {
    if (config.persistence) pendingReset.current = fetch('/api/session', { method: 'DELETE' });
    setServerSession(false);
  }
  function chooseScenario(key: ScenarioKey) {
    intent.current++;
    abandonServer();
    resetTouched();
    setScenario(key); setScreen('criteria'); setError(''); setAnswer(''); setAdditional(''); setShowMarkdown(false); setCopyStatus('');
    try { localStorage.setItem(DEMO_SELECTED, '1'); localStorage.removeItem(STORAGE); } catch {}
    commit(createDemoSession(scenarios[key].reviews.join('\n\n')));
  }
  function resetPurchase() {
    intent.current++;
    abandonServer(); setScreen('criteria'); setError(''); setAnswer(''); setAdditional(''); setSource(null); setShowMarkdown(false); setCopyStatus('');
    resetTouched();
    try { localStorage.removeItem(DEMO_SELECTED); localStorage.removeItem(STORAGE); } catch {}
    commit(createSession());
  }
  function updateInput(field: 'need' | 'product' | 'reviewText', value: string) {
    if (!s) return;
    if (field === 'need') markTouched('need');
    intent.current++;
    if (serverSession) abandonServer();
    try { localStorage.removeItem(DEMO_SELECTED); } catch {}
    setError(''); setAnswer(''); setAdditional(''); setShowMarkdown(false); setCopyStatus('');
    commit(revisePurchase(s, field, value));
  }
  function cite(e: Evidence) {
    return <button className="source-link" onClick={event => { sourceOpener.current = event.currentTarget; setSource(e.reviewId); setSourceEvidence(e.id); }}>{e.reviewId} <span aria-hidden="true">↗</span></button>;
  }
  function evidenceList(items: Evidence[], emptyMessage = 'No relevant evidence yet.') {
    return items.length ? items.map(e => <article className={`evidence ${e.polarity}`} key={e.id}>
      <div className="evidence-meta"><span className={`pill ${e.polarity === 'support' ? 'positive' : 'caution'}`}>{e.polarity === 'support' ? 'Supports' : 'Challenges'}</span><span>{s?.criteria.find(c => c.id === e.criterionId)?.label}</span>{cite(e)}</div>
      <blockquote>“{e.quote}”</blockquote>
      <div className="evidence-foot"><span>{e.relevance} match</span><span>{e.quality} quality</span><span>{e.environment}</span>{e.minutes !== null && <span>{e.minutes} min</span>}{e.glasses !== null && <span>{e.glasses ? 'Glasses' : 'No glasses'}</span>}</div>
      {(e.repetitive || e.ratingContradiction) && <p className="small warning">{e.repetitive ? 'Repeated wording: counts as one evidence unit. ' : ''}{e.ratingContradiction ? 'Star rating and text disagree; text retained.' : ''}</p>}
    </article>) : <p className="empty">{emptyMessage}</p>;
  }
  if (!s) return <Localized><main className="loading">Loading BuyLens…</main></Localized>;
  const needGhost = s.mode === 'live' && !s.criteria.length ? untouchedExample(s.need, touched.need, guidedNeed[language]) : null;
  const clarifyGhost = s.mode === 'live' && s.phase === 'clarify' ? untouchedExample(answer, touched.clarify, guidedClarification[language]) : null;
  const evidenceGhost = s.mode === 'live' && s.phase === 'waiting' && !s.reviewText.trim() && isGuidedCarryOnNeed(s.need)
    ? untouchedExample(additional, touched.additional, guidedReviews[language]) : null;
  const gaps = criticalGaps(s);
  const finished = ['complete', 'stopped'].includes(s.phase);
  const activeSource = s.reviews.find(r => r.id === source);
  const activeEvidence = s.evidence.find(e => e.id === sourceEvidence && e.reviewId === source);
  const activeCriterion = s.criteria.find(c => c.id === activeEvidence?.criterionId);
  const watchCriteria = s.criteria.filter(c => s.conflicts.some(conflict => conflict.criterionId === c.id) || s.brief?.risks.some(item => item.evidenceIds.some(id => s.evidence.some(e => e.id === id && e.criterionId === c.id))));
  const strongCriteria = s.criteria.filter(c => { const a = s.assessments.find(a => a.criterionId === c.id); return a?.coverage === 'adequate' && a.confidence === 'high' && !watchCriteria.some(w => w.id === c.id); });
  return <Localized>
    <header className="header"><a href="/" className="brand" aria-label="BuyLens home"><span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 30 30"><circle cx="13" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="2.5"/><path d="m18 18 6 6M10 13l2 2 4-5" fill="none" stroke="currentColor" strokeWidth="2.5"/></svg></span>BuyLens</a><div className="header-controls"><span className="brand-note">Evidence for your decision.</span><LanguageSwitch/><button className="text-button" disabled={busy} onClick={resetPurchase}>New purchase</button>{s.mode === 'demo' ? <><button className="demo-trigger" aria-label="Demo controls" popoverTarget="demo-controls" popoverTargetAction="toggle">Demo<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div id="demo-controls" popover="auto" className="demo-popover"><div className="demo-bar"><div className="demo-caption"><span className="demo-label">Demo controls</span><span className="mode-label">Deterministic demo</span></div><div><label htmlFor="scenario">Try a path</label><select id="scenario" value={scenario} disabled={busy} onChange={e => chooseScenario(e.target.value as ScenarioKey)}>{Object.entries(scenarios).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div><p className="demo-disclaimer">Prepared examples are synthetic. Pasted reviews are not verified.</p></div></div></> : <button className="demo-trigger" disabled={busy} onClick={() => chooseScenario('conflict')}>Load demo</button>}</div></header>
    <main className="shell">
      <nav className="steps" aria-label="Purchase decision steps">{(['criteria', 'workspace', 'brief'] as Screen[]).map((item, i) => <button key={item} aria-label={`${i + 1} ${['Your criteria', 'Evidence workspace', 'Decision brief'][i]}`} className={(i === 0 && s.confirmed) || (i === 1 && s.brief) ? 'step-complete' : undefined} aria-current={screen === item ? 'step' : undefined} disabled={busy || (item === 'workspace' && !s.confirmed) || (item === 'brief' && !s.brief)} onClick={() => setScreen(item)}><span>{i + 1}</span>{['Criteria', 'Evidence', 'Decision'][i]}</button>)}</nav>

      {error && <div className="error" role="alert">{errorMessage(error, language)} <button onClick={() => setError('')}>Retry</button></div>}
      {screen === 'criteria' && <>
        <div className="page-title"><div><h1>What matters to you?</h1><p>Start with your needs. We’ll look for evidence that actually answers them.</p></div><span className="subtle">One product. Your priorities.</span></div>
        <div className="criteria-layout">
          <aside className="product-dossier"><div className="product-visual">{s.mode === 'demo' ? <HeadphoneIllustration/> : <span>{s.product || 'Your product'}</span>}<span className="product-visual-caption">{s.mode === 'demo' ? 'Over-ear ANC headphones' : 'Your candidate product'}</span></div><div className="product-copy"><h2>{s.product.split('·')[0].trim() || 'Your product'}</h2><p>{s.mode === 'demo' ? 'Over-ear noise-cancelling headphones' : 'One product, your usage context.'}</p><dl><div><dt>Your use case</dt><dd>{s.criteria.length ? s.criteria.map(c => c.context).join(' · ') : s.need || 'Tell us what matters to you.'}</dd></div><div><dt>Analysis</dt><dd>{s.confirmed ? actionLabels[s.phase] : s.criteria.length ? 'Waiting for your confirmation' : 'Start with your priorities'}</dd></div></dl><p className="small">Product claims are not proof of real-world performance.</p></div></aside>
          <section className="surface criteria-form"><div className="need-composer"><label className="field-label" htmlFor="need">Tell us how you’ll use it</label><textarea id="need" rows={4} value={s.need} disabled={s.confirmed || busy} onFocus={() => markTouched('need')} onChange={e => updateInput('need', e.target.value)} placeholder={needGhost ?? (touched.need ? '' : 'Tell BuyLens what matters to you…')} aria-describedby={needGhost ? 'guided-need-note' : undefined}/>{needGhost && <span id="guided-need-note" className="sr-only">{language === 'zh' ? '灰色文字是示例，未输入且未聚焦时点击解读会使用此示例。' : 'Gray text is an example. Interpret will use it only if this field remains untouched.'}</span>}{!s.criteria.length && <div className="composer-action"><span className="small">Your needs become criteria you can review.</span><button className="primary" disabled={busy || (s.mode === 'live' && !configReady)} onClick={() => void command('interpret', {}, needGhost ?? undefined)}>{busy ? 'Interpreting…' : 'Interpret my needs'}</button></div>}</div><div className="product-field"><label className="field-label" htmlFor="product">The product you’re considering</label><input id="product" placeholder="Optional: product name or category" value={s.product} disabled={s.confirmed || busy} onChange={e => updateInput('product', e.target.value)}/></div>
            <details className="review-input"><summary>Review input · {s.reviewText.split(/\n\s*\n/).filter(Boolean).length} reviews</summary><label className="field-label" htmlFor="reviews">One review per paragraph. Optional [rating=5] prefix.</label><textarea id="reviews" rows={7} value={s.reviewText} disabled={s.confirmed || busy} onChange={e => updateInput('reviewText', e.target.value)}/></details>
            {s.phase === 'clarify' && <div className="clarification"><h3>One quick clarification</h3><p>{s.question}</p><label className="sr-only" htmlFor="clarify">Clarification answer</label><input id="clarify" value={answer} onFocus={() => markTouched('clarify')} onChange={e => { markTouched('clarify'); setAnswer(e.target.value); }} placeholder={clarifyGhost ?? (touched.clarify ? '' : 'e.g. Subway and library, two hours at a time')}/><button className="secondary" disabled={busy || (!answer.trim() && !clarifyGhost)} onClick={() => { const response = answer.trim() || clarifyGhost; if (response) { if (clarifyGhost) setAnswer(response); void command('clarify', { answer: response }); } }}>Update criteria</button><button className="text-button" disabled={busy} onClick={() => void command('clarify', { answer: 'Use editable proposed criteria; I will confirm the details.' })}>Use proposed criteria</button></div>}
            {s.criteria.length > 0 && s.phase !== 'clarify' && <div className="criteria-editor"><div className="section-heading"><h2>Your buying criteria</h2><span className="pill neutral">{s.mode === 'demo' ? 'You confirm. Then we analyze.' : 'Generated by AI from your need. Confirm or edit.'}</span></div>{s.criteria.map((c, i) => <div className="criterion-edit" key={c.id}><div><label htmlFor={`criterion-${c.id}`}>{c.label}</label><input id={`criterion-${c.id}`} aria-label={`${c.label} context`} value={c.context} disabled={s.confirmed || busy || !!c.constraint} onChange={e => { const cs = [...s.criteria]; cs[i] = { ...c, context: e.target.value }; commit({ ...s, criteria: cs }); }}/>{c.minutes !== null && <label className="duration">{s.mode === 'demo' ? 'Study session' : 'Use session'} <input type="number" min={s.mode === 'demo' ? 15 : 1} max={s.mode === 'demo' ? 480 : 10080} aria-label={s.mode === 'demo' ? 'Study session minutes' : 'Use session minutes'} value={c.minutes} disabled={s.confirmed || busy} onChange={e => { const cs = [...s.criteria]; cs[i] = { ...c, minutes: Number(e.target.value) }; commit({ ...s, criteria: cs }); }}/> min</label>}{c.constraint && <label className="duration">{c.constraint.operator === 'lte' ? 'Maximum' : c.constraint.operator === 'gte' ? 'Minimum' : 'Required value'} <input type="number" min={0} step="any" aria-label={`${c.label} constraint value`} value={c.constraint.value} disabled={s.confirmed || busy} onChange={e => { const cs = [...s.criteria]; cs[i] = editConstraintValue(c, Number(e.target.value)); commit({ ...s, criteria: cs }); }}/>{c.constraint.unit}</label>}</div><select aria-label={`${c.label} priority`} value={c.priority} disabled={s.confirmed || busy} onChange={e => { const cs = [...s.criteria]; cs[i] = { ...c, priority: e.target.value as Criterion['priority'] }; commit({ ...s, criteria: cs }); }}><option value="Critical">Critical</option><option value="Medium">Medium</option><option value="Low">Low</option><option value="Hard constraint" disabled={!c.constraint}>Hard constraint</option></select></div>)}<p className="small">Only stated constraints are used. Review the generated criteria before confirming.</p><div className="button-row">{!s.confirmed ? <button className="primary" disabled={busy} onClick={async () => { if (await command('confirm', { criteria: s.criteria })) setScreen('workspace'); }}>Confirm & analyze reviews</button> : <><button className="primary" onClick={() => setScreen('workspace')}>Continue to evidence</button><button className="secondary" disabled={busy} onClick={() => void command('edit')}>Edit criteria</button></>}</div></div>}
          </section>
        </div>
        <div className="integration-note"><span>{s.mode === 'demo' ? 'Explicit synthetic headphone demo; no model calls.' : config.live && config.persistence ? 'Your need is interpreted by the live model; the session is saved with Supabase.' : 'Live interpretation is unavailable here. Configure the private local integration or explicitly load the demo.'}</span></div>
      </>}
      {screen === 'workspace' && <>
        <div className="page-title"><div><h1>Evidence, in your context.</h1><p>Supporting details, conflicting experiences, and the gaps between them.</p></div><span className="subtle">{s.reviews.length} reviews analyzed</span></div>
        <div className="workspace-product"><div className="workspace-product-visual">{s.mode === 'demo' ? <HeadphoneIllustration/> : <span aria-hidden="true">◇</span>}</div><div><h2>{s.product.split('·')[0].trim() || 'Your product'}</h2><p>{s.criteria.map(c => c.label).join(' · ')}</p></div><div className="workspace-product-actions"><span className="pill neutral">{actionLabels[s.phase]}</span><button className="text-button" disabled={busy} onClick={async () => { if (await command('edit')) setScreen('criteria'); }}>Edit criteria</button></div></div>
        <div className="workspace-layout"><section className="agent-panel" aria-live="polite"><span className="agent-state-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="5"/><path d="m14 14 5 5m-12-9 2 2 3-4"/></svg></span><div className="agent-decision-copy"><h3>{s.decision ? `Agent chose: ${decisionLabels[s.decision.action]}` : actionLabels[s.phase] ?? 'Ready to analyze'}</h3><p>{s.decision ? `Reason: ${s.decision.reason.split(/(?<=[.!?])\s+/)[0]}` : 'Use the confirmed criteria to inspect the review evidence.'}</p></div><div className="agent-actions"><span className="small">Decision {Math.min(s.iterations, 5)} of 5</span>{finished && <div className="workspace-finish"><p>{s.phase === 'stopped' ? 'Analysis stopped. Important questions remain unanswered.' : 'Your decision brief is ready, with the caveats preserved.'}</p><button className="primary" onClick={() => setScreen('brief')}>Read decision brief</button></div>}</div></section><section className="evidence-surface">
          {s.phase === 'waiting' && <div className="evidence-request"><h2>Can you add relevant evidence?</h2><p>{s.decision?.reason}</p><label className="field-label" htmlFor="additional">Additional reviews</label>{evidenceGhost && <p id="guided-review-note" className="small guided-note">{language === 'zh' ? '灰色内容是预置合成评论，并非真实买家评价；点击“添加并重新分析”后才会用于分析。' : 'Gray text shows prepared synthetic reviews, not real customer reviews. They are used only if you choose Add & reanalyze.'}</p>}<textarea id="additional" rows={evidenceGhost ? 7 : 4} value={additional} onFocus={() => markTouched('additional')} onChange={e => { markTouched('additional'); setAdditional(e.target.value); }} placeholder={evidenceGhost ?? (touched.additional ? '' : 'Paste relevant reviews, separated by a blank line.')} aria-describedby={evidenceGhost ? 'guided-review-note' : undefined}/><div className="button-row"><button className="primary" disabled={busy || (!additional.trim() && !evidenceGhost)} onClick={() => { const text = additional.trim() || evidenceGhost; if (text) { if (evidenceGhost) setAdditional(text); void command('add', { text }); } }}>Add & reanalyze</button><button className="secondary" disabled={busy} onClick={() => void command('skip')}>Skip & keep unknown</button></div>{s.mode === 'demo' && <button className="text-button" onClick={() => setAdditional(subwayReviews.join('\n\n'))}>Load synthetic subway reviews</button>}</div>}
          
          <div className="section-heading evidence-heading"><h2>Relevant review evidence</h2><span className="small">{s.evidence.length} cited items</span></div>{s.criteria.map(c => { const items = s.evidence.filter(e => e.criterionId === c.id); const assessment = s.assessments.find(a => a.criterionId === c.id); return <section className="criterion-findings" key={c.id}><div className="criterion-finding-heading"><div><h2>{c.label}</h2><p><span className="criterion-priority">{c.priority}</span> · {c.context}{c.minutes !== null ? ` · ${c.minutes} min` : ''}</p></div><span className={`pill ${assessment?.coverage === 'adequate' ? 'positive' : assessment ? 'caution' : 'neutral'}`}>{assessment?.coverage === 'adequate' ? 'Relevant evidence found' : assessment?.coverage === 'mixed' ? 'Conflicting evidence' : assessment ? 'Evidence missing' : 'Awaiting analysis'}</span></div><div className="evidence-counts"><span><strong>{items.filter(e => e.polarity === 'support').length}</strong>Supporting</span><span><strong>{items.filter(e => e.polarity === 'challenge').length}</strong>Challenging</span><span className="small">Cited items</span></div><div className="finding-columns"><div><h3 className="finding-label support-label">Supporting evidence</h3>{evidenceList(items.filter(e => e.polarity === 'support'))}</div><div><h3 className="finding-label challenge-label">Challenging evidence</h3>{evidenceList(items.filter(e => e.polarity === 'challenge'), 'No challenging evidence extracted from these reviews. This does not establish that there are no risks.')}</div></div>{assessment && <p className="assessment-note">{assessment.units} distinct relevant accounts · {assessment.reason}</p>}</section>; })}
          {s.conflicts.length > 0 && <section className="findings"><h2>Conflicts</h2>{s.conflicts.map(c => <div className="finding" key={c.id}><strong>{s.criteria.find(x => x.id === c.criterionId)?.label}</strong><span className={`pill ${c.status === 'explained' ? 'neutral' : 'caution'}`}>{c.status === 'explained' ? 'Context difference found' : c.status}</span><p>{c.finding || 'Positive and negative experiences disagree. The agent will decide whether to investigate.'}</p><div className="button-row">{c.findingEvidenceIds.map(id => { const e = s.evidence.find(e => e.id === id); return e ? <span key={id}>{cite(e)}</span> : null; })}</div></div>)}</section>}
          {gaps.length > 0 && <section className="findings"><h2>Still unknown</h2>{gaps.map(a => <p key={a.criterionId}><strong>{s.criteria.find(c => c.id === a.criterionId)?.label}: </strong>{a.reason}</p>)}</section>}

        </section><aside className="workspace-rail">
          <AgentRun session={s} running={running} serverStartedAt={serverStartedAt}/>
          <details className="activity"><summary>Agent activity</summary><ol>{s.log.map(entry => <li key={entry.id}><span className={`log-dot ${entry.kind}`}/><div><strong>{entry.label.replaceAll('_', ' ').toLowerCase()}</strong><p>{entry.detail}</p></div></li>)}</ol></details>

        </aside></div>
      </>}
      {screen === 'brief' && s.brief && <>
        <div className="page-title"><div><h1>Your decision brief.</h1><p>What the supplied evidence means for your priorities.</p></div></div>
        <article className="surface brief-document"><div className="brief-intro"><div className="brief-product-visual">{s.mode === 'demo' ? <HeadphoneIllustration/> : <span aria-hidden="true">◇</span>}</div><div className="brief-product-copy"><h2>{s.product}</h2><p>{s.criteria.map(c => `${c.label}: ${c.context}${c.minutes !== null ? ` (${c.minutes} min)` : ''}`).join(' · ')}</p><span className="small">{s.reviews.length} reviews · {s.evidence.length} cited items</span></div></div><section className="shopper-snapshot"><div className="snapshot-heading"><h2>Your fit, at a glance.</h2><span className={`pill ${s.brief.incomplete ? 'caution' : 'positive'}`}>{s.brief.incomplete ? 'Critical evidence missing' : 'Complete with caveats'}</span></div><dl className="snapshot-grid"><div><dt>Strong evidence</dt><dd>{strongCriteria.length ? <ul>{strongCriteria.map(c => <li key={c.id}><strong>{c.label}</strong><span>High coverage confidence</span></li>)}</ul> : <p>No strong, unchallenged coverage yet.</p>}</dd></div><div><dt>Watch closely</dt><dd>{watchCriteria.length ? <ul>{watchCriteria.map(c => <li key={c.id}><strong>{c.label}</strong><span>{c.minutes !== null ? `${c.minutes} min sessions` : c.context}{s.evidence.some(e => e.criterionId === c.id && e.polarity === 'challenge' && e.glasses === true) ? ' · adverse account with glasses' : ''}</span></li>)}</ul> : <p>No cited adverse experience or conflict for these criteria. Personal fit is still unverified.</p>}</dd></div>{gaps.length > 0 && <div><dt>Still unknown</dt><dd><ul>{gaps.map(a => <li key={a.criterionId}><strong>{s.criteria.find(c => c.id === a.criterionId)?.label}</strong><span>{a.reason}</span></li>)}</ul></dd></div>}</dl><p className="snapshot-note">Strength reflects coverage of supplied reviews, not authenticity or guaranteed personal fit.</p></section>
          <div className="brief-columns"><section><h2>Fits your needs</h2>{s.brief.fits.length ? s.brief.fits.map((item, i) => <div className="brief-item" key={i}><p>{item.text}</p>{item.evidenceIds.map(id => { const e = s.evidence.find(e => e.id === id); return e ? <span key={id}>{cite(e)}</span> : null; })}</div>) : <p className="empty">No sufficiently supported fit claims for the unresolved criteria.</p>}</section><section><h2>Risks for you</h2>{s.brief.risks.length ? s.brief.risks.map((item, i) => <div className="brief-item" key={i}><p>{item.text}</p>{item.evidenceIds.map(id => { const e = s.evidence.find(e => e.id === id); return e ? <span key={id}>{cite(e)}</span> : null; })}</div>) : <p className="empty">No specific adverse experiences extracted. This does not prove there are no risks.</p>}<p className="small">Suitability depends on your usage context. These accounts cannot guarantee fit.</p></section></div>
          <details className="brief-evidence"><summary>Supporting evidence</summary>{evidenceList(s.evidence.filter(e => e.polarity === 'support'))}</details><details className="brief-evidence" open><summary>Contradictory evidence</summary>{evidenceList(s.evidence.filter(e => e.polarity === 'challenge'))}{s.conflicts.map(c => <p className="context-note" key={c.id}>{c.finding || 'This conflict is still unexplained.'}</p>)}</details>
          <section className="brief-section"><h2>Evidence quality & confidence</h2><div className="quality-grid">{s.assessments.map(a => <div key={a.criterionId}><strong>{s.criteria.find(c => c.id === a.criterionId)?.label}</strong><span className="pill neutral">{a.confidence} confidence</span><p>{a.reason}</p></div>)}</div><p className="small">Confidence describes this material’s coverage, not review authenticity or your probability of satisfaction.</p></section>
          <section className="brief-section unknown-section"><h2>Unknowns</h2>{gaps.length ? gaps.map(a => <p key={a.criterionId}><strong>{s.criteria.find(c => c.id === a.criterionId)?.label}: </strong>{a.reason}</p>) : <p>No critical gap under the controller coverage rules. Actual performance in your context still needs confirmation.</p>}{s.brief.incomplete && <p>Analysis stopped: {s.decision?.reason ?? 'Unresolved evidence prevents a complete conclusion.'}</p>}</section><section className="brief-section"><h2>Before you buy</h2><ul>{s.brief.beforeBuying.map((text, i) => <li key={i}>{text}</li>)}</ul></section><footer className="brief-footer">Based only on supplied reviews. Prepared examples are synthetic; review authenticity is not verified.</footer>
        </article><div className="button-row bottom-actions"><button className="secondary" onClick={() => setScreen('workspace')}>Back to evidence</button><button className="secondary" aria-expanded={showMarkdown} aria-controls="markdown-brief" onClick={() => setShowMarkdown(value => !value)}>View Markdown Brief</button><button className="text-button" onClick={resetPurchase}>Start a new decision</button></div>
        {showMarkdown && <section id="markdown-brief" className="surface markdown-view"><div className="section-heading"><h2>Markdown Brief</h2><button className="secondary" onClick={async () => { try { await navigator.clipboard.writeText(localizedMarkdown(markdownBrief(s), language)); setCopyStatus('Copied Markdown'); } catch { setCopyStatus('Copy unavailable. Select the Markdown below.'); } }}>Copy Markdown</button></div><p className="small" role="status">{copyStatus || 'Generated from this validated brief and its source evidence. No additional model call.'}</p><pre aria-label="Markdown brief">{localizedMarkdown(markdownBrief(s), language)}</pre></section>}
      </>}
      <footer className="page-footer"><span>BuyLens · <a href="/evaluation">Portfolio evaluation</a></span><span>Your priorities. The evidence. The unknowns.</span></footer>
    </main>
    {activeSource && <div className="modal-backdrop" onClick={() => { setSource(null); sourceOpener.current?.focus(); }}><section role="dialog" aria-modal="true" aria-labelledby="source-title" className="source-modal" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') { setSource(null); sourceOpener.current?.focus(); } if (e.key === 'Tab') { e.preventDefault(); sourceClose.current?.focus(); } }}><div className="section-heading"><h2 id="source-title">Source review {activeSource.id}</h2><button ref={sourceClose} className="secondary" onClick={() => { setSource(null); sourceOpener.current?.focus(); }}>Close</button></div><span className="pill neutral">User-provided or synthetic text</span><h3>Original review</h3><blockquote>{activeSource.rawText}</blockquote>{activeEvidence && <><h3>Exact quote</h3><blockquote className="exact-quote">{activeEvidence.quote}</blockquote><dl className="evidence-details"><div><dt>Criterion</dt><dd>{activeCriterion?.label} · {activeCriterion?.context}{activeCriterion?.minutes !== null && activeCriterion?.minutes !== undefined ? ` · ${activeCriterion.minutes} min` : ''}</dd></div><div><dt>Direction / relevance</dt><dd>{activeEvidence.polarity === 'support' ? 'Supports' : 'Challenges'} · {activeEvidence.relevance}</dd></div><div><dt>Evidence quality</dt><dd>{activeEvidence.quality}</dd></div><div><dt>Detected usage context</dt><dd>{activeEvidence.environment}{activeEvidence.glasses !== null && <>; glasses: {activeEvidence.glasses ? 'yes' : 'no'}</>}</dd></div><div><dt>{s.mode === 'demo' ? 'Wearing duration' : 'Use duration'}</dt><dd>{activeEvidence.minutes === null ? 'Not stated' : `${activeEvidence.minutes} min`}</dd></div><div><dt>Rating / text contradiction</dt><dd>{activeEvidence.ratingContradiction ? 'Detected — text retained' : 'Not detected'}{activeSource.rating === null ? '' : ` · rating ${activeSource.rating}/5`}</dd></div><div><dt>Why this matters</dt><dd>{activeEvidence.reason}</dd></div></dl><p className="small">Citation verified: exact quote exists in {activeSource.id}.</p></>}<p className="small">Exact source text. Review authenticity has not been verified.</p></section></div>}
  </Localized>;
}
