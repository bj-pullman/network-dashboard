const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

function clientHarness() {
  const requests = [], renders = [], updates = [], timers = new Map();
  let timerId = 0;
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', remove() {}, querySelector: () => null });
      return elements.get(id);
    },
    querySelectorAll: () => []
  };
  function runner(success, failure) {
    return new Proxy({}, { get: (_, method) => {
      if (method === 'withSuccessHandler') return handler => runner(handler, failure);
      if (method === 'withFailureHandler') return handler => runner(success, handler);
      return (...args) => requests.push({ method, args, resolve: success, reject: failure });
    } });
  }
  const context = vm.createContext({ document, performance, console: { log() {}, warn() {}, error() {} },
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id), requestAnimationFrame: callback => queueMicrotask(callback),
    addEventListener() {}, google: { script: { run: runner() } },
    sessionStorage: { getItem() {}, setItem() {}, removeItem() {} }
  });
  context.window = context;
  const source = fs.readFileSync(path.join(__dirname, '..', 'Scripts.html'), 'utf8').replace(/<\/?script>/g, '');
  vm.runInContext(source, context);
  const evaluate = source => vm.runInContext(source, context);
  const routes = evaluate('PAGE_RENDERER_FUNCTIONS');
  for (const [key, fn] of Object.entries(routes)) context[fn] = data => renders.push({ key, data });
  context.updateRecordTablePage_ = async data => updates.push(data);
  evaluate('appBootstrap = { pages: Object.keys(PAGE_RENDERER_FUNCTIONS).map(key => ({key})), startupTasks: {} };');
  return { context, evaluate, requests, renders, updates, timers };
}
const flush = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
const data = (pageKey, label = pageKey) => ({ pageKey, label, headers: ['Location'], rows: [{ Location: label }], permission: 'view' });

function actionButton() {
  const attributes = {};
  return { innerHTML: '<i></i>Save', disabled: false, style: { minWidth: '' }, offsetWidth: 80,
    setAttribute: (key, value) => attributes[key] = value,
    removeAttribute: key => delete attributes[key], attributes };
}

test('shared save buttons animate a progress bar and immediately restore on success and failure', () => {
  const h = clientHarness();
  for (const complete of ['setActionSuccess', 'setActionError']) {
    const button = actionButton();
    h.context.setActionWorking(button, 'Updating...');
    assert.ok(button.innerHTML.includes('Saving...'));
    assert.ok(button.innerHTML.includes('action-progress'));
    assert.ok(!button.innerHTML.includes('fa-spin'));
    assert.equal(button.disabled, true);
    h.context[complete](button);
    assert.equal(button.innerHTML, '<i></i>Save');
    assert.equal(button.disabled, false);
    assert.equal(button.attributes['aria-busy'], undefined);
    assert.equal(button._networkDashboardActionState, undefined);
  }
});

for (const failureAt of [null, 'collect', 'rpc', 'render']) {
  test('Settings always cleans up its save lifecycle: ' + (failureAt || 'success'), async () => {
    const h = clientHarness();
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Settings.html'), 'utf8').replace(/<\/?script>/g, ''), h.context);
    let overlay = false, toast = '', error = null;
    h.context.collectSettingsFormValues_ = () => {
      if (failureAt === 'collect') throw new Error('collection failure');
      return {};
    };
    h.context.showAppWorkingModal = () => overlay = true;
    h.context.hideAppWorkingModal = () => overlay = false;
    h.context.applyBootstrapShell = () => {};
    h.context.renderSettingsPage = () => { if (failureAt === 'render') throw new Error('render failure'); };
    h.context.showToast = message => toast = message;
    h.context.handleFailure = value => error = value;
    h.evaluate("currentPageKey = 'settings';");
    const button = actionButton();
    const pending = h.context.saveSettingsForm(button);
    if (failureAt !== 'collect') {
      assert.equal(overlay, true);
      assert.equal(h.evaluate('settingsSaveInProgress'), true);
      h.context.saveSettingsForm(button);
      assert.equal(h.requests.length, 1, 'double save guarded');
      if (failureAt === 'rpc') h.requests[0].reject(new Error('RPC failure'));
      else h.requests[0].resolve({ bootstrap: {}, config: {} });
    }
    await pending;
    assert.equal(h.evaluate('settingsSaveInProgress'), false);
    assert.equal(overlay, false);
    assert.equal(button.disabled, false);
    assert.equal(button.innerHTML, '<i></i>Save');
    assert.equal(button.attributes['aria-busy'], undefined);
    assert.equal(!!error, !!failureAt);
    if (!failureAt) assert.equal(toast, 'Settings saved.');
  });
}

