'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [requests, setRequests] = useState([]);
  useEffect(() => { fetch('/api/requests').then((response) => response.json()).then((payload) => setRequests(payload.requests || [])); }, []);
  const fulfilled = requests.reduce((total, request) => total + (request.fulfillments?.length || 0), 0);
  const value = requests.reduce((total, request) => total + (request.fulfillments || []).reduce((sum, item) => sum + item.amount, 0), 0);
  return <main className="dashboard-page"><header className="dashboard-header"><a className="brand" href="/"><span className="brand-mark">↗</span><span>topmeup admin</span></a><a className="back-link" href="/dashboard">Customer dashboard</a></header><section className="dashboard-hero"><p className="section-kicker">Operations</p><h1>See the whole network.</h1><p>Monitor requests and demo fulfillment activity while the production integrations are being connected.</p></section><div className="dashboard-stats"><div><strong>{requests.length}</strong><span>Total requests</span></div><div><strong>{fulfilled}</strong><span>Fulfillments</span></div><div><strong>R{value}</strong><span>Demo value processed</span></div></div><section className="dashboard-table"><div className="dashboard-section-heading"><div><p className="section-kicker">Request monitor</p><h2>All requests</h2></div><span className="status-pill active">Live demo</span></div><div className="request-list">{requests.length === 0 ? <div className="empty-state"><h3>No request data yet</h3><p>Create a request from the home page to populate this dashboard.</p></div> : requests.map((request) => <div className="request-row" key={request.id}><div><strong>{request.code}</strong><small>{request.meter}</small></div><span className={`status-pill ${request.status}`}>{request.status}</span><span>{request.fulfillments?.length || 0} contributions</span></div>)}</div></section></main>;
}
