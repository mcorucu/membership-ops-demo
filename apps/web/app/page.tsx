'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type User = { id: string; email: string; role: 'MEMBER' | 'ADMIN' };
type Payment = { id: string; amountCents: number; months: number; status: 'PAID' | 'FAILED'; providerReference: string; createdAt: string };
type Membership = { id: string; plan: string; monthlyPriceCents: number; status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'; validUntil: string; payments: Payment[] };
type Overview = { id: string; email: string; role: User['role']; membership: Membership };
type Stage = { id: string; title: string; label: string; path: string; description: string; lines: string[] };

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';
const MONTH_OPTIONS = [1, 3, 6, 12] as const;
const DEMO_CREDENTIALS = { email: 'member@membership-ops.local', password: 'demo-member-password' };

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function apiRequest(path: string, token?: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw body;
  return body;
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [activeView, setActiveView] = useState('Overview');
  const [loginForm, setLoginForm] = useState(DEMO_CREDENTIALS);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [months, setMonths] = useState<(typeof MONTH_OPTIONS)[number]>(1);
  const [paymentMethodId, setPaymentMethodId] = useState<'pm_demo_success' | 'pm_demo_declined'>('pm_demo_success');
  const [renewalState, setRenewalState] = useState<{ kind: 'idle' | 'success' | 'error'; message: string; code?: string }>({ kind: 'idle', message: '' });
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    const existing = window.sessionStorage.getItem('membership-ops-token');
    if (existing) setToken(existing);
    fetch('/developer-flow.json').then((response) => response.json()).then((body) => setStages(body.stages ?? [])).catch(() => setStages([]));
    const openDeveloperView = () => setActiveView('Developer View');
    window.addEventListener('open-developer-view', openDeveloperView);
    return () => window.removeEventListener('open-developer-view', openDeveloperView);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiRequest('/memberships/me/overview', token).then((body) => {
      setOverview(body);
      setUser({ id: body.id, email: body.email, role: body.role });
    }).catch(() => {
      window.sessionStorage.removeItem('membership-ops-token');
      setToken(null);
    });
  }, [token]);

  const price = useMemo(() => {
    const monthly = overview?.membership.monthlyPriceCents ?? 4900;
    const rate = months === 1 ? 0 : months === 3 ? 0.05 : months === 6 ? 0.1 : 0.15;
    const undiscountedCents = monthly * months;
    const discountCents = Math.round(undiscountedCents * rate);
    return { amountCents: undiscountedCents - discountCents, discountCents, rate };
  }, [months, overview]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      const result = await apiRequest('/auth/login', undefined, { method: 'POST', body: JSON.stringify(loginForm) });
      window.sessionStorage.setItem('membership-ops-token', result.accessToken);
      setToken(result.accessToken);
    } catch (error: any) {
      setLoginError(error?.message ?? 'Email or password is incorrect.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleRenew(event: FormEvent) {
    event.preventDefault();
    if (!token || !overview) return;
    setRenewalState({ kind: 'idle', message: '' });
    try {
      await apiRequest(`/memberships/${overview.membership.id}/renew`, token, { method: 'POST', body: JSON.stringify({ months, paymentMethodId }) });
      const refreshed = await apiRequest('/memberships/me/overview', token);
      setOverview(refreshed);
      setRenewalState({ kind: 'success', message: `Renewal confirmed. Membership now runs through ${dateLabel(refreshed.membership.validUntil)}.` });
    } catch (error: any) {
      setRenewalState({ kind: 'error', message: error?.message ?? 'The renewal could not be completed.', code: error?.code });
    }
  }

  function logout() {
    window.sessionStorage.removeItem('membership-ops-token');
    setToken(null);
    setOverview(null);
    setUser(null);
  }

  if (!token || !overview || !user) {
    return <LoginScreen form={loginForm} setForm={setLoginForm} onSubmit={handleLogin} error={loginError} loading={isLoggingIn} />;
  }

  const membership = overview.membership;
  const recentPayment = membership.payments[0];

  const displayName = user.email.split('@')[0] ?? user.email;
  const initial = user.email.at(0)?.toUpperCase() ?? '?';
  return <div className="app-frame">
    <aside className="shell-rail">
      <div className="brand-mark"><span className="brand-dot" /> <span>MEMBERSHIP<br /><strong>OPS</strong></span></div>
      <div className="rail-caption">OPERATIONS CONSOLE</div>
      <nav className="nav-stack" aria-label="Primary navigation">
        {['Overview', 'Membership', 'Payments', 'Developer View'].map((item) => <button key={item} className={`nav-item ${activeView === item ? 'active' : ''}`} onClick={() => setActiveView(item)}><span className="nav-glyph">{item === 'Overview' ? '◈' : item === 'Membership' ? '◫' : item === 'Payments' ? '↯' : '⌘'}</span>{item}</button>)}
      </nav>
      <div className="rail-bottom"><div className="online"><span /> API ONLINE</div><button className="ghost-button" onClick={logout}>Sign out</button></div>
    </aside>
    <main className="main-canvas">
      <header className="topbar"><div><p className="eyebrow">WORKSPACE / {activeView.toUpperCase()}</p><h1>{activeView}</h1></div><div className="user-chip"><span className="avatar">{initial}</span><span><strong>{displayName}</strong><small>{user.role.toLowerCase()}</small></span></div></header>
      {activeView === 'Overview' && <OverviewView membership={membership} recentPayment={recentPayment} months={months} setMonths={setMonths} price={price} paymentMethodId={paymentMethodId} setPaymentMethodId={setPaymentMethodId} onRenew={handleRenew} renewalState={renewalState} />}
      {activeView === 'Membership' && <MembershipView membership={membership} />}
      {activeView === 'Payments' && <PaymentsView payments={membership.payments} />}
      {activeView === 'Developer View' && <DeveloperView stages={stages} />}
    </main>
  </div>;
}

