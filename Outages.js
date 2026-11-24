const OUTAGES_SHEET_NAME =
  'Outages';

const OUTAGE_SOURCE_MANUAL =
  'Manual';

const OUTAGE_SOURCE_UPTIMEROBOT =
  'UptimeRobot';

const OUTAGE_SYNC_LOOKBACK_DAYS =
  365;

const OUTAGE_DASHBOARD_WINDOW_DAYS =
  30;

const OUTAGE_STALE_ONGOING_WARNING_DAYS =
  7;


const OUTAGE_REVIEW_FIELDS = [
  'Review State', 'Incident Started', 'Incident Restored', 'Incident Reason',
  'Incident Notes', 'Linked Incident ID', 'Reviewed At', 'Reviewed By'
];
const OUTAGE_PROVIDER_REFRESH_FIELDS = [
  'Started', 'Restored', 'Duration Minutes', 'Duration', 'Status'
];

function getOutageSheetHeaders_() {

  return [
    'Outage ID',
    'Circuit ID',
    'Circuit Name',
    'Site / Location',
    'Provider',
    'UptimeRobot Monitor ID',
    'Started',
    'Restored',
    'Duration Minutes',
    'Duration',
    'Source',
    'Cause / Reason',
    'Notes',
    'Status',
    'Entered By',
    'Created At',
    'Updated At',
    'External Event ID',
    ...OUTAGE_REVIEW_FIELDS
  ];
}


function getOutagesPageData_(
  forceRefresh
) {

  requirePagePermission_(
    'outages',
    'view'
  );

  const cache =
    CacheService.getScriptCache();

  const cacheKey =
    'app_page_outages';

  if (!forceRefresh) {
    const cached =
      cache.get(cacheKey);

    if (cached) {
      try {
        return decorateOutagesPageDataForAccess_(
          JSON.parse(cached)
        );
      } catch (error) {}
    }
  }

  const circuits =
    getInternetWanCircuitReferences_();

  const rows =
    readOutageRecords_(
      circuits
    );

  const result = {
    pageKey: 'outages',
    type: 'outages',
    label: 'Outages',
    sheetName:
      OUTAGES_SHEET_NAME,
    headers:
      getOutageSheetHeaders_(),
    rows:
      rows,
    totalCount:
      rows.length,
    defaultColumns:
      APP_PAGE_CONFIG.outages.defaultColumns || [],
    controlledOptions:
      getControlledOptionsForSheet_(
        OUTAGES_SHEET_NAME
      ),
    permission:
      '',
    integration:
      getOutagesUptimeRobotStatus_(),
    circuits:
      circuits,
    summary:
      buildOutageSummary_(
        rows
      )
  };

  cacheJson_(
    cacheKey,
    result,
    60
  );

  return decorateOutagesPageDataForAccess_(
    result
  );
}


function decorateOutagesPageDataForAccess_(
  data
) {

  data =
    data || {};

  data.permission =
    getPagePermission_(
      'outages'
    );

  data.integration =
    getOutagesUptimeRobotStatus_();

  return data;
}


function getOutagesUptimeRobotStatus_() {

  try {
    return getIntegrationStatusById_(
      'uptimerobot'
    );
  } catch (error) {
    return {
      enabled: false,
      configurationComplete: false,
      supportsManualSync: false,
      latestError: ''
    };
  }
}


function buildDashboardOutageData_() {

  try {

    const rows =
      readOutageRecords_(
        getInternetWanCircuitReferences_()
      );

    const summary =
      buildOutageSummary_(
        rows
      );

    return {
      summary:
        summary,
      lastUpdated:
        getLatestOutageUpdateStamp_(rows.filter(row => row._isConfirmed))
    };

  } catch (error) {

    return {
      summary: {
        total: 0,
        active: 0,
        last30Days: 0,
        durationLast30Minutes: 0,
        durationLast30Label: '0m'
      },
      lastUpdated: ''
    };

  }
}


function ensureOutagesSheet_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      OUTAGES_SHEET_NAME
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        OUTAGES_SHEET_NAME
      );
  }

  const headers =
    getOutageSheetHeaders_();

  const currentWidth =
    Math.max(
      sheet.getLastColumn(),
      headers.length,
      1
    );

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        currentWidth
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );

  if (!current.some(Boolean)) {

    sheet
      .getRange(
        1,
        1,
        1,
        headers.length
      )
      .setValues([
        headers
      ]);

  } else {

    while (
      current.length &&
      !current[current.length - 1]
    ) {
      current.pop();
    }

    headers.forEach(header => {

      if (!current.includes(header)) {
        sheet
          .getRange(
            1,
            current.length + 1
          )
          .setValue(header);

        current.push(header);
      }

    });

  }

  sheet.setFrozenRows(1);

  sheet
    .getRange(
      1,
      1,
      1,
      headers.length
    )
    .setFontWeight('bold')
    .setBackground('#17345f')
    .setFontColor('#ffffff');

  return sheet;
}


