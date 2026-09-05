const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');
const { createHarness, root } = require('./server-harness.cjs');
const baselineRef = process.argv[2] || 'ae2208d5af22fbc87c61f376f787e0d35a436a43';

function source(file, baseline) {
  return baseline ? execFileSync('git', ['show', baselineRef + ':' + file], { cwd: root, encoding: 'utf8' }) :
    fs.readFileSync(path.join(root, file), 'utf8');
}
function run(baseline) {
  const h = createHarness({ baseline: baseline ? baselineRef : false });
  function sample(method, args) {
    const started = performance.now();
    const data = h.invoke(method, args, { readonly: !baseline });
    return {
      fixtureExecutionMs: Number((performance.now() - started).toFixed(2)),
      records: data.rows?.length,
      spreadsheetBoundaryCalls: h.calls.length,
      batchedReads: h.calls.filter(call => /getValues|getDisplayValues/.test(call.name)).length,
      formattingWrites: h.calls.filter(call => /setFrozenRows|setFont|setBackground|autoResize/.test(call.name)).length
    };
  }
  const cold = sample('appGetPageData', ['securityCameras', true]);
  const warmRead = sample('appGetPageData', ['securityCameras', true]);
  const serverCache = sample('appGetPageData', ['securityCameras', false]);
  const integrationStatus = sample('getIntegrationStatusById_', ['uptimerobot']);
  const index = source('Index.html', baseline);
  const shell = index.replace(/<\?!= include\('([^']+)'\); \?>/g, (_, name) => source(name + '.html', baseline));
  return { cold, warmRead, serverCache, integrationStatus,
    shellSourceBytes: Buffer.byteLength(shell), shellGzipBytes: zlib.gzipSync(shell).length };
}
const result = {
  environment: 'Local Node VM with in-memory Spreadsheet mocks, not Apps Script service latency',
  baseline: baselineRef, before: run(true), after: run(false)
};
const output = path.join(root, 'test-results');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'read-path-benchmark.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
