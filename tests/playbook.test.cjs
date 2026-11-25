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
  assert.deepEqual(data.sections[0].rows, [['', '', 'Online', '', '', '192.0.2.33']]);
  assert.deepEqual(data.sections[1].rows, [['', '', '', '2026-11-01 01:30 (UTC-05:00)', '2026-11-01 01:30 (UTC-06:00)', '60', 'Manual']]);
  assert.deepEqual(data.sections[2].rows, [['2026-03-08', '', '', '', 'Monitoring']]);
  assert.deepEqual(data.sections[3].rows, [
    ['', 'General information', '', 'info@example.test', ''], ['', 'Support desk', '', 'support@example.test', '+1 202-555-0100']
  ]);
  assert.doesNotMatch(JSON.stringify(data), /CANARY|person@example|intranet|dispatch@example|password/i);
  for (const [name, fields] of Object.entries({
    Switches: ['Device Label', 'Model', 'Status', 'Role', 'Port Capacity (Active)', 'IP Address'], Outages: ['Started', 'Restored', 'Source', 'Review State', 'Incident Started', 'Incident Restored', 'Site / Location', 'Circuit Name', 'Provider'],
    'Change Log': ['Change Date', 'Change Name', 'Category', 'System / Area', 'Status'],
    Contacts: ['Status', 'Email', 'Phone', 'Organization', 'Role / Title', 'Category']
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
  const nonsecretColumns = ['Name', 'Asset / System', 'Server Location'].map(field => camera.data[0].indexOf(field) + 1);
  assert.deepEqual(ranges, nonsecretColumns.map(col => [col, 1]));
  h.invoke('saveAppUser', [{ email: operator.user, active: true, role: 'user', defaultPermission: 'none',
    permissions: { securityCameras: 'edit' } }], admin);
  const data = load(['securityCameras'], operator);
  assert.deepEqual(data.sections[0].rows, [
    ['', '', '', '192.0.2.91', 'camera.viewer'], ['', '', '', '2001:db8::92', ''], ['', '', '', '', 'operator']
  ]);
  assert.deepEqual(new Set(ranges.map(([col]) => col)), new Set([...nonsecretColumns, addressCol, usernameCol]));
  assert.ok(ranges.every(([, width]) => width === 1));
  assert.ok(!reads.some(([row, col, count]) => col === addressCol && row <= 4 && row + count > 4),
    'formula-backed value must not be requested');
  assert.doesNotMatch(JSON.stringify(data), /CANARY|192\.0\.2\.93|:::|sk_fixture|wrong/);
  assert.equal(data.sections[0].credentialsOmitted, true);
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
  assert.deepEqual(viewer.sections.find(page => page.key === 'routes').rows, [['', '12', '', '2001:db8:1::/64', '2001:db8:1::1', '']]);
  assert.ok(viewer.sections.find(page => page.key === 'internetWan').rows.some(row => row.includes('203.0.113.0/24')));
  assert.deepEqual(viewer.sections.find(page => page.key === 'accessPoints').rows, [['Unvalidated', '', '', 'Online', '', '']]);
  assert.doesNotMatch(JSON.stringify(viewer), /CANARY|192\.0\.2\.20|192\.0\.2\.77/);
});

test('Playbook separates empty, failed and unavailable sections while returning eligible rows', () => {
  const h = fixture();
  h.invoke('saveAppUser', [{ email: 'partial-print@example.test', active: true, role: 'user',
    defaultPermission: 'none', permissions: { switches: 'view', ssids: 'view', networkClosets: 'view', securityCameras: 'view' } }]);
  h.sheets.get('Network Closets').getRange = () => { throw new Error('PRIVATE_ENVIRONMENT_DETAIL'); };
  // Ensure a backing read is attempted for the failed section.
  h.records('Network Closets', [{ 'Closet ID': 'FIXTURE', Type: 'MDF' }]);
  const result = plain(h.invoke('appGetStandardPlaybook', [[
    'switches', 'networkClosets', 'ssids', 'securityCameras', 'internetWan'
  ]], { user: 'partial-print@example.test' }));
  assert.deepEqual(result.sections.map(section => section.key), ['switches', 'securityCameras']);
  assert.deepEqual(Object.fromEntries(result.exclusions.map(section => [section.key, section.reason])), {
    networkClosets: 'failed', ssids: 'empty'
  });
  assert.equal(result.unavailableCount, 1);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_ENVIRONMENT_DETAIL|Internet \/ WAN|fixture-user/);
  assert.ok(!h.calls.some(call => call.sheet === 'Internet WAN'));
  // Confirm that a missing backing sheet isn't advertised as an empty section.
  h.sheets.delete('SSIDs');
  const missing = plain(h.invoke('appGetStandardPlaybook', [['ssids']], { user: 'partial-print@example.test' }));
  assert.equal(missing.sections.length, 0);
  assert.deepEqual(missing.exclusions, [{ key: 'ssids', label: 'SSIDs', reason: 'failed' }]);
});

