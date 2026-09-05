const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness, root } = require('./server-harness.cjs');

const plain = value => JSON.parse(JSON.stringify(value));

test('changed page defaults, schemas, and protected fields are consistent', () => {
  const h = createHarness();
  const expected = {
    switches: ['Status', 'Device Label', 'Model', 'Type', 'IP Address', 'Campus'],
    accessPoints: ['Status', 'Device Label', 'IP Address', 'Model', 'MAC Address'],
    securityCameras: ['Location', 'Asset / System', 'Username', 'Password', 'Server Location'],
    servers: ['Server Name', 'Status', 'IP Address', 'Type', 'Location'],
    routes: ['Campus / Location', 'VLAN ID', 'VLAN Name', 'Network / CIDR', 'Gateway']
  };
  for (const [key, defaults] of Object.entries(expected)) {
    const data = h.invoke('appGetPageData', [key, true]);
    assert.deepEqual(plain(data.defaultColumns), defaults, key);
    assert.ok(data.headers.every(header => !/^Legacy: /.test(header)));
  }
  const ap = h.invoke('appGetPageData', ['accessPoints']);
  for (const field of ['Type', 'Uptime', 'Port Capacity (Active)', 'Stack Info', 'Location', 'Role']) {
    assert.ok(!ap.headers.includes(field), field);
    assert.ok(ap.rows.every(row => !Object.hasOwn(row, field)), field);
  }
  const cameras = h.invoke('appGetPageData', ['securityCameras']);
  assert.ok(!cameras.headers.includes('Type') && !cameras.headers.includes('Category'));
  const intercom = h.invoke('appGetPageData', ['intercom']).sections.find(s => s.key === 'intercomSystems');
  assert.deepEqual(plain(intercom.defaultColumnTitles), ['Location', 'IP Address', 'Username', 'Password', 'Subnet', 'Port']);
  for (const title of ['Subnet', 'Subnet Mask', 'Gateway', 'Port', 'Usable IP Range']) {
    assert.equal(intercom.columns.filter(column => column.title === title).length, 1, title);
  }
  assert.ok(!JSON.stringify(intercom.rows).includes('QA_ONLY_NOT_A_REAL_SECRET'));
  const bus = h.invoke('appGetPageData', ['busCameras']).sections.find(s => s.key === 'buses');
  assert.ok(bus.columns.some(column => column.title === 'DVR Type'));
  assert.ok(bus.defaultColumnTitles.includes('DVR Type'));
  assert.equal(h.invoke('appGetPageData', ['routes']).label, 'VLANs & Routing');
});

test('header migrations retain every data cell and are idempotent, including an existing Port', () => {
  const h = createHarness();
  const schema = h.context.getNetworkDashboardSchema_();
  const fixtures = {
    'Access Points': ['Device Label', 'Type', 'Uptime', 'Location', 'Role', 'Custom Formula'],
    'Security Cameras': ['Password', 'Location', 'Type', 'Category', 'Custom Formula'],
    'Offline Servers': ['Server Name', 'Reason', 'Custom Formula'],
    'IP Route Tables': ['Destination', 'VLAN', 'Metric', 'Dist', 'Notes', 'Custom Formula'],
    'Intercom Bell System': ['Location', 'Password', 'port', 'Network / CIDR', 'Custom Formula']
  };
  for (const [name, headers] of Object.entries(fixtures)) {
    const sheet = h.sheets.get(name);
    const values = headers.map((_, index) => index === headers.length - 1 ? '=1+2' : 'original-' + index);
    sheet.data.splice(0, sheet.data.length, [...headers], [...values]);
    const result = { migrations: [] };
    h.invoke('applySchemaRefinements_', [sheet, name, schema[name], result]);
    h.invoke('ensureSchemaHeaderRow_', [sheet, name, schema[name].headers, schema[name].headers, 1, 1, true]);
    assert.deepEqual(sheet.data[1], values, name + ': data untouched');
    assert.ok(schema[name].headers.every(header => sheet.data[0].includes(header)), name);
    const after = JSON.stringify(sheet.data);
    h.invoke('applySchemaRefinements_', [sheet, name, schema[name], result]);
    h.invoke('ensureSchemaHeaderRow_', [sheet, name, schema[name].headers, schema[name].headers, 1, 1, true]);
    assert.equal(JSON.stringify(sheet.data), after, name + ': repeat setup');
  }
  assert.equal(h.sheets.get('Intercom Bell System').data[0].filter(header => header === 'Port').length, 1);
  const routes = h.sheets.get('IP Route Tables');
  assert.equal(routes.data[0][0], 'Network / CIDR');
  assert.equal(routes.data[0][2], 'Legacy: Metric');
  assert.equal(routes.data[1][routes.data[0].indexOf('DHCP Scope / Pool')], undefined);
  const bus = h.sheets.get('Bus Cameras');
  bus.data[6] = ['Bus Name/Number', 'DVR IP', 'Bridge IP', 'Bridge Mac', 'Bus Type', 'Notes', 'Custom'];
  bus.data[7] = ['101', '10.1.1.5', '', '', '', 'Keep me', '=1+2'];
  const headers = schema['Bus Cameras'].headerRanges[0].headers;
  h.invoke('ensureSchemaHeaderRow_', [bus, 'Bus Cameras', headers, headers, 7, 1, true]);
  assert.equal(bus.data[6][7], 'DVR Type');
  assert.equal(bus.data[7][5], 'Keep me');
  assert.equal(bus.data[7][6], '=1+2');
});

