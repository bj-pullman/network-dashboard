var NETWORK_DASHBOARD_VERSION = '1.0.0';
var NETWORK_DASHBOARD_SCHEMA_VERSION = '1';
var NETWORK_DASHBOARD_APP_NAME = 'Network Dashboard';
var NETWORK_DASHBOARD_SETTINGS_SHEET = 'App Settings';
var NETWORK_DASHBOARD_BREAK_GLASS_ADMINS_PROPERTY =
  'NETWORK_DASHBOARD_BREAK_GLASS_ADMINS';


function getBreakGlassAdmins_() {

  const value =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        NETWORK_DASHBOARD_BREAK_GLASS_ADMINS_PROPERTY
      );


  return String(value || '')
    .split(',')
    .map(email =>
      email.trim().toLowerCase()
    )
    .filter(Boolean);
}


function getAppSettingsSheetHeaders_() {

  return [
    'Key',
    'Value',
    'Type',
    'Category',
    'Label',
    'Description',
    'Updated At',
    'Updated By'
  ];
}


function getAppSettingDefinitions_() {

  const definitions = [
    {
      key: 'app.name',
      label: 'Application Name',
      category: 'General',
      type: 'text',
      defaultValue: NETWORK_DASHBOARD_APP_NAME,
      editable: true,
      description: 'Displayed application name.'
    },
    {
      key: 'app.version',
      label: 'Application Version',
      category: 'System',
      type: 'text',
      defaultValue: NETWORK_DASHBOARD_VERSION,
      editable: false,
      description: 'Installed application version.'
    },
    {
      key: 'app.web_app_url',
      label: 'Web App URL',
      category: 'General',
      type: 'url',
      defaultValue: '',
      editable: true,
      description: 'Optional deployed Apps Script web app URL.'
    },
    {
      key: 'schema.version',
      label: 'Schema Version',
      category: 'System',
      type: 'text',
      defaultValue: NETWORK_DASHBOARD_SCHEMA_VERSION,
      editable: false,
      description: 'Installed schema version.'
    },
    {
      key: 'dashboard.widgets',
      label: 'Dashboard Widgets',
      category: 'Dashboard',
      type: 'json',
      defaultValue: '',
      editable: false,
      description: 'Managed dashboard widget visibility and order configuration.'
    },
    {
      key: 'organization.name',
      label: 'Organization Name',
      category: 'General',
      type: 'text',
      defaultValue: '',
      editable: true,
      description: 'Organization using this installation.'
    },
    {
      key: 'organization.short_name',
      label: 'Organization Short Name',
      category: 'General',
      type: 'text',
      defaultValue: '',
      editable: true,
      description: 'Short organization label used in compact UI.'
    },
    {
      key: 'branding.logo_url',
      label: 'Logo URL',
      category: 'Branding',
      type: 'url',
      defaultValue: '',
      editable: true,
      description: 'Public image URL or Google Drive thumbnail URL.'
    },
    {
      key: 'branding.favicon_url',
      label: 'Favicon URL',
      category: 'Branding',
      type: 'url',
      defaultValue: '',
      editable: true,
      description: 'Public http or https image URL used for the browser tab icon.'
    },
    {
      key: 'branding.primary_color',
      label: 'Primary Color',
      category: 'Branding',
      type: 'color',
      defaultValue: '#17345f',
      editable: true,
      description: 'Sidebar top section, primary buttons, primary icons and primary chart styling.'
    },
    {
      key: 'branding.secondary_color',
      label: 'Secondary Color',
      category: 'Branding',
      type: 'color',
      defaultValue: '#0d2342',
      editable: true,
      description: 'Secondary buttons, lower sidebar/nav treatment and secondary theme surfaces.'
    },
    {
      key: 'branding.accent_color',
      label: 'Accent Color',
      category: 'Branding',
      type: 'color',
      defaultValue: '#f4c430',
      editable: true,
      description: 'Active navigation, page accents, breadcrumb accents, logo accents and emphasis elements.'
    },
    {
      key: 'branding.header_font_color',
      label: 'Header Font Color',
      category: 'Branding',
      type: 'color',
      defaultValue: '#0d2342',
      editable: true,
      description: 'Primary page title and breadcrumb/path header text only.'
    },
    {
      key: 'regional.timezone',
      label: 'Timezone',
      category: 'Regional',
      type: 'timezone',
      defaultValue: getDefaultTimezone_(),
      editable: true,
      description: 'Timezone used for setup and status timestamps.'
    },
    {
      key: 'regional.date_format',
      label: 'Date Format',
      category: 'Regional',
      type: 'select',
      defaultValue: 'yyyy-MM-dd',
      editable: true,
      options: [
        'yyyy-MM-dd',
        'MM/dd/yyyy',
        'dd/MM/yyyy'
      ],
      description: 'Preferred date display format.'
    },
    {
      key: 'regional.time_format',
      label: 'Time Format',
      category: 'Regional',
      type: 'select',
      defaultValue: 'HH:mm',
      editable: true,
      options: [
        'HH:mm',
        'h:mm a'
      ],
      description: 'Preferred time display format.'
    },
    {
      key: 'users.domain_restriction_enabled',
      label: 'Restrict User Domain',
      category: 'User Policy',
      type: 'boolean',
      defaultValue: 'false',
      editable: true,
      description: 'When true, new users must belong to the allowed domain.'
    },
    {
      key: 'users.allowed_domain',
      label: 'Allowed Email Domain',
      category: 'User Policy',
      type: 'domain',
      defaultValue: '',
      editable: true,
      description: 'Domain allowed when user-domain restriction is enabled.'
    }
  ];


  if (
    typeof getModuleSettingDefinitions_ === 'function'
  ) {
    return definitions.concat(
      getModuleSettingDefinitions_()
    );
  }


  return definitions;
}


