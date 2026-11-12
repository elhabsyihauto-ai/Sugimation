const { chromium } = require('playwright');
const FILE = process.argv[2] || 'file:///home/user/Sugimation/hiburan.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:')) return r.continue(); if (u.startsWith('https://raw.githubusercontent.com')) return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: require('fs').readFileSync('/home/user/Sugimation/hiburan.html', 'utf8') }); return r.abort(); }); await p.goto(FILE); await p.waitForFunction(() => typeof initApp === 'function' && document.querySelectorAll('#landing-themes button, #landing-examples button').length > 0);
  console.log('kosong   :', (await p.locator('#landing-resume').innerText()).replace(/\n/g, ' | ').slice(0, 160));
  await p.evaluate(() => { selections = { 1: 'Rani menunggu kabar di warung.', temaRek: { id: 'drama', cabang: '' } }; phaseUndText = 'x'; phase1ResultText = 'y'; scenePrompts = ['a', 'b']; totalScenes = 2; currentProjectId = null; saveToHistory(); });
  await p.reload(); await p.waitForTimeout(800);
  console.log('ada riwayat, setelah dibuka ulang:', (await p.locator('#landing-resume').innerText()).replace(/\n/g, ' | ').slice(0, 200));
  console.log('riwayat termuat:', await p.evaluate(() => projectsHistory.length));
  await b.close();
})();