function getOutageCurrentHeaders_(
  sheet
) {

  return sheet
    .getRange(
      1,
      1,
      1,
      sheet.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(value =>
      String(value || '').trim()
    );
}


function readOutageRecords_(
  circuits
) {

  const sheet =
    getReadSheet_(OUTAGES_SHEET_NAME);

  if (!sheet) {
    return [];
  }

  const allValues = readConfiguredPageValues_(sheet, {});
  const headers = (allValues[0] || []).map(value => String(value || '').trim());

  const indexes =
    mapHeaders_(
      headers
    );

  const outputHeaders =
    getOutageSheetHeaders_();

  const values = allValues.slice(1);

  const circuitMap =
    buildCircuitReferenceMap_(
      circuits ||
      getInternetWanCircuitReferences_()
    );

  const rows = [];

  values.forEach((sourceRow, index) => {

    if (
      !rowHasMeaningfulData_(
        sourceRow,
        headers
      )
    ) {
      return;
    }

    const row = {
      _row:
        index + 2,
      _sourceSheet:
        OUTAGES_SHEET_NAME
    };

    outputHeaders.forEach(header => {

      const columnIndex =
        indexes[header];

      row[header] =
        columnIndex === undefined
          ? ''
          : isDateTimeHeader_(header)
            ? sourceRow[columnIndex]
            : String(sourceRow[columnIndex] || '');

    });

    hydrateOutageDisplayFields_(
      row,
      circuitMap
    );

    decorateOutageReview_(row, circuitMap);
    rows.push(row);

  });

  const externalIds = Object.create(null);
  rows.forEach(row => {
    const externalId = String(row['External Event ID'] || '').trim();
    if (!externalId) return;
    if (externalIds[externalId]) {
      addOutageDiagnostic_(row, 'Duplicate External Event ID.');
      addOutageDiagnostic_(externalIds[externalId], 'Duplicate External Event ID.');
    } else {
      externalIds[externalId] = row;
    }
  });

  rows.sort((left, right) =>
    Number(right._startedMs || 0) -
    Number(left._startedMs || 0)
  );

  return rows;
}


function getInternetWanCircuitReferences_() {

  const sheet =
    getReadSheet_('Internet WAN');

  if (
    !sheet
  ) {
    return [];
  }

  const values =
    readConfiguredPageValues_(
      sheet,
      APP_PAGE_CONFIG.internetWan
    );

  if (values.length < 2) {
    return [];
  }

  const headers =
    values[0].map(value =>
      String(value || '').trim()
    );

  const indexes =
    mapHeaders_(
      headers
    );

  return values
    .slice(1)
    .map((row, index) => {

      if (
        !rowHasMeaningfulData_(
          row,
          headers
        )
      ) {
        return null;
      }

      const circuitId =
        getIndexedRowValue_(
          row,
          indexes,
          'Circuit ID'
        );

      if (!circuitId) {
        return null;
      }

      return {
        _row:
          index + 2,
        circuitId:
          circuitId,
        circuitName:
          getIndexedRowValue_(
            row,
            indexes,
            'Circuit Name'
          ),
        site:
          getIndexedRowValue_(
            row,
            indexes,
            'Site / Location'
          ),
        provider:
          getIndexedRowValue_(
            row,
            indexes,
            'Provider'
          ),
        monitorId:
          getIndexedRowValue_(
            row,
            indexes,
            'UptimeRobot Monitor ID'
          )
      };

    })
    .filter(Boolean);
}


function getInternetWanCircuitMonitorMappings_() {

  return getInternetWanCircuitReferences_()
    .filter(circuit =>
      String(
        circuit.monitorId || ''
      ).trim()
    );
}


function buildCircuitReferenceMap_(
  circuits
) {

  const byCircuitId = {};

  const byMonitorId = {};

  (circuits || [])
    .forEach(circuit => {

      if (circuit.circuitId) {
        byCircuitId[circuit.circuitId] =
          circuit;
      }

      if (circuit.monitorId) {
        byMonitorId[
          String(circuit.monitorId)
        ] =
          circuit;
      }

    });

  return {
    byCircuitId:
      byCircuitId,
    byMonitorId:
      byMonitorId
  };
}


function getIndexedRowValue_(
  row,
  indexes,
  header
) {

  const index =
    indexes[header];

  return index === undefined
    ? ''
    : String(
        row[index] || ''
      ).trim();
}


function hydrateOutageDisplayFields_(
  row,
  circuitMap
) {

  const circuit =
    circuitMap &&
    circuitMap.byCircuitId
      ? circuitMap.byCircuitId[
          row['Circuit ID']
        ]
      : null;

  if (circuit) {

    row['Circuit Name'] =
      row['Circuit Name'] ||
      circuit.circuitName ||
      '';

    row['Site / Location'] =
      row['Site / Location'] ||
      circuit.site ||
      '';

    row.Provider =
      row.Provider ||
      circuit.provider ||
      '';

    row['UptimeRobot Monitor ID'] =
      row['UptimeRobot Monitor ID'] ||
      circuit.monitorId ||
      '';

  }

  const startedText =
    String(row.Started || '').trim();

  const restoredText =
    String(row.Restored || '').trim();

  const startedMs =
    parseOutageTimestampMs_(row.Started);

  const restoredMs =
    parseOutageTimestampMs_(row.Restored);

  row._diagnostics = [];

  if (!startedText) {
    addOutageDiagnostic_(row, 'Start Time is missing.');
  } else if (!startedMs) {
    addOutageDiagnostic_(row, 'Start Time is invalid.');
  }

  if (restoredText && !restoredMs) {
    addOutageDiagnostic_(row, 'End Time is invalid.');
  }

  if (startedMs && restoredMs && restoredMs < startedMs) {
    addOutageDiagnostic_(row, 'End Time is before Start Time.');
  }

  row._startedMs =
    startedMs;

  row._restoredMs =
    restoredMs;

  // RPCs and cache transport instants with offsets; leave legacy sheet cells untouched.
  row.Started = startedMs ? new Date(startedMs).toISOString() : startedText;
  row.Restored = restoredMs ? new Date(restoredMs).toISOString() : restoredText;
  ['Created At', 'Updated At'].forEach(header => {
    const epoch = parseOutageTimestampMs_(row[header]);
    row[header] = epoch ? new Date(epoch).toISOString() : String(row[header] || '');
  });

  const sourceKey = normalizeSimpleKey_(row.Source);
  const storedStatus = String(row.Status || '').trim();
  const statusKey = normalizeSimpleKey_(storedStatus);
  const hasInvalidEnd = !!restoredText && !restoredMs;

  if (sourceKey === 'uptimerobot') {
    row._ongoing =
      !!startedMs &&
      !restoredText &&
      statusKey === 'ongoing';

    if (statusKey !== 'ongoing' && statusKey !== 'restored') {
      addOutageDiagnostic_(row, 'UptimeRobot lifecycle status is missing or invalid.');
    }

    if (statusKey === 'restored' && !restoredMs) {
      addOutageDiagnostic_(row, 'Resolved UptimeRobot incident is missing End Time.');
    }

    if (
      row._ongoing &&
      Date.now() - startedMs >
        OUTAGE_STALE_ONGOING_WARNING_DAYS * 86400000
    ) {
      addOutageDiagnostic_(row, 'Old UptimeRobot incident is still marked ongoing; run sync to verify provider status.');
    }

    row.Status = statusKey === 'ongoing'
      ? 'Ongoing'
      : 'Restored';
  } else {
    row._ongoing =
      !!startedMs &&
      !restoredText &&
      !hasInvalidEnd;
    row.Status = row._ongoing ? 'Ongoing' : 'Restored';
  }

  const storedDurationText =
    String(row['Duration Minutes'] || '').trim();

  const storedDuration =
    Number(storedDurationText);

  const calculatedDuration =
    calculateOutageDurationMinutes_(
      startedMs,
      row._ongoing ? Date.now() : restoredMs
    );

  if (storedDurationText && (!Number.isFinite(storedDuration) || storedDuration < 0)) {
    addOutageDiagnostic_(row, 'Stored duration is invalid or negative.');
  }

  if (
    startedMs && restoredMs && restoredMs >= startedMs &&
    Number.isFinite(storedDuration) && storedDuration > 0 &&
    Math.abs(storedDuration - calculatedDuration) > 5
  ) {
    addOutageDiagnostic_(row, 'Stored duration disagrees with Start Time and End Time.');
  }

  let durationMinutes = '';

  if (startedMs && restoredMs && restoredMs >= startedMs) {
    durationMinutes = calculatedDuration;
  } else if (row._ongoing) {
    durationMinutes = calculatedDuration;
  } else if (
    sourceKey === 'uptimerobot' &&
    statusKey === 'restored' &&
    Number.isFinite(storedDuration) &&
    storedDuration >= 0
  ) {
    durationMinutes = storedDuration;
  }

  row._durationMinutes =
    durationMinutes;

  row['Duration Minutes'] =
    durationMinutes !== ''
      ? String(
          Math.round(durationMinutes)
        )
      : '';

  row.Duration =
    durationMinutes === ''
      ? 'Unknown'
      : formatOutageDuration_(durationMinutes);

  row._sourceKey =
    sourceKey;

  row._effectiveRestoredMs =
    restoredMs ||
    (
      sourceKey === 'uptimerobot' &&
      statusKey === 'restored' &&
      startedMs &&
      durationMinutes !== ''
        ? startedMs + durationMinutes * 60000
        : 0
    );

  return row;
}


function decorateOutageReview_(row, circuitMap) {
  const isProvider = row._sourceKey === 'uptimerobot';
  const state = String(row['Review State'] || '').trim().toLowerCase();
  row._reviewState = !isProvider ? (row._sourceKey === 'manual' ? 'Confirmed' : 'Needs review') :
    (new Map([['confirmed', 'Confirmed'], ['dismissed', 'Dismissed'], ['linked', 'Linked']]).get(state) || 'Needs review');
  row._isConfirmed = row._reviewState === 'Confirmed';
  if (isProvider) {
    row._monitoring = { Started: row.Started, Restored: row.Restored, Status: row.Status };
    row['Incident Started'] = serializeOutageReviewTime_(row['Incident Started']);
    row['Incident Restored'] = serializeOutageReviewTime_(row['Incident Restored']);
    if (row._isConfirmed) {
      const snapshot = {
        ...row,
        Source: OUTAGE_SOURCE_MANUAL,
        Started: row['Incident Started'],
        Restored: row['Incident Restored'],
        'Duration Minutes': ''
      };
      hydrateOutageDisplayFields_(snapshot, circuitMap);
      ['Started', 'Restored', 'Duration Minutes', 'Duration', 'Status', '_ongoing',
        '_startedMs', '_restoredMs', '_effectiveRestoredMs', '_durationMinutes', '_diagnostics']
        .forEach(field => { row[field] = snapshot[field]; });
      row['Cause / Reason'] = row['Incident Reason'];
      row.Notes = row['Incident Notes'];
    }
  }
  row['Reviewed At'] = serializeOutageReviewTime_(row['Reviewed At']);
  row._incidentTimeValid = !!row._startedMs && (!row.Restored ||
    (!!row._restoredMs && row._restoredMs >= row._startedMs));
}

function serializeOutageReviewTime_(value) {
  const ms = parseOutageTimestampMs_(value);
  return ms ? new Date(ms).toISOString() : String(value || '');
}


function addOutageDiagnostic_(row, message) {
  row._diagnostics = row._diagnostics || [];
  if (!row._diagnostics.includes(message)) {
    row._diagnostics.push(message);
  }
}


function buildOutageSummary_(
  rows,
  nowMs
) {

  const now =
    Number(nowMs || Date.now());

  const windowStart =
    now -
    OUTAGE_DASHBOARD_WINDOW_DAYS *
      24 *
      60 *
      60 *
      1000;

  const summary = {
    total: 0,
    reviewCount: 0,
    monitoringCount: 0,
    active: 0,
    last30Days: 0,
    durationLast30Minutes: 0,
    durationLast30Label: '0m',
    dataQualityCount: 0
  };

  const maxWindowMinutes =
    OUTAGE_DASHBOARD_WINDOW_DAYS * 24 * 60;

  (rows || [])
    .forEach(row => {

      if (row._sourceKey === 'uptimerobot') summary.monitoringCount++;
      if (row._reviewState === 'Needs review') summary.reviewCount++;
      if (row._diagnostics && row._diagnostics.length) summary.dataQualityCount++;
      if (!row._isConfirmed) return;
      summary.total++;
      if (!row._incidentTimeValid) return;
      if (row._ongoing) summary.active++;

      const startedMs =
        Number(row._startedMs || 0);

      if (!startedMs) {
        return;
      }

      if (startedMs >= windowStart && startedMs <= now) {
        summary.last30Days++;
      }

      const restoredMs = row._ongoing
        ? now
        : Number(row._effectiveRestoredMs || row._restoredMs || 0);

      if (!restoredMs) {
        return;
      }

      if (
        restoredMs < windowStart ||
        startedMs > now
      ) {
        return;
      }

      const overlapStart =
        Math.max(
          startedMs,
          windowStart
        );

      const overlapEnd =
        Math.min(
          restoredMs,
          now
        );

      const overlapMinutes = (overlapEnd - overlapStart) / 60000;

      summary.durationLast30Minutes +=
        Math.min(
          Math.max(overlapMinutes, 0),
          maxWindowMinutes
        );

    });

  summary.durationLast30Minutes =
    Math.round(
      summary.durationLast30Minutes
    );

  summary.durationLast30Label =
    formatOutageDuration_(
      summary.durationLast30Minutes
    );

  return summary;
}


// Reports are re-projected on the server; never expose arbitrary sheet columns or note text.
function appGetOutageHistory(filters) {
  requirePagePermission_('outages', 'view');
  filters = filters || {};
  const timezone = getEffectiveTimezone_();
  const now = new Date();
  const from = normalizeOutageHistoryDateFilter_(filters.from);
  const to = normalizeOutageHistoryDateFilter_(filters.to);
  if (from && to && from > to) throw new Error('Start date must be on or before end date.');
  const search = String(filters.search || '').trim().toLowerCase().slice(0, 200);
  const status = ['Ongoing', 'Restored'].includes(filters.status) ? filters.status : '';
  const source = ['Manual', 'UptimeRobot'].includes(filters.source) ? filters.source : '';
  const circuitId = String(filters.circuitId || '');
  const rows = readOutageRecords_().filter(row => {
    if (!row._isConfirmed || !row._incidentTimeValid ||
        (status && row.Status !== status) || (source && row.Source !== source) ||
        (circuitId && row['Circuit ID'] !== circuitId) ||
        (search && !outageSearchText_(row).includes(search))) return false;
    if (!from && !to) return true;
    const date = Utilities.formatDate(new Date(row._startedMs), timezone, 'yyyy-MM-dd');
    return (!from || date >= from) && (!to || date <= to);
  }).map(row => [
    /^OUT-\d{1,12}$/.test(row['Outage ID']) ? row['Outage ID'] : '',
    new Date(row._startedMs).toISOString(),
    row._ongoing ? '' : new Date(row._restoredMs).toISOString(),
    row._ongoing ? '' : String(calculateOutageDurationMinutes_(row._startedMs, row._restoredMs)),
    row._ongoing ? 'Open' : 'Resolved',
    row._sourceKey === 'uptimerobot' ? 'Reviewed monitoring event' : 'Manual'
  ]);
  return {
    generatedAt: now.toISOString(), timezone,
    columns: ['Incident', 'Started (UTC)', 'Restored (UTC)', 'Elapsed minutes', 'Status', 'Origin'],
    rows
  };
}


function normalizeOutageHistoryDateFilter_(value) {
  const text = String(value || '');
  if (!text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !parseNetworkDashboardDateOnly_(text)) {
    throw new Error('Choose valid outage history dates.');
  }
  return text;
}


function outageSearchText_(row) {
  return ['Outage ID', 'Circuit ID', 'Circuit Name', 'Site / Location', 'Provider',
    'Source', 'Cause / Reason', 'Notes', 'Status', '_reviewState'].map(field => row[field] || '')
    .join(' ').toLowerCase();
}


function getLatestOutageUpdateStamp_(
  rows
) {

  const stamps =
    (rows || [])
      .map(row =>
        (row._sourceKey === 'uptimerobot' ? row['Reviewed At'] : row['Updated At']) ||
        row['Created At'] ||
        row.Started ||
        ''
      )
      .filter(Boolean)
      .sort();

  return stamps.length
    ? stamps[stamps.length - 1]
    : '';
}


function appSaveOutage(
  record
) {

  const access =
    requirePagePermission_(
      'outages',
      'edit'
    );

  withOutageWriteLock_(() => saveManualOutageRecord_(record, access));
  return getOutagesPageData_(true);
}

function withOutageWriteLock_(operation) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const result = operation();
    SpreadsheetApp.flush();
    invalidateOutageCaches_();
    return result;
  } finally {
    lock.releaseLock();
  }
}

