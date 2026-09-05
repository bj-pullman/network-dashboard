const UPTIMEROBOT_API_BASE_URL =
  'https://api.uptimerobot.com/v3';

const UPTIMEROBOT_API_KEY_PROPERTY =
  'UPTIMEROBOT_API_KEY';

const UPTIMEROBOT_SHEET_NAME =
  'UptimeRobot';

const UPTIMEROBOT_LOCAL_CACHE_KEY =
  'uptimerobot.monitors.local';

const UPTIMEROBOT_MONITOR_CACHE_KEY =
  'uptimerobot.monitors.normalized';

const UPTIMEROBOT_LOCAL_CACHE_SECONDS =
  60;


function getUptimeRobotSheetHeaders_() {

  return [
    'Monitor ID',
    'Monitor Name',
    'Monitor Type',
    'Target',
    'Health',
    'Provider Status',
    'Last Checked',
    'Created At',
    'Last Incident ID',
    'Current State Duration',
    'Tags',
    'Last Sync'
  ];
}


function testUptimeRobotConnection_() {

  const response =
    fetchUptimeRobotJson_(
      '/monitors',
      {
        limit: 1
      }
    );

  const monitors =
    extractUptimeRobotMonitorList_(
      response.json
    );

  return {
    status: 'success',
    message:
      'UptimeRobot monitor metadata read succeeded.',
    monitorsFound:
      monitors.length
  };
}


function syncUptimeRobotToSheet() {

  requireAdmin_();

  const status =
    getIntegrationStatusById_(
      'uptimerobot'
    );

  if (!status.configurationComplete) {
    throw new Error(
      'UptimeRobot cannot sync because required Script Properties are missing.'
    );
  }

  if (!status.enabled) {
    throw new Error(
      'UptimeRobot is disabled in App Integrations.'
    );
  }

  try {

    const snapshot =
      fetchUptimeRobotMonitorSnapshot_();

    writeUptimeRobotMonitorsToSheet_(
      snapshot.monitors,
      snapshot.fetchedAt
    );

    let outageSyncResult = {
      status: 'skipped',
      message: '',
      fetched: 0,
      created: 0,
      updated: 0,
      unchanged: 0
    };

    let outageSyncWarning =
      '';

    if (
      typeof syncUptimeRobotOutagesForMappedCircuits_ ===
      'function'
    ) {

      try {
        outageSyncResult =
          syncUptimeRobotOutagesForMappedCircuits_(
            snapshot.fetchedAt
          );
      } catch (error) {
        outageSyncWarning =
          sanitizeUptimeRobotError_(
            error
          );
      }

    }

    const summary =
      buildUptimeRobotSummary_(
        snapshot.monitors
      );

    const counts = {
      monitors:
        snapshot.monitors.length,
      online:
        summary.online,
      down:
        summary.down,
      paused:
        summary.paused,
      unknown:
        summary.unknown,
      outages:
        outageSyncResult.fetched || 0
    };

    updateIntegrationSyncStatus_(
      'uptimerobot',
      {
        success: true,
        connectionStatus: 'connected',
        lastSuccessfulSync:
          snapshot.fetchedAt,
        lastStatus:
          'Sync succeeded',
        recordCount:
          snapshot.monitors.length,
        recordCounts:
          counts,
        latestError: ''
      }
    );

    invalidateUptimeRobotDataCaches_();

    return {
      status: 'success',
      message:
        outageSyncWarning
          ? 'UptimeRobot monitors synced locally. Outage sync warning: ' +
            outageSyncWarning
          : 'UptimeRobot monitors synced locally.',
      monitorsSynced:
        snapshot.monitors.length,
      lastSync:
        snapshot.fetchedAt,
      counts:
        counts,
      outageSync:
        outageSyncResult,
      outageSyncWarning:
        outageSyncWarning,
      invalidatePages: [
        'uptimeRobot',
        'internetWan',
        'outages',
        'dashboard'
      ]
    };

  } catch (error) {

    const message =
      sanitizeUptimeRobotError_(
        error
      );

    updateIntegrationSyncStatus_(
      'uptimerobot',
      {
        success: false,
        lastStatus:
          'Sync failed',
        latestError:
          message
      }
    );

    invalidateUptimeRobotDataCaches_();

    throw new Error(
      message
    );

  }
}


