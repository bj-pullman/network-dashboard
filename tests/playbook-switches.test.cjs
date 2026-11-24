const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const detailColumns = ['Device Label', 'Model', 'Status', 'Role', 'Port Capacity (Active)'];
const load = (h, user) => JSON.parse(JSON.stringify(h.invoke('appGetStandardPlaybook', [['switches']], { user, readonly: true })));

test('Switches Playbook prints recognized inventory details without giving viewers device IPs', () => {
  const h = createHarness();
  h.records('Switches', [
    { 'Device Label': 'ALD-DEMO-SW1', Model: 'Demo 48-port', Status: 'Online', Role: 'Core',
      'Port Capacity (Active)': 48, 'IP Address': '192.0.2.21' },
    { 'Device Label': 'BRK-SW-2', Model: 'Aruba CX 6200F', Status: 'Offline', Role: 'stack_member',
      'Port Capacity (Active)': '0/48 Active', 'IP Address': '192.0.2.22' },
    { 'Device Label': 'CDR-SW3', Model: 'Cisco C9300-48P', Status: 'Degraded', Role: 'conductor',
      'Port Capacity (Active)': '25 / 48 active', 'IP Address': '192.0.2.23' }
  ]);
  const editor = load(h, 'admin@example.test').sections[0];
  assert.deepEqual(editor.columns, [...detailColumns, 'IP Address']);
  assert.deepEqual(editor.rows, [
    ['ALD-DEMO-SW1', 'Demo 48-port', 'Online', 'Core', '48', '192.0.2.21'],
    ['BRK-SW-2', 'Aruba CX 6200F', 'Offline', '', '0/48 Active', '192.0.2.22'],
    ['CDR-SW3', 'Cisco C9300-48P', 'Degraded', 'Commander', '25/48 Active', '192.0.2.23']
  ]);

  const viewer = load(h, 'viewer@example.test').sections[0];
  assert.deepEqual(viewer.columns, detailColumns);
  assert.deepEqual(viewer.rows, editor.rows.map(row => row.slice(0, -1)));
  assert.doesNotMatch(JSON.stringify(viewer), /192\.0\.2\./);
});

test('Switches Playbook never fetches excluded columns or formula values and rejects opaque display text', () => {
  const h = createHarness();
  const sheet = h.sheets.get('Switches');
  sheet.data[0].push('Passwords', 'API Key');
  h.records('Switches', [
    { 'Device Label': 'SW-192-0-2-33', Model: 'Aruba 6200F; Raw note', Status: 'Online',
      Role: 'opaque-token', 'Port Capacity (Active)': '49/48 Active', 'IP Address': '192.0.2.33',
      'Serial Number': 'SECRET_CANARY_SERIAL', 'MAC Address': 'SECRET_CANARY_MAC',
      Location: 'SECRET_CANARY_LOCATION', Notes: 'SECRET_CANARY_NOTES',
      Passwords: 'SECRET_CANARY_PASSWORD', 'API Key': 'SECRET_CANARY_KEY' },
    { 'Device Label': 'ALD-SW1', Model: '=A2', Status: 'Degraded', Role: 'Access', 'Port Capacity (Active)': '999' },
    { 'Device Label': 'sw-token-1', Model: 'js9fa1ksdmks0apc', Role: 'unsupported' },
    { 'Device Label': 'SW-PASS-WORD7' }
  ]);
  const columnReads = new Set();
  const modelCol = sheet.data[0].indexOf('Model') + 1;
  const ipCol = sheet.data[0].indexOf('IP Address') + 1;
  const getRange = sheet.getRange.bind(sheet);
  sheet.getRange = (row, col, height, width) => {
    const range = getRange(row, col, height, width);
    if (row >= 2) {
      assert.equal(width, 1);
      columnReads.add(col);
      if (col === modelCol && row <= 3 && row + height > 3) {
        range.getValues = () => assert.fail('formula value was read');
      }
    }
    return range;
  };
  const editor = load(h, 'admin@example.test').sections[0];
  assert.deepEqual(editor.rows, [
    ['', '', 'Online', '', '', '192.0.2.33'],
    ['ALD-SW1', '', 'Degraded', 'Access', '', '']
  ]);
  const allowed = detailColumns.map(field => sheet.data[0].indexOf(field) + 1);
  assert.deepEqual(columnReads, new Set([...allowed, ipCol]));
  columnReads.clear();
  load(h, 'viewer@example.test');
  assert.deepEqual(columnReads, new Set(allowed));
});
