const requestStore = globalThis.__topmeupRequestStore || new Map();
globalThis.__topmeupRequestStore = requestStore;
const advanceStore = globalThis.__topmeupAdvanceStore || new Map();
globalThis.__topmeupAdvanceStore = advanceStore;

export function createRequest({ meter, email, phone, consent, code, user }) {
  const requestId = cryptoRandomId();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  const record = {
    id: requestId,
    code,
    meter,
    email: email || null,
    phone: phone || null,
    owner: user ? { name: user.name || null, email: user.email || null, phone: user.phone || null } : null,
    consent: Boolean(consent),
    status: 'pending',
    createdAt: Date.now(),
    expiresAt,
    payment: null,
    token: null,
    fulfillments: [],
    transactions: [],
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

export function getRequestByCode(code) {
  const record = Array.from(requestStore.values()).find((entry) => entry.code === code);
  return record ? getRequest(record.id) : null;
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

export function recordFulfillment(requestId, fulfillment) {
  const record = requestStore.get(requestId);
  if (!record) return null;

  record.fulfillments = [...(record.fulfillments || []), fulfillment];
  record.transactions = [...(record.transactions || []), fulfillment];
  record.payment = { provider: 'Demo checkout', amount: fulfillment.amount, paidAt: Date.now() };
  record.token = fulfillment;
  record.status = 'tokenized';
  return { ...record };
}

function cryptoRandomId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

export function listRequests() {
  return Array.from(requestStore.values()).map((entry) => ({
    ...entry,
    fulfillments: entry.fulfillments || [],
  }));
}

export function listAdvances(meter) {
  if (!advanceStore.has(meter)) {
    advanceStore.set(meter, [{
      id: `ADV-${meter.slice(-4)}`,
      meter,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      amount: 40,
      paidAmount: 0,
      status: 'due',
    }]);
  }

  return advanceStore.get(meter).map((advance) => ({ ...advance }));
}

export function createAdvance(meter, amount, owner) {
  const advances = listAdvances(meter);
  const outstanding = advances.filter((advance) => advance.status !== 'paid').reduce((total, advance) => total + (advance.amount - advance.paidAmount), 0);
  if (outstanding + amount > 100) return { error: 'Total outstanding advances cannot exceed R100.' };

  const advance = {
    id: `ADV-${Date.now()}`,
    meter,
    createdAt: Date.now(),
    amount,
    paidAmount: 0,
    status: 'due',
    owner: owner || null,
  };
  advanceStore.set(meter, [...advances, advance]);
  return { advance, outstanding: outstanding + amount };
}

export function payAdvance(meter, advanceId, amount, owner) {
  const advances = listAdvances(meter);
  const advance = advances.find((entry) => entry.id === advanceId);
  if (!advance) return { error: 'Advance not found.' };
  const balance = advance.amount - advance.paidAmount;
  if (amount > balance) return { error: 'Payment exceeds the amount owed.' };

  const updated = { ...advance, paidAmount: advance.paidAmount + amount, status: advance.paidAmount + amount >= advance.amount ? 'paid' : 'part-paid', paidBy: owner || null, paidAt: Date.now() };
  advanceStore.set(meter, advances.map((entry) => entry.id === advanceId ? updated : entry));
  return { advance: updated };
}
