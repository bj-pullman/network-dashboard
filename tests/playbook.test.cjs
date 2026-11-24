const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const plain = object => JSON.parse(JSON.stringify(object));
function fixture() {
  const h = createHarness();
  h.invoke('saveAppSettings', [{ 'organization.name': 'Example Operations', 'regional.timezone': 'America/Chicago',
    'regional.date_format': 'yyyy-MM-dd', 'regional.time_format': 'HH:mm' }]);
  h.records('Switches', [{ 'Device Label': 'FIXTURE_DEVICE_CANARY', 'IP Address': '192.0.2.33',
    Notes: 'FIXTURE_NOTES_CANARY', Status: 'Online' }, { Status: 'FIXTURE_STATUS_CANARY' }]);
  h.records('Outages', [{ Started: '2026-11-01T06:30:00Z', Restored: '2026-11-01T07:30:00Z',
    Source: 'Manual', 'Cause / Reason': 'FIXTURE_OUTAGE_CANARY', Provider: 'FIXTURE_PROVIDER_CANARY' }]);
  h.records('Change Log', [{ 'Change Name': 'FIXTURE_CHANGE_CANARY', 'Change Date': '2026-03-08',
    Status: 'Monitoring', 'Documentation URL': 'https://example.test/FIXTURE_LINK_CANARY' },
  { 'Change Date': '=TODAY()', Status: 'Implemented' }]);
  h.records('Contacts', [{ 'Contact Name': 'FIXTURE_CONTACT_CANARY', Status: 'Active',
    Email: 'support@example.test', Phone: '+1 (202) 555-0100', Notes: 'FIXTURE_CONTACT_NOTES_CANARY' },
  { 'Contact Name': 'Personal', Status: 'Active', Email: 'person@example.test', Phone: '202-555-0101' },
  { Status: 'Active', Email: 'helpdesk@intranet.internal', Phone: '202-555-0102' },
  { Status: 'Inactive', Email: 'dispatch@example.test', Phone: '202-555-0103' },
  { Status: 'Active', Email: 'info@example.test', Phone: 'FIXTURE_PHONE_CANARY' },
  { Status: 'Active', Email: 'support@canary-secret.example.test' }]);
  return h;
}

test('Playbook uses explicit projections, native names and sidebar order even when selection is arbitrary', () => {
  const h = fixture();
  const captures = new Map();
  for (const name of ['Switches', 'Outages', 'Change Log', 'Contacts']) {
    const sheet = h.sheets.get(name);
    const ranges = [];
    captures.set(name, ranges);
    const getRange = sheet.getRange.bind(sheet);
    sheet.getRange = (...args) => {
      if (args[0] >= 2) ranges.push([args[1], args[3]]);
      return getRange(...args);
    };
  }
  const data = plain(h.invoke('appGetStandardPlaybook', [[
    'contacts', 'settings', 'changeLog', 'outages', 'switches', 'networkClosets', 'dashboard', 'contacts'
  ]], { readonly: true }));
  assert.equal(data.classification, 'Operational reference');
  assert.equal(data.organization, undefined);
  assert.equal(new Date(data.generatedAt).toISOString(), data.generatedAt);
  assert.deepEqual(data.sections.map(section => section.label), ['Switches', 'Outages', 'Change Log', 'Contacts']);
  assert.deepEqual(data.sections[0].rows, [['Online', '192.0.2.33']]);
  assert.deepEqual(data.sections[1].rows, [['2026-11-01 01:30 (UTC-05:00)', '2026-11-01 01:30 (UTC-06:00)', '60', 'Manual']]);
  assert.deepEqual(data.sections[2].rows, [['2026-03-08', 'Monitoring']]);
  assert.deepEqual(data.sections[3].rows, [
    ['General information', 'info@example.test', ''], ['Support desk', 'support@example.test', '+1 202-555-0100']
  ]);
  assert.doesNotMatch(JSON.stringify(data), /CANARY|person@example|intranet|dispatch@example|password/i);
  for (const [name, fields] of Object.entries({
    Switches: ['Status', 'IP Address'], Outages: ['Started', 'Restored', 'Source', 'Review State', 'Incident Started', 'Incident Restored'],
    'Change Log': ['Change Date', 'Status'], Contacts: ['Status', 'Email', 'Phone']
  })) {
    const headers = h.sheets.get(name).data[0];
    assert.deepEqual([...new Set(captures.get(name).map(range => JSON.stringify(range)))].map(JSON.parse),
      fields.map(field => [headers.indexOf(field) + 1, 1]), name);
  }
});