function getUptimeRobotMonitorSnapshot_(
  options
) {

  return getUptimeRobotLocalMonitorSnapshot_(
    options
  );
}


function getUptimeRobotLocalMonitorSnapshot_(
  options
) {

  options =
    options || {};

  const integrationStatus =
    getIntegrationStatusById_(
      'uptimerobot'
    );

  const base = {
    integrationId: 'uptimerobot',
    enabled:
      !!integrationStatus.enabled,
    configurationComplete:
      !!integrationStatus.configurationComplete,
    canRefresh:
      !!integrationStatus.enabled &&
      !!integrationStatus.configurationComplete,
    canSync:
      !!integrationStatus.enabled &&
      !!integrationStatus.configurationComplete,
    status: 'disabled',
    message: '',
    fetchedAt:
      integrationStatus.lastSuccessfulSync || '',
    lastAttempt:
      integrationStatus.lastAttempt || '',
    lastSuccessfulSync:
      integrationStatus.lastSuccessfulSync || '',
    latestError:
      integrationStatus.latestError || '',
    dataStatus:
      integrationStatus.dataStatus || '',
    recordCounts:
      integrationStatus.recordCounts || {},
    summary:
      buildUptimeRobotSummary_([]),
    monitors: []
  };

  if (!integrationStatus.enabled) {
    base.message =
      'UptimeRobot integration is disabled.';
    return base;
  }

  if (!integrationStatus.configurationComplete) {
    base.status =
      'not_configured';
    base.message =
      'UptimeRobot is missing required Script Properties.';
    return base;
  }

  const cached =
    !options.forceRefresh
      ? getCachedUptimeRobotLocalSnapshot_()
      : null;

  if (cached) {
    return Object.assign(
      base,
      cached,
      {
        status:
          cached.status || 'local',
        message:
          cached.message ||
          'Using synchronized UptimeRobot monitor data.'
      }
    );
  }

  const monitors =
    readUptimeRobotLocalMonitors_();

  const summary =
    buildUptimeRobotSummary_(
      monitors
    );

  const fetchedAt =
    getLatestUptimeRobotSyncStamp_(
      monitors,
      integrationStatus
    );

  const snapshot =
    Object.assign(
      base,
      {
        status:
          monitors.length
            ? 'local'
            : (
                integrationStatus.lastSuccessfulSync
                  ? 'empty'
                  : 'not_synced'
              ),
        message:
          monitors.length
            ? 'Using synchronized UptimeRobot monitor data.'
            : (
                integrationStatus.lastSuccessfulSync
                  ? 'UptimeRobot sync completed with no monitors.'
                  : 'UptimeRobot has not been synced locally yet.'
              ),
        fetchedAt:
          fetchedAt,
        lastSuccessfulSync:
          integrationStatus.lastSuccessfulSync || fetchedAt,
        summary:
          summary,
        monitors:
          monitors
      }
    );

  cacheJson_(
    UPTIMEROBOT_LOCAL_CACHE_KEY,
    snapshot,
    UPTIMEROBOT_LOCAL_CACHE_SECONDS
  );

  return snapshot;
}


function getUptimeRobotPageData_(
  forceRefresh
) {

  requirePagePermission_(
    'uptimeRobot',
    'view'
  );

  const cacheKey =
    'app_page_uptimeRobot';

  if (!forceRefresh) {
    try {
      const cached =
        CacheService
          .getScriptCache()
          .get(
            cacheKey
          );

      if (cached) {
        return JSON.parse(
          cached
        );
      }
    } catch (error) {}
  }

  const snapshot =
    getUptimeRobotLocalMonitorSnapshot_({
      forceRefresh:
        !!forceRefresh
    });

  const rows =
    snapshot.monitors.map(
      monitor =>
        monitorToUptimeRobotPageRow_(
          monitor
        )
    );

  const result = {
    pageKey: 'uptimeRobot',
    type: 'uptimeRobot',
    label: 'UptimeRobot',
    sheetName:
      UPTIMEROBOT_SHEET_NAME,
    headers:
      getUptimeRobotSheetHeaders_(),
    rows:
      rows,
    totalCount:
      rows.length,
    defaultColumns: [
      'Monitor Name',
      'Monitor Type',
      'Target',
      'Health',
      'Provider Status',
      'Last Checked',
      'Last Sync'
    ],
    controlledOptions: {
      Health:
        getControlledOptions_(
          'uptimeRobotHealth'
        )
    },
    permission:
      getPagePermission_(
        'uptimeRobot'
      ),
    integration:
      snapshot,
    summary:
      snapshot.summary
  };

  cacheJson_(
    cacheKey,
    result,
    UPTIMEROBOT_LOCAL_CACHE_SECONDS
  );

  return result;
}


