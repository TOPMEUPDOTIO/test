const requestStore = new Map();

export function createRequest({ meter, email, phone, consent, code }) {
  const requestId = cryptoRandomId();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const record = {
    id: requestId,
    code,
    meter,
    email: email || null,
    phone: phone || null,
    consent: Boolean(consent),
    status: 'pending',
    createdAt: Date.now(),
    expiresAt,
    payment: null,
    token: null,
  };

  requestStore.set(requestId, record);

  return record;
}

export function getRequest(requestId) {
  const record = requestStore.get(requestId);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    requestStore.delete(requestId);
    return null;
  }

  return { ...record };
}

export function markPayment(requestId, paymentDetails) {
  const record = requestStore.get(requestId);
  if (!record) return null;

  record.payment = {
    ...paymentDetails,
    paidAt: Date.now(),
  };
  record.status = 'paid';

  return { ...record };
}

export function issueToken(requestId, tokenDetails) {
  const record = requestStore.get(requestId);
  if (!record) return null;

  record.token = {
    ...tokenDetails,
    issuedAt: Date.now(),
  };
  record.status = 'tokenized';

  return { ...record };
}

function cryptoRandomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function listRequests() {
  return Array.from(requestStore.values()).map((entry) => ({ ...entry }));
}
