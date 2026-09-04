function getNetworkDashboardSchema_() {

  return {
    'Dashboard': {
      type: 'system',
      category: 'Core',
      headers:
        getDashboardSheetHeaders_(),
      requiredHeaders: [
        'Metric Key',
        'Label',
        'Value'
      ],
      frozenRows: 1,
      tabColor: '#6b7280',
      dashboardFormulaLayer: true
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

    'Internet WAN': {
      type: 'operational',
      category: 'Infrastructure',
      headers: [
        'Circuit ID',
        'Circuit Name',
        'Site / Location',
        'Role',
        'Provider',
        'Service Type',
        'APSCN Device Name',
        'Bandwidth',
        'Public Network / CIDR',
        'Gateway',
        'Public IPs',
        'Circuit / Account ID',
        'UptimeRobot Monitor ID',
        'Status',
        'Notes'
      ],
      requiredHeaders: [
        'Circuit ID',
        'Circuit Name',
        'Site / Location',
        'Role',
        'Provider',
        'Service Type',
        'APSCN Device Name',
        'Bandwidth',
        'Public Network / CIDR',
        'Gateway',
        'Public IPs',
        'Circuit / Account ID',
        'UptimeRobot Monitor ID',
        'Status',
        'Notes'
      ],
      migration: 'internetWanBandwidth',
      frozenRows: 1,
      tabColor: '#0891b2'
    },

    'Outages': {
      type: 'operational',
      category: 'Monitoring',
      headers:
        getOutageSheetHeaders_(),
      requiredHeaders: [
        'Outage ID',
        'Circuit ID',
        'Started',
        'Source',
        'Status',
        'External Event ID'
      ],
      frozenRows: 1,
      tabColor: '#dc2626'
    },

    'Security Cameras': {
      type: 'operational',
      category: 'Physical Systems',
      frozenRows: 1,
      tabColor: '#7c3aed',
      migration:
        'unifySecurityCameras',
      headers: [
        'Location',
        'Asset / System',
        'Category',
        'Type',
        'IP Address',
        'Username',
        'Password',
        'Server Location',
        'Notes'
      ],
      requiredHeaders: [
        'Location',
        'Category',
        'IP Address'
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

    'UptimeRobot': {
      type: 'integration',
      category: 'Monitoring',
      headers:
        getUptimeRobotSheetHeaders_(),
      requiredHeaders:
        getUptimeRobotSheetHeaders_(),
      frozenRows: 1,
      tabColor: '#10b981'
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


function getDashboardSheetHeaders_() {

  return [
    'Metric Key',
    'Label',
    'Value',
    'Section',
    'Sort Order',
    'Notes'
  ];
}


function getDashboardFormulaMaxRow_() {

  return 10000;
}


function getDashboardReadRowCount_() {

  return 120;
}


function getDashboardSummarySections_() {

  return [
    {
      key: 'switchStatus',
      title: 'Switch Status',
      row: 30,
      column: 1,
      sheetName: 'Switches',
      header: 'Status',
      maxRows: 18
    },
    {
      key: 'apStatus',
      title: 'Access Point Status',
      row: 30,
      column: 4,
      sheetName: 'Access Points',
      header: 'Status',
      maxRows: 18
    },
    {
      key: 'campusDistribution',
      title: 'Switches by Campus',
      row: 30,
      column: 7,
      sheetName: 'Switches',
      header: 'Campus',
      maxRows: 34
    },
    {
      key: 'wanStatus',
      title: 'Internet WAN Status',
      row: 72,
      column: 1,
      sheetName: 'Internet WAN',
      header: 'Status',
      maxRows: 18
    }
  ];
}


function getDashboardMetricDefinitions_() {

  const definitions = [
    {
      key: 'switches.total',
      label: 'Switches',
      sort: 10,
      formula:
        dashboardCountFormula_(
          'Switches',
          'Device Label'
        ),
      notes: 'Total switch records.'
    },
    {
      key: 'switches.online',
      label: 'Online Switches',
      sort: 11,
      formula:
        dashboardCountIfFormula_(
          'Switches',
          'Status',
          'Online'
        ),
      notes: 'Switch records with Status = Online.'
    },
    {
      key: 'switches.offline',
      label: 'Offline Switches',
      sort: 12,
      formula:
        dashboardCountIfFormula_(
          'Switches',
          'Status',
          'Offline'
        ),
      notes: 'Switch records with Status = Offline.'
    },
    {
      key: 'access_points.total',
      label: 'Access Points',
      sort: 20,
      formula:
        dashboardCountFormula_(
          'Access Points',
          'Device Label'
        ),
      notes: 'Total access point records.'
    },
    {
      key: 'access_points.online',
      label: 'Online Access Points',
      sort: 21,
      formula:
        dashboardCountIfFormula_(
          'Access Points',
          'Status',
          'Online'
        ),
      notes: 'Access point records with Status = Online.'
    },
    {
      key: 'access_points.offline',
      label: 'Offline Access Points',
      sort: 22,
      formula:
        dashboardCountIfFormula_(
          'Access Points',
          'Status',
          'Offline'
        ),
      notes: 'Access point records with Status = Offline.'
    },
    {
      key: 'servers.total',
      label: 'Servers',
      sort: 30,
      formula:
        dashboardCountFormula_(
          'Servers',
          'Server Name'
        ),
      notes: 'Active server records.'
    },
    {
      key: 'servers.online',
      label: 'Online Servers',
      sort: 31,
      formula:
        dashboardCountIfFormula_(
          'Servers',
          'Status',
          'Online'
        ),
      notes: 'Server records with Status = Online.'
    },
    {
      key: 'servers.offline',
      label: 'Offline Server Records',
      sort: 32,
      formula:
        dashboardCountIfFormula_(
          'Servers',
          'Status',
          'Offline'
        ),
      notes: 'Server records with Status = Offline.'
    },
    {
      key: 'offline_servers.total',
      label: 'Offline Servers',
      sort: 33,
      formula:
        dashboardCountFormula_(
          'Offline Servers',
          'Server Name'
        ),
      notes: 'Offline server backing records.'
    },
    {
      key: 'security_cameras.total',
      label: 'Security Cameras',
      sort: 40,
      formula:
        dashboardCountFormula_(
          'Security Cameras',
          'Location'
        ),
      notes: 'Camera system records.'
    },
    {
      key: 'internet_wan.total',
      label: 'WAN Circuits',
      sort: 50,
      formula:
        dashboardCountFormula_(
          'Internet WAN',
          'Circuit ID'
        ),
      notes: 'Total Internet/WAN circuit records.'
    },
    {
      key: 'internet_wan.primary',
      label: 'Primary Circuits',
      sort: 51,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Role',
          'Primary'
        ),
      notes: 'WAN circuits with Role = Primary.'
    },
    {
      key: 'internet_wan.backup',
      label: 'Backup Circuits',
      sort: 52,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Role',
          'Backup'
        ),
      notes: 'WAN circuits with Role = Backup.'
    },
    {
      key: 'internet_wan.disabled',
      label: 'Disabled Circuits',
      sort: 53,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Status',
          'Disabled'
        ),
      notes: 'WAN circuits with Status = Disabled.'
    },
    {
      key: 'internet_wan.active',
      label: 'Active Circuits',
      sort: 54,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Status',
          'Active'
        ),
      notes: 'WAN circuits with Status = Active.'
    },
    {
      key: 'internet_wan.standby',
      label: 'Standby Circuits',
      sort: 55,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Status',
          'Standby'
        ),
      notes: 'WAN circuits with Status = Standby.'
    },
    {
      key: 'internet_wan.maintenance',
      label: 'Maintenance Circuits',
      sort: 56,
      formula:
        dashboardCountIfFormula_(
          'Internet WAN',
          'Status',
          'Maintenance'
        ),
      notes: 'WAN circuits with Status = Maintenance.'
    },
    {
      key: 'internet_wan.sites',
      label: 'WAN Sites',
      sort: 57,
      formula:
        dashboardUniqueCountFormula_(
          'Internet WAN',
          'Site / Location'
        ),
      notes: 'Unique sites with WAN circuit records.'
    },
    {
      key: 'workflow.groups',
      label: 'Workflow Groups',
      sort: 70,
      formula:
        dashboardWorkflowCountFormula_(
          'groups'
        ),
      notes: 'Configured support groups.'
    },
    {
      key: 'workflow.tiers',
      label: 'Support Tiers',
      sort: 71,
      formula:
        dashboardWorkflowCountFormula_(
          'tiers'
        ),
      notes: 'Configured support tiers.'
    },
    {
      key: 'workflow.ticket_steps',
      label: 'Ticket Steps',
      sort: 72,
      formula:
        dashboardWorkflowCountFormula_(
          'ticketSteps'
        ),
      notes: 'Configured ticket workflow steps.'
    },
    {
      key: 'workflow.workflows',
      label: 'Workflows',
      sort: 73,
      formula:
        dashboardWorkflowCountFormula_(
          'workflows'
        ),
      notes: 'Configured routing workflows.'
    },
    {
      key: 'backup_schedule.total',
      label: 'Backup Jobs',
      sort: 80,
      moduleId: 'backups',
      formula:
        dashboardCountFormula_(
          'Backup Schedule',
          'Server Name'
        ),
      notes: 'Enabled Backup Schedule records.'
    }
  ];

  return definitions
    .filter(definition =>
      !definition.moduleId ||
      isModuleEnabled_(
        definition.moduleId
      )
    );
}


function dashboardCountFormula_(
  sheetName,
  header
) {

  return '=COUNTA(' +
    dashboardColumnRange_(
      sheetName,
      header
    ) +
    ')';
}


function dashboardCountIfFormula_(
  sheetName,
  header,
  criterion
) {

  return '=COUNTIF(' +
    dashboardColumnRange_(
      sheetName,
      header
    ) +
    ',"' +
    String(criterion || '').replace(/"/g, '""') +
    '")';
}


function dashboardUniqueCountFormula_(
  sheetName,
  header
) {

  const range =
    dashboardColumnRange_(
      sheetName,
      header
    );

  return '=IFERROR(ROWS(UNIQUE(FILTER(' +
    range +
    ',' +
    range +
    '<>""))),0)';
}


function dashboardWorkflowCountFormula_(
  sectionKey
) {

  const definition =
    getNetworkDashboardSchema_()[
      'Department Workflow'
    ];

  const section =
    (definition.headerRanges || [])
      .find(item =>
        item.key === sectionKey
      );

  if (!section) {
    return '=0';
  }

  const nextHeaderRow =
    (definition.headerRanges || [])
      .map(item =>
        Number(item.row || 0)
      )
      .filter(row =>
        row > Number(section.row || 0)
      )
      .sort((left, right) =>
        left - right
      )[0] || getDashboardFormulaMaxRow_();

  const column =
    getColumnLetter_(
      Number(section.column || 1)
    );

  return '=COUNTA(' +
    quoteSheetName_(
      'Department Workflow'
    ) +
    '!' +
    column +
    (Number(section.row || 1) + 1) +
    ':' +
    column +
    (nextHeaderRow - 1) +
    ')';
}


function dashboardColumnRange_(
  sheetName,
  header
) {

  const column =
    getSchemaHeaderColumn_(
      sheetName,
      header
    );

  const letter =
    getColumnLetter_(
      column
    );

  return quoteSheetName_(
    sheetName
  ) +
    '!' +
    letter +
    '2:' +
    letter +
    getDashboardFormulaMaxRow_();
}


function dashboardQueryCountFormula_(
  section
) {

  const range =
    dashboardColumnRange_(
      section.sheetName,
      section.header
    );

  return '=IFERROR(QUERY(' +
    range +
    ',"select Col1, count(Col1) where Col1 is not null group by Col1 label count(Col1) \'\'",0),"")';
}


function getSchemaHeaderColumn_(
  sheetName,
  header
) {

  const definition =
    getNetworkDashboardSchema_()[sheetName];

  const index =
    definition &&
    definition.headers
      ? definition.headers.indexOf(header)
      : -1;

  if (index < 0) {
    throw new Error(
      'Dashboard formula cannot find header ' +
      header +
      ' on ' +
      sheetName +
      '.'
    );
  }

  return index + 1;
}


function quoteSheetName_(
  sheetName
) {

  return "'" +
    String(sheetName || '')
      .replace(/'/g, "''") +
    "'";
}


function getColumnLetter_(
  column
) {

  let value =
    Number(column || 0);

  let letter =
    '';

  while (value > 0) {

    const remainder =
      (value - 1) % 26;

    letter =
      String.fromCharCode(65 + remainder) +
      letter;

    value =
      Math.floor((value - 1) / 26);

  }

  return letter;
}


function setupNetworkDashboard(options) {

  options =
    options || {};

  const result =
    createSetupResult_();

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  invalidateModuleCache_();

  const schema =
    getActiveNetworkDashboardSchema_();


  Object.keys(schema)
    .forEach(sheetName => {
      setupSchemaSheet_(
        ss,
        sheetName,
        schema[sheetName],
        result
      );
    });

  ensureDashboardFormulaLayer_(
    ss,
    result
  );


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


function ensureEnabledOptionalModuleSheets_() {

  const result =
    createSetupResult_();

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const schema =
    getNetworkDashboardSchema_();


  getModuleStatusList_({
    includeCore: true
  })
    .filter(module =>
      module.optional &&
      module.enabled
    )
    .forEach(module => {

      (module.setupSheets || module.requiredSheets || [])
        .forEach(sheetName => {

          if (schema[sheetName]) {
            setupSchemaSheet_(
              ss,
              sheetName,
              schema[sheetName],
              result
            );
          }

        });

    });

  ensureDashboardFormulaLayer_(
    ss,
    result
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
    unmanagedSheets: [],
    warnings: [],
    errors: []
  };


  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  invalidateModuleCache_();

  const schema =
    getActiveNetworkDashboardSchema_();


  Object.keys(schema)
    .forEach(sheetName => {
      validateSchemaSheet_(
        ss,
        sheetName,
        schema[sheetName],
        result
      );
    });

  validateInactiveAndObsoleteSheets_(
    ss,
    schema,
    result
  );


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
    dashboard: {
      formulaLayerConfigured: false,
      metrics: 0,
      summarySections: 0
    },
    migrations: [],
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


  runSchemaMigrationIfNeeded_(
    sheet,
    sheetName,
    definition,
    result
  );


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

  applySheetControlledValidations_(
    sheet,
    sheetName,
    definition
  );


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


function applySheetControlledValidations_(
  sheet,
  sheetName,
  definition
) {

  if (!definition) {
    return;
  }

  const controlledOptions =
    getControlledOptionsForSheet_(
      sheetName
    );

  const fields =
    Object.keys(
      controlledOptions
    );

  if (!fields.length) {
    return;
  }

  if (definition.headers) {
    applyControlledValidationsForHeaderRow_(
      sheet,
      1,
      1,
      Math.max(
        sheet.getLastColumn(),
        definition.headers.length
      ),
      Math.max(
        sheet.getMaxRows() - 1,
        1
      ),
      controlledOptions,
      fields
    );
  }

  const headerRanges =
    definition.headerRanges || [];

  headerRanges.forEach(rangeDefinition => {

    const nextRange =
      headerRanges
        .filter(item =>
          Number(item.row) >
          Number(rangeDefinition.row)
        )
        .sort((left, right) =>
          Number(left.row) -
          Number(right.row)
        )[0];

    const validationRows =
      nextRange
        ? Math.max(
            Number(nextRange.row) -
            Number(rangeDefinition.row) -
            1,
            0
          )
        : Math.max(
            sheet.getMaxRows() -
            Number(rangeDefinition.row),
            0
          );

    if (!validationRows) {
      return;
    }

    applyControlledValidationsForHeaderRow_(
      sheet,
      rangeDefinition.row,
      rangeDefinition.column || 1,
      Math.max(
        sheet.getLastColumn(),
        rangeDefinition.headers.length
      ),
      validationRows,
      controlledOptions,
      fields
    );

  });
}


function applyControlledValidationsForHeaderRow_(
  sheet,
  headerRow,
  startColumn,
  width,
  validationRows,
  controlledOptions,
  fields
) {

  const headers =
    sheet
      .getRange(
        headerRow,
        startColumn,
        1,
        width
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );

  fields.forEach(field => {

    const localIndex =
      headers.indexOf(field);

    const options =
      controlledOptions[field] || [];

    if (
      localIndex < 0 ||
      !options.length
    ) {
      return;
    }

    const rule =
      SpreadsheetApp
        .newDataValidation()
        .requireValueInList(
          options,
          true
        )
        .setAllowInvalid(false)
        .build();

    sheet
      .getRange(
        headerRow + 1,
        startColumn + localIndex,
        validationRows,
        1
      )
      .setDataValidation(
        rule
      );

  });
}


function ensureDashboardFormulaLayer_(
  ss,
  result
) {

  const sheet =
    ss.getSheetByName(
      'Dashboard'
    );

  if (!sheet) {
    return;
  }

  const headers =
    getDashboardSheetHeaders_();

  const readRows =
    getDashboardReadRowCount_();

  const clearRows =
    Math.max(
      sheet.getLastRow(),
      readRows
    );

  const clearColumns =
    Math.max(
      sheet.getLastColumn(),
      8
    );


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


  if (clearRows > 1) {

    sheet
      .getRange(
        2,
        1,
        clearRows - 1,
        clearColumns
      )
      .clearContent();

  }


  const metricRows =
    getDashboardMetricDefinitions_()
      .sort((left, right) =>
        Number(left.sort || 0) -
          Number(right.sort || 0)
      )
      .map(metric => [
        metric.key,
        metric.label,
        metric.formula,
        'metric',
        metric.sort,
        metric.notes || ''
      ]);


  if (metricRows.length) {

    sheet
      .getRange(
        2,
        1,
        metricRows.length,
        headers.length
      )
      .setValues(
        metricRows
      );

  }


  getDashboardSummarySections_()
    .forEach(section => {

      sheet
        .getRange(
          section.row,
          section.column,
          1,
          2
        )
        .setValues([[
          section.title,
          ''
        ]]);

      sheet
        .getRange(
          section.row + 1,
          section.column,
          1,
          2
        )
        .setValues([[
          'Label',
          'Value'
        ]]);

      sheet
        .getRange(
          section.row + 2,
          section.column
        )
        .setFormula(
          dashboardQueryCountFormula_(
            section
          )
        );

    });


  if (result) {

    result.dashboard = {
      formulaLayerConfigured: true,
      metrics:
        metricRows.length,
      summarySections:
        getDashboardSummarySections_()
          .length
    };

  }
}


function runSchemaMigrationIfNeeded_(
  sheet,
  sheetName,
  definition,
  result
) {

  if (
    definition.migration ===
    'internetWanBandwidth'
  ) {
    migrateInternetWanBandwidthIfNeeded_(
      sheet,
      sheetName,
      definition,
      result
    );
    return;
  }

  if (
    definition.migration !==
    'unifySecurityCameras'
  ) {
    return;
  }


  migrateLegacySecurityCamerasIfNeeded_(
    sheet,
    sheetName,
    definition,
    result
  );
}


function migrateInternetWanBandwidthIfNeeded_(
  sheet,
  sheetName,
  definition,
  result
) {

  const lastColumn =
    Math.max(
      sheet.getLastColumn(),
      1
    );

  const lastRow =
    Math.max(
      sheet.getLastRow(),
      1
    );

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );

  const downloadIndex =
    headers.indexOf(
      'Download Bandwidth'
    );

  const uploadIndex =
    headers.indexOf(
      'Upload Bandwidth'
    );

  const bandwidthIndex =
    headers.indexOf(
      'Bandwidth'
    );

  if (
    downloadIndex < 0 &&
    uploadIndex < 0
  ) {
    return;
  }

  const canonicalHeaders =
    definition.headers || [];

  const extraHeaders =
    headers.filter(header =>
      header &&
      !canonicalHeaders.includes(header) &&
      header !== 'Download Bandwidth' &&
      header !== 'Upload Bandwidth'
    );

  const nextHeaders =
    canonicalHeaders.concat(
      extraHeaders
    );

  const values =
    sheet
      .getRange(
        1,
        1,
        lastRow,
        lastColumn
      )
      .getDisplayValues();

  const nextValues =
    [nextHeaders];

  values
    .slice(1)
    .forEach(row => {

      const rowObject = {};

      headers.forEach((header, index) => {
        if (header) {
          rowObject[header] =
            row[index];
        }
      });

      if (
        !String(rowObject.Bandwidth || '').trim()
      ) {
        rowObject.Bandwidth =
          mergeInternetWanLegacyBandwidth_(
            downloadIndex >= 0
              ? row[downloadIndex]
              : '',
            uploadIndex >= 0
              ? row[uploadIndex]
              : ''
          );
      }

      nextValues.push(
        nextHeaders.map(header =>
          rowObject[header] !== undefined
            ? rowObject[header]
            : ''
        )
      );

    });

  sheet.clearContents();

  sheet
    .getRange(
      1,
      1,
      nextValues.length,
      nextHeaders.length
    )
    .setValues(
      nextValues
    );

  if (
    result &&
    result.migrations
  ) {
    result.migrations.push({
      sheet: sheetName,
      message:
        'Migrated Download/Upload Bandwidth columns to canonical Bandwidth.'
    });
  }
}


function mergeInternetWanLegacyBandwidth_(
  download,
  upload
) {

  const down =
    formatInternetWanLegacyBandwidthValue_(
      download
    );

  const up =
    formatInternetWanLegacyBandwidthValue_(
      upload
    );

  if (
    !down &&
    !up
  ) {
    return '';
  }

  if (!down) {
    return up;
  }

  if (!up) {
    return down;
  }

  if (
    normalizeInternetWanLegacyBandwidthKey_(down) ===
    normalizeInternetWanLegacyBandwidthKey_(up)
  ) {
    return down;
  }

  return down +
    ' / ' +
    up;
}


function formatInternetWanLegacyBandwidthValue_(
  value
) {

  const text =
    String(value || '').trim();

  if (!text) {
    return '';
  }

  const numeric =
    Number(
      text.replace(/,/g, '')
    );

  if (
    Number.isFinite(numeric) &&
    numeric > 0
  ) {
    if (
      numeric >= 1000 &&
      numeric % 1000 === 0
    ) {
      return (
        numeric / 1000
      ) +
        ' Gbps';
    }

    return numeric +
      ' Mbps';
  }

  return text;
}


function normalizeInternetWanLegacyBandwidthKey_(
  value
) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}


function migrateLegacySecurityCamerasIfNeeded_(
  sheet,
  sheetName,
  definition,
  result
) {

  if (
    isCanonicalSecurityCameraSheet_(
      sheet,
      definition
    )
  ) {
    return;
  }


  if (
    !isLegacySecurityCameraSheet_(
      sheet
    )
  ) {
    return;
  }

  const legacyValues =
    sheet
      .getRange(
        1,
        1,
        Math.max(
          sheet.getLastRow(),
          20
        ),
        Math.max(
          sheet.getLastColumn(),
          6
        )
      )
      .getDisplayValues();

  const migratedRows =
    buildUnifiedSecurityCameraRows_(
      legacyValues
    );


  const ss =
    sheet.getParent();

  let backupName =
    migratedRows.length
      ? getExistingLegacyBackupSheetName_(
          ss,
          sheetName
        )
      : '';

  let backupCreated =
    false;

  if (
    migratedRows.length &&
    !backupName
  ) {

    backupName =
      getUniqueSheetName_(
        ss,
        sheetName +
        ' Legacy Backup'
      );

    try {

      sheet
        .copyTo(ss)
        .setName(
          backupName
        );

      backupCreated =
        true;

    } catch (error) {

      result.warnings.push(
        sheetName +
        ' uses the old multi-section layout. Automatic migration was skipped because a backup sheet could not be created: ' +
        error.message
      );

      return;

    }

  }


  sheet.clear();

  sheet
    .getRange(
      1,
      1,
      1,
      definition.headers.length
    )
    .setValues([
      definition.headers
    ]);


  if (migratedRows.length) {

    sheet
      .getRange(
        2,
        1,
        migratedRows.length,
        definition.headers.length
      )
      .setValues(
        migratedRows
      );

  }


  result.migrations.push({
    sheet: sheetName,
    message:
      'Migrated old multi-section Security Cameras layout to one canonical table.',
    backupSheet:
      backupCreated
        ? backupName
        : '',
    rowsMigrated:
      migratedRows.length
  });
}


function isCanonicalSecurityCameraSheet_(
  sheet,
  definition
) {

  if (sheet.getLastRow() < 1) {
    return false;
  }


  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        definition.headers.length
      )
      .getDisplayValues()[0]
      .map(value =>
        String(value || '').trim()
      );


  return definition.requiredHeaders
    .every(header =>
      headers.includes(header)
    );
}


function isLegacySecurityCameraSheet_(
  sheet
) {

  if (sheet.getLastRow() < 1) {
    return false;
  }


  const width =
    Math.max(
      sheet.getLastColumn(),
      6
    );

  const readRows =
    Math.max(
      Math.min(
        sheet.getLastRow(),
        20
      ),
      1
    );

  const values =
    sheet
      .getRange(
        1,
        1,
        readRows,
        width
      )
      .getDisplayValues();

  const row1 =
    normalizeHeaderSlice_(
      values[0] || [],
      6
    );

  const row13 =
    normalizeHeaderSlice_(
      values[12] || [],
      6
    );

  const row19 =
    normalizeHeaderSlice_(
      values[18] || [],
      6
    );


  return (
    isLegacyCameraSystemHeader_(row1) &&
    (
      isLegacyCameraSystemHeader_(row13) ||
      isLegacyCameraSoftwareHeader_(row19)
    )
  );
}


function normalizeHeaderSlice_(
  row,
  width
) {

  return row
    .slice(0, width)
    .map(value =>
      String(value || '').trim()
    );
}


function isLegacyCameraSystemHeader_(
  headers
) {

  return (
    headers[0] === 'Site' &&
    headers[1] === 'IP' &&
    headers[2] === 'User' &&
    headers[3] === 'Password'
  );
}


function isLegacyCameraSoftwareHeader_(
  headers
) {

  return (
    headers[0] === 'Site' &&
    headers[1] === 'IP' &&
    headers[2] === 'Type' &&
    headers[3] === 'User'
  );
}


function buildUnifiedSecurityCameraRows_(
  values
) {

  const rows = [];

  appendLegacyCameraSectionRows_(
    rows,
    values,
    {
      category: 'Primary Site',
      type: 'Camera System',
      startIndex: 1,
      endIndex: 12,
      software: false
    }
  );

  appendLegacyCameraSectionRows_(
    rows,
    values,
    {
      category: 'Secondary Site',
      type: 'Camera System',
      startIndex: 13,
      endIndex: 18,
      software: false
    }
  );

  appendLegacyCameraSectionRows_(
    rows,
    values,
    {
      category: 'Software',
      type: '',
      startIndex: 19,
      endIndex: values.length,
      software: true
    }
  );

  return rows;
}


function appendLegacyCameraSectionRows_(
  output,
  values,
  section
) {

  for (
    let rowIndex = section.startIndex;
    rowIndex < section.endIndex;
    rowIndex++
  ) {

    const row =
      values[rowIndex] || [];

    const location =
      String(row[0] || '').trim();

    const ipAddress =
      String(row[1] || '').trim();

    const type =
      section.software
        ? String(row[2] || '').trim()
        : section.type;

    const username =
      String(
        row[section.software ? 3 : 2] ||
        ''
      ).trim();

    const password =
      section.software
        ? ''
        : String(row[3] || '').trim();

    const serverLocation =
      String(
        row[4] ||
        ''
      ).trim();

    const notes =
      String(
        row[5] ||
        ''
      ).trim();


    if (
      !location &&
      !ipAddress &&
      !type &&
      !username &&
      !password &&
      !serverLocation &&
      !notes
    ) {
      continue;
    }


    output.push([
      location,
      '',
      section.category,
      type,
      ipAddress,
      username,
      password,
      serverLocation,
      notes
    ]);

  }
}


function getUniqueSheetName_(
  ss,
  baseName
) {

  const timestamp =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone() ||
        'Etc/UTC',
      'yyyyMMdd-HHmmss'
    );

  let name =
    baseName +
    ' ' +
    timestamp;

  let suffix =
    2;


  while (ss.getSheetByName(name)) {

    name =
      baseName +
      ' ' +
      timestamp +
      ' ' +
      suffix;

    suffix++;
  }


  return name;
}


function getExistingLegacyBackupSheetName_(
  ss,
  sheetName
) {

  const prefix =
    sheetName +
    ' Legacy Backup ';

  return ss
    .getSheets()
    .map(sheet =>
      sheet.getName()
    )
    .filter(name =>
      name.indexOf(prefix) === 0
    )
    .sort()
    .pop() || '';
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


  if (
    definition.migration ===
    'unifySecurityCameras' &&
    isLegacySecurityCameraSheet_(
      sheet
    ) &&
    !isCanonicalSecurityCameraSheet_(
      sheet,
      definition
    )
  ) {
    result.warnings.push(
      sheetName +
      ' uses the old multi-section layout. Run setupNetworkDashboard() to migrate it into the unified table with a backup sheet.'
    );
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

  if (definition.dashboardFormulaLayer) {
    validateDashboardFormulaLayer_(
      sheet,
      result
    );
  }

  if (sheetName === 'Internet WAN') {
    validateInternetWanRows_(
      sheet,
      definition,
      result
    );
  }

  if (sheetName === 'Outages') {
    validateOutageRows_(
      sheet,
      definition,
      result
    );
  }


  result.sheets.push(
    sheetResult
  );
}


function validateDashboardFormulaLayer_(
  sheet,
  result
) {

  const rows =
    getDashboardReadRowCount_();

  const width =
    Math.max(
      getDashboardSheetHeaders_().length,
      8
    );

  const values =
    sheet
      .getRange(
        1,
        1,
        rows,
        width
      )
      .getDisplayValues();

  const formulas =
    sheet
      .getRange(
        1,
        1,
        rows,
        width
      )
      .getFormulas();

  const keyRows = {};

  values.forEach((row, index) => {

    const key =
      String(row[0] || '').trim();

    const section =
      String(row[3] || '').trim();

    if (
      key &&
      section === 'metric'
    ) {
      keyRows[key] =
        index;
    }

  });


  getDashboardMetricDefinitions_()
    .forEach(metric => {

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            keyRows,
            metric.key
          )
      ) {
        result.errors.push(
          'Missing Dashboard metric row: ' +
          metric.key
        );
        return;
      }

      if (
        !formulas[
          keyRows[metric.key]
        ][2]
      ) {
        result.errors.push(
          'Missing Dashboard formula for metric: ' +
          metric.key
        );
      }

    });


  getDashboardSummarySections_()
    .forEach(section => {

      const formula =
        formulas[
          section.row + 1
        ] &&
        formulas[
          section.row + 1
        ][section.column - 1];

      if (!formula) {
        result.errors.push(
          'Missing Dashboard summary formula: ' +
          section.title
        );
      }

    });
}


