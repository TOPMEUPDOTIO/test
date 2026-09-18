import { createAdvance, listAdvances, payAdvance } from '../../../lib/serverStore';

export async function GET(request) {
  const meter = new URL(request.url).searchParams.get('meter');
  if (!meter || !/^\d{11}$/.test(meter)) return Response.json({ error: 'A valid meter number is required.' }, { status: 400 });
  const advances = listAdvances(meter);
  return Response.json({ meter, advances, outstanding: advances.filter((entry) => entry.status !== 'paid').reduce((total, entry) => total + (entry.amount - entry.paidAmount), 0) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const meter = String(body?.meter || '');
    const amount = Number(body?.amount);
    if (!/^\d{11}$/.test(meter) || !Number.isFinite(amount) || amount < 20 || amount > 50) return Response.json({ error: 'Advance amounts must be R20, R30, R40, or R50.' }, { status: 400 });
    const result = createAdvance(meter, amount, body?.owner || null);
    if (result.error) return Response.json({ error: result.error }, { status: 400 });
    return Response.json(result, { status: 201 });
  } catch {
    return Response.json({ error: 'Unable to create an advance.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const result = payAdvance(String(body?.meter || ''), String(body?.advanceId || ''), Number(body?.amount), body?.owner || null);
    if (result.error) return Response.json({ error: result.error }, { status: 400 });
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Unable to pay advance.' }, { status: 400 });
  }
}