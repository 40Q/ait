import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { QueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const source = readFileSync(new URL('../lib/auth/session-monitor.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { monitorAuthSession } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

async function setup({ path = '/requests/new', response = 'valid' } = {}) {
  const user = { id: 'client-a', email: 'a@example.com' };
  const tokenFor = (id) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, exp: 4102444800 })).toString('base64url')}.${Buffer.from('signature').toString('base64url')}`;
  const values = new Map([['session-test', JSON.stringify({
    access_token: tokenFor(user.id), refresh_token: 'refresh', token_type: 'bearer',
    expires_in: 3600, expires_at: 4102444800, user,
  })]]);
  let checks = 0;
  let mode = response;
  const client = createClient('https://example.supabase.co', 'public-key', {
    auth: {
      autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'session-test',
      storage: { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) },
    },
    global: { fetch: async (url, init) => {
      if (String(url).includes('/logout')) return new Response(null, { status: 204 });
      checks++;
      const id = JSON.parse(Buffer.from(new Headers(init?.headers).get('Authorization').split('.')[1], 'base64url').toString()).sub;
      return new Response(JSON.stringify(mode === 'revoked'
        ? { code: 'session_not_found', msg: 'Session not found' }
        : mode === 'unavailable' ? { code: 'unexpected_failure', msg: 'Temporarily unavailable' }
        : { ...user, id }), {
        status: mode === 'revoked' ? 403 : mode === 'unavailable' ? 500 : 200,
        headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' },
      });
    } },
  });
  await client.auth.getSession();
  const queryClient = new QueryClient();
  const browser = new EventTarget();
  const document = new EventTarget();
  document.visibilityState = 'visible';
  const redirects = [];
  let reloads = 0;
  let interval;
  browser.document = document;
  browser.location = { pathname: path, replace: url => redirects.push(url), reload: () => reloads++ };
  browser.setInterval = (callback) => { interval = callback; return 1; };
  browser.clearInterval = () => { interval = undefined; };
  const monitor = monitorAuthSession(client, queryClient, browser);
  await monitor.validate();
  const seed = () => { queryClient.setQueryData(['current-user'], user); queryClient.setQueryData(['requests'], [{ id: 'private-request' }]); };
  seed();
  return { client, queryClient, browser, redirects, monitor, seed, setMode: value => { mode = value; },
    tokenFor, checks: () => checks, reloads: () => reloads, interval: () => interval };
}
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };

test('signing out clears account queries and leaves the protected page', async () => {
  const s = await setup();
  await s.client.auth.signOut({ scope: 'local' });
  assert.equal(s.queryClient.getQueryCache().getAll().length, 0);
  assert.deepEqual(s.redirects, ['/login?reason=session-ended']);
  s.monitor.dispose();
});

test('revocation is detected on validation and clears the persisted session', async () => {
  const s = await setup(); s.setMode('revoked');
  await s.monitor.validate();
  assert.equal(s.queryClient.getQueryData(['current-user']), undefined);
  assert.equal((await s.client.auth.getSession()).data.session, null);
  assert.deepEqual(s.redirects, ['/login?reason=session-ended']);
  s.monitor.dispose();
});

test('a temporary Auth service failure preserves the UI and cache', async () => {
  const s = await setup(); s.setMode('unavailable');
  await s.monitor.validate();
  assert.ok(s.queryClient.getQueryData(['requests']));
  assert.deepEqual(s.redirects, []);
  s.monitor.dispose();
});

test('token refresh for the same account preserves queries; switching accounts clears them and reloads', async () => {
  const s = await setup();
  assert.equal((await s.client.auth.setSession({ access_token: s.tokenFor('client-a'), refresh_token: 'refresh' })).error, null);
  assert.ok(s.queryClient.getQueryData(['requests']));
  assert.equal((await s.client.auth.setSession({ access_token: s.tokenFor('client-b'), refresh_token: 'refresh-b' })).error, null);
  assert.equal(s.queryClient.getQueryCache().getAll().length, 0);
  assert.equal(s.reloads(), 1);
  s.monitor.dispose();
});

for (const path of ['/login', '/auth/set-password', '/auth/callback', '/auth/auth-code-error']) {
  test(`session loss does not redirect the public page ${path}`, async () => {
    const s = await setup({ path });
    await s.client.auth.signOut({ scope: 'local' });
    assert.deepEqual(s.redirects, []);
    assert.equal(s.queryClient.getQueryCache().getAll().length, 0);
    s.monitor.dispose();
  });
}

test('focus, visibility, and the visible-tab timer detect revoked sessions; dispose removes listeners', async () => {
  for (const trigger of ['focus', 'visibilitychange', 'interval']) {
    const s = await setup(); s.setMode('revoked');
    if (trigger === 'interval') s.interval()();
    else if (trigger === 'focus') s.browser.dispatchEvent(new Event('focus'));
    else s.browser.document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    assert.deepEqual(s.redirects, ['/login?reason=session-ended'], trigger);
    s.monitor.dispose();
    const before = s.checks();
    s.browser.dispatchEvent(new Event('focus'));
    await settle();
    assert.equal(s.checks(), before);
    assert.equal(s.interval(), undefined);
  }
});

test('hidden tabs do not poll and valid sessions keep their cached data', async () => {
  const s = await setup(); const before = s.checks();
  s.browser.document.visibilityState = 'hidden';
  s.interval()(); await settle();
  assert.equal(s.checks(), before);
  assert.ok(s.queryClient.getQueryData(['requests']));
  assert.deepEqual(s.redirects, []);
  s.monitor.dispose();
});

test('a temporary refresh failure during INITIAL_SESSION keeps the stored session and cached UI', async (t) => {
  const originalDateNow = Date.now;
  let offset = 0;
  t.mock.method(Date, 'now', () => originalDateNow() + offset);
  // The SDK logs retryable initialization errors; unexpected errors still fail.
  t.mock.method(console, 'error', error => {
    assert.equal(error.name, 'AuthRetryableFetchError');
  });
  const values = new Map([['expired-session', JSON.stringify({
    access_token: 'old-token', refresh_token: 'valid-refresh', token_type: 'bearer',
    expires_at: Math.floor(originalDateNow() / 1000) - 60, user: { id: 'client-a' },
  })]]);
  const client = createClient('https://example.supabase.co', 'public-key', {
    auth: {
      storageKey: 'expired-session', autoRefreshToken: false, detectSessionInUrl: false,
      storage: { getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) },
    },
    global: { fetch: async () => {
      offset += 60_000; // Exhaust the SDK retry budget without a real 30-second wait.
      return new Response('unavailable', { status: 503 });
    } },
  });
  const browser = new EventTarget();
  browser.document = new EventTarget();
  browser.document.visibilityState = 'visible';
  const redirects = [];
  browser.location = { pathname: '/requests/new', replace: url => redirects.push(url) };
  browser.setInterval = () => 1;
  browser.clearInterval = () => {};
  const queryClient = new QueryClient();
  queryClient.setQueryData(['requests'], [{ id: 'private-request' }]);
  const monitor = monitorAuthSession(client, queryClient, browser);
  try {
    await monitor.validate();
    await settle();
    assert.deepEqual(redirects, []);
    assert.deepEqual(queryClient.getQueryData(['requests']), [{ id: 'private-request' }]);
    assert.equal(values.has('expired-session'), true);
  } finally {
    monitor.dispose();
  }
});