function validateInternetWanRows_(
  sheet,
  definition,
  result
) {

  const headers =
    definition.headers || [];

  if (sheet.getLastRow() < 2) {
    return;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        headers.length
      )
      .getDisplayValues();

  const seenCircuitIds = {};

  values.forEach((row, index) => {

    if (
      !rowHasMeaningfulData_(
        row,
        headers
      )
    ) {
      return;
    }

    const rowNumber =
      index + 2;

    const record = {};

    headers.forEach((header, columnIndex) => {
      record[header] =
        row[columnIndex];
    });

    const circuitId =
      String(
        record['Circuit ID'] || ''
      ).trim();

    if (!circuitId) {
      result.errors.push(
        'Internet WAN row ' +
        rowNumber +
        ': Circuit ID is required.'
      );
    } else if (seenCircuitIds[circuitId]) {
      result.errors.push(
        'Internet WAN row ' +
        rowNumber +
        ': Duplicate Circuit ID ' +
        circuitId +
        '.'
      );
    } else {
      seenCircuitIds[circuitId] =
        true;
    }

    try {
      normalizeInternetWanRecord_(
        record
      );
    } catch (error) {
      result.errors.push(
        'Internet WAN row ' +
        rowNumber +
        ': ' +
        (
          error && error.message
            ? error.message
            : String(error)
        )
      );
    }

  });
}