test('retired data is hidden before and after setup without writing on page reads', () => {
  const h = createHarness();
  const sheet = h.sheets.get('Security Cameras');
  sheet.data[0].push('Category', 'Legacy: Type');
  sheet.data[1].push('retired-category-value', 'retired-type-value');
  const data = h.invoke('appGetPageData', ['securityCameras', true]);
  assert.ok(!JSON.stringify(data).includes('retired-category-value'));
  assert.ok(!JSON.stringify(data).includes('retired-type-value'));
  assert.deepEqual(h.calls.filter(call => /^(set|clear|append|insert|delete)/.test(call.name)), []);
});

test('new Bus DVR and Intercom addressing fields save by header without changing credentials', () => {
  const h = createHarness();
  for (const [key, name, section, rowNumber, edits] of [
    ['busCameras', 'Bus Cameras', 'buses', 8, { 'Bus Name/Number': '101', 'DVR Type': '8-channel NVR' }],
    ['intercom', 'Intercom Bell System', 'intercomSystems', 2, {
      Location: 'Test Site', Subnet: '10.1.0.0/24', 'Subnet Mask': '255.255.255.0',
      Gateway: '10.1.0.1', Port: '443', 'Usable IP Range': '10.1.0.1 - 10.1.0.254', Password: ''
    }]
  ]) {
    const sheet = h.sheets.get(name), headers = sheet.data[key === 'busCameras' ? 6 : 0];
    if (!sheet.data[rowNumber - 1]) sheet.data[rowNumber - 1] = headers.map(() => '');
    const passwordColumn = headers.indexOf('Password');
    if (passwordColumn >= 0) sheet.data[rowNumber - 1][passwordColumn] = 'fixture-existing-secret';
    h.invoke('appUpdateRecord', [key, rowNumber, { ...edits, _section: section }]);
    for (const [field, value] of Object.entries(edits)) if (field !== 'Password') {
      assert.equal(sheet.data[rowNumber - 1][headers.indexOf(field)], value, key + ': ' + field);
    }
    if (passwordColumn >= 0) assert.equal(sheet.data[rowNumber - 1][passwordColumn], 'fixture-existing-secret');
  }
});

test('legacy camera conversion keeps credentials aligned and stops before edits when backup fails', () => {
  const h = createHarness();
  const values = Array.from({ length: 21 }, () => []);
  values[0] = ['Site', 'IP', 'User', 'Password', 'Server Location', 'Notes'];
  values[1] = ['Old Site', '10.0.0.1', 'old-user', 'old-secret', 'Old Server', 'Keep notes'];
  values[12] = [...values[0]];
  values[18] = ['Site', 'IP', 'Type', 'User', 'Server Location', 'Notes'];
  values[19] = ['Software Site', '10.0.0.2', 'Recorder Console', 'console-user', 'Server', 'Notes'];
  const rows = h.context.buildUnifiedSecurityCameraRows_(values);
  assert.deepEqual(plain(rows[0]), ['Old Site', '', '10.0.0.1', 'old-user', 'old-secret', 'Old Server', 'Keep notes']);
  assert.equal(rows[1][1], 'Recorder Console');
  const sheet = h.sheets.get('Security Cameras');
  sheet.data.splice(0, sheet.data.length, ...values);
  sheet.getParent = () => ({ getSheetByName: () => null });
  sheet.copyTo = () => { throw new Error('fixture backup failure'); };
  const before = JSON.stringify(sheet.data);
  assert.throws(() => h.invoke('migrateLegacySecurityCamerasIfNeeded_', [
    sheet, 'Security Cameras', h.context.getNetworkDashboardSchema_()['Security Cameras'], { migrations: [], warnings: [] }
  ]), /backup could not be created/);
  assert.equal(JSON.stringify(sheet.data), before);
});

