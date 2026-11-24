const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { spawnSync } = require('node:child_process');
const { createPreviewServer } = require('./preview.cjs');

test('the clean-checkout runner fails before running anything when a required suite is absent', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'network-hq-tests-'));
  try {
    const runner = path.join(temporary, 'run-tests.cjs');
    fs.copyFileSync(path.join(__dirname, 'run-tests.cjs'), runner);
    for (const name of ['server.test.cjs', 'refinement.test.cjs', 'integration-removal.test.cjs', 'qa.test.cjs', 'regional.test.cjs', 'contacts.test.cjs', 'playbook.test.cjs',
      'server-relationships.test.cjs', 'change-log-documentation.test.cjs']) {
      fs.writeFileSync(path.join(temporary, name), "console.log('fixture suite ran');");
    }
    const result = spawnSync(process.execPath, [runner], { encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, /Missing required QA suites: client\.test\.cjs/);
    assert.equal(result.stdout, '');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('preview serves only the in-memory fixture and rejects live integration actions', async () => {
  const { server } = createPreviewServer();
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + server.address().port;
    const app = await fetch(url);
    assert.equal(app.status, 200);
    assert.match(app.headers.get('content-security-policy'), /connect-src 'self'/);
    assert.doesNotMatch(await app.text(), /href="https:\/\/script\.google\.com\/macros\//);
    const rpc = (method, args) => fetch(url + '/rpc', { method: 'POST', body: JSON.stringify({ method, args }) })
      .then(response => response.json());
    assert.equal((await rpc('appGetPageData', ['securityCameras'])).data.totalCount, 18);
    assert.match((await rpc('runIntegrationSync', ['aruba_central'])).error, /unavailable in the local fixture/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