function getDefaultTimezone_() {

  try {

    const spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    if (
      spreadsheet &&
      spreadsheet.getSpreadsheetTimeZone()
    ) {
      return spreadsheet.getSpreadsheetTimeZone();
    }

  } catch (error) {}


  try {
    return Session.getScriptTimeZone() || 'Etc/UTC';
  } catch (error) {
    return 'Etc/UTC';
  }
}


var AppConfig = (function() {

  const CACHE_KEY =
    'network_dashboard_app_settings';


  function definitionsByKey_() {

    const map = {};

    getAppSettingDefinitions_()
      .forEach(definition => {
        map[definition.key] = definition;
      });

    return map;
  }


  function defaults_() {

    const values = {};

    getAppSettingDefinitions_()
      .forEach(definition => {
        values[definition.key] =
          String(definition.defaultValue || '');
      });

    return values;
  }


  function readSheetValues_() {

    const ss =
      SpreadsheetApp.getActiveSpreadsheet();

    const sheet =
      ss.getSheetByName(
        NETWORK_DASHBOARD_SETTINGS_SHEET
      );


    if (
      !sheet ||
      sheet.getLastRow() < 2
    ) {
      return {};
    }


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


    const keyIndex =
      headers.indexOf('Key');


    const valueIndex =
      headers.indexOf('Value');


    if (
      keyIndex < 0 ||
      valueIndex < 0
    ) {
      return {};
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


    const result = {};


    values.forEach(row => {

      const key =
        String(row[keyIndex] || '').trim();

      if (key) {
        result[key] =
          String(row[valueIndex] || '');
      }

    });


    return result;
  }


  function getAll() {

    try {

      const cached =
        CacheService
          .getScriptCache()
          .get(CACHE_KEY);

      if (cached) {
        return JSON.parse(cached);
      }

    } catch (error) {}


    const values =
      Object.assign(
        defaults_(),
        readSheetValues_()
      );


    values['app.version'] =
      NETWORK_DASHBOARD_VERSION;

    values['schema.version'] =
      NETWORK_DASHBOARD_SCHEMA_VERSION;


    try {
      CacheService
        .getScriptCache()
        .put(
          CACHE_KEY,
          JSON.stringify(values),
          300
        );
    } catch (error) {}


    return values;
  }


  function get(key) {

    const values =
      getAll();

    return Object.prototype
      .hasOwnProperty
      .call(
        values,
        key
      )
      ? values[key]
      : '';
  }


  function getBoolean(key) {

    const value =
      String(get(key) || '')
        .trim()
        .toLowerCase();

    return (
      value === 'true' ||
      value === 'yes' ||
      value === '1'
    );
  }


  function ensureSheet_() {

    const ss =
      SpreadsheetApp.getActiveSpreadsheet();

    let sheet =
      ss.getSheetByName(
        NETWORK_DASHBOARD_SETTINGS_SHEET
      );

    if (!sheet) {
      sheet =
        ss.insertSheet(
          NETWORK_DASHBOARD_SETTINGS_SHEET
        );
    }


    const headers =
      getAppSettingsSheetHeaders_();


    const existingWidth =
      Math.max(
        sheet.getLastColumn(),
        1
      );

    const existing =
      sheet
        .getRange(
          1,
          1,
          1,
          existingWidth
        )
        .getDisplayValues()[0]
        .map(value =>
          String(value || '').trim()
        );

    if (!existing.some(Boolean)) {

      sheet
        .getRange(
          1,
          1,
          1,
          headers.length
        )
        .setValues([
          headers
        ]);

    } else {

      while (
        existing.length &&
        !existing[existing.length - 1]
      ) {
        existing.pop();
      }

      headers.forEach(header => {

        if (!existing.includes(header)) {

          sheet
            .getRange(
              1,
              existing.length + 1
            )
            .setValue(header);

          existing.push(header);

        }

      });

    }


    return sheet;
  }


  function rowMap_(sheet) {

    const map = {};

    if (sheet.getLastRow() < 2) {
      return map;
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


    values.forEach((row, index) => {

      const key =
        String(row[0] || '').trim();

      if (key) {
        map[key] = index + 2;
      }

    });


    return map;
  }


  function normalizeValue_(definition, rawValue) {

    let value =
      String(rawValue == null ? '' : rawValue)
        .trim();


    if (definition.type === 'boolean') {
      return (
        rawValue === true ||
        value.toLowerCase() === 'true' ||
        value.toLowerCase() === 'yes' ||
        value === '1'
      )
        ? 'true'
        : 'false';
    }


    if (definition.type === 'color') {

      if (
        !/^#[0-9a-fA-F]{6}$/.test(value)
      ) {
        throw new Error(
          definition.label +
          ' must be a hex color like #17345f.'
        );
      }

      return value.toLowerCase();
    }


    if (
      definition.type === 'url' &&
      value &&
      !/^https?:\/\//i.test(value)
    ) {
      throw new Error(
        definition.label +
        ' must be a valid http or https URL.'
      );
    }


    if (definition.type === 'domain') {
      value =
        value
          .replace(/^@/, '')
          .toLowerCase();

      if (
        value &&
        !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value)
      ) {
        throw new Error(
          definition.label +
          ' must be a valid domain such as example.org.'
        );
      }

      return value;
    }


    if (
      definition.type === 'select' &&
      definition.options &&
      !definition.options.includes(value)
    ) {
      throw new Error(
        definition.label +
        ' has an unsupported value.'
      );
    }


    if (
      definition.type === 'json' &&
      value
    ) {

      try {
        JSON.parse(value);
      } catch (error) {
        throw new Error(
          definition.label +
          ' must contain valid JSON.'
        );
      }

      return value;
    }


    if (
      definition.type === 'timezone' &&
      !value
    ) {
      throw new Error(
        'Timezone is required.'
      );
    }


    return value;
  }


  function upsert_(key, value, updatedBy) {

    const definitions =
      definitionsByKey_();

    const definition =
      definitions[key];

    if (!definition) {
      throw new Error(
        'Unknown setting: ' + key
      );
    }


    const normalizedValue =
      normalizeValue_(
        definition,
        value
      );


    const sheet =
      ensureSheet_();

    const rows =
      rowMap_(sheet);

    const now =
      new Date();

    const output = [[
      key,
      normalizedValue,
      definition.type,
      definition.category,
      definition.label,
      definition.description || '',
      now,
      updatedBy || ''
    ]];


    const row =
      rows[key] ||
      sheet.getLastRow() + 1;

    sheet
      .getRange(
        row,
        1,
        1,
        output[0].length
      )
      .setValues(output);


    invalidate_();

    return normalizedValue;
  }


  function setMany(values, updatedBy) {

    const definitions =
      definitionsByKey_();

    const keys =
      Object.keys(values || {});

    if (!keys.length) {
      return getAll();
    }


    const sheet =
      ensureSheet_();

    const rows =
      rowMap_(sheet);

    const width =
      getAppSettingsSheetHeaders_().length;

    const now =
      new Date();

    const lastRow =
      sheet.getLastRow();

    const updates =
      [];

    const appends =
      [];

    keys.forEach(key => {

        const definition =
          definitions[key];

        if (
          !definition ||
          !definition.editable
        ) {
          throw new Error(
            'Setting cannot be edited: ' + key
          );
        }

        const normalizedValue =
          normalizeValue_(
            definition,
            values[key]
          );

        const output = [
          key,
          normalizedValue,
          definition.type,
          definition.category,
          definition.label,
          definition.description || '',
          now,
          updatedBy || ''
        ];

        if (rows[key]) {
          updates.push({
            row: rows[key],
            values: output
          });
        } else {
          appends.push(
            output
          );

          rows[key] =
            lastRow +
            appends.length;
        }

      });

    updates.sort((a, b) =>
      a.row - b.row
    );

    let group =
      [];

    function flushGroup_() {

      if (!group.length) {
        return;
      }

      sheet
        .getRange(
          group[0].row,
          1,
          group.length,
          width
        )
        .setValues(
          group.map(item =>
            item.values
          )
        );

      group =
        [];
    }

    updates.forEach(item => {

      if (
        group.length &&
        item.row !==
          group[group.length - 1].row + 1
      ) {
        flushGroup_();
      }

      group.push(
        item
      );

    });

    flushGroup_();

    if (appends.length) {
      sheet
        .getRange(
          lastRow + 1,
          1,
          appends.length,
          width
        )
        .setValues(
          appends
        );
    }

    invalidate_();

    return getAll();
  }


  function setSystemValue_(key, value, updatedBy) {

    return upsert_(
      key,
      value,
      updatedBy || 'setup'
    );
  }


  function seedMissing_() {

    const existing =
      readSheetValues_();

    getAppSettingDefinitions_()
      .forEach(definition => {

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              existing,
              definition.key
            )
        ) {
          return;
        }

        upsert_(
          definition.key,
          definition.defaultValue,
          'setup'
        );

        existing[definition.key] =
          String(definition.defaultValue || '');

      });

    setSystemValue_(
      'app.version',
      NETWORK_DASHBOARD_VERSION,
      'setup'
    );

    setSystemValue_(
      'schema.version',
      NETWORK_DASHBOARD_SCHEMA_VERSION,
      'setup'
    );

    return getAll();
  }


  function invalidate_() {

    try {
      CacheService
        .getScriptCache()
        .remove(CACHE_KEY);
    } catch (error) {}
  }


  function getClientConfig_() {

    const values =
      getAll();

    return {
      appName:
        values['app.name'] ||
        NETWORK_DASHBOARD_APP_NAME,
      applicationVersion:
        NETWORK_DASHBOARD_VERSION,
      schemaVersion:
        NETWORK_DASHBOARD_SCHEMA_VERSION,
      webAppUrl:
        values['app.web_app_url'] || '',
      organization: {
        name:
          values['organization.name'] || '',
        shortName:
          values['organization.short_name'] || ''
      },
      branding: {
        logoUrl:
          values['branding.logo_url'] || '',
        faviconUrl:
          values['branding.favicon_url'] || '',
        primaryColor:
          values['branding.primary_color'] || '#17345f',
        secondaryColor:
          values['branding.secondary_color'] || '#0d2342',
        accentColor:
          values['branding.accent_color'] || '#f4c430',
        headerFontColor:
          values['branding.header_font_color'] || '#0d2342'
      },
      regional: {
        timezone:
          values['regional.timezone'] || getDefaultTimezone_(),
        dateFormat:
          values['regional.date_format'] || 'yyyy-MM-dd',
        timeFormat:
          values['regional.time_format'] || 'HH:mm'
      },
      userPolicy: {
        domainRestrictionEnabled:
          String(
            values['users.domain_restriction_enabled'] ||
            'false'
          ) === 'true',
        allowedDomain:
          values['users.allowed_domain'] || ''
      }
    };
  }


  return {
    get: get,
    getAll: getAll,
    getBoolean: getBoolean,
    setMany: setMany,
    setSystemValue_: setSystemValue_,
    seedMissing_: seedMissing_,
    invalidate_: invalidate_,
    getClientConfig_: getClientConfig_
  };

})();


