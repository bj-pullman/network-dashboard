// The single Playbook uses typed columns, never ordinary page payloads.
function getStandardPlaybookPolicies_() {
  const state = ['Status', 'infrastructureStatus'];
  const address = ['IP Address', 'ip'];
  return {
    switches: { sheets: ['Switches'],
      detail: [['Device Label', 'switchLabel'], ['Model', 'switchModel'], state, ['Role', 'switchRole'],
        ['Port Capacity (Active)', 'switchPorts'], address] },
    accessPoints: { sheets: ['Access Points'], detail: [
      ['Device Label', 'label'], ['Campus', 'label'], ['Model', 'label'], state,
      ['MAC Address', 'mac'], ['Management Mode', 'label'], address
    ] },
    servers: { sheets: ['Servers', 'Offline Servers'], kind: 'servers', detail: [
      ['Server Name', 'label'], ['Type', 'configuredOption'], state, ['Location', 'label'],
      ['Closet ID', 'label'], ['Operating System', 'label', 'OS'], ['Offline Since', 'date'], address
    ] },
    networkClosets: { sheets: ['Network Closets'], detail: [
      ['Closet / Room Name', 'label'], ['Campus', 'label'], ['Room Number', 'label'],
      ['Closet ID', 'label'], ['Type', 'closetType'], ['Electrical Circuit / Panel', 'panel', 'Circuit / panel'],
      ['Outlet / Connector Type', 'label', 'Outlet type'], ['Redundant Power Available', 'yesNo', 'Redundant power']
    ], additional: [{ key: 'ups', label: 'UPS inventory', sheets: ['Network Closet UPS'], detail: [
      ['Closet ID', 'label'], ['UPS ID', 'label'], ['Manufacturer', 'label'], ['Model', 'label'],
      ['Capacity / VA', 'capacity'], ['Battery Replacement Date', 'date', 'Battery replaced'], ['Last Service Date', 'date'], ['Management IP', 'ip', 'Mgmt IP']
    ] }] },
    routes: { sheets: ['IP Route Tables'], detail: [
      ['Campus / Location', 'label'], ['VLAN ID', 'vlan'], ['VLAN Name', 'label'],
      ['Network / CIDR', 'cidr'], ['Gateway', 'ip'], ['DHCP Scope / Pool', 'ipScope']
    ] },
    internetWan: { sheets: ['Internet WAN'], detail: [
      ['Circuit Name', 'label'], ['Site / Location', 'label', 'Site'], ['Provider', 'label'],
      ['Status', 'wanStatus'], ['Role', 'wanRole'], ['Service Type', 'wanServiceType'],
      ['Bandwidth', 'bandwidth'], ['Public Network / CIDR', 'cidr', 'Public CIDR'], ['Gateway', 'ip']
    ] },
    securityCameras: { sheets: ['Security Cameras'], detail: [
      ['Name', 'label'], ['Asset / System', 'label'], ['Server Location', 'label'], address, ['Username', 'username']
    ] },
    busCameras: { sheets: ['Bus Cameras'], headerRow: 7, detail: [
      ['Bus Name/Number', 'label'], ['Bus Type', 'label'], ['DVR Type', 'label'],
      ['Bridge Mac', 'mac'], ['DVR IP', 'ip'], ['Bridge IP', 'ip']
    ] },
    intercom: { sheets: ['Intercom Bell System'], detail: [
      ['Location', 'label'], ['VLAN Name', 'label'], ['VLAN ID', 'vlan'], address,
      ['Subnet', 'cidr'], ['Gateway', 'ip'], ['Subnet Mask', 'ip'], ['Port', 'tcpPort'], ['Username', 'username']
    ] },
    ssids: { sheets: ['SSIDs'], detail: [
      ['SSID', 'ssid'], ['Status', 'enabledDisabled'], ['Primary Usage', 'ssidOption'],
      ['Bands / Radio Bands', 'ssidOption', 'Radio bands'], ['Security Level', 'ssidOption'], ['Key Management', 'ssidOption'],
      ['VLAN', 'vlan'], ['Client VLAN Assignment', 'ssidOption', 'VLAN mode']
    ] },
    outages: { sheets: ['Outages'], kind: 'outages' },
    changeLog: { sheets: ['Change Log'], kind: 'changes' },
    contacts: { sheets: ['Contacts'], kind: 'contacts' },
    backups: { sheets: ['Backup Schedule'], detail: [
      ['Server Name', 'label'], ['Backup Job Name', 'label', 'Backup job'], ['Backup Time', 'backupSchedule'],
      ['Target Location', 'label', 'Backup target'], ['Wasabi Job', 'label'], ['Wasabi Schedule', 'backupSchedule'], ['Size', 'storageSize']
    ] }
  };
}


