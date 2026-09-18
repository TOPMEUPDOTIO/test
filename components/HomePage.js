'use client';

import { useEffect, useState } from 'react';

const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const siteOrigin = 'https://topmeup.io';
const cleanMeter = (value) => value.replace(/\D/g, '').slice(0, 11);
const maskMeter = (value) => `${value.slice(0, 3)}***${value.slice(-4)}`;
const formatPhone = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('27')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  return `+27 ${digits.slice(0, 2)}${digits.length > 2 ? ` ${digits.slice(2, 5)}` : ''}${digits.length > 5 ? ` ${digits.slice(5)}` : ''}`.trim();
};
const normalizePhone = (value) => {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('27') ? digits.slice(2) : digits.replace(/^0/, '');
};

export default function HomePage() {
  const [meter, setMeter] = useState('');
  const [meterError, setMeterError] = useState('');
  const [verified, setVerified] = useState(false);
  const [shareReady, setShareReady] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [shareUrl, setShareUrl] = useState('topmeup.io/e/8IS242R8M4');
  const [countdown, setCountdown] = useState('23:59:59');
  const [toast, setToast] = useState('');
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [selectedService, setSelectedService] = useState('topup');
  const serviceTabs = [
    { id: 'topup', label: 'Topup', icon: '⚡', placeholder: 'Enter meter number' },
    { id: 'advance', label: 'Advance', icon: '＋', placeholder: 'Enter meter number' },
    { id: 'airtime', label: 'Airtime', icon: '◌', placeholder: 'Enter mobile number' },
    { id: 'data', label: 'Data', icon: '◒', placeholder: 'Enter mobile number' },
  ];

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(window.__topmeupToastTimer);
    window.__topmeupToastTimer = window.setTimeout(() => setToast(''), 3200);
  };

  const startCountdown = () => {
    let seconds = 24 * 60 * 60;
    const tick = () => {
      seconds -= 1;
      const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const remaining = String(seconds % 60).padStart(2, '0');
      setCountdown(`${hours}:${minutes}:${remaining}`);
      if (seconds <= 0) window.clearInterval(timerHandle);
    };

    window.clearInterval(window.__topmeupCountdownTimer);
    const timerHandle = window.setInterval(tick, 1000);
    window.__topmeupCountdownTimer = timerHandle;
    tick();
  };

  useEffect(() => () => window.clearInterval(window.__topmeupCountdownTimer), []);

  useEffect(() => {
    if (!meter || meter.length === 11 || verified) return undefined;

    const timer = window.setTimeout(() => {
      setMeterError('Invalid meter number, please make sure you enter 11 digits');
    }, 700);

    return () => window.clearTimeout(timer);
  }, [meter, verified]);

  const handleMeterChange = (event) => {
    const nextMeter = cleanMeter(event.target.value);
    setMeter(nextMeter);
    setMeterError('');
    if (nextMeter.length === 11) {
      setVerified(true);
    }
  };

  const handleCreateLink = async () => {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const phoneValid = /^\d{9}$/.test(normalizePhone(phone));

    if (!emailValid && !phoneValid) {
      showToast('Add an email address or a mobile number so we can deliver your link.');
      return;
    }

    if (!consent) {
      showToast('Please accept the POPIA privacy terms to continue.');
      return;
    }

    const code = makeCode();
    const finalUrl = `topmeup.io/e/${code}`;
    setShareUrl(finalUrl);
    setShareReady(true);
    setVerified(false);
    startCountdown();

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meter, email, phone, consent, code }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: 'Unable to create request.' }));
        throw new Error(payload.error || 'Unable to create request.');
      }
    } catch (error) {
      showToast(error.message || 'Unable to create request right now.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${siteOrigin}/e/${shareUrl.split('/e/')[1]}`);
      showToast('Your topup link is copied.');
    } catch {
      showToast('Select the link to copy it manually.');
    }
  };

  const handleShare = async (type) => {
    const url = `${siteOrigin}/e/${shareUrl.split('/e/')[1]}`;
    const message = 'I need a little electricity topup. You can help securely here: ';

    if (type === 'native' && navigator.share) {
      await navigator.share({ title: 'Help keep the lights on', text: message, url });
      return;
    }

    if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message + url)}`, '_blank', 'noopener');
      return;
    }

    if (type === 'email') {
      window.location.href = `mailto:?subject=${encodeURIComponent('Help keep the lights on')}&body=${encodeURIComponent(message + url)}`;
      return;
    }

    if (type === 'native' && !navigator.share) {
      showToast('Link sharing is available from your device share menu.');
    }
  };

  const handleContactSubmit = (event) => {
    event.preventDefault();
    const subject = `Topmeup contact from ${contact.name || 'a visitor'}`;
    const body = `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`;
    window.location.href = `mailto:hello@topmeup.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const resetFlow = () => {
    setShareReady(false);
    setVerified(false);
    setMeter('');
    setEmail('');
    setPhone('');
    setConsent(false);
    setMeterError('');
    setCountdown('23:59:59');
  };

  return (
    <>
      <div className="page-shell">
        <header className="site-header">
          <a className="brand" href="#top" aria-label="topmeup home">
            <span className="brand-mark" aria-hidden="true">↗</span>
                <span>topmeup</span>
          </a>
          <nav className="main-nav" aria-label="Main navigation">
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <a href="#trust">Trust &amp; safety</a>
            <a href="/about">About</a>
            <a href="/legal">Legal</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-actions"><a className="sign-in-link" href="/auth/sign-in">Sign in</a><a className="sign-in-button" href="/auth/sign-up">Get started</a></div>
        </header>

        <main id="top">
          <section className="hero-section" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-pulse"></span> Electricity help, without the awkwardness</p>
              <h1 id="hero-title">Keep the lights on.<br /><em>Powered by helpers.</em></h1>
              <p className="hero-intro">Top up electricity, bridge an advance, or keep someone connected with a secure request that is easy to share.</p>
              <div className="hero-proof" aria-label="Service highlights">
                <span><strong>24h</strong> shareable links</span>
                <span><strong>R</strong> transparent pricing</span>
                <span><strong>0</strong> ads, ever</span>
              </div>
            </div>

            <div className="lookup-card" id="lookup-card">
              <div className="service-tabs" role="tablist" aria-label="topmeup services">
                {serviceTabs.map((service) => <button key={service.id} className={selectedService === service.id ? 'service-tab is-active' : 'service-tab'} type="button" role="tab" aria-selected={selectedService === service.id} onClick={() => setSelectedService(service.id)}><span>{service.icon}</span>{service.label}</button>)}
              </div>
              {selectedService === 'advance' && <div className="service-callout"><strong>Advance</strong> — borrow up to <strong>R100</strong>, repay within <strong>30 days</strong> from your next topup.</div>}
              {selectedService !== 'topup' && <div className="service-mode-note">This demo keeps the same verified recipient flow while we connect the {selectedService} provider.</div>}
              <div className="card-heading">
                <div>
                  <p className="section-kicker">Start with your meter</p>
                  <h2>Get a topup link</h2>
                </div>
                <span className="secure-seal" title="Your details are encrypted">⌁</span>
              </div>
              <p className="card-description">We verify your meter first, then show you the address before anything is created.</p>

              {!shareReady && !verified && (
                <form id="meter-form" noValidate>
                  <label className="field-label" htmlFor="meter-number">Prepaid meter number</label>
                  <div className="input-row">
                    <input
                      id="meter-number"
                      name="meter"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={11}
                      placeholder={serviceTabs.find((service) => service.id === selectedService)?.placeholder}
                      aria-describedby="meter-error"
                      value={meter}
                      onChange={handleMeterChange}
                      disabled={verified}
                    />
                  </div>
                  <p className="field-error" id="meter-error" role="alert">{meterError}</p>
                </form>
              )}

              {verified && (
                <div className="verified-panel" id="verified-panel">
                  <div className="verified-title"><span className="check-icon">✓</span><span>Meter verified</span></div>
                  <p className="verified-address">00 Southwest Street<br /><strong>Silverton, Pretoria 0184</strong></p>
                  <div className="address-note"><span>⌖</span> Address confirmed by our electricity partner</div>
                  <div className="contact-fields">
                    <label className="field-label" htmlFor="email">Where should we send your link?</label>
                    <input id="email" type="email" placeholder="Email address" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                    <input id="phone" type="tel" placeholder="+27 00 000 0000" autoComplete="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} />
                  </div>
                  <label className="consent-row"><input id="consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to the <a href="#privacy">POPIA privacy terms</a> so topmeup can create and deliver my request.</span></label>
                  <button className="primary-action" id="create-link" type="button" onClick={handleCreateLink}>Create my shareable link <span>↗</span></button>
                  <p className="form-note">No card details needed to create a request.</p>
                </div>
              )}

              {shareReady && (
                <div className="share-panel" id="share-panel">
                  <div className="success-heading"><span className="check-icon">✓</span><div><p className="section-kicker">Your link is ready</p><h2>Share a little light</h2></div></div>
                  <p className="share-address">Meter <span id="share-meter">{maskMeter(meter)}</span> · Silverton, Pretoria</p>
                  <div className="share-link-box"><a href={`/e/${shareUrl.split('/e/')[1]}`}><code id="share-url">{shareUrl}</code></a><button id="copy-link" type="button" aria-label="Copy link" onClick={handleCopy}>Copy</button></div>
                  <div className="share-actions"><button type="button" onClick={() => handleShare('whatsapp')}>WhatsApp</button><button type="button" onClick={() => handleShare('native')}>Share via</button><button type="button" onClick={() => handleShare('email')}>Email</button></div>
                  <div className="countdown-row"><span>Link expires in</span><strong id="countdown">{countdown}</strong></div>
                  <button className="secondary-action" id="start-over" type="button" onClick={resetFlow}>Create another request</button>
                </div>
              )}
            </div>
          </section>

          <section className="services-section" id="services" aria-labelledby="services-title">
            <div className="section-intro"><p className="section-kicker">One place for everyday topups</p><h2 id="services-title">Choose what you need today.</h2></div>
            <div className="service-grid">
              <button className="service-card service-card-active" type="button" onClick={() => showToast('Electricity topup is ready to try.')}><span className="service-icon electricity">⚡</span><span><strong>Electricity topup</strong><small>Keep your home powered</small></span><span className="service-arrow">↗</span></button>
              <button className="service-card" type="button" onClick={() => showToast('Electricity advance is coming next.')}><span className="service-icon advance">＋</span><span><strong>Electricity advance</strong><small>Bridge the gap with care</small></span><span className="service-arrow">↗</span></button>
              <button className="service-card" type="button" onClick={() => showToast('Airtime topups are coming next.')}><span className="service-icon airtime">◌</span><span><strong>Airtime topup</strong><small>Stay connected to people</small></span><span className="service-arrow">↗</span></button>
              <button className="service-card" type="button" onClick={() => showToast('Data bundles are coming next.')}><span className="service-icon data">◒</span><span><strong>Data topup</strong><small>Keep life moving online</small></span><span className="service-arrow">↗</span></button>
            </div>
          </section>

          <section className="how-section" id="how-it-works" aria-labelledby="how-title">
            <div className="how-heading"><p className="section-kicker">Simple by design</p><h2 id="how-title">From empty meter to<br /><em>fuller day.</em></h2></div>
            <div className="steps"><div className="step"><span>01</span><h3>Verify your meter</h3><p>See your address confirmed before you share anything.</p></div><div className="step"><span>02</span><h3>Share your link</h3><p>Send it to the people who want to help. It lasts for 24 hours.</p></div><div className="step"><span>03</span><h3>Receive your token</h3><p>A secure payment becomes electricity, with a clear receipt.</p></div></div>
          </section>

          <section className="trust-section" id="trust" aria-labelledby="trust-title">
            <div className="trust-statement"><span className="large-mark">“</span><h2 id="trust-title">Designed for dignity.<br /><em>Built for trust.</em></h2><p>Your meter number is encrypted. Helpers see only what they need. There are no ads, hidden surprises or pressure.</p></div>
            <div className="trust-list"><div><span>01</span><strong>Transparent fees</strong><p>See exactly what arrives at the meter.</p></div><div><span>02</span><strong>Secure payments</strong><p>Payments are handled by Stripe.</p></div><div><span>03</span><strong>POPIA-minded</strong><p>Your information stays purpose-bound.</p></div></div>
          </section>

          <section className="contact-section" id="contact" aria-labelledby="contact-title">
            <div>
              <p className="section-kicker">We are here to help</p>
              <h2 id="contact-title">Contact topmeup.</h2>
              <p className="contact-intro">Have a question about a request or need a hand? Send us a message or email <a href="mailto:hello@topmeup.io">hello@topmeup.io</a>.</p>
            </div>
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <label className="field-label" htmlFor="contact-name">Name</label>
              <input id="contact-name" required value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} />
              <label className="field-label" htmlFor="contact-email">Email address</label>
              <input id="contact-email" type="email" required value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} />
              <label className="field-label" htmlFor="contact-message">How can we help?</label>
              <textarea id="contact-message" rows="4" required value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} />
              <button className="primary-action" type="submit">Email topmeup <span>↗</span></button>
            </form>
          </section>
        </main>

        <footer className="site-footer" id="privacy"><div className="footer-brand"><span className="brand-mark">↗</span><span>topmeup</span></div><p>Keep lights on, stay connected.</p><div className="footer-links"><a href="/about">About</a><a href="/legal#privacy-policy">Privacy</a><a href="/legal#terms-of-service">Terms</a><a href="mailto:hello@topmeup.io">hello@topmeup.io</a></div><div className="social-links" aria-label="Follow topmeup"><a href="https://www.facebook.com/topmeup" target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/topmeup" target="_blank" rel="noreferrer">Instagram</a><a href="https://x.com/topmeup" target="_blank" rel="noreferrer">X</a><a href="https://www.tiktok.com/@topmeup" target="_blank" rel="noreferrer">TikTok</a></div><small>© 2026 topmeup.io · No ads. Ever.</small></footer>
      </div>
      <div className={`toast ${toast ? 'is-visible' : ''}`} id="toast" role="status" aria-live="polite">{toast}</div>
    </>
  );
}
