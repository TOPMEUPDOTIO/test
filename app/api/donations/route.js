import { getRequestByCode, recordFulfillment } from '../../../lib/serverStore';

const tokenFor = () => Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join('-');

export async function POST(request) {
  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    const record = getRequestByCode(String(body?.code || ''));

    if (!record) return Response.json({ error: 'This request link is no longer available.' }, { status: 404 });
    if (!Number.isFinite(amount) || amount < 30 || amount > 5000) {
      return Response.json({ error: 'Choose an amount between R30 and R5,000.' }, { status: 400 });
    }

    const fulfillment = {
      id: `FUL-${Date.now()}`,
      amount,
      units: (amount / 2.15).toFixed(2),
      token: tokenFor(),
      createdAt: Date.now(),
      donor: body?.donorEmail || 'Anonymous helper',
    };
    const updatedRequest = recordFulfillment(record.id, fulfillment);

    return Response.json({ success: true, fulfillment, request: updatedRequest }, { status: 201 });
  } catch {
    return Response.json({ error: 'Unable to process demo donation.' }, { status: 400 });
  }
}
