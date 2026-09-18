import { authenticate, clearSessionCookie, createAccount, sessionCookie, userFromRequest } from '../../../lib/auth';

export async function GET(request) { const user = userFromRequest(request); return user ? Response.json({ user }) : Response.json({ user: null }, { status: 401 }); }
export async function POST(request) {
  try {
    const body = await request.json();
    if (body.action === 'logout') return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() } });
    if (!body.email || !body.password) return Response.json({ error: 'Email and password are required.' }, { status: 400 });
    const user = body.action === 'signup' ? createAccount(body) : authenticate(body.email, body.password);
    return new Response(JSON.stringify({ user }), { headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(user) } });
  } catch (error) { return Response.json({ error: error.message || 'Authentication failed.' }, { status: 400 }); }
}