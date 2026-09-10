function getArubaCentralToken_() {

  const props =
    PropertiesService.getScriptProperties();

  const clientId =
    props.getProperty(
      'ARUBA_CLIENT_ID'
    );

  const clientSecret =
    props.getProperty(
      'ARUBA_CLIENT_SECRET'
    );

  const refreshToken =
    props.getProperty(
      'ARUBA_REFRESH_TOKEN'
    );


  if (
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    throw new Error(
      'Missing ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, or ARUBA_REFRESH_TOKEN in Script Properties.'
    );
  }


  const url =
    'https://apigw-prod2.central.arubanetworks.com/oauth2/token';

  const payload = {
    'grant_type': 'refresh_token',
    'client_id': clientId.trim(),
    'client_secret': clientSecret.trim(),
    'refresh_token': refreshToken.trim()
  };

  const options = {
    method: 'post',
    contentType:
      'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  const response =
    UrlFetchApp.fetch(
      url,
      options
    );

  const resCode =
    response.getResponseCode();

  if (resCode === 200) {

    const json =
      JSON.parse(
        response.getContentText()
      );

    if (
      json.refresh_token &&
      json.refresh_token !== refreshToken
    ) {
      props.setProperty(
        'ARUBA_REFRESH_TOKEN',
        json.refresh_token
      );
    }

    return json.access_token;

  }


  const responseDetail =
    getArubaCentralOAuthErrorDetail_(
      response.getContentText()
    );

  throw new Error(
    'Aruba Central refresh token failed (HTTP ' +
    resCode +
    ').' +
    (responseDetail ? ' Aruba response: ' + responseDetail + '.' : '') +
    ' Check ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, and ARUBA_REFRESH_TOKEN.'
  );
}


function getArubaCentralOAuthErrorDetail_(responseBody) {

  const text =
    String(responseBody || '').trim();

  if (!text) return '';

  try {
    const json = JSON.parse(text);
    const safe = {};

    ['error', 'error_description', 'error_code', 'message'].forEach(key => {
      if (json[key] !== undefined && json[key] !== null) {
        safe[key] = redactArubaCentralOAuthErrorText_(json[key]);
      }
    });

    return Object.keys(safe).length ? JSON.stringify(safe) : '';
  } catch (error) {
    // Plain-text gateway errors are useful, but redact credential-like values.
    return redactArubaCentralOAuthErrorText_(text);
  }
}


function redactArubaCentralOAuthErrorText_(value) {
  return String(value || '')
    .replace(/(access_token|refresh_token|client_secret)\s*[=:]\s*[^\s,&]+/gi, '$1=[REDACTED]')
    .slice(0, 500);
}


function maintainArubaCentralOAuthToken() {

  const status = getIntegrationStatusById_('aruba_central');

  if (!status.enabled) {
    return { status: 'skipped', reason: 'disabled' };
  }

  if (!status.configurationComplete) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  // This intentionally performs only the existing OAuth refresh exchange.
  getArubaCentralToken_();
  return { status: 'success' };
}


function setupArubaCentralOAuthMaintenanceTrigger_() {

  const handler = 'maintainArubaCentralOAuthToken';
  const triggers = ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === handler);

  // Repair an old duplicate state while retaining one valid daily trigger.
  triggers.slice(1).forEach(trigger => ScriptApp.deleteTrigger(trigger));

  if (triggers.length) return false;

  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  return true;
}


function removeArubaCentralOAuthMaintenanceTriggers_() {

  const handler = 'maintainArubaCentralOAuthToken';
  let removed = 0;

  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === handler)
    .forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    });

  return removed;
}


