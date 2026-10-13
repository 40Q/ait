import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const source = readFileSync(new URL('../lib/supabase/middleware.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function middlewareFor(user, cookie) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, process,
    require: name => {
      if (name === '@supabase/ssr') return {
        createServerClient: (_url, _key, { cookies }) => ({
          auth: { getUser: async () => {
            cookies.setAll([cookie]);
            return { data: { user }, error: null };
          } },
        }),
      };
      if (name === '@/lib/auth/helpers') return {
        getUserProfile: async () => ({ role: 'client' }),
        getDashboardPath: () => '/dashboard',
      };
      return require(name);
    },
  });
  return exports.updateSession;
}

test('redirecting an invalid session to login carries the deleted auth cookie', async () => {
  const updateSession = middlewareFor(null, {
    name: 'sb-auth-token', value: '', options: { path: '/', maxAge: 0 },
  });
  const result = await updateSession(new NextRequest('https://example.com/requests/new'));
  assert.equal(result.headers.get('location'), 'https://example.com/login');
  assert.equal(result.cookies.get('sb-auth-token')?.value, '');
  assert.match(result.headers.get('set-cookie'), /Max-Age=0/);
});

test('redirecting a signed-in user from login retains a refreshed session cookie', async () => {
  const updateSession = middlewareFor({ id: 'client-a' }, {
    name: 'sb-auth-token', value: 'refreshed-session', options: { path: '/', httpOnly: true },
  });
  const result = await updateSession(new NextRequest('https://example.com/login'));
  assert.equal(result.headers.get('location'), 'https://example.com/dashboard');
  assert.equal(result.cookies.get('sb-auth-token')?.value, 'refreshed-session');
});