function writeOutageFields_(sheet, row, headers, fields) {
  let batch = [];
  let firstColumn = 0;
  const write = () => {
    if (batch.length) sheet.getRange(row, firstColumn, 1, batch.length).setValues([batch]);
    batch = [];
  };
  headers.forEach((header, index) => {
    if (!header || !Object.prototype.hasOwnProperty.call(fields, header)) { write(); return; }
    if (!batch.length) firstColumn = index + 1;
    batch.push(fields[header]);
  });
  write();
}

function saveManualOutageRecord_(record, access) {
  const sheet =
    ensureOutagesSheet_();

  const headers =
    getOutageCurrentHeaders_(
      sheet
    );

  let rowNumber =
    Number(
      record && record._row
    );

  const editing =
    Number.isInteger(rowNumber) &&
    rowNumber >= 2 &&
    rowNumber <= sheet.getLastRow();

  if (record && record._row && !editing) throw new Error('This outage moved or no longer exists. Refresh and try again.');

  const current =
    editing
      ? getOutageRowObject_(
          sheet,
          rowNumber,
          headers
        )
      : {};

  if (editing && record._outageId && current['Outage ID'] !== record._outageId) {
    throw new Error('This outage moved or changed. Refresh and try again.');
  }
  if (
    editing &&
    normalizeSimpleKey_(
      current.Source
    ) !== 'manual'
  ) {
    throw new Error(
      'UptimeRobot outage records are updated by synchronization.'
    );
  }

  const normalized =
    normalizeManualOutageRecord_(
      record || {},
      current,
      access
    );

  if (!editing) {
    rowNumber =
      sheet.getLastRow() + 1;
  }

  writeOutageFields_(sheet, rowNumber, headers, normalized);
}


