# 09 - UI/UX Design Brief - topmeup.me

## Brand Essence

**Name:** topmeup.me - playful, empathetic, action-oriented. "Top up me" = top up my electricity.

**Personality:** Warm, trustworthy, dignified, South African rooted, simple. Not charity-pity but community solidarity — "Ubuntu".

**Emotion Target:** Safe, hopeful, empowered. Requestor feels no shame; Donor feels confidence and impact immediacy.

## Design Principles (from sketches + security requirement)

1. **Trust First:** Every screen shows security signals — lock icon, Stripe badge, POPIA mention, SSL, verification checkmark.
2. **Clarity Over Cleverness:** Single task per page, giant inputs, huge touch targets, minimal fields.
3. **Dignity:** No begging imagery. Abstract illustrations, light bulbs, houses with warm lights.
4. **Mobile First:** Sketches are vertical narrow pages with centered cards. Design for 360px width first, then scale to desktop with ads rails.
5. **Welcoming:** Rounded corners 16px, soft shadows, warm gradient background (yellow to peach), blue CTAs that feel safe.
6. **Fast Feedback:** Instant validation, skeletons, success confetti on token page.

## Color System

- Primary: Trust Blue #10375C (buttons, links, header)
- Primary Dark: #0A2540
- Accent: Warm Solar Yellow #FFB703 / #FFC300 - used for highlights, empty states, illustrations
- Success: #06D6A0 (token success)
- Warning: #FF9F1C (expiry countdown <2h)
- Danger: #EF476F
- Neutrals: #F8F9FB background, #FFFFFF cards, #6C757D text muted, #212529 text primary
- Border: #E9ECEF
- Shadow: 0 8px 24px rgba(16,55,92,0.08)

Avoid: harsh reds for primary, pure black.

## Typography

- Headings: Inter / General Sans (geometric, friendly) 600-700, 24-32px on mobile
- Body: Inter 400 16px line 1.6
- Mono: JetBrains Mono for meter numbers & tokens & short URLs (important for copying correctly)

## Layout - Mapping to Sketches

**Global Shell (all pages):**
```
[Header 64px: Logo "topmeup.me" left, Nav About | Services | Contact Us + [Sign In] button right]
[Top Ad Banner 90px height, max-width 728, centered, labeled Ad - matches "Ads" block in sketches top]
[Main Center Card 640px max, white, shadow, 24px padding, rounded 16px]
[Bottom Ad Banner]
[Footer: ©, POPIA, Terms, Security, Contact]
On Desktop >1200px: Left + Right sticky Ad Rails (300x600) as per Side Ads in some sketches
```

**Page Breakdown:**

### 1. Landing - Meter Entry (Sketch 1)
- Hero: Headline "Ask for electricity donations via social media" (exact from sketch)
- Sub: "Enter your prepaid meter, get a shareable link, friends help you keep lights on. Secure & fast."
- Input: Large [Enter meter number ->] with arrow button inside. Placeholder 11 digits. Example helper: e.g. 0123456789
- Below: Trust row: [Lock] "POPIA Compliant" [Shield] "Verified Meters" [Stripe] "Secure Payments"
- Social proof: "1,243 lights kept on this month"
- State after typing: show clear X icon (as in sketches)

### 2. Address Confirmation + Contact Capture (Sketch 2-3)
- Input field shows meter number + X clear
- Card slides down: 
  - Checkmark: "Meter verified!"
  - Address block: 00 Southwest street, Silverton, Pretoria, 0184 (line broken)
  - Fields: "Enter email address" [input], "Enter mobile number" [input + +27 prefix]
  - Submit button primary large
- Microcopy: "We need this to send you the donation link and token receipts."

### 3. Share Page (Sketch 4 equivalent)
- Success check
- Fields: meter + address + email + phone stacked (readonly)
- Short URL box: `topmeup.me/8IS242R8M41` large mono, with [Copy] button (outlined)
- Share row: labeled "Share" + 5 icons: WhatsApp (green), Facebook (blue), X (black), Telegram, SMS (or generic link) - exactly as drawn with circle X placeholders -> implement proper icons
- Countdown pill: "Expires in 23:42:10"
- CTA: Go to Dashboard
- Tooltip on copy: "Copied!"

