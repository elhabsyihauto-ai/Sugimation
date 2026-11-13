// Dipakai bersama uji-v3.js: POST=cek-versi-gambar.js node uji-v3.js file:///home/user/Sugimation/hiburan.html "'horor',0"
// Membuat gambar 4 kali (tiruan), lalu cek 3 versi tersimpan, tombol ◀ ▶, dan gaya visual di perintah gambar.
let n = 0;
callImageModel = async () => 'data:image/png;base64,VERSI' + (++n);
const items = getImgItems(); const cs = items.find(x => x.group === 'cs'); const lr2 = items.filter(x => x.group === 'lr');
for (let i = 0; i < 4; i++) await makeImage(cs.key);
const after4 = { versi: imgVers[cs.key].length, dipilih: imgSel[cs.key], tampil: imgStore[cs.key].slice(-6) };
pickImgVersion(cs.key, -1); const back = imgStore[cs.key].slice(-6);
pickImgVersion(cs.key, -5); const first = imgStore[cs.key].slice(-6);
pickImgVersion(cs.key, 9); const last = imgStore[cs.key].slice(-6);
const panel = (document.getElementById('img-' + cs.key) || {}).innerHTML || '';
const text = imgTextFor(cs, []);
return { after4, back, first, last, tombol: /pickImgVersion/.test(panel) && /◀/.test(panel) && /▶/.test(panel), gayaVisual: /Visual style/.test(text), lokasi: lr2.map(x => x.key), errs: 0 };