function appDeleteOutage(
  rowNumber
) {

  requirePagePermission_(
    'outages',
    'edit'
  );

  withOutageWriteLock_(() => deleteManualOutageRecord_(rowNumber));
  return getOutagesPageData_(true);
}

function deleteManualOutageRecord_(rowNumber) {
  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        OUTAGES_SHEET_NAME
      );

  rowNumber =
    Number(rowNumber);

  if (
    !sheet ||
    !Number.isInteger(rowNumber) ||
    rowNumber < 2 ||
    rowNumber > sheet.getLastRow()
  ) {
    throw new Error(
      'Invalid outage row.'
    );
  }

  const headers =
    getOutageCurrentHeaders_(
      sheet
    );

  const current =
    getOutageRowObject_(
      sheet,
      rowNumber,
      headers
    );

  if (
    normalizeSimpleKey_(
      current.Source
    ) !== 'manual'
  ) {
    throw new Error(
      'UptimeRobot outage records are updated by synchronization.'
    );
  }

  if (current['Outage ID'] && readOutageRecords_().some(row =>
    row._reviewState === 'Linked' && row['Linked Incident ID'] === current['Outage ID'])) {
    throw new Error('Return linked monitoring events to review before deleting this incident.');
  }

  sheet.deleteRow(
    rowNumber
  );

}


