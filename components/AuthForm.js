'use client';

import { useState } from 'react';

export default function AuthForm({ mode = 'signin' }) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    window.localStorage.setItem('topmeupUser', JSON.stringify({ name: name || 'topmeup member', email }));
    window.location.href = '/dashboard';
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="brand" href="/" aria-label="topmeup home"><span className="brand-mark">↗</span><span>topmeup</span></a>
        <p className="section-kicker">{isSignUp ? 'Join the community' : 'Welcome back'}</p>
        <h1>{isSignUp ? 'Create your account.' : 'Sign in to topmeup.'}</h1>
        <p className="auth-copy">Use this demo account flow to test request history, dashboards, and account actions.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && <><label className="field-label" htmlFor="auth-name">Full name</label><input id="auth-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></>}
          <label className="field-label" htmlFor="auth-email">Email address</label>
          <input id="auth-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          <label className="field-label" htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" required minLength={6} placeholder="At least 6 characters" />
          {isSignUp && <label className="consent-row"><input type="checkbox" required /><span>I agree to the topmeup terms and POPIA privacy policy.</span></label>}
          <button className="primary-action" type="submit">{isSignUp ? 'Create account' : 'Sign in'} <span>↗</span></button>
        </form>
        {message && <p className="field-error">{message}</p>}
        <button className="auth-switch" type="button" onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}>{isSignUp ? 'Already have an account? Sign in' : 'New to topmeup? Create an account'}</button>
        <a className="back-link" href="/">← Back to home</a>
      </section>
    </main>
  );
}
