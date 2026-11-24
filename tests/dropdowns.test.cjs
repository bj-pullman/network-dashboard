const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const owner = { user: 'admin@example.test' };
const viewer = { user: 'viewer@example.test' };
const json = value => JSON.stringify(value);
const copy = value => JSON.parse(json(value));
const choices = (h, page, field) => Array.from(
  h.invoke('appGetPageData', [page, false], owner).suggestedOptions[field]);
const readRow = (h, name, row = 2) => {
  const data = h.sheets.get(name).data;
  return Object.fromEntries(data[0].map((header, i) => [header, data[row - 1]?.[i] ?? '']));
};

test('settings-managed business options clean duplicates and blank entries in order, with admin-only writes', () => {
  const h = createHarness();
  assert.throws(() => h.invoke('saveAppSettings', [{ 'contacts.categories': '["Fixture Choice"]' }], viewer), /Administrator/);
  assert.throws(() => h.invoke('appGetPageData', ['settings', false], viewer), /Administrator/);
  h.invoke('saveAppSettings', [{
    'contacts.categories': json(['  Response  ', '', 'response', 'Other', ' Coordination ', 'other', '  ']),
    'servers.types': json(['Physical', ' Appliance ', 'appliance']),
    'change_log.categories': json([' Inspection ', 'PROJECT', 'project']),
    'change_log.system_areas': json(['  Operations  '])
  }], owner);
  const settings = h.invoke('getSettingsPageData_', [], owner).settings;
  assert.equal(settings.values['contacts.categories'], '["Response","Coordination"]');
  assert.deepEqual(copy(settings.dropdownLists), {
    'change_log.categories': ['Inspection', 'PROJECT', 'Other'],
    'change_log.system_areas': ['Operations', 'Other'],
    'contacts.categories': ['Response', 'Coordination', 'Other'],
    'servers.types': ['Physical', 'Appliance', 'Other']
  });
  assert.deepEqual(choices(h, 'contacts', 'Category'), ['Response', 'Coordination', 'Other']);
  assert.deepEqual(choices(h, 'servers', 'Type'), ['Physical', 'Appliance', 'Other']);
  assert.deepEqual(choices(h, 'changeLog', 'Category'), ['Inspection', 'PROJECT', 'Other']);
  assert.deepEqual(copy(h.invoke('getChangeLogConfiguredOptions_')), {
    Category: ['Inspection', 'PROJECT', 'Other'], 'System / Area': ['Operations', 'Other']
  });
  h.invoke('saveAppSettings', [{ 'contacts.categories': json([' ', 'Other']) }], owner);
  assert.deepEqual(choices(h, 'contacts', 'Category'),
    ['Vendor', 'Support', 'Contractor', 'Service Provider', 'Partner', 'Other']);
});

test('invalid edits are rejected before saving, and system roles, permissions and statuses stay fixed', () => {
  const h = createHarness();
  const before = json(h.sheets.get('App Settings').data);
  for (const malformed of ['{"name":"Not a list"}', '[23]', 'malformed', json(['=TEST()']),
    json(['Segment\nSegment']), json(['a'.repeat(81)]), json(Array.from({ length: 41 }, (_, n) => 'Option ' + n))]) {
    assert.throws(() => h.invoke('saveAppSettings', [{
      'organization.name': 'Should not be written', 'servers.types': malformed
    }], owner), /Server Types/);
    assert.equal(json(h.sheets.get('App Settings').data), before);
  }
  for (const name of ['app.roles', 'app.permissions', 'change_log.statuses', 'servers.statuses', 'contacts.statuses']) {
    assert.throws(() => h.invoke('saveAppSettings', [{ [name]: '["Unsupported"]' }], owner), /cannot be edited/);
  }
  assert.deepEqual(Array.from(h.invoke('getControlledOptions_', ['appRole'])), ['user', 'admin']);
  assert.deepEqual(Array.from(h.invoke('getControlledOptions_', ['appPermission'])), ['view', 'edit', 'none']);
  assert.deepEqual(Array.from(h.invoke('getControlledOptions_', ['changeStatus'])), [
    'Implemented', 'Monitoring', 'Rolled Back', 'Retired'
  ]);
  assert.deepEqual(Array.from(h.invoke('getControlledOptions_', ['contactStatus'])), ['Active', 'Inactive']);
});

