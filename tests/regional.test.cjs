const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

function createRegionalFixture(timezone = 'America/Chicago') {
  const h = createHarness({ scriptTimezone: 'Etc/UTC', spreadsheetTimezone: 'Asia/Tokyo' });
  h.invoke('saveAppSettings', [{ 'regional.timezone': timezone,
    'regional.date_format': 'yyyy-MM-dd', 'regional.time_format': 'HH:mm' }]);
  return h;
}

function outage(h, started, restored, extra = {}) {
  return h.invoke('appSaveOutage', [{ 'Circuit ID': 'WAN-FIXTURE-1', Started: started,
    Restored: restored, _timezone: 'America/Chicago', ...extra }]).rows[0];
}

test('Settings rejects invalid or ambiguous timezone identifiers without a partial save', () => {
  const h = createRegionalFixture();
  for (const timezone of ['Not/A_Zone', 'CST', '+05:30', 'America/Not_Real', '']) {
    assert.throws(() => h.invoke('saveAppSettings', [{
      'regional.date_format': 'dd/MM/yyyy', 'regional.timezone': timezone
    }]), /valid IANA timezone/);
  }
  assert.equal(h.invoke('getAppBootstrap').config.regional.dateFormat, 'yyyy-MM-dd');
  assert.equal(h.invoke('getAppBootstrap').config.regional.timezone, 'America/Chicago');
  for (const timezone of ['Asia/Kathmandu', 'America/Mexico_City', 'Etc/UTC']) {
    assert.equal(h.invoke('saveAppSettings', [{ 'regional.timezone': timezone }])
      .config.regional.timezone, timezone);
  }
  const settings = h.sheets.get('App Settings').data;
  const key = settings[0].indexOf('Key'), value = settings[0].indexOf('Value');
  const row = settings.find(item => item[key] === 'regional.timezone');
  row[value] = 'Broken/Legacy';
  h.cache.clear();
  assert.equal(h.invoke('getAppBootstrap').config.regional.timezone, 'Etc/UTC');
  const validation = h.invoke('validateNetworkDashboard', [{ silent: true }]);
  assert.match(JSON.stringify(validation), /Not a valid IANA timezone/);
  assert.equal(row[value], 'Broken/Legacy');
});

test('manual outage save uses the organization timezone and elapsed time across midnight', () => {
  const h = createRegionalFixture();
  const row = outage(h, '2026-06-01T23:45', '2026-06-02T00:15');
  assert.equal(row.Started, '2026-06-02T04:45:00.000Z');
  assert.equal(row.Restored, '2026-06-02T05:15:00.000Z');
  assert.equal(row['Duration Minutes'], '30');
  const sheet = h.sheets.get('Outages').data;
  assert.equal(sheet[1][sheet[0].indexOf('Started')], row.Started);
  assert.equal(sheet[1][sheet[0].indexOf('Restored')], row.Restored);
});

test('spring gaps reject, spring duration uses instants, and fall folds require a choice', () => {
  const h = createRegionalFixture();
  assert.throws(() => outage(h, '2026-03-08T02:30', ''), /does not exist/);
  assert.throws(() => outage(h, '2026-02-30T02:30', ''), /valid date and time/);
  assert.throws(() => outage(h, '2026-11-01T01:30', ''), /occurs twice/);
  assert.equal(h.sheets.get('Outages').data.length, 1);
  const spring = outage(h, '2026-03-08T01:30', '2026-03-08T03:30');
  assert.equal(spring['Duration Minutes'], '60');
  assert.equal(spring.Started, '2026-03-08T07:30:00.000Z');
  assert.equal(spring.Restored, '2026-03-08T08:30:00.000Z');
  const fall = outage(h, '2026-11-01T01:30', '2026-11-01T01:30',
    { _timeOccurrences: { Started: 'earlier', Restored: 'later' } });
  assert.equal(fall.Started, '2026-11-01T06:30:00.000Z');
  assert.equal(fall.Restored, '2026-11-01T07:30:00.000Z');
  assert.equal(fall['Duration Minutes'], '60');
  assert.throws(() => outage(h, '2026-11-01T01:30', '2026-11-01T01:30',
    { _timeOccurrences: { Started: 'later', Restored: 'earlier' } }), /cannot be before/);
});

