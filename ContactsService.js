// Contacts are ordinary business directory records, never credential records.
function normalizeContactRecord_(record, adding) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error('Enter a valid contact record.');
  }
  const output = {};
  Object.keys(record).forEach(field => {
    if (!CONTACT_DIRECTORY_FIELDS_.includes(field)) {
      throw new Error('Contacts accepts only business directory fields.');
    }
    if (record[field] != null && typeof record[field] !== 'string') {
      throw new Error(field + ' must be text.');
    }
    const value = String(record[field] == null ? '' : record[field]).trim();
    const limit = field === 'Notes' ? 2000 : 254;
    if (value.length > limit) throw new Error(field + ' must be ' + limit + ' characters or fewer.');
    if (value.startsWith('=')) throw new Error(field + ' must be plain text, not a spreadsheet formula.');
    if (value && ['Email', 'Alternate Email'].includes(field) && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)) {
      throw new Error('Enter a valid ' + field.toLowerCase() + ' address.');
    }
    if (field === 'Status') {
      const status = getControlledOptions_('contactStatus').find(option => option.toLowerCase() === value.toLowerCase());
      if (!status) throw new Error('Status must be Active or Inactive.');
      output[field] = status;
    } else {
      output[field] = value;
    }
  });
  if (adding && !output.Status) output.Status = 'Active';
  return output;
}


function requireContactSheetHeaders_(headers) {
  const counts = new Map();
  headers.forEach(header => {
    const name = String(header || '').trim();
    counts.set(name, (counts.get(name) || 0) + 1);
  });
  if (CONTACT_DIRECTORY_FIELDS_.some(field => counts.get(field) !== 1)) {
    throw new Error('Contacts headers are incomplete or duplicated. Verify the sheet and run Update / Repair.');
  }
}


function updateContactSheetFields_(sheet, rowNumber, headers, record) {
  // Write only explicitly submitted, managed cells. Never rewrite unrelated
  // columns or formulas even when an installation has interleaved columns.
  let first = -1;
  let group = [];
  function flush() {
    if (group.length) sheet.getRange(rowNumber, first + 1, 1, group.length).setValues([group]);
    first = -1;
    group = [];
  }
  headers.forEach((header, index) => {
    const name = String(header || '').trim();
    if (!Object.prototype.hasOwnProperty.call(record, name)) {
      flush();
      return;
    }
    if (first < 0) first = index;
    group.push(record[name]);
  });
  flush();
}
