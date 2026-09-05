const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

test('Security Cameras: 18 rows, no writes, one batched read with warm access', () => {
  const h = createHarness();
  h.invoke('appGetPageData', ['securityCameras', true]);
  const data = h.invoke('appGetPageData', ['securityCameras', true]);
  assert.equal(data.rows.length, 18);
  assert.equal(data.totalCount, 18);
  assert.equal(data.performance.sheetReads, 1);
  assert.deepEqual(h.calls.filter(call => /getValues|getDisplayValues/.test(call.name)),
    [{ name: 'getDisplayValues', sheet: 'Security Cameras' }]);
  for (const row of data.rows) assert.equal(Object.hasOwn(row, 'Password'), false);
  assert.ok(data.hasCredentials);
  for (const key of ['permission', 'enablement', 'spreadsheet', 'sheetLookup', 'dataRange', 'sheetRead',
    'schema', 'transform', 'sensitive', 'serverTotal']) assert.equal(typeof data.performance.timings[key], 'number', key);
});

test('all enabled pages load read-only', () => {
  const h = createHarness();
  const bootstrap = h.invoke('getAppBootstrap');
  assert.equal(bootstrap.pages.length, 15);
  for (const page of bootstrap.pages) {
    const data = h.invoke('appGetPageData', [page.key, true]);
    assert.equal(data.performance.status, 'success', page.key);
    assert.deepEqual(h.calls.filter(call => /^(set|autoResize|insertSheet|appendRow|deleteRow|clearContent)/.test(call.name)), [], page.key);
  }
});

test('cached pages use current caller permission; disabled and unauthorized reads fail', () => {
  const h = createHarness();
  for (const key of ['securityCameras', 'intercom', 'internetWan', 'uptimeRobot', 'outages']) {
    h.invoke('appGetPageData', [key, false]);
    const view = h.invoke('appGetPageData', [key, false], { user: 'viewer@example.test' });
    assert.equal(view.permission, 'view', key);
  }
  for (const user of ['blocked@example.test', 'inactive@example.test', 'unknown@example.test']) {
    assert.throws(() => h.invoke('appGetPageData', ['securityCameras'], { user }), /permission|Unauthorized/);
  }
  assert.throws(() => h.invoke('appGetPageData', ['users'], { user: 'viewer@example.test' }), /Administrator/);
  const settings = h.sheets.get('App Settings').data;
  const keyIndex = settings[0].indexOf('Key'), valueIndex = settings[0].indexOf('Value');
  settings.find(row => row[keyIndex] === 'modules.backups.enabled')[valueIndex] = 'false';
  h.cache.clear();
  assert.throws(() => h.invoke('appGetPageData', ['backups'], { user: 'admin@example.test' }), /disabled/);
});

test('camera CRUD still targets physical rows and preserves a blank password edit', () => {
  const h = createHarness();
  const initial = h.invoke('appGetPageData', ['securityCameras', true]);
  const row = initial.rows[0];
  const passwordColumn = h.sheets.get('Security Cameras').data[0].indexOf('Password');
  const password = h.sheets.get('Security Cameras').data[row._row - 1][passwordColumn];
  h.invoke('appUpdateRecord', ['securityCameras', row._row, { ...row, Notes: 'Edited fixture', Password: '' }]);
  assert.equal(h.sheets.get('Security Cameras').data[row._row - 1][passwordColumn], password);
  h.invoke('appAddRecord', ['securityCameras', { Location: 'Added Fixture', Category: 'Software' }]);
  let data = h.invoke('appGetPageData', ['securityCameras', true]);
  assert.equal(data.rows.length, 19);
  h.invoke('appDeleteRecord', ['securityCameras', data.rows.at(-1)._row]);
  data = h.invoke('appGetPageData', ['securityCameras', true]);
  assert.equal(data.rows.length, 18);
  for (const [method, args] of [
    ['appAddRecord', ['securityCameras', { Location: 'Denied' }]],
    ['appUpdateRecord', ['securityCameras', row._row, { Notes: 'Denied' }]],
    ['appDeleteRecord', ['securityCameras', row._row]]
  ]) assert.throws(() => h.invoke(method, args, { user: 'viewer@example.test' }), /permission/);
});

test('integration status reads no unrelated inventories', () => {
  const h = createHarness();
  h.invoke('getIntegrationStatusById_', ['uptimerobot'], { readonly: true });
  assert.deepEqual([...new Set(h.calls.map(call => call.sheet).filter(Boolean))], ['App Integrations']);
});

test('missing App Users fails closed without creating a sheet', () => {
  const h = createHarness();
  h.sheets.delete('App Users');
  assert.throws(() => h.invoke('appGetPageData', ['securityCameras']), /Unauthorized/);
  assert.equal(h.sheets.has('App Users'), false);
});

test('credential reveal requires edit permission and never appears in performance logs', () => {
  const h = createHarness();
  const reveal = h.invoke('appGetRowCredential', ['securityCameras', 'main', 2, 'Password'], { readonly: true });
  assert.ok(reveal.value);
  assert.throws(() => h.invoke('appGetRowCredential', ['securityCameras', 'main', 2, 'Password'],
    { user: 'viewer@example.test', readonly: true }), /permission/);
  assert.throws(() => h.invoke('appGetCredentials', ['securityCameras', 'main'],
    { user: 'viewer@example.test', readonly: true }), /permission/);
  h.invoke('appGetPageData', ['securityCameras'], { user: 'admin@example.test' });
  assert.equal(JSON.stringify(h.logs).includes(reveal.value), false);
});

test('user permission writes invalidate the existing access cache', () => {
  const h = createHarness();
  h.invoke('appGetPageData', ['securityCameras'], { user: 'viewer@example.test' });
  h.invoke('saveAppUser', [{ email: 'viewer@example.test', name: 'Fixture Viewer', active: true,
    role: 'user', defaultPermission: 'view', permissions: { securityCameras: 'edit' } }], { user: 'admin@example.test' });
  assert.equal(h.invoke('appGetPageData', ['securityCameras'], { user: 'viewer@example.test' }).permission, 'edit');
});
