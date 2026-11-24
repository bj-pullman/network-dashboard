const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const admin = { user: 'admin@example.test' };
const viewer = { user: 'viewer@example.test' };
const editor = { user: 'fixture-editor@example.test' };
const load = (h, key, who = viewer, refresh = false) => h.invoke('appGetPageData', [key, refresh], who);
const flat = value => JSON.stringify(value);
const camera = '192.0.2.10';
const sw = '198.51.100.71';
const server = '2001:db8::72';
const controller = '2001:db8::73';
const ups = '2001:db8::74';
const bus = '198.51.100.75';
const bridge = '203.0.113.76';
const intercom = '192.0.2.40';
const network = '203.0.113.0/24';
const gateway = '203.0.113.1';
const dhcp = '203.0.113.20 - 203.0.113.80';
const closet = 'CLOSET-FIXTURE';

function actor(h, roles) {
  h.invoke('saveAppUser', [{ email: editor.user, name: 'Fixture Editor', active: true,
    role: 'user', defaultPermission: 'view', permissions: roles }], admin);
}

function fixtures(h) {
  h.records('Switches', [{ 'Device Label': 'Fixture Switch', 'IP Address': sw, 'Closet ID': closet }]);
  h.records('Servers', [{ 'Server Name': 'Fixture Server', 'IP Address': server, 'Closet ID': closet }]);
  h.records('Offline Servers', [{ 'Server Name': 'Fixture Archived Server', 'IP Address': '2001:db8::78', 'Closet ID': closet }]);
  h.records('Access Points', [
    { 'Device Label': 'Fixture AP', 'IP Address': '2001:db8::79', 'Virtual Controller': 'Name: Fixture Controller | IP: ' + controller },
    { 'Device Label': 'Historical AP', 'Virtual Controller': 'IP: 198.51.100.81' },
    { 'Device Label': 'Malformed AP', 'Virtual Controller': 'Name: 198.51.100.82' }
  ]);
  h.records('Network Closets', [{ 'Closet ID': closet, 'Closet / Room Name': 'Fixture Closet' }]);
  h.records('Network Closet UPS', [{ 'UPS ID': 'FIXTURE-UPS', 'Closet ID': closet, 'Management IP': ups,
    'Network Managed': 'Yes', Model: 'Fixture Model' }]);
  const buses = h.sheets.get('Bus Cameras').data;
  buses[0] = ['DVR IP', '192.0.2.83', 'Gateway', gateway];
  buses[7] = buses[6].map(field => ({ 'Bus Name/Number': 'Fixture Bus', 'DVR IP': bus, 'Bridge IP': bridge })[field] || '');
  h.records('IP Route Tables', [{ 'VLAN Name': 'Fixture VLAN', 'Network / CIDR': network, Gateway: gateway,
    'DHCP Scope / Pool': dhcp }]);
  h.records('Internet WAN', [{ 'Circuit ID': 'WAN-SECOND', 'Circuit Name': 'Fixture WAN retained',
    'Public Network / CIDR': network, Gateway: gateway }]);
}

test('ordinary inventory projection recalculates Edit access on warm and cold cache paths', () => {
  const h = createHarness(); fixtures(h);
  actor(h, { servers: 'edit', switches: 'edit', securityCameras: 'view', accessPoints: 'view' });
  for (const [page, address] of [['switches', sw], ['servers', server], ['securityCameras', camera]]) {
    for (const initial of [viewer, admin]) {
      load(h, page, initial, true);
      const viewerResponse = load(h, page);
      assert.equal(viewerResponse.permission, 'view');
      assert.ok(viewerResponse.rows.length && !viewerResponse.headers.includes('IP Address'));
      assert.ok(!viewerResponse.defaultColumns.includes('IP Address'));
      assert.ok(!flat(viewerResponse).includes(address));
      assert.ok(!viewerResponse.rows.some(row => Object.hasOwn(row, 'IP Address')));
      assert.ok(flat(load(h, page, admin)).includes(address));
    }
  }
  assert.ok(flat(load(h, 'servers', editor)).includes(server));
  assert.ok(!flat(load(h, 'securityCameras', editor)).includes(camera));
  assert.ok(!flat(load(h, 'servers')).includes('2001:db8::78'));
  assert.ok(flat(load(h, 'servers', editor)).includes('2001:db8::78'));
  actor(h, { servers: 'view', switches: 'none' });
  assert.ok(!flat(load(h, 'servers', editor)).includes(server));
  assert.throws(() => load(h, 'switches', editor), /permission/);
});

