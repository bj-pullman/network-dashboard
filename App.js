/*******************************************************
 * NETWORK DASHBOARD
 * Application / RBAC / Data Layer
 *******************************************************/

const APP_USERS_SHEET = 'App Users';

/*******************************************************
 * SENSITIVE FIELD CLASSIFICATION
 *******************************************************/

const APP_USERNAME_HEADERS = new Set([
  'user',
  'users',
  'username',
  'usernames',
  'login',
  'logins',
  'loginname',
  'loginusername',
  'account',
  'accounts',
  'accountname'
]);


const APP_PASSWORD_HEADERS = new Set([
  'password',
  'passwords',
  'pass',
  'passwd',
  'pw',
  'pword',
  'pwd',
  'passcode',
  'passcodes',
  'secret',
  'secrets',
  'credential',
  'credentials'
]);


const APP_PAGE_CONFIG = {

  dashboard: {
    key: 'dashboard',
    label: 'Dashboard',
    sheet: 'Dashboard',
    type: 'dashboard',
    icon: 'fa-gauge-high',
    group: 'Overview'
  },

  workflow: {
    key: 'workflow',
    label: 'Department Workflow',
    sheet: 'Department Workflow',
    type: 'workflow',
    icon: 'fa-diagram-project',
    group: 'Overview'
  },

  switches: {
    key: 'switches',
    label: 'Switches',
    sheet: 'Switches',
    type: 'table',
    icon: 'fa-network-wired',
    group: 'Infrastructure',
    centralSync: true,

    defaultColumns: ["Status","Device Label","Model","Type","IP Address","Campus"]
  },

  accessPoints: {
    key: 'accessPoints',
    label: 'Access Points',
    sheet: 'Access Points',
    type: 'table',
    icon: 'fa-wifi',
    group: 'Infrastructure',
    centralSync: true,

    defaultColumns: ["Status","Device Label","IP Address","Model","MAC Address"]
  },

  servers: {
    key: 'servers',
    label: 'Servers',
    sheet: 'Servers',
    offlineSheet: 'Offline Servers',
    type: 'table',
    icon: 'fa-server',
    group: 'Infrastructure',
    combinedServerPage: true,

    defaultColumns: [
      'Server Name',
      'Status',
      'IP Address',
      'Type',
      'Location'
    ]
  },

  routes: {
    key: 'routes',
    label: 'VLANs & Routing',
    sheet: 'IP Route Tables',
    type: 'table',
    icon: 'fa-route',
    group: 'Infrastructure',

    defaultColumns: ["Campus / Location","VLAN ID","VLAN Name","Network / CIDR","Gateway"]
  },

  internetWan: {
    key: 'internetWan',
    label: 'Internet / WAN',
    sheet: 'Internet WAN',
    type: 'internetWan',
    icon: 'fa-globe',
    group: 'Infrastructure',

    defaultColumns: [
      'Circuit Name',
      'Site / Location',
      'Role',
      'Provider',
      '_monitorHealth',
      'Status'
    ]
  },

  outages: {
    key: 'outages',
    label: 'Outages',
    sheet: 'Outages',
    type: 'outages',
    icon: 'fa-triangle-exclamation',
    group: 'Monitoring',

    defaultColumns: [
      'Site / Location',
      'Circuit Name',
      'Provider',
      'Started',
      'Restored',
      'Duration',
      'Status'
    ]
  },

  uptimeRobot: {
    key: 'uptimeRobot',
    label: 'UptimeRobot',
    sheet: 'UptimeRobot',
    type: 'uptimeRobot',
    icon: 'fa-heart-pulse',
    group: 'Monitoring',
    integrationId: 'uptimerobot',

    defaultColumns: [
      'Monitor Name',
      'Health',
      'Target',
      'Last Checked',
      'Last Sync'
    ]
  },

  securityCameras: {

    key:
      'securityCameras',

    label:
      'Security Cameras',

    sheet:
      'Security Cameras',

    type:
      'table',

    icon:
      'fa-video',

    group:
      'Physical Systems',

    defaultColumns: ["Location","Asset / System","Username","Password","Server Location"]

  },

  busCameras: {
    key: 'busCameras',
    label: 'Bus Cameras',
    sheet: 'Bus Cameras',
    type: 'structured',
    icon: 'fa-bus',
    group: 'Physical Systems',

    sections: [
      {
        key: 'reference',
        title: 'System Reference',
        subtitle: 'Bus camera network and system information',
        type: 'metadata',
        startRow: 1,
        endRow: 5,
        startColumn: 1
      },

      {
        key: 'buses',
        title: 'Bus Inventory',
        subtitle: 'Bus camera and network assignments',
        type: 'table',
        headerRow: 7,
        startColumn: 1,

        defaultColumns: ["Bus Name/Number","DVR Type","DVR IP","Bridge IP","Bus Type"]
      }
    ]
  },

  intercom: {
    key: 'intercom',
    label: 'Intercom & Bell',
    sheet: 'Intercom Bell System',
    type: 'structured',
    icon: 'fa-bullhorn',
    group: 'Physical Systems',

    sections: [
      {
        key: 'intercomSystems',
        title: 'Intercom & Bell Systems',
        subtitle: 'Intercom, bell, gateway and VLAN infrastructure',
        type: 'table',
        headerRow: 1,
        startColumn: 1,

        defaultColumns: ["Location","IP Address","Username","Password","Subnet","Port"]
      }
    ]
  },

  backups: {
    key: 'backups',
    label: 'Backup Schedule',
    sheet: 'Backup Schedule',
    type: 'table',
    icon: 'fa-database',
    group: 'Operations',

    defaultColumns: [
      'Server Name',
      'Backup Job Name',
      'Backup Time',
      'Target Location',
      'Wasabi Job'
    ]
  },

  settings: {
    key: 'settings',
    label: 'Settings',
    sheet: 'App Settings',
    type: 'settings',
    icon: 'fa-sliders',
    group: 'Administration',
    adminOnly: true
  },

  users: {
    key: 'users',
    label: 'Users & Permissions',
    sheet: APP_USERS_SHEET,
    type: 'users',
    icon: 'fa-users-gear',
    group: 'Administration',
    adminOnly: true
  }

};


const APP_MODULE_CACHE_KEY =
  'network_dashboard_modules';


const APP_MODULE_REGISTRY = {

  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Infrastructure summary and health indicators.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'dashboard',
    requiredSheets: [
      'Dashboard'
    ],
    permissionKey: 'dashboard'
  },

  switches: {
    id: 'switches',
    name: 'Switches',
    description: 'Switch inventory, status and network attributes.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'switches',
    requiredSheets: [
      'Switches'
    ],
    permissionKey: 'switches'
  },

  accessPoints: {
    id: 'accessPoints',
    name: 'Access Points',
    description: 'Wireless access point inventory and status.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'accessPoints',
    requiredSheets: [
      'Access Points'
    ],
    permissionKey: 'accessPoints'
  },

  servers: {
    id: 'servers',
    name: 'Servers',
    description: 'Active and offline server inventory.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'servers',
    requiredSheets: [
      'Servers',
      'Offline Servers'
    ],
    permissionKey: 'servers'
  },

  routes: {
    id: 'routes',
    name: 'VLANs & Routing',
    description: 'Network route and VLAN reference data.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'routes',
    requiredSheets: [
      'IP Route Tables'
    ],
    permissionKey: 'routes'
  },

  internetWan: {
    id: 'internetWan',
    name: 'Internet / WAN',
    description: 'Internet and WAN circuit documentation by site.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'internetWan',
    requiredSheets: [
      'Internet WAN'
    ],
    permissionKey: 'internetWan'
  },

  outages: {
    id: 'outages',
    name: 'Outages',
    description: 'WAN circuit outage history from manual entries and UptimeRobot incidents.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'outages',
    requiredSheets: [
      'Outages'
    ],
    permissionKey: 'outages'
  },

  securityCameras: {
    id: 'securityCameras',
    name: 'Security Cameras',
    description: 'Camera systems and related access information by location.',
    classification: 'core',
    enabledByDefault: true,
    pageKey: 'securityCameras',
    requiredSheets: [
      'Security Cameras'
    ],
    permissionKey: 'securityCameras'
  },

  workflow: {
    id: 'workflow',
    name: 'Department Workflow',
    description: 'Support ownership, tiers, priorities and workflow rules.',
    classification: 'administration',
    enabledByDefault: true,
    pageKey: 'workflow',
    requiredSheets: [
      'Department Workflow'
    ],
    permissionKey: 'workflow'
  },

  users: {
    id: 'users',
    name: 'Users & Permissions',
    description: 'Administrative access and page-level permissions.',
    classification: 'administration',
    enabledByDefault: true,
    pageKey: 'users',
    requiredSheets: [
      APP_USERS_SHEET
    ],
    permissionKey: 'users'
  },

  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Instance configuration, modules and integrations.',
    classification: 'administration',
    enabledByDefault: true,
    pageKey: 'settings',
    requiredSheets: [
      'App Settings',
      'App Integrations'
    ],
    permissionKey: 'settings'
  },

  busCameras: {
    id: 'busCameras',
    name: 'Bus Cameras',
    description: 'Track and manage camera systems installed on buses.',
    classification: 'optional',
    enabledByDefault: false,
    pageKey: 'busCameras',
    requiredSheets: [
      'Bus Cameras'
    ],
    permissionKey: 'busCameras'
  },

  intercom: {
    id: 'intercom',
    name: 'Intercom & Bell System',
    description: 'Track intercom, bell and related network infrastructure.',
    classification: 'optional',
    enabledByDefault: false,
    pageKey: 'intercom',
    requiredSheets: [
      'Intercom Bell System'
    ],
    permissionKey: 'intercom'
  },

  backups: {
    id: 'backups',
    name: 'Backup Schedule',
    description: 'Track infrastructure backup schedules and jobs.',
    classification: 'optional',
    enabledByDefault: false,
    pageKey: 'backups',
    requiredSheets: [
      'Backup Schedule'
    ],
    permissionKey: 'backups'
  }

};


/*******************************************************
 * HTML
 *******************************************************/

function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}


/*******************************************************
 * MODULES
 *******************************************************/

function getModuleSettingKey_(
  moduleId
) {

  return 'modules.' +
    moduleId +
    '.enabled';
}


function normalizeModuleDefinition_(
  module
) {

  const normalized =
    Object.assign(
      {},
      module
    );

  const sheets =
    normalized.requiredSheets || [];

  normalized.resourceId =
    normalized.resourceId ||
    normalized.permissionKey ||
    normalized.pageKey ||
    normalized.id;

  normalized.navigationTarget =
    normalized.navigationTarget ||
    normalized.pageKey ||
    '';

  normalized.setupSheets =
    normalized.setupSheets ||
    sheets;

  normalized.schemaSheets =
    normalized.schemaSheets ||
    sheets;

  return normalized;
}


function getModuleDefinitions_() {

  return Object.keys(APP_MODULE_REGISTRY)
    .map(key =>
      normalizeModuleDefinition_(
        APP_MODULE_REGISTRY[key]
      )
    );
}


function getModuleSettingDefinitions_() {

  return getModuleDefinitions_()
    .filter(module =>
      module.classification === 'optional'
    )
    .map(module => ({
      key:
        getModuleSettingKey_(
          module.id
        ),
      label:
        module.name,
      category:
        'Modules',
      type:
        'boolean',
      defaultValue:
        module.enabledByDefault
          ? 'true'
          : 'false',
      editable:
        true,
      description:
        module.description
    }));
}


function normalizeModuleEnabledValue_(
  value,
  defaultEnabled
) {

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ''
  ) {
    return !!defaultEnabled;
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  return (
    normalized === 'true' ||
    normalized === 'yes' ||
    normalized === '1'
  );
}


function getModuleStateMap_() {
  if (APP_EXECUTION_METADATA.modules) return APP_EXECUTION_METADATA.modules;

  const cache =
    CacheService.getScriptCache();

  const cached =
    cache.get(
      APP_MODULE_CACHE_KEY
    );


  if (cached) {
    try {
      return APP_EXECUTION_METADATA.modules = JSON.parse(cached);
    } catch (error) {}
  }


  const settings =
    AppConfig.getAll();

  const states = {};


  getModuleDefinitions_()
    .forEach(module => {

      const optional =
        module.classification === 'optional';

      const enabled =
        optional
          ? normalizeModuleEnabledValue_(
              settings[
                getModuleSettingKey_(
                  module.id
                )
              ],
              module.enabledByDefault
            )
          : true;


      states[module.id] = {
        id: module.id,
        enabled: enabled,
        optional: optional,
        classification:
          module.classification
      };

    });


  cacheJson_(
    APP_MODULE_CACHE_KEY,
    states,
    300
  );


  return APP_EXECUTION_METADATA.modules = states;
}


function invalidateModuleCache_() {
  APP_EXECUTION_METADATA.modules = null;

  try {
    CacheService
      .getScriptCache()
      .remove(
        APP_MODULE_CACHE_KEY
      );
  } catch (error) {}
}


function haveModuleStatesChanged_(
  before,
  after
) {

  before =
    before || {};

  after =
    after || {};

  const ids = {};

  Object.keys(before)
    .forEach(id => {
      ids[id] =
        true;
    });

  Object.keys(after)
    .forEach(id => {
      ids[id] =
        true;
    });

  return Object.keys(ids)
    .some(id =>
      !!(
        before[id] &&
        before[id].enabled
      ) !==
      !!(
        after[id] &&
        after[id].enabled
      )
    );
}


function getModuleByPageKey_(
  pageKey
) {

  return getModuleDefinitions_()
    .find(module =>
      module.pageKey === pageKey
    ) || null;
}


function isModuleEnabled_(
  moduleId
) {

  const definition = APP_MODULE_REGISTRY[moduleId];
  if (definition && definition.classification !== 'optional') return true;
  const states =
    getModuleStateMap_();

  return !!(
    states[moduleId] &&
    states[moduleId].enabled
  );
}


function isPageEnabled_(
  pageKey
) {

  const module =
    getModuleByPageKey_(
      pageKey
    );


  if (module) {
    return isModuleEnabled_(
      module.id
    );
  }


  const config =
    APP_PAGE_CONFIG[pageKey];

  if (
    config &&
    config.integrationId &&
    typeof isIntegrationOperationalPageEnabled_ === 'function'
  ) {
    return isIntegrationOperationalPageEnabled_(
      config.integrationId,
      pageKey
    );
  }

  return false;
}


function getActiveModuleSheetNames_() {

  const names = [];


  getModuleDefinitions_()
    .filter(module =>
      isModuleEnabled_(
        module.id
      )
    )
    .forEach(module => {

      (module.setupSheets || module.requiredSheets || [])
        .forEach(sheetName => {

          if (
            sheetName &&
            !names.includes(sheetName)
          ) {
            names.push(sheetName);
          }

        });

    });


  return names;
}


function getActiveNetworkDashboardSchema_() {

  const schema =
    getNetworkDashboardSchema_();

  const active = {};


  getActiveModuleSheetNames_()
    .forEach(sheetName => {

      if (schema[sheetName]) {
        active[sheetName] =
          schema[sheetName];
      }

    });

  if (
    typeof getActiveIntegrationSheetNames_ === 'function'
  ) {
    getActiveIntegrationSheetNames_()
      .forEach(sheetName => {

        if (schema[sheetName]) {
          active[sheetName] =
            schema[sheetName];
        }

      });
  }


  return active;
}


