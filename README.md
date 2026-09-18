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
- About page with the TopMeUp purpose and founder story
- Legal page with Privacy Policy and Terms of Service
- Social links for Facebook, Instagram, X, and TikTok
- South African phone formatting in the `+27 00 000 0000` format
- Service selector and supporting trust/how-it-works sections
- No advertising scripts or tracking calls

## Implementation plan status

- Complete: responsive landing page and reference states for meter entry, verification, link creation, sharing, contact, trust, and expiry countdown
- Complete: server-owned request creation through `/api/requests`
- Complete: About, Legal, and social navigation routes
- Pending: replace mock meter verification with the utility API
- Pending: add Clerk authentication, Stripe payment collection, token issuance, notifications, and durable storage

The external integrations (Clerk, Convex, Stripe, utility APIs, Resend, and OpenWA) are intentionally not faked in this slice.