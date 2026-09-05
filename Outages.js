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
    'External Event ID'
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
        getLatestOutageUpdateStamp_(
          rows
        )
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

  ensureOutagesSheet_();

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
    )
    .filter(Boolean);
}


function readOutageRecords_(
  circuits
) {

  const sheet =
    getReadSheet_(OUTAGES_SHEET_NAME);

  if (!sheet) {
    return [];
  }

  const allValues = readSheetDisplayBatch_(sheet);
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
          : String(
              sourceRow[columnIndex] || ''
            );

    });

    hydrateOutageDisplayFields_(
      row,
      circuitMap
    );

    rows.push(
      row
    );

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

  const startedMs =
    parseOutageTimestampMs_(
      row.Started
    );

  const restoredMs =
    parseOutageTimestampMs_(
      row.Restored
    );

  row._startedMs =
    startedMs;

  row._restoredMs =
    restoredMs;

  row._ongoing =
    !!startedMs &&
    !restoredMs;

  row.Status =
    row._ongoing
      ? 'Ongoing'
      : 'Restored';

  const storedDuration =
    Number(
      row['Duration Minutes']
    );

  const calculatedDuration =
    calculateOutageDurationMinutes_(
      startedMs,
      restoredMs || Date.now()
    );

  const durationMinutes =
    Number.isFinite(storedDuration) &&
    storedDuration > 0 &&
    !row._ongoing
      ? storedDuration
      : calculatedDuration;

  row._durationMinutes =
    durationMinutes;

  row['Duration Minutes'] =
    durationMinutes
      ? String(
          Math.round(durationMinutes)
        )
      : '';

  row.Duration =
    formatOutageDuration_(
      durationMinutes
    );

  row._sourceKey =
    normalizeSimpleKey_(
      row.Source
    );

  return row;
}