function getModuleStatusList_(
  options
) {

  options =
    options || {};

  const states =
    getModuleStateMap_();


  return getModuleDefinitions_()
    .filter(module =>
      options.includeCore ||
      module.classification === 'optional'
    )
    .map(module => {

      const state =
        states[module.id] || {};

      return {
        id: module.id,
        name: module.name,
        description: module.description,
        classification:
          module.classification,
        optional:
          module.classification === 'optional',
        enabled:
          !!state.enabled,
        enabledByDefault:
          !!module.enabledByDefault,
        pageKey:
          module.pageKey || '',
        navigationTarget:
          module.pageKey || '',
        permissionKey:
          module.permissionKey || module.pageKey || module.id,
        resourceId:
          module.resourceId,
        requiredSheets:
          module.requiredSheets || [],
        setupSheets:
          module.setupSheets || module.requiredSheets || [],
        schemaSheets:
          module.schemaSheets || module.requiredSheets || [],
        settingKey:
          module.classification === 'optional'
            ? getModuleSettingKey_(
                module.id
              )
            : ''
      };

    });
}


function requirePageModuleEnabled_(
  pageKey
) {

  if (
    isPageEnabled_(
      pageKey
    )
  ) {
    return true;
  }


  const module =
    getModuleByPageKey_(
      pageKey
    );

  throw new Error(
    module &&
    module.classification === 'optional'
      ? module.name +
        ' is disabled for this Network Dashboard.'
      : 'This Network Dashboard page is not enabled.'
  );
}


/*******************************************************
 * USER
 *******************************************************/

function getCurrentUserEmail_() {
  return String(
    Session.getActiveUser().getEmail() || ''
  )
    .trim()
    .toLowerCase();
}


function isBreakglassAdmin_(email) {
  return getBreakGlassAdmins_()
    .includes(
      String(email || '')
        .trim()
        .toLowerCase()
    );
}


/*******************************************************
 * APP USERS
 *******************************************************/

function ensureAppUsersSheet_() {

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(APP_USERS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(APP_USERS_SHEET);
  }


  const requiredHeaders = getAppUserHeaders_();


  const currentWidth =
    Math.max(
      sheet.getLastColumn(),
      requiredHeaders.length
    );


  const currentHeaders =
    currentWidth
      ? sheet
          .getRange(
            1,
            1,
            1,
            currentWidth
          )
          .getDisplayValues()[0]
          .map(value =>
            String(value || '').trim()
          )
      : [];


  const hasHeaders =
    currentHeaders.some(Boolean);


  if (!hasHeaders) {

    sheet
      .getRange(
        1,
        1,
        1,
        requiredHeaders.length
      )
      .setValues([
        requiredHeaders
      ]);

  } else {

    const headers =
      currentHeaders.slice();

    while (
      headers.length &&
      !headers[headers.length - 1]
    ) {
      headers.pop();
    }


    requiredHeaders.forEach(header => {

      if (!headers.includes(header)) {

        sheet
          .getRange(
            1,
            headers.length + 1
          )
          .setValue(header);

        headers.push(header);

      }

    });

  }


  sheet.setFrozenRows(1);


  sheet
    .getRange(
      1,
      1,
      1,
      requiredHeaders.length
    )
    .setFontWeight('bold')
    .setBackground('#17345f')
    .setFontColor('#ffffff');


  sheet.autoResizeColumns(
    1,
    requiredHeaders.length
  );

  return sheet;
}


function getAppUserHeaders_() {
  return [
    'Email',
    'Name',
    'Active',
    'Role',
    'Default Permission',
    'Page Permissions',
    'Notes'
  ];
}


/*******************************************************
 * ACCESS
 *******************************************************/

function getUserAccess_(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(APP_EXECUTION_METADATA.access, key)) {
    APP_EXECUTION_METADATA.access[key] = resolveUserAccess_(key);
  }
  return APP_EXECUTION_METADATA.access[key];
}

function resolveUserAccess_(email) {

  email = String(email || '')
    .trim()
    .toLowerCase();


  if (!email) {

    return {
      authorized: false,
      admin: false,
      email: '',
      permissions: {}
    };

  }


  /*
   * Breakglass accounts do not need a Sheet lookup.
   */
  if (isBreakglassAdmin_(email)) {
    if (APP_READ_CONTEXT) APP_READ_CONTEXT.accessCache = 'breakglass';

    const permissions =
      getFullEditPermissions_();


    return {
      authorized: true,
      admin: true,
      breakglass: true,
      email: email,
      name: email.split('@')[0],
      permissions: permissions
    };

  }


  /*
   * Cache the resolved permission object.
   *
   * This avoids rereading App Users every time somebody
   * clicks a password eye or loads another page.
   */
  const cache =
    CacheService.getScriptCache();


  const cacheKey =
    'app_access_' + email;


  const cached =
    cache.get(cacheKey);


  if (APP_READ_CONTEXT) APP_READ_CONTEXT.accessCache = cached ? 'hit' : 'miss';
  if (cached) {

    try {

      return JSON.parse(
        cached
      );

    } catch (error) {}

  }


  const sheet = getReadSheet_(APP_USERS_SHEET);
  if (!sheet) return { authorized: false, admin: false, email: email, permissions: {} };
  const allValues = measureAppReadStep_('accessSheetRead', function() {
    if (APP_READ_CONTEXT) APP_READ_CONTEXT.sheetReads += 1;
    return sheet.getDataRange().getValues();
  });
  const indexes = getAppUsersHeaderIndexes_(null, allValues[0] || []);
  const emailIndex = indexes.email;
  const values = allValues.slice(1);

  const match =
    values.find(
      row =>
        String(row[emailIndex] || '')
          .trim()
          .toLowerCase() === email
    );


  if (!match) {

    return {
      authorized: false,
      admin: false,
      email: email,
      permissions: {}
    };

  }


  const activeValue =
    match[indexes.active];


  const activeText =
    String(activeValue || '')
      .trim()
      .toLowerCase();


  const active =
    activeValue === true ||
    activeText === 'true' ||
    activeText === 'yes' ||
    activeText === 'active';


  if (!active) {

    return {
      authorized: false,
      admin: false,
      email: email,
      permissions: {}
    };

  }


  const defaultPermission =
    normalizePermission_(
      match[indexes.defaultPermission] ||
      'view'
    );


  const role =
    normalizeRole_(
      match[indexes.role] ||
      'user'
    );


  let overrides = {};


  try {

    const pagePermissionsIndex =
      indexes.pagePermissions;


    overrides =
      match[pagePermissionsIndex]
        ? JSON.parse(
            String(
              match[
                pagePermissionsIndex
              ]
            )
          )
        : {};

  } catch (error) {

    overrides = {};

  }


  const permissions = {};


  if (role === 'admin') {

    const adminResult = {

      authorized: true,

      admin: true,

      breakglass: false,

      email: email,

      name:
        String(
          match[indexes.name] ||
          email.split('@')[0]
        ),

      role:
        role,

      permissions:
        getFullEditPermissions_()

    };


    cacheJson_(
      cacheKey,
      adminResult,
      300
    );


    return adminResult;

  }


  Object.keys(APP_PAGE_CONFIG)
    .forEach(
      key => {

        const config =
          APP_PAGE_CONFIG[key];


        if (config.adminOnly) {

          permissions[key] =
            'none';

          return;

        }


        permissions[key] =
          normalizePermission_(
            overrides[key] ||
            defaultPermission
          );

      }
    );


  const result = {

    authorized: true,

    admin: false,

    breakglass: false,

    email: email,

    name:
      String(
        match[indexes.name] ||
        email.split('@')[0]
      ),

    role:
      role,

    permissions:
      permissions

  };


  cacheJson_(
    cacheKey,
    result,
    300
  );


  return result;
}


function getFullEditPermissions_() {

  const permissions = {};

  Object.keys(APP_PAGE_CONFIG)
    .forEach(key => {
      permissions[key] = 'edit';
    });

  return permissions;
}


function normalizeRole_(role) {

  const value =
    String(role || '')
      .trim()
      .toLowerCase();


  if (
    value === 'admin' ||
    value === 'administrator' ||
    value === 'super administrator'
  ) {
    return 'admin';
  }


  return 'user';
}


function getAppUsersHeaderMap_(sheet) {

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );


  const map = {};


  headers.forEach(
    (header, index) => {
      if (header) {
        map[header] = index;
      }
    }
  );


  return map;
}


function getHeaderIndex_(
  headerMap,
  header,
  fallback
) {

  if (
    Object.prototype
      .hasOwnProperty
      .call(
        headerMap,
        header
      )
  ) {
    return headerMap[header];
  }


  return fallback;
}


function getRequiredHeaderIndex_(
  headerMap,
  header,
  context,
  expectedHeaders
) {

  if (
    Object.prototype
      .hasOwnProperty
      .call(
        headerMap,
        header
      )
  ) {
    return headerMap[header];
  }

  const expected =
    expectedHeaders &&
    expectedHeaders.length
      ? ' Expected headers: ' +
        expectedHeaders.join(', ') +
        '.'
      : '';

  throw new Error(
    context +
    ' is missing required header "' +
    header +
    '".' +
    expected
  );
}


