const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');
const idHeader = 'Network HQ Server ID';
const hostHeader = 'Network HQ VM Host ID';
const uuid = n => '70000000-0000-4000-8000-' + String(n).padStart(12, '0');
const entry = (name, n, host, other = {}) => ({
  'Server Name': name, [idHeader]: n ? uuid(n) : '', [hostHeader]: host ? uuid(host) : '', ...other
});
const read = (h, refresh = false, user = 'admin@example.test') => h.invoke('appGetPageData', ['servers', refresh], { user });
const asCells = sheet => sheet.data.map(row => Object.fromEntries(sheet.data[0].map((header, i) => [header, row[i] ?? ''])));

test('schema 11 upgrade adds IDs in place, leaves legacy formulas and legend rows, and is repeatable', () => {
  const h = createHarness();
  const settings = h.sheets.get('App Settings').data;
  settings.find(row => row[0] === 'schema.version')[settings[0].indexOf('Value')] = '11';
  const originals = {};
  for (const name of ['Servers', 'Offline Servers']) {
    const sheet = h.sheets.get(name);
    sheet.data[0].splice(-2, 2, 'Old Custom Formula', 'VM Host');
    h.records(name, [
      { 'Server Name': 'Repeated Name', 'Old Custom Formula': '=1+2', 'VM Host': 'Legacy manual note' },
      { 'Server Name': 'Color legend', Notes: 'Preserve' },
      { 'Server Name': '', Notes: 'Non-inventory row' },
      { 'Server Name': 'Count = 1', Notes: 'Preserve' }
    ]);
    originals[name] = JSON.stringify(sheet.data);
  }
  const before = read(h);
  assert.equal(before.vmRelationshipsReady, false);
  assert.ok(!before.headers.includes('_vmHostName'));
  assert.throws(() => h.invoke('appUpdateRecord', ['servers', 2,
    { 'Server Name': 'Repeated Name', _vmHostName: uuid(1) }]), /Update \/ Repair/);
  h.invoke('updateNetworkDashboard', [{ silent: true }]);
  assert.equal(h.invoke('getAppBootstrap').config.installedSchemaVersion, h.context.NETWORK_DASHBOARD_SCHEMA_VERSION);
  const after = {};
  for (const [name, original] of Object.entries(originals)) {
    const sheet = h.sheets.get(name);
    const raw = JSON.parse(original);
    assert.deepEqual(sheet.data[0].slice(0, raw[0].length), raw[0]);
    assert.deepEqual(sheet.data.map(row => row.slice(0, raw[0].length)), raw);
    const rows = asCells(sheet);
    assert.match(rows[1][idHeader], /^[a-f0-9-]{36}$/);
    for (const row of rows.slice(2)) assert.equal(row[idHeader], '');
    assert.ok(rows.slice(1).every(row => row[hostHeader] === ''));
    after[name] = JSON.stringify(sheet.data);
  }
  h.invoke('updateNetworkDashboard', [{ silent: true }]);
  for (const [name, data] of Object.entries(after)) assert.equal(JSON.stringify(h.sheets.get(name).data), data);
  const linked = read(h);
  assert.equal(linked.vmRelationshipsReady, true);
  assert.equal(new Set(linked.rows.map(row => row._vmServerId)).size, 2);
  assert.equal(linked.totalCount, 2);
  assert.equal(linked.rows[0]['VM Host'], 'Legacy manual note');
  assert.ok(!linked.headers.includes(idHeader) && !linked.headers.includes(hostHeader));
  assert.ok(!Object.hasOwn(linked.rows[0], idHeader) && !Object.hasOwn(linked.rows[0], hostHeader));
});

test('link to an existing host across sheets and keep the correct record through duplicate names, rename and row reorder', () => {
  const h = createHarness();
  h.records('Servers', [entry('Same Host', 1), entry('Fixture Guest', 3, null,
    { Type: 'Virtual', Notes: '=FIXTURE_FORMULA()' })]);
  h.records('Offline Servers', [entry('Same Host', 2)]);
  let data = read(h, true);
  assert.equal(data.rows[0]._vmServerLabel, 'Same Host (Active, row 2)');
  assert.equal(data.rows[2]._vmServerLabel, 'Same Host (Offline, row 2)');
  h.invoke('appUpdateRecord', ['servers', 3, { 'Server Name': 'Fixture Guest', _expectedServerId: uuid(3),
    _vmHostName: uuid(2), [idHeader]: uuid(4), [hostHeader]: uuid(1) }, 'Servers']);
  data = read(h);
  assert.equal(data.rows[1]._vmHostName, 'Same Host (Offline, row 2)');
  assert.equal(data.rows[2]._vmGuestNames, 'Fixture Guest');
  assert.equal(data.rows[0]._vmGuestNames, '');
  assert.equal(asCells(h.sheets.get('Servers'))[2].Notes, '=FIXTURE_FORMULA()');
  h.invoke('appUpdateRecord', ['servers', 2, { 'Server Name': 'Renamed Fixture Host', _expectedServerId: uuid(2) }, 'Offline Servers']);
  const active = h.sheets.get('Servers').data;
  [active[1], active[2]] = [active[2], active[1]];
  data = read(h, true);
  assert.equal(data.rows[0]._vmHostName, 'Renamed Fixture Host');
  assert.equal(data.rows[0]._vmHostId, uuid(2));
  assert.equal(data.totalCount, 3);
  assert.throws(() => h.invoke('appUpdateRecord', ['servers', 3,
    { 'Server Name': 'Stale form', _expectedServerId: uuid(3) }, 'Servers']), /changed while editing/);
  assert.throws(() => h.invoke('appDeleteRecord', ['servers', 2, 'Offline Servers', uuid(2)]), /unlink/);
  h.invoke('appUpdateRecord', ['servers', 2,
    { 'Server Name': 'Fixture Guest', _expectedServerId: uuid(3), _vmHostName: '' }, 'Servers']);
  assert.equal(read(h).rows[2]._vmGuestNames, '');
  assert.equal(asCells(h.sheets.get('Servers'))[1][hostHeader], '');
});

