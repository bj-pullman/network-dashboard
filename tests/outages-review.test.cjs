const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');
const admin = { user: 'admin@example.test' };
const viewer = { user: 'viewer@example.test' };
const editor = { user: 'outage-editor@example.test' };
const iso = '2026-11-01T';
const base = {
  'Outage ID': 'OUT-0042', 'Circuit ID': 'WAN-FIXTURE-1', Source: 'UptimeRobot',
  Started: iso + '06:30:00Z', Restored: iso + '07:30:00Z', Status: 'Restored',
  'External Event ID': 'uptimerobot:fixture-review'
};
const page = (h, caller = admin) => h.invoke('appGetPageData', ['outages', false], caller);
const raw = (h, number) => {
  const sheet = h.sheets.get('Outages');
  return Object.fromEntries(sheet.data[0].map((key, i) => [key, sheet.data[number - 1]?.[i] ?? '']));
};
const review = (h, row, changes, caller = editor) => h.invoke('appReviewOutage', [{
  _row: row._row, outageId: row['Outage ID'], externalId: row['External Event ID'],
  reviewedAt: row['Reviewed At'], ...changes
}], caller);
const report = (h, filters = {}, caller = viewer) => h.invoke('appGetOutageHistory', [filters], caller);
const plain = value => JSON.parse(JSON.stringify(value));
function fixture() {
  const h = createHarness();
  h.invoke('saveAppUser', [{ email: editor.user, active: true, role: 'user',
    defaultPermission: 'none', permissions: { outages: 'edit' } }], admin);
  h.invoke('saveAppUser', [{ email: 'no-outages@example.test', active: true, role: 'user', defaultPermission: 'none' }], admin);
  return h;
}

test('manual incidents remain fully independent of provider configuration and only confirmed rows contribute to totals', () => {
  const h = fixture();
  h.invoke('saveIntegrationConfig', ['uptimerobot', { enabled: false, settings: {} }], admin);
  h.records('Outages', [{ ...base, Started: new Date(Date.now() - 3600000).toISOString(), Restored: '', Status: 'Ongoing' }]);
  assert.equal(page(h).integration.enabled, false);
  assert.equal(page(h).summary.active, 0);
  assert.equal(page(h).summary.reviewCount, 1);
  assert.equal(page(h).summary.durationLast30Minutes, 0);
  assert.equal(h.invoke('buildDashboardOutageData_').summary.active, 0);
  const manualStarted = new Date(Date.now() - 60 * 60000).toISOString();
  const created = h.invoke('appSaveOutage', [{ 'Circuit ID': 'WAN-FIXTURE-1', Started: manualStarted,
    Notes: 'Keep this manual note' }], editor);
  assert.equal(created.summary.total, 1);
  assert.equal(created.summary.active, 1);
  assert.equal(created.summary.last30Days, 1);
  assert.equal(created.summary.durationLast30Minutes, 60);
  assert.equal(created.summary.reviewCount, 1);
  assert.equal(report(h).rows[0][4], 'Open');
  assert.ok(!h.calls.some(call => /fetch/i.test(call.name)));
});

test('provider retries and duplicates change only monitoring times and preserve operator notes and decisions', () => {
  const h = fixture();
  const pending = { id: 'fixture-sync', monitorId: '123', startedAt: iso + '06:30:00Z' };
  const resolved = { ...pending, resolvedAt: iso + '08:00:00Z', reason: 'Provider reason' };
  const doSync = incidents => {
    const mappings = h.invoke('getInternetWanCircuitMonitorMappings_');
    return h.invoke('reconcileUptimeRobotOutageRecords_', [incidents, mappings, '2026-11-01T10:00:00Z']);
  };
  h.records('Outages', [{ 'Outage ID': 'OUT-0040', 'Circuit ID': 'WAN-FIXTURE-1', Source: 'Manual',
    Started: '2026-10-20T10:00:00Z', Restored: '2026-10-20T11:00:00Z', Notes: 'Existing manual history' }]);
  assert.equal(doSync([pending, pending]).created, 1);
  assert.equal(doSync([pending]).unchanged, 1);
  const sheet = h.sheets.get('Outages');
  sheet.data[0].push('Custom preserved column');
  sheet.data[2][sheet.data[0].indexOf('Notes')] = 'Original sheet note';
  sheet.data[2][sheet.data[0].length - 1] = '=FIXTURE_FORMULA()';
  const provider = page(h).rows.find(row => row._sourceKey === 'uptimerobot');
  review(h, provider, { state: 'Confirmed', Started: iso + '06:30:00Z',
    'Cause / Reason': 'Human reason', Notes: 'Human note' });
  assert.equal(doSync([resolved, pending, resolved]).updated, 1);
  assert.equal(doSync([pending]).unchanged, 1, 'late open payload must not reopen resolved monitoring');
  assert.equal(sheet.data.length, 3);
  assert.equal(h.scriptLock.waitCount, 5);
  assert.equal(raw(h, 3)['Custom preserved column'], '=FIXTURE_FORMULA()');
  assert.equal(raw(h, 3).Notes, 'Original sheet note');
  assert.equal(raw(h, 3)['Incident Notes'], 'Human note');
  assert.equal(raw(h, 2).Notes, 'Existing manual history');
  const approved = page(h).rows.find(row => row._sourceKey === 'uptimerobot');
  assert.equal(approved._monitoring.Status, 'Restored');
  assert.equal(approved._monitoring.Restored, '2026-11-01T08:00:00.000Z');
  assert.equal(approved.Status, 'Ongoing', 'provider closure never resolves a confirmed incident');
  assert.equal(approved.Restored, '');
  assert.equal(approved.Notes, 'Human note');
});