function syncArubaCentralToSheet() {

  requireAdmin_();

  const status =
    getIntegrationStatusById_(
      'aruba_central'
    );

  if (!status.configurationComplete) {
    throw new Error(
      'Aruba Central cannot sync because required Script Properties are missing.'
    );
  }

  if (!status.enabled) {
    throw new Error(
      'Aruba Central is disabled in App Integrations.'
    );
  }


  const token =
    getArubaCentralToken_();

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };

  let swCount = 0;
  let apCount = 0;

  const swResp =
    UrlFetchApp.fetch(
      'https://apigw-prod2.central.arubanetworks.com/monitoring/v1/switches?limit=1000',
      options
    );

  const stackResp =
    UrlFetchApp.fetch(
      'https://apigw-prod2.central.arubanetworks.com/monitoring/v1/stacks?limit=1000',
      options
    );

  const invResp =
    UrlFetchApp.fetch(
      'https://apigw-prod2.central.arubanetworks.com/utility/v1/network_device_inventory?sku_type=switch&limit=1000',
      options
    );

  let swData = [];
  let stackData = [];
  let invData = [];

  if (swResp.getResponseCode() === 200) {
    const json =
      JSON.parse(
        swResp.getContentText()
      );
    swData =
      json.switches ||
      json.data ||
      json.devices ||
      (
        Array.isArray(json)
          ? json
          : []
      );
  }

  if (stackResp.getResponseCode() === 200) {
    const json =
      JSON.parse(
        stackResp.getContentText()
      );
    stackData =
      json.stacks ||
      json.data ||
      (
        Array.isArray(json)
          ? json
          : []
      );
  }

  if (invResp.getResponseCode() === 200) {
    const json =
      JSON.parse(
        invResp.getContentText()
      );
    invData =
      json.devices ||
      json.data ||
      (
        Array.isArray(json)
          ? json
          : []
      );
  }


  const combinedSwitches =
    swData.slice();

  invData.forEach(invDev => {

    const exists =
      combinedSwitches.some(device =>
        (
          device.serial &&
          device.serial === invDev.serial
        ) ||
        (
          device.macaddr &&
          device.macaddr === invDev.macaddr
        )
      );

    if (!exists) {

      combinedSwitches.push({
        name:
          invDev.device_name ||
          invDev.aruba_part_no ||
          'Legacy Switch',
        serial:
          invDev.serial,
        macaddr:
          invDev.macaddr,
        model:
          invDev.model ||
          invDev.aruba_part_no ||
          '',
        ip_address:
          invDev.ip_address || '',
        status:
          invDev.status || '',
        state:
          invDev.state || '',
        site:
          invDev.site || invDev.site_name || invDev.siteName || '',
        group_name:
          invDev.group_name || invDev.device_group_name || '',
        device_type:
          'Edge'
      });

    }

  });


  swCount =
    processArubaDeviceSync_(
      'Switches',
      combinedSwitches,
      stackData
    );


  let apResp =
    UrlFetchApp.fetch(
      'https://apigw-prod2.central.arubanetworks.com/monitoring/v1/aps?limit=1000',
      options
    );

  if (apResp.getResponseCode() === 404) {
    apResp =
      UrlFetchApp.fetch(
        'https://apigw-prod2.central.arubanetworks.com/monitoring/v2/aps?limit=1000',
        options
      );
  }

  if (apResp.getResponseCode() === 200) {

    const json =
      JSON.parse(
        apResp.getContentText()
      );

    const apData =
      json.aps ||
      json.data ||
      json.devices ||
      (
        Array.isArray(json)
          ? json
          : []
      );

    const swarms = apData.some(ap => ap.swarm_id) ? getArubaSwarmMap_(options) : {};
    apCount = processArubaAccessPointSync_(apData, swarms);

  }


  const now =
    new Date();

  updateIntegrationRuntimeStatus_(
    'aruba_central',
    now,
    'Sync succeeded'
  );

  invalidateAppPage_(
    'switches'
  );

  invalidateAppPage_(
    'accessPoints'
  );

  invalidateAppPage_(
    'dashboard'
  );

  return {
    status: 'success',
    switchesSynced: swCount,
    apsSynced: apCount
  };
}


