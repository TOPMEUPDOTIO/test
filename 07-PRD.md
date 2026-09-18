# 07 - PRD - Product Requirements Document - topmeup.me

## 1. Executive Summary

topmeup.me is a South Africa-focused electricity donation platform enabling anyone with a prepaid meter to request help via a shareable 24-hour link, and anyone globally to pay for their electricity via secure Stripe payments that instantly deliver a 20-digit prepaid token.

**Problem:** Energy poverty - millions run out of prepaid electricity, no easy way to ask for help dignity-preservingly.
**Solution:** Frictionless meter lookup -> authenticated request -> viral short link -> checkout -> instant token.

## 2. Goals & Success Metrics

**Primary Goal:** Make electricity asking/sharing as easy as sharing a contact.

**Metrics (90 days post MVP):**
- 5k meter lookups
- 1k donation links created
- 30% fulfillment rate (at least 1 donation per link)
- <2% token generation failure
- Avg time from request to fulfillment <6h
- NPS >50 (Trust score)
- 0 POPIA breaches, 0 PCI breaches

**Non-Goals MVP:**
- Not a full crowdfunding platform (no goal amounts, recurring)
- Not solving post-paid, only prepaid.
- Not a lending product.

## 3. Users & Personas

**Persona 1: Requestor - Thandi, 34, Silverton Pretoria**
- Prepaid meter 0123456789, runs out month-end, has smartphone, WhatsApp, small social network, needs R200 quickly, embarrassed to ask directly but comfortable sharing link. Needs dignity, speed, security.

**Persona 2: Donor - Jason, 28, Johannesburg, friend of Thandi**
- Sees WhatsApp status, wants to help quickly, worried if site is scam. Needs trust, proof of address, secure payment, immediate confirmation token went through.

**Persona 3: Donor Stranger - Corporate CSR**
- Wants to donate to random families, needs audit logs and receipts.

**Persona 4: Admin - topmeup team**
- Needs to monitor abuse, handle token failures, compliance.

## 4. User Stories (Must Have)

- As Thandi, I enter my meter number, see my address confirmed so I trust system validated me.
- As Thandi, I provide email/mobile and sign up quickly, so my link is tied to me and I can track.
- As Thandi, I get a short link topmeup.me/XXX that lasts 24h, copy + share via WhatsApp 5 icons, so I can spread fast.
- As Jason, clicking link I see meter masked, area, who requested (masked), expiry countdown, how many times others helped and last 5 amounts, so I trust it's real.
- As Jason, I choose R50/R100/R200/R500 and pay securely via Stripe, so I feel safe (no card stored on unknown site).
- As Jason, after payment I instantly see token number 2874-4079-3286-8241, units, amount, Copy + receipt, so I can send token to Thandi or system sends automatically.
- As Thandi, I dashboard view active links, fulfillment history, total received.
- As Admin, I See all requests and fulfillments, can retry failed token, revoke abusive link, view audit logs.

## 5. Scope - Functional Requirements

**F-1 Landing:**
- Input meter, CAPTCHA, lookup via Electricity API, rate limited.
- Ad slots top+bottom per sketches.

**F-2 Validation:**
- Display address, X clear button, email/phone inputs, Submit.

**F-3 Auth:**
- Signup/signin required before link creation. Password + Google OAuth. POPIA checkbox mandatory.

**F-4 Link Generation:**
- Generate unique 10-char code, store 24h TTL, QR optional.
- Share page with link + Copy + 5 share icons (WhatsApp priority).

**F-5 Checkout:**
- Public, no auth required, shows masked data, expiry, stats (count, last5)
- Amount selector default R200 as in sketch
- Creates Stripe Checkout Session

**F-6 Webhook & Token:**
- Stripe webhook verifies, calls Electricity API to generate 20-digit token
- Encrypt token at rest, create fulfillment record, generate receipt PDF

**F-7 Success Page:**
- Shows token, units, amount, Copy, Share, receipt download

**F-8 Dashboards:**
- Customer: list requests, fulfillments, profile, data download
- Admin: overview, all tables, audit, manual actions, MFA

**F-9 Ads:**
- Top + bottom banner slots per sketches, non-intrusive, collapsible if ad block.

**F-10 Logging:**
- All actions logged in AuditLog for both dashboards visibility (customer sees own, admin sees all).

## 6. Non-Functional Requirements

- Performance: P95 lookup <1.2s, checkout page load <2s on 3G, success page <1s.
- Availability: 99.5% MVP, 99.9% post.
- Security: POPIA + PCI-DSS SAQ A compliance, encrypted PII & tokens, TLS 1.3, WAF.
- Scalability: Handle 10k concurrent short link views if viral (Redis cache).
- Accessibility: WCAG 2.1 AA, keyboard nav, screen reader, high contrast.
- i18n: English MVP, structure for Zulu/Afrikaans.
- Browser: Chrome, Safari, Samsung Internet, Firefox latest 2 versions.

## 7. Design & UX Requirements

- Welcoming: Warm yellow primary, rounded 12px, soft shadows, friendly illustrations (lightbulb, house)
- Trust: Security badges (Stripe, SSL, POPIA), masked PII shown clearly, countdown urgency but not anxiety.
- Mobile-first: Drawings are portrait mobile pages, implement as responsive centered cards 360-640px.
- Ads: Labeled "Advertisement", clearly separated from core flow, never between amount and Pay.
- Copywriting: South African English, empathetic: "Keep the lights on", "Your donation becomes electricity in seconds"

## 8. Assumptions & Dependencies

- Electricity API sandbox exists and can lookup + generate tokens for test meters.
- Stripe available in ZAR, South African business verification possible.
- Short domain topmeup.me owned + configured.
- Africa's Talking or Twilio for SMS if needed.

## 9. Out of Scope MVP

- Recurring donations, goal-based crowdfunding, video stories, in-app chat, USSD, native app.

## 10. Open Questions

- Q: Should address be fully public or suburb only for donor privacy? -> MVP: suburb+city+postal only, street masked partially for public.
- Q: Allow anonymous request creation without phone? -> No, need at least email OR phone for audit.
- Q: Service fee? -> MVP free (absorb fees), disclose Stripe fee only.

## 11. Acceptance Criteria

- End-to-end test: enter valid meter (test) -> see address -> signup -> get short link -> open in incognito -> see checkout with stats -> pay with Stripe 4242 test card -> webhook -> token shown matches pattern 4x4 digits hyphenated, units >0, receipt PDF downloadable, dashboard shows fulfillment.
- Expired link shows friendly expired state.
- AuditLog contains entries for all steps.
- Lighthouse performance >90, accessibility >95.
