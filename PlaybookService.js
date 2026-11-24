// The single Playbook uses typed columns, never ordinary page payloads.
function getStandardPlaybookPolicies_() {
  const state = ['Status', 'infrastructureStatus'];
  const address = ['IP Address', 'ip'];
  return {
    switches: { sheets: ['Switches'], field: 'Status', options: 'infrastructureStatus',
      detail: [['Device Label', 'switchLabel'], ['Model', 'switchModel'], state, ['Role', 'switchRole'],
        ['Port Capacity (Active)', 'switchPorts'], address] },
    accessPoints: { sheets: ['Access Points'], field: 'Status', options: 'infrastructureStatus',
      detail: [state, address] },
    servers: { sheets: ['Servers', 'Offline Servers'], field: 'Status', options: 'infrastructureStatus',
      detail: [state, address] },
    networkClosets: { sheets: ['Network Closets', 'Network Closet UPS'], field: 'Type', options: 'closetType',
      detail: [['Type', 'closetType'], ['Management IP', 'ip']] },
    routes: { sheets: ['IP Route Tables'], detail: [
      ['VLAN ID', 'vlan'], ['Network / CIDR', 'cidr'], ['Gateway', 'ip']
    ] },
    internetWan: { sheets: ['Internet WAN'], detail: [
      ['Status', 'wanStatus'], ['Role', 'wanRole'], ['Service Type', 'wanServiceType'],
      ['Public Network / CIDR', 'cidr'], ['Gateway', 'ip']
    ] },
    securityCameras: { sheets: ['Security Cameras'], detail: [address, ['Username', 'username']] },
    busCameras: { sheets: ['Bus Cameras'], headerRow: 7,
      detail: [['DVR IP', 'ip'], ['Bridge IP', 'ip']] },
    intercom: { sheets: ['Intercom Bell System'], detail: [address, ['Username', 'username']] },
    ssids: { sheets: ['SSIDs'], field: 'Status', options: 'enabledDisabled' },
    outages: { sheets: ['Outages'], kind: 'outages' },
    changeLog: { sheets: ['Change Log'], kind: 'changes' },
    contacts: { sheets: ['Contacts'], kind: 'contacts' }
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
      if (result.rows.length) sections.push({ key: option.key, label: option.label, ...result });
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


function readStandardPlaybookFields_(sheetName, fields, headerRow) {
  if (!fields.length) return [];
  const sheet = getReadSheet_(sheetName);
  headerRow = headerRow || 1;
  if (!sheet || sheet.getLastRow() < headerRow || !sheet.getLastColumn()) {
    throw new Error('A Playbook backing sheet is unavailable.');
  }
  const headers = sheet.getRange(headerRow, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(value => String(value || '').trim());
  const rowCount = sheet.getLastRow() - headerRow;
  if (!rowCount) return [];
  const rows = [];
  fields.forEach(field => {
    const index = headers.indexOf(field);
    if (index < 0 || headers.lastIndexOf(field) !== index) return;
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


function safePlaybookField_(value, type) {
  if (type === 'username') return safePlaybookUsername_(value);
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
  const read = fields => [].concat(...policy.sheets.map(sheet =>
    readStandardPlaybookFields_(sheet, fields, policy.headerRow)));
  if (policy.detail) {
    const fields = policy.detail.filter(([field, type]) => canPrintPlaybookField_(pageKey, permission, field, type));
    if (!fields.length) return { columns: [], rows: [], noEligibleFields: true };
    if (!policy.field || fields.length > 1) {
      const rows = read(fields.map(([field]) => field))
        .map(record => fields.map(([field, type]) => safePlaybookField_(record[field], type)))
        .filter(row => row.some(Boolean));
      return { columns: fields.map(([field]) => field), rows };
    }
  }
  if (policy.kind === 'contacts') {
    const sharedRoles = {
      support: 'Support desk', helpdesk: 'Help desk', servicedesk: 'Service desk',
      service: 'Service desk', dispatch: 'Dispatch', operations: 'Operations desk',
      customerservice: 'Customer service', info: 'General information', noc: 'Network operations'
    };
    const rows = [];
    const seen = new Set();
    read(['Status', 'Email', 'Phone']).forEach(record => {
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
      rows.push([sharedRoles[address[1]], email, digits ? '+1 ' + digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6) : '']);
    });
    rows.sort((left, right) => left[1].localeCompare(right[1]));
    return { columns: ['Shared contact', 'Email', 'Business phone (if verified format)'], rows: rows };
  }
  if (policy.kind === 'changes') {
    const statuses = getControlledOptions_('changeStatus');
    const rows = read(['Change Date', 'Status']).map(record => ({
      date: parseNetworkDashboardDateOnly_(record['Change Date']),
      status: toStandardPlaybookOption_(record.Status, statuses)
    })).filter(record => record.date && record.status)
      .map(record => [formatNetworkDashboardDateParts_(record.date, 'yyyy-MM-dd'), record.status])
      .sort((left, right) => right[0].localeCompare(left[0]))
      .map(row => [formatNetworkDashboardDateOnly_(row[0]), row[1]]);
    return { columns: ['Change date', 'Status'], rows: rows };
  }
  if (policy.kind === 'outages') {
    const sources = getControlledOptions_('outageSource');
    const rows = read(['Started', 'Restored', 'Source', 'Review State', 'Incident Started', 'Incident Restored']).map(record => {
      const source = toStandardPlaybookOption_(record.Source, sources);
      const reviewed = source === 'UptimeRobot' && record['Review State'] === 'Confirmed';
      const started = reviewed ? record['Incident Started'] : record.Started;
      const restored = reviewed ? record['Incident Restored'] : record.Restored;
      return {
        started: parseNetworkDashboardTimestamp_(started),
        restored: parseNetworkDashboardTimestamp_(restored),
        source: source === 'Manual' || reviewed ? source : '',
        hasEnd: restored !== '' && restored != null
      };
    }).filter(record => record.started && record.source &&
      (!record.hasEnd || (record.restored && record.restored >= record.started)))
      .sort((left, right) => right.started - left.started)
      .map(record => [
        formatStandardPlaybookInstant_(record.started),
        record.restored ? formatStandardPlaybookInstant_(record.restored) : 'Ongoing',
        record.restored ? String(Math.round((record.restored - record.started) / 60000)) : '',
        record.source
      ]);
    return { columns: ['Started', 'Restored', 'Minutes', 'Source'], rows: rows };
  }

  const options = getControlledOptions_(policy.options);
  const counts = new Map();
  read([policy.field]).forEach(record => {
    const value = toStandardPlaybookOption_(record[policy.field], options);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return {
    columns: [policy.field, 'Record count'],
    rows: options.filter(option => counts.has(option)).map(option => [option, counts.get(option)])
  };
}
