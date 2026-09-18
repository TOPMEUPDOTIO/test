# 10 - Security - POPIA + PCI-DSS + General - topmeup.me

## 1. Objective
Highest form of security for handling personal data (POPIA - Protection of Personal Information Act, South Africa) and payment data (PCI-DSS). Build trust.

## 2. POPIA Compliance (8 Conditions)

### 2.1 Accountability
- Appoint Information Officer (IO), registered with Information Regulator.
- Data protection policy, internal training, privacy by design.

### 2.2 Processing Limitation & Purpose Specific
- Collect only necessary: meter (needed), email OR phone (at least one), optional name.
- Purpose: generate shareable electricity donation link + fulfillment + audit.
- No further processing without consent (e.g., marketing opt-in separate).
- Retention: Requests active 24h + fulfilled history 5 years (financial law) then anonymize. PII encrypted.
- Minimal disclosure to Electricity API: only meter + amount + ref, not email/phone.

### 2.3 Further Processing Limitation
- Analytics anonymized (PostHog with IP masking, no PII).
- Ads: contextual, not behavioral using PII. Require cookie consent banner.

### 2.4 Information Quality
- Address validated via Electricity API (source of truth)
- Email verification optional but recommended (send verification link)
- Phone verification via OTP for high-risk actions.

### 2.5 Openness & Transparency
- Privacy Policy plain language (English, later Zulu/Afrikaans)
- What we collect, why, where stored (af-south-1), rights, contact of IO.
- Just-in-time notices on meter input, email fields.

### 2.6 Security Safeguards (Technical)

**At Rest:**
- Postgres data volume encryption (AES-XTS) + app-level field encryption for email, phone, meter, token.
- Keys managed in AWS KMS / Vault, rotation every 90 days.
- Backups encrypted.

**In Transit:**
- TLS 1.3 enforced, HSTS, certificate pinning for mobile future.
- mTLS for Electricity API calls.

**App:**
- Argon2id for passwords, salt + pepper.
- JWT httpOnly SameSite Strict, short lived.
- Rate limiting, CAPTCHA, WAF (Cloudflare managed rules).
- Input validation Zod, output encoding, no eval.
- Dependency scanning weekly.

**Access:**
- RBAC, principle least privilege.
- Admin MFA mandatory.
- Audit log immutable, append-only, hash chained, cannot be deleted even by admin.
- Staff access requires VPN + SSO.

### 2.7 Data Subject Rights
- Right to access: GET /privacy/data-download returns JSON of all data.
- Right to rectification: profile edit.
- Right to deletion: POST /privacy/delete-request -> triggers 30-day review, deletes PII but retains anonymized financial logs required by law, token history masked.
- Right to object: opt-out of marketing, ads personalization.
- Implementation: ticketing system for DSR, SLA 21 days.

### 2.8 Breach Notification
- Playbook: Detect via Sentry+Logs anomaly, contain, assess risk, notify Information Regulator within 72h if required, notify data subjects promptly.
- Logging breach attempts.

## 3. PCI-DSS Compliance

**Goal:** SAQ A (lowest scope) - no card data touches our servers.

**Measures:**
- Use Stripe Hosted Checkout OR Stripe Elements with Stripe.js directly to Stripe - card data goes directly to Stripe.
- Never log, store, or transmit PAN, CVV.
- Stripe.js loaded from `https://js.stripe.com` with SRI check + CSP.
- Implement Stripe webhook signature verification.
- Use Stripe's Radar fraud protection.
- Annual SAQ A self-assessment, keep AOC from Stripe.
- Network segmentation: payment frontend isolated, backend only handles session IDs, payment intents, not raw cards.
- Vuln management: npm audit, Dependabot, patch within 7 days critical.

**PCI-DSS 4.0 Requirements Mapping:**
- Req 1 Firewall: Cloudflare WAF + security groups only 443 inbound.
- Req 2 Defaults: No default creds, disable unused services.
- Req 4 Encryption transit: TLS 1.3.
- Req 6 Secure systems: Secure SDLC, code review.
- Req 8 Identify/Auth: Strong auth, MFA admin.
- Req 10 Logging: All access to payment flows logged (but not PAN).
- Req 11 Testing: Quarterly vuln scan, annual pen test.
- etc - documented in SAQ.

