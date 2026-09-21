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
  outageSource: [
    'Manual',
    'UptimeRobot'
  ],
    outageStatus: [
      'Ongoing',
      'Restored'
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
    ],
    closetType: [
      'MDF',
      'IDF',
      'Server Room',
      'Demarc',
      'Telecom Room',
      'Other'
    ],
    changeStatus: [
      'Implemented',
      'Monitoring',
      'Rolled Back',
      'Retired'
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
    },
    outageSource: {
      manual: 'Manual',
      uptimerobot: 'UptimeRobot',
      uptime_robot: 'UptimeRobot',
      uptime: 'UptimeRobot'
    },
    outageStatus: {
      ongoing: 'Ongoing',
      open: 'Ongoing',
      active: 'Ongoing',
      down: 'Ongoing',
      restored: 'Restored',
      closed: 'Restored',
      resolved: 'Restored',
      up: 'Restored'
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

  if (sheetName === 'Outages') {
    map.Source =
      getControlledOptions_(
        'outageSource'
      );
    map.Status =
      getControlledOptions_(
        'outageStatus'
      );
  }

  if (sheetName === 'SSIDs') {
    map.Status =
      getControlledOptions_(
        'enabledDisabled'
      );
    map['Hidden SSID'] =
      getControlledOptions_(
        'yesNo'
      );
    map['MAC Authentication'] =
      getControlledOptions_(
        'yesNo'
      );
  }

  if (sheetName === 'Change Log') {
    map.Status =
      getControlledOptions_(
        'changeStatus'
      );
  }

  if (sheetName === 'Network Closets') {
    map.Type = getControlledOptions_('closetType');
    map['Redundant Power Available'] = getControlledOptions_('yesNo');
  }

  if (sheetName === 'Network Closet UPS') {
    map['Network Managed'] = getControlledOptions_('yesNo');
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

  if (sheetName === 'Outages') {
    if (field === 'Source') {
      return 'outageSource';
    }
    if (field === 'Status') {
      return 'outageStatus';
    }
  }

  if (sheetName === 'SSIDs') {
    if (field === 'Status') {
      return 'enabledDisabled';
    }
    if (
      field === 'Hidden SSID' ||
      field === 'MAC Authentication'
    ) {
      return 'yesNo';
    }
  }

  if (
    sheetName === 'Change Log' &&
    field === 'Status'
  ) {
    return 'changeStatus';
  }

  if (sheetName === 'Network Closets') {
    if (field === 'Type') return 'closetType';
    if (field === 'Redundant Power Available') return 'yesNo';
  }

  if (
    sheetName === 'Network Closet UPS' &&
    field === 'Network Managed'
  ) {
    return 'yesNo';
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