function processArubaDeviceSync_(
  tabName,
  centralDevices,
  stackData
) {

  if (tabName === 'Access Points') return processArubaAccessPointSync_(centralDevices || [], {});

  if (
    !centralDevices ||
    centralDevices.length === 0
  ) {
    return 0;
  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(tabName);

  if (!sheet) {
    return 0;
  }

  let data =
    sheet
      .getDataRange()
      .getValues();

  let headers =
    data[0]
      .map(header =>
        String(header).trim()
      );


  const requiredCols = [
    'Status',
    'Device Label',
    'Model',
    'Type',
    'IP Address',
    'Serial Number',
    'MAC Address',
    'Role',
    'Management Mode',
    'Stack Info',
    'Port Capacity (Active)'
  ];

  requiredCols.forEach(col => {

    if (!headers.includes(col)) {

      sheet
        .getRange(
          1,
          headers.length + 1
        )
        .setValue(col);

      headers.push(col);

    }

  });


  data =
    sheet
      .getDataRange()
      .getValues();

  headers =
    data[0]
      .map(header =>
        String(header).trim()
      );

  const statusIdx =
    headers.indexOf('Status');

  const labelIdx =
    headers.indexOf('Device Label') !== -1
      ? headers.indexOf('Device Label')
      : headers.indexOf('AP Name');

  const modelIdx =
    headers.indexOf('Model');

  const typeIdx =
    headers.indexOf('Type');

  const ipIdx =
    headers.indexOf('IP Address');

  const serialIdx =
    headers.indexOf('Serial Number');

  const macIdx =
    headers.indexOf('MAC Address');

  const roleIdx =
    headers.indexOf('Role');

  const modeIdx =
    headers.indexOf('Management Mode');

  const stackIdx =
    headers.indexOf('Stack Info');

  const portIdx =
    headers.indexOf('Port Capacity (Active)');

  const campusIdx =
    headers.indexOf('Campus');

  const lastSyncIdx =
    headers.indexOf('Last Sync');


  const grouped = {};

  centralDevices.forEach(dev => {

    const rawDevName =
      String(
        dev.name ||
        dev.hostname ||
        dev.device_name ||
        ''
      ).trim();

    const cleanKey =
      rawDevName
        .replace(/\s*\([\d.]+\)\s*/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    if (!grouped[cleanKey]) {
      grouped[cleanKey] = {
        name: rawDevName,
        devices: []
      };
    }

    grouped[cleanKey]
      .devices
      .push(dev);

  });


  const stackMap = {};

  if (
    stackData &&
    Array.isArray(stackData)
  ) {

    stackData.forEach(stack => {

      const key =
        String(
          stack.name ||
          stack.stack_name ||
          ''
        )
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');

      if (key) stackMap[key] = stack;
      if (stack.stack_id) stackMap[String(stack.stack_id)] = stack;

    });

  }


  const existingRows = [];

  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const rawLabel =
      labelIdx !== -1
        ? String(data[i][labelIdx]).trim()
        : '';

    const cleanLabel =
      rawLabel
        .replace(/\s*\([\d.]+\)\s*/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

    existingRows.push({
      rowIndex: i + 1,
      ip:
        ipIdx !== -1
          ? String(data[i][ipIdx]).trim()
          : '',
      serials:
        serialIdx !== -1
          ? String(data[i][serialIdx])
              .trim()
              .toUpperCase()
              .split(/\s*[\/,]\s*/)
          : [],
      cleanLabel: cleanLabel
    });

  }


  let matchedCount = 0;

  const now =
    new Date();


  Object.keys(grouped)
    .forEach(cleanKey => {

      const group =
        grouped[cleanKey];

      const devList =
        group.devices;

      const commander =
        devList.find(device => normalizeArubaSwitchRole_(device.switch_role || device.role) === 'Commander' || device.is_commander === true) ||
        devList.find(device =>
          (
            device.ip_address &&
            device.ip_address !== '127.0.0.1'
          ) ||
          (
            device.ip &&
            device.ip !== '127.0.0.1'
          ) ||
          device.role === 'Commander' ||
          device.is_commander
        ) ||
        devList[0];

      let devIp =
        String(
          commander.ip_address ||
          commander.ip ||
          commander.management_ip ||
          commander.site_ip ||
          ''
        ).trim();

      if (devIp === '127.0.0.1') {
        devIp = '';
      }

      const serialList =
        devList
          .map(device =>
            String(
              device.serial ||
              device.serial_number ||
              ''
            )
              .trim()
              .toUpperCase()
          )
          .filter(Boolean);

      const aggregatedSerials =
        serialList.join(' / ');

      const primaryMac =
        String(
          commander.macaddr ||
          commander.mac_address ||
          commander.mac ||
          ''
        ).trim();

      let memberCount =
        devList.length;

      const stack = stackMap[String(commander.stack_id || '')] || stackMap[cleanKey] || {};
      memberCount = Math.max(memberCount, Number(stack.member_count || stack.stack_members_count || 0),
        Array.isArray(stack.members) ? stack.members.length : 0,
        Number(commander.member_count || commander.stack_members_count || 0));
      const stackInfoText = memberCount > 1 ? 'Yes: ' + memberCount : 'No';
      const devRole = commander.is_commander === true ? 'Commander' :
        normalizeArubaSwitchRole_(commander.switch_role || commander.role);

      const devStatus =
        normalizeArubaCentralDeviceListStatus_(
          devList,
          group.name
        );

      const devCampus =
        getArubaCentralSite_(commander) ||
        devList.map(getArubaCentralSite_).find(Boolean) ||
        getArubaCentralSite_(stack);

      let devMode =
        'Monitor Mode';

      if (
        commander.management_type &&
        String(commander.management_type)
          .toLowerCase()
          .includes('config')
      ) {
        devMode = 'Config Mode';
      }

      let totalPorts = 0;
      let activePorts = 0;

      devList.forEach(device => {

        let total =
          parseInt(
            device.port_count ||
            device.ports_count ||
            device.total_ports ||
            0,
            10
          );

        let active =
          parseInt(
            device.active_ports_count ||
            device.ports_up ||
            device.active_ports ||
            0,
            10
          );

        if (
          isNaN(total) &&
          device.ports &&
          Array.isArray(device.ports)
        ) {
          total =
            device.ports.length;
          active =
            device.ports.filter(port =>
              port.status === 'Up' ||
              port.link_state === 'Up' ||
              port.admin_state === 'Up'
            ).length;
        }

        totalPorts +=
          isNaN(total)
            ? 0
            : total;

        activePorts +=
          isNaN(active)
            ? 0
            : active;

      });

      const portText =
        totalPorts > 0
          ? activePorts +
            '/' +
            totalPorts +
            ' Active'
          : '';

      let matched =
        existingRows.find(row =>
          row.cleanLabel &&
          row.cleanLabel === cleanKey
        );

      if (
        !matched &&
        serialList.length > 0
      ) {
        matched =
          existingRows.find(row =>
            row.serials.some(serial =>
              serialList.includes(serial)
            )
          );
      }

      if (
        !matched &&
        devIp
      ) {
        matched =
          existingRows.find(row =>
            row.ip &&
            row.ip === devIp
          );
      }

      if (matched) {

        if (statusIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              statusIdx + 1
            )
            .setValue(devStatus);
        }

        if (
          ipIdx !== -1 &&
          devIp
        ) {
          sheet
            .getRange(
              matched.rowIndex,
              ipIdx + 1
            )
            .setValue(devIp);
        }

        if (serialIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              serialIdx + 1
            )
            .setValue(aggregatedSerials);
        }

        if (
          macIdx !== -1 &&
          primaryMac
        ) {
          sheet
            .getRange(
              matched.rowIndex,
              macIdx + 1
            )
            .setValue(primaryMac);
        }

        if (roleIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              roleIdx + 1
            )
            .setValue(devRole);
        }

        if (modeIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              modeIdx + 1
            )
            .setValue(devMode);
        }

        if (stackIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              stackIdx + 1
            )
            .setValue(stackInfoText);
        }

        if (
          portIdx !== -1 &&
          portText
        ) {
          sheet
            .getRange(
              matched.rowIndex,
              portIdx + 1
            )
            .setValue(portText);
        }

        if (lastSyncIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              lastSyncIdx + 1
            )
            .setValue(now);
        }

        if (campusIdx !== -1) {
          sheet
            .getRange(
              matched.rowIndex,
              campusIdx + 1
            )
            .setValue(devCampus);
        }

        matchedCount++;

      } else {

        const newRow =
          headers.map(header => {

            if (header === 'Status') return devStatus;
            if (
              header === 'Device Label' ||
              header === 'AP Name'
            ) return group.name;
            if (header === 'Model') return commander.model || '';
            if (header === 'Type') return commander.device_type || 'Edge';
            if (header === 'IP Address') return devIp;
            if (header === 'Serial Number') return aggregatedSerials;
            if (header === 'MAC Address') return primaryMac;
            if (header === 'Role') return devRole;
            if (header === 'Management Mode') return devMode;
            if (header === 'Stack Info') return stackInfoText;
            if (header === 'Port Capacity (Active)') return portText;
            if (header === 'Campus') return devCampus;
            if (header === 'Last Sync') return now;
            return '';

          });

        sheet.appendRow(newRow);
        matchedCount++;

      }

    });


  return matchedCount;
}


