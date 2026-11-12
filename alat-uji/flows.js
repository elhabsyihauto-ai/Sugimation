// Uji semua alur Cuan Iklan dengan jawaban Gemini tiruan
const { chromium } = require('playwright');
const FILE = process.env.FILE || 'file:///home/user/Sugimation/cuan-iklan.html';
const RAW = require('fs').readFileSync(__dirname + '/dl.html', 'utf8');
const OUT = process.argv[2];

const results = [];
let errors = [];
function ok(name, cond, extra = '') { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); }

function mockState() { return { calls: [], qcCount: 0, failIdeas: 0, askQuestions: false }; }

async function setup(browser, st) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__writes = 0; const o = document.open.bind(document), w = document.write.bind(document); document.open = (...a) => { window.__writes++; return o(...a); }; document.write = (...a) => { window.__writes++; return w(...a); }; }); // NOWRITE
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/API Error/.test(m.text()) && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith('file:')) return route.continue();
    if (url.startsWith('https://raw.githubusercontent.com/elhabsyihauto-ai/Sugimation/main/cuan-iklan.html')) { st.rawLoads = (st.rawLoads || 0) + 1; return route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'access-control-allow-origin': '*' }, body: RAW }); }
    if (!url.includes('generativelanguage.googleapis.com')) return route.abort();
    const body = JSON.parse(route.request().postData());
    const sys = body.systemInstruction.parts[0].text, prompt = body.contents[0].parts[0].text;
    const reqLine = (prompt.match(/Kalimat wajib diucapkan: "([^"]+)"/) || [])[1] || '';
    let kind = 'other', text = '';
    if (sys.includes('{"ide":')) {
      kind = 'ideas';
      if (st.failIdeas > 0) { st.failIdeas--; st.calls.push('ideas-500'); return route.fulfill({ status: 500, body: 'mock error' }); }
      text = JSON.stringify({ ide: [1, 2, 3, 4].map(i => ({ judul: `Ide ${i} ${st.calls.length}`, cerita: `Cerita ide nomor ${i}: produk dipakai sehari-hari lalu ajak penonton membeli.` })) });
    } else if (sys.includes('{"hook":')) {
      kind = 'hook';
      text = JSON.stringify({ hook: [1, 2, 3, 4, 5].map(i => ({ jenis: 'Masalah yang relate', emoji: '😩', kalimat: `Hook nomor ${i} ${st.calls.length}`, visual: 'Tangan memegang produk.' })) });
    } else if (sys.includes('"pertanyaan"')) {
      kind = 'und';
      text = JSON.stringify({ ringkasan: 'Iklan produk.', jenis_video: 'Iklan', tujuan: 'Jualan', penonton: 'Umum', emosi: 'Senang', informasi_wajib: ['Produk tampil'], keputusan_kreatif: ['Lokasi rumah'], pertanyaan: st.askQuestions ? ['Berapa ukuran produknya?', 'Warna apa saja?'] : [] });
    } else if (sys.includes('Auditor Quality Control')) {
      kind = 'qc'; st.qcCount++;
      text = st.qcCount === 1 ? '1. Sesuai cerita: Lolos - ok\n16. Kekuatan iklan: Perlu perbaikan - Scene 2 hook lemah\n5. Teks layar: Perlu perbaikan - on-screen text terlalu panjang' : '1. Sesuai cerita: Lolos - ok\n16. Kekuatan iklan: Lolos - ok';
    } else if (sys.includes('Retake Helper')) {
      kind = 'retake'; text = '--- PROMPT ---\nRevised prompt scene\n--- PERUBAHAN ---\n- Hook diperkuat';
    } else {
      const m = sys.match(/(Storyboard and Script|Camera and Lighting Plan|Scene Image Prompt|Scene End Frame Prompt|Character Sheet Prompt|Subject & Props Reference Prompt|Location Reference Prompt|Motion Bridge|Teks Layar Siap Tempel|B-roll|Paket Publikasi|Panduan Produksi|master assets)/i);
      kind = m ? m[1] : 'other';
      const sc = (prompt.match(/SCENE (\d+) OF (\d+)/) || [])[1];
      if (sc) kind = 'scene-' + sc;
      const fix = prompt.includes('CRITICAL FIX');
      if (/Storyboard and Script/.test(kind)) {
        const n = parseInt((prompt.match(/(\d+) scene\(s\) of about/) || [])[1] || '1');
        // pertama kali sengaja tanpa kalimat wajib, agar perbaikan otomatis teruji
        text = Array.from({ length: n }, (_, i) => `**Scene ${i + 1}**: Narrator says "Kalimat scene ${i + 1}."${(fix && i === n - 1 && reqLine) ? ` "${reqLine}"` : ''}`).join('\n') + '\n### Music: santai';
        if (fix) kind += '(fix)';
      } else if (sc) {
        text = `Scene ${sc} prompt. ${reqLine ? '"' + reqLine + '"' : ''} Avoid: music.`;
      } else text = `Hasil tiruan untuk ${kind}.`;
    }
    st.calls.push(kind);
    await new Promise(r => setTimeout(r, 30));
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });
  await page.goto(FILE);
  await page.waitForFunction(() => document.querySelectorAll('#landing-themes button').length > 0);
  st.writes = await page.evaluate(() => window.__writes);
  return { ctx, page };
}

