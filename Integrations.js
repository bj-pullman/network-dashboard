function getAppIntegrationsSheetHeaders_() {

  return [
    'Integration ID',
    'Display Name',
    'Enabled',
    'Implementation Status',
    'Last Sync',
    'Last Status',
    'Connection Status',
    'Data Status',
    'Last Attempt',
    'Last Successful Sync',
    'Record Count',
    'Record Counts JSON',
    'Latest Error',
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
      supportsConnectionTest: true,
      supportsTestConnection: true,
      supportsManualSync: true,
      supportsScheduledSync: true,
      hasLocalDataset: true,
      localDatasetSheets: [
        'Switches',
        'Access Points'
      ],
      providesDashboardWidgets: true,
      enrichesModules: [
        'switches',
        'accessPoints'
      ]
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
      supportsTestConnection: true,
      supportsManualSync: true,
      supportsScheduledSync: true,
      hasLocalDataset: false,
      localDatasetSheets: [],
      providesDashboardWidgets: false,
      enrichesModules: [
        'servers'
      ],
      notes:
        'Partial implementation: endpoint inventory matching exists; broader ThreatDown management, alerting and reporting are not implemented yet.'
    },

    uptimerobot: {
      id: 'uptimerobot',
      name: 'UptimeRobot',
      description:
        'Reads UptimeRobot monitor state for Internet/WAN health display.',
      implementationStatus: 'available',
      capabilities: [
        'Read monitor collection',
        'Map monitor health to Internet/WAN circuits',
        'Manual monitor sync'
      ],
      requiredProperties: [
        {
          key: 'UPTIMEROBOT_API_KEY',
          label: 'Read-only API key'
        }
      ],
      optionalProperties: [],
      settings: [],
      supportsSync: true,
      supportsConnectionTest: true,
      supportsTestConnection: true,
      supportsManualSync: true,
      supportsScheduledSync: true,
      hasLocalDataset: true,
      localDatasetSheets: [
        'UptimeRobot'
      ],
      pageKey: 'uptimeRobot',
      hasOperationalPage: true,
      providesDashboardWidgets: true,
      enrichesModules: [
        'internetWan'
      ],
      notes:
        'Read-only integration. Create monitors in UptimeRobot first, sync them locally, then map monitor IDs on Internet/WAN rows.'
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
          connectionStatus: 'not_configured',
          dataStatus: 'not_synced',
          lastAttempt: '',
          lastSuccessfulSync: '',
          recordCount: '',
          recordCountsJson: '{}',
          latestError: '',
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

  const optionalIndex_ =
    header =>
      Object.prototype
        .hasOwnProperty
        .call(
          index,
          header
        )
        ? index[header]
        : -1;

  const connectionStatusIndex =
    optionalIndex_(
      'Connection Status'
    );

  const dataStatusIndex =
    optionalIndex_(
      'Data Status'
    );

  const lastAttemptIndex =
    optionalIndex_(
      'Last Attempt'
    );

  const lastSuccessfulSyncIndex =
    optionalIndex_(
      'Last Successful Sync'
    );

  const recordCountIndex =
    optionalIndex_(
      'Record Count'
    );

  const recordCountsJsonIndex =
    optionalIndex_(
      'Record Counts JSON'
    );

  const latestErrorIndex =
    optionalIndex_(
      'Latest Error'
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
      connectionStatus:
        connectionStatusIndex >= 0
          ? row[connectionStatusIndex] || ''
          : '',
      dataStatus:
        dataStatusIndex >= 0
          ? row[dataStatusIndex] || ''
          : '',
      lastAttempt:
        lastAttemptIndex >= 0
          ? row[lastAttemptIndex] || ''
          : '',
      lastSuccessfulSync:
        lastSuccessfulSyncIndex >= 0
          ? row[lastSuccessfulSyncIndex] || ''
          : row[lastSyncIndex] || '',
      recordCount:
        recordCountIndex >= 0
          ? row[recordCountIndex] || ''
          : '',
      recordCountsJson:
        recordCountsJsonIndex >= 0
          ? row[recordCountsJsonIndex] || '{}'
          : '{}',
      latestError:
        latestErrorIndex >= 0
          ? row[latestErrorIndex] || ''
          : '',
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

      const supportsTestConnection =
        definition.supportsTestConnection !== undefined
          ? !!definition.supportsTestConnection
          : !!definition.supportsConnectionTest;

      const supportsManualSync =
        definition.supportsManualSync !== undefined
          ? !!definition.supportsManualSync
          : !!definition.supportsSync;

      const recordCounts =
        getIntegrationRecordCounts_(
          id,
          definition,
          itemState
        );

      const recordCount =
        getIntegrationPrimaryRecordCount_(
          recordCounts,
          itemState
        );

      let connectionStatus =
        itemState.connectionStatus ||
        (
          configurationComplete
            ? 'unknown'
            : 'not_configured'
        );

      if (!configurationComplete) {
        connectionStatus =
          'not_configured';
      } else if (connectionStatus === 'not_configured') {
        connectionStatus =
          'unknown';
      }

      const dataStatus =
        itemState.dataStatus ||
        (
          itemState.lastSuccessfulSync ||
          itemState.lastSync
            ? 'synced'
            : 'not_synced'
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
          supportsManualSync,
        supportsConnectionTest:
          supportsTestConnection,
        supportsTestConnection:
          supportsTestConnection,
        supportsManualSync:
          supportsManualSync,
        supportsScheduledSync:
          !!definition.supportsScheduledSync,
        hasLocalDataset:
          !!definition.hasLocalDataset,
        localDatasetSheets:
          definition.localDatasetSheets || [],
        hasOperationalPage:
          !!definition.hasOperationalPage,
        pageKey:
          definition.pageKey || '',
        providesDashboardWidgets:
          !!definition.providesDashboardWidgets,
        enrichesModules:
          definition.enrichesModules || [],
        connectionStatus:
          connectionStatus,
        connected:
          connectionStatus === 'connected',
        dataStatus:
          dataStatus,
        lastAttempt:
          itemState.lastAttempt || '',
        lastSuccessfulSync:
          itemState.lastSuccessfulSync ||
          itemState.lastSync ||
          '',
        recordCount:
          recordCount,
        recordCounts:
          recordCounts,
        latestError:
          itemState.latestError || '',
        lastSync:
          itemState.lastSuccessfulSync ||
          itemState.lastSync ||
          '',
        lastStatus:
          itemState.lastStatus || '',
        notes:
          definition.notes || itemState.notes || ''
      };

    });
}


