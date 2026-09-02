function getNetworkDashboardSchema_() {

  return {
    'Dashboard': {
      type: 'system',
      category: 'Core',
      headers: [
        'Section',
        'Metric',
        'Value',
        'Updated At',
        'Notes'
      ],
      requiredHeaders: [
        'Section',
        'Metric',
        'Value'
      ],
      frozenRows: 1,
      tabColor: '#6b7280'
    },

    'Switches': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
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
        'Port Capacity (Active)',
        'Campus',
        'Location',
        'Notes',
        'Last Sync'
      ],
      requiredHeaders: [
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
      ],
      frozenRows: 1,
      tabColor: '#2563eb'
    },

    'Access Points': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
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
        'Port Capacity (Active)',
        'Uptime',
        'Active Clients',
        'Campus',
        'Location',
        'Notes',
        'Last Sync'
      ],
      requiredHeaders: [
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
      ],
      frozenRows: 1,
      tabColor: '#2563eb'
    },

    'Servers': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
        'Server Name',
        'IP Address',
        'Type',
        'Status',
        'Location',
        'Operating System',
        'ThreatDown Installed',
        'Wazuh Installed',
        'Notes'
      ],
      requiredHeaders: [
        'Server Name',
        'IP Address',
        'Type',
        'Status'
      ],
      frozenRows: 1,
      tabColor: '#2563eb'
    },

    'Offline Servers': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
        'Server Name',
        'IP Address',
        'Type',
        'Status',
        'Location',
        'Offline Since',
        'Reason',
        'Notes'
      ],
      requiredHeaders: [
        'Server Name',
        'IP Address',
        'Type',
        'Status'
      ],
      frozenRows: 1,
      tabColor: '#2563eb'
    },

    'IP Route Tables': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
        'Destination',
        'Gateway',
        'VLAN',
        'Type',
        'SubType',
        'Metric',
        'Dist',
        'Notes'
      ],
      requiredHeaders: [
        'Destination',
        'Gateway',
        'VLAN',
        'Type'
      ],
      frozenRows: 1,
      tabColor: '#2563eb'
    },

    'Security Cameras': {
      type: 'operational',
      category: 'Physical Systems',
      structured: true,
      frozenRows: 1,
      tabColor: '#7c3aed',
      headerRanges: [
        {
          key: 'primary',
          row: 1,
          column: 1,
          headers: [
            'Site',
            'IP',
            'User',
            'Password',
            'Server Location',
            'Notes'
          ]
        },
        {
          key: 'secondary',
          row: 13,
          column: 1,
          headers: [
            'Site',
            'IP',
            'User',
            'Password',
            'Server Location',
            'Notes'
          ]
        },
        {
          key: 'software',
          row: 19,
          column: 1,
          headers: [
            'Site',
            'IP',
            'Type',
            'User',
            'Server Location',
            'Notes'
          ]
        }
      ]
    },

    'Intercom Bell System': {
      type: 'operational',
      category: 'Physical Systems',
      headers: [
        'Location',
        'IP Address',
        'VLAN Name',
        'VLAN ID',
        'Username',
        'Password',
        'Notes'
      ],
      requiredHeaders: [
        'Location',
        'IP Address',
        'VLAN Name',
        'VLAN ID'
      ],
      frozenRows: 1,
      tabColor: '#7c3aed'
    },

    'Bus Cameras': {
      type: 'operational',
      category: 'Physical Systems',
      structured: true,
      frozenRows: 7,
      tabColor: '#7c3aed',
      seedCells: [
        {
          row: 1,
          values: [
            'System',
            ''
          ]
        },
        {
          row: 2,
          values: [
            'Vendor',
            ''
          ]
        },
        {
          row: 3,
          values: [
            'Portal URL',
            ''
          ]
        },
        {
          row: 4,
          values: [
            'Support Contact',
            ''
          ]
        },
        {
          row: 5,
          values: [
            'Notes',
            ''
          ]
        }
      ],
      headerRanges: [
        {
          key: 'buses',
          row: 7,
          column: 1,
          headers: [
            'Bus Name/Number',
            'DVR IP',
            'Bridge IP',
            'Bridge Mac',
            'Bus Type',
            'Notes'
          ]
        }
      ],
      protectedRanges: [
        {
          key: 'metadata',
          row: 1,
          column: 1,
          rows: 5,
          columns: 1
        }
      ]
    },

    'Backup Schedule': {
      type: 'operational',
      category: 'Operations',
      headers: [
        'Server Name',
        'Size',
        'Backup Time',
        'Backup Job Name',
        'Target Location',
        'Wasabi Job',
        'Wasabi Schedule',
        'Notes'
      ],
      requiredHeaders: [
        'Server Name',
        'Backup Time',
        'Backup Job Name'
      ],
      frozenRows: 1,
      tabColor: '#059669'
    },

    'Replacement Switches': {
      type: 'operational',
      category: 'Operations',
      headers: [
        'Status',
        'Device Label',
        'Model',
        'Type',
        'IP Address',
        'Serial Number',
        'MAC Address',
        'Role',
        'Replacement Priority',
        'Target Replacement',
        'Campus',
        'Location',
        'Notes'
      ],
      requiredHeaders: [
        'Status',
        'Device Label',
        'Model',
        'Replacement Priority'
      ],
      frozenRows: 1,
      tabColor: '#059669'
    },

    'Department Workflow': {
      type: 'operational',
      category: 'Workflow',
      structured: true,
      frozenRows: 1,
      tabColor: '#d97706',
      headerRanges: [
        {
          key: 'groups',
          row: 1,
          column: 1,
          headers: [
            'Group',
            'Members',
            'Purpose'
          ]
        },
        {
          key: 'tiers',
          row: 7,
          column: 1,
          headers: [
            'Tier',
            'Definition'
          ]
        },
        {
          key: 'ticketSteps',
          row: 14,
          column: 1,
          headers: [
            'Ticket Step',
            'Stage',
            'Responsible',
            'Criteria'
          ]
        },
        {
          key: 'priorities',
          row: 22,
          column: 1,
          headers: [
            'Priority Level',
            'Response SLA',
            'Resolution SLA',
            'Definition',
            'Escalation'
          ]
        },
        {
          key: 'workflows',
          row: 30,
          column: 1,
          headers: [
            'Category',
            'Workflow',
            'Tier',
            'Primary Owner',
            'Backup',
            'Support',
            'Notes'
          ]
        }
      ],
      seedRows: [
        {
          row: 2,
          values: [
            'Network',
            '',
            'Switching, wireless, routing and network infrastructure.'
          ]
        },
        {
          row: 3,
          values: [
            'Systems',
            '',
            'Servers, identity, backups and core application platforms.'
          ]
        },
        {
          row: 4,
          values: [
            'Security',
            '',
            'Endpoint security, monitoring and incident response.'
          ]
        },
        {
          row: 8,
          values: [
            'Tier 1',
            'Front-line intake, triage and common service requests.'
          ]
        },
        {
          row: 9,
          values: [
            'Tier 2',
            'Specialist support for systems, network and endpoint issues.'
          ]
        },
        {
          row: 10,
          values: [
            'Tier 3',
            'Senior engineering, architecture and complex escalations.'
          ]
        },
        {
          row: 11,
          values: [
            'Tier 4',
            'External vendor, platform owner or executive escalation.'
          ]
        },
        {
          row: 15,
          values: [
            '1',
            'Intake',
            'Service desk or assigned support owner',
            'Capture request, affected users and business impact.'
          ]
        },
        {
          row: 16,
          values: [
            '2',
            'Classify',
            'Assigned support owner',
            'Determine category, priority and starting support tier.'
          ]
        },
        {
          row: 17,
          values: [
            '3',
            'Resolve or Escalate',
            'Assigned support owner',
            'Resolve within ownership or escalate with context.'
          ]
        },
        {
          row: 23,
          values: [
            'P1 Critical',
            'Immediate',
            'Until restored',
            'Major outage or critical business process unavailable.',
            'Escalate through leadership and vendor paths immediately.'
          ]
        },
        {
          row: 24,
          values: [
            'P2 High',
            'Same business day',
            '1-2 business days',
            'Significant impact to a team, site or important service.',
            'Escalate if blocked or nearing SLA.'
          ]
        },
        {
          row: 25,
          values: [
            'P3 Normal',
            '1 business day',
            '3-5 business days',
            'Standard request or single-user issue.',
            'Escalate when specialist ownership is required.'
          ]
        },
        {
          row: 26,
          values: [
            'P4 Low',
            '2 business days',
            'As scheduled',
            'Low-impact request, documentation or planned work.',
            'Escalate only when priority or scope changes.'
          ]
        },
        {
          row: 31,
          values: [
            'Network',
            'Switching and Wireless',
            'Tier 2',
            '',
            '',
            'Network',
            'Replace with organization-specific owners.'
          ]
        },
        {
          row: 32,
          values: [
            'Systems',
            'Servers and Backups',
            'Tier 2',
            '',
            '',
            'Systems',
            'Replace with organization-specific owners.'
          ]
        }
      ]
    },

    'App Users': {
      type: 'system',
      category: 'Administration',
      headers: getAppUserHeaders_(),
      requiredHeaders: getAppUserHeaders_(),
      frozenRows: 1,
      tabColor: '#111827'
    },

    'App Settings': {
      type: 'system',
      category: 'Administration',
      headers: getAppSettingsSheetHeaders_(),
      requiredHeaders: getAppSettingsSheetHeaders_(),
      frozenRows: 1,
      tabColor: '#111827'
    },

    'App Integrations': {
      type: 'system',
      category: 'Administration',
      headers: getAppIntegrationsSheetHeaders_(),
      requiredHeaders: getAppIntegrationsSheetHeaders_(),
      frozenRows: 1,
      tabColor: '#111827'
    }
  };
}


