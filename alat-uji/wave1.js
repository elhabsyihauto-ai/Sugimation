const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/Sugimation/hiburan.html'); await p.waitForFunction(() => typeof getAutoChecks === 'function');
  const r = await p.evaluate(() => {
    const U = 'Ringkasan: Cerita.\n\nInformasi wajib (tidak boleh hilang):\n- Penjaga warung menutup pintu warung\n- Pembeli misterius datang tengah malam\n\nKeputusan kreatif AI:\n- Lokasi desa';
    const run = (theme, scenes, o = {}) => {
      selections = Object.assign({ 1: o.story || 'Cerita di rumah.', 5: 'Dialog karakter', 7: 'Sinematik mulus seperti film' }, o.sel || {});
      selections.temaRek = { id: theme, cabang: o.cabang || '' };
      totalScenes = scenes.length; scenePrompts = scenes; phaseOstText = ''; phaseCameraPlanText = o.cam || 'Medium shots.';
      phase1ResultText = o.p1 || 'Master Character: Rani. Master Entity: none. Master Location: a living room.';
      phaseUndText = o.und || ''; phase2ResultText = o.p2 || 'Scene 1: Entity: none.';
      return getAutoChecks().filter(x => !/Peta posisi hantu|Master Entity|Kartu kontinuitas|Profil bicara|Cara bicara|Callback|Ucapan Scene/.test(x) || o.keepEntity);
    };
    const S = (t) => t + '\nAvoid: music.';
    return {
      'Tari: "spins … skirt twirling"': run('tari', [S('Full-body shot: she spins once on the beat, her skirt twirling, then claps.')], { sel: { 5: 'Tanpa ucapan (hanya suara lingkungan)' } }),
      'Komedi sketsa: "spinning" (tetap ditandai)': run('komedi', [S('Budi keeps spinning a pen between his fingers.')]),
      'Stand up: "the crowd laughs softly"': run('komedi', [S('On the small stage the comic says "Saya tuh orangnya sabar." while the crowd in the dark watches.')], { cabang: 'Stand up comedy', p1: 'Master Location: a small comedy stage.' }),
      'Komedi sketsa: "crowded market" (tetap ditandai)': run('komedi', [S('Budi walks through a crowded market.')]),
      'Kalimat penyangkalan: "No crowd in the background"': run('komedi', [S('No crowd in the background; Budi stands alone.')]),
      'Bicara sambil berlari (tetap ditandai)': run('horor', [S('Rani runs to the door and shouts "Tunggu, jangan pergi dulu!"')]),
      '"running water" sambil bicara': run('horor', [S('Rani washes a plate under running water and says "Sudah malam, ya."')]),
      'Lari + kalimat berikutnya berisi "not" (tetap ditandai)': run('horor', [S('Rani runs to the door and shouts "Tunggu, jangan pergi dulu!" She does not look back.')]),
      'Lip-sync di wide shot (tetap ditandai)': run('drama', [S('Wide shot of the yard; Sinta speaks with lip-sync "Aku tidak akan pergi."')]),
      'Properti pindah tangan (tetap ditandai)': run('drama', [S('Sinta holds the letter in her left hand.'), S('Sinta, the letter in her right hand, looks up.')]),
      'Properti pindah tangan dengan "switches"': run('drama', [S('Sinta holds the letter in her left hand.'), S('Sinta switches the letter to her right hand and looks up.')]),
      'Alat studio di ruang tamu (tetap ditandai)': run('komedi', [S('A softbox lights Budi from the left.')]),
      '"no softbox" di ruang tamu': run('komedi', [S('Light comes from the window, no softbox or studio lights.')]),
      'Resep warna tidak disalin (tetap ditandai)': run('drama', [S('Sinta sits by the window.')], { p1: 'Master Location: a room.\nColor Recipe: warm amber highlights, teal shadows, muted greens' }),
      'Resep warna disalin': run('drama', [S('Sinta sits by the window. Color: warm amber highlights, teal shadows, muted greens.')], { p1: 'Master Location: a room.\nColor Recipe: warm amber highlights, teal shadows, muted greens' }),
      'Coverage lengkap': run('horor', [S('Scene.')], { und: U, p2: 'Scene 1: Entity: none.\nCoverage:\n- Penjaga warung menutup pintu warung -> Scene 1: closes the door\n- Pembeli misterius datang tengah malam -> Scene 2: a stranger arrives' }),
      'Coverage kurang satu (tetap ditandai)': run('horor', [S('Scene.')], { und: U, p2: 'Scene 1: Entity: none.\nCoverage:\n- Penjaga warung menutup pintu warung -> Scene 1: closes the door' }),
      'Tanpa Coverage (tetap ditandai)': run('horor', [S('Scene.')], { und: U, p2: 'Scene 1: Entity: none.' }),
    };
  });
  for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'LOLOS    ') + k + (v.length ? '\n           → ' + v.map(x => x.replace(/: Perlu perbaikan - /, ': ').slice(0, 140)).join('\n           → ') : ''));
  await b.close();
})();
