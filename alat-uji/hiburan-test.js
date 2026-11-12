// Uji semua tema SUGIMATION Hiburan dengan jawaban Gemini tiruan
const { chromium } = require('playwright');
const fs = require('fs');
const FILE = process.env.FILE || 'file:///home/user/Sugimation/hiburan.html';
const RAW = fs.readFileSync('/home/user/Sugimation/hiburan.html', 'utf8');
const out = []; const ok = (n, c, x = '') => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);

async function setup(browser, st) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.addInitScript(() => { window.__writes = 0; const o = document.open.bind(document); document.open = (...a) => { window.__writes++; return o(...a); }; });
  const page = await ctx.newPage();
  st.errors = [];
  page.on('pageerror', e => st.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/API Error|Failed to load/.test(m.text())) st.errors.push('console: ' + m.text()); });
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('file:')) return r.continue();
    if (u.startsWith('https://raw.githubusercontent.com')) { st.raw = (st.raw || 0) + 1; return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: RAW }); }
    if (!u.includes('generativelanguage')) return r.abort();
    const body = JSON.parse(r.request().postData());
    const sys = body.systemInstruction.parts[0].text, prompt = body.contents[0].parts[0].text;
    let kind = 'other', text = '';
    if (sys.includes('{"ide":')) { kind = 'ideas'; text = JSON.stringify({ ide: [1, 2, 3, 4].map(i => ({ judul: `Ide ${i}`, cerita: `Cerita ide ${i}: dua orang dewasa di rumah mengalami kejadian tak terduga, lalu berakhir memuaskan.` })) }); }
    else if (sys.includes('{"hook":')) { kind = 'hook'; text = JSON.stringify({ hook: [1, 2, 3].map(i => ({ jenis: 'Pertanyaan', emoji: '❓', kalimat: `Pembuka nomor ${i}`, visual: 'Ruang tamu.' })) }); }
    else if (sys.includes('{"pemeran":')) { kind = 'cast'; text = JSON.stringify({ pemeran: [1, 2].map(i => ({ judul: `Kombinasi ${i}`, tokoh: `Raka (30, suami): sabar; Sinta (28, istri): tegas ${i}` })) }); }
    else if (sys.includes('"pertanyaan"')) { kind = 'und'; text = JSON.stringify({ ringkasan: 'Video hiburan.', pertanyaan: [] }); }
    else if (sys.includes('Auditor Quality Control') || /Quality Control/.test(sys.slice(0, 120))) { kind = 'qc'; text = '1. Sesuai cerita: Lolos - ok'; }
    else if (sys.includes('Retake Helper')) { kind = 'retake'; text = '--- PROMPT ---\nPrompt baru\n--- PERUBAHAN ---\n- Diperbaiki'; }
    else {
      const m = sys.match(/(SERIES BIBLE|MEMORI EPISODE|Timing Plan|Storyboard and Script|Camera and Lighting Plan|Scene Image Prompt|Scene End Frame Prompt|Character Sheet Prompt|Subject & Props Reference Prompt|Location Reference Prompt|Motion Bridge|Teks Layar Siap Tempel|B-roll|Paket Publikasi|Panduan Produksi|master assets)/i);
      kind = m ? m[1] : 'other';
      const sc = (prompt.match(/SCENE (\d+) OF (\d+)/) || [])[1];
      if (sc) kind = 'scene-' + sc;
      if (/Storyboard and Script/.test(kind)) {
        const n = parseInt((prompt.match(/(\d+) scene\(s\) of about/) || [])[1] || '2');
        text = Array.from({ length: n }, (_, i) => `Scene ${i + 1}: Narrator says "Kalimat ${i + 1}."`).join('\n');
      } else if (sc) text = `Scene ${sc}: a calm medium shot in the living room. "Kalimat scene ini." Avoid: music.`;
      else text = `Hasil tiruan ${kind}.`;
    }
    st.calls.push(kind);
    await new Promise(z => setTimeout(z, 20));
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });
  await page.goto(FILE);
  await page.waitForFunction(() => document.querySelectorAll('#landing-themes button').length > 0, null, { timeout: 15000 });
  return { ctx, page };
}
const heading = async p => ((await p.locator('#app-container h2').first().textContent().catch(() => '')) || '').trim();
const bt = (p, t) => p.locator('#app-container button:visible', { hasText: t }).first();