test('invalid or ambiguous references and cycles are rejected without changing storage', () => {
  const h = createHarness();
  h.records('Servers', [entry('Host', 1), entry('Guest', 2, 1),
    entry('Missing ancestor', 3, 90), entry('Duplicate ID A', 4), entry('Duplicate ID B', 4),
    entry('Corrupt reference', 5, null, { [hostHeader]: 'synthetic-invalid-value' })]);
  const editHost = value => h.invoke('appUpdateRecord', ['servers', 2,
    { 'Server Name': 'Host', _expectedServerId: uuid(1), _vmHostName: value }, 'Servers']);
  const contents = JSON.stringify(h.sheets.get('Servers').data);
  assert.throws(() => editHost(uuid(1)), /itself/);
  assert.throws(() => editHost(uuid(2)), /circular/);
  for (const n of [3, 4, 90]) assert.throws(() => editHost(uuid(n)), /missing or ambiguous/);
  assert.throws(() => editHost(uuid(5)), /invalid host relationship/);
  assert.throws(() => editHost('Host'), /Select an existing VM host/);
  assert.throws(() => h.invoke('appAddRecord', ['servers', { 'Server Name': 'Invalid Guest', _vmHostName: uuid(90) }]), /missing/);
  assert.equal(JSON.stringify(h.sheets.get('Servers').data), contents);
  const data = read(h);
  assert.equal(data.rows[2]._vmHostUnavailable, true);
  assert.equal(data.rows[3]._vmServerId, '');
  assert.equal(data.rows[5]._vmHostName, 'Unavailable host');
  assert.ok(!JSON.stringify(data).includes('synthetic-invalid-value'));
  h.invoke('appUpdateRecord', ['servers', 7, { 'Server Name': 'Corrupt reference', Notes: 'Unrelated edit' }]);
  assert.equal(asCells(h.sheets.get('Servers'))[6][hostHeader], 'synthetic-invalid-value');
  h.invoke('updateNetworkDashboard', [{ silent: true }]);
  assert.equal(asCells(h.sheets.get('Servers'))[4][idHeader], uuid(4));
  assert.equal(asCells(h.sheets.get('Servers'))[5][idHeader], uuid(4));
});

test('inherit Servers authorization and use the normal create path for stable linked guests', () => {
  const h = createHarness();
  h.records('Servers', [entry('Fixture Host', 1)]);
  for (const permission of ['none', 'view', 'edit']) {
    h.invoke('saveAppUser', [{ email: permission + '@example.test', active: true, role: 'user',
      defaultPermission: 'none', permissions: { servers: permission } }], { user: 'admin@example.test' });
  }
  const add = user => h.invoke('appAddRecord', ['servers',
    { 'Server Name': 'Fixture Guest', Type: 'Virtual', _vmHostName: uuid(1), [idHeader]: uuid(1) }], { user });
  read(h, true); // Populate the shared server cache as admin first.
  for (const permission of ['none', 'view']) {
    assert.throws(() => add(permission + '@example.test'), /permission/i);
    assert.throws(() => h.invoke('appUpdateRecord', ['servers', 2, { 'Server Name': 'Unauthorized', _vmHostName: '' }],
      { user: permission + '@example.test' }), /permission/i);
  }
  assert.throws(() => read(h, false, 'none@example.test'), /permission/i);
  assert.equal(add('edit@example.test').status, 'success');
  const page = read(h, false, 'view@example.test');
  assert.equal(page.permission, 'view');
  assert.equal(page.totalCount, 2);
  assert.equal(page.rows[0]._vmGuestNames, 'Fixture Guest');
  assert.equal(page.rows[1]._vmHostName, 'Fixture Host');
  assert.notEqual(page.rows[1]._vmServerId, uuid(1));
});
