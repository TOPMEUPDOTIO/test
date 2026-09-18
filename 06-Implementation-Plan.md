# 06 - Implementation Plan - topmeup.me

## Overview
10-week plan for MVP, team of 3: 1 Frontend, 1 Backend, 1 Product/QA + part-time designer. Assumes Electricity API sandbox available and Stripe test keys.

## Phase 0 - Foundation (Week 1)

**Goals:** Repo, CI/CD, Design System, Auth scaffold

Tasks:
- [ ] Monorepo setup (pnpm workspaces: web (Next.js), api (NestJS), shared types)
- [ ] Docker Compose local: postgres, redis, mailhog
- [ ] CI GitHub Actions: lint, test, build
- [ ] Design tokens: colors, typography, shadcn setup, logo, favicon, trust badges (SSL, POPIA, Stripe)
- [ ] Auth implementation: JWT httpOnly cookies, signup/signin, OTP stub, POPIA consent table
- [ ] Prisma initial schema + migration
- [ ] Sentry + PostHog + Cloudflare Turnstile keys
- [ ] Short code generator util (nanoid customAlphabet)

Deliverable: /auth/me works, landing static renders.

## Phase 1 - Meter Lookup & Request Creation (Week 2-3)

**Backend:**
- [ ] Electricity API Adapter: implement interface, mock provider + real sandbox, circuit breaker
- [ ] POST /meters/lookup with rate limit, CAPTCHA, cache 10 min in Redis (meterHash -> address)
- [ ] POST /requests + short link generation, expiry job (BullMQ cron every minute)
- [ ] GET /s/:code public resolver (Redis fast path)
- [ ] Audit log for REQUEST_CREATED

**Frontend:**
- [ ] Landing page: [Enter meter number ->] card exactly as sketch, loading states, error
- [ ] Valid state: address card + email/mobile inputs + Submit button
- [ ] Auth modal gate
- [ ] Share page: show short URL, copy, WhatsApp share buttons (5 icons)
- [ ] Countdown timer hook

QA:
- Test valid/invalid meters, 11-digit edge, remove spaces
- POPIA consent required validation

## Phase 2 - Checkout & Stripe (Week 4-5)

**Backend:**
- [ ] POST /donations/checkout-session: validate short code active, validate amount min/max, create Fulfillment PENDING_PAYMENT, create Stripe Checkout Session
- [ ] Stripe webhook endpoint with signature verification, idempotency via StripeEvent table
- [ ] Background worker: on payment succeeded -> call electricity API purchase
- [ ] Encryption helpers for token (AES-256-GCM with Vault key)
- [ ] Receipt PDF generator (PDFKit or Puppeteer) -> S3 upload + signed URL
- [ ] Masking utils: meter, email, phone, token
- [ ] Stats aggregation for checkout: fulfillmentCount, last5

**Frontend:**
- [ ] Checkout page layout per sketch: Donate electricity to: meter, address, amount selector R200.00 default, Pay button
- [ ] Trust panel: expiry timer, fulfillment count, last5 chips
- [ ] Integrate Stripe redirect (test mode)
- [ ] Loading overlay during redirect
- [ ] Cancel page handling ?canceled=1

Dependencies: Get Stripe approval for ZAR.

## Phase 3 - Transaction Success & Token Delivery (Week 6)

- [ ] Success page per sketch: "Your prepaid electricity donation for meter..." Token number 2874-4079-3286-8241, units, amount, Copy button, Share icons
- [ ] GET success page reads session_id -> fetch fulfillment
- [ ] Token reveal endpoint logs access
- [ ] Email receipt (if donor email captured): use Resend or SendGrid, template
- [ ] SMS fallback via Africa's Talking (optional MVP toggle)
- [ ] Ad slots component: top banner + bottom banner, loads after content to not block, AdSense test units

## Phase 4 - Dashboards (Week 7-8)

**Customer Dashboard:**
- [ ] /dashboard layout: header, stats cards, table of requests
- [ ] Request detail modal/timeline: list fulfillments, decrypt token on click (with audit)
- [ ] Actions: Copy link, Revoke, Extend (logic: allow 1 x 24h extension if owner and not expired >6h)
- [ ] Profile page: edit name, POPIA download data (JSON), delete account request

**Admin Dashboard:**
- [ ] Role guard + MFA
- [ ] Overview KPIs: cards + charts (Recharts)
- [ ] Tables: All Requests with filters, pagination server-side
- [ ] Fulfillments table: includes error column for TOKEN_FAILED
- [ ] Admin actions: retry token, refund via Stripe API, revoke link, view audit logs
- [ ] Logs viewer: immutable audit log search

## Phase 5 - Security, Compliance & Trust Polish (Week 9)

- [ ] POPIA docs: Privacy Policy, Terms, Consent log, Data Processing Agreement for Electricity API
- [ ] PCI-DSS: Ensure no raw card data, CSP headers, HSTS, SRI for Stripe.js, dependency audit (npm audit), Stripe SAQ A checklist documented.
- [ ] Encryption at rest: Postgres TDE? Application-level + KMS. Key rotation plan.
- [ ] Rate limiting everywhere: login 5/min, lookup 10/min/IP, checkout 10/min, short resolve 100/min/IP
- [ ] Validation: Zod schemas on all inputs
- [ ] Security headers: Helmet.js
- [ ] Penetration test (basic): OWASP ZAP scan, check XSS, SQLi via Prisma prevents.
- [ ] UI Trust: add testimonials, trust badges, language polish to be welcoming
- [ ] Performance: Lighthouse >95, bundle analyze, image optimize

## Phase 6 - QA, UAT & Launch (Week 10)

- [ ] E2E tests: Playwright covering both journeys A & B
- [ ] Load test: k6 for short link resolution (peak when viral on social)
- [ ] UAT with real meters (small pilot in Silverton Pretoria area)
- [ ] Staging deploy to af-south-1 (AWS) with real Electricity API sandbox, Stripe live test with small R amounts
- [ ] Go-live checklist: DNS topmeup.me, short domain same, SSL wildcard, Cloudflare WAF rules, backups test restore
- [ ] Marketing site: About, Services, Contact Us (as nav in sketches), FAQ
- [ ] Monitoring: UptimeRobot, Grafana dashboards, alerts for Token Failure rate >5%
- [ ] Launch: Soft launch to 100 users, iterate

## Risk Register & Mitigations

- **Electricity API instability:** Circuit breaker + retry queue + fallback to manual refund, SLA agreement.
- **Stripe CB in SA:** Some users lack cards - future add Ozow/EFT, MTN MoMo. MVP card only but mention.
- **Abuse / Fraud:** Rate limit, meter ownership check? For MVP allow any meter but log. V2 require proof of address.
- **POPIA breach:** Encryption + minimal data + consent logs + staff training + breach playbook (72h notification).
- **Expired token view:** Token once revealed is still valid for electricity, so exposure limited. But enforce short visibility window.

## Resource Estimates

- Infra: ~$100/mo MVP (Fly/Railway + Redis + Postgres + S3 + Cloudflare Pro)
- Stripe fees: standard 2.9% + R2 maybe, approx R5 per R200 donation.
- Electricity API fee: per token generation (vendor dependent)
- Dev effort: 10 weeks ~ 400 hrs.

## Future Roadmap after MVP

- Month 4: Add PayShap / Ozow instant EFT, MoMo
- Month 5: USSD *120* for non-smartphone requestors
- Month 6: Corporate CSR dashboard, bulk donations
- Month 7: Mobile apps (React Native), push notifications