function fetchSwitchRunningConfig(
  serialNumber
) {

  requirePagePermission_(
    'switches',
    'edit'
  );

  const token =
    getArubaCentralToken_();

  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    muteHttpExceptions: true
  };

  const response =
    UrlFetchApp.fetch(
      'https://apigw-prod2.central.arubanetworks.com/configuration/v1/devices/' +
      encodeURIComponent(serialNumber) +
      '/config',
      options
    );

  if (response.getResponseCode() === 200) {
    return {
      status: 'success',
      config: response.getContentText()
    };
  }

  return {
    status: 'error',
    message:
      'Config unavailable for serial: ' +
      serialNumber
  };
}


function runNightlyDatabaseSync() {

  requireAdmin_();

  const statuses =
    getIntegrationStatusList_();

  const result = {};

  statuses.forEach(status => {

    if (
      !status.enabled ||
      !status.configurationComplete
    ) {
      result[status.id] =
        'skipped';
      return;
    }

    if (status.supportsScheduledSync) {
      try {
        result[status.id] =
          runIntegrationSync(
            status.id
          );
      } catch (error) {
        result[status.id] = {
          status: 'error',
          message:
            sanitizeIntegrationError_(
              error,
              'Scheduled integration sync failed.'
            )
        };
      }
    }

  });

  return result;
}

