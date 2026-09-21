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
  if (!value) return '';
  try {
    Utilities.formatDate(new Date(0), value, 'yyyy');
    return value;
  } catch (error) {
    return '';
  }
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


function parseNetworkDashboardTimestamp_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : value;
  }
  const text = String(value).trim();
  if (!text || parseNetworkDashboardDateOnly_(text)) return null;
  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}


function parseNetworkDashboardDate_(value) {
  const dateOnly = parseNetworkDashboardDateOnly_(value);
  if (dateOnly) return Object.assign({ dateOnly: true }, dateOnly);
  const timestamp = parseNetworkDashboardTimestamp_(value);
  return timestamp ? { date: timestamp, dateOnly: false } : null;
}


function isValidNetworkDashboardDateParts_(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
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
  return /timestamp|(^|\s)(sync|synced|updated|created|imported|checked)(\s|$)|started|restored|offline since/i
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
  if (isDateTimeHeader_(header)) return parseNetworkDashboardTimestamp_(value) || value;
  return value;
}


function getNetworkDashboardDateOnlySortValue_(value) {
  const parts = parseNetworkDashboardDateOnly_(value);
  return parts ? parts.year * 10000 + parts.month * 100 + parts.day : 0;
}
