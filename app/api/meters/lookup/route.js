import { lookupMeter } from '../../../../lib/ravasVend';

export async function POST(request) {
  try {
    const meter = String((await request.json())?.meter || '');
    if (!/^\d{11}$/.test(meter)) return Response.json({ error: 'A valid 11-digit meter number is required.' }, { status: 400 });
    const result = await lookupMeter(meter);
    return Response.json({ success: true, ...result });
  } catch (error) { return Response.json({ error: error.message || 'Meter lookup failed.' }, { status: 502 }); }
}