function fetchUptimeRobotMonitorSnapshot_() {

  const monitors = [];

  let cursor =
    '';

  let pageCount =
    0;

  do {

    pageCount++;

    if (pageCount > 25) {
      throw new Error(
        'UptimeRobot monitor pagination exceeded the local safety limit.'
      );
    }

    const response =
      fetchUptimeRobotJson_(
        '/monitors',
        {
          limit: 200,
          cursor: cursor
        }
      );

    const pageMonitors =
      extractUptimeRobotMonitorList_(
        response.json
      );

    pageMonitors.forEach(monitor => {
      const normalized =
        normalizeUptimeRobotMonitor_(
          monitor
        );

      if (normalized.id) {
        monitors.push(
          normalized
        );
      }
    });

    cursor =
      extractUptimeRobotNextCursor_(
        response.json
      );

  } while (cursor);

  monitors.sort((left, right) =>
    String(left.name || left.id)
      .localeCompare(
        String(right.name || right.id)
      )
  );

  return {
    fetchedAt:
      new Date().toISOString(),
    monitors:
      monitors
  };
}


function fetchUptimeRobotIncidentsForOutageSync_(
  options
) {

  options =
    options || {};

  const incidents = [];

  let cursor =
    '';

  let pageCount =
    0;

  do {

    pageCount++;

    if (pageCount > 25) {
      throw new Error(
        'UptimeRobot incident pagination exceeded the local safety limit.'
      );
    }

    const response =
      fetchUptimeRobotJson_(
        '/incidents',
        {
          cursor:
            cursor,
          started_after:
            options.startedAfter || ''
        }
      );

    extractUptimeRobotIncidentList_(
      response.json
    ).forEach(incident => {
      incidents.push(
        incident
      );
    });

    cursor =
      extractUptimeRobotNextCursor_(
        response.json
      );

  } while (cursor);

  return incidents;
}


function writeUptimeRobotMonitorsToSheet_(
  monitors,
  fetchedAt
) {

  const sheet =
    ensureUptimeRobotSheet_();

  const headers =
    getUptimeRobotCurrentHeaders_(
      sheet
    );

  const lastRow =
    sheet.getLastRow();

  const rows =
    (monitors || [])
      .map(monitor => {

        const rowObject =
          monitorToUptimeRobotSheetRowObject_(
            monitor,
            fetchedAt
          );

        return headers.map(header =>
          rowObject[header] !== undefined
            ? rowObject[header]
            : ''
        );

      });

  if (rows.length) {
    sheet
      .getRange(
        2,
        1,
        rows.length,
        headers.length
      )
      .setValues(
        rows
      );
  }

  const leftoverStartRow =
    2 + rows.length;

  if (lastRow >= leftoverStartRow) {
    sheet
      .getRange(
        leftoverStartRow,
        1,
        lastRow - leftoverStartRow + 1,
        Math.max(
          sheet.getLastColumn(),
          headers.length
        )
      )
      .clearContent();
  }
}


