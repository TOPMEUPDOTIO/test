const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/topmeup' },
  { label: 'Instagram', href: 'https://www.instagram.com/topmeup' },
  { label: 'X', href: 'https://x.com/topmeup' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@topmeup' },
];

export default function LegalPage() {
  return (
    <main className="content-page legal-page">
      <header className="content-header">
        <a className="brand" href="/" aria-label="topmeup home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>topmeup</span>
        </a>
        <nav className="content-nav" aria-label="Page navigation">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/#contact">Contact</a>
        </nav>
      </header>

      <section className="content-hero" aria-labelledby="legal-title">
        <p className="eyebrow"><span className="eyebrow-pulse"></span> Your trust matters</p>
        <h1 id="legal-title">Legal</h1>
        <p className="content-lede">The policies and terms that guide how topmeup works.</p>
      </section>

      <div className="legal-document">
        <article className="legal-section" id="privacy-policy">
          <p className="section-kicker">Privacy Policy</p>
          <h2>Privacy Policy</h2>
          <p className="legal-date">Last updated: 9/18/2026</p>
          <h3>Introduction</h3>
          <p>At topmeup, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
          <h3>Information We Collect</h3>
          <p>We collect information that you provide directly to us, including:</p>
          <ul><li>Meter numbers</li><li>Email addresses</li><li>Mobile numbers</li><li>Transaction data</li></ul>
          <h3>How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul><li>Process your top-up requests</li><li>Generate and manage request links</li><li>Send you transaction confirmations</li><li>Send you notification when your voucher has been delivered</li><li>Provide customer support</li><li>Improve our services</li></ul>
          <h3>Data Security</h3>
          <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage.</p>
        </article>

        <article className="legal-section" id="terms-of-service">
          <p className="section-kicker">Terms of Service</p>
          <h2>Terms of Service</h2>
          <p className="legal-date">Last updated: 9/18/2026</p>
          <h3>1. Acceptance of Terms</h3>
          <p>By accessing and using topmeup's services, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          <h3>2. Service Description</h3>
          <p>topmeup provides a platform for users to request and receive top up vouchers through social media. Our service includes identifier verification, request link generation, and voucher delivery.</p>
          <h3>3. User Responsibilities</h3>
          <p>You agree to:</p>
          <ul><li>Provide accurate and complete information</li><li>Maintain the security of your account</li><li>Use the service only for lawful purposes</li><li>Not misuse or attempt to manipulate the service</li></ul>
          <h3>4. Requests and Payments</h3>
          <p>All requests are processed through secure payment gateways. Request links are valid for 24 hours from generation. We cannot guarantee that your request will receive funding.</p>
          <h3>5. Service Availability</h3>
          <p>While we strive to provide uninterrupted service, we cannot guarantee that the service will be available at all times. We reserve the right to modify or discontinue the service at any time.</p>
        </article>
      </div>

      <footer className="content-footer">
        <a className="footer-brand" href="/">topmeup</a>
        <div className="social-links" aria-label="Follow topmeup">
          {socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div>
        <small>© 2026 topmeup.io</small>
      </footer>
    </main>
  );
}
