'use client';

import { useEffect, useState } from 'react';

const amounts = [50, 100, 200, 500];

export default function DonorCheckout({ code }) {
  const [request, setRequest] = useState(null);
  const [amount, setAmount] = useState(200);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [fulfillment, setFulfillment] = useState(null);

  useEffect(() => {
    fetch(`/api/requests?code=${encodeURIComponent(code)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('This request link has expired or does not exist.');
        return response.json();
      })
      .then((payload) => { setRequest(payload.request); setStatus('ready'); })
      .catch((reason) => { setError(reason.message); setStatus('error'); });
  }, [code]);

  const handlePay = async (event) => {
    event.preventDefault();
    setStatus('paying');
    setError('');
    const response = await fetch('/api/donations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, amount, donorEmail: email }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || 'Payment could not be completed.'); setStatus('ready'); return; }
    setFulfillment(payload.fulfillment);
    setStatus('success');
  };

  if (status === 'loading') return <main className="checkout-page"><div className="checkout-card"><p className="section-kicker">Secure checkout</p><h1>Loading request...</h1></div></main>;
  if (status === 'error') return <main className="checkout-page"><div className="checkout-card"><p className="section-kicker">Request unavailable</p><h1>This link is no longer active.</h1><p>{error}</p><a className="secondary-action" href="/">Create a request</a></div></main>;
  if (status === 'success') return <main className="checkout-page"><div className="checkout-card success-checkout"><span className="check-icon">✓</span><p className="section-kicker">Donation complete</p><h1>Power is on its way.</h1><p>Your demo donation of <strong>R{amount}</strong> generated a prepaid voucher for meter {request.meter.slice(0, 3)}***{request.meter.slice(-4)}.</p><div className="token-box"><small>Voucher token</small><strong>{fulfillment.token}</strong><span>{fulfillment.units} estimated units</span></div><button className="secondary-action" type="button" onClick={() => navigator.clipboard?.writeText(fulfillment.token)}>Copy voucher token</button><a className="back-link" href="/">Back to topmeup</a></div></main>;

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="content-header"><a className="brand" href="/"><span className="brand-mark">↗</span><span>topmeup</span></a><a className="back-link" href="/">Cancel</a></header>
        <div className="checkout-grid">
          <section className="checkout-card">
            <p className="section-kicker">Donate electricity to</p>
            <h1>Help keep the lights on.</h1>
            <div className="recipient-card"><strong>Meter {request.meter.slice(0, 3)}***{request.meter.slice(-4)}</strong><span>00 Southwest Street, Silverton</span><small>Request link expires in 23:59:12</small></div>
            <form className="checkout-form" onSubmit={handlePay}>
              <label className="field-label">Choose an amount</label>
              <div className="amount-grid">{amounts.map((option) => <button key={option} className={amount === option ? 'amount-option is-selected' : 'amount-option'} type="button" onClick={() => setAmount(option)}>R{option}</button>)}</div>
              <label className="field-label" htmlFor="donor-email">Receipt email <span>(optional)</span></label>
              <input id="donor-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              {error && <p className="field-error">{error}</p>}
              <button className="primary-action" disabled={status === 'paying'} type="submit">{status === 'paying' ? 'Processing demo payment...' : `Pay R${amount} securely`} <span>↗</span></button>
              <small className="form-note">Demo checkout only. No real payment is collected.</small>
            </form>
          </section>
          <aside className="checkout-trust"><p className="section-kicker">Built for trust</p><h2>Your help reaches a real request.</h2><p>TopmeUp masks personal details and keeps each request link active for 24 hours.</p><div className="trust-stat"><strong>{request.fulfillments?.length || 0}</strong><span>helpers have contributed</span></div><div className="trust-stat"><strong>POPIA</strong><span>privacy-minded by design</span></div></aside>
        </div>
      </div>
    </main>
  );
}