function LoginScreen({ form, setForm, onSubmit, error, loading }: { form: typeof DEMO_CREDENTIALS; setForm: (form: typeof DEMO_CREDENTIALS) => void; onSubmit: (event: FormEvent) => void; error: string; loading: boolean }) {
  return <div className="login-frame"><div className="login-shell"><div className="login-aside"><div className="brand-mark"><span className="brand-dot" /> <span>MEMBERSHIP<br /><strong>OPS</strong></span></div><div className="login-aside-copy"><p className="eyebrow">INTERVIEW SAMPLE / 01</p><h1>Make every<br /><em>renewal</em> explainable.</h1><p>A compact, production-minded membership billing flow built to be read, tested, and discussed.</p></div><div className="login-aside-foot"><span>v1.0.0 / DEMO ENVIRONMENT</span><span className="orange-line" /></div></div><div className="login-panel"><div className="panel-kicker">SECURE ACCESS <span>●</span></div><h2>Welcome back</h2><p className="muted">Sign in to inspect your membership operations workspace.</p><form onSubmit={onSubmit} className="login-form"><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="username" required /></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="current-password" minLength={8} required /></label>{error && <div className="alert error" role="alert">{error}</div>}<button className="primary-button" type="submit" disabled={loading}>{loading ? 'Authenticating…' : 'Enter workspace'} <span>→</span></button></form><button className="demo-link" onClick={() => setForm(DEMO_CREDENTIALS)}>Use demo member credentials</button><p className="login-note">JWT authentication · server-side authorization · deterministic demo payment</p></div></div></div>;
}

function OverviewView({ membership, recentPayment, months, setMonths, price, paymentMethodId, setPaymentMethodId, onRenew, renewalState }: any) {
  return <div className="view-stack"><section className="hero-card"><div><span className="status-pill"><i /> {membership.status}</span><p className="eyebrow">CURRENT MEMBERSHIP</p><h2>{membership.plan} plan</h2><p className="hero-sub">Your access is active and ready for the next cycle.</p></div><div className="hero-date"><span>VALID UNTIL</span><strong>{dateLabel(membership.validUntil)}</strong><small>Auto-renewal is manual in this demo</small></div></section><section className="metric-grid"><Metric label="Monthly price" value={money(membership.monthlyPriceCents)} detail="BASE RATE" /><Metric label="Membership state" value={membership.status} detail="CURRENT" accent="green" /><Metric label="Recent payment" value={recentPayment ? money(recentPayment.amountCents) : '—'} detail={recentPayment ? dateLabel(recentPayment.createdAt) : 'NO PAYMENTS'} /></section><div className="content-grid"><section className="panel renewal-panel"><div className="section-heading"><div><span className="eyebrow">PRIMARY REQUEST</span><h3>Renew membership</h3></div><span className="request-tag">POST /renew</span></div><p className="muted">Choose a term and a deterministic payment scenario. The API calculates the price, charges the gateway, then commits payment and membership updates together.</p><form onSubmit={onRenew}><fieldset><legend>Renewal term</legend><div className="term-grid">{MONTH_OPTIONS.map((option) => <button type="button" key={option} className={`term-option ${months === option ? 'selected' : ''}`} onClick={() => setMonths(option)}><strong>{option}</strong><span>month{option === 1 ? '' : 's'}</span>{option > 1 && <small>{option === 3 ? '5%' : option === 6 ? '10%' : '15%'} off</small>}</button>)}</div></fieldset><fieldset><legend>Demo payment scenario</legend><div className="scenario-grid"><label className={`scenario ${paymentMethodId === 'pm_demo_success' ? 'selected' : ''}`}><input type="radio" checked={paymentMethodId === 'pm_demo_success'} onChange={() => setPaymentMethodId('pm_demo_success')} /> <span><strong>Successful payment</strong><small>pm_demo_success</small></span></label><label className={`scenario ${paymentMethodId === 'pm_demo_declined' ? 'selected danger-border' : ''}`}><input type="radio" checked={paymentMethodId === 'pm_demo_declined'} onChange={() => setPaymentMethodId('pm_demo_declined')} /> <span><strong>Declined payment</strong><small>pm_demo_declined</small></span></label></div></fieldset><div className="renewal-summary"><div><span>Due today</span><strong>{money(price.amountCents)}</strong><small>{price.discountCents ? `${money(price.discountCents)} saved · ` : ''}{months}-month term</small></div><button className="primary-button" type="submit">Process renewal <span>↗</span></button></div>{renewalState.kind !== 'idle' && <div className={`alert ${renewalState.kind === 'success' ? 'success' : 'error'}`} role="status"><strong>{renewalState.code ?? (renewalState.kind === 'success' ? 'RENEWAL_COMPLETED' : 'REQUEST_FAILED')}</strong> {renewalState.message}</div>}</form></section><section className="panel lifecycle-panel"><div className="section-heading"><div><span className="eyebrow">REQUEST LIFECYCLE</span><h3>What happens next</h3></div><span className="live-dot">LIVE TRACE</span></div><div className="trace-list">{['Validate input', 'Authenticate JWT', 'Authorize ownership', 'Calculate price', 'Charge demo gateway', 'Commit DB transaction'].map((step, index) => <div className="trace-step" key={step}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step}</strong><small>{index === 4 ? 'FakePaymentGateway' : index === 5 ? 'Payment + Membership' : 'MembershipsService'}</small></div><b>✓</b></div>)}</div><button className="text-button" onClick={() => window.dispatchEvent(new CustomEvent('open-developer-view'))}>Open Developer View →</button></section></div></div>;
}

