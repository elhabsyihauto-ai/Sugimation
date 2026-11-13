const { chromium } = require('playwright');
const FILE = process.argv[2] || 'file:///home/user/Sugimation/hiburan.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(FILE); await p.waitForFunction(() => typeof getWave4Checks === 'function');
  const r = await p.evaluate(() => {
    const script = 'Scene 1 (0-8s): Rani stands.\nRani (pelan, cemas): "Kamu dengar suara itu juga, kan?"\nScene 2 (8-16s): Budi.\nBudi (santai, heran): "Suara apa? Aku nggak dengar apa-apa."';
    const run = (scenes, cov = '') => { selections = { 1: 'x', 5: 'Dialog karakter', temaRek: { id: 'drama', cabang: '' } }; totalScenes = scenes.length; phase2ResultText = script + (cov ? '\nCoverage:\n' + cov : ''); scenePrompts = scenes; return getWave4Checks(); };
    const ok1 = 'Medium shot. Rani says "Kamu dengar suara itu juga, kan?" Avoid: music.';
    const ok2 = 'Budi replies "Suara apa? Aku nggak dengar apa-apa." Avoid: music.';
    return {
      'Ucapan sama persis dengan naskah': run([ok1, ok2]),
      'SALAH: ucapan diubah': run(['Rani says "Kamu dengar suara aneh itu juga, kan?" Avoid: music.', ok2]),
      'SALAH: kata Indonesia di luar ucapan ("gemetar")': run(['Rani, gemetar, says "Kamu dengar suara itu juga, kan?" Avoid: music.', ok2]),
      'SALAH: prompt 600 kata': run([ok1 + ' detail'.repeat(600), ok2]),
      'Coverage: penjelasan konsep oleh narator (tidak ditandai)': run([ok1, ok2], '- Penjelasan konsep tabungan -> Scene 1: Narrator says the idea of saving'),
      'SALAH: Coverage peristiwa hanya oleh narator': run([ok1, ok2], '- Pembeli datang -> Scene 1: Narrator says a buyer came'),
      'Coverage: aksi terlihat sambil bicara': run([ok1, ok2], '- Budi membuka pintu -> Scene 2: Budi opens the door and says "Siapa?"'),
      'Coverage: narator di akhir aksi': run([ok1, ok2], '- Rani menutup warung -> Scene 1: Rani closes the shop shutter while the narrator describes the night'),
      'SALAH: Coverage "Narrator says ..."': run([ok1, ok2], '- Pembeli datang -> Scene 2: Narrator says a buyer came at midnight'),
      'SALAH: Coverage "Budi mentions ..."': run([ok1, ok2], '- Pembeli datang -> Scene 2: Budi mentions that a buyer came'),
      'SALAH: Coverage "hanya disebut"': run([ok1, ok2], '- Pembeli datang -> Scene 2: kedatangan pembeli hanya disebut dalam dialog'),
    };
  });
  for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'LOLOS    ') + k + (v.length ? '  → ' + v.map(x => x.replace(/: Perlu perbaikan - /, ': ').slice(0, 110)).join(' | ') : ''));
  await b.close();
})();