function buildOutageSummary_(
  rows
) {

  const now =
    Date.now();

  const windowStart =
    now -
    OUTAGE_DASHBOARD_WINDOW_DAYS *
      24 *
      60 *
      60 *
      1000;

  const summary = {
    total:
      (rows || []).length,
    active: 0,
    last30Days: 0,
    durationLast30Minutes: 0,
    durationLast30Label: '0m'
  };

  (rows || [])
    .forEach(row => {

      if (row._ongoing) {
        summary.active++;
      }

      const startedMs =
        Number(row._startedMs || 0);

      if (!startedMs) {
        return;
      }

      const restoredMs =
        Number(row._restoredMs || 0) ||
        now;

      if (
        restoredMs < windowStart ||
        startedMs > now
      ) {
        return;
      }

      summary.last30Days++;

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

      summary.durationLast30Minutes +=
        calculateOutageDurationMinutes_(
          overlapStart,
          overlapEnd
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


function getLatestOutageUpdateStamp_(
  rows
) {

  const stamps =
    (rows || [])
      .map(row =>
        row['Updated At'] ||
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

  const current =
    editing
      ? getOutageRowObject_(
          sheet,
          rowNumber,
          headers
        )
      : {};

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

  sheet
    .getRange(
      rowNumber,
      1,
      1,
      headers.length
    )
    .setValues([
      headers.map(header =>
        normalized[header] !== undefined
          ? normalized[header]
          : ''
      )
    ]);

  invalidateOutageCaches_();

  return getOutagesPageData_(
    true
  );
}


function appDeleteOutage(
  rowNumber
) {

  requirePagePermission_(
    'outages',
    'edit'
  );

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

  sheet.deleteRow(
    rowNumber
  );

  invalidateOutageCaches_();

  return getOutagesPageData_(
    true
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

  const started =
    normalizeOutageTimestamp_(
      record.Started,
      'Started',
      true
    );

  const restored =
    normalizeOutageTimestamp_(
      record.Restored,
      'Restored',
      false
    );

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
      String(
        record['Cause / Reason'] ||
        record.Reason ||
        ''
      ).trim(),
    Notes:
      String(
        record.Notes || ''
      ).trim(),
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


function reconcileUptimeRobotOutageRecords_(
  incidents,
  mappings,
  syncedAt
) {

  const circuitMap =
    buildCircuitReferenceMap_(
      mappings || []
    );

  const sheet =
    ensureOutagesSheet_();

  const headers =
    getOutageCurrentHeaders_(
      sheet
    );

  const existing =
    getExistingOutagesByExternalId_(
      sheet,
      headers
    );

  let nextNumber =
    getMaxOutageIdNumber_(
      sheet,
      headers
    ) + 1;

  const result = {
    status: 'success',
    message:
      'UptimeRobot outages synchronized.',
    fetched: 0,
    created: 0,
    updated: 0,
    unchanged: 0
  };

  (incidents || [])
    .forEach(incident => {

      const normalized =
        normalizeUptimeRobotOutageRecord_(
          incident,
          circuitMap,
          syncedAt
        );

      if (!normalized) {
        return;
      }

      result.fetched++;

      const externalId =
        normalized['External Event ID'];

      const existingRecord =
        existing[externalId];

      if (existingRecord) {

        normalized['Outage ID'] =
          existingRecord.record['Outage ID'] ||
          normalized['Outage ID'];

        normalized['Created At'] =
          existingRecord.record['Created At'] ||
          normalized['Created At'];

        normalized['Entered By'] =
          existingRecord.record['Entered By'] ||
          normalized['Entered By'];

        if (
          !outageRowsDiffer_(
            headers,
            existingRecord.record,
            normalized
          )
        ) {
          result.unchanged++;
          return;
        }

        sheet
          .getRange(
            existingRecord.row,
            1,
            1,
            headers.length
          )
          .setValues([
            headers.map(header =>
              normalized[header] !== undefined
                ? normalized[header]
                : ''
            )
          ]);

        result.updated++;
        return;
      }

      normalized['Outage ID'] =
        formatOutageIdNumber_(
          nextNumber
        );

      nextNumber++;

      sheet
        .getRange(
          sheet.getLastRow() + 1,
          1,
          1,
          headers.length
        )
        .setValues([
          headers.map(header =>
            normalized[header] !== undefined
              ? normalized[header]
              : ''
          )
        ]);

      result.created++;

    });

  invalidateOutageCaches_();

  return result;
}


function normalizeUptimeRobotOutageRecord_(
  incident,
  circuitMap,
  syncedAt
) {

  incident =
    incident || {};

  const monitorId =
    String(
      incident.monitorId ||
      incident.monitor_id ||
      (
        incident.monitor &&
        incident.monitor.id
      ) ||
      ''
    ).trim();

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

  const incidentId =
    String(
      incident.id ||
      incident.incidentId ||
      ''
    ).trim();

  const started =
    normalizeUptimeRobotIncidentTimestamp_(
      incident.startedAt ||
      incident.started_at ||
      incident.startTime ||
      incident.start_time
    );

  if (!started) {
    return null;
  }

  const restored =
    normalizeUptimeRobotIncidentTimestamp_(
      incident.resolvedAt ||
      incident.resolved_at ||
      incident.restoredAt ||
      incident.restored_at ||
      incident.endedAt ||
      incident.ended_at
    );

  const durationMinutes =
    normalizeUptimeRobotIncidentDurationMinutes_(
      incident.duration,
      started,
      restored
    );

  const externalId =
    'uptimerobot:' +
    (
      incidentId ||
      monitorId + ':' + started
    );

  const reason =
    String(
      incident.reason ||
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
      restored
        ? 'Restored'
        : 'Ongoing',
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


function getExistingOutagesByExternalId_(
  sheet,
  headers
) {

  const map = {};

  if (sheet.getLastRow() < 2) {
    return map;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        headers.length
      )
      .getDisplayValues();

  values.forEach((row, index) => {

    const record = {};

    headers.forEach((header, columnIndex) => {
      record[header] =
        String(row[columnIndex] || '');
    });

    const externalId =
      String(
        record['External Event ID'] || ''
      ).trim();

    if (externalId) {
      map[externalId] = {
        row:
          index + 2,
        record:
          record
      };
    }

  });

  return map;
}


function getOutageRowObject_(
  sheet,
  rowNumber,
  headers
) {

  const row =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .getDisplayValues()[0];

  const record = {};

  headers.forEach((header, index) => {
    record[header] =
      String(row[index] || '');
  });

  return record;
}


function outageRowsDiffer_(
  headers,
  current,
  next
) {

  return (headers || [])
    .filter(header =>
      header !== 'Updated At'
    )
    .some(header =>
      String(current[header] || '') !==
      String(next[header] || '')
    );
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


function normalizeOutageTimestamp_(
  value,
  label,
  required
) {

  const text =
    String(value || '').trim();

  if (!text) {
    if (required) {
      throw new Error(
        label + ' is required.'
      );
    }

    return '';
  }

  const date =
    new Date(text);

  if (
    isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      label + ' must be a valid date and time.'
    );
  }

  return date.toISOString();
}


function normalizeUptimeRobotIncidentTimestamp_(
  value
) {

  if (!value) {
    return '';
  }

  if (typeof value === 'number') {
    return new Date(
      value > 100000000000
        ? value
        : value * 1000
    ).toISOString();
  }

  if (typeof value === 'string') {
    const date =
      new Date(value);

    if (
      !isNaN(
        date.getTime()
      )
    ) {
      return date.toISOString();
    }

    return value.trim();
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


function parseOutageTimestampMs_(
  value
) {

  const text =
    String(value || '').trim();

  if (!text) {
    return 0;
  }

  const date =
    new Date(text);

  const time =
    date.getTime();

  return isNaN(time)
    ? 0
    : time;
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
  } catch (error) {}
}
