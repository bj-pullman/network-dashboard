const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceFiles = ['Performance.js', 'Config.js', 'App.js', 'Options.js', 'Integrations.js',
  'Setup.js', 'ArubaCentral.js', 'UptimeRobot.js', 'Outages.js', 'Code.js'];

function createHarness({ baseline = false } = {}) {
  const sheets = new Map();
  const cache = new Map();
  const properties = new Map([['UPTIMEROBOT_API_KEY', 'fixture-only-not-a-real-key']]);
  const calls = [];
  const logs = [];
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
    function range(row = 1, column = 1, height = 1, width = 1) {
      const result = {
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
      for (const method of ['setFontWeight', 'setBackground', 'setFontColor', 'setNumberFormat',
        'setWrap', 'protect']) {
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
      getDataRange() {
        call('getDataRange', name);
        return range(1, 1, Math.max(1, data.length), Math.max(1, ...data.map(row => row.length)));
      },
      appendRow(row) { write('appendRow', name); data.push(row); },
      deleteRow(row) { write('deleteRow', name); data.splice(row - 1, 1); },
      setFrozenRows() { write('setFrozenRows', name); return sheet; },
      autoResizeColumns() { write('autoResizeColumns', name); return sheet; }
    };
    sheets.set(name, sheet);
    return sheet;
  }
  const spreadsheet = {
    getSheetByName(name) { call('getSheetByName', name); return sheets.get(name) || null; },
    insertSheet(name) { write('insertSheet', name); return makeSheet(name, []); },
    getSpreadsheetTimeZone() { return 'America/Chicago'; }
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
      getActiveSpreadsheet() { call('getActiveSpreadsheet'); return spreadsheet; },
      newDataValidation() {
        let options;
        const builder = { requireValueInList(values) { options = values; return builder; },
          setAllowInvalid() { return builder; }, build() { return options; } };
        return builder;
      }
    },
    Session: { getActiveUser: () => ({ getEmail: () => email }), getScriptTimeZone: () => 'America/Chicago' },
    CacheService: { getScriptCache: () => ({
      get: key => cache.get(key) || null,
      put: (key, value) => cache.set(key, value), remove: key => cache.delete(key),
      removeAll: keys => keys.forEach(key => cache.delete(key))
    }) },
    PropertiesService: { getScriptProperties: () => scriptProperties },
    Utilities: { formatDate: date => new Date(date).toISOString(), getUuid: () => 'fixture-uuid' },
    UrlFetchApp: { fetch() { throw new Error('Unexpected external API request during a page read'); } }
  });
  let configSource;
  for (const file of sourceFiles) {
    if (baseline && file === 'Performance.js') continue;
    const baselineRef = typeof baseline === 'string' ? baseline : 'HEAD';
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
  const seedPath = path.join(root, 'DevSeed.js');
  if (fs.existsSync(seedPath)) vm.runInContext(fs.readFileSync(seedPath, 'utf8'), context, { filename: 'DevSeed.js' });
  function records(name, objects) {
    const sheet = sheets.get(name);
    const headers = sheet.data[0];
    sheet.data.push(...objects.map(object => headers.map(header => object[header] ?? '')));
  }
  const cameraRows = typeof context.devSeedSecurityCameraRows_ === 'function' ? context.devSeedSecurityCameraRows_() :
    Array.from({ length: 18 }, (_, i) => ({ Location: 'Site ' + (i + 1), 'Asset / System': 'CAM-' + (i + 1),
      Category: 'Primary Site', 'IP Address': '10.40.10.' + (i + 10), Username: 'fixture-user', Password: 'fixture-secret' }));
  records('Security Cameras', cameraRows);
  if (typeof context.devSeedBusCameraRows_ === 'function') {
    const bus = sheets.get('Bus Cameras');
    bus.data.push(...context.devSeedBusCameraRows_().map(row => bus.data[6].map(header => row[header] || '')));
  }
  for (const [name, seedFunction] of [['Switches', 'devSeedSwitchRows_'], ['Access Points', 'devSeedAccessPointRows_'],
    ['Servers', 'devSeedServerRows_'], ['Offline Servers', 'devSeedOfflineServerRows_'],
    ['IP Route Tables', 'devSeedRouteRows_'], ['Internet WAN', 'devSeedInternetWanRows_'],
    ['Intercom Bell System', 'devSeedIntercomRows_'], ['Backup Schedule', 'devSeedBackupRows_']]) {
    if (typeof context[seedFunction] === 'function') records(name, context[seedFunction]());
  }
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
  return { context, evaluate, invoke, sheets, cache, properties, calls, logs, records, cameraRows };
}

module.exports = { createHarness, root };
