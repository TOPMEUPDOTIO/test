# topmeup.io - Master Design Document

**Version:** 1.0  
**Date:** 2026-07-10  
**Status:** Design - Ready for Review  
**Location Context:** South Africa (POPIA, ZAR, Prepaid Meters)

## Concept in One Sentence
topmeup.io lets anyone who ran out of prepaid electricity create a secure, shareable donation link (24h short URL) for their meter, which friends, family or strangers can pay via Stripe to instantly generate a 20-digit prepaid token.

## Interpretation of Hand Drawings
From 6 wireframe pages analyzed:

**Page Type 1 - Landing / Meter Lookup**
- Layout: topmeup.io header (top right), About / Services / Contact Us nav, two Ad slots (top + bottom), center card: "Ask for electricity donations via social media" + [Enter meter number ->]
- Function: Anonymous meter validation entry point.

**Page Type 2 - Validation + Contact Capture**
- Same shell, center shows: meter number `0123456789 [X]`, address `00 Southwest street Silverton Pretoria 0184`, fields: Enter email address, Enter mobile number, [Submit]
- Function: After Electricity API lookup returns address, capture requestor identity. Gate to Auth.

**Page Type 3 - Share Link Generated**
- Center shows: meter, address, email `South.west@gmail.com`, phone `+27 00 000 0000`, short URL `topmeup.io/8IS242R8M41`, [Copy], [Share x5 icons]
- Function: After sign-in/up + request creation, show campaign link.

**Page Type 4 - Checkout / Donate**
- Page title "Checkout" + "Donate electricity to: meter number + address + email + phone + Amount R200.00 [Pay]"
- Function: Donor landing when opening short URL. Must also show expiry countdown, fulfillment count, last 5 amounts, who requested.

**Page Type 5 - Transaction Successful (Receipt)**
- Header "Transaction Successful"
- Body: "Your prepaid electricity donation for meter number 0123456789 was successful. The token number is: 2874-4079-3286-8241 number of units: 98.00 Token amount: R200.00" + [Copy] + Share
- Function: Post-payment token delivery + receipt + virality.

**Page Type 6 - Combined Flow (as drawn)**
- Split screen: top half = Checkout, bottom half = Transaction Successful, each with Ads sidebar.

**Global UI Pattern:** Ad slots left and right of content? In sketches Ads are labeled on left side vertical column, but in landscape reading they are top/bottom banners. We'll implement responsive: Header Nav, Center content card max-width 640px, Ads: top leaderboard + bottom + sticky side rails on desktop.

## Core APIs
1. **Electricity API** (e.g., Eskom / Utility provider / Third party like Prepaid24 / CitiQ)
   - `lookupMeter(meterNumber) -> { valid: bool, address: string, municipality, meterType }`
   - `generateToken(meterNumber, amount_R, ref) -> { token: "20-digit", units: float, receiptNo }`
2. **Stripe** - Payment gateway, PCI-DSS handled via hosted checkout / Elements, no raw card storage.

## Key Business Rules
- Meter must be validated before any account action.
- User must be authenticated (Sign-Up / Sign-In) to create a request link.
- Short code: 10-char base58 (e.g., 8IS242R8M41), unique, URL: topmeup.io/{code}, TTL 24h, extendable? Auto-expire.
- Checkout page shows: requestor display name (masked email/phone), expiry timer, fulfill count, last 5 fulfill amounts.
- Donor chooses amount (discrete chips R50/100/200/500 + custom), Stripe Checkout.
- On `payment_intent.succeeded` webhook, generate token via Electricity API. Never generate before payment.
- Receipt: PDF + on-screen, includes token, units, amount, date, meter (masked), Stripe receipt.
- All requests logged to both dashboards.
- Ads: Google AdSense / Ethical ads, non-intrusive, never near payment button.

## Trust & Welcoming Design Pillars
- Safety Blue + Warm Yellow, rounded corners, soft shadows.
- Micro-copy: "Secure", "POPIA Compliant", "Encrypted", "Your meter is safe"
- Real South African context: Town names, R currency, +27 phone format.
- Social proof on landing.

---
Documents in this folder detail each aspect.
