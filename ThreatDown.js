function getThreatDownToken_() {

  const props =
    PropertiesService.getScriptProperties();

  const accountId =
    props.getProperty(
      'THREATDOWN_ACCOUNT_ID'
    );

  const clientId =
    props.getProperty(
      'THREATDOWN_CLIENT_ID'
    );

  const clientSecret =
    props.getProperty(
      'THREATDOWN_CLIENT_SECRET'
    );


  if (
    !accountId ||
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      'Missing THREATDOWN_ACCOUNT_ID, THREATDOWN_CLIENT_ID, or THREATDOWN_CLIENT_SECRET in Script Properties.'
    );
  }


  const authString =
    Utilities.base64Encode(
      clientId +
      ':' +
      clientSecret
    );

  const authResp =
    UrlFetchApp.fetch(
      'https://api.malwarebytes.com/oauth2/token',
      {
        method: 'post',
        headers: {
          'Authorization': 'Basic ' + authString,
          'Content-Type':
            'application/x-www-form-urlencoded'
        },
        payload:
          'grant_type=client_credentials&scope=read',
        muteHttpExceptions: true
      }
    );

  if (authResp.getResponseCode() !== 200) {
    throw new Error(
      'ThreatDown token exchange failed.'
    );
  }


  return {
    accountId: accountId,
    accessToken:
      JSON.parse(
        authResp.getContentText()
      ).access_token
  };
}


function testThreatDownConnection_() {

  return getThreatDownToken_();
}


function syncThreatDownToSheet() {

  requireAdmin_();

  const status =
    getIntegrationStatusById_(
      'threatdown'
    );

  if (!status.configurationComplete) {
    return {
      status: 'not_configured'
    };
  }

  if (!status.enabled) {
    return {
      status: 'disabled'
    };
  }


  const auth =
    getThreatDownToken_();

  const endpointResp =
    UrlFetchApp.fetch(
      'https://api.malwarebytes.com/nebula/v1/endpoints',
      {
        method: 'get',
        headers: {
          'Authorization':
            'Bearer ' +
            auth.accessToken,
          'accountid':
            auth.accountId
        },
        muteHttpExceptions: true
      }
    );

  if (endpointResp.getResponseCode() !== 200) {

    updateIntegrationRuntimeStatus_(
      'threatdown',
      '',
      'Sync failed'
    );

    return {
      status: 'error'
    };

  }


  const endpoints =
    JSON.parse(
      endpointResp.getContentText()
    ).endpoints || [];

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const serversSheet =
    ss.getSheetByName('Servers');

  if (!serversSheet) {
    return {
      status: 'success',
      endpointsFound: endpoints.length
    };
  }


  const data =
    serversSheet
      .getDataRange()
      .getValues();

  if (!data.length) {
    return {
      status: 'success',
      endpointsFound: endpoints.length
    };
  }


  const headers =
    data[0]
      .map(header =>
        String(header).trim()
      );

  const nameIdx =
    headers.indexOf('Server Name');

  const ipIdx =
    headers.indexOf('IP Address');

  let tdIdx =
    headers.indexOf('ThreatDown Installed');

  if (tdIdx === -1) {
    tdIdx =
      headers.indexOf('Threatdown Installed');
  }


  if (tdIdx === -1) {
    return {
      status: 'success',
      endpointsFound: endpoints.length
    };
  }


  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    const serverName =
      nameIdx !== -1
        ? String(data[i][nameIdx])
            .toLowerCase()
            .trim()
        : '';

    const serverIp =
      ipIdx !== -1
        ? String(data[i][ipIdx]).trim()
        : '';

    const isInstalled =
      endpoints.some(endpoint =>
        (
          serverName &&
          endpoint.host_name &&
          endpoint.host_name
            .toLowerCase()
            .includes(serverName)
        ) ||
        (
          serverIp &&
          endpoint.ip_address &&
          endpoint.ip_address === serverIp
        )
      );

    serversSheet
      .getRange(
        i + 1,
        tdIdx + 1
      )
      .setValue(
        isInstalled
          ? 'TRUE'
          : 'FALSE'
      );

  }


  updateIntegrationRuntimeStatus_(
    'threatdown',
    new Date(),
    'Sync succeeded'
  );

  clearAllCache();

  return {
    status: 'success',
    endpointsFound: endpoints.length
  };
}
