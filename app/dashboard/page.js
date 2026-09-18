'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setUser(JSON.parse(window.localStorage.getItem('topmeupUser') || 'null'));
    fetch('/api/requests').then((response) => response.json()).then((payload) => setRequests(payload.requests || []));
  }, []);

  const signOut = () => { window.localStorage.removeItem('topmeupUser'); window.location.href = '/'; };

  return <main className="dashboard-page"><header className="dashboard-header"><a className="brand" href="/"><span className="brand-mark">↗</span><span>topmeup</span></a><div className="dashboard-user"><span>{user?.name || 'Demo member'}</span><button type="button" onClick={signOut}>Sign out</button></div></header><section className="dashboard-hero"><p className="section-kicker">Your dashboard</p><h1>Keep your requests moving.</h1><p>Track active links, contributions, and voucher deliveries in one place.</p></section><div className="dashboard-stats"><div><strong>{requests.length}</strong><span>Requests created</span></div><div><strong>{requests.filter((item) => item.status === 'tokenized').length}</strong><span>Fulfilled requests</span></div><div><strong>24h</strong><span>Link lifetime</span></div></div><section className="dashboard-table"><div className="dashboard-section-heading"><div><p className="section-kicker">Activity</p><h2>Recent requests</h2></div><a className="primary-action dashboard-action" href="/">Create request <span>↗</span></a></div>{requests.length === 0 ? <div className="empty-state"><h3>No requests yet</h3><p>Create your first top-up request and share it with someone who can help.</p><a className="secondary-action" href="/">Start a request</a></div> : <div className="request-list">{requests.map((request) => <div className="request-row" key={request.id}><div><strong>Meter {request.meter.slice(0, 3)}***{request.meter.slice(-4)}</strong><small>{request.code}</small></div><span className={`status-pill ${request.status}`}>{request.status}</span><a href={`/e/${request.code}`}>View request ↗</a></div>)}</div>}</section></main>;
}