test('server integrations project headers and values from cached data using only enablement state', () => {
  const h = createHarness();
  h.records('Servers', [{ 'Server Name': 'Integration Test', 'ThreatDown Installed': 'Yes', 'Wazuh Installed': 'Yes' }]);
  const state = h.sheets.get('App Integrations').data;
  const enabled = state[0].indexOf('Enabled');
  const id = state[0].indexOf('Integration ID');
  for (const [threatdown, wazuh] of [[false, false], [true, false], [false, true], [true, true], [false, false]]) {
    state.find(row => row[id] === 'threatdown')[enabled] = threatdown;
    state.find(row => row[id] === 'wazuh')[enabled] = wazuh;
    const data = h.invoke('appGetPageData', ['servers', false]);
    assert.equal(data.headers.includes('ThreatDown Installed'), threatdown);
    assert.equal(data.headers.includes('Wazuh Installed'), wazuh);
    assert.equal(data.rows.some(row => Object.hasOwn(row, 'ThreatDown Installed')), threatdown);
    assert.equal(data.rows.some(row => Object.hasOwn(row, 'Wazuh Installed')), wazuh);
    assert.ok(!data.headers.includes('Reason'));
    assert.ok(!h.calls.some(call => ['Switches', 'Access Points', 'UptimeRobot'].includes(call.sheet)));
  }
  const placeholder = h.context.getIntegrationRegistry_().wazuh;
  assert.deepEqual(plain(placeholder.requiredProperties), []);
  assert.equal(placeholder.supportsSync, false);
  assert.throws(() => h.invoke('saveIntegrationConfig', ['wazuh', { enabled: true }], { user: 'viewer@example.test' }), /Administrator/);
});

test('Aruba roles and stack counts normalize without assigning an invented role', () => {
  const h = createHarness();
  for (const raw of ['Commander', 'Conductor', 'master', 'PRIMARY', 'Commander / Stack']) {
    assert.equal(h.context.normalizeArubaSwitchRole_(raw), 'Commander', raw);
  }
  for (const raw of ['member', 'Standby', 'secondary', 'backup', 'slave']) {
    assert.equal(h.context.normalizeArubaSwitchRole_(raw), 'Member', raw);
  }
  for (const raw of ['Standalone', 'Core', '', 'unknown']) assert.equal(h.context.normalizeArubaSwitchRole_(raw), '');
  for (const raw of ['Yes (3 Members)', 'Yes: 3', '3']) assert.equal(h.context.normalizeArubaStackInfo_(raw), 'Yes: 3');
  for (const raw of ['No', 'Standalone', '1']) assert.equal(h.context.normalizeArubaStackInfo_(raw), 'No');
  const sheet = h.sheets.get('Switches');
  sheet.data.splice(1);
  h.invoke('processArubaDeviceSync_', ['Switches', [
    { name: 'Stack', serial: 'A', ip_address: '10.0.0.2', role: 'Member', status: 'Up', stack_id: 's1' },
    { name: 'Stack', serial: 'B', ip_address: '10.0.0.1', switch_role: 'Conductor', status: 'Up', stack_id: 's1' }
  ], [{ name: 'Another Name', stack_id: 's1', member_count: 3 }]]);
  const row = Object.fromEntries(sheet.data[0].map((header, index) => [header, sheet.data[1][index]]));
  assert.equal(row.Role, 'Commander');
  assert.equal(row['Stack Info'], 'Yes: 3');
  assert.equal(row['IP Address'], '10.0.0.1');
  assert.equal(row.Status, 'Online');
});

