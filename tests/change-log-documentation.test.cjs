const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');
const idA = 'fixture_document_A0123456789';
const idB = 'fixture_document_B0123456789';
const url = id => 'https://docs.google.com/document/d/' + id + '/edit';
const admin = { user: 'admin@example.test' };
const viewer = { user: 'viewer@example.test' };
const editor = { user: 'doc-editor@example.test' };
const fields = {
  'Change Date': '2026-01-15',
  'Change Name': 'Fixture Documentation Change',
  Category: 'Maintenance',
  'System / Area': 'Internal Applications',
  Summary: 'Check and verify synthetic settings.',
  'Implemented By': 'Fixture Implementer'
};
const text = Object.entries(fields).map(([label, value]) => label + ': ' + value).join('\n');
const payload = (preview, updates = {}) => ({
  fileId: preview.fileId, documentUrl: preview.documentUrl, previewToken: preview.previewToken,
  fields: { ...preview.fields, ...updates }
});
function stored(h, row = 2) {
  const sheet = h.sheets.get('Change Log');
  return Object.fromEntries(sheet.data[0].map((key, i) => [key, sheet.data[row - 1][i]]));
}
function setup() {
  const h = createHarness();
  h.documents.set(idA, { title: 'Fixture Documentation A', text });
  h.documents.set(idB, { title: 'Fixture Documentation B', text });
  h.invoke('saveAppUser', [{ email: editor.user, active: true, role: 'user', defaultPermission: 'none',
    permissions: { changeLog: 'edit' } }], admin);
  h.invoke('saveAppUser', [{ email: 'doc-denied@example.test', active: true, role: 'user', defaultPermission: 'none' }], admin);
  return h;
}

test('downloadable blank template round-trips through the existing metadata parser', () => {
  const h = setup();
  const template = h.invoke('appGetChangeLogDocumentationTemplate', [], editor);
  assert.match(template.filename, /\.txt$/);
  assert.ok(Object.keys(fields).every(label => template.text.includes('\n' + label + ':\n')));
  assert.match(template.text, /YYYY-MM-DD/);
  h.documents.set(idA, { title: 'Blank Fixture Template', text: template.text });
  const blank = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], editor);
  assert.deepEqual(Array.from(blank.missingFields), Object.keys(fields));
  const populated = template.text.replace(/^(Change Date|Change Name|Category|System \/ Area|Summary|Implemented By):$/gm,
    (_, label) => label + ': ' + ({ Category: 'maintenance', 'System / Area': 'internal applications' }[label] || fields[label]));
  h.documents.set(idA, { title: 'Filled Fixture Template', text: populated.replace('System / Area:', 'System/Area:') });
  const preview = h.invoke('appPreviewChangeLogDocumentation', ['https://docs.google.com/document/u/0/d/' + idA + '/edit?fixture=1'], editor);
  assert.equal(preview.documentUrl, url(idA));
  assert.equal(preview.fields['Documentation URL'], url(idA));
  for (const [label, expected] of Object.entries(fields)) {
    if (label !== 'Change Date') assert.equal(preview.fields[label], expected);
  }
  assert.equal(h.context.parseNetworkDashboardDate_(preview.fields['Change Date']).day, 15);
  assert.equal(preview.missingFields.length, 0);
  assert.equal(preview.duplicate, null);
  assert.ok(preview.previewToken);
  assert.equal(h.sheets.get('Change Log').data.length, 1, 'preview must not add a sheet row');
});

test('import requires the existing permission and a recent preview by the same editor for the same Doc', () => {
  const h = setup();
  const denial = { user: 'doc-denied@example.test' };
  for (const user of [viewer, denial]) {
    assert.throws(() => h.invoke('appGetChangeLogDocumentationTemplate', [], user), /permission/i);
    assert.throws(() => h.invoke('appImportChangeLogDocumentation', [{}], user), /permission/i);
  }
  assert.throws(() => h.invoke('appPreviewChangeLogDocumentation', [url(idA)], denial), /permission/i);
  assert.ok(!h.calls.some(call => call.name === 'openDocument'));
  assert.throws(() => h.invoke('appPreviewChangeLogDocumentation', ['https://example.test/document/d/' + idA], editor), /valid Google Doc URL/);
  assert.ok(!h.calls.some(call => call.name === 'openDocument'));
  assert.throws(() => h.invoke('appPreviewChangeLogDocumentation', [url('missing_fixture_file_01234')], editor), /could not be opened/);
  assert.equal(h.invoke('appPreviewChangeLogDocumentation', [url(idA)], viewer).previewToken, '');
  const preview = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], editor);
  const importRecord = (value, by = editor) => h.invoke('appImportChangeLogDocumentation', [value], by);
  assert.throws(() => importRecord({ ...payload(preview), previewToken: '' }), /preview is missing or expired/);
  assert.throws(() => importRecord(payload(preview), admin), /preview is missing or expired/);
  assert.throws(() => importRecord({ ...payload(preview), fileId: idB, documentUrl: url(idB),
    fields: { ...fields, 'Documentation URL': url(idB) } }), /preview is missing or expired/);
  assert.throws(() => importRecord(payload(preview, { 'Documentation URL': url(idB) })), /must refer to the source/);
  assert.throws(() => importRecord(payload(preview, { 'Change Date': '2026-02-31' })), /valid date/);
  assert.throws(() => importRecord(payload(preview, { Summary: '' })), /required fields: Summary/);
  assert.throws(() => importRecord(payload(preview, { Summary: '=fixture formula' })), /plain text/);
  h.cache.delete('changeDocPreview:' + preview.previewToken);
  assert.throws(() => importRecord(payload(preview)), /preview is missing or expired/);
  assert.equal(h.sheets.get('Change Log').data.length, 1);
});

