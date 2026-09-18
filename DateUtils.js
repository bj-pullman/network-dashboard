/**
 * Shared date parsing and display helpers.
 * Date-only input is parsed from calendar components so an ISO date never
 * crosses a day boundary because of UTC conversion.
 */
function getNetworkDashboardTimezone_() {
  try {
    return String(AppConfig.get('regional.timezone') || '').trim() ||
      getDefaultTimezone_();
  } catch (error) {
    return getDefaultTimezone_();
  }
}


function parseNetworkDashboardDate_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? null : { date: value, dateOnly: false };
  }

  const text = String(value).trim();
  if (!text) return null;

  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!isValidNetworkDashboardDateParts_(year, month, day)) return null;
    return {
      date: Utilities.parseDate(
        String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
        getNetworkDashboardTimezone_(),
        'yyyy-MM-dd'
      ),
      dateOnly: true,
      year: year,
      month: month,
      day: day
    };
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const year = Number(match[3]);
    const month = Number(match[1]);
    const day = Number(match[2]);
    if (!isValidNetworkDashboardDateParts_(year, month, day)) return null;
    return {
      date: Utilities.parseDate(
        String(year) + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0'),
        getNetworkDashboardTimezone_(),
        'yyyy-MM-dd'
      ),
      dateOnly: true,
      year: year,
      month: month,
      day: day
    };
  }

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : { date: parsed, dateOnly: false };
}


function isValidNetworkDashboardDateParts_(year, month, day) {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}


function formatNetworkDashboardDate_(value, includeTime) {
  const parsed = parseNetworkDashboardDate_(value);
  if (!parsed) return String(value == null ? '' : value).trim();
  if (parsed.dateOnly) {
    return String(parsed.month).padStart(2, '0') + '/' +
      String(parsed.day).padStart(2, '0') + '/' + parsed.year;
  }
  return Utilities.formatDate(
    parsed.date,
    getNetworkDashboardTimezone_(),
    includeTime ? 'MM/dd/yyyy h:mm a' : 'MM/dd/yyyy'
  );
}


function isDateOnlyHeader_(header) {
  const name = String(header || '').trim();
  return /(^|\s)date$/i.test(name) ||
    /warranty|expiration|maintenance date/i.test(name);
}


function isDateTimeHeader_(header) {
  return /timestamp|(^|\s)(sync|synced|updated|created|imported)(\s|$)|started|restored/i
    .test(String(header || '').trim());
}


function formatNetworkDashboardField_(header, value) {
  if (value === null || value === undefined || value === '') return '';
  if (isDateOnlyHeader_(header)) return formatNetworkDashboardDate_(value, false);
  if (isDateTimeHeader_(header)) return formatNetworkDashboardDate_(value, true);
  return String(value);
}


function normalizeNetworkDashboardSheetValue_(header, value) {
  if (!isDateOnlyHeader_(header) && !isDateTimeHeader_(header)) return value;
  const parsed = parseNetworkDashboardDate_(value);
  return parsed ? parsed.date : value;
}
