/**
 * Shared Regional date/time helpers.
 * Calendar dates remain year/month/day values; timestamps remain instants.
 */
function getNetworkDashboardRegionalPreferences_() {
  let timezone = '';
  let dateFormat = '';
  let timeFormat = '';
  try {
    timezone = String(AppConfig.get('regional.timezone') || '').trim();
    dateFormat = String(AppConfig.get('regional.date_format') || '').trim();
    timeFormat = String(AppConfig.get('regional.time_format') || '').trim();
  } catch (error) {}

  timezone = getValidNetworkDashboardTimezone_(timezone) ||
    getValidNetworkDashboardTimezone_(getDefaultTimezone_()) || 'Etc/UTC';
  if (!['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy'].includes(dateFormat)) {
    dateFormat = 'MM/dd/yyyy';
  }
  if (!['HH:mm', 'h:mm a'].includes(timeFormat)) timeFormat = 'h:mm a';
  return { timezone: timezone, dateFormat: dateFormat, timeFormat: timeFormat };
}


function getValidNetworkDashboardTimezone_(timezone) {
  const value = String(timezone || '').trim();
  if (!/^(?:UTC|GMT|[A-Za-z_]+(?:\/[A-Za-z0-9_.+\-]+)+)$/.test(value)) return '';
  return getNetworkDashboardZoneFormatter_(value) ? value : '';
}


// Apps Script executions do not share globals. Reuse validated formatters across rows in this request.
var NETWORK_DASHBOARD_ZONE_FORMATTERS_ = new Map();

function getNetworkDashboardZoneFormatter_(timezone) {
  if (!NETWORK_DASHBOARD_ZONE_FORMATTERS_.has(timezone)) {
    let formatter = null;
    try {
      formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone, calendar: 'gregory', numberingSystem: 'latn',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      });
    } catch (error) {}
    NETWORK_DASHBOARD_ZONE_FORMATTERS_.set(timezone, formatter);
  }
  return NETWORK_DASHBOARD_ZONE_FORMATTERS_.get(timezone);
}


function getEffectiveTimezone_() {
  return getNetworkDashboardRegionalPreferences_().timezone;
}


function getNetworkDashboardTimezone_() {
  return getEffectiveTimezone_();
}


function getNetworkDashboardCalendarTimezone_() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const timezone = spreadsheet && spreadsheet.getSpreadsheetTimeZone();
    if (getValidNetworkDashboardTimezone_(timezone)) return timezone;
  } catch (error) {}
  return getEffectiveTimezone_();
}


function parseNetworkDashboardDateOnly_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    if (isNaN(value.getTime())) return null;
    return parseNetworkDashboardDateOnly_(Utilities.formatDate(
      value,
      getNetworkDashboardCalendarTimezone_(),
      'yyyy-MM-dd'
    ));
  }
  if (typeof value === 'object') {
    return makeNetworkDashboardDateParts_(value.year, value.month, value.day);
  }

  const text = String(value).trim();
  if (!text) return null;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return makeNetworkDashboardDateParts_(match[1], match[2], match[3]);

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  const dayFirst = getNetworkDashboardRegionalPreferences_().dateFormat === 'dd/MM/yyyy';
  const month = first > 12 ? second : second > 12 ? first : dayFirst ? second : first;
  const day = first > 12 ? first : second > 12 ? second : dayFirst ? first : second;
  return makeNetworkDashboardDateParts_(match[3], month, day);
}


function makeNetworkDashboardDateParts_(year, month, day) {
  const parts = { year: Number(year), month: Number(month), day: Number(day) };
  return isValidNetworkDashboardDateParts_(parts.year, parts.month, parts.day)
    ? parts : null;
}


// Parse ISO-style timestamps only. Legacy unzoned sheet text uses the sheet timezone,
// not whichever timezone happens to be set on the server or browser.
function parseNetworkDashboardTimestamp_(value, localTimezone, occurrence) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : value;
  }
  const parsed = readNetworkDashboardTimestampParts_(value);
  if (!parsed) return null;
  if (parsed.offset) return parseNetworkDashboardOffsetTimestamp_(parsed);
  const matches = findNetworkDashboardLocalInstants_(
    parsed, localTimezone || getNetworkDashboardCalendarTimezone_()
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1 && occurrence === 'earlier') return matches[0];
  if (matches.length > 1 && occurrence === 'later') return matches[matches.length - 1];
  return null;
}


function readNetworkDashboardTimestampParts_(value) {
  const text = String(value == null ? '' : value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/i);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = '00', fraction = '', suffix = ''] = match;
  if (!isValidNetworkDashboardDateParts_(Number(year), Number(month), Number(day)) ||
      Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return null;
  const wall = year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + second;
  return { wall: wall, fractionalMs: Number(fraction.padEnd(3, '0')), offset: suffix.toUpperCase() };
}