test('changing the option lists and editing unrelated fields preserve raw historical values on both server sheets and business tables', () => {
  const h = createHarness();
  const originals = {
    Contacts: { 'Contact Name': 'Legacy Contact', Category: '  Legacy Contact Type  ', Status: 'Active' },
    Servers: { 'Server Name': 'Legacy Server', Type: 'historical class', Status: 'Online' },
    'Offline Servers': { 'Server Name': 'Offline Fixture', Type: '', Status: 'Offline' },
    'Change Log': { 'Change Date': '2026-11-23', 'Change Name': 'Old Fixture', 'System / Area': '=FIXTURE_FORMULA()',
      Category: 'Other', Status: 'Monitoring', Notes: 'Historical note' }
  };
  Object.entries(originals).forEach(([sheet, row]) => h.records(sheet, [row]));
  const before = Object.keys(originals).map(name => copy(h.sheets.get(name).data));
  // Populate the table cache while the old layout and defaults are still in use.
  choices(h, 'contacts', 'Category');
  choices(h, 'servers', 'Type');
  choices(h, 'changeLog', 'Category');
  h.invoke('saveAppSettings', [{
    'contacts.categories': '["New Contact Choice"]', 'servers.types': '["New Server Choice"]',
    'change_log.categories': '["New Change Choice"]', 'change_log.system_areas': '["New Area Choice"]'
  }], owner);
  assert.deepEqual(Object.keys(originals).map(name => copy(h.sheets.get(name).data)), before);
  assert.deepEqual(choices(h, 'changeLog', 'Category'), ['New Change Choice', 'Other']);
  h.invoke('appUpdateRecord', ['contacts', 2, { 'Contact Name': 'Legacy Contact',
    Category: '  Legacy Contact Type  ', Notes: 'Contact updated' }], owner);
  h.invoke('appUpdateRecord', ['servers', 2, { 'Server Name': 'Legacy Server', Notes: 'Server updated' }, 'Servers'], owner);
  h.invoke('appUpdateRecord', ['servers', 2, { 'Server Name': 'Offline Fixture', Notes: 'Offline updated' }, 'Offline Servers'], owner);
  h.invoke('appUpdateRecord', ['changeLog', 2, { 'Change Name': 'Old Fixture', 'Change Date': '2026-11-23',
    Category: 'Other', Notes: 'Log updated' }], owner);
  assert.equal(readRow(h, 'Contacts').Category, '  Legacy Contact Type  ');
  assert.equal(readRow(h, 'Servers').Type, 'historical class');
  assert.equal(readRow(h, 'Offline Servers').Type, '');
  assert.equal(readRow(h, 'Change Log').Category, 'Other');
  assert.equal(readRow(h, 'Change Log')['System / Area'], '=FIXTURE_FORMULA()');
  assert.equal(readRow(h, 'Change Log').Status, 'Monitoring');
});

test('new forms accept selected or custom values without changing shared settings', () => {
  const h = createHarness();
  const original = choices(h, 'contacts', 'Category');
  h.invoke('appAddRecord', ['contacts', { 'Contact Name': 'New Fixture', Category: '  Local category  ' }], owner);
  h.invoke('appAddRecord', ['servers', { 'Server Name': 'New Fixture', Type: 'Virtual', Status: 'Online' }], owner);
  h.invoke('appAddRecord', ['changeLog', { 'Change Name': 'New Fixture', 'Change Date': '2026-11-23',
    Category: 'Maintenance', 'System / Area': 'Local service' }], owner);
  assert.equal(readRow(h, 'Contacts').Category, 'Local category');
  assert.equal(readRow(h, 'Servers').Type, 'Virtual');
  assert.equal(readRow(h, 'Change Log').Category, 'Maintenance');
  assert.equal(readRow(h, 'Change Log')['System / Area'], 'Local service');
  assert.deepEqual(choices(h, 'contacts', 'Category'), original);
  assert.throws(() => h.invoke('appAddRecord', ['servers', { 'Server Name': 'Invalid Fixture', Type: '=TEST()' }], owner),
    /plain text/);
  assert.throws(() => h.invoke('appAddRecord', ['contacts', { 'Contact Name': 'Invalid Fixture', Category: 'Line\nbreak' }], owner),
    /plain text/);
  assert.throws(() => h.invoke('appAddRecord', ['servers', { 'Server Name': 'Invalid Fixture', Status: 'Local Status' }], owner),
    /must be one of/);
});