function getStandardPlaybookSectionOptions_(pages) {
  const policies = getStandardPlaybookPolicies_();
  const groups = new Map();
  // Follow the same group ordering and order within each group as the sidebar.
  (pages || Object.values(APP_PAGE_CONFIG)).forEach(page => {
    if (!groups.has(page.group)) groups.set(page.group, []);
    if (Object.prototype.hasOwnProperty.call(policies, page.key)) {
      groups.get(page.group).push({ key: page.key, label: page.label });
    }
  });
  return [].concat(...groups.values());
}


function appGetStandardPlaybook(sectionKeys) {
  const access = getUserAccess_(getCurrentUserEmail_());
  if (!access.authorized) throw new Error('Unauthorized access.');
  if (!Array.isArray(sectionKeys) || sectionKeys.length > Object.keys(APP_PAGE_CONFIG).length ||
      sectionKeys.some(key => typeof key !== 'string')) throw new Error('Select valid Playbook sections.');

  const selected = new Set(sectionKeys);
  const policies = getStandardPlaybookPolicies_();
  const sections = [];
  const exclusions = [];
  const visiblePages = Object.values(APP_PAGE_CONFIG).filter(page =>
    isPageEnabled_(page.key) && (access.admin || (!page.adminOnly &&
      ['view', 'edit'].includes(access.permissions[page.key]))));
  const options = getStandardPlaybookSectionOptions_(visiblePages);
  const visibleKeys = new Set(options.map(option => option.key));
  const unavailableCount = [...selected].filter(key => !visibleKeys.has(key)).length;
  options.forEach(option => {
    if (!selected.has(option.key)) return;
    // A forbidden or failed section cannot masquerade as an empty tab.
    try {
      requirePagePermission_(option.key, 'view');
    } catch (error) {
      exclusions.push({ key: option.key, reason: 'unavailable' });
      return;
    }
    try {
      const permission = access.admin ? 'edit' : access.permissions[option.key];
      const result = readStandardPlaybookSection_(policies[option.key], option.key, permission);
      if (result.rows.length || result.additionalTables?.length) sections.push({ key: option.key, label: option.label, ...result });
      else exclusions.push({ key: option.key, label: option.label,
        reason: result.noEligibleFields ? 'no-eligible-fields' : 'empty' });
    } catch (error) {
      // Sheet/provider error details can contain environment metadata; keep
      // the response generic and allow individually successful sections.
      exclusions.push({ key: option.key, label: option.label, reason: 'failed' });
    }
  });

  const now = new Date();
  return {
    title: 'Network HQ Playbook',
    classification: 'Operational reference',
    generatedAt: now.toISOString(),
    generatedLabel: formatNetworkDashboardDateTime_(now) + ' (' + getEffectiveTimezone_() + ')',
    sections,
    exclusions,
    unavailableCount
  };
}


function hasStandardPlaybookSensitiveMarker_(value) {
  return /(?:pass(?:word|wd|code)|secret|token|api[-_. ]?key|credential|recovery[-_. ]?code|canary|gh[pousr]_|github_pat_|xox[baprs]-|(?:^|[^a-z])(?:sk|rk)[_-]|AIza|AKIA)/i.test(value);
}


