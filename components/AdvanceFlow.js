'use client';

import { useEffect, useState } from 'react';

const options = [20, 30, 40, 50];

export default function AdvanceFlow({ meter, user }) {
  const [advances, setAdvances] = useState([]);
  const [outstanding, setOutstanding] = useState(0);
  const [amount, setAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');

  const loadAdvances = () => fetch(`/api/advances?meter=${meter}`).then((response) => response.json()).then((payload) => {
    setAdvances(payload.advances || []);
    setOutstanding(payload.outstanding || 0);
  });

  useEffect(() => { loadAdvances(); }, [meter]);

  const selectedAmount = customAmount === '' ? amount : Number(customAmount);
  const remaining = Math.max(0, 100 - outstanding);

  const createAdvance = async (event) => {
    event.preventDefault();
    setError('');
    if (!Number.isFinite(selectedAmount) || selectedAmount < 20 || selectedAmount > 50) {
      setError('Enter an amount between R20 and R50.');
      return;
    }
    if (selectedAmount > remaining) {
      setError(`Only R${remaining.toFixed(2)} remains available under the R100 limit.`);
      return;
    }
    const response = await fetch('/api/advances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ meter, amount: selectedAmount, owner: user || null }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || 'Unable to create advance.'); return; }
    setReceipt(payload.receipt);
    setCustomAmount('');
    await loadAdvances();
  };

  const shareReceipt = (type) => {
    if (!receipt) return;
    if (type === 'whatsapp') window.open(receipt.whatsappUrl, '_blank', 'noopener');
    if (type === 'email') window.location.href = `mailto:${user?.email || ''}?subject=${encodeURIComponent('topmeup advance receipt')}&body=${encodeURIComponent(receipt.message)}`;
  };

  return <div className="advance-panel">
    <div className="advance-summary"><span>Advanced so far</span><strong>R{outstanding.toFixed(2)}</strong><small>R{remaining.toFixed(2)} remaining of your R100 limit</small></div>
    <div className="advance-history"><div className="field-label">Current advances</div>{advances.filter((advance) => advance.status !== 'paid').map((advance) => <div className="advance-row" key={advance.id}><div><strong>Meter {advance.meter.slice(0, 3)}***{advance.meter.slice(-4)}</strong><small>{new Date(advance.createdAt).toLocaleString()}</small></div><span>R{(advance.amount - advance.paidAmount).toFixed(2)} due</span></div>)}</div>
    <form className="advance-form" onSubmit={createAdvance}><label className="field-label">Choose an advance amount</label><div className="amount-grid">{options.map((option) => <button key={option} className={customAmount === '' && amount === option ? 'amount-option is-selected' : 'amount-option'} type="button" onClick={() => { setAmount(option); setCustomAmount(''); }}>R{option}</button>)}</div><input type="number" min="20" max="50" step="0.01" placeholder="Enter amount (R20–R50)" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} />{error && <p className="field-error">{error}</p>}<button className="primary-action" type="submit">Send advance <span>↗</span></button></form>
    {receipt && <div className="advance-receipt"><strong>Advance receipt ready</strong><span>{receipt.message}</span><div className="share-actions"><button type="button" onClick={() => shareReceipt('whatsapp')}>WhatsApp</button><button type="button" onClick={() => shareReceipt('email')}>Email</button></div><small>{user?.email ? `Receipt sent to ${user.email}` : 'Choose WhatsApp or email to send this receipt.'}</small></div>}
  </div>;
}