function normalizeManualOutageRecord_(
  record,
  current,
  access
) {

  const now =
    new Date().toISOString();

  const circuitId =
    String(
      record['Circuit ID'] || ''
    ).trim();

  if (!circuitId) {
    throw new Error(
      'Circuit is required.'
    );
  }

  const circuitMap =
    buildCircuitReferenceMap_(
      getInternetWanCircuitReferences_()
    );

  const circuit =
    circuitMap.byCircuitId[
      circuitId
    ];

  if (!circuit) {
    throw new Error(
      'Selected circuit was not found in Internet / WAN.'
    );
  }

  const { started, restored, durationMinutes } = normalizeOutageIncidentTimes_(record, current);

  const outageId =
    current['Outage ID'] ||
    generateOutageId_();

  const createdAt =
    current['Created At'] ||
    now;

  return {
    'Outage ID':
      outageId,
    'Circuit ID':
      circuit.circuitId,
    'Circuit Name':
      circuit.circuitName || '',
    'Site / Location':
      circuit.site || '',
    Provider:
      circuit.provider || '',
    'UptimeRobot Monitor ID':
      circuit.monitorId || '',
    Started:
      started,
    Restored:
      restored,
    'Duration Minutes':
      durationMinutes === ''
        ? ''
        : String(
            Math.round(durationMinutes)
          ),
    Duration:
      restored
        ? formatOutageDuration_(
            durationMinutes
          )
        : '',
    Source:
      OUTAGE_SOURCE_MANUAL,
    'Cause / Reason':
      normalizeOutageOperatorText_(record['Cause / Reason'] || record.Reason, 500),
    Notes:
      normalizeOutageOperatorText_(record.Notes, 3000),
    Status:
      restored
        ? 'Restored'
        : 'Ongoing',
    'Entered By':
      current['Entered By'] ||
      access.email ||
      '',
    'Created At':
      createdAt,
    'Updated At':
      now,
    'External Event ID':
      current['External Event ID'] || ''
  };
}


function normalizeOutageIncidentTimes_(record, current) {
  const timezone = getEffectiveTimezone_();
  if (record._timezone && record._timezone !== timezone) {
    throw new Error('The organization timezone changed. Reload the page and reopen this outage.');
  }
  const occurrences = record._timeOccurrences || {};
  const started = normalizeOutageTimestamp_(record.Started, 'Started', true, timezone,
    occurrences.Started, current.Started);
  const restored = normalizeOutageTimestamp_(record.Restored, 'Restored', false, timezone,
    occurrences.Restored, current.Restored);

  const startedMs =
    parseOutageTimestampMs_(
      started
    );

  const restoredMs =
    parseOutageTimestampMs_(
      restored
    );

  if (
    restoredMs &&
    restoredMs < startedMs
  ) {
    throw new Error(
      'Restored time cannot be before Started time.'
    );
  }

  const durationMinutes =
    restoredMs
      ? calculateOutageDurationMinutes_(
          startedMs,
          restoredMs
        )
      : '';

  return { started, restored, durationMinutes };
}


function appReviewOutage(record) {
  const access = requirePagePermission_('outages', 'edit');
  record = record || {};
  const review = String(record.state || '');
  if (!['Confirmed', 'Dismissed', 'Linked', 'Needs review'].includes(review)) {
    throw new Error('Choose a valid review decision.');
  }
  withOutageWriteLock_(() => {
    const sheet = ensureOutagesSheet_();
    const headers = getOutageCurrentHeaders_(sheet);
    const rowNumber = Number(record._row);
    if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
      throw new Error('Invalid monitoring record. Refresh and try again.');
    }
    const current = getOutageRowObject_(sheet, rowNumber, headers);
    if (normalizeSimpleKey_(current.Source) !== 'uptimerobot' ||
        !record.outageId || record.outageId !== current['Outage ID'] ||
        record.externalId !== current['External Event ID']) {
      throw new Error('This monitoring record moved or changed. Refresh and try again.');
    }
    if (String(record.reviewedAt || '') !== serializeOutageReviewTime_(current['Reviewed At'])) {
      throw new Error('This monitoring record was already reviewed or edited. Refresh and try again.');
    }
    const fields = {
      'Review State': review === 'Needs review' ? '' : review,
      'Reviewed At': new Date(Math.max(Date.now(), parseOutageTimestampMs_(current['Reviewed At']) + 1)).toISOString(),
      'Reviewed By': access.email,
      'Incident Reason': normalizeOutageOperatorText_(record['Cause / Reason'], 500),
      'Incident Notes': normalizeOutageOperatorText_(record.Notes, 3000)
    };
    const all = readOutageRecords_();
    if (review === 'Confirmed' || review === 'Linked') {
      const sameEvent = all.filter(row => row._sourceKey === 'uptimerobot' &&
        row['External Event ID'] && row['External Event ID'] === current['External Event ID']);
      if (sameEvent.length > 1) throw new Error('This event has duplicate records. Review the source rows before confirming it.');
    }
    if (review === 'Confirmed') {
      const alreadyConfirmed = current['Review State'] === 'Confirmed';
      const previous = {
        Started: alreadyConfirmed ? current['Incident Started'] : current.Started,
        Restored: alreadyConfirmed ? current['Incident Restored'] : current.Restored
      };
      const times = normalizeOutageIncidentTimes_(record, previous);
      const start = parseOutageTimestampMs_(times.started), end = parseOutageTimestampMs_(times.restored);
      const overlap = all.some(row => row._row !== rowNumber && row._isConfirmed && row._incidentTimeValid &&
        row['Circuit ID'] === current['Circuit ID'] && row._startedMs < (end || Infinity) &&
        start < (row._restoredMs || Infinity));
      if (overlap) throw new Error('A confirmed incident already overlaps this time on this circuit. Link the existing manual incident instead when applicable.');
      fields['Incident Started'] = times.started;
      fields['Incident Restored'] = times.restored;
      fields['Linked Incident ID'] = '';
    } else if (review === 'Linked') {
      const matches = all.filter(row => row._sourceKey === 'manual' && row._incidentTimeValid && row['Circuit ID'] === current['Circuit ID'] &&
        row['Outage ID'] && row['Outage ID'] === record.linkedId);
      if (matches.length !== 1) throw new Error('Select an existing manual incident on the same circuit.');
      fields['Linked Incident ID'] = matches[0]['Outage ID'];
    }
    // Inactive review states leave previous operator timestamps available for history.
    writeOutageFields_(sheet, rowNumber, headers, fields);
  });
  return getOutagesPageData_(true);
}


