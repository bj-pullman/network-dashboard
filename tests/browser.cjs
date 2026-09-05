const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright-core');
const { createPreviewServer } = require('./preview.cjs');
const { root } = require('./server-harness.cjs');

async function main() {
  const { server, harness, rpcCalls } = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const output = path.join(root, 'test-results');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
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
      tableInstance.setSort('Location', 'desc');
      tableInstance.hideColumn('Server Location');
    });
    await page.locator('#tableSearch').fill('Office');
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
      tableInstance.getColumn('Location').setWidth(215);
      resolve();
    })));
    const before = await page.evaluate(() => ({ sort: tableInstance.getSorters().map(s => [s.field, s.dir]),
      rows: tableInstance.getDataCount('active'), width: tableInstance.getColumn('Location').getWidth() }));
    console.log('Checking in-place refresh');
    await page.evaluate(() => Promise.race([
      refreshPageQuietly_('securityCameras', navigationGeneration, 'browser-test'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh timed out')), 10000))
    ]));
    const after = await page.evaluate(() => ({ same: fixtureOriginalTable === tableInstance,
      sort: tableInstance.getSorters().map(s => [s.field, s.dir]), rows: tableInstance.getDataCount('active'),
      width: tableInstance.getColumn('Location').getWidth(), categoryVisible: tableInstance.getColumn('Server Location').isVisible() }));
    assert.equal(after.same, true);
    assert.deepEqual(after.sort, before.sort);
    assert.equal(after.rows, before.rows);
    assert.equal(after.width, before.width);
    assert.equal(after.categoryVisible, false);
    await page.locator('#tableSearch').fill('');
    await page.locator('#pageActions button[onclick="openAddRecord()"] ').click();
    await page.locator('#recordModal').waitFor({ state: 'visible' });
    await page.locator('#recordModalBody [data-header="Location"]').fill('Browser Fixture Site');
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
    const wazuh = 'input[onchange*="saveIntegrationEnabled(\'wazuh\'"]';
    await page.locator(wazuh).check();
    await page.waitForFunction(() => currentPageData.integrations.some(item => item.id === 'wazuh' && item.enabled));
    await navigate('servers');
    assert.equal(await page.evaluate(() => currentPageData.headers.includes('Wazuh Installed')), true);
    await navigate('settings');
    await page.locator(wazuh).uncheck();
    await page.waitForFunction(() => currentPageData.integrations.some(item => item.id === 'wazuh' && !item.enabled));
    await navigate('servers');
    assert.equal(await page.evaluate(() => currentPageData.headers.includes('Wazuh Installed')), false);
    console.log('Checking modal save failure and retry');
    await navigate('securityCameras');
    await page.locator('#pageActions button[onclick="openAddRecord()"]').click();
    await page.locator('#recordModalBody [data-header="Location"]').fill('Progress Fixture');
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
    const report = { firstCameraTiming, cachedCameraTiming, rpcCount: rpcCalls.length,
      expectedFailureChecks: errors.filter(error => error.includes('Fixture save rejected')).length,
      errors: errors.filter(error => !error.includes('Fixture save rejected')), warnings };
    fs.writeFileSync(path.join(output, 'browser-performance.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true });
    console.error(JSON.stringify({ errors, warnings }));
    throw error;
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
