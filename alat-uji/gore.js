const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(process.argv[2] || 'file:///home/user/Sugimation/hiburan.html'); await p.waitForFunction(() => typeof getAutoChecks === 'function');
  const r = await p.evaluate(() => {
    const run = (sc, sel = {}) => { selections = Object.assign({ 1: 'Cerita.', 2: 'Horor', 5: 'Narasi', 7: 'Sinematik mulus seperti film' }, sel); totalScenes = 1; scenePrompts = [sc]; phaseOstText = ''; phase1ResultText = 'Master Character: Rani.'; return getAutoChecks().filter(x => /sadis/.test(x)); };
    return {
      'Sundel Bolong aturan bawaan, tanpa titik': run('A Sundel Bolong in a white gown, the hole in her back only hinted at in darkness (never graphic, no blood) Avoid: music'),
      'Aturan bawaan: "NO blood, gore, wounds"': run('Even at the strongest level, NO blood, gore, wounds, organs, corpses, cruelty. Avoid: music.'),
      'AI menulis "without blood or wounds"': run('The ghost appears without blood or wounds, only a pale face. Avoid: music.'),
      'AI menulis "free of gore"': run('The scene stays free of gore, fear comes from shadows. Avoid: music.'),
      'Drama: dialog "membuka luka lama"': run('Sinta says "Kenapa kamu membuka luka lama itu lagi, Mas?" Avoid: music.', { 2: 'Drama atau kisah haru' }),
      'SALAH: "blood drips from her eyes"': run('Blood drips from her eyes as she turns. Avoid: music.'),
      'SALAH: "No one sees the corpse"': run('No one sees the corpse behind the door. Avoid: music.'),
      'SALAH: "darah mengalir" di dialog': run('Rani whispers "Darah mengalir dari dinding itu." Avoid: music.'),
      'SALAH: "her wound bleeds"': run('Her wound bleeds slowly while she walks. Avoid: music.'),
      'SALAH: "a corpse lies on the floor"': run('A corpse lies on the floor of the hallway. Avoid: music.'),
    };
  });
  for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'LOLOS    ') + k + (v.length ? '  → ' + v.join(' ') : ''));
  await b.close();
})();