test('all inventory sections expose recovery context from their schema but never excluded values', () => {
  const h = createHarness();
  const seed = (sheet, values) => h.records(sheet, [values]);
  seed('Access Points', { 'Device Label': 'Campus AP-07', Campus: 'East Campus', Model: 'Aruba AP-635',
    Status: 'Online', 'MAC Address': '02-00-00-00-00-07', 'Management Mode': 'Central',
    'IP Address': '192.0.2.75', 'Virtual Controller': 'Name: Lab | IP: 192.0.2.76' });
  const host = 'b8548f56-4b0e-4ee7-813a-7a258fa27a11';
  const guest = 'b8548f56-4b0e-4ee7-813a-7a258fa27a12';
  seed('Servers', { 'Server Name': 'Example HV01', Type: 'Physical', Status: 'Online', Location: 'Server Room',
    'Operating System': 'Windows Server 2022', 'IP Address': '192.0.2.81', 'Closet ID': 'CLOSET-0003',
    'Network HQ Server ID': host });
  seed('Offline Servers', { 'Server Name': 'Example VM01', Type: 'Virtual', Status: 'Offline', 'Offline Since': '2026-11-01',
    'Network HQ Server ID': guest, 'Network HQ VM Host ID': host });
  seed('Network Closets', { 'Closet ID': 'CLOSET-0003', Campus: 'East Campus', 'Closet / Room Name': 'East MDF', 'Room Number': 107,
    Type: 'MDF', 'Electrical Circuit / Panel': 'Panel A / 7', 'Outlet / Connector Type': 'L5-30R',
    'Redundant Power Available': 'Yes', 'Power Notes': 'TEST_NOTE_CANARY' });
  seed('Network Closet UPS', { 'UPS ID': 'CLOSET-0003-UPS-01', 'Closet ID': 'CLOSET-0003', Manufacturer: 'APC', Model: 'SMT3000RM2U',
    'Capacity / VA': 3000, 'Management IP': '192.0.2.4', 'Battery Replacement Date': '2026-08-06', 'Last Service Date': '2026-09-07' });
  seed('IP Route Tables', { 'Campus / Location': 'East Campus', 'VLAN Name': 'Voice', 'VLAN ID': '8',
    'Network / CIDR': '198.51.100.0/24', Gateway: '198.51.100.1', 'DHCP Scope / Pool': '198.51.100.20 - 198.51.100.80' });
  seed('Internet WAN', { 'Circuit Name': 'East Fiber', 'Site / Location': 'East Campus',
    Provider: 'Example Telecom', Status: 'Active', Role: 'Primary', 'Service Type': 'Fiber',
    Bandwidth: '1 Gbps / 500 Mbps', 'Public Network / CIDR': '203.0.113.0/24', Gateway: '203.0.113.1',
    'Circuit / Account ID': 'TEST_CIRCUIT_CANARY', 'Public IPs': '192.0.2.231' });
  seed('Security Cameras', { Name: 'East Recorder', 'Asset / System': 'VMS', 'Server Location': 'Room 206',
    'IP Address': '192.0.2.234', Username: 'local.viewer', Password: 'TEST_PASSWORD_CANARY' });
  const bus = h.sheets.get('Bus Cameras').data;
  const busValues = { 'Bus Name/Number': 'Bus 08', 'Bus Type': 'Transit', 'DVR Type': 'X2 DVR',
    'Bridge Mac': '020000000009', 'DVR IP': '192.0.2.78', 'Bridge IP': '192.0.2.79' };
  bus.push(bus[6].map(field => busValues[field] || ''));
  seed('Intercom Bell System', { Location: 'East Main Office', 'VLAN Name': 'Voice', 'VLAN ID': 8,
    'IP Address': '192.0.2.77', Subnet: '198.51.100.0/24', Gateway: '198.51.100.1',
    'Subnet Mask': '255.255.255.0', Port: 443, Username: 'local.viewer', Password: 'TEST_PASSWORD_CANARY' });
  seed('SSIDs', { SSID: 'Example-Staff', Status: 'Enabled', 'Primary Usage': 'Employee', 'Bands / Radio Bands': '2.4 / 5 GHz',
    'Security Level': 'Enterprise', 'Key Management': 'WPA2/WPA3-Enterprise',
    VLAN: 8, 'Client VLAN Assignment': 'Static', Password: 'TEST_WIFI_CANARY' });
  seed('Outages', { Started: '2026-11-01T12:00:00Z', Restored: '2026-11-01T13:00:00Z', Source: 'Manual',
    'Site / Location': 'East Campus', 'Circuit Name': 'East Fiber', Provider: 'Example Telecom', Notes: 'TEST_NOTE_CANARY' });
  seed('Change Log', { 'Change Date': '2026-11-01', 'Change Name': 'Core maintenance', 'System / Area': 'Servers',
    Category: 'Other', Status: 'Implemented', Summary: 'TEST_SUMMARY_CANARY' });
  seed('Contacts', { Organization: 'Example Telecom', 'Role / Title': 'Priority Support', Category: 'Vendor',
    Status: 'Active', Email: 'support@example.test', Phone: '202-555-0130' });
  seed('Backup Schedule', { 'Server Name': 'Example HV01', 'Backup Job Name': 'Example Weekly',
    'Backup Time': 'Sun at 9 PM', 'Target Location': 'Example Vault', 'Wasabi Job': 'Offsite Copy',
    'Wasabi Schedule': 'Daily at 02:30', Size: '1.5 TB', Notes: 'TEST_BACKUP_CANARY' });
  const keys = ['accessPoints', 'servers', 'networkClosets', 'routes', 'internetWan', 'securityCameras',
    'busCameras', 'intercom', 'ssids', 'outages', 'changeLog', 'contacts', 'backups'];
  const load = user => plain(h.invoke('appGetStandardPlaybook', [keys], { user, readonly: true }));
  const editor = load('admin@example.test');
  assert.deepEqual(editor.exclusions, []);
  assert.deepEqual(new Set(editor.sections.map(section => section.key)), new Set(keys));
  const section = key => editor.sections.find(section => section.key === key);
  const includes = (key, ...expected) => assert.ok(section(key).rows.some(row => expected.every(cell => row.includes(cell))), key);
  includes('accessPoints', 'Campus AP-07', 'Aruba AP-635', '02:00:00:00:00:07', '192.0.2.75');
  includes('servers', 'Example VM01', 'Example HV01', 'Virtual', 'Offline');
  includes('networkClosets', 'East MDF', 'CLOSET-0003', 'Panel A / 7', 'L5-30R', 'Yes');
  assert.equal(section('networkClosets').additionalTables[0].label, 'UPS inventory');
  assert.ok(section('networkClosets').additionalTables[0].rows[0].includes('192.0.2.4'));
  includes('routes', 'Voice', '8', '198.51.100.20 – 198.51.100.80');
  includes('internetWan', 'East Fiber', 'East Campus', 'Example Telecom', '1 Gbps / 500 Mbps');
  includes('securityCameras', 'East Recorder', 'VMS', 'Room 206', 'local.viewer');
  includes('busCameras', 'Bus 08', 'Transit', 'X2 DVR', '02:00:00:00:00:09');
  includes('intercom', 'East Main Office', 'Voice', '198.51.100.0/24', '443');
  includes('ssids', 'Example-Staff', 'Employee', 'Enterprise', 'WPA2/WPA3-Enterprise', '2.4 / 5 GHz');
  includes('outages', 'East Campus', 'East Fiber', 'Example Telecom', 'Manual');
  includes('changeLog', 'Core maintenance', 'Servers', 'Other', 'Implemented');
  includes('contacts', 'Example Telecom', 'Priority Support', 'Vendor', 'support@example.test', '+1 202-555-0130');
  includes('backups', 'Example HV01', 'Example Weekly', 'Sun at 9 PM', 'Example Vault', 'Offsite Copy', 'Daily at 02:30', '1.5 TB');
  assert.deepEqual(new Set(editor.sections.filter(section => section.credentialsOmitted).map(section => section.key)),
    new Set(['securityCameras', 'intercom', 'ssids']));
  assert.doesNotMatch(JSON.stringify(editor), /CANARY|b8548f56|192\.0\.2\.(76|231)/);
  const viewer = JSON.stringify(load('viewer@example.test'));
  assert.match(viewer, /Example-Staff|East Recorder|Example HV01|198\.51\.100\.1/);
  assert.doesNotMatch(viewer, /192\.0\.2\.|local\.viewer|Mgmt IP|Username/);
});