function isStandardPlaybookSecretHeader_(header) {
  const words = String(header || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  // Classify headers only; never inspect excluded cell values to decide
  // whether the printed section needs a vault note.
  return isCredentialHeader_(header) ||
    /(?:^| )(?:pass(?:words?|wd|codes?|phrases?)?|pwd|pw|psk|secrets?|tokens?|credentials?|authentication key|api keys?|api credentials?|private keys?|shared keys?|pre shared keys?|preshared keys?|access keys?|encryption keys?|wpa[23]? keys?|wi fi keys?|wifi keys?|recovery (?:codes?|keys?)|community (?:string|name)|snmp community)(?: |$)/.test(words) ||
    /^(?:psk|passphrases?|apikeys?|accesstokens?|privatekeys?|recoverycodes?|communitystrings?)$/.test(words);
}

function readStandardPlaybookFields_(sheetName, fields, headerRow, audit) {
  if (!fields.length) return [];
  const sheet = getReadSheet_(sheetName);
  headerRow = headerRow || 1;
  if (!sheet || sheet.getLastRow() < headerRow || !sheet.getLastColumn()) {
    throw new Error('A Playbook backing sheet is unavailable.');
  }
  const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(value => String(value || '').trim());
  if (audit && headers.some(isStandardPlaybookSecretHeader_)) audit.credentialsOmitted = true;
  const rowCount = sheet.getLastRow() - headerRow;
  if (!rowCount) return [];
  const rows = [];
  fields.forEach(field => {
    const index = headers.indexOf(field);
    if (index < 0 || headers.lastIndexOf(field) !== index || isStandardPlaybookSecretHeader_(field)) return;
    // Inspect formula presence before reading values. A calculated cell might
    // reference any other sheet column, including an excluded credential field.
    const range = sheet.getRange(headerRow + 1, index + 1, rowCount, 1);
    const formulas = range.getFormulas().map(row => !!row[0]);
    const store = (values, offset) => values.forEach((cells, i) => {
      const row = offset + i;
      if (!rows[row]) rows[row] = {};
      rows[row][field] = cells[0];
    });
    if (!formulas.some(Boolean)) {
      store(range.getValues(), 0);
      return;
    }
    let start = 0;
    for (let i = 0; i <= rowCount; i++) {
      if (i < rowCount && !formulas[i]) continue;
      if (i > start) store(sheet.getRange(headerRow + 1 + start, index + 1, i - start, 1).getValues(), start);
      start = i + 1;
    }
  });
  return rows.filter(Boolean);
}


function safePlaybookUsername_(value) {
  if (typeof value !== 'string') return '';
  const name = value.trim();
  // Only standalone, human-readable account identifiers. No email/URL, spaces,
  // mixed username/password cells, or opaque token-shaped names.
  if (name.length > 32 || !/^[a-z][a-z0-9]{0,14}(?:[._-][a-z0-9]{1,14}){0,2}$/.test(name) ||
      /[0-9]{5}|[a-f0-9]{12}/i.test(name) || hasStandardPlaybookSensitiveMarker_(name)) return '';
  return name;
}


function safePlaybookSwitchField_(value, type) {
  if (type === 'switchPorts') {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const text = String(value).trim();
    const match = /^(\d{1,3})(?:\s*\/\s*(\d{1,3})\s+Active)?$/i.exec(text);
    if (!match) return '';
    const active = Number(match[1]);
    const total = Number(match[2] || match[1]);
    if (total < 1 || total > 512 || active > total) return '';
    return match[2] ? active + '/' + total + ' Active' : String(total);
  }

  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (type === 'switchRole') {
    return toStandardPlaybookOption_(text, ['Access', 'Core', 'Distribution', 'Standalone']) ||
      normalizeArubaSwitchRole_(text);
  }

  if (text.length > 40 || hasStandardPlaybookSensitiveMarker_(text)) return '';
  if (type === 'switchLabel') {
    // A bounded switch identifier, not a location, annotation, URL, or
    // hostname with a raw address or arbitrary opaque identifier appended.
    const parts = text.split('-');
    return parts.length <= 5 && !hasStandardPlaybookSensitiveMarker_(parts.join('')) &&
      parts.some(part => /^SW(?:ITCH)?[0-9]{0,3}$/i.test(part)) &&
      parts.filter(part => /^\d+$/.test(part)).length <= 1 &&
      parts.every(part => /^(?:[a-z]{1,10}[0-9]{0,3}|[0-9]{1,3})$/i.test(part)) ? text : '';
  }

  if (type === 'switchModel') {
    // Only model families and inventory SKU shapes known to the report.
    const recognized =
      /^(?:Aruba (?:CX )?|HPE? )(?:[1-9]\d{3}[A-Z]{0,2}|JL\d{3}[A-Z])(?:-(?:8|16|24|48)(?:P|G|T|X)?)?$/i.test(text) ||
      /^JL\d{3}[A-Z]$/i.test(text) ||
      /^Cisco (?:Catalyst )?C?\d{4}[A-Z]?(?:-(?:8|16|24|48)(?:P|G|T|X|U)?)?$/i.test(text) ||
      /^Juniper EX\d{4}(?:-(?:8|16|24|48)(?:P|T|X)?)?$/i.test(text) ||
      /^Demo (?:8|16|24|48)-port$/i.test(text);
    return recognized ? text : '';
  }

  return '';
}


function safePlaybookLabel_(value, maxLength) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const label = String(value).trim();
  if (!label || label.length > (maxLength || 48) || hasStandardPlaybookSensitiveMarker_(label) ||
      hasStandardPlaybookSensitiveMarker_(label.replace(/[^a-z0-9]/gi, '')) ||
      /(?:^|[ ._-])(?:bearer|psk|pin|community)(?=[ ._-]|$)/i.test(label) ||
      !/^[A-Za-z0-9][A-Za-z0-9 ._-]*$/.test(label) || (!/[a-z]/i.test(label) && !/^\d{1,6}$/.test(label))) return '';
  // Labels are not free-form annotations. Reject address-shaped, known token-
  // shaped, or long opaque runs; do not try to "clean up" an invalid label.
  if (/(?:\d{1,3}\.){3}\d{1,3}|[a-f0-9]{16,}|(?:^|[^a-z0-9])(?=[a-z0-9]{16,}(?:[^a-z0-9]|$))(?=[a-z0-9]*[a-z])(?=[a-z0-9]*[0-9])[a-z0-9]+/i.test(label)) return '';
  return label;
}