function normalizeArubaSwitchRole_(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[_-]/g, ' ');
  if (/^(commander(?: \/ stack)?|conductor|master|primary|active)$/.test(role)) return 'Commander';
  if (/^(member|standby|secondary|backup|slave)$/.test(role)) return 'Member';
  return '';
}

function normalizeArubaStackInfo_(value) {
  const text = String(value || '').trim();
  if (!text || /^(no|false|standalone)$/i.test(text)) return 'No';
  const match = /^(?:yes\s*[:(]?\s*)?(\d+)(?:\s*members?\)?)?$/i.exec(text);
  if (match) return Number(match[1]) > 1 ? 'Yes: ' + Number(match[1]) : 'No';
  return '';
}

function getArubaCentralSite_(device) {
  device = device || {};
  return String(device.site || device.site_name || device.siteName || '').trim();
}

function getArubaCentralDeviceStatusValues_(device) {
  device = device || {};
  return [
    device.status,
    device.state,
    device.device_status,
    device.connection_status,
    device.connectivity_status
  ].filter(value => value !== undefined && value !== null && String(value).trim() !== '');
}

function normalizeArubaCentralDeviceListStatus_(devices, deviceLabel) {
  const online = ['up', 'online', 'connected'];
  const offline = ['down', 'offline', 'disconnected'];
  const values = [];

  (devices || []).forEach(device => {
    getArubaCentralDeviceStatusValues_(device).forEach(value => {
      values.push(String(value).trim());
    });
  });

  if (values.some(value => online.includes(value.toLowerCase()))) return 'Online';
  if (values.some(value => offline.includes(value.toLowerCase()))) return 'Offline';

  console.warn(JSON.stringify({
    message: 'Unknown Aruba Central switch status',
    device: String(deviceLabel || ''),
    reportedValues: Array.from(new Set(values)).slice(0, 10)
  }));
  return 'Unknown';
}

