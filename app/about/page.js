const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/topmeup' },
  { label: 'Instagram', href: 'https://www.instagram.com/topmeup' },
  { label: 'X', href: 'https://x.com/topmeup' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@topmeup' },
];

export default function AboutPage() {
  return (
    <main className="content-page">
      <header className="content-header">
        <a className="brand" href="/" aria-label="topmeup home">
          <span className="brand-mark" aria-hidden="true">↗</span>
          <span>topmeup</span>
        </a>
        <nav className="content-nav" aria-label="Page navigation">
          <a href="/">Home</a>
          <a href="/legal">Legal</a>
          <a href="/#contact">Contact</a>
        </nav>
      </header>

      <section className="content-hero" aria-labelledby="about-title">
        <p className="eyebrow"><span className="eyebrow-pulse"></span> Our story</p>
        <h1 id="about-title">About <em>TopMeUp</em></h1>
        <p className="content-lede">Making it easier to ask for help, lend a hand, and keep people connected when the cost of living gets heavy.</p>
      </section>

      <div className="content-grid">
        <article className="content-section">
          <p className="section-kicker">Why we exist</p>
          <h2>Support should be easier to reach.</h2>
          <p>In a world where the cost of living continues to rise, TopMeUp is here to make it easier than ever for individuals to reach out for help and for others to lend a hand. We believe that no one should struggle alone, and with the power of social media and technology, we're creating a global community of support.</p>
        </article>

        <article className="content-section content-section-accent">
          <p className="section-kicker">Our purpose</p>
          <h2>A movement built on generosity.</h2>
          <p>TopMeUp is more than just a platform—it's a movement inspired by the timeless human spirit of generosity. From initiatives like Gift of the Givers to everyday acts of kindness, we know that people have always found ways to help one another. TopMeUp builds on this legacy by connecting those in need with those who can help, no matter where they are in the world.</p>
        </article>
      </div>

      <section className="founder-section" aria-labelledby="founder-title">
        <div>
          <p className="section-kicker">Meet the founder</p>
          <h2 id="founder-title">Mathemba Magwentshu</h2>
        </div>
        <p>TopMeUp was founded by Mathemba Magwentshu, a visionary who believes in the power of connection, generosity, and technology. His passion for helping others and his commitment to innovation drive everything we do at TopMeUp.</p>
      </section>

      <footer className="content-footer">
        <a className="footer-brand" href="/">topmeup</a>
        <div className="social-links" aria-label="Follow TopMeUp">
          {socialLinks.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>)}
        </div>
        <small>© 2026 topmeup.io</small>
      </footer>
    </main>
  );
}
