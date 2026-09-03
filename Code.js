function doGet() {

  return withPerformanceTiming_(
    'doGet',
    function() {

  const config =
    AppConfig.getClientConfig_();

  const userEmail =
    getCurrentUserEmail_();

  const access =
    getUserAccess_(
      userEmail
    );


  if (!access.authorized) {

    const template =
      HtmlService
        .createTemplateFromFile(
          'AccessDenied'
        );

    template.userEmail =
      userEmail ||
      'Unknown Google Account';

    template.appName =
      config.appName;

    template.organizationName =
      config.organization.name ||
      'this organization';

    template.branding =
      config.branding;

    return template
      .evaluate()
      .setTitle(
        config.appName +
        ' - Access Restricted'
      )
      .addMetaTag(
        'viewport',
        'width=device-width, initial-scale=1'
      );

  }


  const template =
    HtmlService
      .createTemplateFromFile(
        'Index'
      );

  const bootstrap =
    buildAppBootstrap_(
      access,
      config
    );


  template.userEmail =
    userEmail;

  template.userAccess =
    access;

  template.appName =
    config.appName;

  template.initialBootstrapJson =
    safeJsonForHtml_(
      bootstrap
    );

  return template
    .evaluate()
    .setTitle(
      config.appName
    )
    .addMetaTag(
      'viewport',
      'width=device-width, initial-scale=1'
    );

    }
  );
}


function onOpen() {

  const ui =
    SpreadsheetApp.getUi();

  const menu =
    ui.createMenu('Network Dashboard')
    .addItem(
      'Setup / Initialize',
      'setupNetworkDashboard'
    )
    .addItem(
      'Validate Installation',
      'validateNetworkDashboardFromMenu'
    )
    .addItem(
      'Open Dashboard',
      'openNetworkDashboardFromMenu'
    );

  if (
    isNetworkDashboardDevSeedAvailable_()
  ) {
    menu
      .addSeparator()
      .addItem(
        'Seed Test Data',
        'seedNetworkDashboardTestDataFromMenu'
      )
      .addItem(
        'Reset Development Environment',
        'resetNetworkDashboardDevEnvironmentFromMenu'
      );
  }

  menu
    .addSeparator()
    .addItem(
      'About',
      'showNetworkDashboardAbout'
    )
    .addToUi();
}


function isNetworkDashboardDevSeedAvailable_() {

  return typeof seedNetworkDashboardTestData === 'function' &&
    typeof runNetworkDashboardDevReset === 'function';
}


function seedNetworkDashboardTestDataFromMenu() {

  const ui =
    SpreadsheetApp.getUi();

  if (
    !isNetworkDashboardDevSeedAvailable_()
  ) {
    ui.alert(
      'DevSeed is not available in this Apps Script project.'
    );
    return;
  }

  try {
    const result =
      seedNetworkDashboardTestData();

    SpreadsheetApp
      .getActive()
      .toast(
        'Test data seeded successfully.',
        'Network Dashboard',
        8
      );

    return result;

  } catch (error) {
    SpreadsheetApp
      .getActive()
      .toast(
        'Test data seed failed. Check execution logs.',
        'Network Dashboard',
        8
      );
    throw error;
  }
}


function resetDevelopmentEnvironmentFromMenuMessage_() {

  return [
    'This will reset the Network Dashboard development environment.',
    '',
    'Only DevSeed-managed sheets, test data and manifest records will be reset.',
    'Non-DevSeed-owned data and Script Properties are preserved by the existing reset safeguards.'
  ].join('\n');
}


function resetNetworkDashboardDevEnvironmentFromMenu() {

  const ui =
    SpreadsheetApp.getUi();

  if (
    !isNetworkDashboardDevSeedAvailable_()
  ) {
    ui.alert(
      'DevSeed is not available in this Apps Script project.'
    );
    return;
  }

  const response =
    ui.alert(
      'Reset Development Environment?',
      resetDevelopmentEnvironmentFromMenuMessage_(),
      ui.ButtonSet.OK_CANCEL
    );

  if (
    response !== ui.Button.OK
  ) {
    SpreadsheetApp
      .getActive()
      .toast(
        'Development reset canceled.',
        'Network Dashboard',
        5
      );
    return;
  }

  try {
    const result =
      runNetworkDashboardDevReset();

    SpreadsheetApp
      .getActive()
      .toast(
        'Development environment reset successfully.',
        'Network Dashboard',
        8
      );

    return result;

  } catch (error) {
    SpreadsheetApp
      .getActive()
      .toast(
        'Development reset failed. Check execution logs.',
        'Network Dashboard',
        8
      );
    throw error;
  }
}


function validateNetworkDashboardFromMenu() {

  return validateNetworkDashboard();
}


function openNetworkDashboardFromMenu() {

  const url =
    AppConfig.get(
      'app.web_app_url'
    );

  const ui =
    SpreadsheetApp.getUi();


  if (!url) {

    ui.alert(
      'Network Dashboard web app URL is not configured. Deploy the Apps Script web app, then save the deployment URL in Settings or App Settings key app.web_app_url.'
    );

    return;
  }


  const html =
    HtmlService
      .createHtmlOutput(
        '<div style="font-family:Arial,sans-serif;padding:16px;">' +
        '<h2 style="margin:0 0 10px;">Open Network Dashboard</h2>' +
        '<p style="margin:0 0 14px;color:#4b5563;">Use the configured deployment URL below.</p>' +
        '<a href="' +
        escapeHtmlServer_(url) +
        '" target="_blank" rel="noopener" style="display:inline-block;padding:10px 14px;background:#17345f;color:white;text-decoration:none;border-radius:6px;">Open Dashboard</a>' +
        '</div>'
      )
      .setWidth(420)
      .setHeight(190);

  ui.showModalDialog(
    html,
    'Network Dashboard'
  );
}


function showNetworkDashboardAbout() {

  const config =
    AppConfig.getClientConfig_();

  SpreadsheetApp
    .getUi()
    .alert(
      [
        config.appName,
        '',
        'Application version: ' +
          NETWORK_DASHBOARD_VERSION,
        'Schema version: ' +
          NETWORK_DASHBOARD_SCHEMA_VERSION,
        '',
        'Break-glass Script Property:',
        NETWORK_DASHBOARD_BREAK_GLASS_ADMINS_PROPERTY
      ].join('\n')
    );
}


function checkAuth() {

  const access =
    getUserAccess_(
      getCurrentUserEmail_()
    );

  if (!access.authorized) {
    throw new Error(
      'Unauthorized access.'
    );
  }

  return access;
}


function clearAllCache() {

  clearAppDataCaches_();

  return {
    status: 'success'
  };
}


function escapeHtmlServer_(value) {

  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function safeJsonForHtml_(value) {

  const json =
    JSON.stringify(
      value == null ? null : value
    );


  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
