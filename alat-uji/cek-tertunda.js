// Cek peringatan palsu yang tertunda (lihat CATATAN.md). Pakai: node cek-tertunda.js file:///home/user/Sugimation/hiburan.html
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
await p.goto(process.argv[2]); await p.waitForFunction(() => typeof getAutoChecks === 'function');
const r = await p.evaluate(() => {
  const base = 'Scene 1: Rani stands at frame left in the lift, facing the doors, 35mm f/2.8, warm light from the ceiling. Avoid: music.';
  const run = (sc, sel = {}) => { selections = Object.assign({ 1: 'Cerita di lift.', 2: 'Horor', 5: 'Narasi', 7: 'Realistis sinematik' }, sel); totalScenes = 1; scenePrompts = [sc]; phaseOstText = ''; phase2ResultText = ''; phase1ResultText = 'Master Character: Rani.'; try { return getAutoChecks(); } catch (e) { return ['ERROR ' + e.message]; } };
  const words = n => Array(n).fill('quiet').join(' ');
  return {
    'LED panel di plafon lift': run(base.replace('warm light from the ceiling', 'cold light from a recessed LED panel in the ceiling')).filter(x => /studio|LED/i.test(x)),
    'invisible crowd (kiasan)': run(base + ' She speaks as if to an invisible crowd.').filter(x => /crowd/i.test(x)),
    'Realistis 600 kata': run(base + ' ' + words(560)).filter(x => /Panjang prompt/i.test(x)),
    'Tanpa ucapan tapi ada lip-sync': run(base + ' She whispers "Siapa di sana?" with lip-sync.', { 5: 'Tanpa ucapan' }).filter(x => /ucapan|lip/i.test(x)),
  };
});
for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'lolos    ') + k + (v.length ? '  → ' + v.join(' || ').slice(0, 220) : ''));
await b.close(); })();