function parseNetworkDashboardOffsetTimestamp_(parsed) {
  const offset = parsed.offset.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  const result = new Date(parsed.wall + '.' + String(parsed.fractionalMs).padStart(3, '0') + offset);
  return isNaN(result.getTime()) ? null : result;
}


function projectNetworkDashboardWallTime_(date, timezone) {
  const formatter = getNetworkDashboardZoneFormatter_(timezone);
  if (!formatter) return '';
  const parts = {};
  formatter.formatToParts(date).forEach(part => { parts[part.type] = part.value; });
  return String(parts.year).padStart(4, '0') + '-' + parts.month + '-' + parts.day +
    'T' + parts.hour + ':' + parts.minute + ':' + parts.second;
}


function findNetworkDashboardLocalInstants_(parsed, timezone) {
  if (!getValidNetworkDashboardTimezone_(timezone)) return [];
  const clockMs = Date.parse(parsed.wall + 'Z');
  const offsets = new Set();
  // Sample on both sides of any nearby transition. Round-tripping candidates
  // means gaps produce no matches and repeated times retain both instants.
  [-36, -12, 0, 12, 36].forEach(hours => {
    const sampleMs = clockMs + hours * 3600000;
    const wall = projectNetworkDashboardWallTime_(new Date(sampleMs), timezone);
    offsets.add(Date.parse(wall + 'Z') - sampleMs);
  });
  return [...offsets]
    .map(offset => new Date(clockMs - offset + parsed.fractionalMs))
    .filter(date => projectNetworkDashboardWallTime_(date, timezone) === parsed.wall)
    .sort((a, b) => a.getTime() - b.getTime());
}


function serializeNetworkDashboardTimestamp_(value) {
  const timestamp = parseNetworkDashboardTimestamp_(value);
  return timestamp ? timestamp.toISOString() : String(value || '').trim();
}


function parseNetworkDashboardDate_(value) {
  const dateOnly = parseNetworkDashboardDateOnly_(value);
  if (dateOnly) return Object.assign({ dateOnly: true }, dateOnly);
  const timestamp = parseNetworkDashboardTimestamp_(value);
  return timestamp ? { date: timestamp, dateOnly: false } : null;
}


function isValidNetworkDashboardDateParts_(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}


function formatNetworkDashboardDateParts_(parts, format) {
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  if (format === 'yyyy-MM-dd') return year + '-' + month + '-' + day;
  if (format === 'dd/MM/yyyy') return day + '/' + month + '/' + year;
  return month + '/' + day + '/' + year;
}


function formatNetworkDashboardDateOnly_(value) {
  const parts = parseNetworkDashboardDateOnly_(value);
  if (!parts) return String(value == null ? '' : value).trim();
  return formatNetworkDashboardDateParts_(parts, getNetworkDashboardRegionalPreferences_().dateFormat);
}


function formatNetworkDashboardDateTime_(value) {
  const timestamp = parseNetworkDashboardTimestamp_(value);
  if (!timestamp) return String(value == null ? '' : value).trim();
  const regional = getNetworkDashboardRegionalPreferences_();
  return Utilities.formatDate(
    timestamp,
    regional.timezone,
    regional.dateFormat + ' ' + regional.timeFormat
  );
}


function formatNetworkDashboardDate_(value, includeTime) {
  return includeTime
    ? formatNetworkDashboardDateTime_(value)
    : formatNetworkDashboardDateOnly_(value);
}


function isDateOnlyHeader_(header) {
  const name = String(header || '').trim();
  return /(^|\s)date$/i.test(name) ||
    /warranty|expiration|expiry|renewal|replacement|maintenance date/i.test(name);
}


function isDateTimeHeader_(header) {
  return /timestamp|(^|\s)(sync|synced|updated|created|imported|checked)(\s|$)|started|restored|offline since|^reviewed at$|^last attempt$/i
    .test(String(header || '').trim());
}


function formatNetworkDashboardField_(header, value) {
  if (value === null || value === undefined || value === '') return '';
  if (isDateOnlyHeader_(header)) return formatNetworkDashboardDateOnly_(value);
  if (isDateTimeHeader_(header)) return formatNetworkDashboardDateTime_(value);
  return String(value);
}


function normalizeNetworkDashboardSheetValue_(header, value) {
  if (isDateOnlyHeader_(header)) {
    const parts = parseNetworkDashboardDateOnly_(value);
    if (!parts) return value;
    return Utilities.parseDate(
      formatNetworkDashboardDateParts_(parts, 'yyyy-MM-dd'),
      getNetworkDashboardCalendarTimezone_(),
      'yyyy-MM-dd'
    );
  }
  if (isDateTimeHeader_(header)) {
    return parseNetworkDashboardTimestamp_(value, getEffectiveTimezone_()) || value;
  }
  return value;
}


function getNetworkDashboardDateOnlySortValue_(value) {
  const parts = parseNetworkDashboardDateOnly_(value);
  return parts ? parts.year * 10000 + parts.month * 100 + parts.day : 0;
}
