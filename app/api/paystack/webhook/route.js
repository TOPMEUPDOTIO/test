import crypto from 'node:crypto';
import { getRequestByCode, recordFulfillment } from '../../../../lib/serverStore';
import { vendElectricity } from '../../../../lib/ravasVend';
import { sendReceipt } from '../../../../lib/notifications';

export async function POST(request) {
  const raw = await request.text();
  const signature = request.headers.get('x-paystack-signature');
  const expectedSignature = process.env.PAYSTACK_SECRET_KEY ? crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(raw).digest('hex') : '';
  if (!signature || signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return new Response('Unauthorized', { status: 401 });
  try {
    const event = JSON.parse(raw);
    if (event.event !== 'charge.success') return Response.json({ received: true });
    const metadata = event.data?.metadata || {};
    const record = getRequestByCode(String(metadata.code || event.data?.reference?.split('-')[1] || ''));
    if (!record) return Response.json({ error: 'Request not found.' }, { status: 404 });
    const amount = Number(event.data.amount) / 100;
    const serviceFee = 5;
    const net = Math.max(0, amount - serviceFee);
    const vat = net * 0.15;
    const electricityAmount = net - vat;
    const vend = process.env.RAVASVEND_USERNAME ? await vendElectricity(record.meter, electricityAmount) : {};
    const fulfillment = { id: `FUL-${Date.now()}`, amount, serviceFee, amountAfterServiceFee: net, vat: Number(vat.toFixed(2)), electricityAmount: Number(electricityAmount.toFixed(2)), units: Number((electricityAmount / 2.15).toFixed(2)), token: vend.token || null, receiptNumber: vend.receipt || `TM${Date.now().toString(36).toUpperCase()}`, createdAt: Date.now(), donor: event.data.customer?.email || 'Anonymous sender', paystackReference: event.data.reference, status: vend.token ? 'tokenized' : 'paid' };
    recordFulfillment(record.id, fulfillment);
    await sendReceipt({ email: fulfillment.donor.includes('@') ? fulfillment.donor : null, phone: record.phone, message: `topmeup transaction complete. Token: ${fulfillment.token || 'processing'}. Receipt: ${fulfillment.receiptNumber}. Amount: R${amount.toFixed(2)}.` });
    return Response.json({ received: true });
  } catch { return Response.json({ error: 'Webhook processing failed.' }, { status: 400 }); }
}