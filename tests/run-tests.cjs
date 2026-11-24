const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const requiredSuites = ['server.test.cjs', 'client.test.cjs', 'refinement.test.cjs',
  'integration-removal.test.cjs', 'qa.test.cjs', 'regional.test.cjs', 'contacts.test.cjs', 'playbook.test.cjs', 'server-relationships.test.cjs',
  'change-log-documentation.test.cjs', 'dropdowns.test.cjs', 'outages-review.test.cjs', 'inventory-address.test.cjs', 'playbook-switches.test.cjs'].map(file => path.join(__dirname, file));
const missing = requiredSuites.filter(file => !fs.statSync(file, { throwIfNoEntry: false })?.isFile());
if (missing.length) {
  console.error('Missing required QA suites: ' + missing.map(file => path.basename(file)).join(', '));
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, ['--test', ...requiredSuites], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
