import fs from 'node:fs';
import path from 'node:path';

const dataDirectory = path.join(process.cwd(), '.data');
const dataFile = path.join(dataDirectory, 'topmeup.json');

function loadStore() {
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return { requests: new Map(data.requests || []), advances: new Map(data.advances || []) };
  } catch {
    return { requests: new Map(), advances: new Map() };
  }
}

const persisted = globalThis.__topmeupPersistentStore || loadStore();
globalThis.__topmeupPersistentStore = persisted;
const requestStore = persisted.requests;
const advanceStore = persisted.advances;

function persist() {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify({ requests: [...requestStore], advances: [...advanceStore] }, null, 2));
}

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
  persist();

  return record;
}

export function getRequest(requestId) {
  const record = requestStore.get(requestId);
  if (!record) return null;

  if (record.expiresAt <= Date.now()) {
    requestStore.delete(requestId);
    persist();
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
  persist();

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
  persist();

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
  persist();
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

export function expireRequests() {
  const now = Date.now();
  let expired = 0;
  for (const [id, record] of requestStore) {
    if (record.expiresAt <= now && record.status !== 'expired') { record.status = 'expired'; requestStore.set(id, record); expired += 1; }
  }
  if (expired) persist();
  return expired;
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
    receiptNumber: `ADV${Date.now().toString(36).toUpperCase()}`,
    createdAtLabel: new Date().toISOString(),
  };
  advanceStore.set(meter, [...advances, advance]);
  persist();
  return { advance, outstanding: outstanding + amount };
}

export function listAllAdvances() {
  return Array.from(advanceStore.values()).flatMap((advances) => advances.map((advance) => ({ ...advance })));
}

export function payAdvance(meter, advanceId, amount, owner) {
  const advances = listAdvances(meter);
  const advance = advances.find((entry) => entry.id === advanceId);
  if (!advance) return { error: 'Advance not found.' };
  const balance = advance.amount - advance.paidAmount;
  if (amount > balance) return { error: 'Payment exceeds the amount owed.' };

  const updated = { ...advance, paidAmount: advance.paidAmount + amount, status: advance.paidAmount + amount >= advance.amount ? 'paid' : 'part-paid', paidBy: owner || null, paidAt: Date.now() };
  advanceStore.set(meter, advances.map((entry) => entry.id === advanceId ? updated : entry));
  persist();
  return { advance: updated };
}