function getNetworkDashboardSheetNames_() {

  return Object.keys(
    getNetworkDashboardSchema_()
  );
}


function setupNetworkDashboard(options) {

  options =
    options || {};

  const result =
    createSetupResult_();

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const schema =
    getNetworkDashboardSchema_();


  Object.keys(schema)
    .forEach(sheetName => {
      setupSchemaSheet_(
        ss,
        sheetName,
        schema[sheetName],
        result
      );
    });


  AppConfig.seedMissing_();

  seedIntegrationDefinitions_();

  seedInitialAdminUser_(result);


  AppConfig.setSystemValue_(
    'app.version',
    NETWORK_DASHBOARD_VERSION,
    'setup'
  );

  AppConfig.setSystemValue_(
    'schema.version',
    NETWORK_DASHBOARD_SCHEMA_VERSION,
    'setup'
  );


  result.validation =
    validateNetworkDashboard({
      silent: true
    });

  result.healthy =
    result.validation.healthy;

  result.nextSteps =
    getSetupNextSteps_();


  if (!options.silent) {
    showNetworkDashboardToast_(
      buildSetupToastMessage_(result),
      8
    );
  }


  console.log(
    'Network Dashboard setup result: ' +
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


function validateNetworkDashboard(options) {

  options =
    options || {};

  const result = {
    healthy: true,
    applicationVersion:
      NETWORK_DASHBOARD_VERSION,
    schemaVersion:
      NETWORK_DASHBOARD_SCHEMA_VERSION,
    sheets: [],
    protections: [],
    settings: [],
    integrations: [],
    scriptProperties: [],
    warnings: [],
    errors: []
  };


  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const schema =
    getNetworkDashboardSchema_();


  Object.keys(schema)
    .forEach(sheetName => {
      validateSchemaSheet_(
        ss,
        sheetName,
        schema[sheetName],
        result
      );
    });


  validateSettings_(result);

  validateIntegrations_(result);

  validateBreakGlass_(result);


  result.healthy =
    result.errors.length === 0;

  if (!options.silent) {
    showNetworkDashboardToast_(
      buildValidationToastMessage_(result),
      8
    );
  }


  console.log(
    'Network Dashboard validation result: ' +
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;
}


function createSetupResult_() {

  return {
    healthy: false,
    applicationVersion:
      NETWORK_DASHBOARD_VERSION,
    schemaVersion:
      NETWORK_DASHBOARD_SCHEMA_VERSION,
    sheets: {
      created: [],
      existing: [],
      headersConfigured: [],
      headersRepaired: [],
      warnings: []
    },
    protections: {
      protected: [],
      repaired: [],
      warnings: []
    },
    settings: {
      seeded: true
    },
    integrations: {
      seeded: true
    },
    users: {
      initialAdmin: '',
      warnings: []
    },
    warnings: [],
    errors: []
  };
}


function setupSchemaSheet_(
  ss,
  sheetName,
  definition,
  result
) {

  let sheet =
    ss.getSheetByName(sheetName);

  const created =
    !sheet;


  if (!sheet) {
    sheet =
      ss.insertSheet(sheetName);
    result.sheets.created.push(sheetName);
  } else {
    result.sheets.existing.push(sheetName);
  }


  if (definition.tabColor) {
    try {
      sheet.setTabColor(definition.tabColor);
    } catch (error) {}
  }


  if (definition.seedCells) {
    seedBlankCells_(
      sheet,
      definition.seedCells
    );
  }


  if (definition.headers) {

    const headerResult =
      ensureSchemaHeaderRow_(
        sheet,
        sheetName,
        definition.headers,
        definition.requiredHeaders || definition.headers,
        1,
        1,
        true
      );

    result.sheets.headersConfigured
      .push(headerResult);

  }


  if (definition.headerRanges) {

    definition.headerRanges
      .forEach(rangeDefinition => {

        const headerResult =
          ensureSchemaHeaderRow_(
            sheet,
            sheetName,
            rangeDefinition.headers,
            rangeDefinition.requiredHeaders || rangeDefinition.headers,
            rangeDefinition.row,
            rangeDefinition.column || 1,
            created
          );

        result.sheets.headersConfigured
          .push(headerResult);

      });

  }


  if (definition.seedRows) {
    seedBlankRows_(
      sheet,
      definition.seedRows
    );
  }


  if (definition.frozenRows) {
    sheet.setFrozenRows(
      definition.frozenRows
    );
  }


  removeObsoleteManagedProtections_(
    sheet,
    sheetName,
    definition
  );


  formatManagedHeaderRanges_(
    sheet,
    definition
  );


  protectManagedHeaderRanges_(
    sheet,
    sheetName,
    definition,
    result
  );
}


function ensureSchemaHeaderRow_(
  sheet,
  sheetName,
  canonicalHeaders,
  requiredHeaders,
  row,
  column,
  appendMissing
) {

  const current =
    sheet
      .getRange(
        row,
        column,
        1,
        canonicalHeaders.length
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );


  const hasHeaders =
    current.some(Boolean);

  const result = {
    sheet: sheetName,
    row: row,
    created: false,
    missingHeaders: [],
    orderMatches: true,
    warning: ''
  };


  if (!hasHeaders) {

    sheet
      .getRange(
        row,
        column,
        1,
        canonicalHeaders.length
      )
      .setValues([
        canonicalHeaders
      ]);

    result.created = true;
    return result;

  }


  requiredHeaders.forEach(header => {

    if (!current.includes(header)) {
      result.missingHeaders.push(header);
    }

  });


  result.orderMatches =
    canonicalHeaders.every(
      (header, index) =>
        current[index] === header
    );


  if (
    result.missingHeaders.length &&
    appendMissing
  ) {

    const rowValues =
      sheet
        .getRange(
          row,
          1,
          1,
          Math.max(
            sheet.getLastColumn(),
            column + canonicalHeaders.length - 1
          )
        )
        .getDisplayValues()[0]
        .map(value =>
          String(value || '').trim()
        );

    while (
      rowValues.length &&
      !rowValues[rowValues.length - 1]
    ) {
      rowValues.pop();
    }

    result.missingHeaders
      .forEach(header => {

        if (!rowValues.includes(header)) {

          sheet
            .getRange(
              row,
              rowValues.length + 1
            )
            .setValue(header);

          rowValues.push(header);

        }

      });

  } else if (result.missingHeaders.length) {

    result.warning =
      'Missing headers were not added because this is a fixed structured range.';

  }


  return result;
}


function seedBlankCells_(
  sheet,
  seedCells
) {

  seedCells.forEach(item => {

    const width =
      item.values.length;

    const range =
      sheet.getRange(
        item.row,
        item.column || 1,
        1,
        width
      );

    const current =
      range
        .getDisplayValues()[0]
        .map(value =>
          String(value || '').trim()
        );

    if (!current.some(Boolean)) {
      range.setValues([
        item.values
      ]);
    }

  });
}


function seedBlankRows_(
  sheet,
  seedRows
) {

  seedRows.forEach(item => {

    const range =
      sheet.getRange(
        item.row,
        item.column || 1,
        1,
        item.values.length
      );

    const current =
      range
        .getDisplayValues()[0]
        .map(value =>
          String(value || '').trim()
        );

    if (!current.some(Boolean)) {
      range.setValues([
        item.values
      ]);
    }

  });
}


function getManagedHeaderRangeDefinitions_(
  definition
) {

  let ranges = [];

  if (definition.headers) {
    ranges.push({
      key: 'headers',
      row: 1,
      column: 1,
      rows: 1,
      columns: definition.headers.length
    });
  }


  if (definition.headerRanges) {
    ranges =
      ranges.concat(
        definition.headerRanges
          .map(item => ({
            key: item.key,
            row: item.row,
            column: item.column || 1,
            rows: 1,
            columns: item.headers.length
          }))
      );
  }


  if (definition.protectedRanges) {
    ranges =
      ranges.concat(
        definition.protectedRanges
      );
  }


  return ranges;
}


function formatManagedHeaderRanges_(
  sheet,
  definition
) {

  getManagedHeaderRangeDefinitions_(
    definition
  )
    .forEach(item => {

      const range =
        sheet.getRange(
          item.row,
          item.column,
          item.rows || 1,
          item.columns
        );

      range
        .setFontWeight('bold')
        .setBackground('#17345f')
        .setFontColor('#ffffff');

      try {
        sheet.autoResizeColumns(
          item.column,
          item.columns
        );
      } catch (error) {}

    });
}


function protectManagedHeaderRanges_(
  sheet,
  sheetName,
  definition,
  result
) {

  getManagedHeaderRangeDefinitions_(
    definition
  )
    .forEach(item => {

      const range =
        sheet.getRange(
          item.row,
          item.column,
          item.rows || 1,
          item.columns
        );

      const description =
        getManagedProtectionDescription_(
          sheetName,
          item.key
        );

      try {

        const protections =
          sheet.getProtections(
            SpreadsheetApp.ProtectionType.RANGE
          );

        let matching =
          protections.filter(protection =>
            protection.getDescription() ===
            description
          );

        let protection =
          matching.find(itemProtection =>
            itemProtection
              .getRange()
              .getA1Notation() ===
            range.getA1Notation()
          );


        matching
          .filter(itemProtection =>
            itemProtection !== protection
          )
          .forEach(itemProtection => {
            try {
              itemProtection.remove();
            } catch (error) {}
          });


        if (!protection) {

          protection =
            range.protect();

          result.protections.repaired
            .push({
              sheet: sheetName,
              range: range.getA1Notation()
            });

        }


        protection.setDescription(
          description
        );

        protection.setWarningOnly(false);

        try {
          if (protection.canDomainEdit()) {
            protection.setDomainEdit(false);
          }
        } catch (error) {}

        try {
          const effectiveUser =
            Session.getEffectiveUser();

          if (effectiveUser) {
            protection.addEditor(
              effectiveUser
            );
          }
        } catch (error) {}

        result.protections.protected
          .push({
            sheet: sheetName,
            range: range.getA1Notation(),
            description: description
          });

      } catch (error) {

        result.protections.warnings
          .push(
            'Could not protect ' +
            sheetName +
            ' ' +
            range.getA1Notation() +
            ': ' +
            error.message
          );

      }

    });
}


function removeObsoleteManagedProtections_(
  sheet,
  sheetName,
  definition
) {

  const expected = {};

  getManagedHeaderRangeDefinitions_(
    definition
  )
    .forEach(item => {

      const range =
        sheet.getRange(
          item.row,
          item.column,
          item.rows || 1,
          item.columns
        );

      expected[
        getManagedProtectionDescription_(
          sheetName,
          item.key
        )
      ] =
        range.getA1Notation();

    });


  const prefix =
    getManagedProtectionDescription_(
      sheetName,
      ''
    );


  sheet
    .getProtections(
      SpreadsheetApp.ProtectionType.RANGE
    )
    .forEach(protection => {

      const description =
        protection.getDescription();

      if (
        !description ||
        description.indexOf(prefix) !== 0
      ) {
        return;
      }


      const expectedRange =
        expected[description];

      const actualRange =
        protection
          .getRange()
          .getA1Notation();

      if (
        expectedRange === actualRange
      ) {
        return;
      }


      try {
        protection.remove();
      } catch (error) {}

    });
}


function getManagedProtectionDescription_(
  sheetName,
  key
) {

  return [
    'Network Dashboard - Managed Headers',
    sheetName,
    key
  ].join(' - ');
}


function seedInitialAdminUser_(result) {

  const sheet =
    ensureAppUsersSheet_();

  if (sheet.getLastRow() >= 2) {
    return;
  }


  const email =
    getCurrentUserEmail_();

  if (!email) {
    result.users.warnings.push(
      'No current Google account email was available; configure an admin user or break-glass Script Property before opening the web app.'
    );
    return;
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
      )
      .filter(Boolean);


  const rowObject = {
    'Email': email,
    'Name': email.split('@')[0],
    'Active': true,
    'Role': 'admin',
    'Default Permission': 'edit',
    'Page Permissions': '{}',
    'Notes': 'Seeded by setupNetworkDashboard().'
  };


  sheet
    .getRange(
      2,
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


  result.users.initialAdmin =
    email;
}


function validateSchemaSheet_(
  ss,
  sheetName,
  definition,
  result
) {

  const sheet =
    ss.getSheetByName(sheetName);

  const sheetResult = {
    name: sheetName,
    type: definition.type,
    exists: !!sheet,
    frozenRowsOk: false,
    headers: [],
    missingHeaders: [],
    orderWarnings: []
  };


  if (!sheet) {

    result.errors.push(
      'Missing required sheet: ' + sheetName
    );

    result.sheets.push(sheetResult);
    return;

  }


  sheetResult.frozenRowsOk =
    sheet.getFrozenRows() >=
    Number(definition.frozenRows || 0);

  if (!sheetResult.frozenRowsOk) {
    result.warnings.push(
      sheetName +
      ' should freeze at least ' +
      definition.frozenRows +
      ' row(s).'
    );
  }


  if (definition.headers) {
    validateHeaderRow_(
      sheet,
      sheetName,
      definition.headers,
      definition.requiredHeaders || definition.headers,
      1,
      1,
      sheetResult,
      result
    );
  }


  if (definition.headerRanges) {
    definition.headerRanges
      .forEach(item => {
        validateHeaderRow_(
          sheet,
          sheetName,
          item.headers,
          item.requiredHeaders || item.headers,
          item.row,
          item.column || 1,
          sheetResult,
          result
        );
      });
  }


  validateProtections_(
    sheet,
    sheetName,
    definition,
    result
  );


  result.sheets.push(
    sheetResult
  );
}


function validateHeaderRow_(
  sheet,
  sheetName,
  canonicalHeaders,
  requiredHeaders,
  row,
  column,
  sheetResult,
  result
) {

  const current =
    sheet
      .getRange(
        row,
        column,
        1,
        canonicalHeaders.length
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );


  const missing =
    requiredHeaders.filter(header =>
      !current.includes(header)
    );


  const orderMatches =
    canonicalHeaders.every(
      (header, index) =>
        current[index] === header
    );


  sheetResult.headers.push({
    row: row,
    range:
      sheet
        .getRange(
          row,
          column,
          1,
          canonicalHeaders.length
        )
        .getA1Notation(),
    expected: canonicalHeaders,
    actual: current,
    missing: missing,
    orderMatches: orderMatches
  });


  if (missing.length) {
    result.errors.push(
      sheetName +
      ' row ' +
      row +
      ' is missing required headers: ' +
      missing.join(', ')
    );
  }


  if (!orderMatches) {
    result.warnings.push(
      sheetName +
      ' row ' +
      row +
      ' header order differs from the canonical schema.'
    );
  }
}


function validateProtections_(
  sheet,
  sheetName,
  definition,
  result
) {

  const protections =
    sheet.getProtections(
      SpreadsheetApp.ProtectionType.RANGE
    );


  getManagedHeaderRangeDefinitions_(
    definition
  )
    .forEach(item => {

      const range =
        sheet.getRange(
          item.row,
          item.column,
          item.rows || 1,
          item.columns
        );

      const description =
        getManagedProtectionDescription_(
          sheetName,
          item.key
        );

      const match =
        protections.find(protection =>
          protection.getDescription() ===
            description &&
          protection
            .getRange()
            .getA1Notation() ===
            range.getA1Notation()
        );

      const status = {
        sheet: sheetName,
        range: range.getA1Notation(),
        description: description,
        protected: !!match
      };

      result.protections.push(status);

      if (!match) {
        result.errors.push(
          'Missing managed header protection: ' +
          sheetName +
          ' ' +
          range.getA1Notation()
        );
      }

    });
}


function validateSettings_(result) {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName(
      NETWORK_DASHBOARD_SETTINGS_SHEET
    );

  const values = {};

  if (
    sheet &&
    sheet.getLastRow() >= 2
  ) {

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
      keyIndex >= 0 &&
      valueIndex >= 0
    ) {

      sheet
        .getRange(
          2,
          1,
          sheet.getLastRow() - 1,
          sheet.getLastColumn()
        )
        .getDisplayValues()
        .forEach(row => {

          const key =
            String(row[keyIndex] || '').trim();

          if (key) {
            values[key] =
              String(row[valueIndex] || '');
          }

        });

    }

  }

  getAppSettingDefinitions_()
    .forEach(definition => {

      const exists =
        Object.prototype
          .hasOwnProperty
          .call(
            values,
            definition.key
          );

      result.settings.push({
        key: definition.key,
        configured:
          exists &&
          String(values[definition.key] || '') !== '',
        required:
          !definition.editable ||
          definition.defaultValue !== ''
      });

      if (!exists) {
        result.errors.push(
          'Missing setting: ' +
          definition.key
        );
      }

    });
}


function validateIntegrations_(result) {

  const registry =
    getIntegrationRegistry_();

  const integrationState =
    readIntegrationStateMap_(false);

  Object.keys(registry)
    .forEach(id => {

      if (!integrationState[id]) {
        result.errors.push(
          'Missing App Integrations definition: ' +
          id
        );
      }

    });


  const integrations =
    getIntegrationStatusList_();

  result.integrations =
    integrations;

  integrations.forEach(integration => {

    integration.requiredProperties
      .forEach(property => {

        result.scriptProperties.push({
          integrationId:
            integration.id,
          key:
            property.key,
          configured:
            property.configured
        });

      });

    if (
      integration.enabled &&
      !integration.configurationComplete
    ) {
      result.errors.push(
        integration.name +
        ' is enabled but required Script Properties are missing.'
      );
    }

  });
}


function validateBreakGlass_(result) {

  const admins =
    getBreakGlassAdmins_();

  result.scriptProperties.push({
    key:
      NETWORK_DASHBOARD_BREAK_GLASS_ADMINS_PROPERTY,
    configured:
      admins.length > 0
  });

  if (!admins.length) {
    result.warnings.push(
      'Break-glass administrators are not configured. Set Script Property ' +
      NETWORK_DASHBOARD_BREAK_GLASS_ADMINS_PROPERTY +
      ' with a comma-separated admin email list.'
    );
  }
}


function formatSetupSummary_(result) {

  const validation =
    result.validation || {};

  return [
    'NETWORK DASHBOARD SETUP',
    '',
    'Sheets',
    result.sheets.created.length +
      ' created',
    result.sheets.existing.length +
      ' already existed',
    '',
    'Headers',
    result.sheets.headersConfigured.length +
      ' configured or checked',
    '',
    'Protections',
    result.protections.protected.length +
      ' managed header ranges protected',
    '',
    'Application',
    NETWORK_DASHBOARD_APP_NAME +
      ' ' +
      NETWORK_DASHBOARD_VERSION,
    'Schema ' +
      NETWORK_DASHBOARD_SCHEMA_VERSION,
    '',
    'Validation',
    validation.healthy
      ? 'Healthy'
      : 'Needs attention',
    '',
    'Next Steps',
    getSetupNextSteps_()
      .map((step, index) =>
        (index + 1) +
        '. ' +
        step
      )
      .join('\n')
  ].join('\n');
}


function formatValidationSummary_(result) {

  return [
    'NETWORK DASHBOARD VALIDATION',
    '',
    'Application: ' +
      result.applicationVersion,
    'Schema: ' +
      result.schemaVersion,
    'Status: ' +
      (result.healthy ? 'Healthy' : 'Needs attention'),
    '',
    'Sheets checked: ' +
      result.sheets.length,
    'Header protections checked: ' +
      result.protections.length,
    '',
    'Errors',
    result.errors.length
      ? result.errors.join('\n')
      : 'None',
    '',
    'Warnings',
    result.warnings.length
      ? result.warnings.join('\n')
      : 'None'
  ].join('\n');
}


function buildSetupToastMessage_(result) {

  const validation =
    result.validation || {};

  const sheetCount =
    validation.sheets
      ? validation.sheets.length
      : getNetworkDashboardSheetNames_().length;

  return [
    'Setup complete',
    sheetCount + ' sheets validated',
    'Schema ' + NETWORK_DASHBOARD_SCHEMA_VERSION,
    result.healthy ? 'Healthy' : 'Needs attention'
  ].join(' - ');
}


function buildValidationToastMessage_(result) {

  if (result.errors.length) {
    return (
      'Validation complete - ' +
      result.errors.length +
      ' error' +
      (result.errors.length === 1 ? '' : 's') +
      ' found'
    );
  }


  if (result.warnings.length) {
    return (
      'Validation complete - ' +
      result.warnings.length +
      ' warning' +
      (result.warnings.length === 1 ? '' : 's') +
      ' found'
    );
  }


  return (
    'Validation complete - Installation healthy - Schema ' +
    NETWORK_DASHBOARD_SCHEMA_VERSION
  );
}


function showNetworkDashboardToast_(
  message,
  timeoutSeconds
) {

  try {
    SpreadsheetApp
      .getActiveSpreadsheet()
      .toast(
        message,
        'Network Dashboard',
        timeoutSeconds || 5
      );
  } catch (error) {}
}


function getSetupNextSteps_() {

  return [
    'Open Network Dashboard Settings.',
    'Configure organization, branding, regional and user-domain policy.',
    'Configure break-glass administrators in Script Properties.',
    'Add Script Properties for desired integrations.',
    'Add users and permissions.',
    'Deploy or open the Apps Script web application.'
  ];
}
