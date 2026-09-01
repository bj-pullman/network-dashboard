function doGet() {

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

  template.userEmail =
    userEmail;

  template.userAccess =
    access;

  template.appName =
    config.appName;

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


function onOpen() {

  SpreadsheetApp
    .getUi()
    .createMenu('Network Dashboard')
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
    )
    .addSeparator()
    .addItem(
      'About',
      'showNetworkDashboardAbout'
    )
    .addToUi();
}


function validateNetworkDashboardFromMenu() {

  const result =
    validateNetworkDashboard();

  SpreadsheetApp
    .getUi()
    .alert(
      formatValidationSummary_(
        result
      )
    );
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

  const cache =
    CacheService.getScriptCache();

  cache.remove(
    'app_dashboard'
  );

  cache.remove(
    'app_department_workflow'
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