function getSettingsPageData_() {

  const access =
    requireAdmin_();

  const config =
    AppConfig.getClientConfig_();

  return {
    settings: {
      values:
        AppConfig.getAll(),
      definitions:
        getAppSettingDefinitions_()
          .filter(definition =>
            definition.editable
          )
    },
    config:
      config,
    modules:
      getModuleStatusList_({
        includeCore: false
      }),
    bootstrap:
      buildAppBootstrap_(
        access,
        config
      ),
    integrations:
      getIntegrationStatusList_()
  };
}


function saveAppSettings(settings) {

  const access =
    requireAdmin_();

  const beforeModules =
    getModuleStateMap_();

  AppConfig.setMany(
    settings || {},
    access.email
  );

  invalidateModuleCache_();

  const afterModules =
    getModuleStateMap_();

  const moduleStateChanged =
    haveModuleStatesChanged_(
      beforeModules,
      afterModules
    );

  if (
    moduleStateChanged &&
    typeof ensureEnabledOptionalModuleSheets_ === 'function'
  ) {
    ensureEnabledOptionalModuleSheets_();
  }

  clearAppDataCaches_();

  const data =
    getSettingsPageData_();

  data.moduleStateChanged =
    moduleStateChanged;

  return data;
}


function appValidateNetworkDashboard() {

  requireAdmin_();

  return validateNetworkDashboard();
}
