var CHANGE_LOG_DOCUMENT_METADATA_FIELDS = {
  'change date': 'Change Date',
  'change name': 'Change Name',
  'category': 'Category',
  'system / area': 'System / Area',
  'system/area': 'System / Area',
  'summary': 'Summary',
  'implemented by': 'Implemented By'
};


function extractGoogleDriveFileId_(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/i,
    /[?&]id=([a-zA-Z0-9_-]+)/i,
    /^([a-zA-Z0-9_-]{20,})$/
  ];
  for (let i = 0; i < patterns.length; i++) {
    const match = text.match(patterns[i]);
    if (match) return match[1];
  }
  return '';
}


function parseChangeLogDocumentMetadata_(text) {
  const fields = {};
  String(text || '').split(/\r?\n/).forEach(line => {
    const match = String(line).match(/^\s*([^:]{2,40})\s*:\s*(.*?)\s*$/);
    if (!match) return;
    const key = match[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const field = CHANGE_LOG_DOCUMENT_METADATA_FIELDS[key];
    if (field && !Object.prototype.hasOwnProperty.call(fields, field)) {
      fields[field] = match[2].trim();
    }
  });

  if (fields['Change Date']) {
    const parsed = parseNetworkDashboardDate_(fields['Change Date']);
    fields['Change Date'] = parsed
      ? formatNetworkDashboardDate_(fields['Change Date'], false)
      : fields['Change Date'];
  }

  const options = getChangeLogConfiguredOptions_();
  ['Category', 'System / Area'].forEach(field => {
    const value = String(fields[field] || '').trim();
    const match = (options[field] || []).find(option =>
      option.toLowerCase() === value.toLowerCase()
    );
    if (match) fields[field] = match;
  });

  return fields;
}


function findChangeLogImportByFileId_(fileId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Change Log');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0].map(value => String(value || '').trim());
  const index = headers.indexOf('Documentation File ID');
  if (index < 0) return null;
  const values = sheet.getRange(2, index + 1, sheet.getLastRow() - 1, 1)
    .getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === fileId) {
      return { row: i + 2 };
    }
  }
  return null;
}


function getMissingChangeLogImportFields_(fields) {
  return ['Change Date', 'Change Name', 'Category', 'System / Area', 'Summary', 'Implemented By']
    .filter(field => !String(fields && fields[field] || '').trim());
}


function appPreviewChangeLogDocumentation(documentUrl) {
  requirePagePermission_('changeLog', 'view');
  const fileId = extractGoogleDriveFileId_(documentUrl);
  if (!fileId) throw new Error('Enter a valid Google Doc URL.');

  let document;
  try {
    document = DocumentApp.openById(fileId);
  } catch (error) {
    throw new Error('The Google Doc could not be opened. Confirm the URL and sharing permissions.');
  }

  const fields = parseChangeLogDocumentMetadata_(document.getBody().getText());
  const canonicalUrl = 'https://docs.google.com/document/d/' + fileId + '/edit';
  fields['Documentation URL'] = canonicalUrl;

  return {
    documentTitle: document.getName(),
    documentUrl: canonicalUrl,
    fileId: fileId,
    fields: fields,
    options: getChangeLogConfiguredOptions_(),
    missingFields: getMissingChangeLogImportFields_(fields),
    duplicate: findChangeLogImportByFileId_(fileId)
  };
}


function appImportChangeLogDocumentation(payload) {
  requirePagePermission_('changeLog', 'edit');
  payload = payload || {};
  const fileId = extractGoogleDriveFileId_(payload.documentUrl || payload.fileId);
  if (!fileId || fileId !== String(payload.fileId || '')) {
    throw new Error('The source document identifier is invalid. Read the document again.');
  }

  const fields = Object.assign({}, payload.fields || {});
  const missing = getMissingChangeLogImportFields_(fields);
  if (missing.length) throw new Error('Complete required fields: ' + missing.join(', ') + '.');
  if (!parseNetworkDashboardDate_(fields['Change Date'])) {
    throw new Error('Change Date must be a valid date.');
  }
  const documentationUrl = String(fields['Documentation URL'] || '').trim() ||
    'https://docs.google.com/document/d/' + fileId + '/edit';
  if (extractGoogleDriveFileId_(documentationUrl) !== fileId) {
    throw new Error('Documentation URL must refer to the source Google Doc that was previewed.');
  }

  const lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    if (findChangeLogImportByFileId_(fileId)) {
      throw new Error('This Google Doc has already been imported into Change Log.');
    }
    fields['Documentation URL'] = documentationUrl;
    fields['Documentation File ID'] = fileId;
    fields['Imported At'] = new Date();
    fields['Import Source'] = 'Google Doc';
    if (!fields.Status) fields.Status = 'Implemented';
    appAddRecord('changeLog', fields);
  } finally {
    lock.releaseLock();
  }

  return { status: 'success', fileId: fileId };
}
