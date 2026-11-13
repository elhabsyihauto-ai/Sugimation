/* Sugi Studio Satu Pintu - Uji V1 (13 Nov 2026): contoh mesin bersama (cikal bakal sugi-core.js).
   Tujuan: membuktikan di Gemini Canvas bahwa (1) pemanggil bisa mengambil beberapa file dari GitHub,
   (2) tampilan dari CSS tertanam di file JS tampil benar, (3) menu samping berjalan di HP,
   (4) AI teks Gemini tetap bisa dipanggil, (5) penyimpanan lokal bertahan atau tidak setelah Canvas ditutup,
   (6) Firebase: daftar, masuk, simpan, dan buka satu proyek (tanpa SDK, lewat alamat web Firebase langsung),
   (7) "Masuk dengan Google" (memakai SDK Firebase dari gstatic, hanya untuk uji).
   Laporan tidak berisi sandi, token, atau isi foto. Email disamarkan. */
(function () {
  "use strict";

  // ---------- CSS tertanam (gaya Satu Pintu ditulis sendiri, tanpa CDN) ----------
  var CSS = [
    "*{box-sizing:border-box}",
    "body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:linear-gradient(135deg,#FAF3E3,#F3E7CC);color:#3B2A1A;min-height:100vh}",
    ".sp-top{background:#FFFDF8;border-bottom:1px solid #E6D5B8;padding:10px 12px;position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:10px}",
    ".sp-burger{width:44px;height:44px;min-height:44px;margin:0;padding:0;border-radius:12px;background:#FAF3E3;border:1px solid #E6D5B8;font-size:22px;flex-shrink:0}",
    ".sp-logo{font-family:Georgia,serif;font-weight:700;font-size:20px}",
    ".sp-logo .g{color:#9A7425}",
    ".sp-badge{display:inline-block;background:#C9A24D;color:#2A1D11;font-size:10px;font-weight:700;border-radius:4px;padding:1px 5px;margin-left:6px;vertical-align:top}",
    ".sp-sub{font-size:10px;letter-spacing:.2em;font-weight:700;color:#9A7425;text-transform:uppercase}",
    ".sp-side{position:fixed;top:0;left:0;bottom:0;width:260px;max-width:82vw;background:#FFFDF8;border-right:1px solid #E6D5B8;z-index:50;transform:translateX(-105%);transition:transform .2s ease;padding:16px 12px;overflow-y:auto}",
    ".sp-side.buka{transform:translateX(0)}",
    ".sp-tirai{position:fixed;inset:0;background:rgba(59,42,26,.35);z-index:40;display:none}",
    ".sp-tirai.buka{display:block}",
    ".sp-side h3{font-family:Georgia,serif;margin:4px 6px 12px;font-size:18px}",
    ".sp-side .kel{font-size:11px;letter-spacing:.15em;font-weight:700;color:#9A7425;text-transform:uppercase;margin:14px 8px 6px}",
    ".sp-menu{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:transparent;border:0;border-radius:12px;padding:10px 12px;min-height:44px;margin:2px 0;font:inherit;font-weight:600;color:#3B2A1A;cursor:pointer}",
    ".sp-menu.aktif{background:#C9A24D;color:#2A1D11}",
    ".sp-main{max-width:720px;margin:0 auto;padding:16px}",
    "@media (min-width:900px){.sp-side{transform:none}.sp-tirai{display:none!important}.sp-burger{display:none}.sp-main{margin-left:280px}}",
    ".sp-card{background:#FFFDF8;border:1px solid #E6D5B8;border-radius:20px;padding:16px;margin-bottom:16px}",
    ".sp-card h2{font-family:Georgia,serif;font-size:19px;margin:0 0 6px}",
    ".sp-note{font-size:14px;color:#7A6244;margin:0 0 10px}",
    ".sp-btn{font:inherit;font-weight:700;border:none;border-radius:14px;padding:12px 16px;min-height:48px;cursor:pointer;background:#C9A24D;color:#2A1D11;width:100%;margin-top:8px}",
    ".sp-btn.sec{background:#FAF3E3;border:1px solid #E6D5B8}",
    ".sp-btn:disabled{opacity:.5;cursor:not-allowed}",
    ".sp-in{width:100%;font:inherit;font-size:15px;border:2px solid #E6D5B8;border-radius:12px;padding:10px;background:#FFFDF8;color:#3B2A1A;margin-top:4px}",
    ".sp-lbl{display:block;font-weight:700;font-size:14px;margin:10px 0 2px}",
    ".sp-row{display:flex;gap:8px}.sp-row>*{flex:1}",
    ".sp-st{font-size:14px;margin-top:8px;padding:8px 10px;border-radius:10px;background:#FAF3E3}",
    ".sp-ok{background:#EFF4E6;color:#55721B}",
    ".sp-bad{background:#FCECE9;color:#A64632}",
    ".sp-list{margin:0;padding:0;list-style:none}",
    ".sp-list li{font-size:14px;padding:6px 0;border-bottom:1px dashed #E6D5B8}",
    ".sp-tag{display:inline-block;background:#FAF3E3;border:1px solid #E6D5B8;border-radius:999px;padding:4px 10px;font-size:13px;margin:4px 4px 0 0}",
    ".sp-log{white-space:pre-wrap;word-break:break-word;font-size:12px;background:#FAF3E3;border-radius:12px;padding:10px;max-height:300px;overflow:auto;margin:0}",
    ".sp-css-tertanam{border-left:6px solid rgb(201,162,77)}"
  ].join("\n");

  var API_AI = "https://generativelanguage.googleapis.com/v1beta/models/";
  var MODEL_TEKS = "gemini-3-flash-preview";
  var apiKey = "";
  var SDK_VER = "10.12.2";
  var SDK_DASAR = "https://www.gstatic.com/firebasejs/" + SDK_VER + "/";

  var hasil = {};         // ringkasan uji untuk laporan
  var catatan = [];       // log
  var infoMuat = null;    // dari pemanggil
  var sesi = null;        // {uid, idToken, refreshToken, email, cara}
  var halaman = "beranda";

  var SugiInti = window.SugiInti = { seri: [], daftarSeri: function (s) { this.seri.push(s); }, mulai: mulai };

  // ---------- Pembantu ----------
  function $(id) { return document.getElementById(id); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pendek(t) { return String(t || "").replace(/\s+/g, " ").slice(0, 220); }
  function samar(email) { email = String(email || ""); var i = email.indexOf("@"); return i > 0 ? email[0] + "***" + email.slice(i) : "(kosong)"; }
  function log(t) {
    catatan.push("[" + new Date().toLocaleTimeString("id-ID") + "] " + t);
    var el = $("sp-log"); if (el) { el.textContent = catatan.join("\n"); el.scrollTop = el.scrollHeight; }
  }
  function setHasil(kunci, ok, teks) { hasil[kunci] = (ok ? "BERHASIL" : "GAGAL") + " - " + teks; log(kunci + ": " + hasil[kunci]); }
  function status(id, teks, jenis) { var el = $(id); if (!el) return; el.textContent = teks; el.className = "sp-st" + (jenis ? " sp-" + jenis : ""); }
  function simpanLokal(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function ambilLokal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function hapusLokal(k) { try { localStorage.removeItem(k); } catch (e) {} }

  // ---------- Mulai (dipanggil pemanggil) ----------
  function mulai(info) {
    infoMuat = info || { files: [] };
    var st = document.createElement("style"); st.id = "sugi-inti-gaya"; st.textContent = CSS; document.head.appendChild(st);
    document.title = "Sugi Studio Satu Pintu - Uji V1";
    document.body.innerHTML =
      '<div class="sp-tirai" id="sp-tirai"></div>' +
      '<nav class="sp-side" id="sp-side"></nav>' +
      '<div class="sp-top"><button class="sp-burger" id="sp-burger" aria-label="Menu">☰</button>' +
      '<div><div class="sp-logo">SUGI <span class="g">STUDIO</span><span class="sp-badge">AI</span></div><div class="sp-sub">Satu Pintu · Uji V1</div></div></div>' +
      '<main class="sp-main" id="sp-isi"></main>';
    $("sp-burger").onclick = function () { bukaMenu(true); };
    $("sp-tirai").onclick = function () { bukaMenu(false); };
    log("Mesin bersama berjalan. Seri terdaftar: " + SugiInti.seri.map(function (s) { return s.nama; }).join(", "));
    ujiMuatFile();
    ujiPenyimpanan();
    pulihkanSesi();
    gambarMenu();
    buka("beranda");
    setTimeout(ujiTampilan, 50);
  }

  function bukaMenu(b) { $("sp-side").classList.toggle("buka", b); $("sp-tirai").classList.toggle("buka", b); }

  function gambarMenu() {
    var h = '<h3>Menu</h3>' + tombolMenu("beranda", "🏠", "Beranda (hasil uji)") + '<div class="kel">Buat Video</div>';
    SugiInti.seri.forEach(function (s) { h += tombolMenu("seri-" + s.id, s.ikon, s.nama); });
    h += '<div class="kel">Lainnya</div>' + tombolMenu("akun", "👤", "Akun (uji Firebase)") + tombolMenu("laporan", "📋", "Laporan");
    $("sp-side").innerHTML = h;
    Array.prototype.forEach.call(document.querySelectorAll(".sp-menu"), function (b) {
      b.onclick = function () { buka(b.getAttribute("data-hal")); bukaMenu(false); };
    });
  }
  function tombolMenu(id, ikon, nama) { return '<button class="sp-menu' + (halaman === id ? " aktif" : "") + '" data-hal="' + id + '"><span>' + ikon + '</span><span>' + esc(nama) + '</span></button>'; }

  function buka(hal) {
    halaman = hal;
    Array.prototype.forEach.call(document.querySelectorAll(".sp-menu"), function (b) { b.classList.toggle("aktif", b.getAttribute("data-hal") === hal); });
    if (hal !== "beranda" && !hasil["Menu samping"]) setHasil("Menu samping", true, "pindah halaman lewat menu berjalan");
    var isi = $("sp-isi");
    if (hal === "beranda") isi.innerHTML = halBeranda();
    else if (hal === "akun") isi.innerHTML = halAkun();
    else if (hal === "laporan") isi.innerHTML = halLaporan();
    else if (hal.indexOf("seri-") === 0) isi.innerHTML = halSeri(hal.slice(5));
    pasangAksi(hal);
    window.scrollTo(0, 0);
  }

  // ---------- Halaman ----------
  function halBeranda() {
    var f = (infoMuat.files || []).map(function (x) {
      return "<li>" + (x.ok ? "✅ " : "❌ ") + esc(x.file) + " - " + (x.ok ? Math.round(x.bytes / 1024 * 10) / 10 + " KB, " + x.ms + " md" : esc(x.error)) + "</li>";
    }).join("");
    return '' +
      '<div class="sp-card"><h2>Cara pakai</h2><p class="sp-note">Jalankan uji 1 sampai 5 di halaman ini, lalu buka menu <b>Akun</b> untuk uji Firebase. Terakhir buka menu <b>Laporan</b>, tekan <b>Salin Laporan</b>, dan kirim hasilnya ke Claude.</p></div>' +
      '<div class="sp-card sp-css-tertanam" id="sp-cek-css"><h2>1. Mengambil beberapa file</h2><p class="sp-note">Pemanggil mengambil file-file ini dari GitHub:</p><ul class="sp-list">' + f + '</ul></div>' +
      '<div class="sp-card uji-css-terpisah" id="sp-cek-css2"><h2>2. Tampilan</h2><p class="sp-note">Kartu nomor 1 harus punya garis emas di kiri (CSS tertanam). Kartu ini harus punya bingkai hijau (CSS dari file terpisah).</p><div id="sp-s2" class="sp-st">Memeriksa...</div></div>' +
      '<div class="sp-card"><h2>3. Menu samping</h2><p class="sp-note">Tekan tombol ☰ di kiri atas, lalu pilih <b>Hiburan</b> atau <b>Edukasi</b>. Kalau halaman berganti dan menu menutup sendiri, uji ini berhasil.</p></div>' +
      '<div class="sp-card"><h2>4. AI teks</h2><p class="sp-note">Memanggil Gemini (' + MODEL_TEKS + ') dari kode yang dimuat lewat pemanggil.</p><button class="sp-btn" id="sp-b4">🤖 Tes AI teks</button><div id="sp-s4" class="sp-st">Belum dijalankan.</div></div>' +
      '<div class="sp-card"><h2>5. Penyimpanan di HP</h2><p class="sp-note">Mengecek apakah data tetap ada setelah Canvas ditutup. Tutup Canvas, buka lagi, lalu lihat apakah angka "dibuka ke-" bertambah.</p><div id="sp-s5" class="sp-st">' + esc(hasil["Penyimpanan lokal"] || "...") + '</div></div>';
  }

  function halSeri(id) {
    var s = SugiInti.seri.filter(function (x) { return x.id === id; })[0];
    if (!s) return '<div class="sp-card"><h2>Seri tidak ditemukan</h2></div>';
    return '<div class="sp-card"><h2>' + s.ikon + " " + esc(s.nama) + '</h2><p class="sp-note">Halaman ini diisi dari file data <b>data-' + esc(s.id) + '.js</b>. Di Satu Pintu nanti, isinya adalah seluruh tema dan pilihan seri ini.</p>' +
      s.tema.map(function (t) { return '<span class="sp-tag">' + esc(t) + "</span>"; }).join("") + "</div>";
  }

  function halAkun() {
    var cfg = ambilKonfig();
    var h = '<div class="sp-card"><h2>Pengaturan Firebase</h2><p class="sp-note">Tempel <b>firebaseConfig</b> dari Firebase Console (Project settings → Your apps → Config). Cukup sekali; disimpan di HP ini.</p>' +
      '<textarea class="sp-in" id="sp-cfg" rows="5" placeholder="const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ... };">' + esc(cfg ? cfg.teks : "") + '</textarea>' +
      '<button class="sp-btn sec" id="sp-bcfg">💾 Simpan pengaturan</button><div id="sp-scfg" class="sp-st">' + (cfg ? "Proyek Firebase: " + esc(cfg.projectId) : "Belum ada pengaturan.") + '</div></div>';
    h += '<div class="sp-card"><h2>Status</h2><div id="sp-sesi" class="sp-st">' + teksSesi() + '</div><button class="sp-btn sec" id="sp-bout">🚪 Keluar</button></div>';
    h += '<div class="sp-card"><h2>A. Email dan sandi</h2><p class="sp-note">Pakai email sungguhan atau email uji (misalnya uji1@contoh.com). Sandi minimal 6 huruf.</p>' +
      '<label class="sp-lbl">Email</label><input class="sp-in" id="sp-email" type="email" autocomplete="username">' +
      '<label class="sp-lbl">Sandi</label><input class="sp-in" id="sp-pass" type="password" autocomplete="current-password">' +
      '<div class="sp-row"><button class="sp-btn" id="sp-bdaftar">📝 Daftar</button><button class="sp-btn" id="sp-bmasuk">🔑 Masuk</button></div><div id="sp-sa" class="sp-st">Belum dijalankan.</div></div>';
    h += '<div class="sp-card"><h2>B. Masuk dengan Google</h2><p class="sp-note">Membuka jendela kecil Google. Di Canvas, jendela ini mungkin diblokir; itulah yang ingin kita ketahui.</p><button class="sp-btn" id="sp-bgoogle">🟢 Masuk dengan Google</button><div id="sp-sb" class="sp-st">Belum dijalankan.</div></div>';
    h += '<div class="sp-card"><h2>C. Proyek Saya (uji)</h2><p class="sp-note">Setelah masuk, simpan satu proyek uji ke Firestore, lalu buka lagi. Coba juga buka dari HP lain dengan akun yang sama.</p>' +
      '<label class="sp-lbl">Isi proyek uji</label><input class="sp-in" id="sp-proyek" type="text" value="Proyek uji Satu Pintu">' +
      '<div class="sp-row"><button class="sp-btn" id="sp-bsimpan">☁️ Simpan</button><button class="sp-btn" id="sp-bbuka">📂 Buka</button></div><div id="sp-sc" class="sp-st">Belum dijalankan.</div></div>';
    return h;
  }

  function halLaporan() {
    return '<div class="sp-card"><h2>Laporan</h2><p class="sp-note">Tekan Salin Laporan lalu tempel ke Claude. Laporan tidak berisi sandi atau token.</p><button class="sp-btn" id="sp-bsalin">📋 Salin Laporan</button><pre class="sp-log" id="sp-lap" style="margin-top:10px">' + esc(buatLaporan()) + '</pre></div>' +
      '<div class="sp-card"><h2>Catatan lengkap</h2><pre class="sp-log" id="sp-log">' + esc(catatan.join("\n")) + "</pre></div>";
  }

  function pasangAksi(hal) {
    if (hal === "beranda") { $("sp-b4").onclick = ujiAI; ujiTampilan(); }
    if (hal === "akun") {
      $("sp-bcfg").onclick = simpanKonfig;
      $("sp-bdaftar").onclick = function () { masukEmail("signUp"); };
      $("sp-bmasuk").onclick = function () { masukEmail("signInWithPassword"); };
      $("sp-bgoogle").onclick = masukGoogle;
      $("sp-bsimpan").onclick = simpanProyek;
      $("sp-bbuka").onclick = bukaProyek;
      $("sp-bout").onclick = keluar;
    }
    if (hal === "laporan") $("sp-bsalin").onclick = salinLaporan;
  }

  // ---------- Uji 1, 2, 5 (otomatis) ----------
  function ujiMuatFile() {
    var f = infoMuat.files || [];
    var gagal = f.filter(function (x) { return !x.ok; });
    setHasil("Ambil beberapa file", gagal.length === 0 && f.length > 0, f.length + " file, " + gagal.length + " gagal" + (gagal.length ? " (" + gagal.map(function (x) { return x.file + ": " + x.error; }).join("; ") + ")" : "") + ", total " + (infoMuat.totalMs || "?") + " md");
    var seriOk = SugiInti.seri.length;
    setHasil("File data seri", seriOk >= 2, seriOk + " seri terdaftar (" + SugiInti.seri.map(function (s) { return s.nama; }).join(", ") + ")");
  }

  function ujiTampilan() {
    var a = $("sp-cek-css"), b = $("sp-cek-css2");
    if (!a || !b) return;
    var okA = getComputedStyle(a).borderLeftWidth === "6px";
    var okB = /85,\s*114,\s*27/.test(getComputedStyle(b).outlineColor) && getComputedStyle(b).outlineStyle === "solid";
    if (!hasil["CSS tertanam"]) setHasil("CSS tertanam", okA, okA ? "gaya dari mesin bersama terpasang" : "gaya tidak terpasang");
    if (!hasil["CSS file terpisah"]) setHasil("CSS file terpisah", okB, okB ? "gaya dari gaya.css terpasang" : "gaya.css tidak terpasang");
    status("sp-s2", (okA ? "✅" : "❌") + " CSS tertanam · " + (okB ? "✅" : "❌") + " CSS file terpisah", okA && okB ? "ok" : "bad");
  }

  function ujiPenyimpanan() {
    var n = parseInt(ambilLokal("sugiUjiDibuka") || "0", 10) + 1;
    var sebelum = ambilLokal("sugiUjiTerakhir");
    var bisa = simpanLokal("sugiUjiDibuka", String(n)) && ambilLokal("sugiUjiDibuka") === String(n);
    simpanLokal("sugiUjiTerakhir", new Date().toLocaleString("id-ID"));
    setHasil("Penyimpanan lokal", bisa, bisa ? "dibuka ke-" + n + (sebelum ? " (sebelumnya " + sebelum + ")" : " (pertama kali)") : "localStorage tidak bisa dipakai");
    try {
      var r = indexedDB.open("sugiUji", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("isi"); };
      r.onsuccess = function () {
        try {
          var tx = r.result.transaction("isi", "readwrite");
          tx.objectStore("isi").put(n, "dibuka");
          tx.oncomplete = function () { setHasil("IndexedDB", true, "bisa menyimpan"); };
          tx.onerror = function () { setHasil("IndexedDB", false, "gagal menyimpan"); };
        } catch (e) { setHasil("IndexedDB", false, pendek(e.message)); }
      };
      r.onerror = function () { setHasil("IndexedDB", false, pendek(r.error && r.error.message)); };
    } catch (e) { setHasil("IndexedDB", false, pendek(e.message)); }
  }

  // ---------- Uji 4: AI teks ----------
  async function fetchGemini(prompt) {
    var res = await fetch(API_AI + MODEL_TEKS + ":generateContent?key=" + apiKey, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    var body = await res.text();
    if (!res.ok) throw new Error(res.status + " " + pendek(body));
    var d = JSON.parse(body);
    var c = d.candidates && d.candidates[0];
    return ((c && c.content && c.content.parts) || []).map(function (p) { return p.text || ""; }).join("").trim();
  }
  async function ujiAI() {
    var b = $("sp-b4"); b.disabled = true; status("sp-s4", "Menghubungi Gemini...");
    var t0 = Date.now();
    try {
      var jaw = await fetchGemini("Balas hanya dengan satu kalimat pendek berbahasa Indonesia: sapa pengguna Sugi Studio.");
      setHasil("AI teks", !!jaw, (Date.now() - t0) + " md, jawaban: " + pendek(jaw).slice(0, 80));
      status("sp-s4", "✅ " + jaw, "ok");
    } catch (e) {
      setHasil("AI teks", false, pendek(e.message));
      status("sp-s4", "❌ " + pendek(e.message), "bad");
    }
    b.disabled = false;
  }

  // ---------- Firebase: pengaturan ----------
  function ambilKonfig() {
    var teks = ambilLokal("sugiUjiFirebase") || SugiInti._cfgTeks || "";
    return teks ? uraiKonfig(teks) : null;
  }
  function uraiKonfig(teks) {
    function ambil(k) { var m = teks.match(new RegExp('["\']?' + k + '["\']?\\s*:\\s*["\']([^"\']+)["\']')); return m ? m[1] : ""; }
    var c = { teks: teks, apiKey: ambil("apiKey"), authDomain: ambil("authDomain"), projectId: ambil("projectId"), appId: ambil("appId") };
    return c.apiKey && c.projectId ? c : null;
  }
  function simpanKonfig() {
    var teks = $("sp-cfg").value.trim();
    var c = uraiKonfig(teks);
    if (!c) { status("sp-scfg", "❌ apiKey atau projectId tidak ditemukan. Salin seluruh isi firebaseConfig.", "bad"); return; }
    SugiInti._cfgTeks = teks;
    var lokal = simpanLokal("sugiUjiFirebase", teks);
    status("sp-scfg", "✅ Proyek Firebase: " + c.projectId + (lokal ? "" : " (hanya sampai Canvas ditutup)"), "ok");
    log("Pengaturan Firebase disimpan: proyek " + c.projectId + ", authDomain " + (c.authDomain || "-"));
  }
  function wajibKonfig(idStatus) {
    var c = ambilKonfig();
    if (!c) status(idStatus, "❌ Isi dulu Pengaturan Firebase di atas.", "bad");
    return c;
  }

  // ---------- Firebase: masuk ----------
  var PESAN = {
    EMAIL_EXISTS: "Email ini sudah terdaftar. Tekan Masuk.",
    INVALID_LOGIN_CREDENTIALS: "Email atau sandi salah.",
    INVALID_PASSWORD: "Sandi salah.",
    EMAIL_NOT_FOUND: "Email belum terdaftar. Tekan Daftar.",
    INVALID_EMAIL: "Format email salah.",
    OPERATION_NOT_ALLOWED: "Cara masuk Email/Sandi belum diaktifkan di Firebase Console.",
    CONFIGURATION_NOT_FOUND: "Authentication belum diaktifkan di Firebase Console.",
    TOO_MANY_ATTEMPTS_TRY_LATER: "Terlalu banyak percobaan. Tunggu sebentar."
  };
  function artiError(pesan) {
    var kode = String(pesan || "").split(" ")[0].split(":")[0];
    if (/^WEAK_PASSWORD/.test(kode)) return "Sandi terlalu pendek (minimal 6).";
    if (/^API_KEY|API key not valid/.test(pesan)) return "apiKey salah. Periksa Pengaturan Firebase.";
    return PESAN[kode] || pesan;
  }

  async function masukEmail(cara) {
    var c = wajibKonfig("sp-sa"); if (!c) return;
    var email = $("sp-email").value.trim(), pass = $("sp-pass").value;
    if (!email || !pass) { status("sp-sa", "❌ Isi email dan sandi.", "bad"); return; }
    var nama = cara === "signUp" ? "Daftar" : "Masuk email";
    status("sp-sa", "Menghubungi Firebase...");
    try {
      var res = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:" + cara + "?key=" + c.apiKey, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pass, returnSecureToken: true })
      });
      var d = await res.json();
      if (!res.ok) throw new Error((d.error && d.error.message) || ("Kode " + res.status));
      aturSesi({ uid: d.localId, idToken: d.idToken, refreshToken: d.refreshToken, email: d.email, cara: "email" });
      setHasil(nama, true, "akun " + samar(d.email));
      status("sp-sa", "✅ " + (cara === "signUp" ? "Akun dibuat dan sudah masuk." : "Berhasil masuk."), "ok");
    } catch (e) {
      var arti = artiError(e.message);
      setHasil(nama, false, pendek(e.message) + (arti !== e.message ? " (" + arti + ")" : ""));
      status("sp-sa", "❌ " + arti, "bad");
    }
  }

  function aturSesi(s) {
    sesi = s;
    if (s && s.cara === "email") simpanLokal("sugiUjiSesi", JSON.stringify({ refreshToken: s.refreshToken, email: s.email }));
    var el = $("sp-sesi"); if (el) { el.textContent = teksSesi(); el.className = "sp-st" + (sesi ? " sp-ok" : ""); }
  }
  function teksSesi() { return sesi ? "Sudah masuk: " + sesi.email + " (" + (sesi.cara === "google" ? "Google" : "email") + ")" : "Belum masuk."; }

  // Tetap masuk setelah Canvas dibuka lagi (memakai token penyegar di localStorage)
  async function pulihkanSesi() {
    var simpan = ambilLokal("sugiUjiSesi"), c = ambilKonfig();
    if (!simpan || !c) return;
    try {
      var s = JSON.parse(simpan);
      var res = await fetch("https://securetoken.googleapis.com/v1/token?key=" + c.apiKey, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(s.refreshToken)
      });
      var d = await res.json();
      if (!res.ok) throw new Error((d.error && d.error.message) || res.status);
      aturSesi({ uid: d.user_id, idToken: d.id_token, refreshToken: d.refresh_token, email: s.email, cara: "email" });
      setHasil("Tetap masuk setelah dibuka lagi", true, "akun " + samar(s.email));
    } catch (e) {
      setHasil("Tetap masuk setelah dibuka lagi", false, pendek(e.message));
    }
  }

  function keluar() {
    hapusLokal("sugiUjiSesi");
    try { if (window.firebase && firebase.apps && firebase.apps.length) firebase.auth().signOut(); } catch (e) {}
    aturSesi(null);
    log("Keluar dari akun.");
  }

  // ---------- Firebase: Google (SDK dari gstatic, hanya untuk uji) ----------
  function muatScript(url) {
    return new Promise(function (ok, gagal) {
      var s = document.createElement("script"); s.src = url;
      s.onload = ok; s.onerror = function () { gagal(new Error("Gagal memuat " + url)); };
      document.head.appendChild(s);
    });
  }
  async function masukGoogle() {
    var c = wajibKonfig("sp-sb"); if (!c) return;
    var b = $("sp-bgoogle"); b.disabled = true;
    status("sp-sb", "Memuat Firebase SDK...");
    log("Domain halaman ini: " + location.hostname);
    try {
      if (!window.firebase) { await muatScript(SDK_DASAR + "firebase-app-compat.js"); await muatScript(SDK_DASAR + "firebase-auth-compat.js"); }
      setHasil("Muat Firebase SDK", true, "versi " + SDK_VER);
    } catch (e) {
      setHasil("Muat Firebase SDK", false, pendek(e.message));
      status("sp-sb", "❌ SDK Firebase tidak bisa dimuat di sini.", "bad"); b.disabled = false; return;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp({ apiKey: c.apiKey, authDomain: c.authDomain || (c.projectId + ".firebaseapp.com"), projectId: c.projectId, appId: c.appId || undefined });
      status("sp-sb", "Membuka jendela Google...");
      var r = await firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
      var u = r.user, tok = await u.getIdToken();
      aturSesi({ uid: u.uid, idToken: tok, email: u.email, cara: "google" });
      setHasil("Masuk dengan Google", true, "akun " + samar(u.email));
      status("sp-sb", "✅ Berhasil masuk dengan Google.", "ok");
    } catch (e) {
      var kode = e.code || "";
      var arti = {
        "auth/popup-blocked": "Jendela Google diblokir oleh Canvas atau browser.",
        "auth/operation-not-supported-in-this-environment": "Canvas tidak mengizinkan cara masuk ini.",
        "auth/unauthorized-domain": "Domain Canvas belum diizinkan. Tambahkan " + location.hostname + " di Firebase Console → Authentication → Settings → Authorized domains.",
        "auth/operation-not-allowed": "Cara masuk Google belum diaktifkan di Firebase Console.",
        "auth/popup-closed-by-user": "Jendela Google ditutup sebelum selesai.",
        "auth/web-storage-unsupported": "Canvas memblokir penyimpanan yang dibutuhkan Google."
      }[kode] || pendek(e.message);
      setHasil("Masuk dengan Google", false, kode + " " + pendek(e.message) + " | domain: " + location.hostname);
      status("sp-sb", "❌ " + arti, "bad");
    }
    b.disabled = false;
  }

  // ---------- Firebase: Firestore lewat alamat web (tanpa SDK) ----------
  function alamatProyek(c) {
    return "https://firestore.googleapis.com/v1/projects/" + encodeURIComponent(c.projectId) + "/databases/(default)/documents/pengguna/" + encodeURIComponent(sesi.uid) + "/proyek/uji-1";
  }
  function artiFirestore(kode, pesan) {
    if (kode === 403 || /PERMISSION_DENIED/.test(pesan)) return "Ditolak. Periksa Rules Firestore (lihat petunjuk dari Claude).";
    if (kode === 404 && /database/i.test(pesan)) return "Database Firestore belum dibuat di Firebase Console.";
    if (kode === 404) return "Belum ada proyek tersimpan. Tekan Simpan dulu.";
    if (kode === 401) return "Sesi habis. Tekan Masuk lagi.";
    return pesan;
  }
  async function simpanProyek() {
    var c = wajibKonfig("sp-sc"); if (!c) return;
    if (!sesi) { status("sp-sc", "❌ Masuk dulu (bagian A atau B).", "bad"); return; }
    status("sp-sc", "Menyimpan ke Firestore...");
    var isi = $("sp-proyek").value || "Proyek uji";
    try {
      var res = await fetch(alamatProyek(c), {
        method: "PATCH", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + sesi.idToken },
        body: JSON.stringify({ fields: { judul: { stringValue: isi }, seri: { stringValue: "hiburan" }, waktu: { timestampValue: new Date().toISOString() }, perangkat: { stringValue: navigator.userAgent.slice(0, 120) } } })
      });
      var t = await res.text();
      if (!res.ok) throw { kode: res.status, pesan: pendek(t) };
      setHasil("Simpan proyek (Firestore)", true, "tersimpan");
      status("sp-sc", "✅ Tersimpan di akun " + sesi.email + ".", "ok");
    } catch (e) {
      var m = e.pesan || pendek(e.message);
      setHasil("Simpan proyek (Firestore)", false, (e.kode || "") + " " + m);
      status("sp-sc", "❌ " + artiFirestore(e.kode, m), "bad");
    }
  }
  async function bukaProyek() {
    var c = wajibKonfig("sp-sc"); if (!c) return;
    if (!sesi) { status("sp-sc", "❌ Masuk dulu (bagian A atau B).", "bad"); return; }
    status("sp-sc", "Membuka dari Firestore...");
    try {
      var res = await fetch(alamatProyek(c), { headers: { "Authorization": "Bearer " + sesi.idToken } });
      var t = await res.text();
      if (!res.ok) throw { kode: res.status, pesan: pendek(t) };
      var d = JSON.parse(t).fields || {};
      var judul = d.judul && d.judul.stringValue, waktu = d.waktu && d.waktu.timestampValue;
      var dariSini = d.perangkat && d.perangkat.stringValue === navigator.userAgent.slice(0, 120);
      setHasil("Buka proyek (Firestore)", true, "disimpan " + waktu + (dariSini ? " dari perangkat yang sama" : " dari PERANGKAT LAIN"));
      status("sp-sc", "✅ \"" + judul + "\" (disimpan " + new Date(waktu).toLocaleString("id-ID") + ")", "ok");
    } catch (e) {
      var m = e.pesan || pendek(e.message);
      setHasil("Buka proyek (Firestore)", false, (e.kode || "") + " " + m);
      status("sp-sc", "❌ " + artiFirestore(e.kode, m), "bad");
    }
  }

  // ---------- Laporan ----------
  function buatLaporan() {
    var baris = ["LAPORAN UJI SATU PINTU V1", "Waktu: " + new Date().toLocaleString("id-ID"), "Domain: " + location.hostname, "Perangkat: " + navigator.userAgent, ""];
    Object.keys(hasil).forEach(function (k) { baris.push("- " + k + ": " + hasil[k]); });
    var belum = ["Menu samping", "AI teks", "Daftar", "Masuk email", "Masuk dengan Google", "Simpan proyek (Firestore)", "Buka proyek (Firestore)"].filter(function (k) { return !hasil[k]; });
    if (belum.length) baris.push("", "Belum diuji: " + belum.join(", "));
    var c = ambilKonfig(); baris.push("", "Proyek Firebase: " + (c ? c.projectId : "(belum diisi)"));
    return baris.join("\n");
  }
  function salinLaporan() {
    var b = $("sp-bsalin"), teks = buatLaporan() + "\n\nCATATAN\n" + catatan.join("\n");
    var t = document.createElement("textarea"); t.value = teks; document.body.appendChild(t); t.select();
    var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(t);
    if (!ok && navigator.clipboard) navigator.clipboard.writeText(teks).then(function () { b.textContent = "✅ Tersalin"; }, function () {});
    b.textContent = ok ? "✅ Tersalin" : "❌ Gagal, salin manual dari kotak di bawah";
    setTimeout(function () { b.textContent = "📋 Salin Laporan"; }, 2500);
  }
})();