test('secret header notes inspect only header names and narrow operational fields reject unsafe free text', () => {
  const h = createHarness();
  const backup = h.sheets.get('Backup Schedule');
  const values = {
    'Server Name': 'smb://user:private@example.test/server',
    'Backup Job Name': 'Bearer HiddenValue',
    'Backup Time': '24:10',
    'Target Location': 'https://user:private@example.test/bucket',
    'Wasabi Job': 'Example Copy',
    'Wasabi Schedule': '=A2',
    'Encryption Key': 'BACKUP_KEY_CANARY',
    'ClientSecret': 'EXCLUDED_SECRET_CANARY',
    Notes: 'DO NOT PRINT'
  };
  backup.data[0].push('Encryption Key', 'ClientSecret');
  h.records('Backup Schedule', [values]);
  const getRange = backup.getRange.bind(backup);
  backup.getRange = (row, column, ...rest) => {
    if (row > 1) assert.ok(!['Encryption Key', 'ClientSecret', 'Notes'].includes(backup.data[0][column - 1]));
    return getRange(row, column, ...rest);
  };
  const data = plain(h.invoke('appGetStandardPlaybook', [['backups', 'switches']], { readonly: true }));
  assert.deepEqual(data.sections[0].rows, [['', '', '', '', 'Example Copy', '', '']]);
  assert.equal(data.sections[0].credentialsOmitted, true);
  assert.doesNotMatch(JSON.stringify(data), /private|CANARY|A2|Bearer|24:10/);
});
