# 05 - Features - topmeup.me

## Feature Breakdown by Epic

### Epic 1: Meter Verification & Request Initiation

**F1.1 Meter Number Input**
- Input field with South African meter validation (10-11 digits), auto-formatting, paste support.
- Instant client-side format check + server-side lookup via Electricity API.
- States: idle, validating (spinner), valid (green tick + address slide down), invalid (red + help).
- UX from sketch: Enter meter number -> arrow button. On valid, show address card.
- Rate Limit + CAPTCHA after 3 fails.

**F1.2 Address Resolution Display**
- Show full address returned (street, suburb, city, postal) as per sketch: "00 Southwest street Silverton Pretoria 0184"
- Provide [X] clear button (as in sketch)
- Trust badge: "Meter verified by [Electricity Provider]"
- Masking not needed for requestor (full view), but masked for public page.

**F1.3 Contact Capture**
- Email + Mobile fields (as per sketch Page 2)
- Validation, E.164 phone, +27 auto prefix.
- POPIA consent: Checkbox "I consent to processing my meter & contact info to generate a donation link..."

**F1.4 Auth Gate**
- If not logged in, clicking Submit -> Sign In / Sign Up modal.
- Sign Up: Name, Email, Phone, Password strength meter, POPIA, Terms.
- Sign In: Email/phone + password, Forgot password, OTP login.
- Social: Google Sign-In (trust).
- After auth, auto-continue to create Request.

### Epic 2: Shareable Short Link Campaign

**F2.1 Short URL Generation**
- 10-char Base58 code, example `8IS242R8M41` or `81524ZR8M41` (from sketches)
- URL pattern: `topmeup.me/{code}` (branded short domain)
- QR Code generation for sharing print.
- TTL: 24 hours from creation, live countdown timer (HH:MM:SS) as required.

**F2.2 Share Interface**
- Display link in monospace copy field + [Copy] button (sketch)
- Share buttons: WhatsApp (primary in SA), Facebook, X (Twitter), Telegram, SMS, Email
- Uses Web Share API if available, fallback to intent URLs.
- Analytics: track copy, share clicks (privacy safe).

**F2.3 Campaign Status Page (Owner view)**
- Shows same info + expiry, fulfillment count.
- Actions: Extend (once), Revoke, View Dashboard.

### Epic 3: Public Donation Checkout

**F3.1 Checkout Landing (when donor clicks short URL)**
- Title: "Donate electricity to: meter number 0123456789"
- Details: Full address (maybe partial), requestor masked name/email/phone (e.g., South.west@gmail.com / +27 00 000 0000 from sketch -> show masked: S******t@gmail.com / *** *** 0000)
- Trust Panel: 
  - Time left before expiry: "Expires in 14h 02m"
  - "Fulfilled 3 times before"
  - "Last 5 donations: R100, R200, R50, R100, R250"
  - "Secure payment by Stripe"
  - POPIA & PCI-DSS badges
- Amount Selector: chips R50, R100, R200 (default highlighted as sketch), R500, Custom input
- Field: Donor email (optional for receipt) + anonymous checkbox
- CTA: [Pay Securely] -> Stripe Checkout

**F3.2 Stripe Payment**
- Redirect to Stripe Hosted Checkout (or embedded Elements for lower friction - choose Hosted for PCI scope reduction)
- Support: Card (Visa, Mastercard - dominant in SA), Apple Pay, Google Pay.
- Minimum R30, Maximum R5000
- Currency ZAR only initially.

**F3.3 Payment States**
- Success: immediate feedback + email/PDF
- Failure: friendly retry message, no token generated
- Cancel: returns to checkout with amount preserved

### Epic 4: Token Delivery & Receipt

**F4.1 Token Generation**
- On webhook success, call Electricity API `generateToken`
- Extract 20-digit token format `XXXX-XXXX-XXXX-XXXX-XXXX` (sketch shows 4 groups of 4: 2874-4079-3286-8241)
- Units: "Number of units: 98.00" (kWh)
- Amount: "Token amount: R200.00"

**F4.2 Transaction Success Page**
- Header: "Transaction Successful" (sketch) or "Your prepaid electricity donation..."
- Token display with [Copy] button
- Details: meter, units, amount
- [Share] icons (X5) - let donor share act of kindness? privacy consideration - optional anonymized share.
- Receipt download PDF button
- Ad slots top/bottom (non-intrusive, per sketch)

**F4.3 Receipt**
- PDF includes: topmeup.me logo, date, receipt no, meter masked, token (or instructions to view token), units, amount paid inclusive of fees, Stripe receipt ID, support contact.

### Epic 5: Dashboards

**F5.1 Customer Dashboard**
- Login required, route `/dashboard`
- Summary cards: Active Links, Total Received, Total Donated (if donor account)
- Table: Requests
  - Columns: Date Created, Meter (masked), Short URL (copy), Expires, Times Fulfilled, Total R, Status badge (green Active / grey Expired), Action View
- Detailed view: timeline, fulfillments list with decrypt reveal (audit logged)
- Notifications: email/SMS when fulfilled
- POPIA: download my data, delete account.

**F5.2 Admin Dashboard**
- Role ADMIN, MFA required
- Tables: All Requests (filter/search), All Fulfillments (with Stripe ID, token status)
- Logs: Immutable audit trail
- Metrics: Revenue, failed token rate, API latency
- Actions: Manual retry token, refund, revoke link, ban user, re-send token
- Ad Config: Toggle ad slots
- Support Tools: Lookup token by meter+date

### Epic 6: Ads & Monetization

**F6.1 Ad Slots**
- As per hand sketches: "Ads" blocks top + bottom (and maybe side). 
- Implement: Google AdSense or ethical ad network (Carbon)
- Lazy load, no layout shift, frequency capped
- Respect DNT / POPIA opt-out
- Never show ads on payment form fields (to keep trust)

**F6.2 Service Fee (Future)**
- Configurable: e.g., 5% capped at R15 to cover Stripe + electricity API fees + platform.
- Display transparently: "You pay R200, recipient gets R190 electricity + R10 covers fees"

### Epic 7: Trust, Security & Legal

**F7.1 Welcoming & Trust UX**
- Color palette: warm yellow (#FFC121) + deep trust blue (#102A43) + white + soft grey
- Copy tone: South African English, empathetic, not pitying. "Help keep the lights on"
- Icons: shield, lock, clock, heart
- Social proof: "1,243 families kept their lights on last month"
- No dark patterns.

**F7.2 POPIA Features**
- Consent logs, data minimization, right to be forgotten, breach notification template.

**F7.3 PCI-DSS Features**
- No card data touches our servers, Stripe.js only, CSP, HSTS.

### Epic 8: Cross-Cutting

- Multi-language: English initial, later Zulu, Afrikaans
- SMS Fallback: If email not reachable, token via SMS
- Low bandwidth: Light pages (<200KB JS), offline PWA for receipt view
- SEO: landing optimized for "donate electricity South Africa", "prepaid electricity help"

## MVP Cut vs V2

**MVP:**
- Meter lookup + address, email/phone capture, auth, short link 24h, checkout with Stripe, token generation, receipt, customer+admin dashboards, ads placeholder, POPIA basic.

**V2:**
- QR, extension, service fee, multiple electricity providers, referral program, recurring donations, native social story images, USSD *120* support, WhatsApp bot.

## Feature Toggles (via config)

- ENABLE_ADS
- ENABLE_SERVICE_FEE
- ENABLE_QR
- ENABLE_SMS_TOKEN_DELIVERY
- ELECTRICITY_PROVIDER