test('controller enrichment and structured inventory omit only designated device address data', () => {
  const h = createHarness(); fixtures(h);
  const ap = load(h, 'accessPoints');
  assert.equal(ap.rows[0]['Virtual Controller'], 'Name: Fixture Controller');
  assert.equal(ap.rows[1]['Virtual Controller'], '');
  assert.equal(ap.rows[2]['Virtual Controller'], '');
  for (const addr of [controller, '2001:db8::79', '198.51.100.81', '198.51.100.82']) {
    assert.ok(!flat(ap).includes(addr));
    assert.ok(flat(load(h, 'accessPoints', admin)).includes(addr));
  }
  for (const [key, addresses, labels] of [
    ['busCameras', [bus, bridge, '192.0.2.83'], ['DVR IP', 'Bridge IP']],
    ['intercom', [intercom], ['IP Address']]
  ]) {
    const editorWarm = load(h, key, admin, true);
    const output = load(h, key);
    for (const address of addresses) {
      assert.ok(flat(editorWarm).includes(address), key);
      assert.ok(!flat(output).includes(address), key);
    }
    for (const section of output.sections) {
      for (const label of labels) {
        assert.ok(!(section.items || []).some(item => item.label === label), key);
        assert.ok(!(section.columns || []).some(col => col.title === label), key);
        assert.ok(!(section.defaultColumnTitles || []).includes(label), key);
      }
    }
  }
  assert.ok(flat(load(h, 'busCameras')).includes(gateway), 'routing data remains unchanged even on a protected page');
});

test('bulk closet payload projects both nested copies; source access cannot bypass the owning module', () => {
  const h = createHarness(); fixtures(h);
  actor(h, { networkClosets: 'edit', switches: 'view', servers: 'none' });
  load(h, 'networkClosets', admin, true);
  let payload = load(h, 'networkClosets', editor);
  assert.ok(!flat(payload).includes(sw) && !flat(payload).includes(server));
  assert.equal(payload.upsByCloset[closet][0]['Management IP'], ups);
  assert.equal(payload.equipmentByCloset[closet].length, 3);
  assert.ok(payload.equipmentByCloset[closet].every(row => !Object.hasOwn(row, 'ipAddress')));
  assert.ok(payload.inventory.every(row => !Object.hasOwn(row, 'ipAddress')));
  assert.ok(!flat(load(h, 'networkClosets')).includes(ups));
  actor(h, { networkClosets: 'edit', switches: 'edit', servers: 'view' });
  payload = load(h, 'networkClosets', editor);
  assert.equal(payload.inventory.find(row => row.sheet === 'Switches').ipAddress, sw);
  assert.equal(payload.equipmentByCloset[closet].find(row => row.sheet === 'Switches').ipAddress, sw);
  assert.ok(!flat(payload).includes(server));
  actor(h, { networkClosets: 'view', switches: 'edit', servers: 'edit' });
  assert.ok(!flat(load(h, 'networkClosets', editor)).includes(sw));
  assert.ok(flat(load(h, 'networkClosets', admin)).includes(server));
});

test('WAN, gateways and VLAN/DHCP addressing remain unchanged; approved reports still omit inventory IPs', () => {
  const h = createHarness(); fixtures(h);
  const wan = load(h, 'internetWan');
  const routes = load(h, 'routes');
  for (const value of [network, gateway]) {
    assert.ok(flat(wan).includes(value));
    assert.ok(flat(routes).includes(value));
  }
  assert.ok(flat(routes).includes(dhcp));
  const playbook = h.invoke('appGetStandardPlaybook', [['accessPoints', 'switches', 'servers', 'securityCameras']], admin);
  for (const value of [sw, server, camera, controller]) assert.ok(!flat(playbook).includes(value));
});