const btn = (page, t) => page.locator('#app-container button:visible, #landing-container button:visible', { hasText: t }).first();
async function click(page, t) { await btn(page, t).click(); await page.waitForTimeout(120); }
async function heading(page) { return (await page.locator('#app-container h2').first().textContent()).trim(); }
async function modalOpen(page, id) { return !(await page.locator('#' + id).evaluate(e => e.classList.contains('hidden'))); }
async function confirmYes(page) { await page.locator('#confirm-box button', { hasText: /Ya|Yakin|Lanjut|Hapus/ }).last().click().catch(async () => { await page.evaluate(() => handleConfirmYes()); }); await page.waitForTimeout(300); }
async function waitResults(page, ms = 30000) { await page.waitForFunction(() => !isProcessingQueue && /Hasil Prompt Videomu/.test(document.getElementById('app-container').innerText), null, { timeout: ms }); await page.waitForTimeout(1400); if (await page.locator('#manual-copy-box').evaluate(e => !e.classList.contains('hidden'))) { await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(350); } }

async function flowA(browser) {
  const st = mockState(); st.askQuestions = true;
  const { ctx, page } = await setup(browser, st);
  const P = 'A ';
  await page.locator('#landing-themes button', { hasText: 'Review jujur saat dipakai' }).click();
  ok(P + 'beranda → chip gaya membuka halaman nama produk', /Produk apa/.test(await heading(page)));
  ok(P + 'tombol ide nonaktif saat kosong', await page.locator('#btn-ide').isDisabled());
  await page.fill('#rec-keyword', 'sarung tenun motif kotak');
  ok(P + 'tombol ide aktif setelah diisi', !(await page.locator('#btn-ide').isDisabled()));
  await page.click('#btn-ide');
  await page.waitForSelector('text=Pilih Ide Iklan');
  ok(P + '4 ide tampil', (await page.locator('#app-container button', { hasText: 'Ide ' }).count()) >= 4);
  await click(page, 'Ide lain'); await page.waitForTimeout(400);
  ok(P + '"Ide lain" memuat ide baru', st.calls.filter(c => c === 'ideas').length === 2);
  await page.locator('#app-container button', { hasText: 'Ide 1' }).first().click();
  ok(P + 'pilih ide → halaman cerita terisi', /Periksa Ide/.test(await heading(page)) && (await page.inputValue('#story-field')).includes('Cerita ide nomor 1'));
  await page.fill('#f-keunggulan', 'adem dan tidak mudah kusut');
  await page.click('#btn-lanjut');
  ok(P + 'Jenis Iklan dilewati (dari tema) → Strategi', /Strategi Iklan/.test(await heading(page)), await heading(page));
  ok(P + 'gaya iklan otomatis dari tema', await page.evaluate(() => selections[12]) === 'Review jujur ala pengguna');
  await click(page, 'Promo atau diskon terbatas');
  ok(P + 'kolom promo muncul', await page.locator('#f-hargaPromo').isVisible());
  await page.fill('#f-hargaPromo', 'Diskon 20% sampai Minggu');
  await click(page, 'Lihat pilihan lainnya');
  await click(page, 'Lanjut');
  ok(P + 'Strategi → Tempat Jualan', /Tempat Jualan/.test(await heading(page)));
  await click(page, 'TikTok Shop'); await click(page, 'WhatsApp');
  ok(P + 'pilih ganda + kolom WA muncul', await page.locator('#f-kontakWa').isVisible() && /Tempat utama: TikTok Shop/.test(await page.locator('#app-container').innerText()));
  await page.fill('#f-kontakWa', '0812-3456-7890');
  await click(page, 'Belum tahu'); ok(P + '"Belum tahu" mengganti pilihan lain', await page.evaluate(() => selections[13]) === 'Belum tahu / ajakan umum');
  await click(page, 'TikTok Shop'); await click(page, 'WhatsApp');
  ok(P + 'memilih platform menghapus "Belum tahu"', await page.evaluate(() => selections[13]) === 'TikTok Shop + WhatsApp');
  await click(page, 'Lanjut');
  ok(P + '→ Durasi', /Durasi Video/.test(await heading(page)));
  await page.locator('#app-container button', { hasText: '30detik' }).first().click().catch(() => {});
  if (!/Suara/.test(await heading(page))) await page.locator('#app-container button').filter({ hasText: /^30/ }).first().click();
  ok(P + 'pilih 30 detik → Suara', /Suara/.test(await heading(page)), await heading(page));
  await click(page, 'Jawa'); await click(page, 'Lanjut');
  ok(P + 'Suara → Tampilan', /Tampilan/.test(await heading(page)));
  await click(page, 'Gaya konten media sosial'); await click(page, 'Handheld natural'); await click(page, 'Lanjut');
  ok(P + 'Tampilan → Data Penting', /Data Penting/.test(await heading(page)));
  ok(P + 'nama produk terisi otomatis dari halaman ide', (await page.inputValue('#f-produk')) === 'sarung tenun motif kotak' && /Terisi dari halaman ide/.test(await page.locator('#app-container').innerText()));
  ok(P + 'foto produk otomatis aktif (tema produk)', await page.evaluate(() => !!selections.fotoProduk));
  await page.fill('#f-merek', 'gajah baring');
  await page.fill('#kalimat-wajib', 'Bahannya adem, nggak gampang kusut!');
  await page.selectOption('#posisi-kalimat', 'akhir');
  await click(page, 'Tambah kontak lain');
  await click(page, 'Lanjut');
  ok(P + 'Data → Kalimat Pembuka', /Kalimat Pembuka/.test(await heading(page)));
  await page.waitForSelector('text=Hook nomor 1');
  ok(P + 'Lanjut nonaktif sebelum memilih hook', await page.locator('#app-container button', { hasText: /^Lanjut$/ }).isDisabled());
  await click(page, 'Hook lain'); await page.waitForSelector('text=Hook nomor 1');
  await page.locator('#app-container button', { hasText: 'Hook nomor 2' }).click();
  ok(P + 'hook dipilih', /Dipilih/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Tulis sendiri'); await page.fill('#hook-own', 'Sarung adem buat kondangan?'); await click(page, 'Pakai kalimat ini');
  ok(P + 'hook tulis sendiri dipakai', await page.evaluate(() => selections.hookLine) === 'Sarung adem buat kondangan?');
  await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); await page.waitForTimeout(150);
  ok(P + 'Hook → Format Produksi', /Format Produksi/.test(await heading(page)));
  ok(P + 'Multi referensi disarankan (ada foto)', /Disarankan untuk fotomu/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Langsung Text-to-Video');
  ok(P + 'peringatan Text-to-Video + foto muncul', await modalOpen(page, 'confirm-box'));
  await page.evaluate(() => handleConfirmNo()); await page.waitForTimeout(300);
  await click(page, 'Multi referensi');
  ok(P + 'Format → Ringkasan', /Ringkasan/.test(await heading(page)));
  const sum = await page.locator('#app-container').innerText();
  ok(P + 'ringkasan memuat data penting', ['Gajah Baring', 'Diskon 20%', '0812-3456-7890', 'Sarung adem buat kondangan?', 'akhir video', '30 detik · 4 scene'].every(s => sum.includes(s)));
  // Ubah cerita dari ringkasan lalu kembali
  await click(page, 'Ubah'); ok(P + 'Ubah cerita kembali ke tahap 1', /Periksa Ide/.test(await heading(page)));
  await page.evaluate(() => { currentStep = totalSteps + 1; renderStep(); });
  await click(page, 'Sutradarai Videoku');
  await page.waitForSelector('text=Sedikit Pertanyaan', { timeout: 10000 });
  ok(P + 'pertanyaan susulan tampil', (await page.locator('textarea[id^=und-answer]').count()) === 2);
  await page.fill('#und-answer-0', 'Panjang 2 meter');
  await click(page, 'Lanjutkan ▶️');
  await waitResults(page);
  const res = await page.locator('#app-container').innerText();
  ok(P + 'hasil lengkap: referensi, master, naskah, kamera, 4 scene, motion, QC, teks layar, B-roll',
    ['Character Sheet Prompt', 'Location Reference Prompt', 'Master Aset', 'Storyboard & Naskah', 'Camera & Lighting Plan', 'Scene 4', 'Motion Bridge', 'Quality Control', 'Teks Layar Siap Tempel', 'Klip Sisipan'].every(s => res.includes(s)));
  ok(P + 'jawaban pertanyaan ikut dikirim', await page.evaluate(() => selections.jawaban && selections.jawaban[0].a === 'Panjang 2 meter'));
  ok(P + 'naskah tanpa kalimat wajib → otomatis diperbaiki sekali', st.calls.includes('Storyboard and Script(fix)'));
  ok(P + 'status kalimat wajib ✅ di scene terakhir', /✅ Scene 4/.test(res), (res.match(/Scene \d: [^\n]*/g) || []).slice(0, 2).join(' | '));
  ok(P + 'END CARD berisi merek, WA, ajakan', await page.inputValue('#res-ost').then(v => v.includes('END CARD') && v.includes('0812-3456-7890') && v.includes('Cek keranjang kuning!')));
  ok(P + 'catatan foto produk tanpa kurung ganda', /produkmu, yaitu sarung tenun motif kotak \(merek Gajah Baring\), sebagai/.test(res) && !res.includes('))'));
  ok(P + 'tanpa peringatan versi lama di hasil baru', !/masih dari versi lama/.test(res));
  ok(P + 'markdown dibersihkan di naskah', !(await page.inputValue('#res-p2')).includes('**'));
  // Salin semua (clipboard headless biasanya gagal → muncul salin manual)
  await page.locator('#btn-copy-all').click(); await page.waitForTimeout(400);
  const manual = await modalOpen(page, 'manual-copy-box');
  const copied = manual ? await page.inputValue('#manual-copy-textarea') : '(tersalin ke clipboard)';
  ok(P + 'Salin Semua berjalan', manual ? copied.includes('SCENE 4') && copied.includes('PAKET') === false : true, manual ? 'jendela salin manual muncul' : 'langsung tersalin');
  if (manual) { await page.evaluate(() => closeManualCopy()); await page.waitForTimeout(300); }
  // Perbaiki sesuai QC
  ok(P + 'tombol Perbaiki Sesuai QC muncul', await btn(page, 'Perbaiki Sesuai QC').isVisible());
  const before = st.calls.length;
  await click(page, 'Perbaiki Sesuai QC');
  await page.waitForFunction(() => !isRegenerating['qc'], null, { timeout: 15000 });
  const fixCalls = st.calls.slice(before);
  ok(P + 'QC fix: buat ulang Scene 2 + teks layar + QC ulang', fixCalls.join(',') === 'scene-2,Teks Layar Siap Tempel,qc', fixCalls.join(','));
  ok(P + 'tombol QC hilang setelah lolos', !(await btn(page, 'Perbaiki Sesuai QC').isVisible().catch(() => false)));
  // Buat ulang scene 3 dengan catatan
  await page.locator('#res-s-3').locator('xpath=../..').locator('input').fill('lebih pelan');
  const b2 = st.calls.length;
  await page.locator('#res-s-3').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
  await page.waitForFunction(() => !isRegenerating['s-3']);
  ok(P + 'Buat Ulang scene 3 + peringatan muncul', st.calls.slice(b2).join() === 'scene-3' && await page.locator('#warn-regen-s-3').isVisible());
  // Retake helper
  ok(P + 'tombol Perbaiki Prompt nonaktif awalnya', await page.locator('#btn-do-retake').isDisabled());
  await page.locator('#app-container select').first().selectOption('2');
  await click(page, 'Hook pembuka kurang kuat');
  ok(P + 'Perbaiki Prompt aktif setelah pilih masalah', !(await page.locator('#btn-do-retake').isDisabled()));
  await page.click('#btn-do-retake');
  await page.waitForSelector('#res-retake');
  ok(P + 'Retake: prompt perbaikan + perubahan tampil', (await page.inputValue('#res-retake')) === 'Revised prompt scene' && /Hook diperkuat/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Pakai Prompt Ini');
  ok(P + 'Retake diterapkan ke scene 2', (await page.inputValue('#res-s-2')) === 'Revised prompt scene');
  await click(page, 'Kembalikan Cadangan');
  ok(P + 'Kembalikan cadangan memulihkan scene 2', (await page.inputValue('#res-s-2')) !== 'Revised prompt scene');
  // Publikasi
  await page.locator('#app-container input[type=checkbox][value="YouTube Shorts"]').check();
  await click(page, 'Buat Paket Publikasi');
  await page.waitForFunction(() => !isProcessingQueue && !!phaseGuideText, null, { timeout: 10000 });
  await page.waitForTimeout(200);
  const r2 = await page.locator('#app-container').innerText();
  ok(P + 'Paket Publikasi + Panduan tampil', r2.includes('Panduan Produksi, Editing & Unggah') && (await page.inputValue('#res-pub')).length > 0);
  ok(P + 'platform terpilih ikut dikirim', await page.evaluate(() => pubPlatforms.includes('YouTube Shorts')));
  // Riwayat
  await page.evaluate(() => openHistoryModal()); await page.waitForTimeout(300);
  ok(P + 'riwayat menyimpan proyek', (await page.locator('#history-list button', { hasText: 'Buka Proyek' }).count()) === 1 && /Sedang Dibuka/.test(await page.locator('#history-list').innerText()));
  await page.evaluate(() => closeHistoryModal()); await page.waitForTimeout(300);
  await page.locator('#btn-baru').click().catch(() => page.evaluate(() => goHome()));
  await page.waitForTimeout(300);
  if (await modalOpen(page, 'confirm-box')) await page.evaluate(() => handleConfirmYes());
  await page.waitForTimeout(400);
  ok(P + 'kembali ke beranda', await page.locator('#landing-container').isVisible());
  await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => openHistoryModal()); await page.waitForTimeout(300);
  await page.locator('#history-list button', { hasText: 'Buka Proyek' }).click(); await page.waitForTimeout(500);
  const r3 = await page.locator('#app-container').innerText();
  ok(P + 'buka proyek dari riwayat (setelah reload) memulihkan hasil', r3.includes('Hasil Prompt Videomu') && r3.includes('Paket Publikasi') && (await page.inputValue('#res-s-4')).length > 0);
  await page.screenshot({ path: OUT + '/A-hasil.png', fullPage: false });
  // Hapus proyek
  await page.evaluate(() => openHistoryModal()); await page.waitForTimeout(300);
  await page.locator('#history-list button[title=Hapus]').click(); await page.waitForTimeout(300);
  await page.evaluate(() => handleConfirmYes()); await page.waitForTimeout(500);
  ok(P + 'hapus proyek dari riwayat', /Belum ada riwayat/.test(await page.locator('#history-list').innerText()));
  await ctx.close();
  return st;
}

async function flowB(browser) {
  const st = mockState(); st.failIdeas = 3;
  const { ctx, page } = await setup(browser, st);
  const P = 'B ';
  await page.locator('#landing-themes button', { hasText: 'Iklan Jasa & Layanan' }).first().click();
  ok(P + 'tema jasa → pilih gaya', /Iklan Jasa & Layanan/.test(await heading(page)));
  await click(page, 'Gaya lain — tulis sendiri');
  await page.fill('#rec-custom', 'Teknisi datang saat hujan');
  await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); await page.waitForTimeout(150);
  ok(P + 'gaya sendiri → halaman nama jasa', /Jasa apa/.test(await heading(page)));
  await page.fill('#rec-keyword', 'servis AC panggilan di Bekasi');
  await page.press('#rec-keyword', 'Enter');
  await page.waitForSelector('text=Gagal membuat ide', { timeout: 15000 });
  ok(P + 'API gagal 3x → pesan gagal tampil', st.calls.filter(c => c === 'ideas-500').length === 3);
  await page.click('#btn-ide'); await page.waitForSelector('text=Pilih Ide Iklan');
  ok(P + 'coba lagi berhasil', true);
  await click(page, 'Tulis ide sendiri');
  ok(P + 'tulis ide sendiri → cerita kosong', (await page.inputValue('#story-field')) === '');
  ok(P + 'Lanjut nonaktif saat cerita kosong', await page.locator('#btn-lanjut').isDisabled());
  // tombol Kembali dari tahap 1 tema: story → ide → cabang → beranda
  await click(page, 'Kembali'); ok(P + 'Kembali: cerita → ide', /Pilih Ide/.test(await heading(page)));
  await click(page, 'Kembali'); ok(P + 'Kembali: ide → gaya', /Iklan Jasa/.test(await heading(page)));
  await click(page, 'Teknisi datang saat hujan');
  ok(P + 'gaya sendiri bisa diedit lagi', (await page.inputValue('#rec-custom')) === 'Teknisi datang saat hujan');
  await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); await page.waitForTimeout(150);
  ok(P + 'ide tersimpan saat kembali lagi', /Pilih Ide/.test(await heading(page)));
  await click(page, 'Tulis ide sendiri');
  await page.fill('#story-field', 'AC rumah meneteskan air, teknisi datang, dibersihkan, rumah sejuk lagi.');
  await page.click('#btn-lanjut');
  ok(P + 'jenis iklan = jasa', await page.evaluate(() => selections[2]) === 'Iklan jasa atau layanan');
  ok(P + 'foto produk TIDAK otomatis untuk jasa', await page.evaluate(() => !selections.fotoProduk));
  await click(page, 'Lanjut');
  ok(P + 'Strategi default "Tentukan otomatis"', await page.evaluate(() => selections[3] === 'Tentukan otomatis' && selections[14] === 'Tentukan otomatis'));
  ok(P + 'Tempat Jualan (jasa) menyarankan WhatsApp', /WhatsApp[\s\S]{0,80}Disarankan/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Toko atau tempat usaha langsung'); await click(page, 'Lanjut');
  // Durasi Pro
  await click(page, 'Pro');
  await click(page, '10 detik');
  await page.fill('#custom-per-scene', '3'); await click(page, 'Pakai');
  ok(P + 'per scene < 4 ditolak', await modalOpen(page, 'message-box'));
  await page.evaluate(() => closeMessage()); await page.waitForTimeout(300);
  await page.fill('#custom-total', '1 menit');
  ok(P + 'pratinjau durasi "1 menit"', /60 detik · 6 scene × 10 detik/.test(await page.locator('#custom-total-preview').innerText()));
  await page.fill('#custom-total', '6 menit'); await click(page, 'Lanjut dengan durasi ini');
  ok(P + 'durasi > 5 menit ditolak', await modalOpen(page, 'message-box'));
  await page.evaluate(() => closeMessage()); await page.waitForTimeout(300);
  await page.fill('#custom-total', '55'); await click(page, 'Lanjut dengan durasi ini');
  ok(P + 'durasi Pro 55 dtk → 6 scene', await page.evaluate(() => getSceneCount() === 6 && getSecPerScene() === 10));
  // Suara: tanpa ucapan → bahasa & gaya bicara hilang
  await click(page, 'Tanpa ucapan');
  const t = await page.locator('#app-container').innerText();
  ok(P + 'tanpa ucapan menyembunyikan Bahasa & Gaya Bicara', !/Bahasa ucapan/.test(t) && !/Gaya Bicara/.test(t));
  await click(page, 'Tanpa efek suara'); await click(page, 'Suara kerja jasa');
  ok(P + 'efek suara: "Tanpa efek" diganti pilihan lain', await page.evaluate(() => selections[11]) === 'Suara kerja jasa');
  await click(page, 'Lanjut');
  await click(page, 'Lanjut'); // Tampilan default
  ok(P + 'kontak alamat muncul (tempat usaha langsung)', await page.locator('input[aria-label="Alamat toko"]').isVisible());
  ok(P + 'kolom jasa: area & jam', await page.locator('#f-area').isVisible() && await page.locator('#f-jam').isVisible());
  await page.fill('#kalimat-wajib', 'Panggilan servis datang di hari yang sama!');
  await click(page, 'Lanjut');
  await page.waitForSelector('text=Hook nomor 1');
  ok(P + 'hook tanpa ucapan = teks layar', /Teks yang tampil di 2 detik pertama/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Biarkan AI memilih');
  ok(P + '"Biarkan AI memilih" → Format', /Format Produksi/.test(await heading(page)));
  await click(page, 'Start–End Frame');
  ok(P + 'ringkasan', /Ringkasan/.test(await heading(page)) && /AI memilih/.test(await page.locator('#app-container').innerText()));
  await click(page, 'Sutradarai Videoku');
  await waitResults(page, 40000);
  const calls = st.calls.join(',');
  ok(P + 'Start-End: gambar awal + akhir untuk 6 scene', (calls.match(/Scene Image Prompt/g) || []).length === 6 && (calls.match(/Scene End Frame Prompt/g) || []).length === 6 && (calls.match(/scene-\d/g) || []).length === 6, '');
  ok(P + 'tanpa ucapan: tidak ada perbaikan kalimat wajib', !calls.includes('(fix)'));
  const res = await page.locator('#app-container').innerText();
  ok(P + 'kalimat wajib dipasang sebagai teks layar', /dipasang sebagai teks layar/.test(res));
  ok(P + 'END CARD tanpa alamat tidak mengajak datang', !(await page.inputValue('#res-ost')).includes('Yuk, datang langsung!'));
  ok(P + 'kartu gambar akhir tampil', res.includes('Gambar Akhir Scene 6'));
  // Buat ulang naskah → konfirmasi berantai
  const b = st.calls.length;
  await page.locator('#res-p2').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
  await page.waitForFunction(() => !isRegenerating['p2']); await page.waitForTimeout(300);
  ok(P + 'Buat ulang naskah → tanya buat ulang scene', await modalOpen(page, 'confirm-box'));
  await page.evaluate(() => handleConfirmYes());
  await page.waitForFunction(() => !Object.values(isRegenerating).some(Boolean), null, { timeout: 20000 });
  const casc = st.calls.slice(b);
  st.cascade = casc.join(',');
  ok(P + 'berantai: gambar awal + video dibuat ulang', casc.filter(c => c === 'Scene Image Prompt').length === 6 && casc.filter(c => /^scene-/.test(c)).length === 6);
  ok(P + 'berantai: gambar akhir (Start-End) ikut dibuat ulang', casc.filter(c => c === 'Scene End Frame Prompt').length === 6, `gambar akhir dibuat ulang: ${casc.filter(c => c === 'Scene End Frame Prompt').length}x`);
  ok(P + 'berantai: Camera Plan ikut dibuat ulang', casc.includes('Camera and Lighting Plan'), 'naskah berubah tapi rencana kamera lama tetap dipakai');
  ok(P + 'berantai: urutan kamera dulu, lalu per scene awal→akhir→video', casc[1] === 'Camera and Lighting Plan' && casc.slice(2, 5).join() === 'Scene Image Prompt,Scene End Frame Prompt,scene-1', casc.slice(0, 5).join());
  const warn = await page.locator('#app-container').innerText();
  ok(P + 'peringatan bagian lama tampil', /masih dari versi lama/.test(warn) && ['Motion Bridge', 'Quality Control', 'Teks Layar', 'B-roll'].every(x => warn.includes(x + ',') || warn.includes(x + '</') || new RegExp(x).test(warn.match(/⚠️ Naskah dan scene[^\n]*/)[0])), (warn.match(/⚠️ Naskah dan scene[^\n]*/) || [''])[0]);
  await page.locator('#res-qc').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
  await page.waitForFunction(() => !isRegenerating['qc']); await page.waitForTimeout(200);
  const w2 = (await page.locator('#app-container').innerText()).match(/⚠️ Naskah dan scene[^\n]*/);
  ok(P + 'QC dibuat ulang → hilang dari peringatan', w2 && !w2[0].includes('Quality Control') && w2[0].includes('Motion Bridge'), w2 ? w2[0] : 'peringatan hilang');
  await page.locator('summary', { hasText: 'Lihat Motion Bridge' }).click(); await page.waitForTimeout(150);
  for (const id of ['mot', 'ost', 'broll']) {
    await page.locator('#res-' + id).locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
    await page.waitForFunction(i => !isRegenerating[i], id); await page.waitForTimeout(150);
  }
  const w3 = ((await page.locator('#app-container').innerText()).match(/⚠️ Naskah dan scene[^\n]*/) || ['-'])[0];
  ok(P + 'semua dibuat ulang → peringatan hilang', w3 === '-', w3 + ' / ' + st.calls.slice(-4).join());
  await page.screenshot({ path: OUT + '/B-hasil.png' });
  await ctx.close();
  return st;
}

async function flowC(browser) {
  const st = mockState();
  const { ctx, page } = await setup(browser, st);
  const P = 'C ';
  await page.locator('#landing-container button, #landing-container a', { hasText: 'lanjutkan proyek sebelumnya' }).first().click().catch(() => {});
  await page.waitForTimeout(300);
  ok(P + 'riwayat kosong tampil', /Belum ada riwayat/.test(await page.locator('#history-list').innerText()));
  await page.evaluate(() => closeHistoryModal()); await page.waitForTimeout(300);
  await page.evaluate(() => startOwnIdea());
  ok(P + 'cerita sendiri: contoh tampil', (await page.locator('#app-container button', { hasText: 'Jasa servis AC' }).count()) === 1);
  await click(page, 'Review jujur blender');
  ok(P + 'klik contoh mengisi cerita', (await page.inputValue('#story-field')).startsWith('Review jujur blender'));
  await page.fill('#story-field', 'Anak umur 12 tahun mencoba blender');
  await page.click('#btn-lanjut');
  ok(P + 'cerita dengan anak di bawah umur ditolak', await modalOpen(page, 'message-box'));
  await page.evaluate(() => closeMessage()); await page.waitForTimeout(300);
  await page.fill('#story-field', 'Ibu muda membuat jus di kantor dengan blender mini.');
  await page.click('#btn-lanjut');
  ok(P + 'Jenis Iklan tampil (tanpa tema)', /Jenis Iklan/.test(await heading(page)));
  await click(page, 'Jenis lainnya'); await page.fill('#cus-2', 'Iklan produk dapur'); await click(page, 'Simpan');
  ok(P + 'jenis tulis sendiri → langsung lanjut', /Strategi/.test(await heading(page)) && await page.evaluate(() => getAdKind()) === 'p');
  await click(page, 'Kembali'); ok(P + 'Kembali ke Jenis Iklan, isian tetap', /Iklan produk dapur/.test(await page.locator('#app-container').innerText()));
  await click(page, 'AI tentukan dari ceritaku');
  await click(page, 'Lanjut'); await click(page, 'Lanjut');
  await page.locator('#app-container button').filter({ hasText: '8detik' }).first().click(); await page.waitForTimeout(150);
  ok(P + '8 detik = 1 scene', await page.evaluate(() => getSceneCount()) === 1);
  await click(page, 'Lanjut'); await click(page, 'Lanjut');
  ok(P + 'kolom data umum (jenis otomatis)', await page.locator('#f-namaUsaha').isVisible());
  await click(page, 'Pakai wajahku sendiri');
  await click(page, 'Lanjut');
  await page.waitForSelector('text=Hook nomor 1');
  await page.locator('#app-container button', { hasText: 'Hook nomor 3' }).click();
  await page.locator('#app-container button', { hasText: /^Lanjut$/ }).click(); await page.waitForTimeout(150);
  await click(page, 'Langsung Text-to-Video');
  ok(P + 'peringatan foto + Text-to-Video', await modalOpen(page, 'confirm-box'));
  await page.evaluate(() => handleConfirmYes()); await page.waitForTimeout(400);
  ok(P + 'tetap pakai Text-to-Video → ringkasan', /Ringkasan/.test(await heading(page)));
  // tombol kembali dari ringkasan
  await click(page, 'Kembali'); ok(P + 'Kembali dari ringkasan → Format', /Format Produksi/.test(await heading(page)));
  await page.evaluate(() => { currentStep = totalSteps + 1; renderStep(); });
  await click(page, 'Sutradarai Videoku');
  await waitResults(page);
  const calls = st.calls.join(',');
  ok(P + '1 scene: tanpa Motion Bridge & tanpa prompt gambar', !calls.includes('Motion Bridge') && !calls.includes('Scene Image Prompt') && calls.includes('scene-1'));
  ok(P + 'Text-to-Video: info foto tidak tampil', !/Foto karakter sendiri:/.test(await page.locator('#app-container').innerText()));
  // Buat ulang pemahaman cerita → tolak berantai
  await page.locator('#res-und').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
  await page.waitForFunction(() => !isRegenerating['und']); await page.waitForTimeout(300);
  ok(P + 'Buat ulang pemahaman → konfirmasi', await modalOpen(page, 'confirm-box'));
  await page.evaluate(() => handleConfirmNo()); await page.waitForTimeout(300);
  const bc = st.calls.length;
  await page.locator('#res-und').locator('xpath=../..').locator('button', { hasText: 'Buat Ulang' }).click();
  await page.waitForFunction(() => !isRegenerating['und']); await page.waitForTimeout(300);
  await page.evaluate(() => handleConfirmYes());
  await page.waitForFunction(() => !Object.values(isRegenerating).some(Boolean), null, { timeout: 20000 });
  const cc = st.calls.slice(bc);
  ok(P + 'berantai dari pemahaman: master, naskah, referensi, kamera, scene', cc.join() === 'und,master assets,Storyboard and Script,Character Sheet Prompt,Location Reference Prompt,Camera and Lighting Plan,scene-1', cc.join());
  ok(P + 'pertanyaan tidak muncul saat buat ulang', !/Sedikit Pertanyaan/.test(await page.locator('#app-container').innerText()));
  // Proyek Baru di tengah jalan
  await page.evaluate(() => goNew()); await page.waitForTimeout(300);
  ok(P + 'Proyek baru → beranda', await page.locator('#landing-container').isVisible());
  await page.screenshot({ path: OUT + '/C-beranda.png' });
  await ctx.close();
  return st;
}

(async () => {
  const browser = await chromium.launch();
  for (const [name, f] of [['A', flowA], ['B', flowB], ['C', flowC]]) {
    errors = [];
    try { const st = await f(browser); results.push(`   (${name}: ${st.calls.length} panggilan AI, dimuat dari GitHub ${st.rawLoads || 0}x, document.write/open dipakai ${st.writes}x)`); }
    catch (e) { results.push(`FAIL  ${name} berhenti: ${e.message.split('\n')[0]}`); }
    results.push(errors.length ? `FAIL  ${name} error JavaScript: ${[...new Set(errors)].join(' | ')}` : `PASS  ${name} tanpa error JavaScript`);
  }
  await browser.close();
  console.log(results.join('\n'));
})();
