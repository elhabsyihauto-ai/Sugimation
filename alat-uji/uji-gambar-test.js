// Uji Sugi Studio - Uji Gambar dengan jawaban model gambar tiruan
const { chromium } = require('playwright');
const fs = require('fs');
const FILE = process.env.FILE || 'file:///home/user/Sugimation/uji-gambar.html';
const RAW = fs.readFileSync('/home/user/Sugimation/uji-gambar.html', 'utf8');
const out = []; const ok = (n, c, x = '') => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function setup(browser, mode) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const st = { calls: [], errors: [] };
  page.on('pageerror', e => st.errors.push(e.message));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('file:')) return r.continue();
    if (u.startsWith('https://raw.githubusercontent.com')) { st.raw = (st.raw || 0) + 1; return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'text/plain', body: RAW }); }
    if (!u.includes('generativelanguage')) return r.abort();
    const model = u.split('/models/')[1].split(':')[0];
    const body = JSON.parse(r.request().postData() || '{}');
    const parts = (body.contents && body.contents[0].parts) || [];
    const imgs = parts.filter(p => p.inlineData).length;
    const ratio = !!(body.generationConfig && body.generationConfig.imageConfig);
    st.calls.push({ model, imgs, ratio, text: (parts[0] && parts[0].text) || (body.instances && body.instances[0].prompt) || '' });
    const json = (o, s = 200) => r.fulfill({ status: s, contentType: 'application/json', body: JSON.stringify(o) });
    const img = { candidates: [{ content: { parts: [{ text: 'Ini gambarnya.' }, { inlineData: { mimeType: 'image/png', data: PNG } }] } }] };
    if (mode === 'normal') {
      if (model === 'gemini-2.5-flash-image-preview') return json({ error: { code: 404, message: 'models/gemini-2.5-flash-image-preview is not found' } }, 404);
      if (model === 'gemini-2.5-flash-image') return ratio ? json({ error: { code: 400, message: 'Unknown field imageConfig' } }, 400) : json(img);
      if (model === 'gemini-3-pro-image-preview') return json(img);
      if (model.startsWith('imagen')) return json({ predictions: [{ bytesBase64Encoded: PNG, mimeType: 'image/png' }] });
    }
    if (mode === 'imagenOnly') {
      if (model.startsWith('imagen')) return json({ predictions: [{ bytesBase64Encoded: PNG, mimeType: 'image/png' }] });
      return json({ error: { code: 403, message: 'Permission denied' } }, 403);
    }
    if (mode === 'none') return json({ error: { code: 404, message: 'not found' } }, 404);
    if (mode === 'blocked') {
      if (model === 'gemini-2.5-flash-image-preview') {
        if (imgs === 0) return json(img);
        return json({ candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [{ text: 'Tidak bisa membuat gambar dari foto orang ini.' }] } }] });
      }
      return json({ error: { code: 404, message: 'not found' } }, 404);
    }
  });
  await page.goto(FILE);
  await page.waitForFunction(() => typeof testModels === 'function' && !!document.getElementById('b1'));
  return { ctx, page, st };
}
const status = (p, id) => p.innerText('#' + id);
const waitIdle = (p, id) => p.waitForFunction(i => !document.getElementById(i).disabled, id, { timeout: 15000 });

