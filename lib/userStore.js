import fs from 'node:fs';
import path from 'node:path';

const file = path.join(process.cwd(), '.data', 'users.json');
function users() { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; } }
function persist(entries) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(entries, null, 2)); }
export function getUser(email) { return users().find((user) => user.email === email) || null; }
export function saveUser(user) { const entries = users(); entries.push(user); persist(entries); return user; }