function normalizeOutageOperatorText_(value, limit) {
  const text = String(value || '').trim();
  if (text.length > limit || text.startsWith('=')) {
    throw new Error('Enter plain-text review details within the field length limit.');
  }
  return text;
}


function syncUptimeRobotOutagesForMappedCircuits_(
  syncedAt
) {

  const mappings =
    getInternetWanCircuitMonitorMappings_();

  if (!mappings.length) {
    return {
      status: 'skipped',
      message:
        'No Internet / WAN circuits have mapped UptimeRobot monitors.',
      fetched: 0,
      created: 0,
      updated: 0,
      unchanged: 0
    };
  }

  if (
    typeof fetchUptimeRobotIncidentsForOutageSync_ !==
    'function'
  ) {
    return {
      status: 'unavailable',
      message:
        'UptimeRobot incident sync is not available.',
      fetched: 0,
      created: 0,
      updated: 0,
      unchanged: 0
    };
  }

  const startedAfter =
    new Date(
      Date.now() -
      OUTAGE_SYNC_LOOKBACK_DAYS *
        24 *
        60 *
        60 *
        1000
    ).toISOString();

  const incidents =
    fetchUptimeRobotIncidentsForOutageSync_({
      startedAfter:
        startedAfter
    });

  return reconcileUptimeRobotOutageRecords_(
    incidents,
    mappings,
    syncedAt || new Date().toISOString()
  );
}


function reconcileUptimeRobotOutageRecords_(incidents, mappings, syncedAt) {
  const circuitMap = buildCircuitReferenceMap_(mappings || []);
  return withOutageWriteLock_(() => {
    const sheet = ensureOutagesSheet_();
    const headers = getOutageCurrentHeaders_(sheet);
    const existing = getExistingOutagesByExternalId_(sheet, headers);
    let nextNumber = getMaxOutageIdNumber_(sheet, headers) + 1;
    let nextRow = sheet.getLastRow() + 1;
    // One observation per external incident: prefer a resolved event over a stale open event.
    const incoming = new Map();
    const result = {
      status: 'success', message: 'UptimeRobot monitoring events synchronized.',
      fetched: 0, created: 0, updated: 0, unchanged: 0, skipped: 0, diagnostics: []
    };
    (incidents || []).forEach(incident => {
      const provider = normalizeUptimeRobotIncident_(incident);
      const record = normalizeUptimeRobotOutageRecord_(incident, circuitMap, syncedAt, provider);
      if (!record) {
        result.skipped++;
        result.diagnostics.push({
          providerIncidentId: provider.providerIncidentId || '', monitorId: provider.monitorId || '',
          message: provider.diagnostic || 'Incident does not map to a tracked Internet/WAN circuit.'
        });
        return;
      }
      const id = record['External Event ID'];
      const previous = incoming.get(id);
      if (!previous || previous.Status !== 'Restored' || record.Status === 'Restored') incoming.set(id, record);
    });
    result.fetched = incoming.size;
    incoming.forEach((record, id) => {
      if (!existing.has(id)) {
        record['Outage ID'] = formatOutageIdNumber_(nextNumber++);
        writeOutageFields_(sheet, nextRow++, headers, record);
        result.created++;
        return;
      }
      const entry = existing.get(id);
      if (!entry) {
        result.skipped++;
        result.diagnostics.push({ message: 'Duplicate stored monitoring event; existing rows were not modified.' });
        return;
      }
      const current = entry.record;
      if (normalizeSimpleKey_(current.Status) === 'restored' && record.Status === 'Ongoing') {
        result.unchanged++;
        return;
      }
      const fields = {};
      OUTAGE_PROVIDER_REFRESH_FIELDS.forEach(field => {
        const before = field === 'Started' || field === 'Restored'
          ? serializeOutageReviewTime_(current[field]) : String(current[field] || '');
        if (before !== String(record[field] || '')) fields[field] = record[field];
      });
      if (!Object.keys(fields).length) { result.unchanged++; return; }
      fields['Updated At'] = syncedAt;
      writeOutageFields_(sheet, entry.row, headers, fields);
      result.updated++;
    });
    return result;
  });
}