test('AP sync preserves identity and notes, maps Group, and joins optional VC data', () => {
  const h = createHarness();
  const sheet = h.sheets.get('Access Points');
  sheet.data.splice(1);
  const devices = [
    { serial: 'AP1', name: 'Same Name', status: 'Up', group_name: 'Campus-A', swarm_id: 'SW1', client_count: 0 },
    { serial: 'AP2', name: 'Same Name', status: 'Down', swarm_name: 'Name Only' },
    { serial: 'AP3', name: 'IP Only', status: 'Up', swarm_id: 'SW3' }
  ];
  const swarms = { SW1: { name: 'VC-A', ip_address: '10.1.0.1' }, SW3: { ip_address: '10.3.0.1' } };
  h.invoke('processArubaAccessPointSync_', [devices, swarms]);
  sheet.data[1][sheet.data[0].indexOf('Notes')] = 'Keep operator notes';
  h.invoke('processArubaAccessPointSync_', [devices, swarms]);
  assert.equal(sheet.data.length, 4);
  const rows = sheet.data.slice(1).map(row => Object.fromEntries(sheet.data[0].map((header, i) => [header, row[i]])));
  assert.equal(rows[0].Campus, 'Campus-A');
  assert.equal(rows[1].Campus, '');
  assert.equal(rows[0]['Virtual Controller'], 'Name: VC-A | IP: 10.1.0.1');
  assert.equal(rows[1]['Virtual Controller'], 'Name: Name Only');
  assert.equal(rows[2]['Virtual Controller'], 'IP: 10.3.0.1');
  assert.equal(rows[0].Notes, 'Keep operator notes');
  assert.equal(rows[0]['Active Clients'], 0);
  assert.ok(!sheet.data[0].includes('Role'));
  h.context.UrlFetchApp.fetch = () => ({ getResponseCode: () => 403 });
  assert.deepEqual(plain(h.context.getArubaSwarmMap_({})), {});
  assert.equal(h.context.formatArubaVirtualController_({ ip_address: 'AP-IP' }, {}), '');
});

test('full Aruba sync retains token rotation, AP v2 fallback, and optional bulk swarm enrichment', () => {
  const h = createHarness();
  for (const key of ['ARUBA_CLIENT_ID', 'ARUBA_CLIENT_SECRET', 'ARUBA_REFRESH_TOKEN']) h.properties.set(key, 'fixture');
  const integrations = h.sheets.get('App Integrations').data;
  integrations.find(row => row[0] === 'aruba_central')[integrations[0].indexOf('Enabled')] = true;
  const requests = [];
  h.context.UrlFetchApp.fetch = (url, options) => {
    requests.push(url);
    let code = 200, body;
    if (url.endsWith('/oauth2/token')) {
      assert.equal(options.payload.grant_type, 'refresh_token');
      body = { access_token: 'fixture-access', refresh_token: 'fixture-rotated' };
    } else {
      assert.equal(options.headers.Authorization, 'Bearer fixture-access');
      if (url.includes('/v1/switches')) body = { switches: [] };
      else if (url.includes('/v1/stacks')) body = { stacks: [] };
      else if (url.includes('network_device_inventory')) body = { devices: [] };
      else if (url.includes('/v1/aps')) { code = 404; body = {}; }
      else if (url.includes('/v2/aps')) body = { aps: [{ serial: 'FULL-SYNC', name: 'Full Sync AP', status: 'Up',
        group_name: 'Full Sync Campus', swarm_id: 'SWARM' }] };
      else if (url.includes('/v1/swarms')) body = { swarms: [{ swarm_id: 'SWARM', name: 'Full VC', ip_address: '10.0.0.1' }] };
      else throw new Error('Unexpected API URL: ' + url);
    }
    return { getResponseCode: () => code, getContentText: () => JSON.stringify(body) };
  };
  const result = h.invoke('syncArubaCentralToSheet');
  assert.equal(result.apsSynced, 1);
  assert.equal(h.properties.get('ARUBA_REFRESH_TOKEN'), 'fixture-rotated');
  assert.equal(requests.filter(url => url.includes('/swarms')).length, 1);
  const data = h.invoke('appGetPageData', ['accessPoints']);
  const row = data.rows.find(row => row['Serial Number'] === 'FULL-SYNC');
  assert.equal(row.Campus, 'Full Sync Campus');
  assert.equal(row['Virtual Controller'], 'Name: Full VC | IP: 10.0.0.1');
});

