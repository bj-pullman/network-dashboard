// Stable links are stored in the existing two Servers sheets, never by row number or name.
var SERVER_ID_HEADER = 'Network HQ Server ID';
var SERVER_HOST_ID_HEADER = 'Network HQ VM Host ID';

function parseServerIdentity_(value) {
  const id = String(value || '').trim().toLowerCase();
  return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) ? id : '';
}

function isServerInventoryRow_(first, name) {
  const value = String(first || '').trim().toLowerCase();
  return !!String(name || '').trim() && !!value &&
    !value.includes('color legend') && !value.startsWith('count =');
}

function withServerInventoryLock_(operation) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const result = operation();
    SpreadsheetApp.flush();
    invalidateAppPage_('servers');
    return result;
  } finally {
    lock.releaseLock();
  }
}

function readServerIdentitySheet_(sheet) {
  if (!sheet || !sheet.getLastColumn()) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(value => String(value || '').trim());
  const idIndex = headers.indexOf(SERVER_ID_HEADER);
  const hostIndex = headers.indexOf(SERVER_HOST_ID_HEADER);
  const nameIndex = headers.indexOf('Server Name');
  if (idIndex < 0 || hostIndex < 0 || nameIndex < 0 ||
      idIndex !== headers.lastIndexOf(SERVER_ID_HEADER) ||
      hostIndex !== headers.lastIndexOf(SERVER_HOST_ID_HEADER)) return null;

  const count = sheet.getLastRow() - 1;
  if (count < 1) return { sheet, idColumn: idIndex + 1, rows: [] };
  // Read only the inventory marker, display name and these two managed fields.
  const column = index => sheet.getRange(2, index + 1, count, 1).getDisplayValues();
  const first = column(0);
  const names = nameIndex === 0 ? first : column(nameIndex);
  const ids = column(idIndex);
  const hosts = column(hostIndex);
  return {
    sheet,
    idColumn: idIndex + 1,
    rows: ids.flatMap(([id], index) => isServerInventoryRow_(first[index][0], names[index][0])
      ? [{ source: sheet.getName(), row: index + 2, rawId: id, id: parseServerIdentity_(id),
          rawHostId: hosts[index][0], hostId: parseServerIdentity_(hosts[index][0]) }]
      : [])
  };
}

function reconcileServerInventoryIdentities_(ss) {
  const config = APP_PAGE_CONFIG.servers;
  return withServerInventoryLock_(() => {
    const sources = [config.sheet, config.offlineSheet]
      .map(name => readServerIdentitySheet_(ss.getSheetByName(name))).filter(Boolean);
    const used = new Set(sources.flatMap(source => source.rows.map(record => record.id).filter(Boolean)));
    sources.forEach(source => {
      // Do not replace malformed or duplicate nonempty cells, or any existing formula.
      if (!source.rows.some(record => record.rawId === '')) return;
      const idRange = source.sheet.getRange(2, source.idColumn, source.sheet.getLastRow() - 1, 1);
      const formulas = idRange.getFormulas();
      let start = 0;
      let batch = [];
      const write = () => {
        if (batch.length) source.sheet.getRange(start, source.idColumn, batch.length, 1).setValues(batch);
        batch = [];
      };
      source.rows.forEach(record => {
        if (record.rawId !== '' || formulas[record.row - 2][0]) return;
        if (record.row !== start + batch.length) { write(); start = record.row; }
        const id = createServerIdentity_(used);
        used.add(id);
        batch.push([id]);
      });
      write();
    });
  });
}

function createServerIdentity_(used) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = parseServerIdentity_(Utilities.getUuid());
    if (id && !used.has(id)) return id;
  }
  throw new Error('Could not allocate a unique server identity. Try again.');
}

function serverIdentityIndex_(records) {
  const index = new Map();
  records.forEach(record => {
    if (record.id) index.set(record.id, index.has(record.id) ? null : record);
  });
  return index;
}

function assertValidServerHost_(id, hostId, index) {
  const visited = new Set(id ? [id] : []);
  let next = hostId;
  while (next) {
    if (visited.has(next)) throw new Error('A server cannot host itself or create a circular VM host relationship.');
    visited.add(next);
    const target = index.get(next);
    if (!target) throw new Error('The selected VM host or one of its hosts is missing or ambiguous. Refresh and select a valid host.');
    if (target.rawHostId && !target.hostId) throw new Error('The selected VM host has an invalid host relationship.');
    next = target.hostId;
  }
}

