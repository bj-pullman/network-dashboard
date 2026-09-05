const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createHarness, root } = require('./server-harness.cjs');

function createPreviewServer() {
  const harness = createHarness();
  const rpcCalls = [];
  const bootstrap = harness.invoke('getAppBootstrap');
  bootstrap.startupTasks = {};
  let html = fs.readFileSync(path.join(root, 'Index.html'), 'utf8')
    .replace(/<\?!= include\('([^']+)'\); \?>/g, (_, name) => fs.readFileSync(path.join(root, name + '.html'), 'utf8'))
    .replace('<?!= initialBootstrapJson ?>', JSON.stringify(bootstrap).replace(/</g, '\\u003c'))
    .replace('<?= appName ?>', 'Network Dashboard Fixture');
  for (const [remote, local] of [
    ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/', '/vendor/bootstrap/'],
    ['https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/', '/vendor/@fortawesome/fontawesome-free/'],
    ['https://unpkg.com/tabulator-tables@6.3.1/', '/vendor/tabulator-tables/'],
    ['https://cdn.jsdelivr.net/npm/chart.js', '/vendor/chart.js/dist/chart.umd.js']
  ]) html = html.split(remote).join(local);
  const bridge = `<script>
    window.fixtureRequests = [];
    function fixtureRunner(success, failure) {
      return new Proxy({}, { get: function(_, method) {
        if (method === 'withSuccessHandler') return function(handler) { return fixtureRunner(handler, failure); };
        if (method === 'withFailureHandler') return function(handler) { return fixtureRunner(success, handler); };
        return function() {
          const args = Array.from(arguments);
          window.fixtureRequests.push({ method: method, args: args });
          fetch('/rpc', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({method, args}) })
            .then(response => response.json()).then(result => {
              if (result.error) { if (failure) failure(new Error(result.error)); }
              else if (success) success(result.data);
            }).catch(error => { if (failure) failure(error); });
        };
      }});
    }
    window.google = {script: {run: fixtureRunner()}};
  </script>`;
  html = html.replace('</head>', bridge + '</head>');
  const publicMethods = new Set(['appGetPageData', 'getAppBootstrap', 'appAddRecord', 'appUpdateRecord',
    'appDeleteRecord', 'appGetRowCredential', 'appGetCredentials', 'saveAppUser', 'deleteAppUser',
    'saveAppSettings', 'saveIntegrationConfig', 'appSaveInternetWanCircuit']);
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/rpc' && request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      response.setHeader('Content-Type', 'application/json');
      try {
        const { method, args } = JSON.parse(body);
        if (!publicMethods.has(method)) throw new Error('Live integration actions are unavailable in the local fixture.');
        rpcCalls.push({ method, page: args[0] });
        const data = harness.invoke(method, args);
        response.end(JSON.stringify({ data }));
      } catch (error) { response.end(JSON.stringify({ error: error.message })); }
      return;
    }
    if (url.pathname.startsWith('/vendor/')) {
      const vendorRoot = path.join(root, 'node_modules');
      const file = path.resolve(vendorRoot, decodeURIComponent(url.pathname.slice('/vendor/'.length)));
      if (!file.startsWith(vendorRoot + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        response.writeHead(404).end(); return;
      }
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(response);
      return;
    }
    if (url.pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
    response.setHeader('Content-Type', 'text/html');
    response.end(html);
  });
  return { server, harness, rpcCalls };
}

if (require.main === module) {
  const { server } = createPreviewServer();
  server.listen(0, '127.0.0.1', () => console.log('Fixture preview: http://127.0.0.1:' + server.address().port));
}
module.exports = { createPreviewServer };