function ensureUptimeRobotSheet_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      UPTIMEROBOT_SHEET_NAME
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        UPTIMEROBOT_SHEET_NAME
      );
  }

  const headers =
    getUptimeRobotSheetHeaders_();

  const currentWidth =
    Math.max(
      sheet.getLastColumn(),
      headers.length
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


function getUptimeRobotCurrentHeaders_(
  sheet
) {

  ensureUptimeRobotSheet_();

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


function readUptimeRobotLocalMonitors_() {

  const sheet =
    getReadSheet_(UPTIMEROBOT_SHEET_NAME);

  if (!sheet) {
    return [];
  }

  const allValues = readSheetDisplayBatch_(sheet);
  const headers = (allValues[0] || []).map(value => String(value || '').trim());

  const values = allValues.slice(1);

  const rows = [];

  values.forEach((row, index) => {

    if (
      typeof rowHasMeaningfulData_ === 'function' &&
      !rowHasMeaningfulData_(
        row,
        headers
      )
    ) {
      return;
    }

    const rowObject = {
      _row:
        index + 2,
      _sourceSheet:
        UPTIMEROBOT_SHEET_NAME
    };

    headers.forEach((header, columnIndex) => {
      if (header) {
        rowObject[header] =
          String(row[columnIndex] || '').trim();
      }
    });

    const monitor =
      normalizeUptimeRobotLocalRow_(
        rowObject
      );

    if (monitor.id) {
      rows.push(
        monitor
      );
    }

  });

  return rows;
}


function monitorToUptimeRobotSheetRowObject_(
  monitor,
  fetchedAt
) {

  return {
    'Monitor ID':
      monitor.id || '',
    'Monitor Name':
      monitor.name || '',
    'Monitor Type':
      monitor.type || '',
    'Target':
      monitor.target || '',
    'Health':
      monitor.health || 'Unknown',
    'Provider Status':
      monitor.status || '',
    'Last Checked':
      monitor.lastChecked || '',
    'Created At':
      monitor.createdAt || '',
    'Last Incident ID':
      monitor.lastIncidentId || '',
    'Current State Duration':
      monitor.currentStateDuration || '',
    'Tags':
      monitor.tags || '',
    'Last Sync':
      fetchedAt || ''
  };
}


function monitorToUptimeRobotPageRow_(
  monitor
) {

  return Object.assign(
    {
      'Monitor ID':
        monitor.id || '',
      'Monitor Name':
        monitor.name || '',
      'Monitor Type':
        monitor.type || '',
      Target:
        monitor.target || '',
      Health:
        monitor.health || 'Unknown',
      'Provider Status':
        monitor.status || '',
      'Last Checked':
        monitor.lastChecked || '',
      'Created At':
        monitor.createdAt || '',
      'Last Incident ID':
        monitor.lastIncidentId || '',
      'Current State Duration':
        monitor.currentStateDuration || '',
      Tags:
        monitor.tags || '',
      'Last Sync':
        monitor.lastSync || ''
    },
    {
      id:
        monitor.id || '',
      name:
        monitor.name || '',
      type:
        monitor.type || '',
      target:
        monitor.target || '',
      health:
        monitor.health || 'Unknown',
      status:
        monitor.status || '',
      lastChecked:
        monitor.lastChecked || '',
      lastSync:
        monitor.lastSync || ''
    }
  );
}


function normalizeUptimeRobotLocalRow_(
  row
) {

  return {
    _row:
      row._row,
    _sourceSheet:
      row._sourceSheet,
    id:
      String(
        row['Monitor ID'] || ''
      ).trim(),
    name:
      String(
        row['Monitor Name'] || ''
      ).trim(),
    type:
      String(
        row['Monitor Type'] || ''
      ).trim(),
    target:
      String(
        row.Target || ''
      ).trim(),
    health:
      normalizeUptimeRobotHealth_(
        row.Health
      ),
    status:
      String(
        row['Provider Status'] || ''
      ).trim(),
    lastChecked:
      String(
        row['Last Checked'] || ''
      ).trim(),
    createdAt:
      String(
        row['Created At'] || ''
      ).trim(),
    lastIncidentId:
      String(
        row['Last Incident ID'] || ''
      ).trim(),
    currentStateDuration:
      String(
        row['Current State Duration'] || ''
      ).trim(),
    tags:
      String(
        row.Tags || ''
      ).trim(),
    lastSync:
      String(
        row['Last Sync'] || ''
      ).trim()
  };
}


function getCachedUptimeRobotLocalSnapshot_() {

  try {
    const cached =
      CacheService
        .getScriptCache()
        .get(
          UPTIMEROBOT_LOCAL_CACHE_KEY
        );

    return cached
      ? JSON.parse(cached)
      : null;
  } catch (error) {
    return null;
  }
}


function invalidateUptimeRobotDataCaches_() {

  try {
    const cache =
      CacheService.getScriptCache();

    cache.remove(
      UPTIMEROBOT_LOCAL_CACHE_KEY
    );

    cache.remove(
      UPTIMEROBOT_MONITOR_CACHE_KEY
    );
  } catch (error) {}

  invalidateAppPage_(
    'uptimeRobot'
  );

  invalidateAppPage_(
    'internetWan'
  );

  invalidateAppPage_(
    'outages'
  );

  invalidateAppPage_(
    'dashboard'
  );
}


function buildUptimeRobotSummary_(
  monitors
) {

  const summary = {
    total: 0,
    online: 0,
    down: 0,
    paused: 0,
    unknown: 0
  };

  (monitors || [])
    .forEach(monitor => {

      summary.total++;

      const health =
        normalizeSimpleKey_(
          monitor.health
        );

      if (health === 'online') {
        summary.online++;
      } else if (health === 'down') {
        summary.down++;
      } else if (health === 'paused') {
        summary.paused++;
      } else {
        summary.unknown++;
      }

    });

  return summary;
}


function getLatestUptimeRobotSyncStamp_(
  monitors,
  integrationStatus
) {

  const stamps =
    (monitors || [])
      .map(monitor =>
        String(
          monitor.lastSync || ''
        ).trim()
      )
      .filter(Boolean)
      .sort();

  return stamps.length
    ? stamps[stamps.length - 1]
    : integrationStatus.lastSuccessfulSync || '';
}


function fetchUptimeRobotJson_(
  path,
  params
) {

  const apiKey =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        UPTIMEROBOT_API_KEY_PROPERTY
      );

  if (!apiKey) {
    throw new Error(
      'UPTIMEROBOT_API_KEY Script Property is missing.'
    );
  }

  const query =
    buildUptimeRobotQueryString_(
      params || {}
    );

  const response =
    UrlFetchApp.fetch(
      UPTIMEROBOT_API_BASE_URL +
        path +
        query,
      {
        method: 'get',
        headers: {
          Authorization:
            'Bearer ' + apiKey,
          Accept:
            'application/json'
        },
        muteHttpExceptions: true
      }
    );

  const statusCode =
    response.getResponseCode();

  const body =
    response.getContentText() || '';

  if (statusCode === 429) {
    const retryAfter =
      getUptimeRobotRetryAfter_(
        response
      );

    throw new Error(
      retryAfter
        ? 'UptimeRobot rate limit reached. Retry after ' + retryAfter + ' seconds.'
        : 'UptimeRobot rate limit reached. Try again later.'
    );
  }

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    throw new Error(
      'UptimeRobot request failed with HTTP ' +
      statusCode +
      '.'
    );
  }

  try {
    return {
      json:
        JSON.parse(body),
      response:
        response
    };
  } catch (error) {
    throw new Error(
      'UptimeRobot returned invalid JSON.'
    );
  }
}


