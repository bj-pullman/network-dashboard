// Standard Playbook is a separate allowlist, not an export of ordinary page payloads.
function getStandardPlaybookPolicies_() {
  return {
    switches: { sheets: ['Switches'], field: 'Status', options: 'infrastructureStatus' },
    accessPoints: { sheets: ['Access Points'], field: 'Status', options: 'infrastructureStatus' },
    servers: { sheets: ['Servers', 'Offline Servers'], field: 'Status', options: 'infrastructureStatus' },
    networkClosets: { sheets: ['Network Closets'], field: 'Type', options: 'closetType' },
    internetWan: { sheets: ['Internet WAN'], field: 'Status', options: 'wanStatus' },
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
  const visiblePages = Object.values(APP_PAGE_CONFIG).filter(page =>
    isPageEnabled_(page.key) && (access.admin || (!page.adminOnly &&
      ['view', 'edit'].includes(access.permissions[page.key]))));
  getStandardPlaybookSectionOptions_(visiblePages).forEach(option => {
    if (!selected.has(option.key)) return;
    // Check through the existing page boundary before reading any data.
    requirePagePermission_(option.key, 'view');
    const result = readStandardPlaybookSection_(policies[option.key]);
    if (result.rows.length) sections.push({ key: option.key, label: option.label, ...result });
  });

  const organization = String(AppConfig.get('organization.name') || '').trim();
  const safeOrganization = organization.length <= 100 &&
    /^[\p{L}\p{M}][\p{L}\p{M}\d .,'’&()\-]{0,99}$/u.test(organization) &&
    !hasStandardPlaybookSensitiveMarker_(organization) ? organization : 'Organization display name not configured';
  const now = new Date();
  return {
    title: 'Network HQ Playbook',
    classification: 'Standard',
    organization: safeOrganization,
    generatedAt: now.toISOString(),
    generatedLabel: formatNetworkDashboardDateTime_(now) + ' (' + getEffectiveTimezone_() + ')',
    sections: sections
  };
}


function hasStandardPlaybookSensitiveMarker_(value) {
  return /\b(?:pass(?:word|wd|code)|secret|token|api[-_ ]?key|credential|recovery[-_ ]?code|canary)\b/i.test(value);
}


function readStandardPlaybookFields_(sheetName, fields) {
  const sheet = getReadSheet_(sheetName);
  if (!sheet || sheet.getLastRow() < 2 || !sheet.getLastColumn()) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(value => String(value || '').trim());
  const rowCount = sheet.getLastRow() - 1;
  const rows = [];
  fields.forEach(field => {
    const index = headers.indexOf(field);
    if (index < 0 || headers.lastIndexOf(field) !== index) return;
    // Read only this explicitly allowed column, never the page's broad data range.
    const range = sheet.getRange(2, index + 1, rowCount, 1);
    const formulas = range.getFormulas();
    range.getValues().forEach((cells, row) => {
      if (formulas[row][0]) return; // Do not export data computed from other columns.
      if (!rows[row]) rows[row] = {};
      rows[row][field] = cells[0];
    });
  });
  return rows.filter(Boolean);
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


function readStandardPlaybookSection_(policy) {
  const read = fields => [].concat(...policy.sheets.map(sheet => readStandardPlaybookFields_(sheet, fields)));
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
