import { createRequest, getRequest, getRequestByCode, issueToken, listRequests, markPayment } from '../../../lib/serverStore';
import { userFromRequest } from '../../../lib/auth';

export async function GET(request) {
  const code = new URL(request.url).searchParams.get('code');
  if (code) {
    const record = getRequestByCode(code);
    return record ? Response.json({ request: record }) : Response.json({ error: 'Request not found.' }, { status: 404 });
  }

  return Response.json({ requests: listRequests() });
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.meter || !/^\d{11}$/.test(String(body.meter))) {
      return Response.json({ error: 'Meter number is required.' }, { status: 400 });
    }

    if (!body?.consent) {
      return Response.json({ error: 'POPIA consent is required.' }, { status: 400 });
    }

    const emailValid = !body?.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email));
    const rawPhoneDigits = String(body?.phone || '').replace(/\D/g, '');
    const phoneDigits = rawPhoneDigits.startsWith('27') ? rawPhoneDigits.slice(2) : rawPhoneDigits.replace(/^0/, '');
    const phoneValid = !body?.phone || /^\d{9}$/.test(phoneDigits);

    if (!emailValid || !phoneValid) {
      return Response.json({ error: 'Provide a valid email or mobile number.' }, { status: 400 });
    }

    const sessionUser = userFromRequest(request);
    const record = createRequest({
      meter: String(body.meter),
      email: body?.email || null,
      phone: body?.phone || null,
      consent: Boolean(body.consent),
      code: String(body.code || 'UNSET'),
      user: sessionUser || body?.user || null,
    });

    return Response.json({ success: true, request: record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }
}

export async function PATCH(request) {
  const body = await request.json();
  const requestId = body?.requestId;
  const action = body?.action;

  if (!requestId || !action) {
    return Response.json({ error: 'Request ID and action are required.' }, { status: 400 });
  }

  const record = getRequest(requestId);
  if (!record) {
    return Response.json({ error: 'Request not found.' }, { status: 404 });
  }

  if (action === 'pay' && body?.payment) {
    const updated = markPayment(requestId, body.payment);
    return Response.json({ success: true, request: updated });
  }

  if (action === 'token' && body?.token) {
    const updated = issueToken(requestId, body.token);
    return Response.json({ success: true, request: updated });
  }

  return Response.json({ error: 'Unsupported action.' }, { status: 400 });
}
