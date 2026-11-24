var CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS = [
  'Change Date', 'Change Name', 'Category', 'System / Area', 'Summary', 'Implemented By'
];
var CHANGE_LOG_DOCUMENT_IMPORT_FIELDS = ['Documentation File ID', 'Imported At', 'Import Source'];
var CHANGE_LOG_PREVIEW_TTL_SECONDS = 900;


function appGetChangeLogDocumentationTemplate() {
  requirePagePermission_('changeLog', 'edit');
  return {
    filename: 'network-hq-change-documentation-template.txt',
    text: [
      'NETWORK HQ | CHANGE DOCUMENTATION',
      '',
      'Fill in the six labeled lines. Use YYYY-MM-DD for Change Date, and keep Summary to one line.',
      'Do not put passwords or access tokens in the document.',
      '',
      ...CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS.map(field => field + ':'),
      '',
      'Implementation details',
      'Describe the change, its purpose, and affected services.',
      '',
      'Validation',
      'Record the checks completed and the outcome.',
      '',
      'Rollback and follow-up',
      'Record the rollback approach and any follow-up actions.',
      ''
    ].join('\n')
  };
}


function extractGoogleDriveFileId_(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(?:[a-zA-Z0-9_-]{20,})$/) ||
    text.match(/^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)(?:[/?#]|$)/i) ||
    text.match(/^https:\/\/drive\.google\.com\/open\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)(?:[&#]|$)/i);
  return match ? match[1] || match[0] : '';
}


function parseChangeLogDocumentMetadata_(text) {
  const fields = {};
  const labels = new Map(CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS.map(field => [field.toLowerCase(), field]));
  labels.set('system/area', 'System / Area');
  String(text || '').split(/\r?\n/).forEach(line => {
    const match = String(line).match(/^\s*([^:]{2,40})\s*:\s*(.*?)\s*$/);
    if (!match) return;
    const key = match[1].trim().toLowerCase().replace(/\s+/g, ' ');
    const field = labels.get(key);
    if (field && !Object.prototype.hasOwnProperty.call(fields, field)) {
      fields[field] = match[2].trim();
    }
  });

  if (fields['Change Date'] && parseNetworkDashboardDate_(fields['Change Date'])) {
    fields['Change Date'] = formatNetworkDashboardDate_(fields['Change Date'], false);
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


function findChangeLogImportByFileId_(fileId, requireImportHeaders) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Change Log');
  const headers = sheet && sheet.getLastColumn()
    ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
      .map(value => String(value || '').trim())
    : [];
  if (requireImportHeaders &&
      [...CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS, ...CHANGE_LOG_DOCUMENT_IMPORT_FIELDS, 'Documentation URL', 'Status']
        .some(field => headers.indexOf(field) < 0 || headers.indexOf(field) !== headers.lastIndexOf(field))) {
    throw new Error('Change Log headers are incomplete or duplicated. Run Network HQ Update / Repair before importing.');
  }
  if (!sheet || sheet.getLastRow() < 2) return null;
  const count = sheet.getLastRow() - 1;
  const index = headers.indexOf('Documentation File ID');
  const urlIndex = headers.indexOf('Documentation URL');
  const ids = index < 0 ? [] : sheet.getRange(2, index + 1, count, 1).getDisplayValues();
  const urls = urlIndex < 0 ? [] : sheet.getRange(2, urlIndex + 1, count, 1).getDisplayValues();
  for (let i = 0; i < count; i++) {
    if (String(ids[i] && ids[i][0] || '').trim() === fileId ||
        extractGoogleDriveFileId_(urls[i] && urls[i][0]) === fileId) {
      return { row: i + 2 };
    }
  }
  return null;
}


function getMissingChangeLogImportFields_(fields) {
  return CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS.filter(field => !String(fields && fields[field] || '').trim());
}


function appPreviewChangeLogDocumentation(documentUrl) {
  const access = requirePagePermission_('changeLog', 'view');
  const fileId = extractGoogleDriveFileId_(documentUrl);
  if (!fileId) throw new Error('Enter a valid Google Doc URL.');

  let title, text;
  try {
    const document = DocumentApp.openById(fileId);
    title = document.getName();
    text = document.getBody().getText();
  } catch (error) {
    throw new Error('The Google Doc could not be opened. Confirm the URL and sharing permissions.');
  }

  const fields = parseChangeLogDocumentMetadata_(text);
  const canonicalUrl = changeLogDocumentUrl_(fileId);
  fields['Documentation URL'] = canonicalUrl;
  const duplicate = findChangeLogImportByFileId_(fileId);
  let previewToken = '';
  if (!duplicate && (access.admin || access.permissions.changeLog === 'edit')) {
    previewToken = Utilities.getUuid();
    CacheService.getScriptCache().put('changeDocPreview:' + previewToken,
      JSON.stringify({ email: access.email, fileId }), CHANGE_LOG_PREVIEW_TTL_SECONDS);
  }

  return {
    documentTitle: title,
    documentUrl: canonicalUrl,
    fileId,
    fields,
    options: getChangeLogConfiguredOptions_(),
    missingFields: getMissingChangeLogImportFields_(fields),
    duplicate,
    previewToken
  };
}


function changeLogDocumentUrl_(fileId) {
  return 'https://docs.google.com/document/d/' + fileId + '/edit';
}


function excludeChangeLogImportFields_(record) {
  const output = Object.assign({}, record);
  CHANGE_LOG_DOCUMENT_IMPORT_FIELDS.forEach(field => delete output[field]);
  return output;
}


function appImportChangeLogDocumentation(payload) {
  const access = requirePagePermission_('changeLog', 'edit');
  payload = payload || {};
  const fileId = extractGoogleDriveFileId_(payload.documentUrl || payload.fileId);
  if (!fileId || fileId !== String(payload.fileId || '')) {
    throw new Error('The source document identifier is invalid. Read the document again.');
  }

  const submitted = payload.fields || {};
  const fields = {};
  CHANGE_LOG_DOCUMENT_REQUIRED_FIELDS.forEach(field => {
    if (submitted[field] != null && typeof submitted[field] !== 'string') {
      throw new Error(field + ' must be text.');
    }
    const value = String(submitted[field] || '').trim();
    if (value.startsWith('=')) throw new Error(field + ' must be plain text, not a spreadsheet formula.');
    fields[field] = value;
  });
  const missing = getMissingChangeLogImportFields_(fields);
  if (missing.length) throw new Error('Complete required fields: ' + missing.join(', ') + '.');
  if (!parseNetworkDashboardDate_(fields['Change Date'])) throw new Error('Change Date must be a valid date.');
  if (submitted['Documentation URL'] && extractGoogleDriveFileId_(submitted['Documentation URL']) !== fileId) {
    throw new Error('Documentation URL must refer to the source Google Doc that was previewed.');
  }

  // A document lock is unavailable in the web app. Hold a script lock across
  // the fresh duplicate check, append and spreadsheet flush.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (findChangeLogImportByFileId_(fileId, true)) {
      throw new Error('This Google Doc is already linked to a Change Log record.');
    }
    const token = String(payload.previewToken || '');
    const cache = CacheService.getScriptCache();
    const cacheKey = 'changeDocPreview:' + token;
    const cached = /^[a-f0-9-]{36}$/i.test(token) ? cache.get(cacheKey) : null;
    const proof = cached ? JSON.parse(cached) : null;
    if (!proof || proof.email !== access.email || proof.fileId !== fileId) {
      throw new Error('Read the source Google Doc again before importing. The preview is missing or expired.');
    }

    fields['Documentation URL'] = changeLogDocumentUrl_(fileId);
    fields['Documentation File ID'] = fileId;
    fields['Imported At'] = new Date();
    fields['Import Source'] = 'Google Doc';
    fields.Status = 'Implemented';
    appAddRecord_('changeLog', fields);
    SpreadsheetApp.flush();
    cache.remove(cacheKey);
  } finally {
    lock.releaseLock();
  }

  return { status: 'success', fileId };
}