test('unchanged outage wall times preserve seconds, millis, and the original fall occurrence', () => {
  const h = createRegionalFixture();
  const first = outage(h, '2026-11-01T01:30:47.123-06:00', '2026-11-01T02:30:07-06:00');
  assert.equal(first.Started, '2026-11-01T07:30:47.123Z');
  const edited = outage(h, '2026-11-01T01:30', '2026-11-01T02:30',
    { _row: first._row, Notes: 'Changed only notes' });
  assert.equal(edited.Started, first.Started);
  assert.equal(edited.Restored, first.Restored);
  assert.equal(edited.Notes, 'Changed only notes');

  h.invoke('saveAppSettings', [{ 'regional.timezone': 'America/Mexico_City' }]);
  assert.throws(() => outage(h, '2026-11-01T01:30', '2026-11-01T02:30',
    { _row: first._row }), /timezone changed/);
  assert.equal(h.invoke('appGetPageData', ['outages', true]).rows[0].Started, first.Started);
});

test('older sheet dates and offset-free ISO timestamps serialize consistently without rewriting the sheet', () => {
  const h = createRegionalFixture('America/Mexico_City');
  h.records('Outages', [{ 'Outage ID': 'OUT-FIXTURE-001', 'Circuit ID': 'WAN-FIXTURE-1',
    Started: '2026-12-01 23:45:15', Restored: new Date('2026-12-01T15:15:15Z'),
    Source: 'Manual', Status: 'Restored' }]);
  const sheet = h.sheets.get('Outages').data;
  const before = JSON.stringify(sheet);
  const row = h.invoke('appGetPageData', ['outages', true]).rows[0];
  assert.equal(row.Started, '2026-12-01T14:45:15.000Z');
  assert.equal(row.Restored, '2026-12-01T15:15:15.000Z');
  assert.equal(row['Duration Minutes'], '30');
  assert.equal(JSON.stringify(sheet), before);
  const validation = h.invoke('validateNetworkDashboard', [{ silent: true }]);
  assert.doesNotMatch(JSON.stringify(validation), /Started must be a valid date\/time/);
});

test('calendar-only Change Log entry survives differing Sheet and org zones in table and Dashboard', () => {
  const h = createRegionalFixture('America/Mexico_City');
  h.invoke('appAddRecord', ['changeLog', { 'Change Name': 'Fixture midnight rollover', 'Change Date': '2026-03-08' }]);
  const data = h.invoke('appGetPageData', ['changeLog', true]);
  assert.equal(data.rows[0]['Change Date'], '2026-03-08');
  assert.equal(h.invoke('buildDashboardRecentChanges_')[0].date, '2026-03-08');
  assert.equal(h.invoke('formatNetworkDashboardDateTime_', ['2026-03-08T06:00:00Z']),
    '2026-03-08 00:00');
});

test('inventory dates format in the organization zone, while integration payloads retain explicit instants', () => {
  const h = createRegionalFixture('America/Mexico_City');
  const instant = new Date('2026-06-02T05:30:00Z');
  h.records('Switches', [{ 'Device Label': 'Fixture switch', 'Serial Number': 'FIXTURE', 'Last Sync': instant }]);
  assert.equal(h.invoke('appGetPageData', ['switches', true]).rows[0]['Last Sync'], '2026-06-01 23:30');
  const sheet = h.sheets.get('App Integrations').data;
  const provider = sheet.find(row => row[0] === 'uptimerobot');
  provider[sheet[0].indexOf('Last Sync')] = instant;
  provider[sheet[0].indexOf('Last Attempt')] = '2026-06-02 15:00:00';
  const status = h.invoke('getIntegrationStatusById_', ['uptimerobot']);
  assert.equal(status.lastSync, '2026-06-02T05:30:00.000Z');
  assert.equal(status.lastAttempt, '2026-06-02T06:00:00.000Z');
});

test('zone resolution handles half-hour DST and non-hour offsets without runtime-timezone guesses', () => {
  const h = createRegionalFixture();
  const parse = (...args) => h.invoke('parseNetworkDashboardTimestamp_', args)?.toISOString();
  assert.equal(parse('2026-06-01T00:00', 'Asia/Kathmandu'), '2026-05-31T18:15:00.000Z');
  assert.equal(parse('2026-04-05T01:45', 'Australia/Lord_Howe'), undefined);
  const earlier = parse('2026-04-05T01:45', 'Australia/Lord_Howe', 'earlier');
  const later = parse('2026-04-05T01:45', 'Australia/Lord_Howe', 'later');
  assert.equal(Date.parse(later) - Date.parse(earlier), 30 * 60000);
  assert.equal(parse('2026-10-04T02:15', 'Australia/Lord_Howe'), undefined);
});