function parseIntegrationRecordCounts_(
  value
) {

  if (!value) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(
        String(value)
      );

    return parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (error) {
    return {};
  }
}


function getIntegrationRecordCounts_(
  integrationId,
  definition,
  itemState
) {

  const counts =
    parseIntegrationRecordCounts_(
      itemState.recordCountsJson
    );

  if (integrationId === 'aruba_central') {
    counts.switches =
      countIntegrationSheetRecords_(
        'Switches'
      );
    counts.accessPoints =
      countIntegrationSheetRecords_(
        'Access Points'
      );
  }

  if (integrationId === 'uptimerobot') {
    counts.monitors =
      countIntegrationSheetRecords_(
        'UptimeRobot'
      );
  }

  if (integrationId === 'threatdown') {
    counts.serversMarked =
      countIntegrationSheetRowsWhere_(
        'Servers',
        'ThreatDown Installed',
        value =>
          normalizeBooleanText_(
            value
          ) ||
          String(value || '')
            .trim()
            .toLowerCase() === 'installed'
      );
  }

  (
    definition.localDatasetSheets || []
  ).forEach(sheetName => {

    if (
      !sheetName ||
      integrationId === 'aruba_central' ||
      integrationId === 'uptimerobot'
    ) {
      return;
    }

    counts[
      sheetName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    ] =
      countIntegrationSheetRecords_(
        sheetName
      );

  });

  return counts;
}


function getIntegrationPrimaryRecordCount_(
  counts,
  itemState
) {

  const stored =
    Number(
      itemState.recordCount || ''
    );

  if (
    Number.isFinite(stored) &&
    stored >= 0
  ) {
    return stored;
  }

  return Object.keys(counts || {})
    .reduce(
      (total, key) => {

        const value =
          Number(counts[key]);

        return total +
          (
            Number.isFinite(value)
              ? value
              : 0
          );

      },
      0
    );
}


function countIntegrationSheetRecords_(
  sheetName
) {

  try {

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          sheetName
        );

    if (
      !sheet ||
      sheet.getLastRow() < 2
    ) {
      return 0;
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

    const values =
      sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() - 1,
          sheet.getLastColumn()
        )
        .getDisplayValues();

    return values.filter(row =>
      typeof rowHasMeaningfulData_ === 'function'
        ? rowHasMeaningfulData_(
            row,
            headers
          )
        : row.some(value =>
            String(value || '').trim()
          )
    ).length;

  } catch (error) {
    return 0;
  }
}


