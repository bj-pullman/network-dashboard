function getAppIntegrationsSheetHeaders_() {

  return [
    'Integration ID',
    'Display Name',
    'Enabled',
    'Implementation Status',
    'Last Sync',
    'Last Status',
    'Config JSON',
    'Notes'
  ];
}


function getIntegrationRegistry_() {

  return {
    aruba_central: {
      id: 'aruba_central',
      name: 'Aruba Central',
      description:
        'Synchronizes switch and access point inventory from Aruba Central.',
      implementationStatus: 'available',
      capabilities: [
        'Switch inventory sync',
        'Access point inventory sync',
        'Running configuration lookup'
      ],
      requiredProperties: [
        {
          key: 'ARUBA_CLIENT_ID',
          label: 'Client ID'
        },
        {
          key: 'ARUBA_CLIENT_SECRET',
          label: 'Client Secret'
        },
        {
          key: 'ARUBA_REFRESH_TOKEN',
          label: 'Refresh Token'
        }
      ],
      optionalProperties: [],
      settings: [],
      supportsSync: true,
      supportsConnectionTest: true
    },

    threatdown: {
      id: 'threatdown',
      name: 'ThreatDown',
      description:
        'Checks endpoint inventory from ThreatDown and marks matching server records.',
      implementationStatus: 'partial',
      capabilities: [
        'Basic endpoint inventory match',
        'Server ThreatDown Installed field update'
      ],
      requiredProperties: [
        {
          key: 'THREATDOWN_ACCOUNT_ID',
          label: 'Account ID'
        },
        {
          key: 'THREATDOWN_CLIENT_ID',
          label: 'Client ID'
        },
        {
          key: 'THREATDOWN_CLIENT_SECRET',
          label: 'Client Secret'
        }
      ],
      optionalProperties: [],
      settings: [],
      supportsSync: true,
      supportsConnectionTest: true,
      notes:
        'Partial implementation: endpoint inventory matching exists; broader ThreatDown management, alerting and reporting are not implemented yet.'
    }
  };
}


function getIntegrationDefinition_(
  integrationId
) {

  const registry =
    getIntegrationRegistry_();

  const definition =
    registry[integrationId];

  if (!definition) {
    throw new Error(
      'Unknown integration: ' + integrationId
    );
  }

  return definition;
}


function ensureAppIntegrationsSheet_() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  let sheet =
    ss.getSheetByName(
      'App Integrations'
    );

  if (!sheet) {
    sheet =
      ss.insertSheet(
        'App Integrations'
      );
  }


  const headers =
    getAppIntegrationsSheetHeaders_();


  const currentWidth =
    Math.max(
      sheet.getLastColumn(),
      headers.length
    );

  const current =
    sheet
      .getRange(
        1,
        1,
        1,
        currentWidth
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );


  if (!current.some(Boolean)) {

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
      current.length &&
      !current[current.length - 1]
    ) {
      current.pop();
    }

    headers.forEach(header => {

      if (!current.includes(header)) {

        sheet
          .getRange(
            1,
            current.length + 1
          )
          .setValue(header);

        current.push(header);

      }

    });

  }


  sheet.setFrozenRows(1);

  return sheet;
}


function seedIntegrationDefinitions_() {

  const sheet =
    ensureAppIntegrationsSheet_();

  const state =
    readIntegrationStateMap_(true);

  const registry =
    getIntegrationRegistry_();


  Object.keys(registry)
    .forEach(id => {

      if (state[id]) {
        return;
      }

      upsertIntegrationRow_(
        id,
        {
          enabled: false,
          lastSync: '',
          lastStatus: 'Not configured',
          configJson: '{}',
          notes: registry[id].notes || ''
        },
        sheet
      );

    });
}