function validateOutageRows_(
  sheet,
  definition,
  result
) {

  const headers =
    definition.headers || [];

  if (sheet.getLastRow() < 2) {
    return;
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        headers.length
      )
      .getDisplayValues();

  const seenOutageIds = {};
  const seenExternalIds = {};

  values.forEach((row, index) => {

    if (
      !rowHasMeaningfulData_(
        row,
        headers
      )
    ) {
      return;
    }

    const rowNumber =
      index + 2;

    const record = {};

    headers.forEach((header, columnIndex) => {
      record[header] =
        row[columnIndex];
    });

    const outageId =
      String(
        record['Outage ID'] || ''
      ).trim();

    if (!outageId) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Outage ID is required.'
      );
    } else if (seenOutageIds[outageId]) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Duplicate Outage ID ' +
        outageId +
        '.'
      );
    } else {
      seenOutageIds[outageId] =
        true;
    }

    const source =
      String(
        record.Source || ''
      ).trim();

    if (
      !String(
        record['Circuit ID'] || ''
      ).trim()
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Circuit ID is required.'
      );
    }

    if (
      !String(
        record.Started || ''
      ).trim()
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Started is required.'
      );
    }

    if (!source) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Source is required.'
      );
    }

    if (
      source &&
      ![
        'Manual',
        'UptimeRobot'
      ].includes(source)
    ) {
      result.warnings.push(
        'Outages row ' +
        rowNumber +
        ': Unknown outage source "' +
        source +
        '".'
      );
    }

    const status =
      String(
        record.Status || ''
      ).trim();

    if (!status) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Status is required.'
      );
    }

    if (
      status &&
      ![
        'Ongoing',
        'Restored'
      ].includes(status)
    ) {
      result.warnings.push(
        'Outages row ' +
        rowNumber +
        ': Unknown outage status "' +
        status +
        '".'
      );
    }

    const externalId =
      String(
        record['External Event ID'] || ''
      ).trim();

    if (
      source === 'UptimeRobot' &&
      !externalId
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': UptimeRobot records require an External Event ID.'
      );
    }

    if (externalId) {
      if (seenExternalIds[externalId]) {
        result.errors.push(
          'Outages row ' +
          rowNumber +
          ': Duplicate External Event ID ' +
          externalId +
          '.'
        );
      } else {
        seenExternalIds[externalId] =
          true;
      }
    }

    const startedMs =
      Date.parse(
        record.Started || ''
      );

    const restoredMs =
      Date.parse(
        record.Restored || ''
      );

    if (
      record.Started &&
      isNaN(startedMs)
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Started must be a valid date/time.'
      );
    }

    if (
      record.Restored &&
      isNaN(restoredMs)
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Restored must be a valid date/time.'
      );
    }

    if (
      !isNaN(startedMs) &&
      !isNaN(restoredMs) &&
      restoredMs < startedMs
    ) {
      result.errors.push(
        'Outages row ' +
        rowNumber +
        ': Restored cannot be earlier than Started.'
      );
    }

  });
}


