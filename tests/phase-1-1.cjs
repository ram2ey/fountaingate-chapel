// Containment regression checks using actual React rendering and the actual provider.
// No network, database or new test dependencies are required.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const originalTs = require.extensions['.ts'];
const originalTsx = require.extensions['.tsx'];
const originalLoad = Module._load;
let pathname = '/login';
let checks = 0;

function compile(module, filename) {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
}

require.extensions['.ts'] = compile;
require.extensions['.tsx'] = compile;
Module._load = function (request, parent, isMain) {
  if (request === 'next/navigation') return { usePathname: () => pathname, useRouter: () => ({push(){},refresh(){}}) };
  return originalLoad.call(this, request, parent, isMain);
};

try {
  const { ChurchProvider, useChurch } = require('../lib/context/ChurchContext.tsx');
  const { AuthGuard } = require('../components/auth/AuthGuard.tsx');
  let context;
  function Capture() { context = useChurch(); return null; }
  const render = child => renderToStaticMarkup(React.createElement(ChurchProvider, null, child));
  render(React.createElement(Capture));

  assert.equal(context.currentUser, null);
  assert.equal(context.isLive, false);
  assert.equal('loginWithPhone' in context, false);
  assert.equal('setCurrentRole' in context, false);
  checks++;

  const lists = ['systemUsers', 'members', 'sermons', 'contributions', 'careNotes',
    'broadcasts', 'guestRetention', 'auditLogs', 'prayerRequests', 'pastoralDocuments'];
  for (const name of lists) assert.deepEqual(context[name], [], name);
  checks++;

  // Every unfinished backend operation must fail rather than return fake success.
  for (const [name, value] of Object.entries(context)) {
    if (typeof value === 'function' && !['setSearchQuery','logout'].includes(name)) {
      assert.throws(() => value({}), /operation is unavailable/, name);
    }
  }
  for (const name of lists) assert.deepEqual(context[name], []);
  checks++;

  // Legacy check-ins must not be read, modified or deleted by an unavailable sync.
  global.localStorage = {
    getItem() { throw new Error('Unexpected legacy queue read'); },
    setItem() { throw new Error('Unexpected legacy queue write'); },
    removeItem() { throw new Error('Unexpected legacy queue deletion'); },
  };
  assert.throws(() => context.syncOfflineCheckIns(), /operation is unavailable/);
  checks++;

  function ProtectedChild() { throw new Error('Protected content was rendered'); }
  for (const route of ['/', '/admin', '/members', '/financials', '/giving', '/pastoral-care',
    '/communications', '/prayer-wall', '/documents', '/sermons', '/settings']) {
    pathname = route;
    const html = render(React.createElement(AuthGuard, null, React.createElement(ProtectedChild)));
    assert.match(html, /Church portal temporarily unavailable/);
    assert.doesNotMatch(html, /<form|<input|Redirecting/);
  }
  checks++;

  for (const route of ['guest-intake']) {
    pathname = '/' + route;
    const Page = require('../app/' + route + '/page.tsx').default;
    const html = render(React.createElement(AuthGuard, null, React.createElement(Page)));
    assert.match(html, /First-time guest intake/);
    assert.match(html, /<form/);
    assert.doesNotMatch(html, /Confirmed|successfully/);
  }
  checks++;

  for (const name of ['AttendanceChart', 'MetricsOverview', 'FinancialBreakdownChart']) {
    const Component = require('../components/dashboard/' + name + '.tsx')[name];
    const html = render(React.createElement(Component));
    assert.match(html, /currently unavailable/);
    assert.doesNotMatch(html, /428|94%|8,450|\+12%|<svg/);
  }
  checks++;

  const root = path.resolve(__dirname, '..');
  function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(file);
      else if (/\.[jt]sx?$/.test(file)) {
        assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /INITIAL_SYSTEM_USERS|INITIAL_MEMBERS|churchStore|loginWithPhone/,
          path.relative(root, file));
      }
    }
  }
  for (const directory of ['app', 'components', 'lib']) inspect(path.join(root, directory));
  assert.equal(fs.existsSync(path.join(root, 'lib/store/churchStore.ts')), false);
  checks++;

  console.log(`Passed ${checks} Phase 1.1 regression groups: no mock sign-in, seeded records, fake writes, queue deletion, protected content, active public forms or invented analytics.`);
} finally {
  require.extensions['.ts'] = originalTs;
  require.extensions['.tsx'] = originalTsx;
  Module._load = originalLoad;
  delete global.localStorage;
}
