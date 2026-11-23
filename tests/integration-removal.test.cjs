const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');
const plain = value => JSON.parse(JSON.stringify(value));

test('Wazuh removal preserves legacy storage through reads, edits, and repeated Update Repair', () => {
  const h = createHarness();
  const servers = h.sheets.get('Servers');
  servers.data.splice(1);
  servers.data[0].push('Wazuh Installed', 'Legacy: Wazuh Installed');
  h.records('Servers', [{ 'Server Name': 'Retained server', 'IP Address': '10.0.0.8',
    Type: 'Virtual', Status: 'Online', Notes: 'Existing note',
    'Wazuh Installed': 'historical-agent-value', 'Legacy: Wazuh Installed': '=1+2' }]);
  const integrations = h.sheets.get('App Integrations');
  const legacy = integrations.data[0].map(header => ({
    'Integration ID': 'wazuh', 'Display Name': 'Wazuh', Enabled: true,
    'Config JSON': '{"organization":"preserve"}', 'Last Status': 'Historical status'
  })[header] ?? '');
  integrations.data.push(legacy);
  const before = JSON.stringify(integrations.data);
  h.properties.set('WAZUH_CUSTOM_TOKEN', 'fixture-preserve-only');
  const customTrigger = h.context.ScriptApp.newTrigger('customWazuhSync').timeBased().everyDays(1).create();
  const originalValues = servers.data[1].slice();

  for (const repair of [false, true, true]) {
    if (repair) h.invoke('updateNetworkDashboard', [{ silent: true }]);
    for (const refresh of [true, false]) {
      const data = h.invoke('appGetPageData', ['servers', refresh]);
      assert.ok(!JSON.stringify(data).includes('Wazuh'));
      assert.ok(!JSON.stringify(data).includes('historical-agent-value'));
      assert.deepEqual(h.calls.filter(call => /^(set|clear|append|insert|delete)/.test(call.name)), []);
    }
    assert.deepEqual(servers.data[1], originalValues);
    assert.equal(JSON.stringify(integrations.data), before);
    assert.equal(h.properties.get('WAZUH_CUSTOM_TOKEN'), 'fixture-preserve-only');
    assert.ok(h.triggers.includes(customTrigger));
  }
  h.invoke('appUpdateRecord', ['servers', 2, { 'Server Name': 'Retained server', Notes: 'Edited note' }]);
  assert.equal(servers.data[1][servers.data[0].indexOf('Wazuh Installed')], 'historical-agent-value');
  assert.equal(servers.data[1][servers.data[0].indexOf('Legacy: Wazuh Installed')], '=1+2');
});

test('Wazuh legacy enablement cannot register UI, affect health counts, or enable actions', () => {
  const h = createHarness();
  const expected = ['aruba_central', 'threatdown', 'uptimerobot'];
  const health = plain(h.invoke('buildDashboardIntegrationHealth_'));
  const integrations = h.sheets.get('App Integrations');
  integrations.data.push(integrations.data[0].map(header => ({
    'Integration ID': 'wazuh', 'Display Name': 'Wazuh', Enabled: true,
    'Config JSON': '{}'
  })[header] ?? ''));
  assert.deepEqual(Object.keys(h.context.getIntegrationRegistry_()), expected);
  assert.deepEqual(plain(h.invoke('buildDashboardIntegrationHealth_')), health);
  for (const settings of [h.invoke('getSettingsPageData_'),
    h.invoke('saveAppSettings', [{ 'branding.favicon_url': 'https://example.test/icon.png' }]),
    h.invoke('saveIntegrationConfig', ['uptimerobot', { enabled: false, settings: {} }]),
    h.invoke('saveIntegrationConfig', ['uptimerobot', { enabled: true, settings: {} }])]) {
    assert.deepEqual(plain(settings.integrations.map(item => item.id)), expected);
  }
  for (const method of ['saveIntegrationConfig', 'testIntegrationConnection', 'runIntegrationSync']) {
    assert.throws(() => h.invoke(method, ['wazuh', { enabled: true }]), /Unknown integration/);
  }
  assert.ok(!JSON.stringify(h.invoke('getAppBootstrap')).toLowerCase().includes('wazuh'));
});

test('fresh setup and older header migration never initialize Wazuh functionality', () => {
  const h = createHarness();
  const definition = h.context.getNetworkDashboardSchema_().Servers;
  assert.ok(!definition.headers.includes('Wazuh Installed'));
  const servers = h.sheets.get('Servers');
  servers.data.splice(0, servers.data.length, ['Server Name', 'Wazuh Installed'], ['Old server', 'Preserve']);
  const result = { migrations: [] };
  h.invoke('applySchemaRefinements_', [servers, 'Servers', definition, result]);
  h.invoke('applySchemaRefinements_', [servers, 'Servers', definition, result]);
  assert.deepEqual(servers.data, [['Server Name', 'Legacy: Wazuh Installed'], ['Old server', 'Preserve']]);
  assert.equal(result.migrations.length, 1);
  h.sheets.clear();
  h.invoke('setupNetworkDashboard', [{ silent: true }]);
  assert.ok(!JSON.stringify(h.sheets.get('App Integrations').data).toLowerCase().includes('wazuh'));
  assert.ok(!h.sheets.get('Servers').data[0].includes('Wazuh Installed'));
  assert.ok(!h.triggers.some(trigger => /wazuh/i.test(trigger.getHandlerFunction())));
  assert.ok(!JSON.stringify(h.invoke('validateNetworkDashboard', [{ silent: true }])).toLowerCase().includes('wazuh'));
  assert.doesNotThrow(() => h.invoke('getAppBootstrap'));
});