function prepareServerInventoryWrite_(ss, config, source, rowNumber, record) {
  const sheets = [config.sheet, config.offlineSheet].map(name => readServerIdentitySheet_(ss.getSheetByName(name)));
  const current = sheets.filter(Boolean).flatMap(item => item.rows);
  const index = serverIdentityIndex_(current);
  const row = rowNumber ? current.find(item => item.source === source && item.row === rowNumber) : null;
  const hasHostInput = Object.prototype.hasOwnProperty.call(record, '_vmHostName');
  const input = hasHostInput ? String(record._vmHostName ?? '') : '';
  if (rowNumber && record._expectedServerId && (!row || row.id !== record._expectedServerId ||
      index.get(row.id) !== row)) {
    throw new Error('This server record changed while editing. Refresh and try again.');
  }
  if (input && !parseServerIdentity_(input)) throw new Error('Select an existing VM host.');
  if (!sheets.every(Boolean)) {
    if (input) throw new Error('VM host relationships are unavailable until Network HQ Update / Repair is run.');
    return {};
  }
  if (input && rowNumber && !row) throw new Error('This row is not a server inventory record.');
  const fields = {};
  let id = row && row.id;
  const sourceInfo = sheets.find(item => item.sheet.getName() === source);
  const blankIdentity = row && row.rawId === '' &&
    !sourceInfo.sheet.getRange(rowNumber, sourceInfo.idColumn).getFormulas()[0][0];
  if (!rowNumber || blankIdentity) {
    id = createServerIdentity_(index);
    fields[SERVER_ID_HEADER] = id;
  }
  const hostId = parseServerIdentity_(input);
  if (hasHostInput && (!row || input !== row.rawHostId)) {
    if (hostId && (!id || (row && row.rawId !== '' && index.get(id) !== row))) {
      throw new Error('This server has no unique inventory identity. Run Update / Repair or review the server inventory.');
    }
    if (hostId) assertValidServerHost_(id, hostId, index);
    fields[SERVER_HOST_ID_HEADER] = hostId;
  }
  return fields;
}

function assertServerCanBeDeleted_(ss, config, source, rowNumber, expectedId) {
  const records = [config.sheet, config.offlineSheet]
    .map(name => readServerIdentitySheet_(ss.getSheetByName(name))).filter(Boolean).flatMap(item => item.rows);
  const record = records.find(item => item.source === source && item.row === rowNumber);
  if (expectedId && (!record || record.id !== expectedId ||
      serverIdentityIndex_(records).get(record.id) !== record)) {
    throw new Error('This server record changed. Refresh and try again.');
  }
  if (record && record.id && records.some(guest => guest !== record && guest.hostId === record.id)) {
    throw new Error('Move or unlink this server’s VM guests before deleting it.');
  }
}

function addServerRelationshipDisplay_(output, ready) {
  output.vmRelationshipsReady = !!ready;
  if (!ready) return;
  const records = output.rows.map(row => ({
    row,
    id: String(row['Server Name'] || '').trim() ? parseServerIdentity_(row[SERVER_ID_HEADER]) : '',
    rawHostId: row[SERVER_HOST_ID_HEADER],
    hostId: parseServerIdentity_(row[SERVER_HOST_ID_HEADER])
  }));
  const index = serverIdentityIndex_(records);
  const names = new Map();
  records.forEach(({ row }) => {
    const name = String(row['Server Name'] || '').trim().toLowerCase();
    names.set(name, (names.get(name) || 0) + 1);
  });
  const label = ({ row }) => {
    const name = String(row['Server Name'] || '').trim();
    return names.get(name.toLowerCase()) > 1 ? name + ' (' +
      (row._serverView === 'offline' ? 'Offline' : 'Active') + ', row ' + row._row + ')' : name;
  };
  const guests = new Map();
  records.forEach(record => {
    const { row, id, hostId, rawHostId } = record;
    const host = index.get(hostId);
    let valid = false;
    if (host && id && index.get(id) === record) {
      try { assertValidServerHost_(id, hostId, index); valid = true; } catch (error) {}
    }
    row._vmHostName = valid ? label(host) : rawHostId ? 'Unavailable host' : '';
    row._vmHostId = hostId;
    row._vmHostUnavailable = !!rawHostId && !valid;
    row._vmServerId = id && index.get(id) === record ? id : '';
    row._vmServerLabel = row._vmServerId ? label(record) : '';
    if (valid) {
      if (!guests.has(hostId)) guests.set(hostId, []);
      guests.get(hostId).push(label(record));
    }
  });
  records.forEach(({ row }) => {
    row._vmGuestNames = (guests.get(row._vmServerId) || [])
      .sort((a, b) => a.localeCompare(b)).join(', ');
  });
}
