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


  throw new Error(
    'Aruba Central refresh token failed (HTTP ' +
    resCode +
    '). Check ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, and ARUBA_REFRESH_TOKEN.'
  );
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
          invDev.status || 'Up',
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

    apCount =
      processArubaDeviceSync_(
        'Access Points',
        apData,
        []
      );

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

      if (key) {
        stackMap[key] = stack;
      }

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

      if (stackMap[cleanKey]) {
        memberCount =
          stackMap[cleanKey].member_count ||
          stackMap[cleanKey].stack_members_count ||
          memberCount;
      }

      const stackInfoText =
        memberCount > 1
          ? 'Yes (' + memberCount + ' Members)'
          : 'No';

      const devRole =
        memberCount > 1
          ? 'Commander / Stack'
          : 'Standalone';

      const devStatus =
        devList.some(device =>
          device.status === 'Up' ||
          device.state === 'Up'
        )
          ? 'Up'
          : 'Down';

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
