// These objects live only for one Apps Script execution.
var APP_READ_CONTEXT = null;
var APP_EXECUTION_METADATA = { access: {}, modules: null, integrationState: null };

function measureAppReadStep_(name, work) {
  const started = Date.now();
  try {
    return work();
  } finally {
    if (APP_READ_CONTEXT) {
      const timings = APP_READ_CONTEXT.timings;
      timings[name] = (timings[name] || 0) + Date.now() - started;
    }
  }
}

function getReadSpreadsheet_() {
  if (APP_READ_CONTEXT && APP_READ_CONTEXT.spreadsheet) {
    return APP_READ_CONTEXT.spreadsheet;
  }
  const spreadsheet = measureAppReadStep_('spreadsheet', function() {
    return SpreadsheetApp.getActiveSpreadsheet();
  });
  if (APP_READ_CONTEXT) APP_READ_CONTEXT.spreadsheet = spreadsheet;
  return spreadsheet;
}

function getReadSheet_(sheetName) {
  const sheets = APP_READ_CONTEXT && (APP_READ_CONTEXT.sheets || (APP_READ_CONTEXT.sheets = {}));
  if (sheets && Object.prototype.hasOwnProperty.call(sheets, sheetName)) return sheets[sheetName];
  const spreadsheet = getReadSpreadsheet_();
  const sheet = measureAppReadStep_('sheetLookup', function() {
    return spreadsheet.getSheetByName(sheetName);
  });
  if (sheets) sheets[sheetName] = sheet;
  return sheet;
}

function readSheetDisplayBatch_(sheet) {
  if (!sheet) return [];
  const batches = APP_READ_CONTEXT && (APP_READ_CONTEXT.batches || (APP_READ_CONTEXT.batches = new Map()));
  if (batches && batches.has(sheet)) return batches.get(sheet);
  const range = measureAppReadStep_('dataRange', function() { return sheet.getDataRange(); });
  if (APP_READ_CONTEXT) APP_READ_CONTEXT.sheetReads += 1;
  const values = measureAppReadStep_('sheetRead', function() { return range.getDisplayValues(); });
  if (batches) batches.set(sheet, values);
  return values;
}

function finishAppReadPerformance_(context, status) {
  const timing = Object.assign({}, context.timings, {
    serverTotal: Date.now() - context.started
  });
  const result = {
    pageKey: context.pageKey,
    status: status,
    sheetReads: context.sheetReads,
    dataCache: context.dataCache || 'none',
    accessCache: context.accessCache || 'none',
    timings: timing
  };
  console.log('[Performance][' + context.pageKey + '] ' +
    Object.keys(timing).map(function(key) {
      return key + '=' + timing[key] + 'ms';
    }).join(' ') + ' sheetReads=' + context.sheetReads + ' status=' + status);
  return result;
}