function getAppUsersHeaderIndexes_(sheet, headers) {

  const headerMap =
    headers ? mapHeaders_(headers.map(value => String(value || '').trim())) : getAppUsersHeaderMap_(sheet);

  const expectedHeaders =
    getAppUserHeaders_();

  return {
    headerMap: headerMap,
    email:
      getRequiredHeaderIndex_(
        headerMap,
        'Email',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    name:
      getRequiredHeaderIndex_(
        headerMap,
        'Name',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    active:
      getRequiredHeaderIndex_(
        headerMap,
        'Active',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    role:
      getRequiredHeaderIndex_(
        headerMap,
        'Role',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    defaultPermission:
      getRequiredHeaderIndex_(
        headerMap,
        'Default Permission',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    pagePermissions:
      getRequiredHeaderIndex_(
        headerMap,
        'Page Permissions',
        APP_USERS_SHEET,
        expectedHeaders
      ),
    notes:
      getRequiredHeaderIndex_(
        headerMap,
        'Notes',
        APP_USERS_SHEET,
        expectedHeaders
      )
  };
}


function normalizePermission_(permission) {

  const value = String(permission || '')
    .trim()
    .toLowerCase();

  if (value === 'edit') return 'edit';
  if (value === 'view') return 'view';

  return 'none';
}


function getPagePermission_(pageKey) {
  if (APP_READ_CONTEXT && APP_READ_CONTEXT.pageKey === pageKey &&
      APP_READ_CONTEXT.permission) return APP_READ_CONTEXT.permission;

  if (
    !isPageEnabled_(
      pageKey
    )
  ) {
    return 'none';
  }


  const access =
    getUserAccess_(getCurrentUserEmail_());

  if (access.admin) {
    return 'edit';
  }

  return access.permissions[pageKey] || 'none';
}


function requirePagePermission_(pageKey, level) {

  if (APP_READ_CONTEXT && APP_READ_CONTEXT.pageKey === pageKey &&
      APP_READ_CONTEXT.access && level === 'view') return APP_READ_CONTEXT.access;
  measureAppReadStep_('enablement', function() { requirePageModuleEnabled_(pageKey); });


  const access =
    measureAppReadStep_('permission', function() { return getUserAccess_(getCurrentUserEmail_()); });


  if (!access.authorized) {
    throw new Error('Unauthorized access.');
  }


  if (APP_PAGE_CONFIG[pageKey].adminOnly && !access.admin) {
    throw new Error('Administrator access is required.');
  }
  if (access.admin) {
    if (APP_READ_CONTEXT && APP_READ_CONTEXT.pageKey === pageKey) APP_READ_CONTEXT.access = access;
    return access;
  }


  const permission =
    access.permissions[pageKey] || 'none';


  if (
    level === 'view' &&
    permission !== 'view' &&
    permission !== 'edit'
  ) {
    throw new Error(
      'You do not have permission to view this page.'
    );
  }


  if (
    level === 'edit' &&
    permission !== 'edit'
  ) {
    throw new Error(
      'You do not have permission to modify this page.'
    );
  }


  if (APP_READ_CONTEXT && APP_READ_CONTEXT.pageKey === pageKey) APP_READ_CONTEXT.access = access;
  return access;
}


function requireAdmin_() {

  const access =
    getUserAccess_(
      getCurrentUserEmail_()
    );

  if (!access.admin) {
    throw new Error(
      'Administrator access is required.'
    );
  }

  return access;
}


/*******************************************************
 * BOOTSTRAP
 *******************************************************/

function withPerformanceTiming_(
  label,
  callback
) {

  const start =
    Date.now();

  try {
    return callback();
  } finally {
    console.log(
      '[Network Dashboard timing] ' +
      label +
      ': ' +
      (Date.now() - start) +
      ' ms'
    );
  }
}


function buildAppBootstrap_(
  access,
  config
) {

  const clientConfig =
    config ||
    AppConfig.getClientConfig_();


  if (!access.authorized) {
    throw new Error('Unauthorized access.');
  }


  const pages = [];


  Object.keys(APP_PAGE_CONFIG)
    .forEach(key => {

      const config =
        APP_PAGE_CONFIG[key];


      if (
        !isPageEnabled_(
          key
        )
      ) {
        return;
      }


      if (
        config.adminOnly &&
        !access.admin
      ) {
        return;
      }


      const permission =
        access.admin
          ? 'edit'
          : access.permissions[key] || 'none';


      if (permission === 'none') {
        return;
      }


      pages.push({
        key: config.key,
        label: config.label,
        type: config.type,
        icon: config.icon,
        group: config.group,
        centralSync: !!config.centralSync,
        permission: permission
      });

    });


  return {

    user: {
      email: access.email,
      name: access.name,
      admin: access.admin,
      breakglass: access.breakglass,
      role: access.role || 'user'
    },

    pages: pages,

    modules:
      getModuleStatusList_({
        includeCore: true
      }),

    startupTasks:
      getStartupTaskState_(
        access
      ),

    config:
      clientConfig

  };
}


function getStartupTaskState_(
  access
) {

  return {
    uptimeRobotHealthRefresh:
      getUptimeRobotStartupRefreshState_(
        access
      )
  };
}


function getUptimeRobotStartupRefreshState_(
  access
) {

  const state = {
    enabled: false,
    reason: '',
    affectedPages: [
      'uptimeRobot',
      'internetWan',
      'dashboard'
    ]
  };

  if (
    !access ||
    !access.admin
  ) {
    state.reason =
      'admin_required';
    return state;
  }

  if (
    typeof getIntegrationStatusById_ !==
    'function'
  ) {
    state.reason =
      'integration_unavailable';
    return state;
  }

  try {
    const status =
      getIntegrationStatusById_(
        'uptimerobot'
      );

    state.enabled =
      !!(
        status.enabled &&
        status.configurationComplete
      );

    state.reason =
      state.enabled
        ? 'enabled'
        : (
            !status.enabled
              ? 'disabled'
              : 'not_configured'
          );

  } catch (error) {
    state.reason =
      'status_unavailable';
  }

  return state;
}


function getAppBootstrap() {

  return withPerformanceTiming_(
    'getAppBootstrap',
    function() {

      const access =
        getUserAccess_(
          getCurrentUserEmail_()
        );

      return buildAppBootstrap_(
        access,
        AppConfig.getClientConfig_()
      );

    }
  );
}






/*******************************************************
 * PAGE ROUTER
 *******************************************************/

function appGetPageData(pageKey, forceRefresh) {
  const config = APP_PAGE_CONFIG[pageKey];
  if (!config) throw new Error('Unknown application page.');
  const previousContext = APP_READ_CONTEXT;
  const context = { pageKey: pageKey, started: Date.now(), timings: {}, sheetReads: 0 };
  APP_READ_CONTEXT = context;
  try {
    const access = requirePagePermission_(pageKey, 'view');
    context.permission = access.admin ? 'edit' : access.permissions[pageKey];
    const loaders = {
      dashboard: getAppDashboardData_, workflow: getDepartmentWorkflowData_,
      internetWan: getInternetWanPageData_, outages: getOutagesPageData_,
      uptimeRobot: getUptimeRobotPageData_, users: getAppUsers_, settings: getSettingsPageData_
    };
    const result = measureAppReadStep_('pageData', function() {
      if (loaders[pageKey]) return loaders[pageKey](!!forceRefresh);
      if (config.type === 'structured') return getStructuredPageData_(pageKey, !!forceRefresh);
      return getAppTableData_(pageKey, !!forceRefresh);
    });
    // Shared row caches never determine the caller's permission.
    const output = Object.assign({}, result, { permission: context.permission });
    output.performance = finishAppReadPerformance_(context, 'success');
    return output;
  } catch (error) {
    finishAppReadPerformance_(context, 'error');
    throw error;
  } finally {
    APP_READ_CONTEXT = previousContext;
  }
}


/*******************************************************
 * CREDENTIAL DETECTION
 *******************************************************/

function normalizeSensitiveHeader_(header) {

  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, '');

}


function isUsernameHeader_(header) {

  return APP_USERNAME_HEADERS.has(
    normalizeSensitiveHeader_(header)
  );

}


function isPasswordHeader_(header) {

  return APP_PASSWORD_HEADERS.has(
    normalizeSensitiveHeader_(header)
  );

}


/*
 * A credential is something we actually restrict.
 *
 * Usernames are intentionally NOT credentials here.
 */
function isCredentialHeader_(header) {

  return isPasswordHeader_(header);

}


function sanitizeHeaders_(headers) {

  return headers.filter(
    header => !isCredentialHeader_(header)
  );
}


/*******************************************************
 * SHEET READ HELPERS
 *******************************************************/

function getNetworkDashboardReadColumnCount_(
  sheetName,
  fallback,
  includeSheetWidth
) {

  let definition = null;

  try {

    definition =
      getNetworkDashboardSchema_()[sheetName];

  } catch (error) {
    definition = null;
  }


  let schemaWidth =
    0;


  if (
    definition &&
    definition.headers
  ) {
    schemaWidth =
      definition.headers.length;
  }


  if (
    definition &&
    definition.headerRanges
  ) {

    definition.headerRanges
      .forEach(range => {

        schemaWidth =
          Math.max(
            schemaWidth,
            Number(range.column || 1) +
              (range.headers || []).length -
              1
          );

      });

  }


  if (
    schemaWidth &&
    !includeSheetWidth
  ) {
    return Math.max(
      schemaWidth,
      1
    );
  }


  return Math.max(
    schemaWidth,
    Number(fallback || 0),
    1
  );
}






function readAppSheetDisplayValues_(
  sheet,
  columnCount,
  minimumRows
) {

  if (!sheet) {
    return [];
  }


  const rows =
    Math.max(
      sheet.getLastRow(),
      Number(minimumRows || 1),
      1
    );

  const columns =
    Math.max(
      Number(columnCount || sheet.getLastColumn() || 1),
      1
    );


  return sheet
    .getRange(
      1,
      1,
      rows,
      columns
    )
    .getDisplayValues();
}


function readNetworkDashboardSheetValues_(
  ss,
  sheetName,
  minimumRows
) {

  const sheet =
    ss.getSheetByName(
      sheetName
    );


  if (!sheet) {
    return [];
  }


  return readAppSheetDisplayValues_(
    sheet,
    getNetworkDashboardReadColumnCount_(
      sheetName,
      1,
      false
    ),
    minimumRows
  );
}


function readConfiguredPageValues_(sheet, config) {
  // Display values preserve formulas, dates, IPs and leading zeros.
  // Actual headers retain installation-specific extra columns.
  return readSheetDisplayBatch_(sheet);
}


/*******************************************************
 * GENERIC TABLE
 *******************************************************/

function getAppTableData_(
  pageKey,
  forceRefresh
) {

  const config =
    APP_PAGE_CONFIG[pageKey];


  if (!config) {
    throw new Error(
      'Unknown application page.'
    );
  }


  /*
   * Servers is a combined logical page backed by
   * two physical Google Sheet tabs.
   */
  if (
    pageKey === 'servers' &&
    config.combinedServerPage
  ) {

    return getCombinedServersData_(
      pageKey,
      config,
      forceRefresh
    );

  }


  const cache =
    CacheService.getScriptCache();


  if (APP_READ_CONTEXT) APP_READ_CONTEXT.dataCache = 'miss';
  const cacheKey =
    'app_page_' + pageKey;


  if (!forceRefresh) {

    const cached =
      measureAppReadStep_('cacheRead', function() { return cache.get(cacheKey); });


    if (cached) {
      if (APP_READ_CONTEXT) APP_READ_CONTEXT.dataCache = 'hit';

      try {

        return prepareTableDataForAccess_(
          JSON.parse(
            cached
          ),
          pageKey,
          config
        );

      } catch (error) {}

    }

  }


  const sheet =
    getReadSheet_(config.sheet);


  if (!sheet) {

    return emptyTableResult_(
      pageKey,
      config
    );

  }


  const values =
    readConfiguredPageValues_(
      sheet,
      config
    );


  if (!values.length) {

    return emptyTableResult_(
      pageKey,
      config
    );

  }


  const schemaStarted = Date.now();
  const rawHeaders =
    values[0]
      .map(
        value =>
          String(value || '').trim()
      );


  const columns =
    [];

  const credentialColumns =
    [];


  rawHeaders.forEach(
    (header, index) => {

      if (!header) {
        return;
      }

      if (
        isCredentialHeader_(header)
      ) {

        credentialColumns.push({
          header:
            header,
          field:
            isPasswordHeader_(header)
              ? 'Password'
              : header,
          sourceIndex:
            index
        });

        return;

      }

        columns.push({
          header: header,
          sourceIndex: index
        });

    }
  );


  const headers =
    columns.map(
      column =>
        column.header
    );


  if (APP_READ_CONTEXT) APP_READ_CONTEXT.timings.schema = Date.now() - schemaStarted;
  const transformStarted = Date.now();
  const rows = [];


  for (
    let rowIndex = 1;
    rowIndex < values.length;
    rowIndex++
  ) {

    const sourceRow =
      values[rowIndex];


    if (
      !rowHasMeaningfulData_(
        sourceRow,
        rawHeaders
      )
    ) {
      continue;
    }


    const row = {

      _row:
        rowIndex + 1,

      _sourceSheet:
        config.sheet

    };


    let hasData =
      false;


    columns.forEach(
      column => {

        const value =
          String(
            sourceRow[
              column.sourceIndex
            ] || ''
          );


        row[
          column.header
        ] =
          value;


        if (
          value.trim()
        ) {

          hasData =
            true;

        }

      }
    );


    if (!hasData) {
      continue;
    }


    const firstValue =
      String(
        sourceRow[0] || ''
      )
        .trim()
        .toLowerCase();


    if (
      firstValue.includes(
        'color legend'
      ) ||
      firstValue.startsWith(
        'count ='
      )
    ) {
      continue;
    }


    rows.push(
      row
    );

  }


  if (APP_READ_CONTEXT) APP_READ_CONTEXT.timings.transform = Date.now() - transformStarted;
  let defaultColumns =
    config.defaultColumns ||
    headers.slice(0, 8);


  defaultColumns =
    defaultColumns.filter(
      header =>
        headers.includes(header)
    );


  const result = {

    pageKey:
      pageKey,

    type:
      'table',

    label:
      config.label,

    sheetName:
      config.sheet,

    headers:
      headers,

    rows:
      rows,

    totalCount:
      rows.length,

    defaultColumns:
      defaultColumns,

    controlledOptions:
      getControlledOptionsForSheet_(
        config.sheet
      ),

    centralSync:
      !!config.centralSync,

    permission:
      '',

    hasCredentials:
      credentialColumns.length > 0,

    credentialColumns:
      credentialColumns.map(
        column => ({
          header:
            column.header,
          field:
            column.field
        })
      )

  };


  cacheJson_(
    cacheKey,
    result,
    300
  );


  return prepareTableDataForAccess_(
    result,
    pageKey,
    config
  );
}


function getCombinedServersData_(
  pageKey,
  config,
  forceRefresh
) {

  const cache =
    CacheService.getScriptCache();


  const cacheKey =
    'app_page_' + pageKey;


  if (!forceRefresh) {

    const cached =
      cache.get(
        cacheKey
      );


    if (cached) {

      try {

        return prepareTableDataForAccess_(
          JSON.parse(
            cached
          ),
          pageKey,
          config
        );

      } catch (error) {}

    }

  }


  const activeSheet = getReadSheet_(config.sheet);
  const offlineSheet = getReadSheet_(config.offlineSheet);
  const activeData =
    readServerSourceSheet_(
      activeSheet,
      'active'
    );


  const offlineData =
    readServerSourceSheet_(
      offlineSheet,
      'offline'
    );


  /*
   * Build a union of both sheet schemas.
   *
   * The Servers sheet gets first priority for column
   * order. Columns that exist only on Offline Servers
   * are appended afterward.
   */
  const headers =
    [];


  activeData.headers.forEach(
    header => {

      if (
        !headers.includes(
          header
        )
      ) {

        headers.push(
          header
        );

      }

    }
  );


  offlineData.headers.forEach(
    header => {

      if (
        !headers.includes(
          header
        )
      ) {

        headers.push(
          header
        );

      }

    }
  );


  const rows = [
    ...activeData.rows,
    ...offlineData.rows
  ];


  /*
   * Normalize every record against the union schema.
   *
   * This allows a column to exist on Servers but not
   * Offline Servers, or vice versa.
   */
  rows.forEach(
    row => {

      headers.forEach(
        header => {

          if (
            !Object.prototype
              .hasOwnProperty
              .call(
                row,
                header
              )
          ) {

            row[header] =
              '';

          }

        }
      );

    }
  );


  let defaultColumns =
    config.defaultColumns ||
    headers.slice(
      0,
      8
    );


  defaultColumns =
    defaultColumns.filter(
      header =>
        headers.includes(
          header
        )
    );


  const activeCount =
    activeData.rows.length;


  const offlineCount =
    offlineData.rows.length;


  const result = {

    pageKey:
      pageKey,

    type:
      'table',

    label:
      config.label,

    sheetName:
      config.sheet,

    headers:
      headers,

    rows:
      rows,

    totalCount:
      rows.length,

    defaultColumns:
      defaultColumns,

    centralSync:
      false,

    permission:
      '',

    hasCredentials:
      activeData.hasCredentials ||
      offlineData.hasCredentials,

    credentialColumns:
      mergeTableCredentialColumns_(
        activeData.credentialColumns,
        offlineData.credentialColumns
      ),

    serverViews: {

      active:
        activeCount,

      offline:
        offlineCount,

      all:
        activeCount +
        offlineCount

    }

  };


  cacheJson_(
    cacheKey,
    result,
    300
  );


  return prepareTableDataForAccess_(
    result,
    pageKey,
    config
  );
}

function readServerSourceSheet_(
  sheet,
  serverView
) {

  if (!sheet) {

    return {
      headers: [],
      rows: [],
      hasCredentials: false
    };

  }


  const sourceName = sheet.getName();
  const values = readSheetDisplayBatch_(sheet);

  if (!values.length) {

    return {
      headers: [],
      rows: [],
      hasCredentials: false
    };

  }


  const rawHeaders =
    values[0]
      .map(
        value =>
          String(value || '').trim()
      );


  const columns =
    [];

  const credentialColumns =
    [];


  rawHeaders.forEach(
    (header, index) => {

      if (!header) {
        return;
      }

      if (
        isCredentialHeader_(
          header
        )
      ) {

        credentialColumns.push({

          header:
            header,

          field:
            isPasswordHeader_(
              header
            )
              ? 'Password'
              : header,

          sourceIndex:
            index

        });

        return;

      }

        columns.push({

          header:
            header,

          sourceIndex:
            index

        });

    }
  );


  const headers =
    columns.map(
      column =>
        column.header
    );


  const rows =
    [];


  for (
    let rowIndex = 1;
    rowIndex < values.length;
    rowIndex++
  ) {

    const sourceRow =
      values[
        rowIndex
      ];


    if (
      !rowHasMeaningfulData_(
        sourceRow,
        rawHeaders
      )
    ) {

      continue;

    }


    const firstValue =
      String(
        sourceRow[0] || ''
      )
        .trim();


    const normalizedFirst =
      firstValue
        .toLowerCase();


    if (
      !firstValue ||
      normalizedFirst.includes(
        'color legend'
      ) ||
      normalizedFirst.startsWith(
        'count ='
      )
    ) {

      continue;

    }


    const row = {

      /*
       * Physical row on the source sheet.
       */
      _row:
        rowIndex + 1,

      /*
       * Critical for Edit/Delete.
       */
      _sourceSheet: sourceName,

      /*
       * Used only by the Servers UI filter.
       */
      _serverView:
        serverView

    };


    let hasData =
      false;


    columns.forEach(
      column => {

        const value =
          String(
            sourceRow[
              column.sourceIndex
            ] || ''
          );


        row[
          column.header
        ] =
          value;


        if (
          value.trim()
        ) {

          hasData =
            true;

        }

      }
    );


    if (
      hasData
    ) {

      rows.push(
        row
      );

    }

  }


  return {

    headers:
      headers,

    rows:
      rows,

    hasCredentials:
      credentialColumns.length > 0,

    credentialColumns:
      credentialColumns.map(
        column => ({
          header:
            column.header,
          field:
            column.field
        })
      )

  };
}


function mergeTableCredentialColumns_() {

  const seen = {};

  const merged = [];

  Array.prototype
    .slice
    .call(arguments)
    .forEach(list => {

      (list || [])
        .forEach(column => {

          const field =
            String(
              column && column.field || ''
            ).trim();

          if (
            !field ||
            seen[field]
          ) {
            return;
          }

          seen[field] =
            true;

          merged.push({
            header:
              column.header || field,
            field:
              field
          });

        });

    });

  return merged;
}


function prepareTableDataForAccess_(
  result,
  pageKey,
  config
) {

  const sensitiveStarted = Date.now();
  result =
    result || {};

  config =
    config || APP_PAGE_CONFIG[pageKey] || {};

  const permission =
    getPagePermission_(
      pageKey
    );

  const integrationState = pageKey === 'servers' ? readIntegrationStateMap_(false) : {};
  const availableHeader = header => isManagedPageHeader_(pageKey, header) &&
    (pageKey !== 'servers' ||
      (!/threatdown/i.test(header) || !!(integrationState.threatdown || {}).enabled) &&
      (!/wazuh/i.test(header) || !!(integrationState.wazuh || {}).enabled));
  const safeHeaders =
    (result.headers || []).filter(availableHeader)
      .filter(header =>
        header &&
        !isCredentialHeader_(
          header
        )
      );

  const safeDefaultColumns =
    (result.defaultColumns || [])
      .filter(header =>
        safeHeaders.includes(
          header
        )
      );

  const output =
    Object.assign(
      {},
      result,
      {
        headers:
          safeHeaders.slice(),
        defaultColumns:
          safeDefaultColumns,
        permission:
          permission,
        rows: (result.rows || []).map(row => {
          const clean = {};
          Object.keys(row).forEach(key => {
            if (key[0] === '_' || safeHeaders.includes(key)) clean[key] = row[key];
          });
          if (pageKey === 'switches') {
            clean.Role = normalizeArubaSwitchRole_(clean.Role);
            clean['Stack Info'] = normalizeArubaStackInfo_(clean['Stack Info']);
          }
          return clean;
        })
      }
    );

  const credentialColumns =
    result.credentialColumns || [];

  credentialColumns.forEach(column => {

    const field =
      String(
        column.field || column.header || ''
      ).trim();

    if (
      !field ||
      output.headers.includes(
        field
      )
    ) {
      return;
    }

    const usernameIndex =
      output.headers.findIndex(
        isUsernameHeader_
      );

    if (usernameIndex >= 0) {
      output.headers.splice(
        usernameIndex + 1,
        0,
        field
      );
    } else {
      output.headers.push(
        field
      );
    }

  });

  output.defaultColumns =
    (
      config.defaultColumns ||
      output.defaultColumns ||
      []
    ).filter(header =>
      output.headers.includes(
        header
      )
    );

  if (APP_READ_CONTEXT) APP_READ_CONTEXT.timings.sensitive = Date.now() - sensitiveStarted;
  return output;
}


function emptyTableResult_(
  pageKey,
  config
) {

  return {
    pageKey: pageKey,
    type: 'table',
    label: config.label,
    sheetName: config.sheet,
    headers: [],
    rows: [],
    totalCount: 0,
    defaultColumns: [],
    controlledOptions:
      getControlledOptionsForSheet_(
        config.sheet
      ),
    centralSync:
      !!config.centralSync,
    permission:
      getPagePermission_(pageKey),
    hasCredentials: false
  };
}


/*******************************************************
 * STRUCTURED PAGES
 *******************************************************/

function getStructuredPageData_(
  pageKey,
  forceRefresh
) {

  const config =
    APP_PAGE_CONFIG[pageKey];


  const cache =
    CacheService.getScriptCache();


  const cacheKey =
    'app_structured_' + pageKey;


  if (!forceRefresh) {

    const cached =
      cache.get(cacheKey);

    if (cached) {

      try {
        return JSON.parse(cached);
      } catch (error) {}

    }

  }


  const sheet =
    getReadSheet_(config.sheet);


  if (!sheet) {
    throw new Error(
      'Sheet not found: ' + config.sheet
    );
  }


  /*
   * ONE read for the entire sheet.
   *
   * This is considerably faster than making separate
   * Spreadsheet service calls for every section.
   */
  const values =
    readConfiguredPageValues_(
      sheet,
      config
    );


  const sections =
    (config.sections || [])
      .map(section => {

        if (section.type === 'metadata') {

          return parseMetadataSection_(
            values,
            section
          );

        }


        if (section.type === 'table') {

          return parseStructuredTable_(
            values,
            section
          );

        }


        return null;

      })
      .filter(Boolean);


  const result = {

    pageKey: pageKey,

    type: 'structured',

    label: config.label,

    sheetName: config.sheet,

    permission:
      '',

    controlledOptions:
      getControlledOptionsForSheet_(
        config.sheet
      ),

    sections: sections

  };


  cacheJson_(
    cacheKey,
    result,
    300
  );


  return result;
}


function parseStructuredTable_(
  values,
  section
) {

  const headerIndex =
    Number(section.headerRow) - 1;


  if (
    headerIndex < 0 ||
    headerIndex >= values.length
  ) {

    return {
      key: section.key,
      type: 'table',
      title: section.title,
      subtitle: section.subtitle || '',
      columns: [],
      headers: [],
      rows: [],
      totalCount: 0,
      defaultColumns: [],
      defaultColumnTitles: [],
      hasCredentials: false
    };

  }


  const startColumn =
    Math.max(
      0,
      Number(section.startColumn || 1) - 1
    );


  const configuredEndColumn =
    section.endColumn
      ? Number(section.endColumn)
      : values[headerIndex].length;


  const endColumn =
    Math.min(
      configuredEndColumn,
      values[headerIndex].length
    );


  /*
   * Read the physical headers from this section.
   */
  const sourceHeaders =
    values[headerIndex]
      .slice(
        startColumn,
        endColumn
      )
      .map(
        value =>
          String(value || '').trim()
      );


  /*
   * Build unique internal fields.
   *
   * We DO NOT use the header text as the data key.
   *
   * This allows:
   *
   * Notes | Notes
   *
   * or any other duplicate display header to exist
   * without the columns overwriting each other.
   *
   * Password/secret columns are intentionally excluded
   * from the normal payload.
   */
  const columns =
    [];


  sourceHeaders.forEach(
    (header, localIndex) => {

      if (!header || /^Legacy: /i.test(header)) {
        return;
      }


      if (
        isCredentialHeader_(
          header
        )
      ) {
        return;
      }


      const sourceIndex =
        startColumn +
        localIndex;


      columns.push({

        title:
          header,

        field:
          '__col_' +
          (sourceIndex + 1),

        sourceIndex:
          sourceIndex

      });

    }
  );


  const endRow =
    section.endRow
      ? Math.min(
          Number(section.endRow),
          values.length
        )
      : values.length;


  const rows =
    [];


  for (
    let rowIndex =
      headerIndex + 1;

    rowIndex < endRow;

    rowIndex++
  ) {

    const sourceRow =
      values[rowIndex] || [];


    /*
     * Check the complete physical section row,
     * including protected columns, to determine
     * whether this is actually a populated record.
     */
    const meaningfulRow =
      sourceRow.slice(
        startColumn,
        endColumn
      );


    if (
      !rowHasMeaningfulData_(
        meaningfulRow,
        sourceHeaders
      )
    ) {
      continue;
    }


    const row = {

      _row:
        rowIndex + 1,

      _section:
        section.key

    };


    let hasNormalData =
      false;


    columns.forEach(
      column => {

        const value =
          String(
            sourceRow[
              column.sourceIndex
            ] || ''
          );


        row[
          column.field
        ] =
          value;


        if (
          value.trim()
        ) {

          hasNormalData =
            true;

        }

      }
    );


    /*
     * Normally there will be at least one ordinary
     * value on the row.
     *
     * If not, don't send a blank-looking record.
     */
    if (
      !hasNormalData
    ) {
      continue;
    }


    rows.push(
      row
    );

  }


  /*
   * section.defaultColumns contains HUMAN-READABLE
   * configured titles:
   *
   * Site
   * IP
   * User
   * Password
   * Server Location
   * Notes
   *
   * Convert normal columns to their unique internal
   * fields for Tabulator visibility.
   *
   * Password is virtual and therefore intentionally
   * does not have a __col_X field here.
   */
  const configuredDefaults =
    new Set(
      section.defaultColumns || []
    );


  const defaultFields =
    columns
      .filter(
        column =>
          configuredDefaults.size === 0 ||
          configuredDefaults.has(
            column.title
          )
      )
      .map(
        column =>
          column.field
      );


  const hasCredentials =
    sourceHeaders.some(
      header =>
        isCredentialHeader_(
          header
        )
    );


  return {

    key:
      section.key,

    type:
      'table',

    title:
      section.title,

    subtitle:
      section.subtitle || '',


    /*
     * Authoritative physical column definitions.
     */
    columns:
      columns.map(
        column => ({

          title:
            column.title,

          field:
            column.field,

          sourceIndex:
            column.sourceIndex

        })
      ),


    /*
     * Retained for compatibility with edit-related
     * code that may still need display headers.
     */
    headers:
      columns.map(
        column =>
          column.title
      ),


    rows:
      rows,

    totalCount:
      rows.length,


    /*
     * Internal Tabulator fields.
     */
    defaultColumns:
      defaultFields,


    /*
     * Human-readable configured defaults.
     *
     * This is especially important for virtual
     * Password because Password has no normal
     * __col_X field.
     */
    defaultColumnTitles:
      Array.from(
        configuredDefaults
      ),


    hasCredentials:
      hasCredentials

  };

}


function parseMetadataSection_(
  values,
  section
) {

  const startRow =
    Math.max(
      0,
      Number(section.startRow || 1) - 1
    );


  const endRow =
    Math.min(
      Number(section.endRow || values.length),
      values.length
    );


  const startColumn =
    Math.max(
      0,
      Number(section.startColumn || 1) - 1
    );


  const endColumn =
    section.endColumn
      ? Number(section.endColumn)
      : (
          values[0]
            ? values[0].length
            : 0
        );


  const items = [];

  let hasCredentials = false;


  for (
    let rowIndex = startRow;
    rowIndex < endRow;
    rowIndex++
  ) {

    const row =
      values[rowIndex] || [];


    /*
     * Metadata often looks like:
     *
     * Label | Value | Label | Value
     *
     * This processes each pair.
     */
    for (
      let columnIndex = startColumn;
      columnIndex < endColumn;
      columnIndex += 2
    ) {

      const label =
        String(
          row[columnIndex] || ''
        ).trim();


      const value =
        String(
          row[columnIndex + 1] || ''
        ).trim();


      if (!label) {
        continue;
      }


      if (isCredentialHeader_(label)) {

        hasCredentials = true;

        /*
         * IMPORTANT:
         * Do not send credential value.
         */
        continue;

      }


      /*
       * Ignore obvious blank/meta decoration.
       */
      if (
        !value &&
        label.length > 60
      ) {
        continue;
      }


      items.push({
        label: label,
        value: value
      });

    }

  }


  return {

    key: section.key,

    type: 'metadata',

    title: section.title,

    subtitle:
      section.subtitle || '',

    items: items,

    hasCredentials:
      hasCredentials

  };
}


/*******************************************************
 * CREDENTIAL RETRIEVAL
 *******************************************************/

function appGetCredentials(
  pageKey,
  sectionKey
) {

  /*
   * THIS IS THE SECURITY BOUNDARY.
   *
   * View-only users cannot call this successfully.
   */
  requirePagePermission_(
    pageKey,
    'edit'
  );


  const config =
    APP_PAGE_CONFIG[pageKey];


  if (!config) {
    throw new Error(
      'Unknown page.'
    );
  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(config.sheet);


  if (!sheet) {
    throw new Error(
      'Sheet not found.'
    );
  }


  const values =
    readConfiguredPageValues_(
      sheet,
      config
    );


  /*
   * Structured page credentials.
   */
  if (config.type === 'structured') {

    const section =
      (config.sections || [])
        .find(item =>
          item.key === sectionKey
        );


    if (!section) {
      throw new Error(
        'Unknown page section.'
      );
    }


    if (section.type === 'metadata') {

      return getMetadataCredentials_(
        values,
        section
      );

    }


    if (section.type === 'table') {

      return getTableCredentials_(
        values,
        section
      );

    }

  }


  /*
   * Generic table credentials.
   */
  if (config.type === 'table') {

    return getTableCredentials_(
      values,
      {
        key: 'main',
        headerRow: 1,
        startColumn: 1
      }
    );

  }


  return [];
}

function appGetRowCredential(
  pageKey,
  sectionKey,
  rowNumber,
  fieldName
) {

  /*
   * THIS is the security boundary.
   *
   * Never rely on the browser to decide whether
   * somebody can retrieve a password.
   */
  requirePagePermission_(
    pageKey,
    'edit'
  );


  const config =
    APP_PAGE_CONFIG[
      pageKey
    ];


  if (!config) {
    throw new Error(
      'Unknown page.'
    );
  }


  const requestedRow =
    Number(rowNumber);


  if (
    !Number.isInteger(requestedRow) ||
    requestedRow < 1
  ) {

    throw new Error(
      'Invalid spreadsheet row.'
    );

  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        config.sheet
      );


  if (!sheet) {

    throw new Error(
      'Sheet not found: ' +
      config.sheet
    );

  }


  /*
   * Structured page.
   */
  if (
    config.type === 'structured'
  ) {

    const section =
      (config.sections || [])
        .find(
          item =>
            item.key === sectionKey
        );


    if (
      !section ||
      section.type !== 'table'
    ) {

      throw new Error(
        'Invalid credential section.'
      );

    }


    const headerRow =
      Number(
        section.headerRow || 1
      );


    const startColumn =
      Number(
        section.startColumn || 1
      );


    const endColumn =
      section.endColumn
        ? Number(section.endColumn)
        : sheet.getLastColumn();


    if (
      requestedRow <= headerRow ||
      (
        section.endRow &&
        requestedRow >
          Number(section.endRow)
      )
    ) {

      throw new Error(
        'Requested row is outside this section.'
      );

    }


    const headers =
      sheet
        .getRange(
          headerRow,
          startColumn,
          1,
          endColumn -
            startColumn +
            1
        )
        .getDisplayValues()[0]
        .map(
          value =>
            String(value || '').trim()
        );


    const requestedNormalized =
      normalizeSensitiveHeader_(
        fieldName
      );


    let relativeColumn =
      -1;


    for (
      let index = 0;
      index < headers.length;
      index++
    ) {

      if (
        normalizeSensitiveHeader_(
          headers[index]
        ) === requestedNormalized
      ) {

        relativeColumn =
          index;

        break;

      }

    }


    if (relativeColumn < 0) {

      /*
       * The UI uses "Password" as the normalized
       * display name. If the sheet actually calls
       * it PW, Pass, Pword, etc., find the first
       * password-classified field.
       */
      if (
        isPasswordHeader_(
          fieldName
        )
      ) {

        relativeColumn =
          headers.findIndex(
            header =>
              isPasswordHeader_(
                header
              )
          );

      }

    }


    if (relativeColumn < 0) {

      throw new Error(
        'Credential field not found.'
      );

    }


    const actualHeader =
      headers[
        relativeColumn
      ];


    if (
      !isPasswordHeader_(
        actualHeader
      )
    ) {

      throw new Error(
        'Requested field is not a restricted credential.'
      );

    }


    const actualColumn =
      startColumn +
      relativeColumn;


    return {

      row:
        requestedRow,

      field:
        'Password',

      value:
        sheet
          .getRange(
            requestedRow,
            actualColumn
          )
          .getDisplayValue()

    };

  }


  /*
   * Standard table page.
   */
  const headerRow =
    Number(
      config.headerRow || 1
    );


  const startColumn =
    Number(
      config.startColumn || 1
    );


  const endColumn =
    config.endColumn
      ? Number(config.endColumn)
      : sheet.getLastColumn();

  if (
    requestedRow <= headerRow ||
    requestedRow > sheet.getLastRow()
  ) {

    throw new Error(
      'Requested row is outside this table.'
    );

  }


  const headers =
    sheet
      .getRange(
        headerRow,
        startColumn,
        1,
        endColumn -
          startColumn +
          1
      )
      .getDisplayValues()[0]
      .map(
        value =>
          String(value || '').trim()
      );

  if (
    !isPasswordHeader_(
      fieldName
    )
  ) {

    throw new Error(
      'Requested field is not a restricted credential.'
    );

  }


  const relativeColumn =
    headers.findIndex(
      header =>
        isPasswordHeader_(
          header
        )
    );


  if (relativeColumn < 0) {

    throw new Error(
      'Password field not found.'
    );

  }


  return {

    row:
      requestedRow,

    field:
      'Password',

    value:
      sheet
        .getRange(
          requestedRow,
          startColumn +
            relativeColumn
        )
        .getDisplayValue()

  };
}


function getMetadataCredentials_(
  values,
  section
) {

  const credentials = [];


  const startRow =
    Math.max(
      0,
      Number(section.startRow || 1) - 1
    );


  const endRow =
    Math.min(
      Number(section.endRow || values.length),
      values.length
    );


  const startColumn =
    Math.max(
      0,
      Number(section.startColumn || 1) - 1
    );


  const endColumn =
    section.endColumn
      ? Number(section.endColumn)
      : (
          values[0]
            ? values[0].length
            : 0
        );


  for (
    let rowIndex = startRow;
    rowIndex < endRow;
    rowIndex++
  ) {

    const row =
      values[rowIndex] || [];


    for (
      let columnIndex = startColumn;
      columnIndex < endColumn;
      columnIndex += 2
    ) {

      const label =
        String(
          row[columnIndex] || ''
        ).trim();


      const value =
        String(
          row[columnIndex + 1] || ''
        ).trim();


      if (
        label &&
        isCredentialHeader_(label)
      ) {

        credentials.push({
          label: label,
          value: value,
          row: rowIndex + 1
        });

      }

    }

  }


  return credentials;
}


function getTableCredentials_(
  values,
  section
) {

  const headerIndex =
    Number(section.headerRow || 1) - 1;

  if (
    headerIndex < 0 ||
    headerIndex >= values.length
  ) {
    return {
      headers: [],
      rows: []
    };
  }


  const startColumn =
    Math.max(
      0,
      Number(section.startColumn || 1) - 1
    );


  const endColumn =
    section.endColumn
      ? Number(section.endColumn)
      : values[headerIndex].length;


  const headers =
    values[headerIndex]
      .slice(
        startColumn,
        endColumn
      )
      .map(value =>
        String(value || '').trim()
      );


  const credentialColumns = [];


  headers.forEach(
    (header, index) => {

      if (isCredentialHeader_(header)) {

        credentialColumns.push({
          header: header,
          sourceIndex:
            startColumn + index
        });

      }

    }
  );


  const endRow =
    section.endRow
      ? Math.min(
          Number(section.endRow),
          values.length
        )
      : values.length;


  const rows = [];


  for (
    let rowIndex =
      headerIndex + 1;

    rowIndex < endRow;

    rowIndex++
  ) {

    const sourceRow =
      values[rowIndex] || [];


    const record = {
      _row: rowIndex + 1
    };


    let hasCredential = false;


    credentialColumns.forEach(
      column => {

        const value =
          String(
            sourceRow[column.sourceIndex] || ''
          ).trim();


        record[column.header] =
          value;


        if (value) {
          hasCredential = true;
        }

      }
    );


    if (hasCredential) {
      rows.push(record);
    }

  }


  return {

    headers:
      credentialColumns.map(
        column => column.header
      ),

    rows: rows

  };
}


/*******************************************************
 * DASHBOARD
 *******************************************************/

function getAppDashboardData_(
  forceRefresh
) {

  return withPerformanceTiming_(
    'getAppDashboardData',
    function() {

  const sheet = getReadSheet_('Dashboard');

  const result =
    sheet
      ? buildDashboardDataFromSheet_(
          sheet
        )
      : getEmptyDashboardData_();


  return result;

    }
  );
}


function buildDashboardDataFromSheet_(
  sheet
) {

  const values = readSheetDisplayBatch_(sheet);

  const metricMap =
    readDashboardMetricMap_(
      values
    );

  const data = {
    metrics:
      buildDashboardLegacyMetricMap_(
        metricMap
      ),
    metricCards:
      buildDashboardMetricCards_(
        metricMap
      ),
    switchStatus:
      readDashboardSummarySection_(
        values,
        'switchStatus'
      ),
    apStatus:
      readDashboardSummarySection_(
        values,
        'apStatus'
      ),
    campusDistribution:
      readDashboardSummarySection_(
        values,
        'campusDistribution'
      ),
    wanStatus:
      readDashboardSummarySection_(
        values,
        'wanStatus'
      ),
    workflow: {
      groups:
        getDashboardMetricNumber_(
          metricMap,
          'workflow.groups'
        ),
      tiers:
        getDashboardMetricNumber_(
          metricMap,
          'workflow.tiers'
        ),
      ticketSteps:
        getDashboardMetricNumber_(
          metricMap,
          'workflow.ticket_steps'
        ),
      priorities: 0,
      workflows:
        getDashboardMetricNumber_(
          metricMap,
          'workflow.workflows'
        )
    }
  };

  return finalizeDashboardData_(
    data,
    metricMap
  );
}


function getEmptyDashboardData_() {

  const data = {
    metrics: {},
    metricCards: [],
    switchStatus: {},
    apStatus: {},
    campusDistribution: {},
    wanStatus: {},
    workflow: {
      groups: 0,
      tiers: 0,
      ticketSteps: 0,
      priorities: 0,
      workflows: 0
    }
  };

  return finalizeDashboardData_(
    data,
    {}
  );
}


function finalizeDashboardData_(
  data,
  metricMap
) {

  data.outages =
    typeof buildDashboardOutageData_ === 'function'
      ? buildDashboardOutageData_()
      : {
          summary: {
            active: 0,
            last30Days: 0,
            durationLast30Minutes: 0,
            durationLast30Label: '0m'
          },
          lastUpdated: ''
        };

  data.uptimeRobot =
    buildDashboardUptimeRobotData_();

  data.availableWidgets =
    getDashboardAvailableWidgets_();

  data.widgetConfig =
    getDashboardWidgetConfiguration_(
      data.availableWidgets
    );

  data.widgets =
    hydrateDashboardWidgets_(
      data.availableWidgets,
      data.widgetConfig,
      data,
      metricMap || {}
    );

  data.canCustomize =
    canCustomizeDashboard_();

  return data;
}


function getDashboardWidgetRegistry_() {

  return [
    {
      id: 'switches.total',
      display: 'Switches',
      description: 'Total switch inventory records.',
      category: 'Infrastructure',
      type: 'kpi',
      dataSource: 'Dashboard sheet metric switches.total',
      metricKey: 'switches.total',
      requiredModule: 'switches',
      defaultEnabled: true,
      defaultOrder: 10,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-network-wired'
    },
    {
      id: 'access_points.total',
      display: 'Access Points',
      description: 'Total access point inventory records.',
      category: 'Infrastructure',
      type: 'kpi',
      dataSource: 'Dashboard sheet metric access_points.total',
      metricKey: 'access_points.total',
      requiredModule: 'accessPoints',
      defaultEnabled: true,
      defaultOrder: 20,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-wifi'
    },
    {
      id: 'servers.total',
      display: 'Servers',
      description: 'Total active server records.',
      category: 'Infrastructure',
      type: 'kpi',
      dataSource: 'Dashboard sheet metric servers.total',
      metricKey: 'servers.total',
      requiredModule: 'servers',
      defaultEnabled: true,
      defaultOrder: 30,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-server'
    },
    {
      id: 'internet_wan.total',
      display: 'WAN Circuits',
      description: 'Total Internet/WAN circuit records.',
      category: 'Infrastructure',
      type: 'kpi',
      dataSource: 'Dashboard sheet metric internet_wan.total',
      metricKey: 'internet_wan.total',
      requiredModule: 'internetWan',
      defaultEnabled: true,
      defaultOrder: 40,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-globe'
    },
    {
      id: 'uptimerobot.total',
      display: 'UR Monitors',
      description: 'Total synchronized UptimeRobot monitors.',
      category: 'Monitoring',
      type: 'kpi',
      dataSource: 'UptimeRobot sheet',
      dataPath: 'uptimeRobot.summary.total',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: true,
      defaultOrder: 50,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-heart-pulse'
    },
    {
      id: 'uptimerobot.online',
      display: 'UR Online',
      description: 'Synchronized UptimeRobot monitors with Online health.',
      category: 'Monitoring',
      type: 'kpi',
      dataSource: 'UptimeRobot sheet',
      dataPath: 'uptimeRobot.summary.online',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: true,
      defaultOrder: 51,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-circle-check'
    },
    {
      id: 'uptimerobot.down',
      display: 'UR Down',
      description: 'Synchronized UptimeRobot monitors with Down health.',
      category: 'Monitoring',
      type: 'kpi',
      dataSource: 'UptimeRobot sheet',
      dataPath: 'uptimeRobot.summary.down',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: true,
      defaultOrder: 52,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-triangle-exclamation'
    },
    {
      id: 'uptimerobot.paused',
      display: 'UR Paused',
      description: 'Synchronized UptimeRobot monitors with Paused health.',
      category: 'Monitoring',
      type: 'kpi',
      dataSource: 'UptimeRobot sheet',
      dataPath: 'uptimeRobot.summary.paused',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: false,
      defaultOrder: 53,
      defaultSize: 'small',
      permission: 'view',
      icon: 'fa-circle-pause'
    },
    {
      id: 'outages.summary',
      display: 'WAN Outages',
      description: 'Active incidents, outages started in the last 30 days, and aggregate circuit downtime overlapping that window.',
      category: 'Monitoring',
      type: 'kpi_group',
      dataSource: 'Outages sheet',
      dataPath: 'outages.summary',
      requiredModule: 'outages',
      defaultEnabled: true,
      defaultOrder: 60,
      defaultSize: 'medium',
      permission: 'view',
      icon: 'fa-triangle-exclamation'
    },
    {
      id: 'campus_distribution',
      display: 'Switch Deployment by Campus',
      description: 'Switch count by campus.',
      category: 'Infrastructure',
      type: 'chart',
      dataSource: 'Dashboard formula summary',
      dataPath: 'campusDistribution',
      requiredModule: 'switches',
      defaultEnabled: true,
      defaultOrder: 70,
      defaultSize: 'large',
      permission: 'view'
    },
    {
      id: 'workflow_summary',
      display: 'Department Workflow',
      description: 'Workflow groups, tiers, ticket steps and workflows.',
      category: 'Operations',
      type: 'kpi_group',
      dataSource: 'Department Workflow sheet',
      dataPath: 'workflow',
      requiredModule: 'workflow',
      defaultEnabled: true,
      defaultOrder: 80,
      defaultSize: 'medium',
      permission: 'view'
    },
    {
      id: 'switch_health',
      display: 'Switch Health',
      description: 'Switch records grouped by status.',
      category: 'Infrastructure',
      type: 'status_summary',
      dataSource: 'Dashboard formula summary',
      dataPath: 'switchStatus',
      requiredModule: 'switches',
      defaultEnabled: true,
      defaultOrder: 90,
      defaultSize: 'medium',
      permission: 'view'
    },
    {
      id: 'ap_health',
      display: 'Access Point Health',
      description: 'Access point records grouped by status.',
      category: 'Infrastructure',
      type: 'status_summary',
      dataSource: 'Dashboard formula summary',
      dataPath: 'apStatus',
      requiredModule: 'accessPoints',
      defaultEnabled: true,
      defaultOrder: 91,
      defaultSize: 'medium',
      permission: 'view'
    },
    {
      id: 'wan_status',
      display: 'Internet / WAN Status',
      description: 'Internet/WAN records grouped by administrative status.',
      category: 'Infrastructure',
      type: 'status_summary',
      dataSource: 'Dashboard formula summary',
      dataPath: 'wanStatus',
      requiredModule: 'internetWan',
      defaultEnabled: true,
      defaultOrder: 92,
      defaultSize: 'medium',
      permission: 'view'
    },
    {
      id: 'uptimerobot.wan_health',
      display: 'WAN Monitor Health',
      description: 'WAN circuits joined to synchronized UptimeRobot monitor health.',
      category: 'Monitoring',
      type: 'status_summary',
      dataSource: 'Internet WAN sheet joined to UptimeRobot sheet',
      dataPath: 'uptimeRobot.wanHealth',
      requiredModule: 'internetWan',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: true,
      defaultOrder: 93,
      defaultSize: 'medium',
      permission: 'view'
    },
    {
      id: 'uptimerobot.down_monitors',
      display: 'Down Monitors',
      description: 'Synchronized UptimeRobot monitors currently down.',
      category: 'Monitoring',
      type: 'list',
      dataSource: 'UptimeRobot sheet',
      dataPath: 'uptimeRobot.downMonitors',
      requiredIntegration: 'uptimerobot',
      defaultEnabled: true,
      defaultOrder: 94,
      defaultSize: 'medium',
      permission: 'view'
    }
  ];
}


function getDashboardAvailableWidgets_() {

  return getDashboardWidgetRegistry_()
    .filter(widget =>
      isDashboardWidgetAvailable_(
        widget
      )
    );
}


function isDashboardWidgetAvailable_(
  widget
) {

  if (
    widget.requiredModule &&
    !isModuleEnabled_(
      widget.requiredModule
    )
  ) {
    return false;
  }

  if (widget.requiredIntegration) {
    try {
      const integration =
        getIntegrationStatusById_(
          widget.requiredIntegration
        );

      if (!integration.enabled) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  return true;
}


function getDashboardWidgetConfiguration_(
  availableWidgets
) {

  const overrides = {};

  try {
    const raw =
      AppConfig.get(
        'dashboard.widgets'
      );

    const parsed =
      raw
        ? JSON.parse(raw)
        : {};

    (
      parsed.widgets || []
    ).forEach(item => {
      if (item && item.id) {
        overrides[item.id] =
          item;
      }
    });
  } catch (error) {}

  return (availableWidgets || [])
    .map(widget => {

      const override =
        overrides[widget.id] || {};

      return {
        id:
          widget.id,
        enabled:
          override.enabled !== undefined
            ? !!override.enabled
            : !!widget.defaultEnabled,
        order:
          Number.isFinite(Number(override.order))
            ? Number(override.order)
            : Number(widget.defaultOrder || 0),
        size:
          override.size ||
          widget.defaultSize ||
          'medium'
      };

    });
}


function hydrateDashboardWidgets_(
  availableWidgets,
  config,
  data,
  metricMap
) {

  const configById = {};

  (config || [])
    .forEach(item => {
      configById[item.id] =
        item;
    });

  return (availableWidgets || [])
    .map(widget => {

      const itemConfig =
        configById[widget.id] || {};

      return Object.assign(
        {},
        widget,
        {
          enabled:
            itemConfig.enabled !== undefined
              ? !!itemConfig.enabled
              : !!widget.defaultEnabled,
          order:
            Number.isFinite(Number(itemConfig.order))
              ? Number(itemConfig.order)
              : Number(widget.defaultOrder || 0),
          size:
            itemConfig.size ||
            widget.defaultSize ||
            'medium',
          value:
            getDashboardWidgetValue_(
              widget,
              data,
              metricMap
            ),
          items:
            widget.type === 'list'
              ? getDashboardPathValue_(
                  data,
                  widget.dataPath
                ) || []
              : [],
          statuses:
            widget.type === 'status_summary'
              ? getDashboardPathValue_(
                  data,
                  widget.dataPath
                ) || {}
              : {},
          distribution:
            widget.type === 'chart'
              ? getDashboardPathValue_(
                  data,
                  widget.dataPath
                ) || {}
              : {},
          provenance:
            getDashboardWidgetProvenance_(
              widget,
              data
            )
        }
      );

    })
    .filter(widget =>
      widget.enabled
    )
    .sort((left, right) =>
      Number(left.order || 0) -
      Number(right.order || 0)
    );
}


function getDashboardWidgetValue_(
  widget,
  data,
  metricMap
) {

  if (widget.metricKey) {
    return getDashboardMetricNumber_(
      metricMap,
      widget.metricKey
    );
  }

  const value =
    getDashboardPathValue_(
      data,
      widget.dataPath
    );

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : value || 0;
}


function getDashboardPathValue_(
  source,
  path
) {

  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce(
      (current, key) =>
        current &&
        current[key] !== undefined
          ? current[key]
          : undefined,
      source
    );
}


function getDashboardWidgetProvenance_(
  widget,
  data
) {

  if (
    widget.requiredIntegration === 'uptimerobot'
  ) {
    return {
      source:
        'UptimeRobot sheet',
      lastUpdated:
        data.uptimeRobot &&
        data.uptimeRobot.lastSuccessfulSync
          ? data.uptimeRobot.lastSuccessfulSync
          : ''
    };
  }

  if (
    widget.requiredModule === 'outages'
  ) {
    return {
      source:
        'Outages sheet',
      lastUpdated:
        data.outages &&
        data.outages.lastUpdated
          ? data.outages.lastUpdated
          : ''
    };
  }

  return {
    source:
      widget.dataSource || '',
    lastUpdated: ''
  };
}


function buildDashboardUptimeRobotData_() {

  const empty = {
    enabled: false,
    status: 'disabled',
    lastSuccessfulSync: '',
    latestError: '',
    summary:
      typeof buildUptimeRobotSummary_ === 'function'
        ? buildUptimeRobotSummary_([])
        : {
            total: 0,
            online: 0,
            down: 0,
            paused: 0,
            unknown: 0
          },
    wanHealth: {
      Online: 0,
      Down: 0,
      Paused: 0,
      Unknown: 0,
      'Not Monitored': 0
    },
    downMonitors: []
  };

  if (
    typeof getUptimeRobotLocalMonitorSnapshot_ !== 'function'
  ) {
    return empty;
  }

  try {

    const snapshot =
      getUptimeRobotLocalMonitorSnapshot_();

    const monitors =
      snapshot.monitors || [];

    return {
      enabled:
        !!snapshot.enabled,
      status:
        snapshot.status || '',
      lastSuccessfulSync:
        snapshot.lastSuccessfulSync ||
        snapshot.fetchedAt ||
        '',
      latestError:
        snapshot.latestError || '',
      summary:
        snapshot.summary || empty.summary,
      wanHealth:
        buildDashboardUptimeRobotWanHealth_(
          monitors
        ),
      downMonitors:
        monitors
          .filter(monitor =>
            normalizeSimpleKey_(
              monitor.health
            ) === 'down'
          )
          .slice(0, 8)
          .map(monitor => ({
            id:
              monitor.id,
            name:
              monitor.name || monitor.id,
            target:
              monitor.target || '',
            type:
              monitor.type || '',
            health:
              monitor.health || 'Down',
            lastChecked:
              monitor.lastChecked || ''
          }))
    };

  } catch (error) {

    return Object.assign(
      {},
      empty,
      {
        status: 'error',
        latestError:
          sanitizeIntegrationError_(
            error,
            'UptimeRobot dashboard data unavailable.'
          )
      }
    );

  }
}


function buildDashboardUptimeRobotWanHealth_(
  monitors
) {

  const summary = {
    Online: 0,
    Down: 0,
    Paused: 0,
    Unknown: 0,
    'Not Monitored': 0
  };

  const monitorMap =
    buildInternetWanMonitorMap_({
      monitors:
        monitors || []
    });

  try {

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          'Internet WAN'
        );

    if (!sheet) {
      return summary;
    }

    const values =
      readConfiguredPageValues_(
        sheet,
        APP_PAGE_CONFIG.internetWan
      );

    if (values.length < 2) {
      return summary;
    }

    const headers =
      values[0].map(value =>
        String(value || '').trim()
      );

    const monitorIndex =
      headers.indexOf(
        'UptimeRobot Monitor ID'
      );

    if (monitorIndex < 0) {
      return summary;
    }

    values
      .slice(1)
      .forEach(row => {

        if (
          !rowHasMeaningfulData_(
            row,
            headers
          )
        ) {
          return;
        }

        const monitorId =
          String(
            row[monitorIndex] || ''
          ).trim();

        if (!monitorId) {
          summary['Not Monitored']++;
          return;
        }

        const monitor =
          monitorMap[monitorId];

        const health =
          monitor
            ? monitor.health || 'Unknown'
            : 'Unknown';

        if (summary[health] === undefined) {
          summary.Unknown++;
        } else {
          summary[health]++;
        }

      });

  } catch (error) {}

  return summary;
}


function canCustomizeDashboard_() {

  try {
    return !!requireAdmin_();
  } catch (error) {
    return false;
  }
}


function saveDashboardWidgetConfiguration(
  config
) {

  const access =
    requireAdmin_();

  const registry =
    getDashboardWidgetRegistry_();

  const allowed = {};

  registry.forEach(widget => {
    allowed[widget.id] =
      true;
  });

  const widgets =
    Array.isArray(
      config && config.widgets
    )
      ? config.widgets
      : [];

  const sanitized =
    widgets
      .filter(item =>
        item &&
        allowed[item.id]
      )
      .map((item, index) => ({
        id:
          String(item.id || ''),
        enabled:
          !!item.enabled,
        order:
          Number.isFinite(Number(item.order))
            ? Number(item.order)
            : index + 1,
        size:
          [
            'small',
            'medium',
            'large'
          ].includes(item.size)
            ? item.size
            : 'medium'
      }));

  AppConfig.setSystemValue_(
    'dashboard.widgets',
    JSON.stringify({
      widgets:
        sanitized
    }),
    access.email
  );

  invalidateAppPage_(
    'dashboard'
  );

  return getAppDashboardData_(
    true
  );
}


function resetDashboardWidgetConfiguration() {

  const access =
    requireAdmin_();

  AppConfig.setSystemValue_(
    'dashboard.widgets',
    '',
    access.email
  );

  invalidateAppPage_(
    'dashboard'
  );

  return getAppDashboardData_(
    true
  );
}


function readDashboardMetricMap_(
  values
) {

  const headers =
    (values[0] || [])
      .map(value =>
        String(value || '').trim()
      );

  const keyIndex =
    headers.indexOf('Metric Key');

  const labelIndex =
    headers.indexOf('Label');

  const valueIndex =
    headers.indexOf('Value');

  const sectionIndex =
    headers.indexOf('Section');

  const metrics = {};

  if (
    keyIndex < 0 ||
    labelIndex < 0 ||
    valueIndex < 0 ||
    sectionIndex < 0
  ) {
    return metrics;
  }


  values
    .slice(1)
    .forEach(row => {

      const key =
        String(row[keyIndex] || '').trim();

      const section =
        String(row[sectionIndex] || '').trim();

      if (
        !key ||
        section !== 'metric'
      ) {
        return;
      }

      metrics[key] = {
        key: key,
        label:
          String(row[labelIndex] || '').trim(),
        value:
          normalizeDashboardMetricValue_(
            row[valueIndex]
          )
      };

    });


  return metrics;
}


function buildDashboardLegacyMetricMap_(
  metricMap
) {

  return {
    switches:
      getDashboardMetricNumber_(
        metricMap,
        'switches.total'
      ),
    accessPoints:
      getDashboardMetricNumber_(
        metricMap,
        'access_points.total'
      ),
    servers:
      getDashboardMetricNumber_(
        metricMap,
        'servers.total'
      ),
    offlineServers:
      getDashboardMetricNumber_(
        metricMap,
        'offline_servers.total'
      ),
    securityCameras:
      getDashboardMetricNumber_(
        metricMap,
        'security_cameras.total'
      ),
    internetWan:
      getDashboardMetricNumber_(
        metricMap,
        'internet_wan.total'
      ),
    backups:
      getDashboardMetricNumber_(
        metricMap,
        'backup_schedule.total'
      )
  };
}


function buildDashboardMetricCards_(
  metricMap
) {

  const cards = [
    {
      key: 'switches.total',
      label: 'Switches',
      icon: 'fa-network-wired'
    },
    {
      key: 'access_points.total',
      label: 'Access Points',
      icon: 'fa-wifi'
    },
    {
      key: 'servers.total',
      label: 'Servers',
      icon: 'fa-server'
    },
    {
      key: 'offline_servers.total',
      label: 'Offline Servers',
      icon: 'fa-triangle-exclamation'
    },
    {
      key: 'security_cameras.total',
      label: 'Security Cameras',
      icon: 'fa-video'
    },
    {
      key: 'internet_wan.total',
      label: 'WAN Circuits',
      icon: 'fa-globe'
    },
    {
      key: 'backup_schedule.total',
      label: 'Backup Jobs',
      icon: 'fa-database'
    }
  ];


  return cards
    .filter(card =>
      Object.prototype
        .hasOwnProperty
        .call(
          metricMap,
          card.key
        )
    )
    .map(card => ({
      key:
        card.key,
      label:
        metricMap[card.key].label ||
        card.label,
      value:
        getDashboardMetricNumber_(
          metricMap,
          card.key
        ),
      icon:
        card.icon
    }));
}


function readDashboardSummarySection_(
  values,
  sectionKey
) {

  const section =
    getDashboardSummarySections_()
      .find(item =>
        item.key === sectionKey
      );

  const result = {};

  if (!section) {
    return result;
  }

  const startIndex =
    Number(section.row || 1) + 1;

  const endIndex =
    Math.min(
      startIndex +
        Number(section.maxRows || 20),
      values.length
    );

  const labelIndex =
    Number(section.column || 1) - 1;

  const valueIndex =
    labelIndex + 1;


  for (
    let rowIndex = startIndex;
    rowIndex < endIndex;
    rowIndex++
  ) {

    const row =
      values[rowIndex] || [];

    const label =
      String(row[labelIndex] || '').trim();

    const value =
      normalizeDashboardMetricValue_(
        row[valueIndex]
      );


    if (
      !label ||
      value === '' ||
      Number(value) === 0
    ) {
      continue;
    }

    result[label] =
      value;

  }


  return result;
}


function getDashboardMetricNumber_(
  metricMap,
  key
) {

  const value =
    metricMap[key]
      ? metricMap[key].value
      : 0;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function normalizeDashboardMetricValue_(
  value
) {

  const text =
    String(value == null ? '' : value).trim();

  if (!text) {
    return '';
  }

  const number =
    Number(
      text.replace(/,/g, '')
    );

  return Number.isFinite(number)
    ? number
    : text;
}


/*******************************************************
 * INTERNET / WAN
 *******************************************************/

function getInternetWanPageData_(
  forceRefresh
) {

  return withPerformanceTiming_(
    'getInternetWanPageData',
    function() {

  const cache =
    CacheService.getScriptCache();

  const cacheKey =
    'app_page_internetWan';


  if (!forceRefresh) {

    const cached =
      cache.get(cacheKey);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {}
    }

  }


  const config =
    APP_PAGE_CONFIG.internetWan;

  const sheet =
    getReadSheet_(config.sheet);

  const result =
    buildEmptyInternetWanPageData_();

  const monitoring =
    getInternetWanMonitoringSnapshot_(
      false
    );

  result.monitoring =
    monitoring;


  if (!sheet) {
    return result;
  }


  const values =
    readConfiguredPageValues_(
      sheet,
      config
    );

  if (!values.length) {
    return result;
  }


  const headers =
    values[0]
      .map(value =>
        String(value || '').trim()
      );

  const rows = [];

  for (
    let index = 1;
    index < values.length;
    index++
  ) {

    const sourceRow =
      values[index] || [];

    if (
      !rowHasMeaningfulData_(
        sourceRow,
        headers
      )
    ) {
      continue;
    }

    const row = {
      _row:
        index + 1,
      _sourceSheet:
        config.sheet
    };

    headers.forEach((header, columnIndex) => {
      if (header) {
        row[header] =
          String(sourceRow[columnIndex] || '');
      }
    });

    applyInternetWanDisplayFields_(
      row,
      monitoring
    );

    rows.push(
      row
    );

  }


  result.headers =
    headers;

  result.rows =
    rows;

  result.totalCount =
    rows.length;

  result.summary =
    buildInternetWanSummary_(
      rows
    );


  cacheJson_(
    cacheKey,
    result,
    60
  );


  return result;

    }
  );
}


function buildEmptyInternetWanPageData_() {

  const config =
    APP_PAGE_CONFIG.internetWan;

  const schema =
    getNetworkDashboardSchema_()[
      config.sheet
    ];

  const controlledOptions =
    getControlledOptionsForSheet_(
      config.sheet
    );

  controlledOptions.Health =
    getControlledOptions_(
      'wanHealth'
    );

  return {
    pageKey: 'internetWan',
    type: 'internetWan',
    label:
      config.label,
    sheetName:
      config.sheet,
    headers:
      schema.headers || [],
    rows: [],
    totalCount: 0,
    defaultColumns:
      config.defaultColumns || [],
    controlledOptions:
      controlledOptions,
    permission:
      getPagePermission_(
        'internetWan'
      ),
    summary:
      buildInternetWanSummary_([]),
    monitoring:
      getInternetWanMonitoringSnapshot_(
        false
      )
  };
}


function applyInternetWanDisplayFields_(
  row,
  monitoring
) {

  if (/^maintenance$/i.test(String(row.Status || '').trim())) row.Status = '';
  const ips =
    splitInternetWanPublicIps_(
      row['Public IPs']
    );

  row._publicIpList =
    ips;

  row._publicIpSummary =
    summarizeInternetWanPublicIps_(
      ips
    );

  applyInternetWanMonitoringFields_(
    row,
    monitoring
  );
}


function getInternetWanMonitoringSnapshot_(
  forceRefresh
) {

  if (
    typeof getUptimeRobotMonitorSnapshot_ !==
    'function'
  ) {
    return {
      integrationId: 'uptimerobot',
      enabled: false,
      configurationComplete: false,
      canRefresh: false,
      status: 'unavailable',
      message:
        'UptimeRobot integration is not installed.'
    };
  }

  return getUptimeRobotMonitorSnapshot_({
    forceRefresh:
      !!forceRefresh
  });
}


function applyInternetWanMonitoringFields_(
  row,
  monitoring
) {

  const monitorId =
    String(
      row['UptimeRobot Monitor ID'] || ''
    ).trim();

  row._monitorHealth =
    monitorId
      ? 'Unknown'
      : 'Not Monitored';

  row._monitorName =
    '';

  row._monitorStatus =
    '';

  row._monitorLastChecked =
    '';

  if (!monitorId) {
    return row;
  }

  const monitorMap =
    buildInternetWanMonitorMap_(
      monitoring
    );

  const monitor =
    monitorMap[monitorId];

  if (!monitor) {
    return row;
  }

  row._monitorHealth =
    monitor.health ||
    monitor.observedHealth ||
    'Unknown';

  row._monitorName =
    monitor.name || '';

  row._monitorStatus =
    monitor.status || '';

  row._monitorLastChecked =
    monitor.lastChecked || '';

  return row;
}


function buildInternetWanMonitorMap_(
  monitoring
) {

  const map = {};

  (
    monitoring &&
    monitoring.monitors
      ? monitoring.monitors
      : []
  ).forEach(monitor => {

    const id =
      String(
        monitor.id || ''
      ).trim();

    if (id) {
      map[id] =
        monitor;
    }

  });

  return map;
}


function appRefreshInternetWanHealth() {

  requireAdmin_();

  try {

    const syncResult =
      runIntegrationSync(
        'uptimerobot'
      );

    const monitoring =
      getInternetWanMonitoringSnapshot_(
        true
      );

    monitoring.status =
      monitoring.status === 'not_synced'
        ? 'empty'
        : monitoring.status;

    monitoring.message =
      syncResult.message ||
      monitoring.message;

    monitoring.syncResult =
      syncResult;

    return monitoring;

  } catch (error) {

    const monitoring =
      getInternetWanMonitoringSnapshot_(
        true
      );

    monitoring.status =
      'error';

    monitoring.message =
      sanitizeUptimeRobotError_(
        error
      );

    return monitoring;

  }
}


function buildInternetWanSummary_(
  rows
) {

  const sites = {};

  const summary = {
    total:
      rows.length,
    primary: 0,
    secondary: 0,
    backup: 0,
    active: 0,
    standby: 0,
    disabled: 0,
    healthDown: 0,
    notMonitored: 0,
    sites: 0
  };


  rows.forEach(row => {

    const role =
      normalizeSimpleKey_(
        row['Role']
      );

    const status =
      normalizeSimpleKey_(
        row['Status']
      );

    const site =
      String(
        row['Site / Location'] || ''
      ).trim();

    if (site) {
      sites[site] =
        true;
    }

    if (summary[role] !== undefined) {
      summary[role]++;
    }

    if (summary[status] !== undefined) {
      summary[status]++;
    }

    const health =
      normalizeSimpleKey_(
        row._monitorHealth
      );

    if (health === 'down') {
      summary.healthDown++;
    }

    if (health === 'not_monitored') {
      summary.notMonitored++;
    }

  });

  summary.sites =
    Object.keys(sites).length;

  return summary;
}


function normalizeSimpleKey_(
  value
) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}


function summarizeInternetWanPublicIps_(
  ips
) {

  if (!ips.length) {
    return '';
  }

  if (ips.length === 1) {
    return ips[0];
  }

  return ips[0] +
    ' +' +
    (ips.length - 1) +
    ' more';
}


function appSaveInternetWanCircuit(
  record
) {

  requirePagePermission_(
    'internetWan',
    'edit'
  );

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        'Internet WAN'
      );

  if (!sheet) {
    throw new Error(
      'Internet WAN sheet was not found. Run setupNetworkDashboard().'
    );
  }


  const headers =
    getInternetWanSheetHeaders_(
      sheet
    );

  const indexes =
    mapHeaders_(
      headers
    );

  const normalized =
    normalizeInternetWanRecord_(
      record || {}
    );

  let rowNumber =
    Number(
      record && record._row
    );

  const editing =
    Number.isInteger(rowNumber) &&
    rowNumber >= 2 &&
    rowNumber <= sheet.getLastRow();


  if (editing) {

    const current =
      sheet
        .getRange(
          rowNumber,
          1,
          1,
          headers.length
        )
        .getDisplayValues()[0];

    normalized['Circuit ID'] =
      String(
        current[indexes['Circuit ID']] ||
        normalized['Circuit ID'] ||
        ''
      ).trim() ||
      generateInternetWanCircuitId_(
        sheet,
        headers
      );

  } else {

    rowNumber =
      sheet.getLastRow() + 1;

    normalized['Circuit ID'] =
      generateInternetWanCircuitId_(
        sheet,
        headers
      );

  }


  const output =
    headers.map(header =>
      Object.prototype
        .hasOwnProperty
        .call(
          normalized,
          header
        )
        ? normalized[header]
        : ''
    );

  sheet
    .getRange(
      rowNumber,
      1,
      1,
      output.length
    )
    .setValues([
      output
    ]);

  invalidateAppPage_(
    'internetWan'
  );

  return getInternetWanPageData_(
    true
  );
}


function appDeleteInternetWanCircuit(
  rowNumber
) {

  requirePagePermission_(
    'internetWan',
    'edit'
  );

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        'Internet WAN'
      );

  rowNumber =
    Number(rowNumber);

  if (
    !sheet ||
    !Number.isInteger(rowNumber) ||
    rowNumber < 2 ||
    rowNumber > sheet.getLastRow()
  ) {
    throw new Error(
      'Invalid Internet WAN row.'
    );
  }

  sheet.deleteRow(
    rowNumber
  );

  invalidateAppPage_(
    'internetWan'
  );

  return getInternetWanPageData_(
    true
  );
}


function getInternetWanSheetHeaders_(
  sheet
) {

  return sheet
    .getRange(
      1,
      1,
      1,
      sheet.getLastColumn()
    )
    .getDisplayValues()[0]
    .map(value =>
      String(value || '').trim()
    )
    .filter(Boolean);
}


function mapHeaders_(
  headers
) {

  const map = {};

  (headers || [])
    .forEach((header, index) => {

      const name =
        String(header || '').trim();

      if (name) {
        map[name] =
          index;
      }

    });

  return map;
}


function normalizeInternetWanRecord_(
  record
) {

  const normalized = {
    'Circuit ID':
      String(record['Circuit ID'] || '').trim(),
    'Circuit Name':
      requiredInternetWanText_(
        record['Circuit Name'],
        'Circuit Name'
      ),
    'Site / Location':
      requiredInternetWanText_(
        record['Site / Location'],
        'Site / Location'
      ),
    'Role':
      normalizeControlledOption_(
        'wanRole',
        record['Role'],
        'Role',
        true
      ),
    'Provider':
      requiredInternetWanText_(
        record['Provider'],
        'Provider'
      ),
    'Service Type':
      normalizeControlledOption_(
        'wanServiceType',
        record['Service Type'],
        'Service Type',
        true
      ),
    'APSCN Device Name':
      String(
        record['APSCN Device Name'] || ''
      ).trim(),
    'Bandwidth':
      normalizeInternetWanBandwidth_(
        record.Bandwidth,
        'Bandwidth'
      ),
    'Public Network / CIDR':
      normalizeInternetWanCidr_(
        record['Public Network / CIDR']
      ),
    'Gateway':
      normalizeInternetWanGateway_(
        record['Gateway']
      ),
    'Public IPs':
      normalizeInternetWanPublicIps_(
        record.publicIps !== undefined
          ? record.publicIps
          : record['Public IPs']
      ),
    'Circuit / Account ID':
      String(
        record['Circuit / Account ID'] || ''
      ).trim(),
    'UptimeRobot Monitor ID':
      normalizeInternetWanMonitorId_(
        record['UptimeRobot Monitor ID']
      ),
    'Status':
      normalizeControlledOption_(
        'wanStatus',
        record['Status'],
        'Status',
        true
      ),
    'Notes':
      String(
        record['Notes'] || ''
      ).trim()
  };

  return normalized;
}


function normalizeInternetWanMonitorId_(
  value
) {

  const text =
    String(value || '').trim();

  if (!text) {
    return '';
  }

  if (!/^[0-9]+$/.test(text)) {
    throw new Error(
      'UptimeRobot Monitor ID must be numeric.'
    );
  }

  return text;
}


function requiredInternetWanText_(
  value,
  label
) {

  const text =
    String(value || '').trim();

  if (!text) {
    throw new Error(
      label +
      ' is required.'
    );
  }

  return text;
}


function normalizeInternetWanChoice_(
  value,
  label
) {

  const text =
    String(value || '').trim();

  if (!text) {
    throw new Error(
      label +
      ' is required.'
    );
  }

  return text;
}


function normalizeInternetWanBandwidth_(
  value,
  label
) {

  const text =
    String(value || '').trim();

  if (!text) {
    throw new Error(
      label +
      ' is required.'
    );
  }

  if (
    text.length > 80
  ) {
    throw new Error(
      label +
      ' must be 80 characters or fewer.'
    );
  }

  return text;
}


function normalizeInternetWanCidr_(
  value
) {

  const text =
    String(value || '').trim();

  if (!text) {
    return '';
  }

  if (
    !isValidCidrBlock_(
      text
    )
  ) {
    throw new Error(
      'Public Network / CIDR must be a valid IPv4 or IPv6 CIDR block.'
    );
  }

  return text;
}


function normalizeInternetWanGateway_(
  value
) {

  const text =
    String(value || '').trim();

  if (!text) {
    return '';
  }

  if (
    !isValidIpAddress_(
      text
    )
  ) {
    throw new Error(
      'Gateway must be a valid IPv4 or IPv6 address.'
    );
  }

  return text;
}


function normalizeInternetWanPublicIps_(
  value
) {

  const ips =
    splitInternetWanPublicIps_(
      value
    );

  ips.forEach(ip => {

    if (
      !isValidIpAddress_(
        ip
      )
    ) {
      throw new Error(
        'Public IP must be a valid IPv4 or IPv6 address: ' +
        ip
      );
    }

  });

  return ips.join(', ');
}


function splitInternetWanPublicIps_(
  value
) {

  const raw =
    Array.isArray(value)
      ? value
      : String(value || '').split(',');

  const ips = [];

  raw.forEach(item => {

    const ip =
      String(item || '').trim();

    if (
      ip &&
      !ips.includes(ip)
    ) {
      ips.push(ip);
    }

  });

  return ips;
}


function isValidCidrBlock_(
  value
) {

  const parts =
    String(value || '').split('/');

  if (parts.length !== 2) {
    return false;
  }

  const ip =
    parts[0].trim();

  const prefix =
    Number(parts[1]);

  if (
    !Number.isInteger(prefix) ||
    !isValidIpAddress_(ip)
  ) {
    return false;
  }

  return ip.includes(':')
    ? prefix >= 0 && prefix <= 128
    : prefix >= 0 && prefix <= 32;
}


function isValidIpAddress_(
  value
) {

  const text =
    String(value || '').trim();

  return isValidIpv4Address_(
    text
  ) ||
    isValidIpv6Address_(
      text
    );
}


function isValidIpv4Address_(
  value
) {

  const parts =
    String(value || '').split('.');

  if (parts.length !== 4) {
    return false;
  }

  return parts.every(part => {

    if (!/^\d+$/.test(part)) {
      return false;
    }

    const number =
      Number(part);

    return number >= 0 &&
      number <= 255 &&
      String(number) === part;

  });
}


function isValidIpv6Address_(
  value
) {

  const text =
    String(value || '').trim();

  if (
    !text ||
    !/^[0-9a-fA-F:]+$/.test(text)
  ) {
    return false;
  }

  if (
    (text.match(/::/g) || []).length > 1
  ) {
    return false;
  }

  const compressed =
    text.includes('::');

  const parts =
    text.split('::');

  const segments =
    parts
      .join(':')
      .split(':')
      .filter(Boolean);

  if (
    !segments.every(segment =>
      /^[0-9a-fA-F]{1,4}$/.test(segment)
    )
  ) {
    return false;
  }

  return compressed
    ? segments.length < 8
    : segments.length === 8;
}


function generateInternetWanCircuitId_(
  sheet,
  headers
) {

  const indexes =
    mapHeaders_(
      headers
    );

  const circuitIdIndex =
    indexes['Circuit ID'];

  if (circuitIdIndex === undefined) {
    throw new Error(
      'Internet WAN is missing Circuit ID header.'
    );
  }

  let max =
    0;

  if (sheet.getLastRow() >= 2) {

    sheet
      .getRange(
        2,
        circuitIdIndex + 1,
        sheet.getLastRow() - 1,
        1
      )
      .getDisplayValues()
      .forEach(row => {

        const match =
          String(row[0] || '')
            .trim()
            .match(/^WAN-(\d+)$/i);

        if (match) {
          max =
            Math.max(
              max,
              Number(match[1])
            );
        }

      });

  }

  return 'WAN-' +
    String(max + 1)
      .padStart(
        4,
        '0'
      );
}


function countAppRowsFromSheet_(sheet) {

  if (!sheet) {
    return 0;
  }


  const values =
    readAppSheetDisplayValues_(
      sheet,
      getNetworkDashboardReadColumnCount_(
        sheet.getName(),
        sheet.getLastColumn(),
        false
      ),
      1
    );


  return countAppRowsFromData_(
    values
  );
}


function countAppRowsFromData_(values) {

  if (
    !values ||
    values.length < 2
  ) {
    return 0;
  }


  const headers =
    values[0].map(value =>
      String(value || '').trim()
    );


  let count =
    0;


  for (
    let rowIndex = 1;
    rowIndex < values.length;
    rowIndex++
  ) {

    const row =
      values[rowIndex] || [];


    if (
      !rowHasMeaningfulData_(
        row,
        headers
      )
    ) {
      continue;
    }


    const firstValue =
      String(row[0] || '')
        .trim();


    const normalizedFirst =
      firstValue.toLowerCase();


    if (
      !firstValue ||
      normalizedFirst.includes(
        'color legend'
      ) ||
      normalizedFirst.startsWith(
        'count ='
      )
    ) {
      continue;
    }


    count++;

  }


  return count;
}


function rowShouldBeCountedForSummary_(
  row,
  headers
) {

  if (
    !rowHasMeaningfulData_(
      row,
      headers
    )
  ) {
    return false;
  }


  const firstValue =
    String(row[0] || '')
      .trim();

  const normalizedFirst =
    firstValue.toLowerCase();


  return (
    !!firstValue &&
    !normalizedFirst.includes(
      'color legend'
    ) &&
    !normalizedFirst.startsWith(
      'count ='
    )
    );
}


function countColumnValuesFromData_(
  data,
  headerName
) {

  if (!data || !data.length) {
    return {};
  }


  const headers =
    data[0].map(value =>
      String(value || '').trim()
    );


  const index =
    headers.indexOf(headerName);


  if (index === -1) {
    return {};
  }


  const result = {};


  for (
    let rowIndex = 1;
    rowIndex < data.length;
    rowIndex++
  ) {

    if (
      !rowShouldBeCountedForSummary_(
        data[rowIndex] || [],
        headers
      )
    ) {
      continue;
    }

    const value =
      String(
        data[rowIndex][index] || ''
      ).trim();


    if (!value) {
      continue;
    }


    result[value] =
      (result[value] || 0) + 1;

  }


  return result;
}


/*******************************************************
 * WORKFLOW
 *******************************************************/

function getDepartmentWorkflowData_(
  forceRefresh
) {

  const cache =
    CacheService.getScriptCache();


  const cacheKey =
    'app_department_workflow';


  if (!forceRefresh) {

    const cached =
      cache.get(cacheKey);

    if (cached) {

      try {
        return JSON.parse(cached);
      } catch (error) {}

    }

  }


  const sheet =
    getReadSheet_('Department Workflow');


  const result = {
    groups: [],
    tiers: [],
    ticketSteps: [],
    priorities: [],
    workflows: []
  };


  if (!sheet) {
    return result;
  }


  const data = readSheetDisplayBatch_(sheet);

  let section = '';


  data.forEach(row => {

    const first =
      String(row[0] || '')
        .trim();


    if (!first) {
      return;
    }


    if (first === 'Group') {
      section = 'groups';
      return;
    }


    if (first === 'Tier') {
      section = 'tiers';
      return;
    }


    if (first === 'Ticket Step') {
      section = 'ticketSteps';
      return;
    }


    if (first === 'Priority Level') {
      section = 'priorities';
      return;
    }


    if (first === 'Category') {
      section = 'workflows';
      return;
    }


    if (section === 'groups') {

      result.groups.push({
        group: row[0],
        members: row[1],
        purpose: row[2]
      });

    }


    if (section === 'tiers') {

      result.tiers.push({
        tier: row[0],
        definition: row[1]
      });

    }


    if (section === 'ticketSteps') {

      result.ticketSteps.push({
        step: row[0],
        stage: row[1],
        responsible: row[2],
        criteria: row[3]
      });

    }


    if (section === 'priorities') {

      result.priorities.push({
        priority: row[0],
        responseSla: row[1],
        resolutionSla: row[2],
        definition: row[3],
        escalation: row[4]
      });

    }


    if (section === 'workflows') {

      result.workflows.push({
        category: row[0],
        workflow: row[1],
        tier: row[2],
        primaryOwner: row[3],
        backup: row[4],
        support: row[5],
        notes: row[6]
      });

    }

  });


  cacheJson_(
    cacheKey,
    result,
    600
  );


  return result;
}


/*******************************************************
 * CRUD
 *******************************************************/

function appUpdateRecord(
  pageKey,
  rowNumber,
  record,
  sourceSheetName
) {

  requirePagePermission_(
    pageKey,
    'edit'
  );


  const config =
    APP_PAGE_CONFIG[
      pageKey
    ];


  if (
    !config ||
    (
      config.type !== 'table' &&
      config.type !== 'structured'
    )
  ) {

    throw new Error(
      'This page cannot be edited this way.'
    );

  }


  validateRequiredRecordFields_(
    pageKey,
    record || {}
  );


  let targetSheetName =
    config.sheet;


  /*
   * Servers may originate from either physical sheet.
   *
   * Do NOT accept arbitrary sheet names from the browser.
   */
  if (
    pageKey === 'servers' &&
    config.combinedServerPage
  ) {

    const allowedSheets = [
      config.sheet,
      config.offlineSheet
    ];


    if (
      sourceSheetName &&
      allowedSheets.includes(
        sourceSheetName
      )
    ) {

      targetSheetName =
        sourceSheetName;

    } else if (
      sourceSheetName
    ) {

      throw new Error(
        'Invalid server source.'
      );

    }

  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        targetSheetName
      );


  if (!sheet) {

    throw new Error(
      'Sheet not found.'
    );

  }


  rowNumber =
    Number(
      rowNumber
    );


  if (
    !Number.isInteger(
      rowNumber
    ) ||
    rowNumber < 1 ||
    rowNumber >
      sheet.getLastRow()
  ) {

    throw new Error(
      'Invalid row.'
    );

  }


  const lastColumn =
    sheet.getLastColumn();


  const current =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        lastColumn
      )
      .getValues()[0];


  let headerRow =
    1;


  if (
    config.type === 'structured' &&
    record._section
  ) {

    const section =
      config.sections.find(
        item =>
          item.key ===
          record._section
      );


    if (
      section &&
      section.headerRow
    ) {

      headerRow =
        Number(
          section.headerRow
        );

    }

  }


  const headers =
    sheet
      .getRange(
        headerRow,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0];


  const output =
    current.slice();


  headers.forEach(
    (header, index) => {

      const name =
        String(
          header || ''
        ).trim();

      const recordHasField =
        Object.prototype
          .hasOwnProperty
          .call(
            record,
            name
          );


      if (
        name &&
        isCredentialHeader_(
          name
        ) &&
        recordHasField
      ) {

        const credentialValue =
          String(
            record[name] == null
              ? ''
              : record[name]
          );

        if (credentialValue) {
          output[index] =
            credentialValue;
        }

        return;
      }


      if (
        name &&
        recordHasField
      ) {

        output[index] =
          normalizeControlledSheetField_(
            targetSheetName,
            name,
            record[name],
            false
          );

      }

    }
  );


  sheet
    .getRange(
      rowNumber,
      1,
      1,
      output.length
    )
    .setValues([
      output
    ]);


  invalidateAppPage_(
    pageKey
  );


  return {
    status: 'success'
  };
}


function appAddRecord(
  pageKey,
  record
) {

  requirePagePermission_(
    pageKey,
    'edit'
  );


  const config =
    APP_PAGE_CONFIG[pageKey];


  /*
   * For now Add Record remains for standard tables only.
   *
   * Structured tables often have metadata/secondary tables,
   * so blindly appending to the bottom can put the record in
   * the wrong section.
   */
  if (
    !config ||
    config.type !== 'table'
  ) {
    throw new Error(
      'Adding records is not available for this structured page.'
    );
  }


  validateRequiredRecordFields_(
    pageKey,
    record || {}
  );


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(config.sheet);


  if (!sheet) {
    throw new Error(
      'Sheet not found.'
    );
  }


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getDisplayValues()[0];


  const row =
    headers.map(header => {

      const name =
        String(header || '').trim();


      if (
        !name
      ) {
        return '';
      }

      if (
        isCredentialHeader_(name)
      ) {
        return Object.prototype
          .hasOwnProperty
          .call(record, name)
            ? String(
                record[name] == null
                  ? ''
                  : record[name]
              )
            : '';
      }


      return Object.prototype
        .hasOwnProperty
        .call(record, name)
          ? normalizeControlledSheetField_(
              config.sheet,
              name,
              record[name],
              false
            )
          : '';

    });


  sheet.appendRow(row);


  invalidateAppPage_(
    pageKey
  );


  return {
    status: 'success'
  };
}


function validateRequiredRecordFields_(
  pageKey,
  record
) {

  const requiredFields =
    getRequiredRecordFieldsForPage_(
      pageKey,
      record && record._section
    );

  requiredFields.forEach(field => {

    if (
      !String(
        record &&
        record[field] || ''
      ).trim()
    ) {
      throw new Error(
        field +
        ' is required.'
      );
    }

  });
}


function getRequiredRecordFieldsForPage_(
  pageKey,
  sectionKey
) {

  const standard = {
    switches: [
      'Device Label'
    ],
    accessPoints: [
      'Device Label'
    ],
    servers: [
      'Server Name'
    ],
    routes: [
      'Network / CIDR'
    ],
    securityCameras: [
      'Location'
    ],
    backups: [
      'Server Name'
    ]
  };

  if (standard[pageKey]) {
    return standard[pageKey];
  }

  if (pageKey === 'workflow') {
    const workflow = {
      groups: [
        'Group'
      ],
      tiers: [
        'Tier'
      ],
      ticketSteps: [
        'Ticket Step'
      ],
      priorities: [
        'Priority Level'
      ],
      workflows: [
        'Category',
        'Workflow'
      ]
    };

    return workflow[sectionKey] || [];
  }

  return [];
}


function appDeleteRecord(
  pageKey,
  rowNumber,
  sourceSheetName
) {

  requirePagePermission_(
    pageKey,
    'edit'
  );


  const config =
    APP_PAGE_CONFIG[
      pageKey
    ];


  if (!config) {

    throw new Error(
      'Unknown page.'
    );

  }


  let targetSheetName =
    config.sheet;


  /*
   * Combined Servers page may delete from either
   * physical source sheet.
   */
  if (
    pageKey === 'servers' &&
    config.combinedServerPage
  ) {

    const allowedSheets = [
      config.sheet,
      config.offlineSheet
    ];


    if (
      sourceSheetName &&
      allowedSheets.includes(
        sourceSheetName
      )
    ) {

      targetSheetName =
        sourceSheetName;

    } else if (
      sourceSheetName
    ) {

      throw new Error(
        'Invalid server source.'
      );

    }

  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        targetSheetName
      );


  rowNumber =
    Number(
      rowNumber
    );


  if (
    !sheet ||
    !Number.isInteger(
      rowNumber
    ) ||
    rowNumber < 2 ||
    rowNumber >
      sheet.getLastRow()
  ) {

    throw new Error(
      'Invalid row.'
    );

  }


  sheet.deleteRow(
    rowNumber
  );


  invalidateAppPage_(
    pageKey
  );


  return {
    status: 'success'
  };
}


/*******************************************************
 * CACHE
 *******************************************************/

function cacheJson_(
  key,
  value,
  seconds
) {

  try {

    const json =
      measureAppReadStep_('cacheSerialize', function() { return JSON.stringify(value); });


    /*
     * Apps Script Cache has per-entry size limits.
     * Don't let a large table break the request just because
     * it can't be cached.
     */
    if (json.length < 90000) {

      measureAppReadStep_('cacheWrite', function() {
        CacheService.getScriptCache().put(key, json, seconds);
      });

    }

  } catch (error) {

    console.warn(
      'Cache skipped:',
      key,
      error
    );

  }
}


function invalidateAppPage_(
  pageKey
) {

  const cache =
    CacheService.getScriptCache();


  cache.remove(
    'app_page_' + pageKey
  );


  cache.remove(
    'app_structured_' + pageKey
  );


  cache.remove(
    'app_dashboard'
  );


  if (pageKey === 'workflow') {

    cache.remove(
      'app_department_workflow'
    );

  }
}


function clearAppDataCaches_() {

  const cache =
    CacheService.getScriptCache();

  cache.remove(
    'app_dashboard'
  );

  cache.remove(
    'app_department_workflow'
  );

  cache.remove(
    APP_MODULE_CACHE_KEY
  );


  Object.keys(APP_PAGE_CONFIG)
    .forEach(key => {

      cache.remove(
        'app_page_' + key
      );

      cache.remove(
        'app_structured_' + key
      );

    });


  getNetworkDashboardSheetNames_()
    .forEach(sheetName => {
      cache.remove(
        'tab_data_' +
        sheetName.replace(/\s+/g, '_')
      );
    });
}


function appClearCache() {

  const access =
    getUserAccess_(
      getCurrentUserEmail_()
    );


  if (!access.authorized) {
    throw new Error(
      'Unauthorized access.'
    );
  }


  clearAppDataCaches_();


  return {
    status: 'success'
  };
}


/*******************************************************
 * USERS
 *******************************************************/

function getAppUsers_() {

  requireAdmin_();


  const sheet = getReadSheet_(APP_USERS_SHEET);
  if (!sheet) throw new Error('App Users sheet not found. Run Setup / Initialize.');
  const allValues = readSheetDisplayBatch_(sheet);
  const indexes = getAppUsersHeaderIndexes_(null, allValues[0] || []);
  const values = allValues.slice(1);

  const users =
    values
      .map((row, index) => {

        let permissions = {};


        try {

          const pagePermissionsIndex =
            indexes.pagePermissions;


          permissions =
            row[pagePermissionsIndex]
              ? JSON.parse(
                  row[pagePermissionsIndex]
                )
              : {};

        } catch (error) {}


        return {

          row: index + 2,

          email:
            row[indexes.email],

          name:
            row[indexes.name],

          active:
            String(
              row[indexes.active]
            )
              .toLowerCase() === 'true',

          role:
            normalizeRole_(
              row[indexes.role] ||
              'user'
            ),

          defaultPermission:
            normalizePermission_(
              row[indexes.defaultPermission] ||
              'view'
            ),

          permissions:
            permissions

        };

      }).filter(user => String(user.email || '').trim());


  return {
    users: users,
    pages:
      getPermissionPageList_(),
    controlledOptions:
      getControlledOptionsForSheet_(
        APP_USERS_SHEET
      ),
    breakglass:
      getBreakGlassAdmins_(),
    domainPolicy:
      getUserDomainPolicy_()
  };
}


function getPermissionPageList_() {

  const pages =
    getModuleDefinitions_()
    .filter(module => {

      if (
        !module.pageKey ||
        !isModuleEnabled_(
          module.id
        )
      ) {
        return false;
      }

      const page =
        APP_PAGE_CONFIG[
          module.pageKey
        ];

      return !!page &&
        !page.adminOnly;

    })
    .map(module => ({
      key:
        module.pageKey,
      label:
        APP_PAGE_CONFIG[module.pageKey].label,
      moduleId:
        module.id,
      classification:
        module.classification,
      optional:
        module.classification === 'optional'
    }));

  Object.keys(APP_PAGE_CONFIG)
    .forEach(pageKey => {

      const page =
        APP_PAGE_CONFIG[pageKey];

      if (
        !page.integrationId ||
        page.adminOnly ||
        !isPageEnabled_(
          pageKey
        )
      ) {
        return;
      }

      pages.push({
        key:
          pageKey,
        label:
          page.label,
        moduleId:
          '',
        integrationId:
          page.integrationId,
        classification:
          'integration',
        optional:
          true
      });

    });

  return pages;
}


function sanitizeAppUserPermissions_(
  permissions
) {

  const allowed = {};

  getPermissionPageList_()
    .forEach(page => {
      allowed[page.key] = true;
    });


  const sanitized = {};

  Object.keys(permissions || {})
    .forEach(key => {

      if (!allowed[key]) {
        return;
      }

      sanitized[key] =
        normalizePermission_(
          permissions[key]
        );

    });


  return sanitized;
}


function saveAppUser(user) {

  requireAdmin_();


  const email =
    String(user.email || '')
      .trim()
      .toLowerCase();


  if (!email) {
    throw new Error(
      'Email address is required.'
    );
  }


  if (!isValidEmail_(email)) {
    throw new Error(
      'Enter a valid email address.'
    );
  }


  validateUserDomainPolicy_(
    email
  );


  const sheet =
    ensureAppUsersSheet_();


  const indexes =
    getAppUsersHeaderIndexes_(
      sheet
    );


  const emailIndex =
    indexes.email;


  let targetRow = null;


  if (sheet.getLastRow() >= 2) {

    const emails =
      sheet
        .getRange(
          2,
          emailIndex + 1,
          sheet.getLastRow() - 1,
          1
        )
        .getDisplayValues();


    for (
      let index = 0;
      index < emails.length;
      index++
    ) {

      if (
        String(emails[index][0] || '')
          .trim()
          .toLowerCase() === email
      ) {

        targetRow =
          index + 2;

        break;

      }

    }

  }


  const rowObject = {
    'Email': email,
    'Name': String(user.name || '').trim(),
    'Active': user.active !== false,
    'Role': normalizeRole_(user.role || 'user'),
    'Default Permission':
      normalizePermission_(
        user.defaultPermission || 'view'
      ),
    'Page Permissions':
      JSON.stringify(
        sanitizeAppUserPermissions_(
          user.permissions || {}
        )
      ),
    'Notes': String(user.notes || '').trim()
  };


  const sheetHeaders =
    sheet
      .getRange(
        1,
        1,
        1,
        sheet.getLastColumn()
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      )
      .filter(Boolean);


  const values = [
    sheetHeaders.map(
      header =>
        rowObject[header] !== undefined
          ? rowObject[header]
          : ''
    )
  ];


  if (targetRow) {

    sheet
      .getRange(
        targetRow,
        1,
        1,
        sheetHeaders.length
      )
      .setValues(values);

  } else {

    sheet
      .getRange(
        sheet.getLastRow() + 1,
        1,
        1,
        sheetHeaders.length
      )
      .setValues(values);

  }

  delete APP_EXECUTION_METADATA.access[email];

  CacheService
    .getScriptCache()
    .remove(
      'app_access_' + email
  );

  return {
    status: 'success'
  };
}


function isValidEmail_(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(email || '')
  );
}


function getUserDomainPolicy_() {

  return {
    restrictionEnabled:
      AppConfig.getBoolean(
        'users.domain_restriction_enabled'
      ),
    allowedDomain:
      AppConfig.get(
        'users.allowed_domain'
      )
  };
}


function validateUserDomainPolicy_(email) {

  const policy =
    getUserDomainPolicy_();


  if (!policy.restrictionEnabled) {
    return true;
  }


  const domain =
    String(policy.allowedDomain || '')
      .trim()
      .toLowerCase()
      .replace(/^@/, '');


  if (!domain) {
    throw new Error(
      'Domain restriction is enabled, but no allowed domain is configured.'
    );
  }


  if (
    !String(email || '')
      .toLowerCase()
      .endsWith('@' + domain)
  ) {
    throw new Error(
      'This installation only allows accounts from @' +
      domain +
      '.'
    );
  }


  return true;
}


function deleteAppUser(email) {

  requireAdmin_();


  email =
    String(email || '')
      .trim()
      .toLowerCase();


  if (
    isBreakglassAdmin_(email)
  ) {
    throw new Error(
      'Break-glass administrators cannot be removed.'
    );
  }


  const sheet =
    ensureAppUsersSheet_();


  const indexes =
    getAppUsersHeaderIndexes_(
      sheet
    );


  if (sheet.getLastRow() < 2) {

    return {
      status: 'success'
    };

  }


  const emails =
    sheet
      .getRange(
        2,
        indexes.email + 1,
        sheet.getLastRow() - 1,
        1
      )
      .getDisplayValues();


  for (
    let index =
      emails.length - 1;

    index >= 0;

    index--
  ) {

    if (
      String(emails[index][0] || '')
        .trim()
        .toLowerCase() === email
    ) {

      sheet.deleteRow(
        index + 2
      );

    }

  }

  delete APP_EXECUTION_METADATA.access[email];

  CacheService
    .getScriptCache()
    .remove(
      'app_access_' + email
  );

  return {
    status: 'success'
  };
}

function rowHasMeaningfulData_(row, headers) {

  for (let i = 0; i < headers.length; i++) {

    const header = String(headers[i] || '').trim();

    if (!header || isCredentialHeader_(header)) {
      continue;
    }

    const value = String(row[i] || '').trim();

    if (!value) {
      continue;
    }

    /*
     * Google Sheets checkboxes / dropdown defaults can create
     * FALSE values hundreds of rows below the actual dataset.
     *
     * Treat FALSE by itself as an unused/default cell.
     */
    if (value.toLowerCase() === 'false') {
      continue;
    }

    return true;
  }

  return false;
}

function isManagedPageHeader_(pageKey, header) {
  if (/^Legacy: /i.test(header)) return false;
  const config = APP_PAGE_CONFIG[pageKey] || {};
  const definition = getNetworkDashboardSchema_()[config.sheet] || {};
  return !(definition.retiredHeaders || []).includes(header);
}
