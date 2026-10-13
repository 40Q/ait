import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const source = readFileSync(new URL('../lib/storage/upload.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { uploadFile } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const file = new File(['test'], 'equipment.jpeg', { type: 'image/jpeg' });
const options = { bucket: 'request-files', folder: 'company-123' };

function clientFor({ signedIn = false, revoked = false } = {}) {
  const requests = [];
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: 'user-123', exp: 4102444800 })).toString('base64url')}.signature`;
  const storageKey = 'test-session';
  const session = signedIn ? JSON.stringify({
    access_token: token, refresh_token: 'refresh-token', token_type: 'bearer',
    expires_in: 3600, expires_at: 4102444800,
    user: { id: 'user-123', email: 'client@example.com' },
  }) : null;
  const client = createClient('https://example.supabase.co', 'test-publishable-key', {
    auth: {
      autoRefreshToken: false, detectSessionInUrl: false, storageKey,
      storage: { getItem: (key) => key === storageKey ? session : null, setItem() {}, removeItem() {} },
    },
    global: {
      fetch: async (url, init) => {
        requests.push({ url: String(url), authorization: new Headers(init?.headers).get('Authorization') });
        if (String(url).endsWith('/auth/v1/user')) {
          return new Response(JSON.stringify(revoked
            ? { code: 'session_not_found', msg: 'Session not found' }
            : { id: 'user-123', email: 'client@example.com' }), {
            status: revoked ? 403 : 200, headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ Id: 'object-123', Key: 'request-files/company-123/equipment.jpeg' }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  });
  return { client, requests, token };
}

test('missing session stops the upload and tells the client to sign in', async () => {
  const { client, requests } = clientFor();
  await assert.rejects(uploadFile(client, file, options), /sign in again/i);
  assert.equal(requests.filter(r => r.url.includes('/storage/')).length, 0);
});

test('revoked session stops the upload before storage is contacted', async () => {
  const { client, requests } = clientFor({ signedIn: true, revoked: true });
  await assert.rejects(uploadFile(client, file, options), /sign in again/i);
  assert.equal(requests.filter(r => r.url.includes('/storage/')).length, 0);
});

test('valid session uploads with the user token and company folder', async () => {
  const { client, requests, token } = clientFor({ signedIn: true });
  const result = await uploadFile(client, file, options);
  const upload = requests.find(r => r.url.includes('/storage/'));
  assert.equal(upload.authorization, `Bearer ${token}`);
  assert.match(upload.url, /\/request-files\/company-123\//);
  assert.match(result.path, /^company-123\//);
  assert.equal(result.size, 4);
});
