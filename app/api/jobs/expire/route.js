import { expireRequests } from '../../../../lib/serverStore';

export async function POST(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.JOB_SECRET}`) return new Response('Unauthorized', { status: 401 });
  return Response.json({ expired: expireRequests() });
}