function readIntegrationStateMap_(
  createIfMissing
) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    createIfMissing
      ? ensureAppIntegrationsSheet_()
      : ss.getSheetByName(
          'App Integrations'
        );

  const map = {};

  if (
    !sheet ||
    sheet.getLastRow() < 2
  ) {
    return map;
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


  const index = {};

  headers.forEach((header, columnIndex) => {
    if (header) {
      index[header] = columnIndex;
    }
  });


  const expectedHeaders =
    getAppIntegrationsSheetHeaders_();

  const integrationIdIndex =
    getRequiredHeaderIndex_(
      index,
      'Integration ID',
      'App Integrations',
      expectedHeaders
    );

  const enabledIndex =
    getRequiredHeaderIndex_(
      index,
      'Enabled',
      'App Integrations',
      expectedHeaders
    );

  const lastSyncIndex =
    getRequiredHeaderIndex_(
      index,
      'Last Sync',
      'App Integrations',
      expectedHeaders
    );

  const lastStatusIndex =
    getRequiredHeaderIndex_(
      index,
      'Last Status',
      'App Integrations',
      expectedHeaders
    );

  const configJsonIndex =
    getRequiredHeaderIndex_(
      index,
      'Config JSON',
      'App Integrations',
      expectedHeaders
    );

  const notesIndex =
    getRequiredHeaderIndex_(
      index,
      'Notes',
      'App Integrations',
      expectedHeaders
    );


  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .getDisplayValues();


  values.forEach((row, offset) => {

    const id =
      String(
        row[integrationIdIndex] || ''
      ).trim();

    if (!id) {
      return;
    }

    map[id] = {
      row: offset + 2,
      enabled:
        normalizeBooleanText_(
          row[enabledIndex]
        ),
      lastSync:
        row[lastSyncIndex] || '',
      lastStatus:
        row[lastStatusIndex] || '',
      configJson:
        row[configJsonIndex] || '{}',
      notes:
        row[notesIndex] || ''
    };

  });


  return map;
}


function getIntegrationStatusList_() {

  const registry =
    getIntegrationRegistry_();

  const state =
    readIntegrationStateMap_(false);

  const props =
    PropertiesService.getScriptProperties();


  return Object.keys(registry)
    .map(id => {

      const definition =
        registry[id];

      const itemState =
        state[id] || {};

      const requiredProperties =
        (definition.requiredProperties || [])
          .map(property => ({
            key: property.key,
            label: property.label || property.key,
            required: true,
            configured:
              !!props.getProperty(
                property.key
              )
          }));

      const optionalProperties =
        (definition.optionalProperties || [])
          .map(property => ({
            key: property.key,
            label: property.label || property.key,
            required: false,
            configured:
              !!props.getProperty(
                property.key
              )
          }));

      const configurationComplete =
        requiredProperties.every(
          property =>
            property.configured
        );

      return {
        id: definition.id,
        name: definition.name,
        description: definition.description,
        implementationStatus:
          definition.implementationStatus,
        capabilities:
          definition.capabilities || [],
        enabled:
          !!itemState.enabled,
        configurationComplete:
          configurationComplete,
        requiredProperties:
          requiredProperties,
        optionalProperties:
          optionalProperties,
        settings:
          definition.settings || [],
        supportsSync:
          !!definition.supportsSync,
        supportsConnectionTest:
          !!definition.supportsConnectionTest,
        lastSync:
          itemState.lastSync || '',
        lastStatus:
          itemState.lastStatus || '',
        notes:
          definition.notes || itemState.notes || ''
      };

    });
}


function saveIntegrationConfig(
  integrationId,
  config
) {

  requireAdmin_();

  const definition =
    getIntegrationDefinition_(
      integrationId
    );

  const desiredEnabled =
    !!(config && config.enabled);

  if (
    desiredEnabled &&
    !getIntegrationStatusById_(
      integrationId
    ).configurationComplete
  ) {
    throw new Error(
      definition.name +
      ' cannot be enabled until all required Script Properties are configured.'
    );
  }

  const safeSettings =
    {};

  const allowedSettings =
    {};

  (definition.settings || [])
    .forEach(setting => {
      allowedSettings[setting.key] = setting;
    });


  Object.keys(
    (config && config.settings) || {}
  )
    .forEach(key => {

      if (!allowedSettings[key]) {
        throw new Error(
          'Unsupported integration setting: ' +
          key
        );
      }

      safeSettings[key] =
        String(
          config.settings[key] || ''
        );

    });


  upsertIntegrationRow_(
    integrationId,
    {
      enabled:
        desiredEnabled,
      configJson:
        JSON.stringify(safeSettings)
    }
  );

  return getSettingsPageData_();
}


