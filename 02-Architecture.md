# 02 - Architecture - topmeup.io

## High-Level Architecture

```
[Client] -> CDN (Cloudflare) -> [Frontend / Next.js @ Vercel or SvelteKit]
  -> API Gateway (Load Balancer + WAF)
    -> Backend Service (Node.js / NestJS) -> [PostgreSQL] [Redis]
    -> Electricity API Adapter (Microservice)
    -> Payment Service (Stripe SDK + Webhooks)
    -> ShortLink Service + QR
    -> Notification Service (SMS/Email)
    -> Receipt Service (PDF)
    -> Logging / Audit Service (append-only)
    -> Admin Service
```

## Stack Recommendation (Trust & Speed)

**Frontend:**
- Next.js 14 App Router (React) OR Nuxt 3 for SEO
- TypeScript, TailwindCSS, shadcn/ui, Framer Motion for welcoming micro-interactions
- hosted on Vercel / Cloudflare Pages
- PWA capable for low data environments in SA

**Backend:**
- NestJS (Node) + TypeScript (modular)
- REST + tRPC / OpenAPI for electricity API abstraction
- Prisma ORM

**Database:**
- PostgreSQL 15 (Primary)
- Redis (cache, rate limit, short link counters, session, job queue via BullMQ)

**Infra:**
- Docker + Kubernetes (or Fly.io / Render for MVP)
- S3-compatible storage (Receipts PDFs)
- Sentry for errors, PostHog for analytics (privacy respecting)
- Cloudflare WAF + DDoS + Bot protection

## Service Boundaries

### 1. Meter Lookup Service
- Interface to Electricity Vendor API. Adapter pattern to support multiple providers.
- Circuit breaker (opossum) + retry with backoff.
- No meter storage in plain? We encrypt meter number.

### 2. Auth Service
- Email + Password + JWT (httpOnly cookies)
- OTP via SMS (Twilio / Africa's Talking)
- OAuth (Google) optional but recommended for trust.
- Roles: USER, ADMIN

### 3. Request & ShortLink Service
- Generates short code via nanoid (Base58, collision resistance).
- TTL index in Redis + Postgres.
- 24h expiry enforced at lookup.

### 4. Payment Service
- Creates Stripe Checkout Sessions.
- Webhooks handling: `checkout.session.completed`, `payment_intent.succeeded`, `failed`.
- Idempotency keys for Stripe + electricity API.

### 5. Token Generation Orchestrator
- After payment success, call Electricity API.
- Encrypt token at rest (AES-256-GCM).
- Decrypt only for authorized views (request owner + successful donor view limited time).

### 6. Notification & Share
- WhatsApp share uses wa.me link
- Social intent URIs, Navigator.share API
- SMS fallback via Africa's Talking for token delivery

## Data Flow - Donation

1. POST /api/short/{code}/checkout -> validate code -> create donation draft
2. Return stripeClientSecret / checkout URL
3. Client redirects
4. Stripe webhook -> verify signature -> create Fulfillment PENDING
5. Background job: call Electricity API
6. Success -> update fulfillment, emit events, send notifications
7. Failure -> retry 3x, then mark failed, trigger admin alert + auto-refund if policy says.

## Security Layering

- TLS 1.3 everywhere, HSTS.
- Cloudflare Turnstile CAPTCHA on meter lookup.
- Rate limiting per IP + per meter.
- All PII encrypted at rest + TLS in transit.
- Stripe.js only - PCI DSS SAQ A level (lowest scope).

## Multi-Tenancy & Monetization Consideration
- Future: take small service fee (e.g., R5 + 3%) on donation.
- Ad slots injection via component, lazy loaded, no tracking beyond POPIA consent.

## Scalability
- Stateless backend, horizontal scale.
- Redis for short link hot path.
- CDN for static + receipt PDFs signed URLs.

## Observability
- Structured JSON logs
- OpenTelemetry traces
- Audit table immutable (append-only, hash chained for tamper detection)

## Compliance Region
- Host in ZA / EU (AWS Cape Town af-south-1 or similar) for POPIA data residency.
- Backups encrypted, retained 30 days.