(async () => {
  const browser = await chromium.launch();
  // buat foto uji 1600x1200 (lebih besar dari 1024 agar diperkecil)
  const photoPath = __dirname + '/foto-uji.jpg';
  {
    const b2 = await browser.newPage();
    const data = await b2.evaluate(() => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1200; const g = c.getContext('2d'); g.fillStyle = '#c96'; g.fillRect(0, 0, 1600, 1200); return c.toDataURL('image/jpeg', 0.8).split(',')[1]; });
    fs.writeFileSync(photoPath, Buffer.from(data, 'base64')); await b2.close();
  }

  // A) Alur normal
  {
    const { ctx, page, st } = await setup(browser, 'normal');
    ok('Awal: tombol langkah 3 & 4 nonaktif', await page.locator('#b3').isDisabled() && await page.locator('#b4').isDisabled());
    await page.click('#b1'); await waitIdle(page, 'b1');
    const s1 = await status(page, 's1');
    ok('Tes model: model pertama yang berhasil dipakai', /gemini-2\.5-flash-image\b/.test(s1) && /Imagen: imagen-4\.0/.test(s1), s1);
    const log1 = await page.innerText('#log');
    ok('Laporan: model 404 tercatat GAGAL, 400 rasio diulang tanpa rasio', /GAGAL gemini-2\.5-flash-image-preview: 404/.test(log1) && /gemini-2\.5-flash-image: ulang tanpa pengaturan rasio/.test(log1) && /BERHASIL gemini-2\.5-flash-image \(/.test(log1));
    ok('Tes model: gambar kopi tampil', await page.locator('#i1').isVisible());
    await page.setInputFiles('#foto', photoPath); await page.waitForTimeout(500);
    const s2 = await status(page, 's2');
    ok('Foto diperkecil ke maks 1024 piksel', /1024x768/.test(s2), s2);
    ok('Tanpa centang izin: langkah 3 tetap nonaktif + pesan', await page.locator('#b3').isDisabled() && /Centang pernyataan izin/.test(await status(page, 's3')));
    await page.check('#izin'); await page.waitForTimeout(100);
    ok('Setelah centang izin: langkah 3 aktif', !(await page.locator('#b3').isDisabled()));
    await page.fill('#baju', 'kemeja koko putih, sarung kotak hijau');
    st.calls.length = 0;
    await page.click('#b3'); await waitIdle(page, 'b3');
    const c3 = st.calls.filter(c => c.imgs === 1);
    ok('Character Sheet: foto dikirim ke model yang berhasil', c3.length >= 1 && c3.every(c => c.model === 'gemini-2.5-flash-image') && /kemeja koko putih/.test(c3[0].text), JSON.stringify(st.calls.map(c => c.model + '/' + c.imgs + (c.ratio ? '/9:16' : ''))));
    ok('Character Sheet tampil + tombol unduh', await page.locator('#i3').isVisible() && await page.locator('#d3').isVisible() && /Selesai/.test(await status(page, 's3')));
    ok('Langkah 4 aktif setelah Character Sheet', !(await page.locator('#b4').isDisabled()));
    st.calls.length = 0;
    await page.click('#b4'); await waitIdle(page, 'b4');
    const sheetSent = await page.evaluate(() => sheet && sheet.data);
    ok('Gambar scene: Character Sheet (bukan foto asli) yang dikirim', st.calls.some(c => c.imgs === 1) && !!sheetSent && /character reference sheet/.test(st.calls[st.calls.length - 1].text));
    ok('Gambar scene tampil + tombol unduh', await page.locator('#i4').isVisible() && await page.locator('#d4').isVisible());
    const dl = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await page.click('#d4'); const d = await dl;
    ok('Unduh gambar scene', !!d && /sugistudio-scene-1\.png/.test(d.suggestedFilename()), d ? d.suggestedFilename() : 'tidak ada unduhan');
    await page.locator('button', { hasText: 'Salin Laporan' }).click(); await page.waitForTimeout(200);
    const clip = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
    ok('Salin Laporan: berisi hasil model, tanpa data foto', /LAPORAN UJI GAMBAR SUGI STUDIO/.test(clip) && /Character Sheet BERHASIL/.test(clip) && !/\/9j\/|base64/i.test(clip) && clip.length < 5000, clip.length + ' huruf');
    ok('A: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await page.screenshot({ path: __dirname + '/uji-gambar-A.png', fullPage: true });
    await ctx.close();
  }
  // B) Hanya Imagen yang jalan
  {
    const { ctx, page, st } = await setup(browser, 'imagenOnly');
    await page.click('#b1'); await waitIdle(page, 'b1');
    await page.setInputFiles('#foto', photoPath); await page.waitForTimeout(400); await page.check('#izin');
    ok('Hanya Imagen: pesan jelas + langkah 3 tetap nonaktif', /Hanya Imagen yang jalan/.test(await status(page, 's1')) && await page.locator('#b3').isDisabled());
    ok('B: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await ctx.close();
  }
  // C) Tidak ada model sama sekali
  {
    const { ctx, page, st } = await setup(browser, 'none');
    await page.click('#b1'); await waitIdle(page, 'b1');
    ok('Tidak ada model: pesan minta kirim laporan', /Tidak ada model gambar/.test(await status(page, 's1')) && !(await page.locator('#i1').isVisible()));
    ok('C: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await ctx.close();
  }
  // D) Model menolak foto (filter keamanan)
  {
    const { ctx, page, st } = await setup(browser, 'blocked');
    await page.click('#b1'); await waitIdle(page, 'b1');
    await page.setInputFiles('#foto', photoPath); await page.waitForTimeout(400); await page.check('#izin');
    await page.click('#b3'); await waitIdle(page, 'b3');
    const s3 = await status(page, 's3');
    ok('Foto ditolak model: alasan (IMAGE_SAFETY) tampil, langkah 4 tetap nonaktif', /Gagal: Tidak ada gambar \(IMAGE_SAFETY\)/.test(s3) && await page.locator('#b4').isDisabled(), s3);
    ok('D: tanpa error JS', !st.errors.length, st.errors.join(' | '));
    await ctx.close();
  }
  if (FILE.includes('pemanggil')) {
    const { ctx, page, st } = await setup(browser, 'normal');
    ok('Pemanggil: dimuat sekali, judul benar', st.raw === 1 && /Uji Gambar V1/.test(await page.title()), `raw=${st.raw} title=${await page.title()}`);
    await ctx.close();
  }
  await browser.close();
  console.log(out.join('\n'));
})();
