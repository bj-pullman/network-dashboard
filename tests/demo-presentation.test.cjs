const test = require('node:test');
const assert = require('node:assert/strict');
const { createHarness } = require('./server-harness.cjs');

const viewer = { user: 'viewer@example.test' };
const admin = { user: 'admin@example.test' };
const setting = 'NETWORK_HQ_DEMO_SPREADSHEET_ID';
const pages = result => Array.from(result.pages, page => page.key);

test('demo navigation requires an explicit matching spreadsheet and preserves normal access without it', () => {
  const h = createHarness();
  for (const value of [undefined, 'different-sheet']) {
    if (value) h.properties.set(setting, value);
    const view = h.invoke('getAppBootstrap', [], viewer);
    assert.equal(view.demoPresentation, false);
    assert.equal(pages(view).includes('demoSettings'), false);
    assert.equal(pages(view).includes('settings'), false);
    assert.equal(pages(h.invoke('getAppBootstrap', [], admin)).includes('settings'), true);
  }
  h.properties.set(setting, h.spreadsheet.getId());
  assert.throws(() => h.invoke('getAppBootstrap', [], { user: 'unauthorized@example.test' }), /Unauthorized/);
  for (const user of [viewer, admin]) {
    const view = h.invoke('getAppBootstrap', [], user);
    assert.equal(view.demoPresentation, true);
    assert.equal(view.config.organization.name, 'Demo School District');
    assert.equal(view.config.organization.shortName, 'Demo');
    for (const key of ['demoSettings', 'demoUsers']) {
      const page = view.pages.find(page => page.key === key);
      assert.equal(page.type, 'demoPreview');
      assert.equal(page.permission, 'view');
    }
    assert.equal(pages(view).includes('settings'), false);
    assert.equal(pages(view).includes('users'), false);
  }
});

test('demo labels do not grant actual administrative access or register server routes', () => {
  const h = createHarness();
  h.properties.set(setting, h.spreadsheet.getId());
  assert.equal(h.invoke('getAppBootstrap', [], viewer).user.admin, false);
  for (const key of ['demoSettings', 'demoUsers']) {
    assert.throws(() => h.invoke('appGetPageData', [key], viewer), /Unknown application page/);
  }
  for (const key of ['settings', 'users']) {
    assert.throws(() => h.invoke('appGetPageData', [key], viewer), /Administrator access/);
    assert.equal(h.invoke('appGetPageData', [key], admin).permission, 'edit');
  }
  assert.throws(() => h.invoke('saveAppUser', [{}], viewer), /Administrator access/);
});
