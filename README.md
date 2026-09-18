# topmeup

topmeup is a responsive request journey for South African prepaid electricity topups. The live implementation is the Next.js app; `index.html` remains a dependency-free browser prototype of the same flow.

## Run it

Open [index.html](index.html) in a browser. No build step or environment variables are required for this prototype.

## Implemented

- Responsive trust-first landing page for South African prepaid electricity topups
- Mock meter verification for 11 digit meter numbers
- Verified address and POPIA consent capture state
- Shareable 24-hour `topmeup.io` request link with copy, WhatsApp, email, and native share actions
- Contact form that opens a prefilled email to `hello@topmeup.io`
- About page with the topmeup purpose and founder story
- Legal page with Privacy Policy and Terms of Service
- Social links for Facebook, Instagram, X, and TikTok
- South African phone formatting in the `+27 00 000 0000` format
- Service selector and supporting trust/how-it-works sections
- No advertising scripts or tracking calls
- Server-backed scrypt authentication with signed HTTP-only sessions
- Durable JSON persistence for local and single-instance deployments
- Paystack initialization and signed webhook endpoints
- RAVASVend SOAP meter lookup and vending adapter
- Authorized expiry-job endpoint

## Implementation plan status

- Complete: responsive landing page and reference states for meter entry, verification, link creation, sharing, contact, trust, and expiry countdown
- Complete: server-owned request creation through `/api/requests`
- Complete: About, Legal, and social navigation routes
- Complete: authentication, Paystack checkout boundary, RAVASVend adapter, durable local persistence, and expiry-job boundary
- Pending: confirm the exact RAVASVend operation/namespace fields from the vendor PDF and configure production credentials
- Pending: deploy a shared database/worker, configure WhatsApp/email providers, and run production UAT

The provider adapters are environment-backed. The RAVASVend specification PDF was not available in the repository, so operation names default to `MeterLookup` and `Vend` and can be overridden with environment variables. The JSON store is a deployment-safe local fallback, not a replacement for Postgres in a multi-instance deployment.