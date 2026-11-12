// Uji fitur baru V1.5: peringatan pilihan, pemeriksaan otomatis QC, simpan/buka proyek lewat file
const { chromium } = require('playwright');
const fs = require('fs');
const FILE = process.env.FILE || 'file:///home/user/Sugimation/cuan-iklan.html';
const RAW = fs.readFileSync(__dirname + '/dl.html', 'utf8');
const out = [], errors = [];
const ok = (n, c, x = '') => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const calls = []; let s2 = 0;
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('file:')) return r.continue();
    if (u.startsWith('https://raw.githubusercontent.com')) return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: RAW });
    if (!u.includes('generativelanguage')) return r.abort();
    const body = JSON.parse(r.request().postData());
    const sys = body.systemInstruction.parts[0].text, prompt = body.contents[0].parts[0].text;
    let kind = 'other', text = 'Hasil tiruan.';
    if (sys.includes('{"hook":')) { kind = 'hook'; text = JSON.stringify({ hook: [{ jenis: 'Hasil dulu', emoji: '🏆', kalimat: 'Jus segar dalam semenit', visual: 'Blender berputar.' }] }); }
    else if (sys.includes('"pertanyaan"')) { kind = 'und'; text = JSON.stringify({ ringkasan: 'Iklan blender.', pertanyaan: [] }); }
    else if (sys.includes('Auditor Quality Control')) { kind = 'qc'; text = '1. Sesuai cerita: Lolos - ok'; }
    else {
      const sc = (prompt.match(/SCENE (\d+) OF (\d+)/) || [])[1];
      if (sc) {
        kind = 'scene-' + sc;
        if (sc === '2' && s2++ === 0) text = 'Scene 2. Narrator says "Ini blender terbaik yang pernah aku pakai di kantor setiap hari tanpa ribet sama sekali dan sangat cepat sekali bekerja untuk semua buah" Camera: handheld drift. Avoid: music.';
        else text = `Scene ${sc}. Narrator says "Blender mini ini praktis dipakai di kantor." Camera: tripod. Avoid: music.`;
      }
    }
    calls.push(kind);
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });
  await page.goto(FILE);
  await page.waitForFunction(() => document.querySelectorAll('#landing-themes button').length > 0);
  const btn = t => page.locator('#app-container button:visible', { hasText: t }).first();
  const click = async t => { await btn(t).click(); await page.waitForTimeout(150); };
  const text = () => page.locator('#app-container').innerText();
  const modal = id => page.locator('#' + id).evaluate(e => !e.classList.contains('hidden'));

  await page.evaluate(() => startOwnIdea());
  await page.fill('#story-field', 'Review blender mini dipakai bikin jus di kantor.');
  await page.click('#btn-lanjut');
  await click('AI tentukan dari ceritaku');
  await click('Lanjut'); await click('Lanjut');
  await page.locator('#app-container button').filter({ hasText: '15detik' }).first().click(); await page.waitForTimeout(150);
  await click('Narasi'); await click('Lanjut');
  const tampil = await text();
  ok('peringatan: "Bicara langsung ke kamera" + suara Narasi', /hanya menghadap kamera tanpa bicara/.test(tampil));
  await click('Lanjut');
  await click('Lanjut'); // Data Penting
  await page.waitForSelector('text=Jus segar dalam semenit');
  await click('Biarkan AI memilih');
  ok('peringatan: Text-to-Video dengan 2 scene tanpa foto', /Wajah dan produk bisa berubah antar-scene/.test(await text()));
  await click('Text-to-Image + Image-to-Video');
  await click('Sutradarai Videoku');
  await page.waitForFunction(() => !isProcessingQueue && /Hasil Prompt Videomu/.test(document.getElementById('app-container').innerText), null, { timeout: 30000 });
  await page.waitForTimeout(1400); if (await page.locator('#manual-copy-box').evaluate(e => !e.classList.contains('hidden'))) { await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(350); }
  const qc = await page.inputValue('#res-qc');
  ok('QC memuat PEMERIKSAAN OTOMATIS', qc.includes('PEMERIKSAAN OTOMATIS'));
  ok('otomatis: ucapan Scene 2 kepanjangan', /\[Otomatis\] Panjang ucapan Scene 2: Perlu perbaikan/.test(qc));
  ok('otomatis: klaim "terbaik" di Scene 2', /Klaim di ucapan Scene 2: Perlu perbaikan - kata "terbaik"/.test(qc));
  ok('otomatis: handheld padahal tidak dipilih', /Kamera Scene 2: Perlu perbaikan/.test(qc));
  ok('otomatis: Scene 1 bersih', !/Scene 1: Perlu/.test(qc));
  const before = calls.length;
  await click('Perbaiki Sesuai QC');
  await page.waitForFunction(() => !isRegenerating['qc'], null, { timeout: 15000 }); await page.waitForTimeout(200);
  ok('Perbaiki Sesuai QC hanya membuat ulang Scene 2', calls.slice(before).join() === 'scene-2,qc', calls.slice(before).join());
  const qc2 = await page.inputValue('#res-qc');
  ok('setelah diperbaiki: pemeriksaan otomatis lolos', /Lolos - panjang ucapan/.test(qc2), qc2.split('PEMERIKSAAN OTOMATIS')[1]);
  ok('tombol Perbaiki Sesuai QC hilang', !(await btn('Perbaiki Sesuai QC').isVisible().catch(() => false)));

  // Simpan ke file
  const dlP = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await click('Simpan ke file');
  const dl = await dlP;
  const json = await page.inputValue('#manual-copy-textarea');
  ok('Simpan ke file: kode proyek tampil untuk disalin', json.startsWith('{"app":"sugimation-cuan-iklan"') && await modal('manual-copy-box'));
  let path = null;
  if (dl) { path = __dirname + '/proyek.json'; await dl.saveAs(path); }
  ok('Simpan ke file: file .json terunduh', !!dl && /^sugimation-cuan-iklan-.*\.json$/.test(dl.suggestedFilename()), dl ? dl.suggestedFilename() : 'tidak ada unduhan');
  await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(300);
  // Hapus riwayat lalu buka dari kode
  await page.evaluate(() => { projectsHistory = []; try { localStorage.clear(); } catch (e) {} goNew(); });
  await page.evaluate(() => openHistoryModal()); await page.waitForTimeout(300);
  await page.locator('#history-box button', { hasText: 'Buka dari file' }).click(); await page.waitForTimeout(300);
  ok('kotak Buka Proyek terbuka', await modal('import-box'));
  await page.fill('#import-text', 'bukan kode proyek'); await page.locator('#import-box button', { hasText: 'Buka dari kode' }).click(); await page.waitForTimeout(300);
  ok('kode salah ditolak dengan pesan', await modal('message-box') && /Bukan File Proyek/.test(await page.innerText('#message-title')));
  await page.evaluate(() => closeMessage()); await page.waitForTimeout(300);
  await page.fill('#import-text', json); await page.locator('#import-box button', { hasText: 'Buka dari kode' }).click(); await page.waitForTimeout(600);
  ok('buka dari kode memulihkan hasil', /Hasil Prompt Videomu/.test(await text()) && (await page.inputValue('#res-s-2')).includes('praktis'));
  ok('proyek masuk riwayat lagi', await page.evaluate(() => projectsHistory.length) === 1);
  if (path) {
    await page.evaluate(() => { projectsHistory = []; goNew(); openImportBox(); }); await page.waitForTimeout(300);
    await page.setInputFiles('#import-box input[type=file]', path); await page.waitForTimeout(800);
    ok('buka dari file .json memulihkan hasil', /Hasil Prompt Videomu/.test(await text()) && (await page.inputValue('#res-s-1')).length > 0);
  }
  ok('tanpa error JavaScript', !errors.length, errors.join(' | '));
  await page.screenshot({ path: __dirname + '/v15-hasil.png' });
  await b.close();
  console.log(out.join('\n'));
})();