function testIntegrationConnection(
  integrationId
) {

  requireAdmin_();

  const status =
    getIntegrationStatusById_(
      integrationId
    );

  if (!status.configurationComplete) {
    return {
      status: 'not_configured',
      message:
        status.name +
        ' is missing required Script Properties.'
    };
  }


  try {

    if (integrationId === 'aruba_central') {

      getArubaCentralToken_();

      updateIntegrationRuntimeStatus_(
        integrationId,
        '',
        'Connection test succeeded'
      );

      return {
        status: 'success',
        message:
          'Aruba Central token exchange succeeded.'
      };

    }


    if (integrationId === 'threatdown') {

      testThreatDownConnection_();

      updateIntegrationRuntimeStatus_(
        integrationId,
        '',
        'Connection test succeeded'
      );

      return {
        status: 'success',
        message:
          'ThreatDown token exchange succeeded.'
      };

    }


    return {
      status: 'unsupported',
      message:
        'This integration does not have a connection test.'
    };

  } catch (error) {

    updateIntegrationRuntimeStatus_(
      integrationId,
      '',
      'Connection test failed'
    );

    return {
      status: 'error',
      message:
        error.message ||
        'Connection test failed.'
    };

  }
}


function runIntegrationSync(
  integrationId
) {

  requireAdmin_();

  if (integrationId === 'aruba_central') {
    return syncArubaCentralToSheet();
  }

  if (integrationId === 'threatdown') {
    return syncThreatDownToSheet();
  }

  throw new Error(
    'This integration does not support sync: ' +
    integrationId
  );
}


function getIntegrationStatusById_(
  integrationId
) {

  const status =
    getIntegrationStatusList_()
      .find(item =>
        item.id === integrationId
      );

  if (!status) {
    throw new Error(
      'Unknown integration: ' +
      integrationId
    );
  }

  return status;
}


function upsertIntegrationRow_(
  integrationId,
  updates,
  existingSheet
) {

  const definition =
    getIntegrationDefinition_(
      integrationId
    );

  const sheet =
    existingSheet ||
    ensureAppIntegrationsSheet_();

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
      )
      .filter(Boolean);

  const state =
    readIntegrationStateMap_(true);

  const current =
    state[integrationId] || {};

  const rowObject = {
    'Integration ID': integrationId,
    'Display Name': definition.name,
    'Enabled':
      updates.enabled !== undefined
        ? !!updates.enabled
        : !!current.enabled,
    'Implementation Status':
      definition.implementationStatus,
    'Last Sync':
      updates.lastSync !== undefined
        ? updates.lastSync
        : current.lastSync || '',
    'Last Status':
      updates.lastStatus !== undefined
        ? updates.lastStatus
        : current.lastStatus || 'Not configured',
    'Config JSON':
      updates.configJson !== undefined
        ? updates.configJson
        : current.configJson || '{}',
    'Notes':
      updates.notes !== undefined
        ? updates.notes
        : definition.notes || current.notes || ''
  };


  const row =
    current.row ||
    sheet.getLastRow() + 1;

  sheet
    .getRange(
      row,
      1,
      1,
      headers.length
    )
    .setValues([
      headers.map(header =>
        rowObject[header] !== undefined
          ? rowObject[header]
          : ''
      )
    ]);
}


function updateIntegrationRuntimeStatus_(
  integrationId,
  lastSync,
  lastStatus
) {

  try {

    upsertIntegrationRow_(
      integrationId,
      {
        lastSync:
          lastSync || '',
        lastStatus:
          lastStatus || ''
      }
    );

  } catch (error) {}
}


function normalizeBooleanText_(value) {

  const text =
    String(value || '')
      .trim()
      .toLowerCase();

  return (
    value === true ||
    text === 'true' ||
    text === 'yes' ||
    text === '1' ||
    text === 'enabled'
  );
}
