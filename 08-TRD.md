# 08 - TRD - Technical Requirements Document - topmeup.me

## 1. System Overview
Platform connects Electricity Vendor API + Stripe to deliver prepaid tokens.

## 2. Tech Stack Decisions

- **Frontend:** Next.js 14.2, React 18, TypeScript 5.4, Tailwind 3.4, Radix/shadcn, Zustand for state, React-Query for server state, Turnstile CAPTCHA, Stripe.js v3.
- **Backend:** NestJS 10, Node 20 LTS, TypeScript, Zod validation, Prisma 5, BullMQ (Redis) for jobs, Winston logger.
- **DB:** Postgres 15 (Supabase/Railway), Redis 7, S3 (AWS / Cloudflare R2) for receipts
- **Infra:** Docker, CI GitHub Actions, Host: Fly.io / AWS ECS in af-south-1 (Cape Town). Cloudflare DNS+WAF+Cache.
- **Monitoring:** Sentry, OpenTelemetry, Grafana Loki.

Why Next.js? SEO for "donate electricity South Africa", server components for fast TTFB, embedded API routes optional but separate Nest for scalability.

Why NestJS? Modular, built-in guards, interceptors for audit, swagger auto-gen.

## 3. Authentication & Authorization

- JWT: access 15m, refresh 7d stored in httpOnly secure SameSite=Lax cookie, CSRF protection via double-submit.
- Password: Argon2id, pepper + salt.
- MFA for Admin: TOTP (Speakeasy).
- Roles: USER, ADMIN enforced via @Roles decorator.
- POPIA: consent boolean + timestamp + IP captured.

## 4. Encryption & Key Management

- App-level encryption for PII: AES-256-GCM, key stored in Vault (env `ENCRYPTION_KEY`, rotation support via keyId prefix)
  Implementation:
  ```
  encrypted = keyId + ":" + iv:authTag:ciphertext base64
  ```
- Hash for search: HMAC SHA256 with `HASH_PEPPER` (irreversible)
- Token encryption same but separate key `TOKEN_ENCRYPTION_KEY`
- TLS 1.3, HSTS 1 year, CSP: script-src self https://js.stripe.com https://challenges.cloudflare.com; frame-src https://js.stripe.com https://hooks.stripe.com
- Secrets in Dopplar / Fly secrets, never in repo.

## 5. API Specifications Detailed

See Backend-Schema doc for full routes. Additional technical details:

- All POST body validated with Zod.
- Pagination: cursor based for large tables (take=20)
- Rate limit middleware: using Redis Sliding Window:
  - `meter.lookup` 5 req/min per IP, 20/min per meterHash globally
  - `auth.signin` 5/min IP + account
  - `short.resolve` 60/min IP
  - `checkout.create` 10/min per shortCode
- CAPTCHA: Cloudflare Turnstile token verification server side before lookup.

## 6. Electricity API Integration Technical

Provider config via env:
```
ELECTRICITY_PROVIDER=mock|citiq|easypay
ELECTRICITY_BASE_URL=
ELECTRICITY_API_KEY=
ELECTRICITY_MTLS_CERT_PATH=
```

- Adapter pattern: `ElectricityProviderFactory` returns concrete class.
- Timeout + Retry: Axios instance timeout 8s lookup/15s purchase, retry 2 times with exponential backoff 100ms*2^n, circuit breaker threshold 5 failures/1min -> open 30s.
- Idempotency: Purchase ref = `FUL-${fulfillmentId}` ensures no double purchase if webhook retried.
- Mock provider for local dev returns fake address + token generation deterministic: token = pseudo-random 20 digits based on meter+amount hash.
- Logging: all external calls logged sanitised (no meter in plain in logs? log hash only)
- Error mapping: Vendor errors mapped to our error codes.

## 7. Stripe Integration Technical

- SDK stripe-node latest.
- Checkout Session creation idempotencyKey = donationId
- Metadata size limit check.
- Webhook endpoint: raw body needed (NestJS rawBody middleware), verify `stripe.webhooks.constructEvent(payload, sig, secret)`
- Store eventId uniqueness to prevent replay.
- On succeeded: BullMQ job `generate-token` with attempts 5, backoff 5s, 30s, 2m, 5m, 10m
- On failed payment: update fulfillment status, notify admin if >10 failures/min (potential fraud)
- Refund: admin action calls `stripe.refunds.create({payment_intent})`

## 8. ShortLink Technical

- Generation: custom nanoid `0123456789ABCDEFGHJKLMNPQRSTUVWXYZ...` exclude confusing chars, length 10.
- Collision check: try insert, on unique violation regenerate (rare).
- Redis: SET `shortlink:${code}` EX 86400 + random jitter 0-300s NX with JSON.
- Cron: `*/1 * * * *` marks expired Requests/ShortLinks (WHERE expires_at < NOW AND status=ACTIVE)
- No reuse of code.

## 9. Performance Budgets

- Frontend bundle: <150KB initial JS, <50KB CSS
- Images: WebP, lazy
- API P95: lookup cached 50ms, uncached 800ms; short resolve cached 20ms; checkout session 400ms
- DB query timeout 3s
- Use Prisma `select` to avoid overfetch PII

## 10. Caching Strategy

- Redis cache meter lookup 10 min
- Short link cache until expiry (with invalidation on revoke)
- Stats last5 amounts cache 1 min per requestId
- Frontend React-Query staleTime 30s for checkout stats

## 11. Testing Strategy

- Unit: Jest for utils (masking, encryption, short code)
- Integration: Supertest for API routes with test DB (docker)
- E2E: Playwright - full journey with Stripe test cards + mock electricity
- Load: k6 script 100 VU hitting /s/{code}
- Security: OWASP ZAP baseline scan in CI, Snyk for deps

## 12. Deployment & DevOps

- Environments: dev, staging, prod
- Dockerfile multi-stage: builder -> runner (distroless)
- CI: lint, type-check, unit, build, Docker push to GHCR, deploy to Fly via flyctl
- Migration: Prisma migrate deploy on startup init container
- Rollback: blue/green via Fly, DB forward compatible
- Backup: pg_dump nightly + WAL to S3, test restore monthly
- Secrets rotation every 90 days documented

## 13. Observability

- Logs JSON with traceId (W3C), userId hash, action
- Metrics: Prom-client: http_request_duration, electricity_api_latency, token_generation_success_rate, stripe_webhook_lag
- Alerts: PagerDuty/Slack for high failure rates, 5xx >1%

## 14. Compliance Implementation

- Separate docs for POPIA: data inventory, retention schedule, breach playbook
- Data residency: ensure Postgres in af-south-1
- DSR (Data Subject Request) endpoint: POST /privacy/request {type: access/delete} -> ticket to admin

## 15. Third Party Services

- Cloudflare: DNS, WAF, Turnstile
- Stripe: Payments
- Electricity Provider: Prepaid API
- Resend: Transactional emails (receipts, notifications)
- Africa's Talking: SMS fallback
- S3/R2: Receipt PDFs
- AdSense: Ads (if enabled)

## 16. Failure Modes

- Electricity API down: queue retry, user sees "Processing - you'll receive token via SMS/email within 5 min", donor sees same
- Stripe webhook delayed: use checkout.session polling fallback for success page (poll fulfillment status every 3s for 30s)
- Redis down: fallback to DB for short resolve (degraded but functional)
- DB down: circuit open, show maintenance page

## 17. API Versioning

- URL /v1, future v2 via header negotiation, backward compat for at least 6 months.
