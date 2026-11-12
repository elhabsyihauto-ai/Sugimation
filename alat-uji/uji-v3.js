// Uji alur V3.0 untuk semua aplikasi: landing -> cabang/contoh -> wizard -> hasil, dengan jawaban Gemini tiruan.
// Pakai: node uji-v3.js file:///home/user/Sugimation/<app>.html ["'komedi',0"]   (argumen ke-2 opsional: saring tombol landing)
// JALUR=atur untuk jalur "Atur sendiri" (semua tahap); bawaan jalur "Cepat". VERB=1 menampilkan setiap tahap.
// Bisa lewat pemanggil: isi aplikasi untuk raw.githubusercontent.com dibaca dari file di repo.
const { chromium } = require('playwright');
const FILE = process.argv[2]; const START = process.argv[3] || ''; const VERB = process.env.VERB;
async function setup(browser, st) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(); st.errors = []; st.calls = []; st.unknown = [];
  page.on('pageerror', e => st.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/API Error|Failed to load|ERR_FAILED/.test(m.text())) st.errors.push('console: ' + m.text()); });
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('file:')) return r.continue();
    if (u.startsWith('https://raw.githubusercontent.com')) { st.raw = (st.raw || 0) + 1; const f = u.split('/main/')[1].split('?')[0]; return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: require('fs').readFileSync('/home/user/Sugimation/' + f, 'utf8') }); }
    if (!u.includes('generativelanguage')) return r.abort();
    const body = JSON.parse(r.request().postData() || '{}');
    if (/imagen|:predict/.test(u) || (body.generationConfig && body.generationConfig.responseModalities)) { st.calls.push('image'); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ predictions: [{ bytesBase64Encoded: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' }], candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }] } }] }) }); }
    const sys = (body.systemInstruction && body.systemInstruction.parts[0].text) || '', prompt = (body.contents && body.contents[0].parts.map(x => x.text || '').join('\n')) || '';
    let kind = 'other', text = '';
    if (sys.includes('{"ide":')) { kind = 'ideas'; text = JSON.stringify({ ide: [1, 2, 3, 4].map(i => ({ judul: `Ide ${i}`, cerita: `Cerita ide ${i}: dua orang dewasa di rumah mengalami kejadian tak terduga, lalu berakhir memuaskan.` })) }); }
    else if (sys.includes('{"hook":')) { kind = 'hook'; text = JSON.stringify({ hook: [1, 2, 3].map(i => ({ jenis: 'Pertanyaan', emoji: '❓', kalimat: `Pembuka nomor ${i}`, visual: 'Ruang tamu.' })) }); }
    else if (sys.includes('{"pemeran":')) { kind = 'cast'; text = JSON.stringify({ pemeran: [1, 2].map(i => ({ judul: `Kombinasi ${i}`, tokoh: `Raka (30, suami): sabar; Sinta (28, istri): tegas ${i}` })) }); }
    else if (sys.includes('"pertanyaan"')) { kind = 'und'; text = JSON.stringify({ ringkasan: 'Video.', jenis: 'Hiburan', pertanyaan: [] }); }
    else if (sys.includes('Auditor Quality Control') || /Quality Control/.test(sys.slice(0, 160))) { kind = 'qc'; text = '1. Sesuai cerita: Lolos - ok'; }
    else if (sys.includes('Retake Helper')) { kind = 'retake'; text = '--- PROMPT ---\nPrompt baru\n--- PERUBAHAN ---\n- Diperbaiki'; }
    else if (/^\s*\{|JSON/.test(sys.slice(-400)) && /\{"\w+":/.test(sys)) { kind = 'json?'; st.unknown.push(sys.match(/\{"\w+":[^\n]{0,120}/)[0]); text = '{}'; }
    else {
      const m = sys.match(/(SERIES BIBLE|SILABUS|MEMORI EPISODE|CATATAN EPISODE|Timing Plan|Storyboard and Script|Camera and Lighting Plan|Scene Image Prompt|Scene End Frame Prompt|Character Sheet Prompt|Subject & Props Reference Prompt|Location Reference Prompt|Motion Bridge|Teks Layar Siap Tempel|Paket Grafis|B-roll|Paket Publikasi|Panduan Produksi|master assets)/i);
      kind = m ? m[1] : 'other:' + sys.slice(0, 70).replace(/\s+/g, ' ');
      const sc = (prompt.match(/SCENE (\d+) OF (\d+)/) || [])[1];
      if (sc) kind = 'scene-' + sc;
      if (/Storyboard and Script/i.test(kind)) {
        const n = parseInt((prompt.match(/(\d+) scene\(s\)/) || [])[1] || '2');
        text = Array.from({ length: n }, (_, i) => `Scene ${i + 1}: Narrator (tenang, pelan): "Kalimat ${i + 1}."`).join('\n');
      } else if (sc) text = `Scene ${sc}: a calm medium shot in the living room. "Kalimat scene ini." Avoid: music.`;
      else text = `Hasil tiruan ${kind}.`;
    }
    st.calls.push(kind);
    await new Promise(z => setTimeout(z, 15));
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) });
  });
  await ctx.addInitScript(() => { window.__writes = 0; const o = document.open.bind(document); document.open = (...a) => { window.__writes++; return o(...a); }; });
  await page.goto(FILE); await page.waitForTimeout(2500);
  return { ctx, page };
}
const vis = p => p.evaluate(() => ({ h: [...document.querySelectorAll('#app-container h2')].filter(e => e.offsetParent).map(e => e.innerText.trim()).join(' / '), b: [...document.querySelectorAll('#app-container button')].filter(e => e.offsetParent && !e.disabled).map(e => e.innerText.replace(/\s+/g, ' ').trim()) }));
async function drive(page, st) {
  const seen = [];
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(250);
    const v = await vis(page); seen.push(v.h);
    if (VERB) console.log('  step', i, v.h, '|', v.b.slice(0, 8).join(' ¦ ').slice(0, VERB === '2' ? 600 : 120));
    const click = async re => page.evaluate(([src, fl]) => { const r = new RegExp(src, fl); const e = [...document.querySelectorAll('#app-container button')].find(e => e.offsetParent && !e.disabled && r.test(e.innerText.replace(/\s+/g, ' ').trim())); if (!e) return false; e.click(); return true; }, [re.source, re.flags]);
    if (await click(/Sutradarai Videoku|Buat Prompt|Mulai Buat|Sutradarai/)) return seen;
    if (await page.locator('#story-field').isVisible().catch(() => false) && await page.locator('#btn-lanjut').isVisible().catch(() => false)) { if (!(await page.inputValue('#story-field'))) await page.fill('#story-field', 'Dua orang dewasa di rumah mengalami kejadian lucu.'); await page.click('#btn-lanjut'); continue; }
    if (await click(/^Ide 1/)) continue;
    if (/Mau Atur/.test(v.h) && await click(process.env.JALUR === 'atur' ? /Atur sendiri/ : /Cepat/)) continue;
    if (await click(/Pembuka nomor 1/)) { await page.waitForTimeout(100); }
    if (await click(/Kombinasi 1/)) { await page.waitForTimeout(100); }
    const stuck = seen.length > 1 && seen[seen.length - 2] === v.h && st.lastNav;
    st.lastNav = false;
    if (/Durasi Video/.test(v.h) && !stuck && await click(/^15detik/)) { await page.waitForTimeout(150); }
    if (!stuck && await click(/^Lanjut\b|^Lanjutkan ›|Simpan & Lanjut|^Selesai/)) { st.lastNav = true; continue; }
    // pilih opsi pertama non-navigasi
    const opt = v.b.find(x => !/Kembali|Beranda|Ubah|Riwayat|Tulis sendiri|Tentukan sendiri|Isi sendiri|Lewati/.test(x) && x.length > 2);
    if (opt) { await click(new RegExp('^' + opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$')); continue; }
    throw new Error('macet di: ' + v.h);
  }
  throw new Error('terlalu banyak langkah: ' + seen.slice(-3).join(' | '));
}
(async () => {
  const browser = await chromium.launch(); const out = [];
  const starts = await (async () => { const st = {}; const { ctx, page } = await setup(browser, st); const s = await page.evaluate(() => [...document.querySelectorAll('#landing-themes button, #landing-examples button')].map(e => e.getAttribute('onclick')).filter(Boolean)); await ctx.close(); return [...new Set(s)].filter(x => /startFromBranch|startOwn|Example|contoh|pickExample/i.test(x) || /startFromBranch\('[^']+',0\)/.test(x)); })();
  const list = START ? starts.filter(s => s.includes(START)) : starts.filter(s => /,0\)|Example|example|contoh/.test(s));
  for (const s of list) {
    const st = {}; const { ctx, page } = await setup(browser, st);
    try {
      await page.evaluate(s);
      const seen = await drive(page, st);
      st.calls.length = 0;
      await page.waitForFunction(() => !isProcessingQueue && /Hasil|Langkah 1/.test(document.getElementById('app-container').innerText), null, { timeout: 60000 });
      await page.waitForTimeout(1500);
      const q = st.calls.join(',');
      const core = ['master assets', 'Location Reference Prompt', 'Storyboard and Script', 'Camera and Lighting Plan', 'scene-1', 'qc'].filter(k => !new RegExp(k, 'i').test(q));
      const res = await page.locator('#app-container').innerText();
      const auto = await page.evaluate(() => getQcDisplay().includes('PEMERIKSAAN OTOMATIS') + ' / ' + getAutoChecks().length + ' temuan');
      out.push(`[raw=${st.raw || 0} writes=${await page.evaluate(() => window.__writes)} title=${await page.title()}] `);
      out.push(`${core.length || st.errors.length ? 'FAIL' : 'PASS'}  ${s}: ${[...new Set(seen.filter(Boolean))].join(' › ')}\n        antrean: ${q}${core.length ? '\n        HILANG: ' + core : ''}${st.errors.length ? '\n        ERROR: ' + st.errors.join(' | ') : ''}${st.unknown.length ? '\n        JSON tak dikenal: ' + st.unknown.join(' ; ') : ''}  autocheck=${auto}`);
    } catch (e) { out.push(`FAIL  ${s}: ${e.message.split('\n')[0]}${st.errors.length ? ' ERROR: ' + st.errors.join(' | ') : ''}`); }
    await ctx.close();
  }
  console.log(out.join('\n')); await browser.close();
})();
