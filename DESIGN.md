# topmeup.io — Complete Design Specification

> This is the consolidated master doc linking all 11 required deliverables. Derived from 7 hand-drawn wireframes + requirements.

## Quick Navigation

| # | Document | File |
|---|----------|------|
| 0 | Overview | `00-Overview-Design.md` |
| 1 | App Flow | `01-App-Flow.md` |
| 2 | Architecture | `02-Architecture.md` |
| 3 | Backend Schema | `03-Backend-Schema.md` |
| 4 | Database | `04-Database.md` |
| 5 | Features | `05-Features.md` |
| 6 | Implementation Plan | `06-Implementation-Plan.md` |
| 7 | PRD | `07-PRD.md` |
| 8 | TRD | `08-TRD.md` |
| 9 | UI/UX Design Brief | `09-UIUX-Design-Brief.md` |
|10 | Security | `10-Security.md` |
|11 | App Flow Diagram | `11-App-Flow-Diagram.md` + `diagrams/app-flow-interactive.html` |

Open `diagrams/app-flow-interactive.html` in preview for visual Mermaid diagrams.

## Summary of Hand Drawings → Product

- **Input:** `Enter meter number ->` (arrow) — Landing CTA
- **Validation:** shows `0123456789 X` + `00 Southwest street Silverton Pretoria 0184` + `Enter email address` + `Enter mobile number` + `Submit` — Post lookup owner capture
- **Share:** `topmeup.io/8IS242R8M41` or `/81524ZR8M41` + `Copy` + `Share ⊗ ⊗ ⊗ ⊗ ⊗` — 24h Temporary Short URL Page
- **Checkout:** `Donate electricity to: meter number 0123456789, 00 Southwest street... South.west@gmail.com +27 00 000 0000 + Amount R200.00 Pay` — Public Donor Page via short URL showing requestor info, expiry, fulfillment history
- **Success:** `Your prepaid electricity donation for meter number 0123456789 was successful. The token number is: 2874-4079-3286-8241 number of units: 98.00 Token amount: R200.00` — Receipt page with Copy + Share
- **Global:** `topmeup.io` logo/header, nav `About Services Contact Us Checkout Transaction Successful`, `Ads` top/bottom/sidebar placeholders.

## Core User Journey (Happy Path)

1. Anonymous lands → enters meter → electricity API lookup → address shown
2. Enters email/mobile → forced Sign Up / Sign In (POPIA consent)
3. Backend creates Request + ShortLink `topmeup.io/{10char}` expires 24h → Share page with Copy + WhatsApp etc
4. Donor clicks link → checkout shows masked meter, address, requestor masked, countdown, fulfillment count, last 5 amounts, amount selector, Pay
5. Stripe secure checkout → webhook → electricity API generates 20-digit token → fulfillment stored encrypted → receipt PDF
6. Success page shows token groups 2874-4079-3286-8241, units, amount → donor can copy, requestor notified via email/SMS
7. Both dashboards log everything: customer sees own, admin sees all with audit log

## Tech Decisions

- Frontend Next.js + Tailwind, Backend NestJS + Prisma + Postgres + Redis + BullMQ
- Electricity API via adapter with circuit breaker, idempotency ref = fulfillmentId
- Stripe Hosted Checkout for PCI-DSS SAQ A (no raw card data)
- Short code base58 nanoid, Redis cache, cron expiry
- Encryption AES-256-GCM for PII + tokens, HMAC hash for search, KMS
- POPIA: consent log, DSR endpoints, anonymization, 5-year financial retention
- Ads: top/bottom banners, ethical, labeled, lazy
- Trust design: Blue #10375C + Yellow #FFB703, rounded 16px, Inter + Mono, shields, confetti

## Security Highlights

- TLS 1.3, HSTS, WAF Cloudflare, Turnstile CAPTCHA, rate limiting
- MFA for admin, JWT httpOnly, Argon2id
- Immutable audit log hash chained
- No PAN logging, CSP, SRI
- Host in af-south-1 for POPIA residency

## What to Build First

Week 1-3: Meter lookup + auth + short link
Week 4-6: Checkout + Stripe + token generation + success page
Week 7-8: Dashboards
Week 9: Security hardening + trust UI polish
Week 10: QA + launch

## Open Files in Preview

- `diagrams/app-flow-interactive.html` → clickable visual flow mapping sketches to final screens with Mermaid.
- Each md file is standalone deep dive.

---

**Author Note:** Sketches show South African context (Pretoria Sliverton 0184, +27 phone, R currency). Design respects that — language, phone formatting, R amounts, WhatsApp primary share. Welcoming tone “Keep lights on”, not pity.

Ready for design review → then Figma → then implementation.