function normalizeUptimeRobotOutageRecord_(
  incident,
  circuitMap,
  syncedAt,
  providerIncident
) {

  const provider =
    providerIncident ||
    normalizeUptimeRobotIncident_(incident);

  if (!provider.valid) {
    return null;
  }

  const monitorId = provider.monitorId;

  if (!monitorId) {
    return null;
  }

  const circuit =
    circuitMap.byMonitorId[
      monitorId
    ];

  if (!circuit) {
    return null;
  }

  incident = incident || {};

  const incidentId = provider.providerIncidentId;
  const started = provider.startedAt;
  const restored = provider.restoredAt;
  const durationMinutes = provider.durationMinutes;

  const externalId =
    'uptimerobot:' +
    (
      incidentId ||
      monitorId + ':' + started
    );

  const reason =
    String(
      provider.reason ||
      incident.cause ||
      ''
    ).trim();

  return {
    'Outage ID':
      '',
    'Circuit ID':
      circuit.circuitId || '',
    'Circuit Name':
      circuit.circuitName || '',
    'Site / Location':
      circuit.site || '',
    Provider:
      circuit.provider || '',
    'UptimeRobot Monitor ID':
      monitorId,
    Started:
      started,
    Restored:
      restored,
    'Duration Minutes':
      durationMinutes === ''
        ? ''
        : String(
            Math.round(durationMinutes)
          ),
    Duration:
      durationMinutes === ''
        ? ''
        : formatOutageDuration_(
            durationMinutes
          ),
    Source:
      OUTAGE_SOURCE_UPTIMEROBOT,
    'Cause / Reason':
      reason,
    Notes:
      incidentId
        ? 'UptimeRobot incident ' + incidentId
        : 'UptimeRobot incident',
    Status:
      provider.isOngoing
        ? 'Ongoing'
        : 'Restored',
    'Entered By':
      OUTAGE_SOURCE_UPTIMEROBOT,
    'Created At':
      syncedAt,
    'Updated At':
      syncedAt,
    'External Event ID':
      externalId
  };
}


function normalizeUptimeRobotIncident_(incident) {

  incident = incident || {};

  const monitorId = String(
    incident.monitorId ||
    incident.monitor_id ||
    (incident.monitor && incident.monitor.id) ||
    ''
  ).trim();

  const providerIncidentId = String(
    incident.id || incident.incidentId || incident.incident_id || ''
  ).trim();

  const startedAt = normalizeUptimeRobotIncidentTimestamp_(
    incident.startedAt || incident.started_at ||
    incident.startTime || incident.start_time ||
    incident.incidentStartTime || incident.incident_start_time
  );

  const rawRestoredAt =
    incident.resolvedAt || incident.resolved_at ||
    incident.restoredAt || incident.restored_at ||
    incident.endedAt || incident.ended_at ||
    incident.endTime || incident.end_time ||
    incident.incidentEndTime || incident.incident_end_time || '';

  let restoredAt = normalizeUptimeRobotIncidentTimestamp_(rawRestoredAt);

  const providerStatus = normalizeSimpleKey_(
    incident.status || incident.lifecycleStatus || incident.lifecycle_status || ''
  );

  const resolvedStatuses = {
    resolved: true, restored: true, closed: true,
    completed: true, complete: true, up: true
  };

  const ongoingStatuses = {
    ongoing: true, open: true, active: true,
    down: true, started: true, unresolved: true
  };

  let isOngoing = !!ongoingStatuses[providerStatus];
  let isResolved = !!resolvedStatuses[providerStatus];

  if (!isOngoing && !isResolved && restoredAt) {
    isResolved = true;
  }

  if (!providerStatus && !rawRestoredAt) {
    isOngoing = true;
  }

  const durationMinutes = normalizeUptimeRobotIncidentDurationMinutes_(
    incident.duration !== undefined
      ? incident.duration
      : (incident.durationSeconds !== undefined
          ? incident.durationSeconds
          : incident.duration_seconds),
    startedAt,
    restoredAt
  );

  if (isResolved && !restoredAt && startedAt && durationMinutes !== '') {
    restoredAt = new Date(
      parseOutageTimestampMs_(startedAt) + durationMinutes * 60000
    ).toISOString();
  }

  if (isResolved) {
    isOngoing = false;
  } else if (isOngoing) {
    restoredAt = '';
  }

  return {
    valid: !!(monitorId && startedAt && (isOngoing || isResolved)),
    monitorId: monitorId,
    providerIncidentId: providerIncidentId,
    providerStatus: providerStatus,
    startedAt: startedAt,
    restoredAt: restoredAt,
    durationMinutes: restoredAt
      ? calculateOutageDurationMinutes_(
          parseOutageTimestampMs_(startedAt),
          parseOutageTimestampMs_(restoredAt)
        )
      : durationMinutes,
    isOngoing: isOngoing,
    reason: String(incident.reason || '').trim(),
    diagnostic:
      !monitorId
        ? 'UptimeRobot incident is missing monitor ID.'
        : !startedAt
          ? 'UptimeRobot incident has a missing or invalid start timestamp.'
          : !isOngoing && !isResolved
            ? 'UptimeRobot incident has an unrecognized or missing lifecycle status.'
            : isResolved && !restoredAt
              ? 'Resolved UptimeRobot incident has neither a valid end timestamp nor a usable duration.'
              : ''
  };
}


function getExistingOutagesByExternalId_(sheet, headers) {
  const map = new Map();
  if (sheet.getLastRow() < 2) return map;
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  values.forEach((row, index) => {
    const record = Object.fromEntries(headers.map((header, i) => [header, row[i]]));
    const id = String(record['External Event ID'] || '').trim();
    if (id && normalizeSimpleKey_(record.Source) === 'uptimerobot') {
      map.set(id, map.has(id) ? null : { row: index + 2, record });
    }
  });
  return map;
}


function getOutageRowObject_(
  sheet,
  rowNumber,
  headers
) {

  const range = sheet.getRange(rowNumber, 1, 1, headers.length);
  const displayed = range.getDisplayValues()[0];
  const raw = range.getValues()[0];
  const record = {};

  headers.forEach((header, index) => {
    record[header] = isDateTimeHeader_(header) ? raw[index] : String(displayed[index] || '');
  });

  return record;
}


