const UPTIMEROBOT_API_BASE_URL =
  'https://api.uptimerobot.com/v3';

const UPTIMEROBOT_API_KEY_PROPERTY =
  'UPTIMEROBOT_API_KEY';

const UPTIMEROBOT_MONITOR_CACHE_KEY =
  'uptimerobot.monitors.normalized';

const UPTIMEROBOT_MONITOR_CACHE_SECONDS =
  180;


function testUptimeRobotConnection_() {

  const snapshot =
    fetchUptimeRobotMonitorSnapshot_();

  return {
    status: 'success',
    message:
      'UptimeRobot monitor read succeeded.',
    monitorsFound:
      snapshot.monitors.length
  };
}


function getUptimeRobotMonitorSnapshot_(
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
    status: 'disabled',
    message: '',
    fetchedAt: '',
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
    getCachedUptimeRobotMonitorSnapshot_();

  if (
    cached &&
    !options.forceRefresh
  ) {
    return Object.assign(
      base,
      cached,
      {
        status: 'cached',
        message:
          cached.message ||
          'Using cached UptimeRobot monitor health.'
      }
    );
  }

  if (!options.allowFetch) {
    base.status =
      cached
        ? 'cached'
        : 'not_fetched';
    base.message =
      cached
        ? 'Using cached UptimeRobot monitor health.'
        : 'UptimeRobot monitor health has not been fetched yet.';
    if (cached) {
      base.fetchedAt =
        cached.fetchedAt || '';
      base.monitors =
        cached.monitors || [];
    }
    return base;
  }

  try {
    return Object.assign(
      base,
      fetchUptimeRobotMonitorSnapshot_(),
      {
        status: 'fresh',
        message:
          'UptimeRobot monitor health refreshed.'
      }
    );
  } catch (error) {
    base.status =
      'error';
    base.message =
      sanitizeUptimeRobotError_(
        error
      );
    return base;
  }
}


function getCachedUptimeRobotMonitorSnapshot_() {

  try {
    const cached =
      CacheService
        .getScriptCache()
        .get(
          UPTIMEROBOT_MONITOR_CACHE_KEY
        );

    return cached
      ? JSON.parse(cached)
      : null;
  } catch (error) {
    return null;
  }
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

  const snapshot = {
    fetchedAt:
      new Date().toISOString(),
    monitors:
      monitors
  };

  cacheJson_(
    UPTIMEROBOT_MONITOR_CACHE_KEY,
    snapshot,
    UPTIMEROBOT_MONITOR_CACHE_SECONDS
  );

  invalidateAppPage_(
    'internetWan'
  );

  return snapshot;
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
      String(
        monitor.type || ''
      ).trim(),
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
      String(
        monitor.lastCheck ||
        monitor.last_check ||
        monitor.lastChecked ||
        monitor.last_checked ||
        ''
      ).trim()
  };
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

  if (normalized === 'UP') {
    return 'Online';
  }

  if (
    normalized === 'DOWN' ||
    normalized === 'LOOKS_DOWN'
  ) {
    return 'Down';
  }

  if (normalized === 'PAUSED') {
    return 'Paused';
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

  return (
    error &&
    error.message
  )
    ? String(error.message)
    : 'UptimeRobot request failed.';
}