// Jalankan wizard sampai Ringkasan, catat tahap yang dilewati
async function runWizard(page, opts = {}) {
  const seen = [];
  for (let i = 0; i < 25; i++) {
    const h = await heading(page);
    seen.push(h);
    if (/Ringkasan/.test(h)) return seen;
    if (await page.locator('#story-field').isVisible().catch(() => false)) { await page.click('#btn-lanjut'); }
    else if (/Kalimat Pembuka/.test(h)) { await page.locator('#app-container button', { hasText: 'Pembuka nomor 1' }).waitFor({ timeout: 8000 }); await page.locator('#app-container button', { hasText: 'Pembuka nomor 1' }).click(); await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); }
    else if (/Karakter Utama/.test(h)) { await page.locator('#app-container button', { hasText: 'Kombinasi 1' }).waitFor({ timeout: 8000 }); await page.locator('#app-container button', { hasText: 'Kombinasi 1' }).click(); await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); }
    else if (/Durasi Video/.test(h)) { await page.locator('#app-container button').filter({ hasText: opts.dur || '15detik' }).first().click(); }
    else if (/Format Produksi/.test(h)) { await bt(page, opts.format || 'Text-to-Image + Image-to-Video').click(); }
    else if (/Suara/.test(h) && opts.audio) { await bt(page, opts.audio).click(); await page.waitForTimeout(100); opts.onSuara && await opts.onSuara(page); await bt(page, 'Lanjut').click(); }
    else { await bt(page, 'Lanjut').click(); }
    await page.waitForTimeout(150);
  }
  return seen;
}
async function startTheme(page, id, cabangIdx = 0) {
  await page.evaluate(i => startFromTheme(i), id);
  await page.evaluate(i => selectBranch(i), cabangIdx);
  if (id === 'horor') {
    const h = await heading(page);
    if (!/Pilih Jenis Hantu/.test(h)) throw new Error('halaman Pilih Jenis Hantu tidak muncul: ' + h);
    await page.evaluate(() => pickHantu(selections[16] || 'Tentukan otomatis'));
  }
  await page.locator('#app-container button', { hasText: 'Ide 1' }).waitFor({ timeout: 8000 });
  await page.locator('#app-container button', { hasText: 'Ide 1' }).click();
  await page.waitForTimeout(150);
}
async function generate(page) {
  await bt(page, 'Sutradarai Videoku').click();
  await page.waitForFunction(() => !isProcessingQueue && /Hasil/.test(document.getElementById('app-container').innerText) && !/Sedang menyutradarai/.test(document.getElementById('app-container').innerText), null, { timeout: 40000 });
  await page.waitForTimeout(1400);
  // V2.7: pengingat "Simpan proyek ini?" muncul otomatis setelah semua scene jadi
  const open = await page.locator('#manual-copy-box').evaluate(e => !e.classList.contains('hidden'));
  page.__savePrompt = open && /Simpan proyek ini/.test(await page.innerText('#manual-copy-title'));
  if (open) { await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(350); }
}

