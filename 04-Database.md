# 04 - Database Schema - topmeup.me

## ER Diagram (Conceptual)

```
User 1--* Request 1--1 ShortLink 1--* Fulfillment
User 1--* AuditLog
Request 1--* AuditLog
Fulfillment *--1 StripeEvent
```

## Technology: PostgreSQL 15 + Prisma

### Enums
```prisma
enum Role { USER ADMIN }
enum RequestStatus { ACTIVE EXPIRED REVOKED }
enum FulfillmentStatus { PENDING_PAYMENT PAYMENT_SUCCEEDED TOKEN_REQUESTED TOKEN_ISSUED TOKEN_FAILED REFUNDED CANCELED }
enum ShortLinkStatus { ACTIVE EXPIRED REVOKED }
enum AuditAction {
  USER_SIGNUP USER_SIGNIN
  REQUEST_CREATED REQUEST_EXPIRED REQUEST_REVOKED REQUEST_VIEWED REQUEST_EXTENDED
  SHORTLINK_RESOLVED SHORTLINK_EXPIRED_VIEW
  DONATION_CHECKOUT_CREATED PAYMENT_SUCCEEDED PAYMENT_FAILED
  TOKEN_GENERATED TOKEN_REVEALED TOKEN_FAILED
  RECEIPT_GENERATED
  ADMIN_ACTION
}
```

### Tables

**User**
```sql
id uuid PK
name varchar(120) -- nullable? required
email varchar(255) unique encrypted? + searchable hash
email_hash varchar(64) indexed unique
phone varchar(20) -- +27...
phone_encrypted text
phone_hash varchar(64) indexed
password_hash varchar(255) -- null if social login
role Role default USER
is_email_verified bool
is_phone_verified bool
popia_consent bool
popia_consented_at timestamp
last_login_at timestamp
created_at timestamp default now()
updated_at timestamp
deleted_at timestamp nullable (soft delete for POPIA retention policy)
mfa_enabled bool default false
mfa_secret_encrypted text nullable
```
- PII encryption: email + phone encrypted via pgcrypto or app-level AES-256-GCM with key rotation.
- Search uses hash (HMAC SHA256 with pepper).

**Request** (Campaign)
```sql
id uuid PK
user_id uuid FK -> User.id
meter_number_encrypted text -- encrypted 11 digits
meter_hash varchar(64) indexed -- HMAC for lookup, not reversible easily
meter_masked varchar(20) -- e.g., 012***6789
address_raw text -- from Electricity API, consider encryption but needed for display masked? Keep encrypted but cache masked version
address_jsonb jsonb -- { street, suburb, city, postalCode, raw }
status RequestStatus
contact_email_encrypted text nullable
contact_phone_encrypted text nullable
short_code varchar(32) unique FK
expires_at timestamp
fulfillment_count int default 0
total_amount_received numeric(10,2) default 0
last_fulfillment_at timestamp nullable
created_at timestamp
updated_at timestamp
metadata jsonb nullable
```
Index: user_id, expires_at, meter_hash, status

**ShortLink**
```sql
id uuid PK
code varchar(32) unique PK alternative (base58, 10 chars, e.g., 8IS242R8M41)
request_id uuid FK -> Request unique
status ShortLinkStatus
expires_at timestamp -- denormalized copy
created_at timestamp
last_resolved_at timestamp
resolve_count int default 0 -- counts page views
max_uses int nullable (optional infinite)
```
- Redis cache mirror: key `short:{code}` -> requestId + expiry
- TTL deletion job: runs every minute marking EXPIRED.

**Fulfillment** (Donation Transaction)
```sql
id uuid PK
request_id uuid FK
short_code varchar(32) indexed
stripe_session_id varchar(120) unique nullable
stripe_payment_intent_id varchar(120) unique nullable
stripe_event_id varchar(120) nullable
amount_zar numeric(10,2) -- R200.00
amount_cents int -- 20000
status FulfillmentStatus
electricity_token_encrypted text nullable -- encrypted
token_masked varchar(50) nullable -- e.g., 2874-****-****-8241
units numeric(10,2) nullable -- 98.00 kWh
tariff_info text nullable
receipt_no varchar(100) nullable (from electricity API)
receipt_pdf_url text nullable (S3)
error_message text nullable -- if token generation failed
donor_email_encrypted text nullable
donor_email_masked varchar(120) nullable
idempotency_key varchar(120) unique -- donationId
created_at timestamp
updated_at timestamp
token_issued_at timestamp nullable
```
Encryption: token encrypted at rest. Decrypt key via Vault.

**StripeEvent** (Webhook log, idempotency)
```sql
id uuid PK
stripe_event_id varchar(120) unique
type varchar(100)
payload_jsonb jsonb
processed bool default false
processing_error text nullable
created_at timestamp
```

**AuditLog** (Immutable, append-only)
```sql
id uuid PK
actor_user_id uuid nullable FK (system = null)
action AuditAction
entity_type varchar(50) -- USER, REQUEST, FULFILLMENT, SHORTLINK, TOKEN
entity_id uuid
metadata jsonb -- IP, userAgent, extra
created_at timestamp default now()
prev_hash varchar(64) nullable -- for hash chaining
hash varchar(64) -- sha256(prev_hash + id + action + timestamp)
ip_address inet nullable
```
- No updates/deletes allowed (DB trigger prevents).
- Partitioned by month.

**Receipt**
```sql
id uuid PK
fulfillment_id uuid FK unique
pdf_s3_key text
pdf_public_signed_url text nullable
issued_at timestamp
amount numeric
meter_masked varchar
token_masked varchar
```

**AdSlot** (Config)
```sql
id uuid PK
name varchar(50) -- top_banner, bottom_banner, sidebar_left, etc.
code_snippet text -- adSense code
is_active bool
page_target varchar(50) -- all, landing, checkout, success
created_at timestamp
```

### Redis Structures
- `short:{code}` -> { requestId, expiresAt, meterMasked }
- `rate:meter:{ip}` -> counter (sliding window 60s)
- `rate:lookup:{meterHash}` -> counter
- `queue:token:retry` -> BullMQ
- `session:{userId}` -> JWT blacklist

### Retention & POPIA
- User deletion: anonymize request fulfillment after legal retention (e.g., 5 years for financial). For POPIA request: hard delete PII but retain anonymized aggregates.
- Fulfillment token encrypted, auto-purge raw token after 90 days? Keep masked + receipt, but owner may need re-access. Policy: keep encrypted token 1 year, then rotate to archive.

### Indexes & Performance
- Partial index on Request where status=ACTIVE and expires_at > now()
- GIN index on AuditLog metadata
- Fulfillment index on request_id + created_at DESC for last 5 query.

### Sample Query for Checkout Page Stats
```sql
SELECT
  r.meter_masked,
  r.address_jsonb,
  r.expires_at,
  r.fulfillment_count,
  (SELECT array_agg(amount_zar ORDER BY created_at DESC) FROM fulfillment WHERE request_id = r.id AND status='TOKEN_ISSUED' LIMIT 5) as last5,
  SUM(f.amount_zar) as total
FROM request r
WHERE short_code = $1 AND status='ACTIVE'
```

### Prisma Schema Snippet
See Backend-Schema for API; DB implements with @@map etc.

### Backups
- Daily full + WAL continuous to S3 encrypted (KMS). Retention 30 days, region af-south-1.