test('a preview correction saves metadata and provenance exactly once; manual linking remains available', () => {
  const h = setup();
  h.documents.set(idA, { title: 'Partly Filled Fixture', text: text.replace(fields.Summary, '') });
  const preview = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], editor);
  assert.deepEqual(Array.from(preview.missingFields), ['Summary']);
  const submit = payload(preview, { Summary: 'Completed in the preview', 'Import Source': 'client value',
    'Documentation File ID': idB, 'Imported At': 'client value', 'Unmanaged Column': 'ignored' });
  assert.equal(h.invoke('appImportChangeLogDocumentation', [submit], editor).status, 'success');
  assert.throws(() => h.invoke('appImportChangeLogDocumentation', [submit], editor), /already linked/);
  const row = stored(h);
  assert.equal(row['Change Date'].toISOString(), '2026-01-15T06:00:00.000Z');
  assert.equal(row['Change Name'], fields['Change Name']);
  assert.equal(row['Documentation URL'], url(idA));
  assert.equal(row['Documentation File ID'], idA);
  assert.equal(row['Import Source'], 'Google Doc');
  assert.notEqual(row['Imported At'], 'client value');
  assert.equal(row.Summary, 'Completed in the preview');
  assert.equal(row.Status, 'Implemented');
  const manual = { 'Change Date': '2026-01-16', 'Change Name': 'Existing Fixture Change' };
  h.invoke('appAddRecord', ['changeLog', { ...manual, 'Documentation File ID': idB }], editor);
  assert.equal(stored(h, 3)['Documentation File ID'], '');
  h.invoke('appUpdateRecord', ['changeLog', 3, { ...manual,
    'Documentation URL': 'https://drive.google.com/open?id=' + idB, 'Import Source': 'client value' }], editor);
  assert.equal(stored(h, 3)['Import Source'], '');
  const linked = h.invoke('appPreviewChangeLogDocumentation', [url(idB)], editor);
  assert.equal(linked.duplicate.row, 3);
  assert.equal(linked.previewToken, '');
  assert.equal(h.sheets.get('Change Log').data.length, 3);
});

test('the script-locked import rechecks after waiting and flushes before release', () => {
  const h = setup();
  const first = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], admin);
  const second = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], editor);
  const events = [];
  h.context.LockService.getDocumentLock = () => null;
  h.scriptLock.onFlush = () => events.push('flush');
  h.scriptLock.onRelease = () => events.push('release');
  h.scriptLock.onWait = () => {
    h.scriptLock.onWait = null;
    // Simulate the competing editor committing while the first editor awaits the shared lock.
    h.context.Session.getActiveUser = () => ({ getEmail: () => editor.user });
    try {
      assert.equal(h.context.appImportChangeLogDocumentation(payload(second)).status, 'success');
    } finally {
      h.context.Session.getActiveUser = () => ({ getEmail: () => admin.user });
    }
  };
  assert.throws(() => h.invoke('appImportChangeLogDocumentation', [payload(first)], admin), /already linked/);
  assert.equal(h.sheets.get('Change Log').data.length, 2);
  assert.deepEqual(events, ['flush', 'release', 'release']);
  assert.equal(h.scriptLock.waitCount, 2);
});

test('missing or duplicate storage headers stop imports before writing', () => {
  const h = setup();
  const preview = h.invoke('appPreviewChangeLogDocumentation', [url(idA)], editor);
  const sheet = h.sheets.get('Change Log');
  sheet.data[0].splice(sheet.data[0].indexOf('Documentation File ID'), 1, 'Unrelated Column');
  assert.throws(() => h.invoke('appImportChangeLogDocumentation', [payload(preview)], editor), /Update \/ Repair/);
  sheet.data[0].push('Documentation File ID', 'Documentation File ID');
  assert.throws(() => h.invoke('appImportChangeLogDocumentation', [payload(preview)], editor), /Update \/ Repair/);
  assert.equal(sheet.data.length, 1);
});
