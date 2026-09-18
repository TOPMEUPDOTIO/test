import crypto from 'node:crypto';
import { getRequestByCode } from '../../../../lib/serverStore';

export async function POST(request) {
  if (!process.env.PAYSTACK_SECRET_KEY) return Response.json({ error: 'Paystack is not configured.' }, { status: 503 });
  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    const record = getRequestByCode(String(body?.code || ''));
    if (!record || !Number.isFinite(amount) || amount < 30 || amount > 5000) return Response.json({ error: 'Invalid request or amount.' }, { status: 400 });
    const reference = `TM-${record.code}-${crypto.randomUUID()}`;
    const response = await fetch('https://api.paystack.co/transaction/initialize', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Math.round(amount * 100), email: body.email || record.email || 'payments@topmeup.io', reference, callback_url: process.env.PAYSTACK_CALLBACK_URL || 'https://topmeup.io' }) });
    const payload = await response.json();
    if (!response.ok || !payload.status) return Response.json({ error: payload.message || 'Paystack initialization failed.' }, { status: 502 });
    return Response.json({ reference, authorizationUrl: payload.data.authorization_url, accessCode: payload.data.access_code });
  } catch { return Response.json({ error: 'Unable to initialize Paystack checkout.' }, { status: 400 }); }
}