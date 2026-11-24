const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['Performance.js', 'Config.js', 'DateUtils.js', 'App.js', 'Options.js',
  'ChangeLogService.js', 'ContactsService.js', 'PlaybookService.js', 'ServerRelationships.js', 'Integrations.js', 'Setup.js', 'ArubaCentral.js',
  'UptimeRobot.js', 'Outages.js', 'Code.js'];

function createHarness({
  baseline = false, scriptTimezone = 'America/Chicago', spreadsheetTimezone = 'America/Chicago'
} = {}) {
  const sheets = new Map();
  const cache = new Map();
  const documents = new Map();
  const properties = new Map([['UPTIMEROBOT_API_KEY', 'fixture-only-not-a-real-key']]);
  const calls = [];
  const logs = [];
  const triggers = [];
  const cacheWrites = [];
  const scriptLock = {
    waitCount: 0,
    releaseCount: 0,
    timeout: null,
    onWait: null,
    waitError: null
  };
  let triggerSequence = 0;
  let uuidSequence = 0;
  let email = 'admin@example.test';
  let readOnly = false;
  function call(name, sheet) { calls.push({ name, sheet }); }
  function write(name, sheet) {
    call(name, sheet);
    if (readOnly) throw new Error('Write on read path: ' + name + ' ' + sheet);
  }
  function makeSheet(name, values) {
    const data = values.map(row => row.slice());
    const validations = new Map();
    const protections = [];
    const columnLetter = column => {
      let value = column, output = '';
      while (value > 0) {
        output = String.fromCharCode(65 + ((value - 1) % 26)) + output;
        value = Math.floor((value - 1) / 26);
      }
      return output;
    };
    function range(row = 1, column = 1, height = 1, width = 1) {
      const result = {
        getSheet() { return sheet; },
        getA1Notation() {
          const start = columnLetter(column) + row;
          const end = columnLetter(column + width - 1) + (row + height - 1);
          return start === end ? start : start + ':' + end;
        },
        getValues() {
          call('getValues', name);
          return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) =>
            data[row - 1 + y]?.[column - 1 + x] ?? ''));
        },
        getDisplayValues() {
          call('getDisplayValues', name);
          return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => {
            const value = data[row - 1 + y]?.[column - 1 + x] ?? '';
            return typeof value === 'boolean' ? String(value).toUpperCase() : String(value);
          }));
        },
        getDisplayValue() { return result.getDisplayValues()[0][0]; },
        getFormulas() {
          return result.getValues().map(values => values.map(value =>
            typeof value === 'string' && value.startsWith('=') ? value : ''));
        },
        setValues(rows) {
          write('setValues', name);
          rows.forEach((values, y) => values.forEach((value, x) => {
            const rule = validations.get((row + y) + ':' + (column + x));
            if (rule && value !== '' && !rule.includes(String(value))) throw new Error('Validation: ' + name + ' ' + (row + y));
            data[row - 1 + y] ||= [];
            data[row - 1 + y][column - 1 + x] = value;
          }));
          return result;
        },
        setValue(value) { return result.setValues([[value]]); },
        setFormula(value) { return result.setValues([[value]]); },
        clearContent() { return result.setValues(Array.from({ length: height }, () => Array(width).fill(''))); },
        clearDataValidations() {
          write('clearDataValidations', name);
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) validations.delete((row + y) + ':' + (column + x));
          return result;
        },
        setDataValidation(rule) {
          write('setDataValidation', name);
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) validations.set((row + y) + ':' + (column + x), rule);
          return result;
        }
      };
      result.protect = () => {
        write('protect', name);
        let description = '';
        let editors = [];
        let warningOnly = false;
        const protection = {
          getRange: () => result,
          getDescription: () => description,
          setDescription(value) { description = value; return protection; },
          setWarningOnly(value) { warningOnly = value; return protection; },
          isWarningOnly() { return warningOnly; },
          canDomainEdit: () => false,
          setDomainEdit() { return protection; },
          addEditor(editor) { if (!editors.includes(editor)) editors.push(editor); return protection; },
          getEditors() { return editors.slice(); },
          removeEditors(removed) { editors = editors.filter(editor => !removed.includes(editor)); return protection; },
          remove() {
            const index = protections.indexOf(protection);
            if (index >= 0) protections.splice(index, 1);
          }
        };
        protections.push(protection);
        return protection;
      };
      for (const method of ['setFontWeight', 'setBackground', 'setFontColor', 'setNumberFormat',
        'setWrap']) {
        result[method] = () => { write(method, name); return result; };
      }
      return result;
    }
    const sheet = {
      data,
      getName() { call('getName', name); return name; },
      getLastRow() { call('getLastRow', name); return data.length; },
      getLastColumn() { call('getLastColumn', name); return Math.max(1, ...data.map(row => row.length)); },
      getMaxRows() { return Math.max(1000, data.length); },
      getMaxColumns() { return Math.max(26, ...data.map(row => row.length)); },
      getRange(...args) { call('getRange', name); return range(...args); },
      getProtections(type) { return type === 'SHEET' ? [] : protections.slice(); },
      getFrozenRows() { return 1; },
      getDataRange() {
        call('getDataRange', name);
        return range(1, 1, Math.max(1, data.length), Math.max(1, ...data.map(row => row.length)));
      },
      appendRow(row) { write('appendRow', name); data.push(row); },
      deleteRow(row) { write('deleteRow', name); data.splice(row - 1, 1); },
      setFrozenRows() { write('setFrozenRows', name); return sheet; },
      setTabColor() { write('setTabColor', name); return sheet; },
      autoResizeColumns() { write('autoResizeColumns', name); return sheet; }
    };
    sheet.getParent = () => spreadsheet;
    sheet.copyTo = () => {
      const copyName = 'Copy of ' + name;
      return makeSheet(copyName, data);
    };
    sheet.setName = value => {
      write('setName', name);
      sheets.delete(name);
      name = String(value);
      sheets.set(name, sheet);
      return sheet;
    };
    sheets.set(name, sheet);
    return sheet;
  }
  const spreadsheet = {
    getSheetByName(name) { call('getSheetByName', name); return sheets.get(name) || null; },
    getSheets() { return [...sheets.values()]; },
    insertSheet(name) { write('insertSheet', name); return makeSheet(name, []); },
    getUrl() { return 'https://docs.google.com/spreadsheets/d/fixture-spreadsheet/edit'; },
    getSpreadsheetTimeZone() { return spreadsheetTimezone; }
  };
  const scriptProperties = {
    getProperty(key) { return properties.get(key) || null; },
    getProperties() { return Object.fromEntries(properties); },
    setProperty(key, value) { write('setProperty'); properties.set(key, value); },
    deleteProperty(key) { properties.delete(key); }
  };
  const context = vm.createContext({
    console: { log: (...args) => logs.push(args), warn: (...args) => logs.push(args) },
    SpreadsheetApp: {
      flush() { if (scriptLock.onFlush) scriptLock.onFlush(); },
      ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' },
      getActiveSpreadsheet() { call('getActiveSpreadsheet'); return spreadsheet; },
      newDataValidation() {
        let options;
        const builder = { requireValueInList(values) { options = values; return builder; },
          setAllowInvalid() { return builder; }, build() { return options; } };
        return builder;
      }
    },
    DocumentApp: { openById(id) {
      call('openDocument');
      if (!documents.has(id)) throw new Error('The local fixture document is unavailable');
      const fixture = documents.get(id);
      return { getName: () => fixture.title, getBody: () => ({ getText: () => fixture.text }) };
    } },
    Session: { getActiveUser: () => ({ getEmail: () => email }), getEffectiveUser: () => ({ getEmail: () => email }),
      getScriptTimeZone: () => scriptTimezone },
    CacheService: { getScriptCache: () => ({
      get: key => cache.get(key) || null,
      put: (key, value, seconds) => { cacheWrites.push({ key, value, seconds }); cache.set(key, value); },
      remove: key => cache.delete(key),
      removeAll: keys => keys.forEach(key => cache.delete(key))
    }) },
    PropertiesService: { getScriptProperties: () => scriptProperties },
    LockService: { getScriptLock: () => ({
      waitLock(timeout) {
        scriptLock.waitCount++;
        scriptLock.timeout = timeout;
        if (scriptLock.onWait) scriptLock.onWait();
        if (scriptLock.waitError) throw scriptLock.waitError;
      },
      releaseLock() {
        scriptLock.releaseCount++;
        if (scriptLock.onRelease) scriptLock.onRelease();
      }
    }), getDocumentLock: () => ({
      waitLock(timeout) { scriptLock.waitCount++; scriptLock.timeout = timeout; },
      releaseLock() { scriptLock.releaseCount++; }
    }) },
    ScriptApp: {
      getProjectTriggers: () => triggers.slice(),
      newTrigger(handler) {
        const id = 'trigger-' + (++triggerSequence);
        const trigger = { handler, getHandlerFunction: () => handler, getUniqueId: () => id };
        const builder = {
          timeBased: () => builder,
          everyDays: () => builder,
          atHour: () => builder,
          at: () => builder,
          create() { triggers.push(trigger); return trigger; }
        };
        return builder;
      },
      deleteTrigger(trigger) {
        const index = triggers.indexOf(trigger);
        if (index >= 0) triggers.splice(index, 1);
      }
    },
    Utilities: {
      formatDate(date, timezone, format) {
        const value = new Date(date);
        const collect = options => Object.fromEntries(new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: timezone }, options))
          .formatToParts(value).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
        const calendar = collect({ year: 'numeric', month: '2-digit', day: '2-digit' });
        if (format === 'yyyy') return calendar.year;
        let output = format.replace('yyyy', calendar.year).replace('MM', calendar.month).replace('dd', calendar.day);
        if (format.includes('HH:mm')) {
          const time = collect({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
          output = output.replace('HH', time.hour).replace('mm', time.minute);
        } else if (format.includes('h:mm a')) {
          const time = collect({ hour: 'numeric', minute: '2-digit', hour12: true });
          output = output.replace('h', String(Number(time.hour))).replace('mm', time.minute).replace('a', time.dayPeriod);
        }
        return output;
      },
      parseDate(value, timezone, format) {
        if (format !== 'yyyy-MM-dd') throw new Error('Unsupported date format in fixture: ' + format);
        const midnight = Date.parse(value + 'T00:00:00Z');
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' });
        const offsetAt = instant => {
          const label = formatter.formatToParts(instant).find(part => part.type === 'timeZoneName').value;
          const match = label.match(/^GMT([+-])(\d{2}):(\d{2})$/);
          return !match ? 0 : (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '-' ? -60000 : 60000);
        };
        return new Date(midnight - offsetAt(midnight - offsetAt(midnight)));
      },
      getUuid: () => '00000000-0000-4000-8000-' + String(++uuidSequence).padStart(12, '0')
    },
    UrlFetchApp: { fetch() { throw new Error('Unexpected external API request during a page read'); } }
  });
  let configSource;
  const baselineRef = typeof baseline === 'string' ? baseline : 'HEAD';
  const baselineFiles = baseline ? new Set(execFileSync(
    'git', ['ls-tree', '--name-only', baselineRef], { cwd: root, encoding: 'utf8' }
  ).trim().split(/\r?\n/)) : null;
  const laterFiles = new Set(['Performance.js', 'DateUtils.js', 'ChangeLogService.js', 'ContactsService.js', 'PlaybookService.js', 'ServerRelationships.js']);
  for (const file of sourceFiles) {
    if (baselineFiles && laterFiles.has(file) && !baselineFiles.has(file)) continue;
    const source = baseline ? execFileSync('git', ['show', baselineRef + ':' + file], { cwd: root, encoding: 'utf8' }) :
      fs.readFileSync(path.join(root, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
    if (file === 'Config.js') configSource = source;
  }
  const evaluate = source => vm.runInContext(source, context);
  const schema = evaluate('getNetworkDashboardSchema_()');
  for (const [name, definition] of Object.entries(schema)) {
    const data = [];
    if (definition.headers) data.push([...definition.headers]);
    for (const item of [...(definition.seedCells || []), ...(definition.seedRows || [])]) {
      data[item.row - 1] = [...item.values];
    }
    for (const item of definition.headerRanges || []) data[item.row - 1] = [...item.headers];
    makeSheet(name, Array.from({ length: Math.max(1, data.length) }, (_, i) => data[i] || []));
  }
  function records(name, objects) {
    const sheet = sheets.get(name);
    if (!sheet) return;
    const headers = sheet.data[0];
    sheet.data.push(...objects.map(object => headers.map(header => object[header] ?? '')));
  }
  const cameraRows = Array.from({ length: 18 }, (_, i) => ({
    Name: 'Fixture Camera ' + (i + 1), Location: 'Fixture Camera ' + (i + 1),
    'Asset / System': 'FIXTURE-CAM-' + (i + 1), Category: 'Fixture',
    'IP Address': '192.0.2.' + (i + 10), Username: 'fixture-user',
    Password: 'QA_ONLY_NOT_A_REAL_SECRET', 'Server Location': i % 2 ? 'Lab' : 'Office'
  }));
  records('Security Cameras', cameraRows);
  records('Intercom Bell System', [{ Location: 'Fixture Office', 'IP Address': '192.0.2.40',
    Username: 'fixture-user', Password: 'QA_ONLY_NOT_A_REAL_SECRET' }]);
  records('Internet WAN', [{ 'Circuit ID': 'WAN-FIXTURE-1', 'Circuit Name': 'Fixture WAN',
    'Site / Location': 'Fixture Office', Provider: 'Fixture Provider', Role: 'Primary',
    'Service Type': 'Fiber', 'Public Network / CIDR': '198.51.100.0/24',
    'UptimeRobot Monitor ID': '123', Status: 'Active', Notes: 'Fixture only' }]);
  const users = [
    ['admin@example.test', 'Fixture Admin', true, 'admin', 'edit', '{}', ''],
    ['viewer@example.test', 'Fixture Viewer', true, 'user', 'view', '{}', ''],
    ['blocked@example.test', 'Fixture Blocked', true, 'user', 'view', '{"securityCameras":"none"}', ''],
    ['inactive@example.test', 'Fixture Inactive', false, 'admin', 'edit', '{}', '']
  ];
  sheets.get('App Users').data.push(...users);
  const settings = evaluate('getAppSettingDefinitions_()');
  records('App Settings', settings.map(setting => ({ Key: setting.key,
    Value: setting.key.startsWith('modules.') ? 'true' : setting.defaultValue })));
  records('App Integrations', evaluate('Object.keys(getIntegrationRegistry_())').map(id => ({
    'Integration ID': id, Enabled: id === 'uptimerobot', 'Config JSON': '{}', 'Record Counts JSON': '{}'
  })));
  records('UptimeRobot', [{ 'Monitor ID': '123', 'Monitor Name': 'Fixture WAN', 'Monitor Type': 'HTTP',
    Target: 'https://example.test', Health: 'Online', 'Provider Status': '2', 'Last Sync': '2026-09-04 08:00:00' }]);

  function invoke(method, args = [], { user = email, readonly = method === 'appGetPageData' } = {}) {
    email = user;
    readOnly = readonly;
    calls.length = 0;
    // Apps Script starts with fresh globals for each RPC; CacheService survives.
    if (!baseline) evaluate('APP_EXECUTION_METADATA = { access: {}, modules: null, integrationState: null };');
    vm.runInContext(configSource, context, { filename: 'Config.js' });
    try { return context[method](...args); } finally { readOnly = false; }
  }
  return { context, evaluate, invoke, sheets, spreadsheet, cache, cacheWrites, properties, calls, logs,
    scriptLock, triggers, records, cameraRows, documents };
}

module.exports = { createHarness, root };
