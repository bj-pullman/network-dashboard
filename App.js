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

    defaultColumns: [
      'Status',
      'Device Label',
      'Model',
      'IP Address',
      'Role',
      'Stack Info',
      'Port Capacity (Active)',
      'Campus'
    ]
  },

  accessPoints: {
    key: 'accessPoints',
    label: 'Access Points',
    sheet: 'Access Points',
    type: 'table',
    icon: 'fa-wifi',
    group: 'Infrastructure',
    centralSync: true,

    defaultColumns: [
      'Status',
      'Device Label',
      'Model',
      'IP Address',
      'Active Clients',
      'Campus',
      'Management Mode'
    ]
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
      'IP Address',
      'Type',
      'Status',
      'Location',
      'ThreatDown Installed',
      'Wazuh Installed',
      'Notes'
    ]
  },

  routes: {
    key: 'routes',
    label: 'IP Route Tables',
    sheet: 'IP Route Tables',
    type: 'table',
    icon: 'fa-route',
    group: 'Infrastructure',

    defaultColumns: [
      'Destination',
      'Gateway',
      'VLAN',
      'Type',
      'SubType',
      'Metric',
      'Dist'
    ]
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
      'Service Type',
      'APSCN Device Name',
      '_bandwidth',
      '_publicIpSummary',
      'Gateway',
      '_monitorHealth',
      'Status'
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

    defaultColumns: [
      'Location',
      'Asset / System',
      'Category',
      'Type',
      'IP Address',
      'Username',
      'Server Location',
      'Notes'
    ]

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
        endColumn: 6,

        defaultColumns: [
          'Bus Name/Number',
          'DVR IP',
          'Bridge IP',
          'Bridge Mac',
          'Bus Type'
        ]
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

        defaultColumns: [
          'Location',
          'IP Address',
          'VLAN Name',
          'VLAN ID',
          'Username',
          'Password'
        ]
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
      'Size',
      'Backup Time',
      'Backup Job Name',
      'Target Location',
      'Wasabi Job',
      'Wasabi Schedule'
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
    name: 'IP Route Tables',
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

  const cache =
    CacheService.getScriptCache();

  const cached =
    cache.get(
      APP_MODULE_CACHE_KEY
    );


  if (cached) {
    try {
      return JSON.parse(cached);
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


  return states;
}


function invalidateModuleCache_() {

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


  if (!module) {
    return false;
  }


  return isModuleEnabled_(
    module.id
  );
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


  if (cached) {

    try {

      return JSON.parse(
        cached
      );

    } catch (error) {}

  }


  const sheet =
    ensureAppUsersSheet_();


  const indexes =
    getAppUsersHeaderIndexes_(
      sheet
    );


  const emailIndex =
    indexes.email;


  if (sheet.getLastRow() < 2) {

    return {
      authorized: false,
      admin: false,
      email: email,
      permissions: {}
    };

  }


  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getValues();


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


function getAppUsersHeaderIndexes_(sheet) {

  const headerMap =
    getAppUsersHeaderMap_(
      sheet
    );

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

  requirePageModuleEnabled_(
    pageKey
  );


  const access =
    getUserAccess_(getCurrentUserEmail_());


  if (!access.authorized) {
    throw new Error('Unauthorized access.');
  }


  if (access.admin) {
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

    config:
      clientConfig

  };
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


function getClientTemplateNameForPageType_(
  type
) {

  const templates = {
    table: 'TablePage',
    internetWan: 'InternetWan',
    structured: 'StructuredPage',
    workflow: 'DepartmentWorkflow',
    users: 'UserManagement',
    settings: 'Settings'
  };

  return templates[type] || '';
}


function appGetPageClientTemplate(
  pageKey
) {

  return withPerformanceTiming_(
    'appGetPageClientTemplate:' + pageKey,
    function() {

      const config =
        APP_PAGE_CONFIG[pageKey];


      if (!config) {
        throw new Error(
          'Unknown application page.'
        );
      }


      requirePagePermission_(
        pageKey,
        'view'
      );


      const templateName =
        getClientTemplateNameForPageType_(
          config.type
        );


      if (!templateName) {
        return '';
      }


      return include(
        templateName
      );

    }
  );
}


/*******************************************************
 * PAGE ROUTER
 *******************************************************/

function appGetPageData(pageKey, forceRefresh) {

  return withPerformanceTiming_(
    'appGetPageData:' + pageKey,
    function() {

      const config =
        APP_PAGE_CONFIG[pageKey];


      if (!config) {
        throw new Error(
          'Unknown application page.'
        );
      }


      requirePagePermission_(
        pageKey,
        'view'
      );


      if (config.type === 'dashboard') {
        return getAppDashboardData_(
          forceRefresh
        );
      }


      if (config.type === 'workflow') {
        return getDepartmentWorkflowData_(
          forceRefresh
        );
      }


      if (config.type === 'internetWan') {
        return getInternetWanPageData_(
          forceRefresh
        );
      }


      if (config.type === 'users') {
        return getAppUsers_();
      }


      if (config.type === 'settings') {
        return getSettingsPageData_();
      }


      if (config.type === 'structured') {
        return getStructuredPageData_(
          pageKey,
          forceRefresh
        );
      }

      return getAppTableData_(
        pageKey,
        forceRefresh
      );

    }
  );
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


function getStructuredPageReadColumnCount_(
  config,
  fallback
) {

  let columnCount =
    getNetworkDashboardReadColumnCount_(
      config.sheet,
      fallback,
      true
    );


  (config.sections || [])
    .forEach(section => {

      if (section.endColumn) {

        columnCount =
          Math.max(
            columnCount,
            Number(section.endColumn)
          );

        return;
      }


      const startColumn =
        Number(section.startColumn || 1);

      const defaultColumnCount =
        (section.defaultColumns || []).length;


      if (defaultColumnCount) {
        columnCount =
          Math.max(
            columnCount,
            startColumn +
              defaultColumnCount -
              1
          );
      }

    });


  return Math.max(
    columnCount,
    1
  );
}


function getStructuredPageMinimumRows_(config) {

  let rowCount =
    1;


  (config.sections || [])
    .forEach(section => {

      rowCount =
        Math.max(
          rowCount,
          Number(section.headerRow || 0),
          Number(section.startRow || 0),
          Number(section.endRow || 0)
        );

    });


  return rowCount;
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


function readConfiguredPageValues_(
  sheet,
  config
) {

  if (
    config &&
    config.type === 'structured'
  ) {

    return readAppSheetDisplayValues_(
      sheet,
      getStructuredPageReadColumnCount_(
        config,
        sheet.getLastColumn()
      ),
      getStructuredPageMinimumRows_(
        config
      )
    );

  }


  return readAppSheetDisplayValues_(
    sheet,
    getNetworkDashboardReadColumnCount_(
      config ? config.sheet : sheet.getName(),
      sheet.getLastColumn(),
      true
    ),
    1
  );
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


  const cacheKey =
    'app_page_' + pageKey;


  if (!forceRefresh) {

    const cached =
      cache.get(cacheKey);


    if (cached) {

      try {

        return JSON.parse(
          cached
        );

      } catch (error) {}

    }

  }


  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        config.sheet
      );


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


  const rawHeaders =
    values[0]
      .map(
        value =>
          String(value || '').trim()
      );


  const columns =
    [];


  rawHeaders.forEach(
    (header, index) => {

      if (
        header &&
        !isCredentialHeader_(header)
      ) {

        columns.push({
          header: header,
          sourceIndex: index
        });

      }

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
      getPagePermission_(pageKey),

    hasCredentials:
      rawHeaders.some(
        isCredentialHeader_
      )

  };


  cacheJson_(
    cacheKey,
    result,
    300
  );


  return result;
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

        return JSON.parse(
          cached
        );

      } catch (error) {}

    }

  }


  const ss =
    SpreadsheetApp
      .getActiveSpreadsheet();


  const activeSheet =
    ss.getSheetByName(
      config.sheet
    );


  const offlineSheet =
    ss.getSheetByName(
      config.offlineSheet
    );


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
      getPagePermission_(
        pageKey
      ),

    hasCredentials:
      activeData.hasCredentials ||
      offlineData.hasCredentials,

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


  return result;
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


  const values =
    readAppSheetDisplayValues_(
      sheet,
      getNetworkDashboardReadColumnCount_(
        sheet.getName(),
        sheet.getLastColumn(),
        true
      ),
      1
    );


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


  rawHeaders.forEach(
    (header, index) => {

      if (
        header &&
        !isCredentialHeader_(
          header
        )
      ) {

        columns.push({

          header:
            header,

          sourceIndex:
            index

        });

      }

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
      _sourceSheet:
        sheet.getName(),

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
      rawHeaders.some(
        isCredentialHeader_
      )

  };
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
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(config.sheet);


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
      getPagePermission_(pageKey),

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

      if (!header) {
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

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      'Dashboard'
    );


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

  const rowCount =
    Math.max(
      getDashboardReadRowCount_(),
      sheet.getLastRow()
    );

  const columnCount =
    Math.max(
      getDashboardSheetHeaders_().length,
      8
    );

  const values =
    sheet
      .getRange(
        1,
        1,
        rowCount,
        columnCount
      )
      .getDisplayValues();

  const metricMap =
    readDashboardMetricMap_(
      values
    );

  return {
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
}


function getEmptyDashboardData_() {

  return {
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
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        config.sheet
      );

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
    300
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

  row._bandwidth =
    formatInternetWanBandwidth_(
      row['Download Bandwidth'],
      row['Upload Bandwidth']
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
      !!forceRefresh,
    allowFetch:
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

  requirePagePermission_(
    'internetWan',
    'view'
  );

  const monitoring =
    getInternetWanMonitoringSnapshot_(
      true
    );

  if (monitoring.status === 'fresh') {
    updateIntegrationRuntimeStatus_(
      'uptimerobot',
      monitoring.fetchedAt || '',
      'Monitor health refresh succeeded'
    );
  } else if (monitoring.status === 'error') {
    updateIntegrationRuntimeStatus_(
      'uptimerobot',
      '',
      'Monitor health refresh failed'
    );
  }

  return monitoring;
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
    maintenance: 0,
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


function formatInternetWanBandwidth_(
  download,
  upload
) {

  const down =
    formatInternetWanBandwidthValue_(
      download
    );

  const up =
    formatInternetWanBandwidthValue_(
      upload
    );

  if (
    !down &&
    !up
  ) {
    return '';
  }

  return (
    down || '0 Mbps'
  ) +
    ' / ' +
    (
      up || '0 Mbps'
    );
}


function formatInternetWanBandwidthValue_(
  value
) {

  const number =
    Number(
      String(value || '')
        .replace(/,/g, '')
    );

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return '';
  }

  if (
    number >= 1000 &&
    number % 1000 === 0
  ) {
    return (
      number / 1000
    ) +
      ' Gbps';
  }

  return number +
    ' Mbps';
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
    'Download Bandwidth':
      normalizeInternetWanBandwidth_(
        record['Download Bandwidth'],
        'Download Bandwidth'
      ),
    'Upload Bandwidth':
      normalizeInternetWanBandwidth_(
        record['Upload Bandwidth'],
        'Upload Bandwidth'
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

  const number =
    Number(
      text.replace(/,/g, '')
    );

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    throw new Error(
      label +
      ' must be a positive numeric Mbps value.'
    );
  }

  return number;
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
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        'Department Workflow'
      );


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


  const data =
    readAppSheetDisplayValues_(
      sheet,
      getNetworkDashboardReadColumnCount_(
        'Department Workflow',
        sheet.getLastColumn(),
        false
      ),
      30
    );


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


      if (
        name &&
        !isCredentialHeader_(
          name
        ) &&
        Object.prototype
          .hasOwnProperty
          .call(
            record,
            name
          )
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
        !name ||
        isCredentialHeader_(name)
      ) {
        return '';
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
      JSON.stringify(value);


    /*
     * Apps Script Cache has per-entry size limits.
     * Don't let a large table break the request just because
     * it can't be cached.
     */
    if (json.length < 90000) {

      CacheService
        .getScriptCache()
        .put(
          key,
          json,
          seconds
        );

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


  const sheet =
    ensureAppUsersSheet_();


  const indexes =
    getAppUsersHeaderIndexes_(
      sheet
    );


  if (sheet.getLastRow() < 2) {

    return {
      users: [],
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


  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getDisplayValues();


  const users =
    values
      .filter(row =>
        String(
          row[indexes.email] || ''
        ).trim()
      )
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

      });


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

  return getModuleDefinitions_()
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
