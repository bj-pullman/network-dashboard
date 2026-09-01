const AUTHORIZED_USERS = [
  'bjpullman@sheridanschools.org',
  'chancebaughman@sheridanschools.org'
];

const SHEET_TABS = [
  "Dashboard",
  "Switches",
  "Access Points",
  "Servers",
  "Offline Servers",
  "IP Route Tables",
  "Security Cameras",
  "Intercom Bell System",
  "Bus Cameras",
  "Backup Schedule",
  "Replacement Switches"
];

function doGet() {
  const userEmail = getCurrentUserEmail_();
  const access = getUserAccess_(userEmail);

  if (!access.authorized) {
    const template = HtmlService.createTemplateFromFile('AccessDenied');
    template.userEmail = userEmail || 'Unknown Google Account';

    return template.evaluate()
      .setTitle('Sheridan IT - Access Restricted')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  const template = HtmlService.createTemplateFromFile('Index');
  template.userEmail = userEmail;
  template.userAccess = access;

  return template.evaluate()
    .setTitle('Sheridan IT Infrastructure')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
/**
 * Reads Sheet Data with Cache Purging and Noise Filtering
 */
function getSheetData(tabName, forceRefresh) {
  checkAuth();
  
  if (tabName === "Dashboard") {
    return getDashboardAnalytics();
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = "tab_data_" + tabName.replace(/\s+/g, '_');
  
  if (forceRefresh) {
    cache.remove(cacheKey);
  } else {
    const cached = cache.get(cacheKey);
    if (cached !== null) return JSON.parse(cached);
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  
  if (!sheet && tabName === "Access Points") {
    sheet = ss.insertSheet("Access Points");
    sheet.appendRow(["Device Label", "IP Address", "MAC Address", "Serial Number", "Model", "Status", "Uptime", "Active Clients", "Campus"]);
  } else if (!sheet) {
    return { headers: [], rows: [], totalCount: 0 };
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { headers: data[0] || [], rows: [], totalCount: 0 };

  const headers = data[0].map(h => String(h).trim()).filter(h => h !== "");
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    let rawStatus = String(data[i][headers.indexOf("Status")] || "");
    let rawLabel = String(data[i][headers.indexOf("Device Label")] || data[i][0] || "");

    if (
      rawStatus.includes("Color Legend") || 
      rawStatus.includes("Count =") || 
      rawLabel.includes("Color Legend") ||
      (rawLabel.trim() === "" && rawStatus.trim() === "")
    ) {
      continue;
    }

    let rowObj = { id: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j] !== undefined ? String(data[i][j]) : "";
    }
    rows.push(rowObj);
  }

  const result = { headers: headers, rows: rows, totalCount: rows.length };
  try { cache.put(cacheKey, JSON.stringify(result), 300); } catch(e) {}
  return result;
}

/**
 * Dashboard Overview Analytics
 */
function getDashboardAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const getTabRowCount = (name) => {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return 0;
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return 0;
    return data.slice(1).filter(r => !String(r[0]).includes("Color Legend") && String(r[0]).trim() !== "").length;
  };

  const switchesSheet = ss.getSheetByName("Switches");
  const campusCounts = {};
  if (switchesSheet) {
    const data = switchesSheet.getDataRange().getValues();
    const headers = data[0].map(h => String(h).trim());
    const campusCol = headers.indexOf("Campus");
    if (campusCol !== -1) {
      for (let i = 1; i < data.length; i++) {
        let campus = data[i][campusCol] || "Unassigned";
        if (!String(campus).includes("Color Legend")) {
          campusCounts[campus] = (campusCounts[campus] || 0) + 1;
        }
      }
    }
  }

  const linksSheet = ss.getSheetByName("Helpful Links");
  let links = [];
  if (linksSheet) {
    const linkData = linksSheet.getDataRange().getValues();
    for (let i = 1; i < linkData.length; i++) {
      if (linkData[i][0]) links.push({ title: linkData[i][0], url: linkData[i][1], category: linkData[i][2] || "General" });
    }
  } else {
    links = [
      { title: "Aruba Central Console", url: "https://portal.central.arubanetworks.com", category: "Network" },
      { title: "ThreatDown OneView Console", url: "https://cloud.malwarebytes.com", category: "Security" },
      { title: "HPE IMC Console", url: "https://imc.sheridanschools.org:8080", category: "Management" }
    ];
  }

  return {
    metrics: {
      switches: getTabRowCount("Switches"),
      aps: getTabRowCount("Access Points"),
      servers: getTabRowCount("Servers"),
      offlineServers: getTabRowCount("Offline Servers"),
      securityCameras: getTabRowCount("Security Cameras"),
      busCameras: getTabRowCount("Bus Cameras"),
      backupJobs: getTabRowCount("Backup Schedule"),
      replacementSwitches: getTabRowCount("Replacement Switches")
    },
    campusDistribution: campusCounts,
    helpfulLinks: links
  };
}

/**
 * Automated Trigger Routine
 */
function runNightlyDatabaseSync() {
  syncArubaCentralToSheet();
  syncThreatDownToSheet();
  clearAllCache();
}

/**
 * Aruba Central Token Exchange
 */
function getArubaCentralToken() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('ARUBA_CLIENT_ID');
  const clientSecret = props.getProperty('ARUBA_CLIENT_SECRET');
  const refreshToken = props.getProperty('ARUBA_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing ARUBA_CLIENT_ID, ARUBA_CLIENT_SECRET, or ARUBA_REFRESH_TOKEN in Script Properties.");
  }

  const url = "https://apigw-prod2.central.arubanetworks.com/oauth2/token";
  
  const payload = {
    "grant_type": "refresh_token",
    "client_id": clientId.trim(),
    "client_secret": clientSecret.trim(),
    "refresh_token": refreshToken.trim()
  };

  const options = {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: payload,
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const resCode = response.getResponseCode();
  const resText = response.getContentText();

  if (resCode === 200) {
    const json = JSON.parse(resText);
    if (json.refresh_token && json.refresh_token !== refreshToken) {
      props.setProperty('ARUBA_REFRESH_TOKEN', json.refresh_token);
    }
    return json.access_token;
  } else {
    throw new Error("Aruba Central Refresh Token Failed (HTTP " + resCode + "): " + resText);
  }
}

/**
 * Aruba Central Full District Device & Inventory Sync Engine
 */
function syncArubaCentralToSheet() {
  checkAuth();
  const token = getArubaCentralToken();

  const options = {
    method: "get",
    headers: { "Authorization": "Bearer " + token },
    muteHttpExceptions: true
  };

  let swCount = 0, apCount = 0;

  // 1. Fetch Switches, Stacks, and Global Hardware Inventory (Captures Legacy 2530s/2920s)
  const swResp = UrlFetchApp.fetch("https://apigw-prod2.central.arubanetworks.com/monitoring/v1/switches?limit=1000", options);
  const stackResp = UrlFetchApp.fetch("https://apigw-prod2.central.arubanetworks.com/monitoring/v1/stacks?limit=1000", options);
  const invResp = UrlFetchApp.fetch("https://apigw-prod2.central.arubanetworks.com/utility/v1/network_device_inventory?sku_type=switch&limit=1000", options);

  let swData = [];
  let stackData = [];
  let invData = [];

  if (swResp.getResponseCode() === 200) {
    const json = JSON.parse(swResp.getContentText());
    swData = json.switches || json.data || json.devices || (Array.isArray(json) ? json : []);
  }

  if (stackResp.getResponseCode() === 200) {
    const json = JSON.parse(stackResp.getContentText());
    stackData = json.stacks || json.data || (Array.isArray(json) ? json : []);
  }

  if (invResp.getResponseCode() === 200) {
    const json = JSON.parse(invResp.getContentText());
    invData = json.devices || json.data || (Array.isArray(json) ? json : []);
  }

  // Combine live monitoring devices with global hardware inventory
  const combinedSwitches = [...swData];
  invData.forEach(invDev => {
    let exists = combinedSwitches.some(d => (d.serial && d.serial === invDev.serial) || (d.macaddr && d.macaddr === invDev.macaddr));
    if (!exists) {
      combinedSwitches.push({
        name: invDev.device_name || invDev.aruba_part_no || "Legacy Switch",
        serial: invDev.serial,
        macaddr: invDev.macaddr,
        model: invDev.model || invDev.aruba_part_no || "",
        ip_address: invDev.ip_address || "",
        status: invDev.status || "Up",
        device_type: "Edge"
      });
    }
  });

  swCount = processDeviceSync("Switches", combinedSwitches, stackData);

  // 2. Fetch Access Points
  let apResp = UrlFetchApp.fetch("https://apigw-prod2.central.arubanetworks.com/monitoring/v1/aps?limit=1000", options);
  if (apResp.getResponseCode() === 404) {
    apResp = UrlFetchApp.fetch("https://apigw-prod2.central.arubanetworks.com/monitoring/v2/aps?limit=1000", options);
  }

  if (apResp.getResponseCode() === 200) {
    const json = JSON.parse(apResp.getContentText());
    const apData = json.aps || json.data || json.devices || (Array.isArray(json) ? json : []);
    apCount = processDeviceSync("Access Points", apData, []);
  }

  clearAllCache();
  return { status: "success", switchesSynced: swCount, apsSynced: apCount };
}

/**
 * Advanced Device Sync Engine (With Port Density & Legacy Fallback)
 */
function processDeviceSync(tabName, centralDevices, stackData) {
  if (!centralDevices || centralDevices.length === 0) return 0;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) return 0;

  let data = sheet.getDataRange().getValues();
  let headers = data[0].map(h => String(h).trim());

  // Enforce mandatory headers in Row 1
  const requiredCols = [
    "Status", "Device Label", "Model", "Type", "IP Address", 
    "Serial Number", "MAC Address", "Role", "Management Mode", 
    "Stack Info", "Port Capacity (Active)"
  ];

  requiredCols.forEach(col => {
    if (!headers.includes(col)) {
      sheet.getRange(1, headers.length + 1).setValue(col);
      headers.push(col);
    }
  });

  data = sheet.getDataRange().getValues();
  const statusIdx = headers.indexOf("Status");
  const labelIdx = headers.indexOf("Device Label") !== -1 ? headers.indexOf("Device Label") : headers.indexOf("AP Name");
  const modelIdx = headers.indexOf("Model");
  const typeIdx = headers.indexOf("Type");
  const ipIdx = headers.indexOf("IP Address");
  const serialIdx = headers.indexOf("Serial Number");
  const macIdx = headers.indexOf("MAC Address");
  const roleIdx = headers.indexOf("Role");
  const modeIdx = headers.indexOf("Management Mode");
  const stackIdx = headers.indexOf("Stack Info");
  const portIdx = headers.indexOf("Port Capacity (Active)");

  // 1. Group Central Devices by Clean Hostname
  const grouped = {};
  centralDevices.forEach(dev => {
    const rawDevName = String(dev.name || dev.hostname || dev.device_name || "").trim();
    const cleanKey = rawDevName.replace(/\s*\([\d\.]+\)\s*/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!grouped[cleanKey]) {
      grouped[cleanKey] = {
        name: rawDevName,
        devices: []
      };
    }
    grouped[cleanKey].devices.push(dev);
  });

  // 2. Index Stacks
  const stackMap = {};
  if (stackData && Array.isArray(stackData)) {
    stackData.forEach(st => {
      let key = String(st.name || st.stack_name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (key) stackMap[key] = st;
    });
  }

  // 3. Read Existing Sheet Rows
  const existingRows = [];
  for (let i = 1; i < data.length; i++) {
    let rawLabel = labelIdx !== -1 ? String(data[i][labelIdx]).trim() : "";
    let cleanLabel = rawLabel.replace(/\s*\([\d\.]+\)\s*/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

    existingRows.push({
      rowIndex: i + 1,
      ip: ipIdx !== -1 ? String(data[i][ipIdx]).trim() : "",
      serials: serialIdx !== -1 ? String(data[i][serialIdx]).trim().toUpperCase().split(/\s*[\/\,]\s*/) : [],
      cleanLabel: cleanLabel
    });
  }

  let matchedCount = 0;

  // 4. Process Each Grouped Hardware Entity
  Object.keys(grouped).forEach(cleanKey => {
    const group = grouped[cleanKey];
    const devList = group.devices;

    // Commander Selection
    let commander = devList.find(d => (d.ip_address && d.ip_address !== "127.0.0.1") || (d.ip && d.ip !== "127.0.0.1") || d.role === "Commander" || d.is_commander) || devList[0];

    let devIp = String(commander.ip_address || commander.ip || commander.management_ip || commander.site_ip || "").trim();
    if (devIp === "127.0.0.1") devIp = "";

    // Serials & MACs
    let serialList = devList.map(d => String(d.serial || d.serial_number || "").trim().toUpperCase()).filter(s => s !== "");
    let aggregatedSerials = serialList.join(" / ");
    let primaryMac = String(commander.macaddr || commander.mac_address || commander.mac || "").trim();

    // Stack Formatting
    let memberCount = devList.length;
    if (stackMap[cleanKey]) {
      memberCount = stackMap[cleanKey].member_count || stackMap[cleanKey].stack_members_count || memberCount;
    }

    let stackInfoText = memberCount > 1 ? `Yes (${memberCount} Members)` : "No";
    let devRole = memberCount > 1 ? "Commander / Stack" : "Standalone";
    let devStatus = devList.some(d => d.status === "Up" || d.state === "Up") ? "Up" : "Down";
    
    let devMode = "Monitor Mode";
    if (commander.management_type && String(commander.management_type).toLowerCase().includes("config")) {
      devMode = "Config Mode";
    }

    // Active Ports Calculation (Traverses nested port objects)
    let totalPorts = 0, activePorts = 0;
    devList.forEach(d => {
      let t = parseInt(d.port_count || d.ports_count || d.total_ports || 0);
      let a = parseInt(d.active_ports_count || d.ports_up || d.active_ports || 0);
      
      if (isNaN(t) && d.ports && Array.isArray(d.ports)) {
        t = d.ports.length;
        a = d.ports.filter(p => p.status === "Up" || p.link_state === "Up" || p.admin_state === "Up").length;
      }
      
      totalPorts += isNaN(t) ? 0 : t;
      activePorts += isNaN(a) ? 0 : a;
    });
    let portText = totalPorts > 0 ? `${activePorts}/${totalPorts} Active` : "";

    // Match Sheet Row
    let matched = existingRows.find(r => r.cleanLabel && r.cleanLabel === cleanKey);
    if (!matched && serialList.length > 0) {
      matched = existingRows.find(r => r.serials.some(s => serialList.includes(s)));
    }
    if (!matched && devIp) {
      matched = existingRows.find(r => r.ip && r.ip === devIp);
    }

    if (matched) {
      if (statusIdx !== -1) sheet.getRange(matched.rowIndex, statusIdx + 1).setValue(devStatus);
      if (ipIdx !== -1 && devIp) sheet.getRange(matched.rowIndex, ipIdx + 1).setValue(devIp);
      if (serialIdx !== -1) sheet.getRange(matched.rowIndex, serialIdx + 1).setValue(aggregatedSerials);
      if (macIdx !== -1 && primaryMac) sheet.getRange(matched.rowIndex, macIdx + 1).setValue(primaryMac);
      if (roleIdx !== -1) sheet.getRange(matched.rowIndex, roleIdx + 1).setValue(devRole);
      if (modeIdx !== -1) sheet.getRange(matched.rowIndex, modeIdx + 1).setValue(devMode);
      if (stackIdx !== -1) sheet.getRange(matched.rowIndex, stackIdx + 1).setValue(stackInfoText);
      if (portIdx !== -1 && portText) sheet.getRange(matched.rowIndex, portIdx + 1).setValue(portText);
      matchedCount++;
    } else {
      const newRow = headers.map(h => {
        if (h === "Status") return devStatus;
        if (h === "Device Label" || h === "AP Name") return group.name;
        if (h === "Model") return commander.model || "";
        if (h === "Type") return commander.device_type || "Edge";
        if (h === "IP Address") return devIp;
        if (h === "Serial Number") return aggregatedSerials;
        if (h === "MAC Address") return primaryMac;
        if (h === "Role") return devRole;
        if (h === "Management Mode") return devMode;
        if (h === "Stack Info") return stackInfoText;
        if (h === "Port Capacity (Active)") return portText;
        return "";
      });
      sheet.appendRow(newRow);
      matchedCount++;
    }
  });

  return matchedCount;
}

/**
 * ThreatDown Sync
 */
function syncThreatDownToSheet() {
  checkAuth();
  const props = PropertiesService.getScriptProperties();
  const accountId = props.getProperty('THREATDOWN_ACCOUNT_ID');
  const clientId = props.getProperty('THREATDOWN_CLIENT_ID');
  const clientSecret = props.getProperty('THREATDOWN_CLIENT_SECRET');

  if (!accountId || !clientId || !clientSecret) return { status: "not_configured" };

  const authString = Utilities.base64Encode(clientId + ":" + clientSecret);
  const authResp = UrlFetchApp.fetch("https://api.malwarebytes.com/oauth2/token", {
    method: "post",
    headers: { "Authorization": "Basic " + authString, "Content-Type": "application/x-www-form-urlencoded" },
    payload: "grant_type=client_credentials&scope=read",
    muteHttpExceptions: true
  });

  if (authResp.getResponseCode() !== 200) return { status: "error" };
  const token = JSON.parse(authResp.getContentText()).access_token;

  const endpointResp = UrlFetchApp.fetch("https://api.malwarebytes.com/nebula/v1/endpoints", {
    method: "get",
    headers: { "Authorization": "Bearer " + token, "accountid": accountId },
    muteHttpExceptions: true
  });

  if (endpointResp.getResponseCode() !== 200) return { status: "error" };
  const endpoints = JSON.parse(endpointResp.getContentText()).endpoints || [];

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const serversSheet = ss.getSheetByName("Servers");
  if (!serversSheet) return { status: "success" };

  const data = serversSheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const nameIdx = headers.indexOf("Server Name");
  const ipIdx = headers.indexOf("IP Address");
  const tdIdx = headers.indexOf("Threatdown Installed");

  if (tdIdx === -1) return { status: "success" };

  for (let i = 1; i < data.length; i++) {
    let serverName = String(data[i][nameIdx]).toLowerCase().trim();
    let serverIp = String(data[i][ipIdx]).trim();

    let isInstalled = endpoints.some(e => 
      (e.host_name && e.host_name.toLowerCase().includes(serverName)) ||
      (e.ip_address && e.ip_address === serverIp)
    );

    serversSheet.getRange(i + 1, tdIdx + 1).setValue(isInstalled ? "TRUE" : "FALSE");
  }

  clearAllCache();
  return { status: "success", endpointsFound: endpoints.length };
}

/**
 * Running Config Pull
 */
function fetchSwitchRunningConfig(serialNumber) {
  checkAuth();
  const token = getArubaCentralToken();
  const options = { method: "get", headers: { "Authorization": "Bearer " + token }, muteHttpExceptions: true };
  const response = UrlFetchApp.fetch(`https://apigw-prod2.central.arubanetworks.com/configuration/v1/devices/${serialNumber}/config`, options);

  if (response.getResponseCode() === 200) {
    return { status: "success", config: response.getContentText() };
  }
  return { status: "error", message: "Config unavailable for serial: " + serialNumber };
}

/**
 * Database Mutations
 */
function updateCellRecord(tabName, rowIndex, headerName, newValue) {
  checkAuth();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const colIndex = headers.indexOf(headerName) + 1;
  sheet.getRange(rowIndex, colIndex).setValue(newValue);
  clearTabCache(tabName);
  return { status: "success" };
}

function updateEntireRecord(tabName, rowIndex, recordObj) {
  checkAuth();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rowValues = headers.map(h => recordObj[h] !== undefined ? recordObj[h] : "");
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
  clearTabCache(tabName);
  return { status: "success" };
}

function addRecord(tabName, recordObject) {
  checkAuth();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(tabName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  sheet.appendRow(headers.map(h => recordObject[h] || ""));
  clearTabCache(tabName);
  return { status: "success" };
}

function deleteRecord(tabName, rowIndex) {
  checkAuth();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.getSheetByName(tabName).deleteRow(rowIndex);
  clearTabCache(tabName);
  return { status: "success" };
}

function clearTabCache(tabName) {
  CacheService.getScriptCache().remove("tab_data_" + tabName.replace(/\s+/g, '_'));
}

function clearAllCache() {
  const cache = CacheService.getScriptCache();
  SHEET_TABS.forEach(tab => cache.remove("tab_data_" + tab.replace(/\s+/g, '_')));
  return { status: "success" };
}

function checkAuth() {
  const userEmail = Session.getActiveUser().getEmail().toLowerCase();
  if (!AUTHORIZED_USERS.map(u => u.toLowerCase()).includes(userEmail)) throw new Error("Unauthorized access.");
}

/**
 * UTILITY: Clears all appended duplicate member rows from the bottom of the Switches sheet
 */
function purgeAllAppendedRows() {
  checkAuth();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Switches");
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const roleIdx = headers.indexOf("Role");
  const stackIdx = headers.indexOf("Stack Info");

  for (let i = data.length - 1; i >= 1; i--) {
    let role = String(data[i][roleIdx] || "");
    let stackInfo = String(data[i][stackIdx] || "");

    // Delete single member rows created by prior runs
    if (role === "Member" && stackInfo === "Stack: Yes (1 Members)") {
      sheet.deleteRow(i + 1);
    }
  }

  clearTabCache("Switches");
}