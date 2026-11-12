const { chromium } = require('playwright');
const FILE = process.argv[2] || 'file:///home/user/Sugimation/hiburan.html';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto(FILE); await p.waitForFunction(() => typeof getCardChecks === 'function');
  const r = await p.evaluate(() => {
    const card = (t, pos, out, props, light, wea) => `Card: Transition=${t}; Position=${pos}; Facing=Rani faces Budi; Outfit=${out}; Props=${props}; Light=${light}; Weather=${wea}`;
    const board = (cards, extra = '') => `1. Core Message: Rani menunggu kabar.
2. Hook: Rani (pelan, cemas): "Kamu dengar suara itu juga, kan?"
3. Storyboard
Scene 1 (0-8s): Rani stands by the window.
${cards[0]}
Refs: Character Sheet Rani, Location Reference ruang tamu
Rani (pelan, cemas): "Kamu dengar suara itu juga, kan?"
Scene 2 (8-16s): Budi listens.
${cards[1]}
Refs: Character Sheet Rani, Budi
Budi (santai, heran): "Suara apa? Aku nggak dengar apa-apa."
Scene 3 (16-24s): Rani points at the door.
${cards[2]}
Refs: Character Sheet Rani, Budi
Rani (berbisik, tegang): "Itu, dari balik pintu dapur."
6. On-screen Text:
Scene 1: "Malam itu sepi sekali"
Scene 2: "Budi tidak percaya"
Scene 3: "Bersambung minggu depan"
Closing: "Itu, dari balik pintu dapur."
${extra}`;
    const run = (cards, scenes, sel = {}) => {
      selections = Object.assign({ 1: 'Cerita.', 5: 'Dialog karakter', 7: 'Sinematik mulus seperti film', temaRek: { id: 'drama', cabang: '' } }, sel);
      totalScenes = 3; phase2ResultText = board(cards); phase1ResultText = 'Master Voice: Speech Profile Rani: soft. Speech Profile Budi: casual.'; phaseUndText = '';
      scenePrompts = scenes || ['Rani in a white kebaya and red batik sarong, phone in her left hand.', 'Rani in a white kebaya and red batik sarong, phone in her left hand.', 'Rani in a white kebaya and red batik sarong, phone in her left hand.'];
      return getCardChecks().concat(getSpeechChecks());
    };
    const A = 'Rani at frame left, Budi at frame right, both standing', O = 'Rani: white kebaya and red batik sarong', P = 'phone in her left hand', L = 'warm ceiling lamp from above, night', W = 'indoor, rain outside';
    const speech = (b) => { selections = { 1: 'x', 5: 'Dialog karakter', temaRek: { id: 'drama', cabang: '' } }; totalScenes = 3; phase2ResultText = b; phase1ResultText = 'Master Voice: Speech Profile Rani: soft.'; scenePrompts = ['a', 'b', 'c']; return getSpeechChecks(); };
    const SC = (h, d1, d2, d3) => `2. Hook: ${h}\nScene 1 (0-8s): Rani stands.\n${d1}\nScene 2 (8-16s): Budi.\n${d2}\nScene 3 (16-24s): Rani.\n${d3}\n6. On-screen Text:\nScene 1: "Malam itu sepi sekali"\nScene 2: "Budi tidak percaya"\nScene 3: "Bersambung minggu depan"\nClosing: "Itu, dari balik pintu dapur."`;
    const tag = ['Rani (pelan, cemas): "Kamu dengar suara itu juga, kan?"', 'Budi (santai, heran): "Suara apa? Aku nggak dengar apa-apa."', 'Rani (berbisik, tegang): "Itu, dari balik pintu dapur."'];
    const untag = ['Rani: "Kamu dengar suara itu juga, kan?"', 'Budi: "Suara apa? Aku nggak dengar apa-apa."', 'Rani: "Itu, dari balik pintu dapur."'];
    const resolved = (() => { run([card('First scene', 'Rani at frame left', 'Rani: white kebaya', 'phone in her left hand', 'warm lamp, night', 'indoor'), card('Continuous', 'Rani at frame left', 'same as Scene 1', 'same', 'unchanged', 'same'), card('Continuous', 'Rani at frame left', 'same as previous scene', 'same', 'same', 'same')]); return getContinuityDisplay(); })();
    return {
      'Tampilan kartu: "same" diganti nilai asli': resolved.includes('Pakaian: Rani: white kebaya') && !/same|unchanged/i.test(resolved) ? [] : ['tampilan: ' + resolved.replace(/\n/g, ' | ')],
      'Cara bicara: semua berlabel, Hook tanpa label': speech(SC('"Kamu dengar suara itu juga, kan?"', ...tag)),
      'SALAH: cara bicara sebagian besar tanpa label': speech(SC('Rani (pelan, cemas): "Kamu dengar suara itu juga, kan?"', ...untag)),
      'Kartu lengkap & konsisten': run([card('First scene', A, O, P, L, W), card('Continuous', A, O, P, L, W), card('Continuous', A, O, P, L, W)]),
      'Kartu ditulis "same as Scene 1/previous"': run([card('First scene', A, O, P, L, W), card('Continuous', A, 'same as Scene 1', 'same as Scene 1', 'same as Scene 1', 'same as Scene 1'), card('Continuous', A, 'same as previous scene', 'same', 'unchanged', 'same as before')]),
      'SALAH: pakaian berganti di Continuous': run([card('First scene', A, O, P, L, W), card('Continuous', A, 'Rani: black hoodie and jeans', P, L, W), card('Continuous', A, 'Rani: black hoodie and jeans', P, L, W)]),
      'SALAH: siang jadi malam di Continuous': run([card('First scene', A, O, P, 'bright midday sun through the window', W), card('Continuous', A, O, P, 'dark night, single candle', W), card('Continuous', A, O, P, 'dark night, single candle', W)]),
      'SALAH: HP pindah tangan': run([card('First scene', A, O, P, L, W), card('Continuous', A, O, 'phone in her right hand', L, W), card('Continuous', A, O, 'phone in her right hand', L, W)]),
      'SALAH: hujan langsung cerah': run([card('First scene', A, O, P, L, 'heavy rain'), card('Continuous', A, O, P, L, 'clear and sunny'), card('Continuous', A, O, P, L, 'clear and sunny')]),
      'SALAH: Rani pindah sisi': run([card('First scene', A, O, P, L, W), card('Continuous', 'Rani at frame right, Budi at frame left', O, P, L, W), card('Continuous', 'Rani at frame right, Budi at frame left', O, P, L, W)]),
      'SALAH: Scene 3 tanpa kartu': run([card('First scene', A, O, P, L, W), card('Continuous', A, O, P, L, W), 'no card here']),
    };
  });
  for (const [k, v] of Object.entries(r)) console.log((v.length ? 'DITANDAI ' : 'LOLOS    ') + k + (v.length ? '\n           → ' + v.map(x => x.replace(/: Perlu perbaikan - /, ': ').slice(0, 150)).join('\n           → ') : ''));
  await b.close();
})();
