const { chromium } = require('playwright');
const FILE = process.argv[2] || 'file:///home/user/Sugimation/hiburan.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const RAW = require('fs').readFileSync('/home/user/Sugimation/hiburan.html', 'utf8');
  await p.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:')) return r.continue(); if (u.startsWith('https://raw.githubusercontent.com')) return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: RAW }); return r.abort(); });
  await p.goto(FILE); await p.waitForFunction(() => typeof makeProjectCode === 'function' && document.querySelectorAll('#landing-themes button').length > 0);
  const out = [];
  const ok = (n, c, x = '') => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);
  ok('Kartu Lanjutkan Proyek tampil di beranda (riwayat kosong)', /Lanjutkan Proyek[\s\S]*Tempel Kode Proyek/i.test(await p.locator('#landing-container').innerText()));
  // buat proyek tiruan lalu ubah jadi Kode Proyek
  const code = await p.evaluate(async () => {
    selections = { 1: 'Rani menunggu kabar di warung.', 2: 'Drama atau kisah haru', 4: '15 detik', temaRek: { id: 'drama', cabang: 'Keluarga' } };
    phaseUndText = 'Ringkasan: x'; phase1ResultText = 'Master Character: Rani.'; phase2ResultText = 'Scene 1: a\nScene 2: b'; totalScenes = 2;
    scenePrompts = ['Prompt scene satu ' + 'kata '.repeat(300), 'Prompt scene dua']; currentProjectId = null;
    return await makeProjectCode();
  });
  ok('Kode Proyek dibuat terkompresi (SGM1)', code.startsWith('SGM1:'), code.slice(0, 12) + '… (' + code.length + ' huruf)');
  const plainLen = await p.evaluate(() => JSON.stringify(buildProjectData()).length);
  ok('Kode lebih pendek dari data asli', code.length < plainLen, `${code.length} vs ${plainLen}`);
  await p.evaluate(() => { projectsHistory = []; resetProject(); showView('landing'); });
  await p.evaluate(c => { openImportBox(); document.getElementById('import-text').value = c; importFromText(); }, code);
  await p.waitForTimeout(800);
  ok('Tempel Kode Proyek (SGM1) membuka proyek', (await p.locator('#app-container').innerText()).includes('Hasil') && await p.evaluate(() => scenePrompts[1] === 'Prompt scene dua'));
  // kode tanpa kompresi (HP lama) dan kode yang terpotong
  const code0 = await p.evaluate(() => { const j = JSON.stringify(Object.assign({ app: 'sugimation-hiburan', v: 1 }, buildProjectData())); return 'SGM0:' + b64FromBytes(new TextEncoder().encode(j)); });
  await p.evaluate(c => { projectsHistory = []; resetProject(); openImportBox(); document.getElementById('import-text').value = c; importFromText(); }, code0);
  await p.waitForTimeout(600);
  ok('Tempel kode SGM0 (tanpa kompresi) juga bisa', await p.evaluate(() => scenePrompts[1] === 'Prompt scene dua'));
  await p.evaluate(() => closeMessage()); await p.waitForTimeout(400);
  await p.evaluate(c => { openImportBox(); document.getElementById('import-text').value = c.slice(0, c.length - 40); importFromText(); }, code);
  await p.waitForTimeout(600);
  ok('Kode terpotong ditolak dengan pesan', await p.locator('#message-box').evaluate(e => !e.classList.contains('hidden')) && /Bukan File Proyek/.test(await p.innerText('#message-title')), await p.innerText('#message-title'));
  await p.evaluate(() => { closeMessage(); closeImportBox(); }); await p.waitForTimeout(400);
  await p.evaluate(() => { resetProject(); showView('landing'); });
  await p.locator('#landing-resume button', { hasText: /^Lanjutkan$/ }).click(); await p.waitForTimeout(500);
  ok('Tombol Lanjutkan di beranda membuka proyek terakhir', (await p.locator('#app-container').innerText()).includes('Hasil') && await p.evaluate(() => scenePrompts[1] === 'Prompt scene dua'));
  // pengingat simpan otomatis setelah semua scene jadi
  await p.evaluate(() => { closeMessage(); closeImportBox(); savePromptShown = {}; isProcessingQueue = false; maybeAskSave(); });
  await p.waitForTimeout(1500);
  ok('Pengingat "Simpan proyek ini?" muncul otomatis, berisi kode', /Simpan proyek ini/.test(await p.innerText('#manual-copy-title')) && (await p.inputValue('#manual-copy-textarea')).startsWith('SGM'));
  await p.evaluate(() => { closeManualCopy(); maybeAskSave(); }); await p.waitForTimeout(1300);
  ok('Pengingat tidak muncul dua kali untuk proyek yang sama', await p.locator('#manual-copy-box').evaluate(e => e.classList.contains('hidden')));
  ok('Tanpa error JavaScript', !errs.length, errs.join(' | '));
  console.log(out.join('\n')); await b.close();
})();