function Metric({ label, value, detail, accent }: { label: string; value: string; detail: string; accent?: string }) { return <article className="metric-card"><span>{label}</span><strong className={accent ?? ''}>{value}</strong><small>{detail}</small></article>; }

function MembershipView({ membership }: { membership: Membership }) { return <div className="view-stack"><section className="panel detail-panel"><div className="section-heading"><div><span className="eyebrow">MEMBERSHIP RECORD</span><h3>{membership.plan}</h3></div><span className="status-pill"><i /> {membership.status}</span></div><div className="detail-grid"><Detail label="Membership ID" value={membership.id} mono /><Detail label="Plan" value={membership.plan} /><Detail label="Monthly price" value={money(membership.monthlyPriceCents)} /><Detail label="Valid until" value={dateLabel(membership.validUntil)} /></div></section><section className="info-callout"><span>i</span><p><strong>Renewal rule</strong> An active membership extends from its current expiration date. An expired membership starts from today. Cancelled memberships are rejected by the service before payment.</p></section></div>; }

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div className="detail-item"><span>{label}</span><strong className={mono ? 'mono' : ''}>{value}</strong></div>; }

function PaymentsView({ payments }: { payments: Payment[] }) { return <div className="view-stack"><section className="panel table-panel"><div className="section-heading"><div><span className="eyebrow">LEDGER</span><h3>Payment history</h3></div><span className="request-tag">{payments.length} RECORDS</span></div>{payments.length ? <div className="payment-table"><div className="table-row table-head"><span>DATE</span><span>TERM</span><span>AMOUNT</span><span>STATUS</span><span>REFERENCE</span></div>{payments.map((payment) => <div className="table-row" key={payment.id}><span>{dateLabel(payment.createdAt)}</span><span>{payment.months} mo</span><strong>{money(payment.amountCents)}</strong><span className="paid">{payment.status}</span><span className="mono">{payment.providerReference}</span></div>)}</div> : <div className="empty-state">No payments recorded yet. Your first successful renewal will appear here.</div>}</section></div>; }

function DeveloperView({ stages }: { stages: Stage[] }) { const [selected, setSelected] = useState(stages[0]?.id ?? ''); const active = stages.find((stage) => stage.id === selected) ?? stages[0]; return <div className="view-stack"><section className="developer-intro"><div><span className="eyebrow">SOURCE EXPLORER / BUILD-TIME EXTRACTED</span><h2>Follow the request, line by line.</h2><p>These snippets are extracted from the real API source during the build. Each path is an invitation to open the implementation in the interview.</p></div><div className="source-badge"><span>⌘</span><strong>{stages.length}</strong><small>linked stages</small></div></section><div className="developer-layout"><div className="stage-list" role="tablist" aria-label="Request stages">{stages.map((stage, index) => <button key={stage.id} className={`stage-item ${active?.id === stage.id ? 'active' : ''}`} onClick={() => setSelected(stage.id)}><span className="stage-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{stage.title}</strong><small>{stage.label}</small></span><b>›</b></button>)}</div>{active && <div className="code-panel"><div className="code-top"><span className="code-dot red" /><span className="code-dot yellow" /><span className="code-dot green" /><span className="code-path">{active.path}</span></div><div className="code-copy"><span className="eyebrow">{active.label}</span><h3>{active.title}</h3><p>{active.description}</p></div><pre><code>{active.lines.join('\n')}</code></pre><div className="code-footer"><span>ACTUAL SOURCE PATH</span><strong>{active.path}</strong></div></div>}</div></div>; }
