# 03 - Backend Schema (API Contracts)

## REST API Design

Base URL: `https://api.topmeup.io/v1`

### Auth
```
POST /auth/signup
Body: { name, email, phone (+27), password, consentPOPIA: true }
Res: { user, accessToken (httpOnly cookie set), refreshToken }

POST /auth/signin
Body: { emailOrPhone, password }
Res: { user }

POST /auth/otp/request
Body: { phone }
POST /auth/otp/verify

POST /auth/refresh
POST /auth/logout

GET /auth/me
```
Auth: Bearer JWT or Cookie.

### Meter Service
```
POST /meters/lookup
Body: { meterNumber: string (11 digits) }
- Protected by CAPTCHA + RateLimit (5/min/IP)
Res: { valid: true, address: { street, suburb, city, postalCode, municipality, raw }, maskedMeter, meterType }

GET /meters/:meterHash/address? (if needed, requires auth)
```

### Requests (Donation Campaigns)
```
POST /requests
Auth required
Body: { meterNumber, contactEmail (optional override), contactPhone }
Res: { requestId, shortCode, shortUrl, expiresAt, meterMasked, address }

GET /requests
Auth USER
Query: ?status=active|expired&page=1
Res: { data: [ {id, meterMasked, shortUrl, expiresAt, fulfillmentCount, totalAmountReceived, address} ], meta }

GET /requests/:id
Auth USER (owner or ADMIN)
Res: { request + fulfillments (paginated, masked), stats: {last5Amts, count}, shortLink }

POST /requests/:id/extend (owner, max 1 extension of 24h, if within window)
POST /requests/:id/revoke

GET /s/:shortCode (public, no auth, but rate limited)
Res: {
  valid: true/false,
  expired: bool,
  expiresAt, expiresInSeconds,
  request: { meterMasked, addressMasked, requestorNameMasked, requestorMaskedEmail/Phone? },
  stats: { fulfillmentCount, last5Amounts: [200,100,...], totalDonated },
  allowedAmounts: [50,100,200,500],
  minAmount, maxAmount
}

If expired:
Res: { valid:false, reason:"EXPIRED", expiredAt }
```

### Donations (Payment Orchestration)
```
POST /donations/checkout-session
Body: { shortCode: string, amount: number (ZAR cents), donorEmail?: string, donorConsent?: bool }
Res: { checkoutUrl, sessionId, donationId }

GET /donations/:id (auth optional, token via session_id query for guest)
Res: { donation + receiptUrl, status }

POST /webhooks/stripe (public, Stripe signature verification)
Handles:
  checkout.session.completed
  payment_intent.succeeded
  payment_intent.payment_failed
Res: 200

POST /donations/:id/retry-token (Admin only)
```

### Tokens
```
GET /tokens/:fulfillmentId/reveal (Auth: owner of request or donor with valid session / admin)
Returns decrypted token once, logs access.
Res: { token: "2874-4079-3286-8241", units, amount, issuedAt }

GET /tokens/:fulfillmentId/receipt (PDF streaming, signed URL)
```

### Admin
```
GET /admin/overview
GET /admin/requests
GET /admin/fulfillments
GET /admin/users
GET /admin/logs?entityType=REQUEST...
POST /admin/shortlinks/:code/revoke
POST /admin/fulfillments/:id/refund
```

## Electricity Adapter API Contract (Internal)

Our backend calls external Electricity Vendor.

Configurable provider: `ELECTRICITY_PROVIDER=prepaid24 | citiq | custom`

Internal interface:
```ts
interface IElectricityProvider {
  lookup(meter: string): Promise<{
    valid: boolean,
    address: { street, suburb, city, postalCode },
    meterType: string,
    vendorCode: string
  }>
  purchase(meter: string, amountZAR: number, ref: string): Promise<{
    token: string, // 20 digits
    units: number,
    receiptNo: string,
    bonusUnits?: number,
    tariff: string
  }>
}
```

Timeouts: 8s lookup, 15s purchase. Idempotency via ref = donationId.

Requires mTLS + API Key (stored in Vault).

## Stripe Integration Details

- Mode: Payment (not subscription)
- Create Checkout Session:
```
params: {
  mode: 'payment',
  line_items: [{ price_data: { currency:'zar', product_data:{name:`Electricity donation for meter ${masked}`}, unit_amount: amountCents }, quantity:1 }],
  success_url: `${FRONTEND}/transaction/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${FRONTEND}/s/${shortCode}?canceled=1`,
  metadata: { shortCode, donationId, meterHash },
  customer_email (if provided),
  expires_at: 30 min from now
}
```
- Webhook idempotency: store stripeEventId unique.

## Error Handling Standard

Response format:
```json
{
  "success": false,
  "error": { "code": "METER_NOT_FOUND", "message": "We couldn't find that meter...", "details": {} }
}
```

Error codes:
- METER_INVALID_FORMAT, METER_NOT_FOUND, METER_LOOKUP_RATE_LIMIT
- AUTH_REQUIRED, AUTH_INVALID_CREDENTIALS, AUTH_POPIA_CONSENT_REQUIRED
- SHORTCODE_EXPIRED, SHORTCODE_NOT_FOUND, SHORTCODE_REVOKED
- PAYMENT_AMOUNT_TOO_LOW, PAYMENT_FAILED, TOKEN_GENERATION_FAILED
- POPIA_DELETION_PENDING

All sensitive endpoints log audit.

## Validation Rules
- meterNumber: regex `/^\d{11}$/` (example 0123456789 -> actually 10 in sketch, but SA meters are 11 digits, support 10-11)
- email: RFC, phone: E.164 +27...
- amount: min 30, max 5000 ZAR, increments allowed: integer.