function buildUptimeRobotQueryString_(
  params
) {

  const parts = [];

  Object.keys(params)
    .forEach(key => {

      const value =
        params[key];

      if (
        value === undefined ||
        value === null ||
        value === ''
      ) {
        return;
      }

      parts.push(
        encodeURIComponent(key) +
        '=' +
        encodeURIComponent(value)
      );

    });

  return parts.length
    ? '?' + parts.join('&')
    : '';
}


function extractUptimeRobotMonitorList_(
  json
) {

  if (
    json &&
    Array.isArray(json.monitors)
  ) {
    return json.monitors;
  }

  if (
    json &&
    json.data &&
    Array.isArray(json.data.monitors)
  ) {
    return json.data.monitors;
  }

  if (
    json &&
    Array.isArray(json.data)
  ) {
    return json.data;
  }

  return [];
}


function extractUptimeRobotIncidentList_(
  json
) {

  if (
    json &&
    Array.isArray(json.incidents)
  ) {
    return json.incidents;
  }

  if (
    json &&
    Array.isArray(json.data)
  ) {
    return json.data;
  }

  if (
    json &&
    json.data &&
    Array.isArray(json.data.incidents)
  ) {
    return json.data.incidents;
  }

  return [];
}


function extractUptimeRobotNextCursor_(
  json
) {

  if (!json) {
    return '';
  }

  const direct =
    json.nextCursor ||
    json.next_cursor ||
    json.cursor ||
    (
      json.pagination &&
      (
        json.pagination.nextCursor ||
        json.pagination.next_cursor
      )
    ) ||
    (
      json.meta &&
      (
        json.meta.nextCursor ||
        json.meta.next_cursor
      )
    );

  if (direct) {
    return String(direct);
  }

  const nextLink =
    json.nextLink ||
    json.next_link ||
    (
      json.links &&
      (
        json.links.next ||
        json.links.nextLink
      )
    );

  if (nextLink) {
    const match =
      String(nextLink)
        .match(/[?&]cursor=([^&]+)/);

    if (match) {
      return decodeURIComponent(
        match[1]
      );
    }
  }

  return '';
}