function validateInactiveAndObsoleteSheets_(
  ss,
  activeSchema,
  result
) {

  const allSchema =
    getNetworkDashboardSchema_();

  const activeSheets =
    Object.keys(activeSchema);


  Object.keys(allSchema)
    .filter(sheetName =>
      !activeSheets.includes(sheetName)
    )
    .forEach(sheetName => {

      if (
        ss.getSheetByName(
          sheetName
        )
      ) {

        const definition =
          allSchema[sheetName] || {};

        const inactiveReason =
          definition.type === 'integration'
            ? 'Disabled integration sheet is preserved but not validated.'
            : 'Inactive optional module sheet is preserved but not validated.';

        result.unmanagedSheets.push({
          sheet: sheetName,
          reason:
            inactiveReason
        });

        result.warnings.push(
          sheetName +
          (
            definition.type === 'integration'
              ? ' exists for a disabled integration and is preserved but inactive.'
              : ' exists for a disabled optional module and is preserved but inactive.'
          )
        );

      }

    });


  if (
    ss.getSheetByName(
      'Replacement Switches'
    )
  ) {

    result.unmanagedSheets.push({
      sheet:
        'Replacement Switches',
      reason:
        'Obsolete sheet from a previous template version; no longer managed.'
    });

    result.warnings.push(
      'Replacement Switches exists but is no longer a managed Network Dashboard sheet.'
    );

  }
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
    'Dashboard',
    result.dashboard &&
      result.dashboard.formulaLayerConfigured
      ? result.dashboard.metrics +
          ' metric formulas configured\n' +
          result.dashboard.summarySections +
          ' summary sections configured'
      : 'Formula layer not configured',
    '',
    'Migrations',
    result.migrations &&
      result.migrations.length
      ? result.migrations
          .map(item =>
            item.sheet +
            ': ' +
            item.message
          )
          .join('\n')
      : 'None',
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
    'Unmanaged sheets: ' +
      (result.unmanagedSheets || []).length,
    '',
    'Errors',
    result.errors.length
      ? result.errors.join('\n')
      : 'None',
    '',
    'Warnings',
    result.warnings.length
      ? result.warnings.join('\n')
      : 'None',
    '',
    'Unmanaged Sheets',
    result.unmanagedSheets &&
      result.unmanagedSheets.length
      ? result.unmanagedSheets
          .map(item =>
            item.sheet +
            ': ' +
            item.reason
          )
          .join('\n')
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
    'Optionally configure break-glass administrators in Script Properties.',
    'Add Script Properties for desired integrations.',
    'Add users and permissions.',
    'Deploy or open the Apps Script web application.'
  ];
}