function getArubaSwarmMap_(options) {
  const map = {};
  // Optional bulk enrichment: never add per-AP RPCs or block inventory on failure.
  try {
    for (let offset = 0; ; offset += 1000) {
      const response = UrlFetchApp.fetch(
        'https://apigw-prod2.central.arubanetworks.com/monitoring/v1/swarms?limit=1000&offset=' + offset + '&fields=ip_address',
        options);
      if (response.getResponseCode() !== 200) break;
      const payload = JSON.parse(response.getContentText());
      const swarms = payload.swarms || payload.data || [];
      if (!Array.isArray(swarms)) break;
      swarms.forEach(swarm => { if (swarm.swarm_id) map[String(swarm.swarm_id)] = swarm; });
      if (swarms.length < 1000) break;
    }
  } catch (error) {
    console.warn('Optional Aruba swarm enrichment unavailable; AP inventory sync continues.');
  }
  return map;
}

function formatArubaVirtualController_(ap, swarm) {
  swarm = swarm || {};
  const name = String(swarm.name || ap.swarm_name || ap.controller_name || '').trim();
  const candidate = String(swarm.ip_address || ap.virtual_controller_ip || ap.controller_ip || '').trim();
  const ip = ['0.0.0.0', '127.0.0.1', '::'].includes(candidate) ? '' : candidate;
  return [name ? 'Name: ' + name : '', ip ? 'IP: ' + ip : ''].filter(Boolean).join(' | ');
}

function processArubaAccessPointSync_(devices, swarms) {
  if (!devices.length) return 0;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Access Points');
  if (!sheet) return 0;
  const schema = getNetworkDashboardSchema_()['Access Points'];
  ensureSchemaHeaderRow_(sheet, 'Access Points', schema.headers, schema.headers, 1, 1, true);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value || '').trim());
  const serialIndex = headers.indexOf('Serial Number');
  const macIndex = headers.indexOf('MAC Address');
  const labelIndex = headers.indexOf('Device Label');
  const normalized = value => String(value || '').trim().toLowerCase();
  devices.forEach(ap => {
    const serial = ap.serial || ap.serial_number || '';
    const mac = ap.macaddr || ap.mac_address || '';
    const name = ap.name || ap.hostname || ap.device_name || '';
    let rowIndex = values.findIndex((row, index) => index > 0 &&
      (serial && normalized(row[serialIndex]) === normalized(serial) ||
       mac && normalized(row[macIndex]) === normalized(mac)));
    if (rowIndex < 0 && name) {
      rowIndex = values.findIndex((row, index) => index > 0 && !row[serialIndex] && !row[macIndex] &&
        normalized(row[labelIndex]) === normalized(name));
    }
    const fields = {
      'Status': normalizeControlledOption_('infrastructureStatus', ap.status || ap.state || 'Unknown', 'Status', false),
      'Device Label': name,
      'Model': ap.model || '',
      'IP Address': ap.ip_address || ap.ip || '',
      'Serial Number': serial,
      'MAC Address': mac,
      'Active Clients': ap.client_count == null ? '' : ap.client_count,
      'Campus': getArubaCentralSite_(ap),
      'Virtual Controller': formatArubaVirtualController_(ap, swarms[String(ap.swarm_id || '')]),
      'Last Sync': new Date()
    };
    if (rowIndex > 0) {
      Object.keys(fields).forEach(header => {
        const column = headers.indexOf(header);
        if (column >= 0) sheet.getRange(rowIndex + 1, column + 1).setValue(fields[header]);
      });
    } else {
      const row = headers.map(header => Object.prototype.hasOwnProperty.call(fields, header) ? fields[header] : '');
      sheet.appendRow(row);
      values.push(row);
    }
  });
  return devices.length;
}