test('Playbook checks fresh caller permission before reading selected sheets and omits disabled modules', () => {
  const h = fixture();
  h.records('SSIDs', [{ SSID: 'FIXTURE_SSID_CANARY', Status: 'Enabled', Password: 'FIXTURE_PASS_CANARY' }]);
  h.invoke('saveAppUser', [{ email: 'print-viewer@example.test', name: 'Print Fixture',
    active: true, role: 'user', defaultPermission: 'none', permissions: { contacts: 'view', ssids: 'view' } }]);
  h.invoke('saveAppSettings', [{ 'modules.ssids.enabled': false }]);
  const requester = { user: 'print-viewer@example.test', readonly: true };
  const expected = h.invoke('getAppBootstrap', [], requester).standardPlaybookSections.map(item => item.key);
  assert.deepEqual(Array.from(expected), ['contacts']);
  const data = h.invoke('appGetStandardPlaybook', [['switches', 'contacts', 'outages', 'ssids', 'settings']], requester);
  assert.deepEqual(Array.from(data.sections, section => section.key), ['contacts']);
  assert.ok(!h.calls.some(call => ['Switches', 'Outages', 'SSIDs'].includes(call.sheet)));
  h.invoke('saveAppUser', [{ email: requester.user, name: 'Print Fixture',
    active: true, role: 'user', defaultPermission: 'none', permissions: { contacts: 'none' } }],
    { user: 'admin@example.test' });
  assert.equal(h.invoke('appGetStandardPlaybook', [['contacts']], requester).sections.length, 0);
  assert.ok(!h.calls.some(call => call.sheet === 'Contacts'));
  assert.throws(() => h.invoke('appGetStandardPlaybook', [['contacts']], { user: 'unknown@example.test' }), /Unauthorized/);
});

test('Playbook omits formula-fed cells, duplicate headers, invalid organization labels and empty sections', () => {
  const h = fixture();
  h.invoke('saveAppSettings', [{ 'organization.name': 'FIXTURE_ORG_CANARY' }]);
  const sheet = h.sheets.get('Contacts');
  const emailColumn = sheet.data[0].indexOf('Email') + 1;
  const getRange = sheet.getRange.bind(sheet);
  sheet.getRange = (...args) => {
    const range = getRange(...args);
    if (args[0] === 2 && args[1] === emailColumn) {
      range.getFormulas = () => [['=UnapprovedColumn'], ...Array.from({ length: args[2] - 1 }, () => [''])];
    }
    return range;
  };
  const data = h.invoke('appGetStandardPlaybook', [['contacts', 'accessPoints']]);
  assert.equal(data.organization, undefined);
  assert.equal(data.sections.length, 1);
  assert.doesNotMatch(JSON.stringify(data), /support@example|CANARY/);
  sheet.data[0].push('Email');
  assert.equal(h.invoke('appGetStandardPlaybook', [['contacts']]).sections.length, 0);
  assert.throws(() => h.invoke('appGetStandardPlaybook', [{ contacts: true }]), /Select valid/);
});