test('UptimeRobot monitor retrieval and outage normalization retain ordinary health behavior', () => {
  const h = createHarness();
  h.context.UrlFetchApp.fetch = (url, options) => {
    assert.ok(url.includes('/monitors?'));
    assert.equal(options.headers.Authorization, 'Bearer fixture-only-not-a-real-key');
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({
      monitors: ['UP', 'DOWN', 'PAUSED'].map((status, i) => ({ id: String(i + 1), friendlyName: status, status }))
    }) };
  };
  const snapshot = h.invoke('fetchUptimeRobotMonitorSnapshot_');
  assert.deepEqual(plain(snapshot.monitors.map(row => row.health).sort()), ['Down', 'Online', 'Paused']);
  const map = { byMonitorId: { '1': { 'Circuit ID': 'WAN-1', 'Circuit Name': 'Test' } } };
  const incident = { id: 'incident-1', monitorId: '1', startedAt: '2026-09-04T10:00:00Z' };
  assert.equal(h.context.normalizeUptimeRobotOutageRecord_(incident, map, new Date()).Status, 'Ongoing');
  assert.equal(h.context.normalizeUptimeRobotOutageRecord_({ ...incident, resolvedAt: '2026-09-04T11:00:00Z' },
    map, new Date()).Status, 'Restored');
});

test('setup priorities and dev seed dropdowns comply with exact validation values', () => {
  const h = createHarness();
  const schema = h.context.getNetworkDashboardSchema_();
  const workflow = h.sheets.get('Department Workflow');
  const priorityOptions = h.context.getControlledOptions_('workflowPriority');
  const seedRows = schema['Department Workflow'].seedRows.filter(row => row.row >= 23 && row.row <= 26);
  assert.deepEqual(plain(seedRows.map(row => row.values[0])), ['P1', 'P2', 'P3', 'P4']);
  workflow.getRange(23, 1, 100, 1).setDataValidation(priorityOptions);
  workflow.data[22][0] = 'P1 Critical';
  h.invoke('applySchemaRefinements_', [workflow, 'Department Workflow', schema['Department Workflow'], { migrations: [] }]);
  assert.equal(workflow.data[22][0], 'P1');
  h.invoke('applySheetControlledValidations_', [workflow, 'Department Workflow', schema['Department Workflow']]);
  assert.throws(() => workflow.getRange(27, 1).setValue('P5 Planned'), /Validation/);
  workflow.getRange(30, 1).setValue('Category');
  if (typeof h.context.devSeedSeedDepartmentWorkflow_ === 'function') {
    const seeded = [];
    h.context.devSeedSeedStructuredRows_ = (ss, schema, name, key, rows) => seeded.push(...rows);
    h.context.devSeedSeedDepartmentWorkflow_(null, schema, 'fixture', {}, {});
    seeded.filter(row => row['Priority Level']).forEach(row => {
      assert.ok(priorityOptions.includes(row['Priority Level']));
      workflow.getRange(27, 1).setValue(row['Priority Level']);
    });
    for (const [name, generator] of [['Switches', 'devSeedSwitchRows_'], ['Access Points', 'devSeedAccessPointRows_'],
      ['Servers', 'devSeedServerRows_'], ['Internet WAN', 'devSeedInternetWanRows_']]) {
      const options = h.context.getControlledOptionsForSheet_(name);
      for (const row of h.context[generator]()) for (const field of Object.keys(options)) {
        assert.ok(!row[field] || options[field].includes(row[field]), name + ': ' + field + '=' + row[field]);
      }
    }
  }
});

test('WAN Maintenance is not a supported status or KPI; monitoring health remains intact', () => {
  const h = createHarness();
  assert.deepEqual(plain(h.context.getControlledOptions_('wanStatus')), ['Active', 'Standby', 'Disabled']);
  assert.throws(() => h.context.normalizeControlledOption_('wanStatus', 'Maintenance', 'Status', true), /must be one of/);
  const data = h.invoke('appGetPageData', ['internetWan']);
  assert.ok(!Object.hasOwn(data.summary, 'maintenance'));
  assert.ok(data.rows.every(row => row.Status !== 'Maintenance'));
  assert.ok(data.rows.every(row => typeof row._monitorHealth === 'string'));
});

test('all shipped script blocks parse and no removed prefetch or save spinner calls remain', () => {
  for (const file of fs.readdirSync(root).filter(file => /\.(js|html)$/.test(file))) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    if (file.endsWith('.js')) new vm.Script(source, { filename: file });
    else for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
      if (!match[1].includes('<?')) new vm.Script(match[1], { filename: file });
    }
    if (file.endsWith('.html')) assert.ok(!source.includes('scheduleOperationalPrefetch_'), file);
  }
  assert.ok(!fs.readFileSync(path.join(root, 'Scripts.html'), 'utf8').includes('fa-spin'));
});
