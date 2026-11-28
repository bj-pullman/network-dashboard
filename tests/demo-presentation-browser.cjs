const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const { createPreviewServer } = require('./preview.cjs');
(async () => {
  const {server, rpcCalls} = createPreviewServer({user:'viewer@example.test', demo:true});
  await new Promise(ok => server.listen(0,'127.0.0.1',ok));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {channel:'chrome'});
  try {
    for (const viewport of [{width:1440,height:950},{width:390,height:844}]) {
      const context = await browser.newContext({viewport,serviceWorkers:'block'});
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin);
      const nav = async (key) => {
        const target = page.locator('[data-page="'+key+'"].app-nav-item');
        if (!await target.isVisible()) {
          await page.evaluate(key => navigateTo(key), key);
        } else await target.click();
      };
      await page.waitForFunction(() => document.getElementById('pageEyebrow').textContent.trim() === 'DEMO SCHOOL DISTRICT');
      const demoRpcStart = rpcCalls.filter(x => ['demoSettings','demoUsers','settings','users'].includes(x.page)).length;
      await nav('demoSettings');
      await page.getByRole('heading',{name:'Integrations',exact:true}).waitFor();
      for (const name of ['Aruba Central','UptimeRobot','ThreatDown']) {
        await page.getByRole('heading',{name,exact:true}).waitFor();
      }
      assert.equal(await page.locator('#pageContent input, #pageContent button, #pageActions button').count(),0);
      await nav('demoUsers');
      await page.getByRole('heading',{name:'Authorized Users',exact:true}).waitFor();
      await page.getByText('View Demo Technician’s page overrides',{exact:true}).click();
      await page.getByText('Default → None',{exact:true}).waitFor();
      assert.equal(await page.locator('#pageContent input, #pageContent button, #pageActions button').count(),0);
      assert.equal(await page.getByText('Fixture Admin',{exact:true}).count(),0);
      if (viewport.width < 700) assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(rpcCalls.filter(x => ['demoSettings','demoUsers','settings','users'].includes(x.page)).length,demoRpcStart);
      await nav('outages');
      await page.getByText(/Downtime log.*UptimeRobot/).waitFor();
      await nav('changeLog');
      await page.getByText(/Manual log of what changed/).waitFor();
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('Demo preview verified at desktop and phone sizes; no admin page requests.');
  } finally {
    await browser.close();
    await new Promise(ok=>server.close(ok));
  }
})().catch(err=>{console.error(err);process.exitCode=1});
