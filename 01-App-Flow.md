# 01 - App Flow - topmeup.me

## Primary Actor Journeys

### Journey A: Requestor - Create Donation Link (The Needy User)
```
[Anonymous] -> Landing Page (topmeup.me)
  -> Enters Meter Number (11 digits) + Click Arrow
  -> Validation: Call Electricity API /lookup
     -> If invalid: inline error "We couldn't find that meter. Check number"
     -> If valid: Show address card + reveal email/mobile inputs

  -> Enters Email + Mobile + Clicks Submit
  -> Auth Gate Check
     -> No session: Modal -> Sign Up / Sign In
         Sign Up: name, email, mobile, password, POPIA consent checkbox
         Sign In: email/phone + password + OTP option
     -> After auth success: POST /api/requests {meter, email, mobile}

  -> Backend:
     - Create Request record
     - Generate shortCode (nanoid 10 chars)
     - Set expiresAt = now+24h
     - Create ShortLink record
     - Log Event REQUEST_CREATED

  -> Frontend: Share Page
     Shows: meter (masked), full address, short URL topmeup.me/{code}
     Actions: [Copy], Share via WhatsApp, Facebook, X, Telegram, SMS
     Info: Link expires in 23:59:12 (live countdown)

  -> User Dashboard (/dashboard)
     Tabs: Active Links | Past Requests | Fulfillments received
     Each: meter, status, expiry, times fulfilled, total received
```

### Journey B: Donor - Fulfill via Short Link
```
[External Channel] -> Click topmeup.me/8IS242R8M41
  -> GET /s/{code}
  -> Backend resolves:
     - If expired: Show Expired page + CTA to request new link
     - If valid: Fetch Request + aggregated stats

  -> Checkout Page Rendering:
     Header: Donate electricity to:
     Section 1: Meter 012***6789, Address: ** Southwest Street, Silverton, 0184
     Section 2: Request by: S****t (south.west@gmail.com) [privacy masked]
     Section 3: Trust Signals: Link expires in 04:21:10, Fulfilled 3 times before, Last 5: R100, R50, R200...
     Section 4: Amount Selector: Chips [R50][R100][R200][R500][Custom]
     CTA: [Pay Securely with Card]

  -> Donor clicks Pay
  -> Frontend creates Stripe Checkout Session: POST /api/donations/create-checkout {shortCode, amount}
  -> Redirect to Stripe Hosted Checkout (PCI-DSS offloaded)
  -> Donor completes payment

  -> Webhooks (Stripe -> Backend):
     payment_intent.succeeded
        - Verify amount
        - Call Electricity API generateToken(meter, amount)
        - If electricity API fails: mark for retry + alert admin, refund if needed
        - Create Fulfillment record {token (encrypted), units, amount, stripeId}
        - Increment request.fulfillmentCount
        - Generate Receipt PDF
        - Log Event TOKEN_GENERATED

  -> Return URLs:
     Success: /transaction/success?session_id={id}
     Shows Token Page: "Your prepaid electricity donation for meter 0123456789 was successful. Token: 2874-4079-3286-8241 Units: 98.00 Amount R200.00"
     Actions: [Copy Token], Share Success (optional)

  -> Canceled: /checkout/canceled -> back to checkout

  -> Donor also receives email receipt if email collected (optional guest checkout)
```

### Journey C: Customer Dashboard
```
Login -> /dashboard
  Stats: Total Links Created, Total Value Received, Active Links
  List Requests:
    - Each row: Date, Meter masked, Short URL, Expiry Status badge (Active/Expired), Fulfilled count, Total R, Actions: View, Copy, Extend (if <24h rule allows one extension), Revoke
  Click Request -> Detail:
    - Timeline log
    - Fulfillments table: date, amount, units, token (masked until owner clicks reveal), donor (anonymous if not provided)
```

### Journey D: Admin Dashboard
```
Login (Role ADMIN) -> /admin
  Security: MFA enforced
  Modules:
    - Overview KPIs: Total Requests, Total Fulfillment Value, Success Rate, Failed Token Gen
    - All Requests Table: filter by status, date, meter, searchable
    - Fulfillments Table:all transactions, Stripe ID, electricity API response, receipt link
    - Short Links Manager: expiry override, revoke
    - Logs/Audit: Immutable log of every action (REQUEST_CREATED, TOKEN_GENERATED, PAYMENT_FAILED)
    - Users Manager: view customers, suspend
    - Ad Manager: configure AdSense slots
    - Support: re-send token via SMS/email
```

### Alternate & Edge Flows
- Expired Link: Show form to requestor to renew if they are owner (login match) else show generic expired with CTA to home.
- Invalid Meter Repeat: After 3 fails, rate limit + CAPTCHA.
- Payment amount below minimum (e.g., Electricity API min R30): validation.
- Electricity API down: queue job with exponential backoff, notify donor "Token processing, you'll receive via SMS/email shortly".
- POPIA deletion request: Data subject can request deletion, admin fulfills.

### State Diagram Summary
- Request States: DRAFT -> ACTIVE (link alive) -> EXPIRED | REVOKED
- Fulfillment States: PENDING_PAYMENT -> PAYMENT_SUCCEEDED -> TOKEN_REQUESTED -> TOKEN_ISSUED | TOKEN_FAILED -> REFUND_INITIATED
- ShortLink States: ACTIVE -> EXPIRED / REVOKED / CONSUMED? (we keep multi-use, so remains ACTIVE until expiry)