test('Dashboard causes only its own data RPC and no renderer RPC', async () => {
  const h = clientHarness();
  h.context.navigateTo('dashboard');
  assert.equal(h.requests.length, 1);
  h.requests[0].resolve(data('dashboard'));
  await flush();
  assert.equal(h.requests.length, 1);
  assert.equal(h.renders[0].key, 'dashboard');
  h.context.navigateTo('securityCameras');
  assert.equal(h.requests.length, 2);
  assert.equal(h.requests[1].method, 'appGetPageData');
  h.requests[1].resolve(data('securityCameras'));
  await flush();
});

test('late navigation responses cannot replace a newer page', async () => {
  const h = clientHarness();
  h.context.navigateTo('securityCameras');
  h.context.navigateTo('switches');
  h.requests[1].resolve(data('switches'));
  await flush();
  h.requests[0].resolve(data('securityCameras'));
  await flush();
  assert.deepEqual(h.renders.map(item => item.key), ['switches']);
  assert.equal(h.evaluate('currentPageKey'), 'switches');
  h.context.navigateTo('securityCameras');
  await flush();
  assert.equal(h.requests.length, 2);
  assert.equal(h.renders.at(-1).key, 'securityCameras');
});

test('a newer refresh owns the cache even if an older request completes later', async () => {
  const h = clientHarness();
  h.context.navigateTo('securityCameras');
  h.context.loadPage('securityCameras', true);
  h.requests[1].resolve(data('securityCameras', 'new'));
  await flush();
  h.requests[0].resolve(data('securityCameras', 'old'));
  await flush();
  assert.equal(h.context.getClientCache('securityCameras').label, 'new');
  assert.equal(h.renders.at(-1).data.label, 'new');
});

test('stale cache renders immediately, then uses an in-place updater', async () => {
  const h = clientHarness();
  h.context.setClientCache('securityCameras', data('securityCameras', 'cached'));
  h.evaluate("clientPageCache.get('securityCameras').loadedAt = Date.now() - CLIENT_CACHE_FRESH_MS - 1;");
  h.context.navigateTo('securityCameras');
  await flush();
  assert.equal(h.renders.length, 1);
  assert.equal(h.renders[0].data.label, 'cached');
  h.requests[0].resolve(data('securityCameras', 'refreshed'));
  await flush();
  assert.equal(h.renders.length, 1);
  assert.equal(h.updates.length, 1);
  assert.equal(h.updates[0].label, 'refreshed');
});

test('navigation cancels a scheduled startup health request', async () => {
  const h = clientHarness();
  h.evaluate('appBootstrap.startupTasks.uptimeRobotHealthRefresh = { enabled: true };');
  h.context.navigateTo('dashboard');
  h.requests[0].resolve(data('dashboard'));
  await flush();
  assert.equal([...h.timers.values()].filter(timer => timer.delay === 600).length, 1);
  h.context.navigateTo('securityCameras');
  assert.equal([...h.timers.values()].filter(timer => timer.delay === 600).length, 0);
  h.requests[1].resolve(data('securityCameras'));
  await flush();
  assert.equal(h.requests.length, 2);
});

test('a write invalidates an older in-flight Dashboard cache result', async () => {
  const h = clientHarness();
  h.context.navigateTo('dashboard');
  h.context.invalidateClientPage('securityCameras');
  h.requests[0].resolve(data('dashboard'));
  await flush();
  assert.equal(h.context.getClientCache('dashboard'), null);
});

test('all registered renderers are included in the initial shell without filename conflicts', () => {
  const root = path.join(__dirname, '..');
  const index = fs.readFileSync(path.join(root, 'Index.html'), 'utf8');
  const included = [...index.matchAll(/include\('([^']+)'\)/g)].map(match => match[1]);
  const source = included.map(name => fs.readFileSync(path.join(root, name + '.html'), 'utf8')).join('\n');
  const h = clientHarness();
  for (const name of Object.values(h.evaluate('PAGE_RENDERER_FUNCTIONS'))) {
    assert.ok(source.includes('function ' + name + '('), name);
  }
  assert.ok(included.includes('OutagesPage'));
  const names = fs.readdirSync(root).filter(file => /\.(js|gs|html)$/.test(file)).map(file => file.replace(/\.[^.]+$/, '').toLowerCase());
  assert.equal(new Set(names).size, names.length);
});
