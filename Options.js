function getControlledOptionDefinitions_() {

  return {
    infrastructureStatus: [
      'Online',
      'Offline',
      'Degraded',
      'Maintenance',
      'Unknown'
    ],
    wanRole: [
      'Primary',
      'Secondary',
      'Backup'
    ],
    wanServiceType: [
      'Fiber',
      'DIA',
      'Cable',
      'Fixed Wireless',
      'DSL',
      'Cellular',
      'Other'
    ],
    wanStatus: [
      'Active',
      'Standby',
      'Maintenance',
      'Disabled'
    ],
    wanHealth: [
      'Online',
      'Down',
      'Paused',
      'Unknown',
      'Not Monitored'
    ],
    uptimeRobotHealth: [
      'Online',
      'Down',
      'Paused',
      'Unknown'
    ],
    workflowPriority: [
      'P1',
      'P2',
      'P3',
      'P4'
    ],
    appRole: [
      'user',
      'admin'
    ],
    appPermission: [
      'view',
      'edit',
      'none'
    ],
    enabledDisabled: [
      'Enabled',
      'Disabled'
    ],
    yesNo: [
      'Yes',
      'No'
    ]
  };
}


function getControlledOptions_(
  key
) {

  return (
    getControlledOptionDefinitions_()[key] ||
    []
  ).slice();
}


function getControlledOptionAliases_() {

  return {
    infrastructureStatus: {
      up: 'Online',
      active: 'Online',
      running: 'Online',
      down: 'Offline',
      failed: 'Offline',
      warning: 'Degraded',
      impaired: 'Degraded',
      degraded: 'Degraded',
      planned: 'Maintenance',
      maintenance: 'Maintenance',
      unknown: 'Unknown'
    },
    wanStatus: {
      up: 'Active',
      active: 'Active',
      primary: 'Active',
      standby: 'Standby',
      backup: 'Standby',
      warning: 'Maintenance',
      maintenance: 'Maintenance',
      down: 'Disabled',
      disabled: 'Disabled',
      inactive: 'Disabled'
    },
    wanHealth: {
      up: 'Online',
      online: 'Online',
      started: 'Unknown',
      looks_down: 'Down',
      down: 'Down',
      paused: 'Paused',
      unknown: 'Unknown',
      not_monitored: 'Not Monitored'
    },
    uptimeRobotHealth: {
      up: 'Online',
      online: 'Online',
      looks_down: 'Down',
      down: 'Down',
      offline: 'Down',
      paused: 'Paused',
      unknown: 'Unknown'
    }
  };
}


function normalizeControlledOption_(
  key,
  value,
  label,
  required
) {

  const text =
    String(value || '').trim();

  if (!text) {
    if (required) {
      throw new Error(
        label +
        ' is required.'
      );
    }

    return '';
  }

  const options =
    getControlledOptions_(
      key
    );

  const aliases =
    getControlledOptionAliases_()[key] ||
    {};

  const lowered =
    text.toLowerCase();

  const alias =
    aliases[lowered];

  const match =
    options.find(option =>
      option.toLowerCase() ===
      lowered
    ) ||
    alias;

  if (!match) {
    throw new Error(
      label +
      ' must be one of: ' +
      options.join(', ') +
      '.'
    );
  }

  return match;
}


function getControlledOptionsForSheet_(
  sheetName
) {

  const map = {};

  if (
    [
      'Switches',
      'Access Points',
      'Servers',
      'Offline Servers'
    ].includes(sheetName)
  ) {
    map.Status =
      getControlledOptions_(
        'infrastructureStatus'
      );
  }

  if (sheetName === 'Internet WAN') {
    map.Role =
      getControlledOptions_(
        'wanRole'
      );
    map['Service Type'] =
      getControlledOptions_(
        'wanServiceType'
      );
    map.Status =
      getControlledOptions_(
        'wanStatus'
      );
  }

  if (sheetName === 'UptimeRobot') {
    map.Health =
      getControlledOptions_(
        'uptimeRobotHealth'
      );
  }

  if (sheetName === 'App Users') {
    map.Role =
      getControlledOptions_(
        'appRole'
      );
    map['Default Permission'] =
      getControlledOptions_(
        'appPermission'
      );
  }

  if (sheetName === 'Department Workflow') {
    map['Priority Level'] =
      getControlledOptions_(
        'workflowPriority'
      );
  }

  return map;
}


function getControlledOptionKeyForSheetField_(
  sheetName,
  field
) {

  if (
    [
      'Switches',
      'Access Points',
      'Servers',
      'Offline Servers'
    ].includes(sheetName) &&
    field === 'Status'
  ) {
    return 'infrastructureStatus';
  }

  if (sheetName === 'Internet WAN') {
    if (field === 'Role') {
      return 'wanRole';
    }
    if (field === 'Service Type') {
      return 'wanServiceType';
    }
    if (field === 'Status') {
      return 'wanStatus';
    }
  }

  if (
    sheetName === 'UptimeRobot' &&
    field === 'Health'
  ) {
    return 'uptimeRobotHealth';
  }

  if (sheetName === 'App Users') {
    if (field === 'Role') {
      return 'appRole';
    }
    if (field === 'Default Permission') {
      return 'appPermission';
    }
  }

  if (
    sheetName === 'Department Workflow' &&
    field === 'Priority Level'
  ) {
    return 'workflowPriority';
  }

  return '';
}


function normalizeControlledSheetField_(
  sheetName,
  field,
  value,
  required
) {

  const key =
    getControlledOptionKeyForSheetField_(
      sheetName,
      field
    );

  return key
    ? normalizeControlledOption_(
        key,
        value,
        field,
        required
      )
    : value;
}
