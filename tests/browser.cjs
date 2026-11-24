const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const { createPreviewServer } = require('./preview.cjs');
const { root } = require('./server-harness.cjs');

async function main() {
  const { server, harness, rpcCalls } = createPreviewServer();
  for (const key of ['THREATDOWN_ACCOUNT_ID', 'THREATDOWN_CLIENT_ID', 'THREATDOWN_CLIENT_SECRET']) {
    harness.properties.set(key, 'QA_ONLY_NOT_A_REAL_SECRET');
  }
  harness.records('Contacts', [
    { 'Contact Name': 'Fixture Helpdesk', Organization: 'Example Support', Category: 'Support',
      Email: 'desk@example.test', Status: 'Active', 'Systems / Services': 'Fixture wireless',
      Notes: 'Call only during business hours' },
    { 'Contact Name': 'Former Fixture Vendor', Organization: 'Example Service', Category: 'Contractor',
      Status: 'Inactive' }
  ]);
  harness.records('Switches', [
    { 'Device Label': 'Fixture Healthy Switch', 'Serial Number': 'FIXTURE-UP', Status: 'Online' },
    { 'Device Label': 'Fixture Down Switch', 'Serial Number': 'FIXTURE-DOWN', Status: 'Offline' },
    { 'Device Label': 'Fixture Warning Switch', 'Serial Number': 'FIXTURE-WARN', Status: 'Degraded' },
    { 'Device Label': 'Fixture Custom Status', 'Serial Number': 'FIXTURE-CUSTOM', Status: 'Site-specific rollout' }
  ]);
  harness.records('Change Log', Array.from({ length: 115 }, (_, index) => ({
    'Change Name': 'FIXTURE_BROWSER_CHANGE_CANARY',
    'Change Date': new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10),
    Status: 'Implemented'
  })));
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' }),
    headless: true
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const output = path.join(root, 'test-results');
  fs.mkdirSync(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
  const externalRequests = [];
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === url) return route.continue();
    externalRequests.push(new URL(route.request().url()).origin);
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  async function navigate(key) {
    console.log('Checking page: ' + key);
    await page.locator('.app-nav-item[data-page="' + key + '"]').click();
    await page.waitForFunction(key => window.networkDashboardPerformance?.at(-1)?.pageKey === key, key);
  }
  async function checkColumns(key) {
    const state = await page.evaluate(key => {
      const definition = RECORD_PAGE_DEFINITIONS[key];
      const structured = STRUCTURED_PAGE_DEFINITIONS[key];
      if (!definition && !structured) return null;
      const table = definition ? tableInstance : Object.values(structuredTables)[0];
      const expected = definition ? definition.defaultColumns.map(field =>
        table.getColumn(field)?.getDefinition().title || field) : Object.values(structured)[0].defaultColumns;
      const visible = table.getColumns().filter(column => column.isVisible()).map(column => column.getDefinition().title);
      const menu = document.querySelector(definition ? '#columnMenu' : '.column-menu-controls')?.parentElement;
      const checked = menu ? Array.from(menu.querySelectorAll('label')).filter(label => label.querySelector('input')?.checked)
        .map(label => label.querySelector('span').textContent.replace(/ \(required\)$/, '')) : [];
      return { expected, visible, checked };
    }, key);
    if (!state) return;
    assert.deepEqual(state.visible, [...state.expected, 'Actions'], key + ': default visible order');
    assert.deepEqual(state.checked.sort(), [...state.expected].sort(), key + ': column selector');
  }
  async function verifySharedHeading(label) {
    const heading = page.locator('#pageHeader h1');
    assert.equal(await heading.count(), 1);
    await page.getByRole('heading', { level: 1, name: label, exact: true }).waitFor();
    assert.deepEqual((await heading.locator('.title-slash[aria-hidden="true"]').allTextContents())
      .map(text => text.trim()), ['/', '/']);
    const type = await heading.evaluate(node => ({
      font: getComputedStyle(node).fontFamily,
      weight: Number(getComputedStyle(node).fontWeight),
      size: parseFloat(getComputedStyle(node).fontSize),
      color: getComputedStyle(node).color,
      slashes: Array.from(node.querySelectorAll('.title-slash'), slash => getComputedStyle(slash).color)
    }));
    assert.match(type.font, /Arial Black|Segoe UI/);
    assert.ok(type.weight >= 800, label);
    assert.ok(type.size >= 24, label);
    assert.deepEqual(type.slashes, [type.color, type.color]);
  }
  async function verifyHeadingLayout() {
    const original = await page.locator('#pageSubtitle').textContent();
    await page.evaluate(() => applyBranding({
      ...appBootstrap.config, branding: { ...appBootstrap.config.branding, headerFontColor: '#254d73' }
    }));
    assert.equal(await page.locator('#pageTitle').evaluate(node => getComputedStyle(node).color), 'rgb(37, 77, 115)');
    await verifySharedHeading('Change Log');
    await page.screenshot({ path: path.join(output, 'heading-desktop.png') });

    const long = 'District infrastructure change records with an unusually long unbroken RegionalOperationsImplementationReviewReference';
    await page.evaluate(text => setPageHeader(text, 'Long subtitle for responsive operational context.'), long);
    for (const width of [1440, 1024, 1000, 760, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await verifySharedHeading(long);
      const layout = await page.evaluate(() => {
        const box = node => node.getBoundingClientRect();
        const header = document.getElementById('pageHeader');
        const label = header.querySelector('.page-heading');
        const controls = header.querySelector('.page-header-controls');
        const title = document.getElementById('pageTitle');
        const buttons = Array.from(header.querySelectorAll('.btn')).filter(node => box(node).width > 0);
        const withinHeader = node => box(node).left >= box(header).left - 1 && box(node).right <= box(header).right + 1;
        return {
          contained: [title, ...buttons].every(withinHeader),
          noTitleOverflow: title.scrollWidth <= title.clientWidth + 1,
          disjoint: getComputedStyle(header).flexDirection === 'row'
            ? box(label).right < box(controls).left : box(label).bottom < box(controls).top,
          actionsVisible: buttons.length,
          actionRows: new Set(Array.from(document.querySelectorAll('#pageActions .btn'), node => Math.round(box(node).top))).size
        };
      });
      assert.ok(layout.contained && layout.noTitleOverflow && layout.disjoint, String(width));
      assert.ok(layout.actionsVisible >= 6, String(width));
      if (width === 320) {
        assert.ok(layout.actionRows > 1, 'page actions wrap at narrow widths');
        await page.screenshot({ path: path.join(output, 'heading-narrow.png') });
      }
    }
    await page.evaluate(() => setPageHeader('Change Log', ''));
    assert.equal(await page.locator('#pageSubtitle').isVisible(), false);
    await page.evaluate(subtitle => {
      setPageHeader('Change Log', subtitle);
      applyBranding(appBootstrap.config);
    }, original);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  async function verifyStatusContrast() {
    const palettes = await page.evaluate(() => {
      const host = document.createElement('div');
      host.innerHTML = ['Online', 'Down', 'Degraded', 'Active', 'Unknown'].map(label => statusPill(label)).join('');
      document.body.append(host);
      const colors = () => [...host.children].map(pill => ({
        tone: pill.dataset.statusTone, text: pill.textContent.trim(), iconHidden: pill.firstElementChild.getAttribute('aria-hidden'),
        foreground: getComputedStyle(pill).color, background: getComputedStyle(pill).backgroundColor
      }));
      const normal = colors();
      applyBranding({ ...appBootstrap.config, branding: { primaryColor: '#f1e7c4', secondaryColor: '#553226',
        accentColor: '#194d53', headerFontColor: '#254d73' } });
      const custom = colors();
      applyBranding(appBootstrap.config);
      host.remove();
      return { normal, custom };
    });
    assert.deepEqual(palettes.custom, palettes.normal);
    const luminance = color => color.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(component => {
      const value = Number(component) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    assert.deepEqual(palettes.normal.map(item => item.tone), ['healthy', 'critical', 'warning', 'active', 'neutral']);
    palettes.normal.forEach(item => {
      const text = luminance(item.foreground);
      const fill = luminance(item.background);
      const ratio = (Math.max(text, fill) + 0.05) / (Math.min(text, fill) + 0.05);
      assert.ok(ratio >= 4.5, item.tone + ' normal-text contrast: ' + ratio);
      assert.ok(item.text.length, item.tone);
      assert.equal(item.iconHidden, 'true');
    });
  }
  async function holdRpc(method) {
    let release, handled;
    const gate = new Promise(resolve => release = resolve);
    const completed = new Promise(resolve => handled = resolve);
    const handler = async route => {
      if (route.request().postDataJSON().method !== method) return route.continue();
      const error = await gate;
      if (error) await route.fulfill({ json: { error } });
      else await route.continue();
      handled();
    };
    await page.route('**/rpc', handler);
    return async error => {
      release(error);
      await completed;
      await page.unroute('**/rpc', handler);
    };
  }
  async function checkProgress(selector) {
    await page.locator(selector + ' .action-progress').waitFor({ state: 'visible' });
    const initial = await page.locator(selector + ' .action-progress').evaluate(element =>
      getComputedStyle(element, '::after').transform);
    await page.waitForFunction(({ selector, initial }) =>
      getComputedStyle(document.querySelector(selector + ' .action-progress'), '::after').transform !== initial,
    { selector, initial });
    assert.equal(await page.locator(selector).getAttribute('aria-busy'), 'true');
    assert.ok((await page.locator(selector).textContent()).includes('Saving...'));
  }
  try {
    await page.goto(url);
    await page.waitForFunction(() => window.networkDashboardPerformance?.length > 0);
    assert.deepEqual(rpcCalls.map(call => call.page), ['dashboard']);
    await navigate('securityCameras');
    await verifySharedHeading('Security Cameras');
    await checkColumns('securityCameras');
    assert.equal(await page.evaluate(() => tableInstance.getDataCount()), 18);
    assert.equal(await page.locator('.tabulator-row').count(), 18);
    assert.equal(await page.locator('.tabulator-cell[tabulator-field="Password"]:visible').count(), 18);
    assert.equal(await page.evaluate(() => tableInstance.getData().some(row => !!row.Password)), false);
    await page.screenshot({ path: path.join(output, 'security-cameras-desktop.png'), fullPage: true });
    const firstCameraTiming = await page.evaluate(() => window.networkDashboardPerformance.at(-1));
    await page.evaluate(() => {
      window.fixtureOriginalTable = tableInstance;
      tableInstance.setSort('Name', 'desc');
      tableInstance.hideColumn('Server Location');
    });
    await page.locator('#tableSearch').fill('Fixture Camera 1');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
      tableInstance.getColumn('Name').setWidth(215);
      resolve();
    })));
    const before = await page.evaluate(() => ({ sort: tableInstance.getSorters().map(s => [s.field, s.dir]),
      rows: tableInstance.getDataCount('active'), width: tableInstance.getColumn('Name').getWidth() }));
    console.log('Checking in-place refresh');
    await page.evaluate(() => Promise.race([
      refreshPageQuietly_('securityCameras', navigationGeneration, 'browser-test'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh timed out')), 10000))
    ]));
    const after = await page.evaluate(() => ({ same: fixtureOriginalTable === tableInstance,
      sort: tableInstance.getSorters().map(s => [s.field, s.dir]), rows: tableInstance.getDataCount('active'),
      width: tableInstance.getColumn('Name').getWidth(), categoryVisible: tableInstance.getColumn('Server Location').isVisible() }));
    assert.equal(after.same, true);
    assert.deepEqual(after.sort, before.sort);
    assert.equal(after.rows, before.rows);
    assert.equal(after.width, before.width);
    assert.equal(after.categoryVisible, false);
    await page.locator('#tableSearch').fill('');
    await page.locator('#pageActions button[onclick="openAddRecord()"] ').click();
    await page.locator('#recordModal').waitFor({ state: 'visible' });
    await page.locator('#recordModalBody [data-header="Name"]').fill('Browser Fixture Site');
    await page.locator('#saveRecordButton').click();
    await page.locator('#recordModal').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => tableInstance?.getDataCount() === 19);
    const fixtureRow = page.locator('.tabulator-row').filter({ hasText: 'Browser Fixture Site' });
    await fixtureRow.locator('.table-row-action-edit').click();
    await page.locator('#recordModalBody [data-header="Notes"]').fill('Browser edit verified');
    await page.locator('#saveRecordButton').click();
    await page.locator('#recordModal').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => tableInstance?.getData().some(row => row.Notes === 'Browser edit verified'));
    page.once('dialog', dialog => dialog.accept());
    await fixtureRow.locator('.table-row-action-delete').click();
    await page.waitForFunction(() => tableInstance?.getDataCount() === 18);
    const pages = harness.invoke('getAppBootstrap').pages;
    for (const item of pages) {
      if (item.key === 'securityCameras') continue;
      await navigate(item.key);
      await verifySharedHeading(item.label);
      await checkColumns(item.key);
      if (item.key === 'changeLog') await verifyHeadingLayout();
      assert.equal(await page.locator('.app-loading').count(), 0, item.key);
      if (item.key === 'switches' || item.key === 'accessPoints') {
        assert.equal(await page.locator('#pageActions .btn-aruba').count(), 1);
      }
      if (item.key === 'intercom') {
        await page.locator('.structured-search input').fill('Office');
        const state = await page.evaluate(() => {
          window.fixtureStructuredTable = structuredTables.intercomSystems;
          return fixtureStructuredTable.getDataCount('active');
        });
        await page.evaluate(() => refreshPageQuietly_('intercom', navigationGeneration, 'browser-test'));
        assert.equal(await page.evaluate(() => fixtureStructuredTable === structuredTables.intercomSystems), true);
        assert.equal(await page.evaluate(() => structuredTables.intercomSystems.getDataCount('active')), state);
      }
      if (item.key === 'switches') {
        await verifyStatusContrast();
        for (const [label, tone] of [['Online', 'healthy'], ['Offline', 'critical'], ['Degraded', 'warning'],
          ['Site-specific rollout', 'neutral']]) {
          await page.locator(`.tabulator-row [data-status-tone="${tone}"]`).filter({ hasText: label }).waitFor();
        }
      }
      if (item.key === 'contacts') {
        console.log('Checking Contacts search, view, create and reversible inactivation');
        const search = page.locator('#tableSearch');
        const status = page.getByLabel('Filter contacts by status');
        const category = page.getByLabel('Filter contacts by category');
        const rows = page.locator('.tabulator-row');
        const activeRows = count => page.waitForFunction(expected =>
          tableInstance.getDataCount('active') === expected, count);
        await activeRows(2);
        await rows.filter({ hasText: 'Fixture Helpdesk' }).locator('[data-status-tone="active"]')
          .filter({ hasText: 'Active' }).waitFor();
        await search.fill('FIXTURE WIRELESS');
        await category.selectOption('support');
        await status.selectOption('active');
        await activeRows(1);
        await rows.filter({ hasText: 'Fixture Helpdesk' }).locator('.table-row-action-view').click();
        const modal = page.locator('#recordModal');
        await modal.waitFor({ state: 'visible' });
        await modal.getByText('Call only during business hours', { exact: true }).waitFor();
        assert.equal(await modal.locator('#saveRecordButton').isVisible(), false);
        await modal.locator('.btn-close').click();
        await modal.waitFor({ state: 'hidden' });
        await status.selectOption('inactive');
        await activeRows(0);
        await page.locator('.table-toolbar button[onclick="clearTableFilters()"]').click();
        await activeRows(2);
        assert.equal(await page.locator('#pageActions button[onclick="exportCurrentTable()"]').count(), 0);
        assert.equal(await rows.locator('.table-row-action-delete').count(), 0);

        const addContact = page.locator('#pageActions button[onclick="openAddRecord()"]');
        assert.match(await addContact.textContent(), /Add Contact/);
        await addContact.click();
        await modal.waitFor({ state: 'visible' });
        await modal.locator('[data-header="Contact Name"]').fill('New Fixture Contact');
        await modal.locator('[data-header="Organization"]').fill('Fixture Organization');
        await modal.locator('[data-header="Category"]').fill('Installation');
        await modal.locator('[data-header="Phone"]').fill('+1 202-555-0102');
        await modal.locator('[data-header="Notes"]').fill('Fixture note\nSecond line');
        await modal.locator('#saveRecordButton').click();
        await modal.waitFor({ state: 'hidden' });
        await activeRows(3);
        await category.selectOption('installation');
        await activeRows(1);
        const added = rows.filter({ hasText: 'New Fixture Contact' });
        await added.locator('.table-row-action-edit').click();
        await modal.waitFor({ state: 'visible' });
        assert.equal(await modal.locator('[data-header="Status"]').inputValue(), 'Active');
        assert.equal(await modal.locator('[data-header="Notes"]').inputValue(), 'Fixture note\nSecond line');
        await modal.locator('[data-header="Status"]').selectOption('Inactive');
        await modal.locator('#saveRecordButton').click();
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => currentPageData.rows.some(
          row => row['Contact Name'] === 'New Fixture Contact' && row.Status === 'Inactive'));
        await category.selectOption('installation');
        await status.selectOption('inactive');
        await activeRows(1);
        await added.locator('.status-neutral').filter({ hasText: 'Inactive' }).waitFor();
      }
      if (item.key === 'outages') {
        console.log('Checking outage repeated-hour save from a browser in a different zone');
        await page.locator('#pageActions button[onclick="openOutageAddRecord()"]').click();
        const modal = page.locator('#recordModal');
        await modal.waitFor({ state: 'visible' });
        assert.equal(await modal.locator('[data-outage-timezone]').getAttribute('data-outage-timezone'), 'America/Chicago');
        assert.match(await modal.locator('[data-outage-timezone]').textContent(), /Times are in America\/Chicago/);
        await modal.locator('[data-outage-field="Circuit ID"]').selectOption('WAN-FIXTURE-1');
        await modal.locator('[data-outage-field="Started"]').fill('2026-11-01T01:30');
        await modal.locator('[data-outage-field="Restored"]').fill('2026-11-01T01:30');
        await modal.getByText('Repeated clock times').click();
        await modal.locator('[data-outage-occurrence="Started"]').selectOption('earlier');
        await modal.locator('[data-outage-occurrence="Restored"]').selectOption('later');
        await modal.locator('#saveRecordButton').click();
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => currentPageData.rows.length === 1);
        const readInstants = () => page.evaluate(() => currentPageData.rows.map(
          row => [row.Started, row.Restored, row['Duration Minutes']]
        ));
        const expected = [['2026-11-01T06:30:00.000Z', '2026-11-01T07:30:00.000Z', '60']];
        assert.deepEqual(await readInstants(), expected);
        await page.locator('.tabulator-row [data-status-tone="healthy"]').filter({ hasText: 'Restored' }).waitFor();
        await page.evaluate(() => tableInstance.showColumn('Source'));
        await page.locator('.tabulator-row [data-status-tone="neutral"]').filter({ hasText: 'Manual' }).waitFor();

        await page.locator('.tabulator-row .table-row-action-edit').click();
        await modal.waitFor({ state: 'visible' });
        assert.equal(await modal.locator('[data-outage-field="Started"]').inputValue(), '2026-11-01T01:30');
        assert.equal(await modal.locator('[data-outage-field="Restored"]').inputValue(), '2026-11-01T01:30');
        await modal.locator('[data-outage-field="Notes"]').fill('Fixture notes-only edit');
        await modal.locator('#saveRecordButton').click();
        await modal.waitFor({ state: 'hidden' });
        await page.waitForFunction(() => currentPageData.rows[0].Notes === 'Fixture notes-only edit');
        assert.deepEqual(await readInstants(), expected);
      }
      if (item.key === 'internetWan') {
        await page.waitForFunction(() => !document.querySelector('#toastContainer .app-toast'));
        await page.evaluate(() => openInternetWanViewCircuit(currentPageData.rows[0]));
        await page.locator('#recordModal').waitFor({ state: 'visible' });
        await page.waitForFunction(() => getComputedStyle(document.getElementById('recordModal')).opacity === '1');
        assert.deepEqual(await page.locator('.internet-wan-detail h3').allTextContents(),
          ['Circuit', 'Addressing', 'Provider', 'Monitoring', 'Notes']);
        await page.screenshot({ path: path.join(output, 'wan-detail-desktop.png') });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: path.join(output, 'wan-detail-mobile.png') });
        assert.equal(await page.locator('#recordModalBody').evaluate(el => el.scrollWidth > el.clientWidth), false);
        await page.locator('#recordModal .btn-close').click();
        await page.locator('#recordModal').waitFor({ state: 'hidden' });
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
    }
    console.log('Checking Settings success, failure, retry and integration toggle');
    await navigate('settings');
    const previewHeading = page.locator('.settings-preview-title-line');
    assert.equal(await previewHeading.evaluate(node => getComputedStyle(node).fontWeight),
      await page.locator('#pageTitle').evaluate(node => getComputedStyle(node).fontWeight));
    const saveSettings = '#pageActions button[onclick="saveSettingsForm(this)"]';
    for (const failure of [false, true, false]) {
      const release = await holdRpc('saveAppSettings');
      await page.locator(saveSettings).click();
      await checkProgress(saveSettings);
      assert.equal(await page.locator('#appWorkingModal').count(), 1);
      assert.notEqual(await page.locator('#appWorkingModal .action-progress').evaluate(el =>
        getComputedStyle(el, '::after').backgroundColor), 'rgb(255, 255, 255)');
      if (!failure) await page.screenshot({ path: path.join(output, 'settings-saving.png') });
      await release(failure ? 'Fixture save rejected' : null);
      await page.waitForFunction(() => !settingsSaveInProgress && !document.getElementById('appWorkingModal'));
      assert.equal(await page.locator(saveSettings).isEnabled(), true);
      assert.equal(await page.locator('.action-progress').count(), 0);
      assert.equal(await page.locator('body').evaluate(body => body.classList.contains('app-working-modal-open')), false);
      await page.locator('#toastContainer').getByText(failure ? 'Fixture save rejected' : 'Settings saved.', { exact: true }).last().waitFor();
    }
    assert.equal(await page.getByText('Wazuh', { exact: true }).count(), 0);
    const threatdown = 'input[onchange*="saveIntegrationEnabled(\'threatdown\'"]';
    const checkThreatDown = async enabled => {
      await page.locator(threatdown).setChecked(enabled);
      await page.waitForFunction(enabled => currentPageData.integrations
        .some(item => item.id === 'threatdown' && item.enabled === enabled), enabled);
      await navigate('servers');
      assert.equal(await page.evaluate(() => currentPageData.headers.includes('ThreatDown Installed')), enabled);
      assert.equal(await page.evaluate(() => currentPageData.headers.includes('Wazuh Installed')), false);
    };
    await checkThreatDown(true);
    await navigate('settings');
    await checkThreatDown(false);
    console.log('Checking modal save failure and retry');
    await navigate('securityCameras');
    await page.locator('#pageActions button[onclick="openAddRecord()"]').click();
    await page.locator('#recordModalBody [data-header="Name"]').fill('Progress Fixture');
    const release = await holdRpc('appAddRecord');
    await page.locator('#saveRecordButton').click();
    await checkProgress('#saveRecordButton');
    await release('Fixture save rejected');
    await page.waitForFunction(() => !document.getElementById('saveRecordButton').disabled);
    assert.equal(await page.locator('#recordModal .action-progress').count(), 0);
    await page.locator('#saveRecordButton').click();
    await page.locator('#recordModal').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => tableInstance?.getDataCount() === 19);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.tabulator-row').filter({ hasText: 'Progress Fixture' }).locator('.table-row-action-delete').click();
    await page.waitForFunction(() => tableInstance?.getDataCount() === 18);
    // Reset uses local render data, with no RPC, and discards only this page's explicit preferences.
    const requestsBeforeReset = rpcCalls.length;
    await page.locator('[data-bs-toggle="dropdown"]').filter({ hasText: 'Columns' }).click();
    await page.locator('#columnMenu button[aria-label="Reset columns to defaults"]').click();
    await page.waitForFunction(() => tableInstance?.getDataCount() === 18);
    await checkColumns('securityCameras');
    assert.equal(rpcCalls.length, requestsBeforeReset);
    console.log('Checking section selection and generating a paginated Standard Playbook PDF');
    harness.invoke('saveAppSettings', [{ 'organization.name': 'Example Operations' }]);
    harness.records('Contacts', [{ 'Contact Name': 'FIXTURE_PDF_CONTACT_CANARY', Status: 'Active',
      Email: 'support@example.test', Phone: '+1 202-555-0100' }]);
    harness.records('Servers', [{ 'Server Name': 'Unselected Fixture Server', Status: 'Online' }]);
    await page.locator('#standardPlaybookButton').click();
    const playbook = page.locator('#standardPlaybookModal');
    await playbook.waitFor({ state: 'visible' });
    assert.equal(await playbook.getByLabel('Settings', { exact: true }).count(), 0);
    const policyOptions = playbook.locator('#standardPlaybookSections input');
    for (const option of await policyOptions.all()) {
      if (!['changeLog', 'contacts', 'networkClosets'].includes(await option.inputValue())) await option.uncheck();
    }
    await playbook.locator('#standardPlaybookPrepare').click();
    await playbook.getByText('Change Log (115 rows)', { exact: true }).waitFor();
    await playbook.getByText('Contacts (1 row)', { exact: true }).waitFor();
    assert.equal(await playbook.locator('#standardPlaybookSummary li').count(), 2);
    await playbook.locator('input[value="contacts"]').uncheck();
    assert.equal(await playbook.locator('#standardPlaybookPrint').isEnabled(), false);
    await playbook.locator('input[value="contacts"]').check();
    await playbook.locator('#standardPlaybookPrepare').click();
    await playbook.getByText('Contacts (1 row)', { exact: true }).waitFor();
    await page.evaluate(() => { window.print = () => { window.fixturePlaybookPrintCalls = 1; }; });
    await playbook.locator('#standardPlaybookPrint').click();
    await page.waitForFunction(() => window.fixturePlaybookPrintCalls === 1);
    assert.equal(await page.locator('#standardPlaybookPaper tbody tr').count(), 116);
    assert.doesNotMatch(await page.locator('#standardPlaybookPaper').textContent(), /CANARY|Security Cameras|Unselected Fixture Server|Former Fixture Vendor/);
    await page.pdf({ path: path.join(output, 'standard-playbook.pdf'), preferCSSPageSize: true, printBackground: true });
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    assert.equal(await page.locator('#standardPlaybookPaper tbody tr').count(), 0);
    await playbook.locator('.btn-close').click();
    await playbook.waitFor({ state: 'hidden' });
    console.log('Checking Change Log status tones and preservation of historical labels');
    const statusFixtures = [
      ['Implemented', 'healthy', 'Fixture Status Implemented', '2026-11-20'],
      ['Monitoring', 'active', 'Fixture Status Monitoring', '2026-11-19'],
      ['Rolled Back', 'warning', 'Fixture Status Rolled Back', '2026-11-18'],
      ['Retired', 'neutral', 'Fixture Status Retired', '2026-11-17'],
      ['Office Review', 'neutral', 'Fixture Status Custom', '2026-11-16'],
      ['monitoring', 'active', 'Fixture Status Legacy Case', '2026-11-15'],
      ['', 'neutral', 'Fixture Status Legacy Blank', '2026-11-14']
    ];
    harness.records('Change Log', statusFixtures.map(([status, , name, date]) =>
      ({ 'Change Name': name, 'Change Date': date, Status: status })));
    harness.context.invalidateAppPage_('changeLog');
    await navigate('changeLog');
    await page.evaluate(() => refreshCurrentPage());
    await page.waitForFunction(() => currentPageData.rows?.some(row => row['Change Name'] === 'Fixture Status Legacy Blank'));
    const statusFilter = page.locator('#changeLogStatusFilter');
    for (const [status, tone, name] of statusFixtures) {
      const row = page.locator('.tabulator-row').filter({ hasText: name });
      await row.locator(`[data-status-tone="${tone}"]`).filter({ hasText: status || 'Unknown' }).waitFor();
      if (status) {
        await statusFilter.selectOption(status);
        await page.waitForFunction(name => tableInstance.getData('active').some(
          row => row['Change Name'] === name), name);
        assert.equal(await page.evaluate(status => tableInstance.getData('active').every(row => row.Status === status), status), true);
        await statusFilter.selectOption('');
      }
    }
    const statusModal = page.locator('#recordModal');
    for (const [status, , name] of statusFixtures.slice(-3)) {
      const row = page.locator('.tabulator-row').filter({ hasText: name });
      await row.locator('.table-row-action-edit').click();
      await statusModal.waitFor({ state: 'visible' });
      if (!status) assert.ok((await statusModal.locator('[data-header="Status"] option:checked').textContent()).includes('Not set'));
      assert.equal(await statusModal.locator('[data-header="Status"]').inputValue(), status, name);
      await statusModal.locator('[data-header="Summary"]').fill('Unrelated status preservation edit');
      await statusModal.locator('#saveRecordButton').click();
      await statusModal.waitFor({ state: 'hidden' });
      await page.waitForFunction(name => currentPageData.rows?.some(row =>
        row['Change Name'] === name && row.Summary === 'Unrelated status preservation edit'), name);
      assert.equal(await page.evaluate(name => currentPageData.rows.find(row => row['Change Name'] === name).Status, name), status);
    }
    await navigate('dashboard');
    for (const [status, tone, name] of statusFixtures.slice(0, 5)) {
      const item = page.locator('.dashboard-recent-changes .dashboard-list-row').filter({ hasText: name });
      await item.locator(`[data-status-tone="${tone}"]`).filter({ hasText: status }).waitFor();
    }
    console.log('Checking Change Log template download and preview-first Google Doc import');
    await navigate('changeLog');
    await page.getByRole('button', { name: 'Documentation Template', exact: true }).click();
    const templateModal = page.getByRole('dialog', { name: 'Documentation Template' });
    await templateModal.waitFor({ state: 'visible' });
    const downloadButton = templateModal.getByRole('button', { name: 'Download Template', exact: true });
    const downloading = page.waitForEvent('download');
    await downloadButton.click();
    const downloaded = await downloading;
    assert.equal(downloaded.suggestedFilename(), 'network-hq-change-documentation-template.txt');
    const templateText = fs.readFileSync(await downloaded.path(), 'utf8');
    assert.equal(templateText, await templateModal.getByLabel('Template text', { exact: true }).inputValue());
    assert.ok(templateText.includes('Summary:\n'));
    assert.ok(templateText.includes('Implemented By:\n'));
    await templateModal.getByRole('button', { name: 'Close', exact: true }).last().click();
    await templateModal.waitFor({ state: 'hidden' });
    const browserDocId = 'fixture_browser_change_doc_A0001';
    const docUrl = 'https://docs.google.com/document/d/' + browserDocId + '/edit';
    const browserFields = {
      'Change Date': '2026-11-20', 'Change Name': 'Fixture Doc Import', Category: 'maintenance',
      'System / Area': 'network', 'Implemented By': 'Fixture Operator'
    };
    harness.documents.set(browserDocId, { title: 'Fixture Source Doc', text: templateText
      .replace(/^(Change Date|Change Name|Category|System \/ Area|Implemented By):$/gm,
        (_, label) => label + ': ' + browserFields[label]) });
    const openDocImport = page.getByRole('button', { name: 'Import Documentation', exact: true });
    await openDocImport.click();
    const importModal = page.getByRole('dialog', { name: 'Import Documentation' });
    const sourceInput = importModal.locator('#changeLogDocumentUrl');
    const readDocument = importModal.getByRole('button', { name: 'Read Document', exact: true });
    const confirmDoc = importModal.getByRole('button', { name: 'Add to Change Log', exact: true });
    await sourceInput.fill(docUrl);
    const releaseStalePreview = await holdRpc('appPreviewChangeLogDocumentation');
    await readDocument.click();
    await sourceInput.fill('https://docs.google.com/document/d/unsent_fixture_document_B0002/edit');
    await releaseStalePreview();
    await readDocument.waitFor({ state: 'visible' });
    assert.equal(await confirmDoc.isDisabled(), true);
    assert.equal(await importModal.locator('#changeLogImportPreview').isHidden(), true);
    await sourceInput.fill(docUrl);
    await readDocument.click();
    await importModal.getByText('Fixture Source Doc', { exact: true }).waitFor();
    assert.equal(await importModal.locator('[data-import-field="Category"]').inputValue(), 'Maintenance');
    assert.equal(await importModal.locator('[data-import-field="Change Date"]').inputValue(), '2026-11-20');
    assert.equal(await importModal.locator('[data-import-field="Documentation URL"]').getAttribute('readonly'), '');
    assert.equal(await importModal.locator('[data-import-field="Summary"]').evaluate(element =>
      element.classList.contains('is-invalid')), true);
    const numberBeforeImport = harness.sheets.get('Change Log').data.length;
    await confirmDoc.click();
    await importModal.getByText('Complete all required fields.', { exact: true }).waitFor();
    assert.equal(harness.sheets.get('Change Log').data.length, numberBeforeImport);
    await importModal.locator('[data-import-field="Summary"]').fill('Completed in the fixture preview.');
    await confirmDoc.click();
    await importModal.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => currentPageData.rows?.some(row => row['Change Name'] === 'Fixture Doc Import'));
    assert.equal(harness.sheets.get('Change Log').data.length, numberBeforeImport + 1);
    await openDocImport.click();
    await sourceInput.fill(docUrl);
    await readDocument.click();
    await importModal.getByText(/Duplicate import is blocked/).waitFor();
    assert.equal(await confirmDoc.isDisabled(), true);
    await importModal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await importModal.waitFor({ state: 'hidden' });
    console.log('Checking VM host picker, duplicate names, cross-view relationship and rename');
    harness.sheets.get('Servers').data.splice(1);
    harness.records('Servers', [
      { 'Server Name': 'Fixture Shared Host', 'Network HQ Server ID': '70000000-0000-4000-8000-000000000001' },
      { 'Server Name': 'Fixture VM Guest', Type: 'Virtual',
        'Network HQ Server ID': '70000000-0000-4000-8000-000000000003' }
    ]);
    harness.records('Offline Servers', [
      { 'Server Name': 'Fixture Shared Host', 'Network HQ Server ID': '70000000-0000-4000-8000-000000000002' }
    ]);
    harness.context.invalidateAppPage_('servers');
    await navigate('servers');
    await page.evaluate(() => refreshCurrentPage());
    await page.waitForFunction(() => currentPageData.rows?.length === 3);
    await checkColumns('servers');
    const serverModal = page.locator('#recordModal');
    const guest = page.locator('.tabulator-row').filter({ has: page.locator(
      '.tabulator-cell[tabulator-field="Server Name"]', { hasText: 'Fixture VM Guest' }) });
    await guest.locator('.table-row-action-edit').click();
    await serverModal.waitFor({ state: 'visible' });
    const vmHostSelect = serverModal.getByLabel('VM Host', { exact: true });
    assert.deepEqual(await vmHostSelect.locator('option').allTextContents(),
      ['No VM host', 'Fixture Shared Host (Active, row 2)', 'Fixture Shared Host (Offline, row 2)']);
    await vmHostSelect.selectOption({ label: 'Fixture Shared Host (Offline, row 2)' });
    await page.screenshot({ path: path.join(output, 'servers-vm-host-editor.png') });
    await serverModal.locator('#saveRecordButton').click();
    await serverModal.waitFor({ state: 'hidden' });
    await guest.locator('[tabulator-field="_vmHostName"]').getByText(
      'Fixture Shared Host (Offline, row 2)', { exact: true }).waitFor();
    await page.locator('#serverViewOffline').click();
    await page.locator('[tabulator-field="_vmGuestNames"]').getByText('Fixture VM Guest', { exact: true }).waitFor();
    await page.locator('.tabulator-row .table-row-action-edit').click();
    await serverModal.locator('[data-header="Server Name"]').fill('Renamed Fixture Host');
    await serverModal.locator('#saveRecordButton').click();
    await serverModal.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => currentPageData.rows?.some(
      row => row['Server Name'] === 'Fixture VM Guest' && row._vmHostName === 'Renamed Fixture Host'));
    await page.locator('#serverViewAll').click();
    await guest.locator('[tabulator-field="_vmHostName"]').getByText('Renamed Fixture Host', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => currentPageData.totalCount), 3);
    console.log('Checking Dashboard Add Change Log, cancel and shared save');
    await navigate('dashboard');
    const quickChange = page.getByRole('button', { name: 'Add Change Log', exact: true });
    const changeModal = page.locator('#recordModal');
    const beforeAdds = rpcCalls.filter(call => call.method === 'appAddRecord' && call.page === 'changeLog').length;
    await quickChange.click();
    await changeModal.waitFor({ state: 'visible' });
    assert.equal(await page.locator('#pageTitleText').textContent(), 'Change Log');
    assert.equal(await changeModal.locator('#recordModalTitle').textContent(), 'Add Change');
    await changeModal.locator('[data-header="Change Name"]').fill('Cancelled Dashboard Fixture Change');
    await changeModal.locator('.modal-footer [data-bs-dismiss="modal"]').click();
    await changeModal.waitFor({ state: 'hidden' });
    assert.equal(rpcCalls.filter(call => call.method === 'appAddRecord' && call.page === 'changeLog').length, beforeAdds);
    await navigate('dashboard');
    await quickChange.click();
    await changeModal.waitFor({ state: 'visible' });
    assert.equal(await changeModal.locator('[data-header="Change Name"]').inputValue(), '');
    await changeModal.locator('[data-header="Change Date"]').fill('2026-11-01');
    await changeModal.locator('[data-header="Change Name"]').fill('Dashboard Fixture Change');
    await changeModal.locator('#saveRecordButton').click();
    await changeModal.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => currentPageData.rows?.some(row => row['Change Name'] === 'Dashboard Fixture Change'));
    assert.equal(rpcCalls.filter(call => call.method === 'appAddRecord' && call.page === 'changeLog').length, beforeAdds + 1);
    assert.ok(await page.evaluate(() => window.fixtureRequests.some(call =>
      call.method === 'appGetPageData' && call.args[0] === 'changeLog' && call.args[1] === true)));
    await navigate('dashboard');
    await navigate('securityCameras');
    const cachedCameraTiming = await page.evaluate(() => window.networkDashboardPerformance.at(-1));
    assert.equal(cachedCameraTiming.cache, 'hit');
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollBefore = await page.evaluate(() => {
      const holder = tableInstance.element.querySelector('.tabulator-tableholder');
      holder.scrollLeft = 180;
      return holder.scrollLeft;
    });
    assert.ok(scrollBefore > 0);
    await page.evaluate(() => refreshPageQuietly_('securityCameras', navigationGeneration, 'browser-test'));
    assert.equal(await page.evaluate(() => tableInstance.element.querySelector('.tabulator-tableholder').scrollLeft), scrollBefore);
    await page.evaluate(() => { tableInstance.element.querySelector('.tabulator-tableholder').scrollLeft = 0; });
    await page.screenshot({ path: path.join(output, 'security-cameras-mobile.png'), fullPage: true });
    assert.equal(await page.evaluate(() => tableInstance.getDataCount()), 18);
    assert.equal(errors.filter(error => error.includes('Fixture save rejected')).length, 2);
    assert.deepEqual(errors.filter(error => !error.includes('Fixture save rejected')), []);
    assert.deepEqual(warnings, []);
    assert.deepEqual(externalRequests, [], 'fixture must never attempt non-loopback requests');
    assert.equal(page.url(), url + '/', 'navigation must stay in the fixture shell');
    const report = { firstCameraTiming, cachedCameraTiming, rpcCount: rpcCalls.length,
      expectedFailureChecks: errors.filter(error => error.includes('Fixture save rejected')).length,
      errors: errors.filter(error => !error.includes('Fixture save rejected')), warnings };
    fs.writeFileSync(path.join(output, 'browser-performance.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
    console.error(JSON.stringify({ errors, warnings, externalRequests }));
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