function appSyncUptimeRobotOutages() {

  requireAdmin_();

  const syncResult =
    runIntegrationSync(
      'uptimerobot'
    );

  return {
    syncResult:
      syncResult,
    outages:
      getOutagesPageData_(
        true
      )
  };
}


function generateOutageId_() {

  const sheet =
    ensureOutagesSheet_();

  const headers =
    getOutageCurrentHeaders_(
      sheet
    );

  return formatOutageIdNumber_(
    getMaxOutageIdNumber_(
      sheet,
      headers
    ) + 1
  );
}


function getMaxOutageIdNumber_(
  sheet,
  headers
) {

  const indexes =
    mapHeaders_(
      headers
    );

  const idIndex =
    indexes['Outage ID'];

  if (
    idIndex === undefined ||
    sheet.getLastRow() < 2
  ) {
    return 0;
  }

  let max = 0;

  sheet
    .getRange(
      2,
      idIndex + 1,
      sheet.getLastRow() - 1,
      1
    )
    .getDisplayValues()
    .forEach(row => {

      const match =
        String(row[0] || '')
          .trim()
          .match(/^OUT-(\d+)$/i);

      if (match) {
        max =
          Math.max(
            max,
            Number(match[1])
          );
      }

    });

  return max;
}


function formatOutageIdNumber_(
  value
) {

  return 'OUT-' +
    String(
      Number(value || 1)
    ).padStart(
      4,
      '0'
    );
}


function normalizeOutageTimestamp_(value, label, required, timezone, occurrence, storedValue) {
  const text = String(value == null ? '' : value).trim();
  if (!text) {
    if (required) throw new Error(label + ' is required.');
    return '';
  }

  const parsed = readNetworkDashboardTimestampParts_(text);
  const zone = timezone || getEffectiveTimezone_();
  const invalid = label + ' must be a valid date and time.';
  if (!parsed) throw new Error(invalid);
  if (parsed.offset) {
    const instant = parseNetworkDashboardOffsetTimestamp_(parsed);
    if (!instant) throw new Error(invalid);
    return instant.toISOString();
  }

  // The editor displays minutes, not seconds. A notes-only edit should keep
  // the exact stored instant, including the occurrence of a repeated hour.
  const storedMs = parseOutageTimestampMs_(storedValue);
  if (!occurrence && storedMs && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text) &&
      projectNetworkDashboardWallTime_(new Date(storedMs), zone).slice(0, 16) === text) {
    return storedValue;
  }

  const matches = findNetworkDashboardLocalInstants_(parsed, zone);
  if (!matches.length) {
    throw new Error(label + ' does not exist in ' + zone + ' because the clocks move forward. Enter a different time.');
  }
  if (matches.length > 1 && occurrence !== 'earlier' && occurrence !== 'later') {
    throw new Error(label + ' occurs twice in ' + zone + '. Under Repeated clock times, select First or Second.');
  }
  return matches[occurrence === 'later' ? matches.length - 1 : 0].toISOString();
}


function normalizeUptimeRobotIncidentTimestamp_(
  value
) {

  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    const date = new Date(
      value > 100000000000
        ? value
        : value * 1000
    );
    return isNaN(date.getTime()) ? '' : date.toISOString();
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      return normalizeUptimeRobotIncidentTimestamp_(Number(text));
    }
    const date = parseNetworkDashboardTimestamp_(text, 'Etc/UTC');
    if (date) return date.toISOString();

    return '';
  }

  if (typeof value === 'object') {
    return normalizeUptimeRobotIncidentTimestamp_(
      value.timestamp ||
      value.datetime ||
      value.dateTime ||
      value.time ||
      value.createdAt ||
      value.startedAt
    );
  }

  return '';
}


function parseOutageTimestampMs_(value) {
  const text = String(value == null ? '' : value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const numeric = Number(text);
    const millis = numeric > 100000000000 ? numeric : numeric * 1000;
    return Number.isFinite(millis) ? millis : 0;
  }
  const date = parseNetworkDashboardTimestamp_(value);
  return date ? date.getTime() : 0;
}


function calculateOutageDurationMinutes_(
  startedMs,
  restoredMs
) {

  startedMs =
    Number(startedMs || 0);

  restoredMs =
    Number(restoredMs || 0);

  if (
    !startedMs ||
    !restoredMs ||
    restoredMs < startedMs
  ) {
    return 0;
  }

  return Math.round(
    (restoredMs - startedMs) / 60000
  );
}


function normalizeUptimeRobotIncidentDurationMinutes_(
  value,
  started,
  restored
) {

  const startedMs =
    parseOutageTimestampMs_(
      started
    );

  const restoredMs =
    parseOutageTimestampMs_(
      restored
    );

  if (restoredMs) {
    return calculateOutageDurationMinutes_(
        startedMs,
        restoredMs
      );
  }

  const number =
    Number(value);

  if (
    Number.isFinite(number) &&
    number > 0
  ) {
    return Math.round(
      number / 60
    );
  }

  return '';
}


function formatOutageDuration_(
  minutes
) {

  minutes =
    Math.max(
      0,
      Math.round(
        Number(minutes || 0)
      )
    );

  if (!minutes) {
    return '0m';
  }

  const days =
    Math.floor(
      minutes / 1440
    );

  const hours =
    Math.floor(
      (minutes % 1440) / 60
    );

  const mins =
    minutes % 60;

  const parts = [];

  if (days) {
    parts.push(days + 'd');
  }

  if (hours) {
    parts.push(hours + 'h');
  }

  if (
    mins ||
    !parts.length
  ) {
    parts.push(mins + 'm');
  }

  return parts.join(' ');
}


function invalidateOutageCaches_() {

  try {
    const cache =
      CacheService.getScriptCache();

    cache.remove(
      'app_page_outages'
    );

    cache.remove(
      'app_dashboard'
    );

    cache.remove(
      'outages.summary'
    );
  } catch (error) {}
}