test('one Playbook reads authorized typed fields only; never secret columns or formula values', () => {
  const h = fixture();
  const admin = { user: 'admin@example.test' };
  const operator = { user: 'fixture-operator@example.test' };
  const viewer = { user: 'viewer@example.test' };
  const load = (keys, caller) => plain(h.invoke('appGetStandardPlaybook', [keys], caller));
  const camera = h.sheets.get('Security Cameras');
  camera.data.splice(1);
  camera.data[0].push('API Key', 'Token', 'Recovery Code', 'User / Password');
  h.records('Security Cameras', [
    { 'Name': 'RAW_FIELD_CANARY', 'IP Address': '192.0.2.91', Username: 'camera.viewer',
      Password: 'PASSWORD_CANARY', 'API Key': 'KEY_CANARY', Token: 'TOKEN_CANARY',
      'Recovery Code': 'RECOVERY_CANARY', 'User / Password': 'COMBINED_CANARY', Notes: 'NOTE_CANARY' },
    { 'IP Address': '2001:db8::92', Username: 'camera.viewer:wrong', Password: 'SECOND_PASSWORD_CANARY' },
    { 'IP Address': '192.0.2.93', Username: 'operator', Password: 'FORMULA_ROW_CANARY' },
    { 'IP Address': '2001:db8:::1', Username: 'sk_fixture', Notes: 'OTHER_CANARY' }
  ]);
  const usernameCol = camera.data[0].indexOf('Username') + 1;
  const addressCol = camera.data[0].indexOf('IP Address') + 1;
  const ranges = [];
  const reads = [];
  const getRange = camera.getRange.bind(camera);
  camera.getRange = (row, col, height = 1, width = 1) => {
    const range = getRange(row, col, height, width);
    if (row < 2) return range;
    ranges.push([col, width]);
    const read = range.getValues.bind(range);
    range.getValues = () => { reads.push([row, col, height]); return read(); };
    if (row === 2 && col === addressCol) range.getFormulas = () => [[''], [''], ['=HiddenColumn'], ['']];
    return range;
  };
  assert.equal(load(['securityCameras'], viewer).sections.length, 0);
  assert.deepEqual(ranges, []);
  h.invoke('saveAppUser', [{ email: operator.user, active: true, role: 'user', defaultPermission: 'none',
    permissions: { securityCameras: 'edit' } }], admin);
  const data = load(['securityCameras'], operator);
  assert.deepEqual(data.sections[0].rows, [
    ['192.0.2.91', 'camera.viewer'], ['2001:db8::92', ''], ['', 'operator']
  ]);
  assert.deepEqual(new Set(ranges.map(([col]) => col)), new Set([addressCol, usernameCol]));
  assert.ok(ranges.every(([, width]) => width === 1));
  assert.ok(!reads.some(([row, col, count]) => col === addressCol && row <= 4 && row + count > 4),
    'formula-backed value must not be requested');
  assert.doesNotMatch(JSON.stringify(data), /CANARY|192\.0\.2\.93|:::|sk_fixture|wrong/);
  h.invoke('saveAppUser', [{ email: operator.user, active: true, role: 'user', defaultPermission: 'none',
    permissions: { securityCameras: 'view' } }], admin);
  assert.equal(load(['securityCameras'], operator).sections.length, 0);
});

test('typed WAN/VLAN fields keep their visibility without exporting combined or arbitrary text', () => {
  const h = fixture();
  h.records('Internet WAN', [{ 'Circuit ID': 'WAN-EXAMPLE', Status: 'Active', Role: 'Primary',
    'Service Type': 'Fiber', 'Public Network / CIDR': '203.0.113.0/24', Gateway: '203.0.113.1',
    'Public IPs': '192.0.2.20,SECRET_CANARY', Notes: 'NOTES_CANARY' }]);
  h.records('IP Route Tables', [{ 'VLAN ID': 12, 'Network / CIDR': '2001:db8:1::/64',
    Gateway: '2001:db8:1::1', 'DHCP Scope / Pool': 'SECRET_CANARY', 'VLAN Name': 'UNAPPROVED_CANARY' }]);
  h.records('Access Points', [{ 'Device Label': 'Unvalidated', Status: 'Online',
    'Virtual Controller': 'Name: SECRET_CANARY | IP: 192.0.2.77' }]);
  const viewer = plain(h.invoke('appGetStandardPlaybook', [['routes', 'internetWan', 'accessPoints']], { user: 'viewer@example.test' }));
  assert.deepEqual(viewer.sections.find(page => page.key === 'routes').rows, [['12', '2001:db8:1::/64', '2001:db8:1::1']]);
  assert.ok(viewer.sections.find(page => page.key === 'internetWan').rows.some(row => row.includes('203.0.113.0/24')));
  assert.deepEqual(viewer.sections.find(page => page.key === 'accessPoints').rows, [['Online', 1]]);
  assert.doesNotMatch(JSON.stringify(viewer), /CANARY|192\.0\.2\.20|192\.0\.2\.77/);
});
