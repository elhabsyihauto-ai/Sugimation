const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file:///home/user/Sugimation/cuan-iklan.html');
  await p.waitForFunction(() => typeof getAutoChecks === 'function');
  const r = await p.evaluate(() => {
    const run = (sel, scenes, extra = {}) => {
      selections = Object.assign({ 1: 'Review sarung tenun dipakai ke masjid.', 2: 'Iklan produk', 5: 'Narasi', 7: 'Sinematik mulus seperti film', produk: 'Sarung tenun' }, sel);
      totalScenes = scenes.length; scenePrompts = scenes; sceneImagePrompts = []; phaseOstText = '';
      phase1ResultText = extra.p1 || 'Master Character: the person from the reference photo. Master Location: a living room.'; phaseCharSheetText = extra.cs || '';
      return getAutoChecks();
    };
    const t = {};
    // Contoh yang meniru aturan bawaan aplikasi (seharusnya LOLOS)
    t['Estetik lifestyle (aturan bawaan)'] = run({ 6: 'Estetik lifestyle (aesthetic)' }, ['The product, a folded sarong, rests on a wooden table in a photorealistic aesthetic lifestyle look with a calm cozy premium mood. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.']);
    t['Efek sinematik premium (aturan bawaan)'] = run({ 11: 'Efek sinematik premium' }, ['Hands unfold the product slowly; subtle premium cinematic accents (a soft whoosh) only at the product reveal. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.']);
    t['ASMR (aturan bawaan)'] = run({ 12: 'Sinematik ASMR', 5: 'Tanpa ucapan (hanya suara lingkungan)' }, ['Extreme close-up of the product under premium hero lighting with soft reflections. Avoid: music.']);
    // Foto sendiri dengan aturan gerak bawaan (seharusnya LOLOS)
    t['Foto sendiri + aturan gerak bawaan'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['The person from the reference photo walks past blackout curtains, hair and clothes react to movement with real physics. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character reference sheet of the person from the reference photo, keeping their face exactly as in the photo.' });
    t['Foto sendiri + "long, slow push"'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['A long, slow push-in while hair and clothing react naturally. The person from the reference photo smiles. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character reference sheet of the person from the reference photo.' });
    // Contoh yang memang salah (seharusnya TERTANGKAP)
    t['SALAH: usia + rambut + fiktif'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['A fictional man, a 35-year-old with short black hair, wears the product. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character sheet of a man.' });
    t['SALAH: produk disebut cotton'] = run({}, ['The product is a soft cotton sarong. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.']);
    t['SALAH: produk disebut premium sarong'] = run({}, ['The product is a premium sarong with a glossy finish. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.']);
    t['SALAH: rambut "neatly combed dark hair"'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['The person from the reference photo with neatly combed dark hair. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character reference sheet of the person from the reference photo.' });
    t['SALAH: rambut "short-cropped black hair"'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['The person from the reference photo has short-cropped black hair. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character reference sheet of the person from the reference photo.' });
    t['SALAH: rambut "long flowing hair"'] = run({ fotoKarakter: true, 9: 'Multi referensi (Ingredients)' }, ['The person from the reference photo, long flowing hair moving. Narrator: "Sarung ini enak dipakai ke masjid setiap hari." Avoid: music.'], { cs: 'Character reference sheet of the person from the reference photo.' });
    return t;
  });
  for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'LOLOS    ') + k + (v.length ? '\n   ' + v.join('\n   ') : ''));
  await b.close();
})();
