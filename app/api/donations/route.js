import { getRequestByCode, recordFulfillment } from '../../../lib/serverStore';

const tokenFor = () => Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000)).join('-');
const formatMoney = (value) => Number(value).toFixed(2);

export async function POST(request) {
  try {
    const body = await request.json();
    const amount = Number(body?.amount);
    const record = getRequestByCode(String(body?.code || ''));

    if (!record) return Response.json({ error: 'This request link is no longer available.' }, { status: 404 });
    if (!Number.isFinite(amount) || amount < 30 || amount > 5000) {
      return Response.json({ error: 'Choose an amount between R30 and R5,000.' }, { status: 400 });
    }

    const serviceFee = 5;
    const amountAfterServiceFee = amount - serviceFee;
    const vat = amountAfterServiceFee * 0.15;
    const electricityAmount = amountAfterServiceFee - vat;
    const units = electricityAmount / 2.15;
    const createdAt = Date.now();
    const token = tokenFor();
    const fulfillment = {
      id: `FUL-${Date.now()}`,
      amount,
      serviceFee,
      amountAfterServiceFee: Number(formatMoney(amountAfterServiceFee)),
      vat: Number(formatMoney(vat)),
      electricityAmount: Number(formatMoney(electricityAmount)),
      units: Number(formatMoney(units)),
      token,
      receiptNumber: `TM${createdAt.toString(36).toUpperCase()}`,
      createdAt,
      donor: body?.donorEmail || 'Anonymous sender',
      sms: {
        provider: 'topmeup',
        message: `topmeup Electricity Token: ${token} Receipt: TM${createdAt.toString(36).toUpperCase()} Meter: ${record.meter} Amount: R${formatMoney(amount)} VAT: R${formatMoney(vat)} Service fee: R${formatMoney(serviceFee)} Units: ${formatMoney(units)} kWh`,
      },
    };
    const updatedRequest = recordFulfillment(record.id, fulfillment);

    return Response.json({ success: true, fulfillment, request: updatedRequest }, { status: 201 });
  } catch {
    return Response.json({ error: 'Unable to process demo donation.' }, { status: 400 });
  }
}