function normalizeUptimeRobotMonitor_(
  monitor
) {

  monitor =
    monitor || {};

  const id =
    String(
      monitor.id ||
      monitor.monitorId ||
      monitor.monitor_id ||
      ''
    ).trim();

  const status =
    String(
      monitor.status ||
      monitor.state ||
      ''
    ).trim();

  return {
    id: id,
    name:
      String(
        monitor.friendlyName ||
        monitor.friendly_name ||
        monitor.name ||
        ''
      ).trim(),
    type:
      normalizeUptimeRobotType_(
        monitor.type
      ),
    target:
      String(
        monitor.url ||
        monitor.target ||
        monitor.address ||
        monitor.ip ||
        ''
      ).trim(),
    status:
      status,
    health:
      normalizeUptimeRobotHealth_(
        status
      ),
    lastChecked:
      extractUptimeRobotTimestamp_(
        monitor.lastCheck ||
        monitor.last_check ||
        monitor.lastChecked ||
        monitor.last_checked ||
        monitor.lastDayUptimes
      ),
    createdAt:
      extractUptimeRobotTimestamp_(
        monitor.createDateTime ||
        monitor.createdAt ||
        monitor.created_at
      ),
    lastIncidentId:
      String(
        monitor.lastIncidentId ||
        monitor.last_incident_id ||
        ''
      ).trim(),
    currentStateDuration:
      String(
        monitor.currentStateDuration ||
        monitor.current_state_duration ||
        ''
      ).trim(),
    tags:
      normalizeUptimeRobotTags_(
        monitor.tags
      )
  };
}


function normalizeUptimeRobotType_(
  value
) {

  if (
    value &&
    typeof value === 'object'
  ) {
    return String(
      value.name ||
      value.type ||
      value.id ||
      ''
    ).trim();
  }

  return String(value || '')
    .trim();
}


function normalizeUptimeRobotTags_(
  value
) {

  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map(tag =>
        typeof tag === 'object'
          ? tag.name || tag.label || tag.id || ''
          : tag
      )
      .map(tag =>
        String(tag || '').trim()
      )
      .filter(Boolean)
      .join(', ');
  }

  return String(value || '')
    .trim();
}


function extractUptimeRobotTimestamp_(
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
    return value.trim();
  }

  if (Array.isArray(value)) {
    const candidates =
      value
        .map(item =>
          extractUptimeRobotTimestamp_(
            item &&
            (
              item.timestamp ||
              item.datetime ||
              item.dateTime ||
              item.time
            )
          )
        )
        .filter(Boolean)
        .sort();

    return candidates.length
      ? candidates[candidates.length - 1]
      : '';
  }

  if (typeof value === 'object') {
    return extractUptimeRobotTimestamp_(
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


function normalizeUptimeRobotHealth_(
  status
) {

  const normalized =
    String(status || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  if (
    normalized === 'UP' ||
    normalized === 'ONLINE'
  ) {
    return 'Online';
  }

  if (
    normalized === 'DOWN' ||
    normalized === 'OFFLINE' ||
    normalized === 'LOOKS_DOWN'
  ) {
    return 'Down';
  }

  if (normalized === 'PAUSED') {
    return 'Paused';
  }

  if (normalized === 'UNKNOWN') {
    return 'Unknown';
  }

  return 'Unknown';
}


function getUptimeRobotRetryAfter_(
  response
) {

  try {
    const headers =
      response.getAllHeaders();

    const retryAfter =
      headers['Retry-After'] ||
      headers['retry-after'];

    return retryAfter
      ? String(retryAfter)
      : '';
  } catch (error) {
    return '';
  }
}


function sanitizeUptimeRobotError_(
  error
) {

  const message =
    error &&
    error.message
      ? String(error.message)
      : 'UptimeRobot request failed.';

  if (
    /api[_\s-]*key|token|secret|credential/i.test(
      message
    )
  ) {
    return 'UptimeRobot request failed. Review Script Properties and provider access.';
  }

  return message;
}
