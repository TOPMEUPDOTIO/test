import crypto from 'node:crypto';
import { getUser, saveUser } from './userStore';

const secret = process.env.AUTH_SECRET || 'development-only-change-me';
const cookieName = 'topmeup_session';

const sign = (value) => crypto.createHmac('sha256', secret).update(value).digest('hex');
const passwordHash = (password, salt = crypto.randomBytes(16).toString('hex')) => `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
const validPassword = (password, stored) => { const [salt, hash] = String(stored).split(':'); return salt && crypto.timingSafeEqual(Buffer.from(hash, 'hex'), crypto.scryptSync(password, salt, 64)); };

export function createAccount({ name, email, password, phone }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (getUser(normalizedEmail)) throw new Error('An account with that email already exists.');
  const user = { id: crypto.randomUUID(), name: name.trim(), email: normalizedEmail, phone: phone || null, password: passwordHash(password), createdAt: Date.now() };
  saveUser(user);
  return publicUser(user);
}

export function authenticate(email, password) {
  const user = getUser(email.trim().toLowerCase());
  if (!user || !validPassword(password, user.password)) throw new Error('Invalid email or password.');
  return publicUser(user);
}

export function sessionCookie(user) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${cookieName}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function userFromRequest(request) {
  const value = request.headers.get('cookie')?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (session.exp < Date.now()) return null;
    const user = getUser(session.email);
    return user ? publicUser(user) : null;
  } catch { return null; }
}

export const publicUser = ({ password, ...user }) => user;
export const clearSessionCookie = () => `${cookieName}=; Path=/; HttpOnly; Max-Age=0`;