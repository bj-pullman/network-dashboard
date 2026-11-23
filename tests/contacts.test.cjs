const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const sample = {
  'Contact Name': 'Fixture Support Desk', Organization: 'Example Support Co.',
  'Role / Title': 'Service Desk', Category: 'Support', Email: 'support@example.test',
  Phone: '+1 202-555-0100', 'Alternate Email': 'backup@example.test',
  'Alternate Phone': '202-555-0101 ext. 4', 'Campus / Sites': 'Fixture Office',
  'Systems / Services': 'Help desk', Notes: 'Business hours only.\nAsk for the support desk.'
};
const sheetRow = (sheet, row) => Object.fromEntries(sheet.data[0].map((field, index) => [field, sheet.data[row - 1][index] ?? '']));

test('Contacts is additive on fresh setup and on an existing schema 10 installation', () => {
  const fresh = createHarness();
  fresh.sheets.clear();
  fresh.invoke('setupNetworkDashboard', [{ silent: true }]);
  const schema = fresh.context.getNetworkDashboardSchema_().Contacts;
  assert.deepEqual(fresh.sheets.get('Contacts').data[0], Array.from(schema.headers));
  assert.equal(fresh.invoke('getAppBootstrap').pages.find(page => page.key === 'contacts').group, 'Operations');

  const old = createHarness();
  old.sheets.delete('Contacts');
  old.records('Servers', [{ 'Server Name': 'Fixture Server', Notes: 'Keep this server' }]);
  const servers = old.sheets.get('Servers').data;
  const before = JSON.stringify(servers);
  const appSettings = old.sheets.get('App Settings').data;
  appSettings.find(row => row[0] === 'schema.version')[appSettings[0].indexOf('Value')] = '10';
  const update = old.invoke('updateNetworkDashboard', [{ silent: true }]);
  assert.ok(update.sheets.created.includes('Contacts'));
  assert.equal(old.invoke('getAppBootstrap').config.installedSchemaVersion, '11');
  const second = old.invoke('updateNetworkDashboard', [{ silent: true }]);
  assert.ok(!second.sheets.created.includes('Contacts'));
  assert.deepEqual(old.sheets.get('Contacts').data[0], Array.from(schema.headers));
  assert.equal(JSON.stringify(servers), before);
});

test('authorized Contacts editors add, update and inactivate records, while deletion is denied', () => {
  const h = createHarness();
  h.invoke('saveAppUser', [{ email: 'contact-editor@example.test', name: 'Fixture Editor',
    active: true, role: 'user', defaultPermission: 'none', permissions: { contacts: 'edit' } }]);
  const editor = { user: 'contact-editor@example.test' };
  const sheet = h.sheets.get('Contacts');
  assert.equal(h.invoke('appAddRecord', ['contacts', { ...sample, 'Contact Name': ' ' + sample['Contact Name'] + ' ' }], editor).status, 'success');
  const page = h.invoke('appGetPageData', ['contacts', true], editor);
  assert.equal(page.permission, 'edit');
  const row = page.rows[0];
  for (const [field, value] of Object.entries(sample)) assert.equal(row[field], value, field);
  assert.equal(row.Status, 'Active');
  h.invoke('appUpdateRecord', ['contacts', row._row, { 'Contact Name': sample['Contact Name'], Status: 'inactive' }], editor);
  const inactive = h.invoke('appGetPageData', ['contacts', false], editor).rows[0];
  assert.equal(inactive._row, row._row);
  assert.equal(inactive.Status, 'Inactive');
  assert.equal(inactive.Email, sample.Email);
  assert.throws(() => h.invoke('appDeleteRecord', ['contacts', row._row], editor), /Inactive instead/);
  assert.throws(() => h.invoke('appDeleteRecord', ['contacts', row._row], { user: 'admin@example.test' }), /Inactive instead/);
  assert.equal(sheetRow(sheet, row._row).Status, 'Inactive');
  h.invoke('appUpdateRecord', ['contacts', row._row, { 'Contact Name': sample['Contact Name'], Status: 'Active' }], editor);
  assert.equal(sheetRow(sheet, row._row).Status, 'Active');
});

test('Contacts applies page permissions per caller, even across cache hits', () => {
  const h = createHarness();
  h.invoke('saveAppUser', [{ email: 'no-contacts@example.test', name: 'Fixture Restricted',
    active: true, role: 'user', defaultPermission: 'view', permissions: { contacts: 'none' } }]);
  h.invoke('appAddRecord', ['contacts', sample]);
  assert.equal(h.invoke('appGetPageData', ['contacts', true]).permission, 'edit');
  const view = { user: 'viewer@example.test' };
  const none = { user: 'no-contacts@example.test' };
  const data = h.invoke('appGetPageData', ['contacts', false], view);
  assert.equal(data.permission, 'view');
  assert.equal(data.rows[0]['Contact Name'], sample['Contact Name']);
  assert.ok(!h.invoke('getAppBootstrap', [], none).pages.some(page => page.key === 'contacts'));
  assert.throws(() => h.invoke('appGetPageData', ['contacts', false], none), /permission/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', sample], view), /permission/);
  assert.throws(() => h.invoke('appUpdateRecord', ['contacts', 2, sample], view), /permission/);
});

test('Contacts accepts only managed plain business fields and never offers credential reveal', () => {
  const h = createHarness();
  const sheet = h.sheets.get('Contacts');
  sheet.data.splice(0, sheet.data.length,
    ['Contact Name', 'Organization', 'Custom Internal Field', 'Password', 'Email'],
    [sample['Contact Name'], sample.Organization, 'fixture-internal-value', 'fixture-placeholder-only', sample.Email]);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', sample]), /headers are incomplete/);
  const beforeRepair = sheet.data[1].slice();
  h.invoke('updateNetworkDashboard', [{ silent: true }]);
  h.invoke('updateNetworkDashboard', [{ silent: true }]);
  assert.deepEqual(sheet.data[1], beforeRepair);
  const before = JSON.stringify(sheet.data);
  const page = h.invoke('appGetPageData', ['contacts', false]);
  assert.ok(!page.hasCredentials);
  const payload = JSON.stringify(page);
  for (const value of ['Custom Internal Field', 'fixture-internal-value', 'fixture-placeholder-only', '"Password"']) {
    assert.ok(!payload.includes(value), value);
  }
  for (const method of ['appGetCredentials', 'appGetRowCredential']) {
    assert.throws(() => h.invoke(method, ['contacts', 'main', 2, 'Password']), /not available/);
  }
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { ...sample, Password: 'fixture-placeholder' }]), /only business directory fields/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { ...sample, Email: 'invalid email' }]), /valid email/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { ...sample, Status: 'retired' }]), /Active or Inactive/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { ...sample, Notes: '=1+1' }]), /plain text/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { ...sample, 'Contact Name': ' ' }]), /Contact Name is required/);
  assert.throws(() => h.invoke('appUpdateRecord', ['contacts', 1, sample]), /Invalid row/);
  assert.equal(JSON.stringify(sheet.data), before);
  h.invoke('appUpdateRecord', ['contacts', 2, { 'Contact Name': sample['Contact Name'], Organization: 'Fixture Updated', Email: 'new@example.test' }]);
  assert.equal(sheetRow(sheet, 2)['Custom Internal Field'], 'fixture-internal-value');
  assert.equal(sheetRow(sheet, 2).Password, 'fixture-placeholder-only');
  assert.equal(sheetRow(sheet, 2).Email, 'new@example.test');
  assert.deepEqual(h.calls.filter(call => call.name === 'setValues').map(call => call.sheet), ['Contacts', 'Contacts']);
});