test('review enforces existing edit permission, rejects stale/ambiguous events, and links without double counting', () => {
  const h = fixture();
  h.records('Outages', [
    base,
    { ...base, 'Outage ID': 'OUT-0043', Source: 'Manual', 'External Event ID': '', Notes: 'Manual fixture' }
  ]);
  let pending = page(h).rows.find(row => row._sourceKey === 'uptimerobot');
  assert.throws(() => review(h, pending, { state: 'Dismissed' }, viewer), /permission/);
  assert.throws(() => review(h, pending, { state: 'Confirmed', Started: base.Started, Restored: base.Restored }),
    /already overlaps/);
  assert.throws(() => review(h, pending, { state: 'Linked', linkedId: 'OUT-9999' }), /existing manual incident/);
  review(h, pending, { state: 'Linked', linkedId: 'OUT-0043', Notes: 'Confirmed separately' });
  assert.equal(page(h).summary.total, 1);
  assert.equal(page(h).summary.reviewCount, 0);
  assert.equal(raw(h, 2)['Linked Incident ID'], 'OUT-0043');
  assert.equal(raw(h, 3).Notes, 'Manual fixture');
  assert.throws(() => review(h, pending, { state: 'Dismissed' }), /already reviewed or edited/);
  pending = page(h).rows.find(row => row._sourceKey === 'uptimerobot');
  review(h, pending, { state: 'Needs review', Notes: 'Confirmed separately' });
  assert.equal(page(h).summary.reviewCount, 1);
  h.records('Outages', [{ ...base, 'Outage ID': 'OUT-0044' }]);
  assert.throws(() => review(h, page(h).rows.find(row => row['Outage ID'] === 'OUT-0042'),
    { state: 'Confirmed', Started: base.Started }), /duplicate records/);
});

test('history uses confirmed timestamps, America/Chicago dates, DST/overnight math, and a safe allowlist', () => {
  const h = fixture();
  h.records('Outages', [
    { ...base, Notes: 'PRIVATE_FIXTURE_CANARY', 'UptimeRobot Monitor ID': 'MONITOR_FIXTURE_CANARY',
      'Circuit Name': 'CIRCUIT_FIXTURE_CANARY' },
    { ...base, 'Outage ID': 'OUT-0099', 'External Event ID': 'uptimerobot:second-fixture',
      Started: '2026-11-03T02:30:00Z', Restored: '', Status: 'Ongoing' }
  ]);
  const row = page(h).rows.find(item => item['Outage ID'] === 'OUT-0042');
  assert.equal(report(h).rows.length, 0);
  assert.throws(() => review(h, row, { state: 'Confirmed', Started: '2026-11-01T01:40', Restored: '2026-11-01T01:40',
    _timezone: 'America/Chicago' }), /occurs twice/);
  review(h, row, { state: 'Confirmed', Started: '2026-10-31T23:30', Restored: '2026-11-01T01:30',
    _timezone: 'America/Chicago', _timeOccurrences: { Restored: 'later' }, Notes: 'OPERATOR_FIXTURE_CANARY' });
  const result = report(h, { from: '2026-10-31', to: '2026-10-31', status: 'Restored' });
  assert.equal(result.timezone, 'America/Chicago');
  assert.deepEqual(plain(result.rows), [['OUT-0042', '2026-11-01T04:30:00.000Z', '2026-11-01T07:30:00.000Z',
    '180', 'Resolved', 'Reviewed monitoring event']]);
  assert.doesNotMatch(JSON.stringify(result), /CANARY|WAN-FIXTURE-1|uptimerobot:fixture|OUT-0099/);
  assert.equal(report(h, { from: '2026-11-01' }).rows.length, 0);
  assert.equal(report(h, { circuitId: 'missing' }).rows.length, 0);
  assert.throws(() => report(h, { from: '2026-02-31' }), /valid.*dates/i);
  assert.throws(() => report(h, {}, { user: 'no-outages@example.test' }), /permission/i);
  const print = h.invoke('appGetStandardPlaybook', [['outages']], admin);
  assert.equal(print.sections.find(section => section.key === 'outages').rows.length, 1);
  assert.doesNotMatch(JSON.stringify(print), /CANARY/);
});

test('schema 12 repair appends review fields and never converts historical monitoring to confirmed', () => {
  const h = fixture();
  const sheet = h.sheets.get('Outages');
  const count = sheet.data[0].indexOf('Review State');
  sheet.data[0].splice(count, 8, '', 'Custom historical column');
  h.records('Outages', [{ ...base, 'Custom historical column': '=FIXTURE_FORMULA()' }]);
  const original = plain(sheet.data);
  const settings = h.sheets.get('App Settings').data;
  settings.find(row => row[0] === 'schema.version')[settings[0].indexOf('Value')] = '12';
  h.invoke('updateNetworkDashboard', [{ silent: true }], admin);
  assert.equal(page(h).summary.reviewCount, 1);
  assert.equal(page(h).summary.total, 0);
  assert.equal(h.invoke('getAppBootstrap', [], admin).config.installedSchemaVersion, '13');
  assert.deepEqual(sheet.data.map(row => row.slice(0, original[0].length)), original);
  const after = plain(sheet.data);
  h.invoke('updateNetworkDashboard', [{ silent: true }], admin);
  assert.deepEqual(sheet.data, after);
});