(async () => {
  const browser = await chromium.launch();
  const themes = ['horor', 'komedi', 'drama', 'fantasi', 'nostalgia', 'tari', 'nyanyi', 'mini', 'hewan'];
  // 1) Semua 9 tema, alur lengkap
  for (const id of themes) {
    const st = { calls: [] };
    const { ctx, page } = await setup(browser, st);
    try {
      const name = await page.evaluate(i => THEMES.find(t => t.id === i).text, id);
      await startTheme(page, id);
      const seen = await runWizard(page);
      st.calls.length = 0;
      await generate(page);
      const res = await page.locator('#app-container').innerText();
      const q = st.calls.join(',');
      const extra = id === 'komedi' ? q.includes('Timing Plan') : id === 'drama' ? q.startsWith('und,SERIES BIBLE') && q.endsWith('MEMORI EPISODE') : true;
      const core = ['master assets', 'Character Sheet Prompt|Subject & Props Reference Prompt', 'Location Reference Prompt', 'Storyboard and Script', 'Camera and Lighting Plan', 'scene-1', 'scene-2', 'qc', 'Teks Layar Siap Tempel', 'B-roll'].every(k => new RegExp(k).test(q));
      ok(`${name}: wizard → hasil lengkap`, core && extra && /Prompt Scene|Scene 2/.test(res), `tahap: ${seen.filter((x, i, a) => a.indexOf(x) === i).join(' › ')}`);
      ok(`${name}: pengingat Simpan proyek muncul`, !!page.__savePrompt);
      ok(`${name}: tanpa error JS`, !st.errors.length, st.errors.join(' | '));
    } catch (e) { ok(`${id}: berhenti`, false, e.message.split('\n')[0]); }
    await ctx.close();
  }

  // 2) Fitur khusus
  {
    const st = { calls: [] }; const { ctx, page } = await setup(browser, st);
    await startTheme(page, 'horor', 1);
    await page.click('#btn-lanjut'); await page.waitForTimeout(150);
    ok('Horor Nusantara: halaman Pilih Jenis Hantu + Kuntilanak otomatis', await page.evaluate(() => selections[16]) === 'Kuntilanak');
    ok('Horor: Jenis Hantu sudah dipilih di halaman sendiri (tidak diulang di Arah Cerita)', !/Jenis Hantu/.test(await page.locator('#app-container').innerText()));
    await ctx.close();
  }
  {
    const st = { calls: [] }; const { ctx, page } = await setup(browser, st);
    await startTheme(page, 'nyanyi', 0);
    const seen = await runWizard(page);
    const sumTxt = await page.locator('#app-container').innerText();
    ok('Karakter Bernyanyi: mode lagu aktif', await page.evaluate(() => isSongMode()), await page.evaluate(() => selections[5]));
    ok('Karakter Bernyanyi: Gaya Bicara tidak ditanyakan', !/Gaya Bicara/.test(sumTxt));
    await ctx.close();
  }
  {
    // Komedi: Buat Ulang naskah → Timing Plan + kamera ikut dibuat ulang
    const st = { calls: [] }; const { ctx, page } = await setup(browser, st);
    await startTheme(page, 'komedi', 1); await runWizard(page); await generate(page);
    st.calls.length = 0;
    await page.locator('#res-p2').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
    await page.waitForFunction(() => !isRegenerating['p2']); await page.waitForTimeout(300);
    await page.evaluate(() => handleConfirmYes());
    await page.waitForFunction(() => !Object.values(isRegenerating).some(Boolean), null, { timeout: 20000 }); await page.waitForTimeout(200);
    ok('Komedi: buat ulang naskah → Timing Plan, kamera, lalu scene', st.calls.join() === 'Storyboard and Script,Timing Plan,Camera and Lighting Plan,Scene Image Prompt,scene-1,Scene Image Prompt,scene-2', st.calls.join());
    ok('Komedi: peringatan bagian lama tampil', /masih dari versi lama/.test(await page.locator('#app-container').innerText()));
    // Retake Helper
    ok('Komedi: Retake Helper tampil', /Retake Helper/.test(await page.locator('#app-container').innerText()));
    // Simpan dan buka lewat file
    await bt(page, 'Simpan ke file').click(); await page.waitForTimeout(300);
    const json = await page.inputValue('#manual-copy-textarea');
    await page.evaluate(() => { closeManualCopy(); projectsHistory = []; goNew(); openImportBox(); }); await page.waitForTimeout(400);
    await page.fill('#import-text', json); await page.locator('#import-box button', { hasText: 'Buka dari kode' }).click(); await page.waitForTimeout(600);
    ok('Simpan & buka proyek lewat kode', /Timing Plan/.test(await page.locator('#app-container').innerText()) && (await page.inputValue('#res-s-2')).length > 0);
    ok('Komedi khusus: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await ctx.close();
  }
  {
    // Drama: episode 2, arsip, dan buat ulang berantai dari Pemahaman Cerita
    const st = { calls: [] }; const { ctx, page } = await setup(browser, st);
    await startTheme(page, 'drama', 0); await runWizard(page); await generate(page);
    ok('Drama: Series Bible & Memori Episode tampil', /Series Bible/.test(await page.locator('#app-container').innerText()) && /Memori Episode 1/.test(await page.locator('#app-container').innerText()));
    st.calls.length = 0;
    await bt(page, 'Buat Episode 2').click(); await page.waitForTimeout(300);
    await page.evaluate(() => handleConfirmYes());
    await page.waitForFunction(() => !isProcessingQueue && episodeNumber === 2 && !!phaseMemoryText, null, { timeout: 30000 }); await page.waitForTimeout(300);
    const t2 = await page.locator('#app-container').innerText();
    ok('Drama: Episode 2 dibuat (tanpa Bible & Master Aset baru)', !st.calls.includes('SERIES BIBLE') && !st.calls.includes('master assets') && st.calls.includes('Storyboard and Script') && st.calls.includes('MEMORI EPISODE'), st.calls.join(','));
    await page.locator('summary', { hasText: 'Arsip Episode' }).click(); await page.waitForTimeout(200);
    const arsip = await page.locator('#app-container').innerText();
    ok('Drama: arsip Episode 1 + tombol Episode 3', /Arsip Episode \(1\)/.test(t2) && /Episode 1/.test(arsip) && /Buat Episode 3/.test(t2));
    await page.locator('#app-container button', { hasText: 'Salin' }).filter({ has: page.locator('xpath=.') }).last().click().catch(() => {});
    const archBtn = page.locator('button[onclick^="copyArchivedEpisode"]').first();
    await archBtn.click(); await page.waitForTimeout(400);
    const manualOpen = await page.locator('#manual-copy-box').evaluate(e => !e.classList.contains('hidden'));
    const archTxt = manualOpen ? await page.inputValue('#manual-copy-textarea') : await page.evaluate(() => buildArchiveText(seriesEpisodes[0]));
    ok('Drama: salin arsip Episode 1 berisi naskah + scene', /===== EPISODE 1 =====/.test(archTxt) && /===== SCENE 2 =====/.test(archTxt) && /MEMORI EPISODE 1/.test(archTxt));
    if (manualOpen) { await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(300); }
    st.calls.length = 0;
    await page.locator('#res-und').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
    await page.waitForFunction(() => !isRegenerating['und']); await page.waitForTimeout(300);
    await page.evaluate(() => handleConfirmYes());
    await page.waitForFunction(() => !Object.values(isRegenerating).some(Boolean), null, { timeout: 30000 }); await page.waitForTimeout(200);
    ok('Drama: buat ulang pemahaman → Bible dulu, lalu master, naskah, kamera, scene', st.calls.slice(0, 7).join() === 'und,SERIES BIBLE,master assets,Storyboard and Script,Character Sheet Prompt,Location Reference Prompt,Camera and Lighting Plan', st.calls.join(','));
    ok('Drama: peringatan menyebut Memori Episode', /Memori Episode/.test(((await page.locator('#app-container').innerText()).match(/⚠️ Naskah dan scene[^\n]*/) || [''])[0]));
    ok('Drama khusus: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await page.screenshot({ path: __dirname + '/hib-drama.png' });
    await ctx.close();
  }
  if (FILE.includes('pemanggil')) {
    const st = { calls: [] }; const { ctx, page } = await setup(browser, st);
    ok('Pemanggil: dimuat sekali, tanpa document.open', st.raw === 1 && await page.evaluate(() => window.__writes) === 0 && (await page.title()).includes('Hiburan V2.8'), `raw=${st.raw} title=${await page.title()}`);
    await page.screenshot({ path: __dirname + '/hib-pemanggil.png' });
    await ctx.close();
  }
  await browser.close();
  console.log(out.join('\n'));
})();