### 4. Checkout Page (Sketch 5-6)
- Title: "Checkout" or "Donate electricity to:"
- Left (or top): Donation details card:
  - Meter number 0123456789
  - Address
  - Possibly email/phone masked
- Right (or middle): Amount selector
  - Chips: R50 R100 R200 (selected state yellow border) R500 Custom
  - Input for custom
  - Amount header "Amount" with [R200.00] box as in sketch
- Stats panel: 
  - Clock icon "Expires in 4h 21m"
  - Heart "Fulfilled 3 times"
  - List "Last donations: R100, R200..."
-CTA: [Pay Securely - R200.00] blue large, Stripe badges below
- Ad slots top/bottom remain but not between amount and Pay.

### 5. Transaction Successful Page (Sketch 7 + 8)
- Big green check + confetti Lottie
- Title: "Transaction Successful" + "Your prepaid electricity donation for meter number 0123456789 was successful."
- Token box: dashed border, mono large `2874-4079-3286-8241`, [Copy] button
- Details: number of units: 98.00 kWh, Token amount: R200.00
- Share row again
- Buttons: Download Receipt PDF, Done
- Note: "Token also sent via SMS/email to requestor"

## Interaction & Micro-Interactions

- Meter lookup: button morphs to spinner -> success tick
- Countdown: live tick every second, turns orange when <2h, red <30m
- Copy: scale + checkmark, 2s feedback
- Amount chip: soft lift on hover/active
- Pay button: loading -> Stripe redirect
- Success token: typing animation revealing digits groups for delight

## Accessibility & Inclusivity

- Minimum 44px touch target
- Label for every input, aria-live for validation
- High contrast mode: test yellow on blue
- Low bandwidth: no auto video, optimized images
- Language toggle future but ensure English simple, avoiding jargon
- Error messages empathetic, not technical: not "METER_NOT_FOUND" but "We couldn't find that meter - please double-check the 11 digits on your meter box"

## Trust Signals UI Components

- Shield badge component: "Secured by Stripe • POPIA Compliant • Encrypted"
- Masking component: shows masked by default, reveal on click with icon
- Verification: verified meter shows green check + "Address confirmed"
- Testimonial carousel (optional) on landing bottom

## Ads UX

- Label clearly "Ad • Supports keeping topmeup.me free"
- Slots: top leaderboard 728x90 desktop / 320x100 mobile, bottom same, sidebar 300x600
- Close button? Not dismissible but not blocking content
- Loading skeleton for ad so CLS minimal
- Never place ad inside form flow (between submit and pay)

## Assets Needed

- Logo: simple, wordmark topmeup.me with light bulb dot on i or top up arrow
- Illustrations: empty state house with light off -> on, hands sharing light
- Icons: Line icons (Lucide)
- Lottie: success confetti, light bulb on
- Fav: light bulb

## Responsive Breakpoints

- Mobile: 360-480 (single column, ads stacked)
- Tablet: 768 (card wider, share icons wrap)
- Desktop: 1024+ (header nav full, ad rails visible)
- Large: 1440+ (centered max 1280)

## Design Deliverables Checklist (Figma)

- Components: Button (primary, secondary, ghost), Input, MeterInput, AddressCard, ShortUrlCard, AmountSelector, Countdown, TokenCard, ShareRow, AdSlot, Badge
- Screens: landing, validation, auth modal, share, checkout, success, expired, customer dashboard, admin dashboard, About/Services/Contact static pages
- Prototyping: flow from meter -> share -> checkout -> success
- Design tokens JSON export for Tailwind

## Voice & Copy Guidelines

- Avoid: "beg", "poor", "donation charity"
- Use: "top up", "keep the lights on", "help", "share power", "community"
- Example CTA: "Create my shareable link" not "Submit"
- Example checkout: "Send electricity to this home"
- Example success: "You just kept the lights on!"

## Final Checklist Before Dev Handoff

- All states empty/loading/error/success designed
- Mobile 360 tested
- POPIA consent copy legally reviewed
- Stripe brand guidelines followed
- Ad spaces have placeholder dimensions
