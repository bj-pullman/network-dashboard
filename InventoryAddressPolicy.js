// Keep the protected address scope explicit. Routing, WAN, gateways, VLANs and
// DHCP are deliberately outside this policy, as are credential endpoints.
const INVENTORY_DEVICE_IP_FIELDS_ = Object.freeze({
  switches: ['IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address'],
  accessPoints: ['IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address',
    'Virtual Controller IP', 'Controller IP'],
  servers: ['IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address'],
  securityCameras: ['IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address'],
  intercom: ['IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address'],
  busCameras: ['DVR IP', 'Bridge IP', 'IP Address', 'IP', 'Device IP', 'Device IP Address', 'Management IP', 'Management IP Address'],
  networkClosets: ['Management IP', 'Management IP Address']
});

function inventoryDeviceAddressPolicy_(pageKey, field) {
  const label = String(field || '').trim().toLowerCase();
  if (pageKey === 'accessPoints' && label === 'virtual controller') return 'controller';
  const fields = Object.prototype.hasOwnProperty.call(INVENTORY_DEVICE_IP_FIELDS_, pageKey)
    ? INVENTORY_DEVICE_IP_FIELDS_[pageKey] : [];
  return fields.some(name => name.toLowerCase() === label) ? 'omit' : '';
}

function canReadInventoryDeviceIp_(pageKey, permission) {
  return (permission || getPagePermission_(pageKey)) === 'edit';
}

function redactControllerAddress_(value) {
  // Aruba supplies "Name: ... | IP: ..." or either labeled component. An
  // unrecognized or address-shaped name cannot be safely distinguished.
  const match = String(value || '').trim().match(/^Name: ([A-Za-z\d_. -]{1,120})(?: \| IP: [^|]+)?$/i);
  if (!match || /(?:\d{1,3}\.){3}\d{1,3}/.test(match[1])) return '';
  return 'Name: ' + match[1].trim();
}

function projectInventoryDeviceIpAccess_(data, pageKey, permission) {
  if (!Object.prototype.hasOwnProperty.call(INVENTORY_DEVICE_IP_FIELDS_, pageKey)) return data;
  const canEdit = canReadInventoryDeviceIp_(pageKey, permission);
  const allowed = name => inventoryDeviceAddressPolicy_(pageKey, name) !== 'omit';
  let projected = data;

  if (!canEdit) {
    const projectRow = row => Object.fromEntries(Object.entries(row || {})
      .filter(([field]) => allowed(field))
      .map(([field, value]) => [field, inventoryDeviceAddressPolicy_(pageKey, field) === 'controller'
        ? redactControllerAddress_(value) : value]));
    projected = Object.assign({}, data);
    if (Array.isArray(data.headers)) projected.headers = data.headers.filter(allowed);
    if (Array.isArray(data.defaultColumns)) projected.defaultColumns = data.defaultColumns.filter(allowed);
    if (Array.isArray(data.rows)) projected.rows = data.rows.map(projectRow);
    if (Array.isArray(data.sections)) {
      projected.sections = data.sections.map(section => {
        if (section.type === 'metadata') {
          return Object.assign({}, section, { items: (section.items || []).filter(item => allowed(item.label)) });
        }
        const columns = (section.columns || []).filter(column => allowed(column.title));
        const removed = new Set((section.columns || []).filter(column => !allowed(column.title)).map(column => column.field));
        return Object.assign({}, section, {
          columns,
          headers: (section.headers || []).filter(allowed),
          defaultColumns: (section.defaultColumns || []).filter(field => !removed.has(field)),
          defaultColumnTitles: (section.defaultColumnTitles || []).filter(allowed),
          rows: (section.rows || []).map(row => Object.fromEntries(Object.entries(row)
            .filter(([field]) => !removed.has(field) && allowed(field))))
        });
      });
    }
    if (pageKey === 'networkClosets') {
      projected.upsByCloset = Object.fromEntries(Object.entries(data.upsByCloset || {})
        .map(([key, units]) => [key, units.map(projectRow)]));
    }
  }

  if (pageKey === 'networkClosets') {
    // A copied equipment row must not bypass either the current page or the
    // associated inventory page. Counts and non-address fields stay intact.
    const sourcePages = { Switches: 'switches', Servers: 'servers', 'Offline Servers': 'servers' };
    const destination = Object.assign({}, projected);
    const sourceAllowed = {};
    const redactEquipment = item => {
      const source = sourcePages[item.sheet];
      if (canEdit && source) {
        if (!Object.prototype.hasOwnProperty.call(sourceAllowed, source)) {
          sourceAllowed[source] = canReadInventoryDeviceIp_(source);
        }
        if (sourceAllowed[source]) return item;
      }
      const safe = Object.assign({}, item);
      delete safe.ipAddress;
      return safe;
    };
    destination.inventory = (data.inventory || []).map(redactEquipment);
    destination.equipmentByCloset = Object.fromEntries(Object.entries(data.equipmentByCloset || {})
      .map(([key, rows]) => [key, rows.map(redactEquipment)]));
    return destination;
  }
  return projected;
}
