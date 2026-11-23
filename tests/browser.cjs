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
      const expected = definition ? definition.defaultColumns : Object.values(structured)[0].defaultColumns;
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
      await checkColumns(item.key);
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
      if (item.key === 'contacts') {
        console.log('Checking Contacts search, view, create and reversible inactivation');
        const search = page.locator('#tableSearch');
        const status = page.getByLabel('Filter contacts by status');
        const category = page.getByLabel('Filter contacts by category');
        const rows = page.locator('.tabulator-row');
        const activeRows = count => page.waitForFunction(expected =>
          tableInstance.getDataCount('active') === expected, count);
        await activeRows(2);
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