function countIntegrationSheetRowsWhere_(
  sheetName,
  field,
  predicate
) {

  try {

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(
          sheetName
        );

    if (
      !sheet ||
      sheet.getLastRow() < 2
    ) {
      return 0;
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

    const index =
      headers.indexOf(field);

    if (index < 0) {
      return 0;
    }

    const values =
      sheet
        .getRange(
          2,
          index + 1,
          sheet.getLastRow() - 1,
          1
        )
        .getDisplayValues();

    return values.filter(row =>
      predicate(
        row[0]
      )
    ).length;

  } catch (error) {
    return 0;
  }
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

  if (
    desiredEnabled &&
    definition.hasLocalDataset
  ) {
    ensureIntegrationManagedResources_(
      definition
    );
  }

  invalidateIntegrationCaches_(
    definition
  );

  return getSettingsPageData_();
}


function ensureIntegrationManagedResources_(
  definition
) {

  if (!definition) {
    return;
  }

  const sheetNames =
    definition.localDatasetSheets || [];

  if (!sheetNames.length) {
    return;
  }

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const schema =
    getNetworkDashboardSchema_();

  if (
    typeof setupSchemaSheet_ !== 'function' ||
    typeof createSetupResult_ !== 'function'
  ) {
    return;
  }

  const result =
    createSetupResult_();

  sheetNames.forEach(sheetName => {

    if (!schema[sheetName]) {
      return;
    }

    setupSchemaSheet_(
      ss,
      sheetName,
      schema[sheetName],
      result
    );

  });
}


function invalidateIntegrationCaches_(
  definition
) {

  if (!definition) {
    return;
  }

  (
    definition.enrichesModules || []
  ).forEach(pageKey => {
    invalidateAppPage_(
      pageKey
    );
  });

  if (definition.pageKey) {
    invalidateAppPage_(
      definition.pageKey
    );
  }

  try {
    CacheService
      .getScriptCache()
      .remove(
        'app_dashboard'
      );
  } catch (error) {}
}


function testIntegrationConnection(
  integrationId
) {

  requireAdmin_();

  const definition =
    getIntegrationDefinition_(
      integrationId
    );

  const status =
    getIntegrationStatusById_(
      integrationId
    );

  if (!status.supportsTestConnection) {
    return appendIntegrationActionResult_(
      {
        status: 'unsupported',
        message:
          'This integration does not have a connection test.'
      },
      integrationId
    );
  }

  if (!status.configurationComplete) {
    updateIntegrationConnectionStatus_(
      integrationId,
      'not_configured',
      'Connection test skipped'
    );

    return appendIntegrationActionResult_(
      {
        status: 'not_configured',
        message:
          status.name +
          ' is missing required Script Properties.'
      },
      integrationId
    );
  }


  try {

    updateIntegrationConnectionStatus_(
      integrationId,
      'testing',
      'Connection test started'
    );

    if (integrationId === 'aruba_central') {

      getArubaCentralToken_();

      updateIntegrationConnectionStatus_(
        integrationId,
        'connected',
        'Connection test succeeded'
      );

      return appendIntegrationActionResult_(
        {
          status: 'success',
          message:
            'Aruba Central token exchange succeeded.'
        },
        integrationId
      );

    }


    if (integrationId === 'threatdown') {

      testThreatDownConnection_();

      updateIntegrationConnectionStatus_(
        integrationId,
        'connected',
        'Connection test succeeded'
      );

      return appendIntegrationActionResult_(
        {
          status: 'success',
          message:
            'ThreatDown token exchange succeeded.'
        },
        integrationId
      );

    }

    if (integrationId === 'uptimerobot') {

      const result =
        testUptimeRobotConnection_();

      updateIntegrationConnectionStatus_(
        integrationId,
        'connected',
        'Connection test succeeded'
      );

      return appendIntegrationActionResult_(
        result,
        integrationId
      );

    }


    return appendIntegrationActionResult_(
      {
        status: 'unsupported',
        message:
          definition.name +
          ' does not have a connection test.'
      },
      integrationId
    );

  } catch (error) {

    const message =
      sanitizeIntegrationError_(
        error,
        'Connection test failed.'
      );

    updateIntegrationConnectionStatus_(
      integrationId,
      'connection_failed',
      'Connection test failed',
      message
    );

    return appendIntegrationActionResult_(
      {
        status: 'error',
        message:
          message
      },
      integrationId
    );

  }
}


function runIntegrationSync(
  integrationId
) {

  requireAdmin_();

  const definition =
    getIntegrationDefinition_(
      integrationId
    );

  const status =
    getIntegrationStatusById_(
      integrationId
    );

  if (!status.supportsManualSync) {
    throw new Error(
      'This integration does not support sync: ' +
      integrationId
    );
  }

  if (!status.configurationComplete) {
    updateIntegrationSyncStatus_(
      integrationId,
      {
        success: false,
        lastStatus: 'Sync skipped',
        latestError:
          status.name +
          ' is missing required Script Properties.'
      }
    );

    throw new Error(
      status.name +
      ' is missing required Script Properties.'
    );
  }

  if (!status.enabled) {
    updateIntegrationSyncStatus_(
      integrationId,
      {
        success: false,
        lastStatus: 'Sync skipped',
        latestError:
          status.name +
          ' is disabled.'
      }
    );

    throw new Error(
      status.name +
      ' is disabled.'
    );
  }

  updateIntegrationSyncStatus_(
    integrationId,
    {
      attempted: true,
      dataStatus: 'syncing',
      lastStatus: 'Sync started',
      latestError: ''
    }
  );

  try {

    let result = null;

    if (integrationId === 'aruba_central') {
      result =
        syncArubaCentralToSheet();
    } else if (integrationId === 'threatdown') {
      result =
        syncThreatDownToSheet();
    } else if (integrationId === 'uptimerobot') {
      result =
        syncUptimeRobotToSheet();
    }

    if (!result) {
      throw new Error(
        'This integration does not support sync: ' +
        integrationId
      );
    }

    const success =
      result.status === 'success';

    const counts =
      buildIntegrationSyncRecordCounts_(
        integrationId,
        result
      );

    updateIntegrationSyncStatus_(
      integrationId,
      {
        success: success,
        lastSuccessfulSync:
          success
            ? result.lastSync || new Date()
            : '',
        lastStatus:
          success
            ? 'Sync succeeded'
            : 'Sync finished: ' + result.status,
        recordCounts:
          counts,
        recordCount:
          getIntegrationSyncPrimaryRecordCount_(
            integrationId,
            result,
            counts
          ),
        latestError:
          success
            ? ''
            : result.message || result.status || ''
      }
    );

    result.invalidatePages =
      getIntegrationInvalidatedPages_(
        definition
      );

    result.integration =
      getIntegrationStatusById_(
        integrationId
      );

    result.message =
      result.message ||
      (
        success
          ? definition.name + ' sync complete.'
          : definition.name + ' sync finished: ' + result.status
      );

    return result;

  } catch (error) {

    const message =
      sanitizeIntegrationError_(
        error,
        'Integration sync failed.'
      );

    updateIntegrationSyncStatus_(
      integrationId,
      {
        success: false,
        lastStatus: 'Sync failed',
        latestError: message
      }
    );

    throw new Error(
      message
    );

  }
}


function appendIntegrationActionResult_(
  result,
  integrationId
) {

  result =
    result || {};

  result.integration =
    getIntegrationStatusById_(
      integrationId
    );

  return result;
}


function buildIntegrationSyncRecordCounts_(
  integrationId,
  result
) {

  result =
    result || {};

  if (integrationId === 'aruba_central') {
    return {
      switches:
        Number(result.switchesSynced || 0),
      accessPoints:
        Number(result.apsSynced || 0)
    };
  }

  if (integrationId === 'threatdown') {
    return {
      endpointsFound:
        Number(result.endpointsFound || 0),
      serversMarked:
        countIntegrationSheetRowsWhere_(
          'Servers',
          'ThreatDown Installed',
          value =>
            normalizeBooleanText_(
              value
            ) ||
            String(value || '')
              .trim()
              .toLowerCase() === 'installed'
        )
    };
  }

  if (integrationId === 'uptimerobot') {
    return result.counts || {
      monitors:
        Number(result.monitorsSynced || 0)
    };
  }

  return {};
}


function getIntegrationSyncPrimaryRecordCount_(
  integrationId,
  result,
  counts
) {

  result =
    result || {};

  if (integrationId === 'uptimerobot') {
    return Number(
      result.monitorsSynced ||
      (
        counts &&
        counts.monitors
      ) ||
      0
    );
  }

  if (integrationId === 'threatdown') {
    return Number(
      result.endpointsFound ||
      (
        counts &&
        counts.endpointsFound
      ) ||
      0
    );
  }

  return getIntegrationPrimaryRecordCount_(
    counts,
    {}
  );
}


function getIntegrationInvalidatedPages_(
  definition
) {

  const pages = {};

  (
    definition.enrichesModules || []
  ).forEach(pageKey => {
    pages[pageKey] =
      true;
  });

  if (definition.pageKey) {
    pages[definition.pageKey] =
      true;
  }

  pages.dashboard =
    true;

  return Object.keys(pages);
}


function getActiveIntegrationSheetNames_() {

  const names = [];

  const state =
    readIntegrationStateMap_(false);

  const registry =
    getIntegrationRegistry_();

  Object.keys(registry)
    .forEach(id => {

      const definition =
        registry[id];

      const itemState =
        state[id] || {};

      if (
        !itemState.enabled ||
        !definition.hasLocalDataset
      ) {
        return;
      }

      (
        definition.localDatasetSheets || []
      ).forEach(sheetName => {

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


function isIntegrationOperationalPageEnabled_(
  integrationId,
  pageKey
) {

  try {

    const definition =
      getIntegrationDefinition_(
        integrationId
      );

    const status =
      getIntegrationStatusById_(
        integrationId
      );

    return !!(
      status.enabled &&
      definition.hasOperationalPage &&
      definition.pageKey === pageKey
    );

  } catch (error) {
    return false;
  }
}


function updateIntegrationConnectionStatus_(
  integrationId,
  connectionStatus,
  lastStatus,
  latestError
) {

  try {
    const updates = {
      connectionStatus:
        connectionStatus || '',
      lastAttempt:
        new Date(),
      lastStatus:
        lastStatus || ''
    };

    if (latestError !== undefined) {
      updates.latestError =
        latestError || '';
    }

    upsertIntegrationRow_(
      integrationId,
      updates
    );
  } catch (error) {}
}


function updateIntegrationSyncStatus_(
  integrationId,
  details
) {

  details =
    details || {};

  const updates = {
    lastAttempt:
      new Date(),
    lastStatus:
      details.lastStatus || '',
    latestError:
      details.latestError || ''
  };

  if (details.connectionStatus !== undefined) {
    updates.connectionStatus =
      details.connectionStatus;
  }

  if (details.dataStatus !== undefined) {
    updates.dataStatus =
      details.dataStatus;
  } else if (details.success === true) {
    updates.dataStatus =
      'synced';
  } else if (details.success === false) {
    updates.dataStatus =
      'sync_failed';
  }

  if (details.success === true) {
    updates.lastSuccessfulSync =
      details.lastSuccessfulSync || new Date();
    updates.lastSync =
      updates.lastSuccessfulSync;
  }

  if (details.recordCount !== undefined) {
    updates.recordCount =
      details.recordCount;
  }

  if (details.recordCounts !== undefined) {
    updates.recordCountsJson =
      JSON.stringify(
        details.recordCounts || {}
      );
  }

  try {
    upsertIntegrationRow_(
      integrationId,
      updates
    );
  } catch (error) {}
}


function sanitizeIntegrationError_(
  error,
  fallback
) {

  const message =
    error &&
    error.message
      ? String(error.message)
      : String(error || '');

  if (
    !message ||
    /api[_\s-]*key|password|token|secret|credential/i.test(
      message
    )
  ) {
    return fallback ||
      'Integration request failed.';
  }

  return message;
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
    'Connection Status':
      updates.connectionStatus !== undefined
        ? updates.connectionStatus
        : current.connectionStatus || '',
    'Data Status':
      updates.dataStatus !== undefined
        ? updates.dataStatus
        : current.dataStatus || '',
    'Last Attempt':
      updates.lastAttempt !== undefined
        ? updates.lastAttempt
        : current.lastAttempt || '',
    'Last Successful Sync':
      updates.lastSuccessfulSync !== undefined
        ? updates.lastSuccessfulSync
        : current.lastSuccessfulSync || current.lastSync || '',
    'Record Count':
      updates.recordCount !== undefined
        ? updates.recordCount
        : current.recordCount || '',
    'Record Counts JSON':
      updates.recordCountsJson !== undefined
        ? updates.recordCountsJson
        : current.recordCountsJson || '{}',
    'Latest Error':
      updates.latestError !== undefined
        ? updates.latestError
        : current.latestError || '',
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

  const statusText =
    String(lastStatus || '');

  const isSuccess =
    /succeed|success|complete/i.test(
      statusText
    );

  const isSync =
    /sync|refresh/i.test(
      statusText
    );

  if (isSync) {
    updateIntegrationSyncStatus_(
      integrationId,
      {
        success:
          isSuccess,
        lastSuccessfulSync:
          isSuccess
            ? lastSync || new Date()
            : '',
        lastStatus:
          statusText,
        latestError:
          isSuccess
            ? ''
            : statusText
      }
    );
    return;
  }

  updateIntegrationConnectionStatus_(
    integrationId,
    isSuccess
      ? 'connected'
      : 'connection_failed',
    statusText,
    isSuccess
      ? undefined
      : statusText
  );
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