function safePlaybookSchedule_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    // Sheets can store an ordinary time-only cell using its 1899 serial epoch.
    // Dates/timestamps in a schedule field are not a validated recurrence.
    const wall = Utilities.formatDate(value, getNetworkDashboardCalendarTimezone_(), 'yyyy-MM-dd HH:mm');
    return /^1899-12-(?:29|30|31) /.test(wall) ? wall.slice(11) : '';
  }
  if (typeof value !== 'string' || value.length > 42) return '';
  const text = value.trim();
  const day = '(?:Daily|Nightly|Weekly|Weekdays|Weekends|Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?)';
  const clock = '(?:(?:0?[1-9]|1[0-2])(?::[0-5]\\d)? ?[AP]M|(?:[01]?\\d|2[0-3]):[0-5]\\d)';
  return new RegExp('^(?:' + day + '(?:(?: at)? ' + clock + ')?|' + clock + '(?: ' + day + ')?)$', 'i').test(text) ? text : '';
}

function safePlaybookField_(value, type, field, configuredOptions) {
  if (type === 'username') return safePlaybookUsername_(value);
  if (type === 'label' || type === 'ssid') return safePlaybookLabel_(value, type === 'ssid' ? 32 : 48);
  if (type === 'ssidOption') return toStandardPlaybookOption_(value, APP_PAGE_CONFIG.ssids.suggestedOptions[field] || []);
  if (type === 'mac') {
    const text = typeof value === 'string' ? value.trim() : '';
    const match = /^(?:[a-f0-9]{12}|[a-f0-9]{2}([:-])(?:[a-f0-9]{2}\1){4}[a-f0-9]{2})$/i.exec(text);
    return match ? text.replace(/[:-]/g, '').match(/../g).join(':').toUpperCase() : '';
  }
  if (type === 'date') return parseNetworkDashboardDateOnly_(value) ? formatNetworkDashboardDateOnly_(value) : '';
  if (type === 'backupSchedule') return safePlaybookSchedule_(value);
  if (type === 'panel') {
    if (typeof value !== 'string' && typeof value !== 'number') return '';
    const text = String(value).trim();
    const parts = text.split(/ *[/#] */);
    return parts.length <= 3 && parts.every(part => safePlaybookLabel_(part, 20)) ? text : '';
  }
  if (type === 'ipScope') {
    if (typeof value !== 'string' || value.length > 105) return '';
    const range = value.trim().split(/ *[-–] */);
    const addresses = range.map(part => safePlaybookField_(part, range.length === 1 ? 'cidr' : 'ip'));
    return addresses.length <= 2 && addresses.every(Boolean) ? addresses.join(' – ') : '';
  }
  if (['capacity', 'tcpPort', 'bandwidth', 'storageSize'].includes(type)) {
    const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    if (type === 'tcpPort') return /^\d{1,5}$/.test(text) && Number(text) >= 1 && Number(text) <= 65535 ? String(Number(text)) : '';
    if (type === 'capacity') return /^\d{1,6}(?: ?VA)?$/i.test(text) && Number.parseInt(text, 10) > 0 ? text : '';
    if (type === 'bandwidth') return /^\d{1,5}(?:\.\d{1,3})? ?[KMGTP](?:bps|b\/s)(?: ?\/ ?\d{1,5}(?:\.\d{1,3})? ?[KMGTP](?:bps|b\/s))?$/i.test(text) ? text : '';
    return /^\d{1,6}(?:\.\d{1,3})? ?[KMGTPE]i?B$/i.test(text) ? text : '';
  }
  if (type === 'configuredOption') {
    return safePlaybookLabel_(toStandardPlaybookOption_(value, configuredOptions[field] || []));
  }
  if (['switchLabel', 'switchModel', 'switchRole', 'switchPorts'].includes(type)) {
    return safePlaybookSwitchField_(value, type);
  }
  if (type === 'ip' || type === 'cidr') {
    if (typeof value !== 'string') return '';
    const text = value.trim();
    if (text.length > 49 || !/^[0-9a-f:.]+(?:\/\d{1,3})?$/i.test(text)) return '';
    const [address, prefix] = text.split('/');
    if ((/:::/.test(address) || (address.startsWith(':') && !address.startsWith('::')) ||
        (address.endsWith(':') && !address.endsWith('::'))) || !isValidIpAddress_(address)) return '';
    if (prefix === undefined) return text;
    return type === 'cidr' && isValidCidrBlock_(text) ? text : '';
  }
  if (type === 'vlan') {
    const text = String(value ?? '').trim();
    return /^\d{1,4}$/.test(text) && Number(text) >= 1 && Number(text) <= 4094 ? String(Number(text)) : '';
  }
  return toStandardPlaybookOption_(value, getControlledOptions_(type));
}


function canPrintPlaybookField_(pageKey, permission, field, type) {
  if (type === 'username') return permission === 'edit';
  if (inventoryDeviceAddressPolicy_(pageKey, field)) return canReadInventoryDeviceIp_(pageKey, permission);
  return true;
}


function toStandardPlaybookOption_(value, options) {
  if (typeof value !== 'string') return '';
  return options.find(option => option.toLowerCase() === value.trim().toLowerCase()) || '';
}


function formatStandardPlaybookInstant_(date) {
  const wall = projectNetworkDashboardWallTime_(date, getEffectiveTimezone_());
  const offset = Math.round((Date.parse(wall + 'Z') - date.getTime() + date.getUTCMilliseconds()) / 60000);
  const minutes = Math.abs(offset);
  const hoursPart = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minutesPart = String(minutes % 60).padStart(2, '0');
  return formatNetworkDashboardDateTime_(date) + ' (UTC' + (offset < 0 ? '-' : '+') + hoursPart + ':' + minutesPart + ')';
}


function readStandardPlaybookSection_(policy, pageKey, permission) {
  const audit = {};
  const configuredOptions = ['servers', 'contacts', 'changeLog'].includes(pageKey)
    ? getConfigurableOptionsForSheet_(APP_PAGE_CONFIG[pageKey].sheet) : {};
  const read = (table, fields) => table.sheets.flatMap(sheet =>
    readStandardPlaybookFields_(sheet, fields, table.headerRow, audit));
  const project = (table, extraFields, transform) => {
    const fields = table.detail.filter(([field, type]) => canPrintPlaybookField_(pageKey, permission, field, type));
    if (!fields.length) return { columns: [], rows: [], noEligibleFields: true };
    const projectRow = record => fields.map(([field, type]) => safePlaybookField_(record[field], type, field, configuredOptions));
    const records = read(table, fields.map(([field]) => field).concat(extraFields || []));
    const columns = fields.map(([field, , label]) => label || field);
    return transform ? transform({ columns, records, projectRow }) :
      { columns, rows: records.map(projectRow).filter(row => row.some(Boolean)) };
  };
  const result = buildStandardPlaybookSection_();
  return audit.credentialsOmitted ? { ...result, credentialsOmitted: true } : result;

  function buildStandardPlaybookSection_() {
    if (policy.kind === 'servers') {
      return project(policy, [SERVER_ID_HEADER, SERVER_HOST_ID_HEADER], ({ columns, records, projectRow }) => {
        // The keys are used for this join only and are never printed. Reuse the
        // ordinary server relationship validator, without loading its page data.
        const names = new Map();
        const links = records.map(record => {
          const name = safePlaybookLabel_(record['Server Name']);
          const lower = name.toLowerCase();
          names.set(lower, (names.get(lower) || 0) + 1);
          return { record, name, id: name ? parseServerIdentity_(record[SERVER_ID_HEADER]) : '',
            rawHostId: record[SERVER_HOST_ID_HEADER], hostId: parseServerIdentity_(record[SERVER_HOST_ID_HEADER]) };
        });
        const index = serverIdentityIndex_(links);
        return { columns: columns.concat('VM Host'), rows: links.flatMap(link => {
          const cells = projectRow(link.record);
          if (!cells.some(Boolean)) return [];
          let hostName = '';
          if (link.rawHostId) {
            hostName = 'Unavailable';
            if (link.id && index.get(link.id) === link && link.hostId) {
              try {
                assertValidServerHost_(link.id, link.hostId, index);
                const candidate = index.get(link.hostId).name;
                if (names.get(candidate.toLowerCase()) === 1) hostName = candidate;
              } catch (error) {}
            }
          }
          return [cells.concat(hostName)];
        }) };
      });
    }
    if (policy.detail) {
      const primary = project(policy);
      const additionalTables = (policy.additional || []).flatMap(table => {
        const section = project(table);
        return section.rows.length ? [{ key: table.key, label: table.label, ...section }] : [];
      });
      return additionalTables.length ? { ...primary, additionalTables } : primary;
    }
    if (policy.kind === 'contacts') {
      const sharedRoles = {
        support: 'Support desk', helpdesk: 'Help desk', servicedesk: 'Service desk',
        service: 'Service desk', dispatch: 'Dispatch', operations: 'Operations desk',
        customerservice: 'Customer service', info: 'General information', noc: 'Network operations'
      };
      const rows = [];
      const seen = new Set();
      read(policy, ['Status', 'Email', 'Phone', 'Organization', 'Role / Title', 'Category']).forEach(record => {
        if (toStandardPlaybookOption_(record.Status, ['Active']) !== 'Active') return;
        const email = String(record.Email || '').trim().toLowerCase();
        const address = email.match(/^([a-z]+)@([a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})*\.[a-z]{2,20})$/);
        if (!address || !Object.prototype.hasOwnProperty.call(sharedRoles, address[1]) ||
            /\.(?:local|internal|localhost|invalid|home|lan)$/i.test(address[2]) ||
            hasStandardPlaybookSensitiveMarker_(email) ||
            !address[2].split('.').every(part => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part))) return;
        if (seen.has(email)) return;
        seen.add(email);
        const phone = String(record.Phone || '').trim();
        const digits = /^(?:\+1[ .-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[ .-]?[2-9]\d{2}[ .-]?\d{4}$/.test(phone)
          ? phone.replace(/\D/g, '').slice(-10) : '';
        rows.push([safePlaybookLabel_(record.Organization), safePlaybookLabel_(record['Role / Title']) || sharedRoles[address[1]],
          safePlaybookField_(record.Category, 'configuredOption', 'Category', configuredOptions), email,
          digits ? '+1 ' + digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6) : '']);
      });
      rows.sort((left, right) => left[3].localeCompare(right[3]));
      return { columns: ['Organization', 'Shared contact', 'Category', 'Email', 'Business phone'], rows };
    }
    if (policy.kind === 'changes') {
      const statuses = getControlledOptions_('changeStatus');
      const rows = read(policy, ['Change Date', 'Change Name', 'Category', 'System / Area', 'Status']).map(record => ({
        date: parseNetworkDashboardDateOnly_(record['Change Date']),
        status: toStandardPlaybookOption_(record.Status, statuses),
        name: safePlaybookLabel_(record['Change Name']),
        category: safePlaybookField_(record.Category, 'configuredOption', 'Category', configuredOptions),
        system: safePlaybookField_(record['System / Area'], 'configuredOption', 'System / Area', configuredOptions)
      })).filter(record => record.date && record.status)
        .map(record => [formatNetworkDashboardDateParts_(record.date, 'yyyy-MM-dd'), record.name, record.system, record.category, record.status])
        .sort((left, right) => right[0].localeCompare(left[0]))
        .map(row => [formatNetworkDashboardDateOnly_(row[0]), ...row.slice(1)]);
      return { columns: ['Change date', 'Change Name', 'System / Area', 'Category', 'Status'], rows };
    }
    if (policy.kind === 'outages') {
      const sources = getControlledOptions_('outageSource');
      const rows = read(policy, ['Started', 'Restored', 'Source', 'Review State', 'Incident Started', 'Incident Restored',
        'Site / Location', 'Circuit Name', 'Provider']).map(record => {
        const source = toStandardPlaybookOption_(record.Source, sources);
        const reviewed = source === 'UptimeRobot' && record['Review State'] === 'Confirmed';
        const started = reviewed ? record['Incident Started'] : record.Started;
        const restored = reviewed ? record['Incident Restored'] : record.Restored;
        return {
          started: parseNetworkDashboardTimestamp_(started),
          restored: parseNetworkDashboardTimestamp_(restored),
          source: source === 'Manual' || reviewed ? source : '',
          hasEnd: restored !== '' && restored != null,
          context: ['Site / Location', 'Circuit Name', 'Provider'].map(field => safePlaybookLabel_(record[field]))
        };
      }).filter(record => record.started && record.source &&
        (!record.hasEnd || (record.restored && record.restored >= record.started)))
        .sort((left, right) => right.started - left.started)
        .map(record => [
          ...record.context,
          formatStandardPlaybookInstant_(record.started),
          record.restored ? formatStandardPlaybookInstant_(record.restored) : 'Ongoing',
          record.restored ? String(Math.round((record.restored - record.started) / 60000)) : '',
          record.source
        ]);
      return { columns: ['Site / Location', 'Circuit Name', 'Provider', 'Started', 'Restored', 'Minutes', 'Source'], rows };
    }
    return { columns: [], rows: [], noEligibleFields: true };
  }
}