## 4. Additional Security Layers

### Application Security
- OWASP Top 10 mitigations:
  - Injection: Prisma ORM parametrized, Zod.
  - XSS: React escaping, CSP, no dangerouslySetInnerHTML.
  - Broken Auth: JWT rotation, refresh token reuse detection.
  - SSRF: Allowlist Electricity API, Stripe only.
  - IDOR: Check ownership on every request/fulfillment reveal.
  - CSRF: SameSite + double submit token for state-changing non-JSON? Use cookie + header token.

### Rate Limiting & Abuse
- IP + user + meter based sliding window via Redis.
- After 3 failed meter lookups require Turnstile.
- Donor checkout: limit 5 attempts per shortCode per 10 min to prevent card testing.
- Block TOR? Maybe allow but extra CAPTCHA.

### Fraud Prevention
- Velocity checks: same meter requesting >5 links per day flag.
- Donor behavior: Stripe Radar will catch card testing.
- Token replay: idempotency prevents double purchase same donationId.
- Admin manual review for high-value >R1000 donations.

### Infrastructure
- Docker images minimal distroless, non-root user.
- Secrets in env, not code.
- Cloudflare: Bot management, DDoS, rate limit rules.
- Backups: encrypted, tested restore, offsite.
- Uptime monitoring, disable directory listing, headers: X-Frame-Options DENY, X-Content-Type-Options nosniff.

### Data Masking (UI Requirement)
- Meter: Show 012***6789 public, full only to owner.
- Email: S****t@gmail.com public, full owner view.
- Phone: *** *** 0000 public.
- Token: Show masked unless explicit reveal click, logs audit.

## 5. Secure Development Lifecycle

- Threat modeling: STRIDE for each component (spoofing donor, tampering token, repudiation etc)
- Code review: 2 reviewers for auth/payment/token modules
- Secrets scanning pre-commit (git-secrets)
- SAST: Semgrep in CI
- DAST: ZAP baseline in staging
- Dependency: Snyk

## 6. Incident Response

- Runbooks for: Token not generated after payment, Stripe webhook down, Electricity API abuse, PII leak.
- On-call rotation.
- Communication templates.

## 7. Compliance Documents Checklist

- [ ] Privacy Policy (POPIA s18)
- [ ] PAIA Manual
- [ ] Cookie Policy + Consent Banner
- [ ] Terms of Service
- [ ] Data Processing Agreements with Electricity API & Stripe & hosting provider
- [ ] Record of Processing Activities (ROPA)
- [ ] Data breach response plan
- [ ] PCI-DSS SAQ A + Stripe's compliance docs attached
- [ ] Information Officer appointment letter

## 8. User-Facing Trust Features

- Footer badges: "POPIA Compliant", "Secured by Stripe", "SSL Encrypted"
- Lock icon near payment button
- "Your meter number is encrypted and never shared publicly"
- Link to security page explaining encryption, no card storage.

## 9. Audit & Certification Roadmap

- MVP: Self-assessment + legal review POPIA.
- Post-MVP: External pen test by CREST firm, POPIA audit by law firm.
- Annual: Recertify PCI SAQ, rotate keys, review ROPA.

## 10. Example Pseudocode - Secure Token Reveal
```ts
async function revealToken(user, fulfillmentId, ip) {
  // authz
  const fulfillment = await db.fulfillment.find(fId)
  const request = await db.request.find(fulfillment.requestId)
  if (!isOwner(user, request) && !isAdmin(user) && !hasValidDonorSession()) throw Forbidden

  // audit
  await auditLog.create({action: TOKEN_REVEALED, entityId: fId, actor: user.id, ip, metadata})

  // decrypt
  const token = decrypt(fulfillment.electricity_token_encrypted, keyId)
  return {token, units}
}
```
Never log token plain.

