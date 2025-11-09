// /assets/js/yargilamagideri.js
(() => {
  'use strict';

  const MOUNT_SELECTOR = '#yg-ustsol';
  const LEFT_TITLE = 'Tebligatlar (Posta)';
  const RIGHT_TITLE = 'Elektronik Tebligatlar';
  const INITIAL_VISIBLE = 5;
  const REVEAL_STEP = 10;

  const JSON_URL_PRIMARY = '/api/tebligatlar.php';
  const JSON_URL_FALLBACK = '/data/tebligatlar.json';

  let FEE = null; // ücret tablosu JSON

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls = '', html = '') => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    return n;
  };

  function showToast(type, title, body) {
    if (typeof window.toast === 'function') {
      window.toast({ type, title, body });
    } else {
      console.log(`[${type}] ${title}: ${body}`);
    }
  }

  const parseNum = (v) => {
    if (typeof v !== 'string') v = String(v ?? '0');
    v = v.replace(/\./g, '').replace(',', '.');
    const f = parseFloat(v);
    return Number.isFinite(f) ? f : 0;
  };

  const fmtTL = (n) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2
    }).format(+n || 0);

  // ---- sayısal input kısıtları (diğer giderler)
  const OTHER_INPUT_IDS = [
    'postagideri',
    'ilangideri',
    'yasagideri',
    'atkgideri',
    'kesifgideri',
    'uzlasmagideri',
    'bilirkisigideri'
  ];
  function bindNumericInputs() {
    OTHER_INPUT_IDS.forEach((id) => {
      const inp = document.getElementById(id);
      if (!inp) return;
      inp.setAttribute('inputmode', 'decimal');
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/[^\d.,]/g, '');
      });
      inp.addEventListener('blur', () => {
        const n = parseNum(inp.value);
        if (!isFinite(n) || isNaN(n)) inp.value = '0';
      });
    });
  }

  async function loadFees() {
    const v = `?v=${Date.now()}`;
    try {
      const r = await fetch(JSON_URL_PRIMARY + v, { cache: 'no-store' });
      if (!r.ok) throw 0;
      return await r.json();
    } catch {
      const r2 = await fetch(JSON_URL_FALLBACK + v, { cache: 'no-store' });
      if (!r2.ok) {throw new Error('Ücret JSON okunamadı (API ve dosya erişilemedi)');}
      return await r2.json();
    }
  }

  const toTRDate = (iso) => {
    if (!iso) return 'halen';
    const d = new Date(iso + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  function toLabel(from, to, currency, defaultCurrency) {
    const isYTL = (currency || defaultCurrency || 'TRY') !== 'TRY';
    const cur = isYTL ? currency || 'YTL' : '';
    const right = cur ? ` ${cur}` : '';
    return `${toTRDate(from)} - ${toTRDate(to)}${right}`;
  }

  function attachScrollReveal(listEl, total, initial = INITIAL_VISIBLE, step = REVEAL_STEP) {
    listEl.dataset.visible = String(initial);
    for (let i = 0; i < total; i++) {
      const row = listEl.querySelector(`.field-row[data-index="${i}"]`);
      if (row) row.style.display = i < initial ? 'flex' : 'none';
    }
    listEl.addEventListener('scroll', () => {
      const bottom =
        listEl.scrollTop + listEl.clientHeight >= listEl.scrollHeight - 12;
      if (!bottom) return;
      const vis = parseInt(listEl.dataset.visible || '0', 10);
      if (vis >= total) return;
      const next = Math.min(vis + step, total);
      for (let i = vis; i < next; i++) {
        const row = listEl.querySelector(`.field-row[data-index="${i}"]`);
        if (row) row.style.display = 'flex';
      }
      listEl.dataset.visible = String(next);
    });
  }

  function makeFieldRow({ idVisible, idHidden, label, amount, index }) {
    const wrap = el('div', 'field-row');
    wrap.dataset.index = String(index);
    const lab = el('label', '', label);
    lab.htmlFor = idVisible;

    const inp = el('input', 'input input-center');
    inp.type = 'number';
    inp.id = idVisible;
    inp.placeholder = '0';
    inp.min = '0';
    inp.step = '1';
    inp.value = '0';
    inp.inputMode = 'numeric';

    const hid = el('input');
    hid.type = 'hidden';
    hid.id = idHidden;
    hid.value = amount ?? 0;
    wrap.append(lab, inp, hid);
    return wrap;
  }

  function buildColumn(container, items, idPrefixVisible, idPrefixHidden, title, defaultCurrency) {
    const col = el('div', 'ustsol-col');
    col.append(el('h3', '', title));

    const list = el('div', 'field-list');
    items.forEach((row, i) => {
      const idV = `${idPrefixVisible}${i + 1}`;
      const idH = `${idPrefixHidden}${i + 1}`;
      const rowEl = makeFieldRow({
        idVisible: idV,
        idHidden: idH,
        label: toLabel(row.from, row.to, row.currency, defaultCurrency),
        amount: row.amount ?? 0,
        index: i
      });
      list.append(rowEl);
    });

    attachScrollReveal(list, items.length);

    if (items.length > INITIAL_VISIBLE) {
      const more = el('div', 'more-wrap');
      const btn = el('button', 'btn-more', 'Daha Fazla');
      btn.addEventListener('click', () => {
        const vis = parseInt(list.dataset.visible || '0', 10);
        if (vis < items.length) {
          for (let i = vis; i < items.length; i++) {
            list.querySelector(`.field-row[data-index="${i}"]`)?.style &&
              (list.querySelector(`.field-row[data-index="${i}"]`).style.display =
                'flex');
          }
          list.dataset.visible = String(items.length);
          btn.textContent = 'Daha Az';
        } else {
          for (let i = 0; i < items.length; i++) {
            const row = list.querySelector(`.field-row[data-index="${i}"]`);
            if (row) row.style.display = i < INITIAL_VISIBLE ? 'flex' : 'none';
          }
          list.dataset.visible = String(INITIAL_VISIBLE);
          btn.textContent = 'Daha Fazla';
          list.scrollTop = 0;
        }
      });
      more.append(btn);
      col.append(list, more);
    } else {
      col.append(list);
    }

    container.append(col);
  }

  function buildUstSolTwoCols() {
    const mount = $(MOUNT_SELECTOR);
    if (!mount) return;
    mount.innerHTML = '';

    const grid = el('div', '');
    grid.id = 'ustsolGrid';
    mount.append(grid);

    const posta = Array.isArray(FEE?.tables?.posta) ? FEE.tables.posta : [];
    const eteb = Array.isArray(FEE?.tables?.etebligat) ? FEE.tables.etebligat : [];

    buildColumn(grid, posta, 'gteb', 'uteb', LEFT_TITLE, FEE?.currency);
    grid.append(el('div', 'divider'));
    buildColumn(grid, eteb, 'geteb', 'ueteb', RIGHT_TITLE, FEE?.currency);
  }

  // ========== HESAPLAMA ==========
  function calculate() {
    const asSeparate = !!document.getElementById('tebligatlarbir')?.checked;

    let tebligatCount = 0,
      tebligatSum = 0;
    let etebCount = 0,
      etebSum = 0;

    // POSTA
    for (let i = 1; ; i++) {
      const v = document.getElementById(`gteb${i}`);
      const u = document.getElementById(`uteb${i}`);
      if (!v || !u) break;
      const count = parseNum(v.value);
      const unit = parseNum(u.value);
      tebligatCount += count;
      tebligatSum += count * unit;
    }

    // E-TEBLIGAT
    for (let i = 1; ; i++) {
      const v = document.getElementById(`geteb${i}`);
      const u = document.getElementById(`ueteb${i}`);
      if (!v || !u) break;
      const count = parseNum(v.value);
      const unit = parseNum(u.value);
      etebCount += count;
      etebSum += count * unit;
    }

    const lines = [];
    let total = 0;

    if (asSeparate) {
      if (tebligatSum > 0) {
        lines.push(`${tebligatCount} adet Tebligat Gideri : ${fmtTL(tebligatSum)}`);
        total += tebligatSum;
      }
      if (etebSum > 0) {
        lines.push(`${etebCount} adet E-Tebligat Gideri : ${fmtTL(etebSum)}`);
        total += etebSum;
      }
    } else {
      const mergedCount = tebligatCount + etebCount;
      const mergedSum = tebligatSum + etebSum;
      if (mergedSum > 0) {
        lines.push(`${mergedCount} adet Tebliğ Gideri : ${fmtTL(mergedSum)}`);
        total += mergedSum;
      }
    }

    // Diğer giderler
    const addLine = (id, label) => {
      const elx = document.getElementById(id);
      if (!elx) return;
      const v = parseNum(elx.value);
      if (v > 0) {
        lines.push(`${label} : ${fmtTL(v)}`);
        total += v;
      }
    };
    addLine('postagideri', 'Posta Gideri');
    addLine('ilangideri', 'İlan Gideri');
    addLine('yasagideri', 'Yasa Yolu Gidiş Dönüş Gideri');
    addLine('atkgideri', 'ATK Gideri');
    addLine('kesifgideri', 'Keşif Gideri');
    addLine('uzlasmagideri', 'Uzlaşma Gideri');
    addLine('bilirkisigideri', 'Bilirkişi Gideri');

    lines.push('--------------------------');
    lines.push(`TOPLAM : ${fmtTL(total)} TL`);

    // === ÇIKTIYI YAZ ===
    const out = document.getElementById('yargilamadokum');
    if (out) out.textContent = lines.join('\n');

    // KPI’ları güncelle
    const setText = (id, val) => {
      const n = document.getElementById(id);
      if (n) n.textContent = val;
    };
    setText('kpiTeb', fmtTL(tebligatSum));
    setText('kpiETeb', fmtTL(etebSum));
    setText('kpiGenel', fmtTL(total));

    // İlk uyarı
    const oc = document.getElementById('opencount');
    if (!asSeparate && oc && oc.value === '0') {
      const ph = document.getElementById('liveAlertPlaceholder');
      if (ph) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
          <div class="alert alert-info alert-dismissible" role="alert">
            <div>Tebligatlar ve Elektronik Tebligatlar birlikte sayılmıştır, ayrı ayrı göstermek için yukarıdaki anahtarı “Evet” yapınız.</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>`;
        ph.append(wrapper);
      }
      oc.value = '1';
    }

    showToast('success', 'Hesaplama Tamamlandı', 'Yargılama gideri başarıyla hesaplandı.');
    loadCounterWithJQ();
  }

  function clearAll() {
    document.querySelectorAll('.field-list input[type=number]').forEach((i) => (i.value = '0'));
    OTHER_INPUT_IDS.forEach((id) => {
      const n = document.getElementById(id);
      if (n) n.value = '0';
    });
    $('#yargilamadokum').textContent = '';
    $('#kpiTeb').textContent = $('#kpiETeb').textContent = '—';
    $('#kpiGenel').textContent = '—';
    const oc = $('#opencount');
    if (oc) oc.value = '0';
    showToast('info', 'Alanlar temizlendi.', 'Tüm değerler sıfırlandı');
  }

  function bindCopy() {
    const btn = $('#btnCopyDokum');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const text = $('#yargilamadokum')?.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
        } catch {}
        document.body.removeChild(ta);
      }
      showToast('success', 'Panoya Kopyalandı', 'Döküm metni panoya aktarıldı.');
      btn.classList.add('is-ok');
      setTimeout(() => btn.classList.remove('is-ok'), 900);
    });
  }

  // === Sayaç (opsiyonel) ===
  function formatCountSmart(n) {
    n = Math.floor(Number(n) || 0);
    if (n < 100000) return n.toLocaleString('tr-TR');
    if (n < 1000000) return (n / 1e3).toFixed(2) + 'B';
    if (n < 1000000000) return (n / 1e6).toFixed(2) + 'M';
    return (n / 1e9).toFixed(2) + 'G';
  }

  function loadCounterWithJQ() {
    jQuery
      .getJSON('https://sayac.657.com.tr/arttirceza', function(response) {
        const adet = (response?.adet || 0) * 1;
        const sayfasayac = formatCountSmart(adet);
        const text = `15/05/2025 tarihinden bugüne kadar ${sayfasayac} yargılama gideri hesapladık.`;
        const p = document.querySelector('#sayac');
        const card = document.querySelector('#sayacAltCard');
        if (p && card) {
          p.textContent = text;
          card.style.display = 'block';
        }
      })
      .fail(function() {
        const card = document.querySelector('#sayacAltCard');
        if (card) card.style.display = 'none';
      });
  }

  // ========== LABEL → INPUT ARALIĞI HARİTASI ==========
  function Dtr(ddmmyyyy) {
    // "dd/mm/yyyy" -> Date (00:00)
    const m = String(ddmmyyyy || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1], 0, 0, 0, 0);
  }
  function toMidnight(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function buildRanges(prefix) {
    // "gteb" veya "geteb"
    const out = [];
    document.querySelectorAll(`label[for^="${prefix}"]`).forEach((lbl) => {
      const id = lbl.getAttribute('for');
      const txt = (lbl.textContent || '').trim();
      // "dd/mm/yyyy - dd/mm/yyyy" ya da "dd/mm/yyyy - halen"
      const ds = txt.match(/(\d{2}\/\d{2}\/\d{4}).*?-\s*(halen|\d{2}\/\d{2}\/\d{4})/i);
      if (!ds) return;
      const start = Dtr(ds[1]);
      const end = /halen/i.test(ds[2]) ? null : Dtr(ds[2]);
      if (start) out.push({ id, start, end }); // end=null => sınırsız üst
    });
    // daha güvenli: start DESC
    out.sort((a, b) => b.start - a.start);
    return out;
  }
  function bucketIdByDate(date, ranges) {
    if (!(date instanceof Date)) return null;
    const d0 = toMidnight(date);
    for (const r of ranges) {
      const s = toMidnight(r.start);
      const e = r.end ? toMidnight(r.end) : null;
      const inRange = e ? d0 >= s && d0 <= e : d0 >= s;
      if (inRange) return r.id;
    }
    return null;
  }
  function incById(id, delta) {
    const elx = document.getElementById(id);
    if (!elx) return;
    const cur = parseFloat(String(elx.value || '0').replace(',', '.')) || 0;
    elx.value = String(cur + (delta || 0));
    elx.dispatchEvent(new Event('input', { bubbles: true }));
    elx.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ========== TÜRKÇE NORMALİZASYON + KANAL ALGILAMA ==========
  function normTR(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // aksanları sök
      .replace(/İ/g,'i').replace(/İ/g,'i')            // i + dot komb.
      .replace(/ı/g,'i').replace(/Ş/g,'s').replace(/ş/g,'s')
      .replace(/Ğ/g,'g').replace(/ğ/g,'g').replace(/Ö/g,'o').replace(/ö/g,'o')
      .replace(/Ü/g,'u').replace(/ü/g,'u').replace(/Ç/g,'c').replace(/ç/g,'c')
      .toLowerCase()
      .replace(/\s+/g,' ')
      .trim();
  }
  function isElekt(raw){
    const t = normTR(raw);
    // elektronik, e tebligat, e-tebligat, e tebl., eteb vb. varyantları
    return /\b(elektronik(?:\s+tebligat)?)\b/.test(t)
        || /\be[-\s]?tebligat\b/.test(t)
        || /\beteb\b/.test(t) || /\be-teb\b/.test(t);
  }
  function isAPS(raw){
    const t = normTR(raw);
    return /\baps\b/.test(t) || /\bhizli\s+gonderi\b/.test(t);
  }
  function classifyChannel(raw){ return isElekt(raw) ? 'eteb' : 'posta'; }

  // ========== XLSX OKUMA ==========
  function mapType(s) {
    const t = normTR(s);
    if (isAPS(t)) return 'aps';
    if (isElekt(t)) return 'etebligat';
    if (/\bnormal\b|\bposta\b|\btaahhut\b|\bapg\b|\bptt\b/.test(t)) return 'normal';
    return 'normal';
  }
  function pickEsas(v) {
    const s = String(v || '').trim();
    const m = s.match(/\b(\d{4})\s*\/\s*(\d{1,6})\b/);
    return m ? m[1] + '/' + m[2] : '';
  }
  function parseDateCell(d) {
    if (!d) return null;
    if (d instanceof Date && !isNaN(d)) return d;
    const s = String(d).trim();
    // Excel seri numarası
    if (/^\d+(\.\d+)?$/.test(s)) {
      const base = new Date(Date.UTC(1899, 11, 30));
      const ms = Math.round(parseFloat(s) * 86400000);
      return new Date(base.getTime() + ms);
    }
    // dd.mm.yyyy hh:mm:ss
    let m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    // yyyy-mm-dd
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    const t = new Date(s);
    return isNaN(t) ? null : t;
  }
  async function parseTebligatXlsx(file) {
    if (typeof XLSX === 'undefined') {
      throw new Error('XLSX (SheetJS) kütüphanesi yüklü değil.');
    }
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, {
      type: 'array',
      cellDates: false,
      cellNF: false,
      cellText: false
    });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: true });

    // Esnek başlık eşlemesi
    const H = {
      esas: ['esas', 'dosya no', 'esas no', 'dosyano', 'dosya'],
      tur: ['gönderi tipi', 'gonderi tipi', 'tebligat türü', 'tur', 'tür', 'tebliğ şekli', 'tebligat sekli', 'usul'],
      olusturma: [
        'tebligat oluşturma tarihi',
        'tebligat olusturma tarihi',
        'oluşturma tarihi',
        'olusturulma',
        'tebligat tarihi',
        'tarih'
      ]
    };
    function pick(obj, keys) {
      const k = Object.keys(obj).find((kk) =>
        keys.some((h) => normTR(kk).includes(normTR(h)))
      );
      return obj[k];
    }

    const out = [];
    for (const r of rows) {
      const esasRaw = pick(r, H.esas);
      const turRaw = pick(r, H.tur);
      const tarRaw = pick(r, H.olusturma);
      const esas = pickEsas(esasRaw);
      if (!esas) continue;
      out.push({
        esas,
        tur: mapType(turRaw),
        _rawTur: turRaw,
        channel: classifyChannel(turRaw),
        tarih: parseDateCell(tarRaw)
      });
    }
    return out;
  }

  // ========== UPLOAD & AKIŞ ==========
  function bindUploadOnce() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if (!dropZone || !fileInput) return;
    if (window.__bindTebligatUploadDone) return;
    window.__bindTebligatUploadDone = true;

    const onFile = (file) => handleFile(file).catch((e) => {
      console.error(e);
      showToast('warning', 'Uyarı', 'Dosya okunamadı: ' + (e?.message || 'Bilinmeyen hata'));
    });

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const f = e.dataTransfer?.files?.[0];
      if (f) onFile(f);
    });
    fileInput.addEventListener('change', (e) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
    });
  }

  async function handleFile(file) {
    const name = file.name.toLowerCase();
    if (!/\.(xls|xlsx)$/i.test(name)) {
      showToast('warning', 'Desteklenmeyen Format', 'Sadece XLS veya XLSX dosyaları kabul edilir.');
      return;
    }
    showToast('info', 'Yükleniyor', `${file.name} yükleniyor...`);

    // 1) Excel'i ayrıştır
    const items = await parseTebligatXlsx(file);
    if (!items.length) {
      showToast('warning', 'Uyarı', 'Dosyada uygun satır bulunamadı.');
      return;
    }

    // 2) Render flush: alanlar DOM’da hazır
    await new Promise((r) => requestAnimationFrame(r));

    // 3) Şimdi hem posta hem e-tebligat label–input aralıklarını çıkar
    const R_POSTA = buildRanges('gteb');
    const R_ETEB  = buildRanges('geteb');

    // 4) Satır satır — kanal + tarihe göre doğru input’u arttır
    let apsCountMsg = 0, normalCountMsg = 0, eCountMsg = 0;
    const perEsas = new Map(); // mesaj için: {esas: {aps, normal, eteb}}
    const ensureBucket = (e) => {
      if (!perEsas.has(e)) perEsas.set(e, {aps:0, normal:0, eteb:0});
      return perEsas.get(e);
    };

    items.forEach(x => {
      const raw   = x._rawTur || x.tur;
      const tarih = x.tarih instanceof Date ? x.tarih : null;
      const canal = x.channel || classifyChannel(raw);

      if (canal === 'eteb') {
        const id = bucketIdByDate(tarih, R_ETEB);
        if (id) incById(id, 1);
        eCountMsg++;
        ensureBucket(x.esas).eteb += 1;
      } else {
        const id = bucketIdByDate(tarih, R_POSTA);
        if (!id) return;
        if (isAPS(raw) || x.tur === 'aps') {
          incById(id, 2);      // APS = 2 adet
          apsCountMsg++;       // mesajda 1 adet olarak raporlanır
          ensureBucket(x.esas).aps += 1;
        } else {
          incById(id, 1);      // NORMAL = 1
          normalCountMsg++;
          ensureBucket(x.esas).normal += 1;
        }
      }
    });

    // 5) Mesaj metni (tek/çok esas durumuna göre)
    let toastBody = '';
    const uniqueEsas = Array.from(perEsas.keys());
    if (uniqueEsas.length === 1) {
      const e = uniqueEsas[0];
      const c = perEsas.get(e);
      toastBody =
        `${e} esas sayılı dosyasına ait ${c.aps} adet APS,  ${c.normal} adet normal, ` +
        `${c.eteb} adet Elektronik Tebligat bulunduğu tespit edilmiş, ` +
        `Tebligatlar listesinde ilgili tarihlerin sayıları arttırılarak hesaplama başarıyla yapılmıştır.`;
    } else {
      toastBody =
        `Yüklenen dosyada ${uniqueEsas.length} esas bulundu. ` +
        `${apsCountMsg} adet APS,  ${normalCountMsg} adet normal, ` +
        `${eCountMsg} adet Elektronik Tebligat için ilgili tarih aralıklarındaki sayılar arttırıldı ve hesaplama başarıyla yapılmıştır.`;
    }
    showToast('success', 'İşlem tamam', toastBody);

    // 6) Hesapla
    document.getElementById('giderhesapla')?.click();
  }

  // ========== BIND BUTONLAR ==========
  function bindActions() {
    const btnCalc = document.getElementById('giderhesapla');
    if (btnCalc) btnCalc.addEventListener('click', calculate);

    const btnClear = document.getElementById('btnClear');
    if (btnClear) btnClear.addEventListener('click', clearAll);

    const sw = document.getElementById('tebligatlarbir');
    if (sw) {
      sw.addEventListener('change', () => {
        const oc = document.getElementById('opencount');
        if (oc && !sw.checked) oc.value = '0';
      });
    }
    bindCopy();
    bindNumericInputs();
  }

  async function init() {
    try {
      FEE = await loadFees();
      buildUstSolTwoCols();          // alanlar DOM'a çizildi
      bindActions();
      bindUploadOnce();              // dropzone event'leri şimdi bağlanır (tek kez)
      // loadCounterWithJQ();         // istersen aç
    } catch (err) {
      console.error(err);
      const mount = $(MOUNT_SELECTOR);
      if (mount) {
        const warn = el('div', 'muted');
        warn.textContent =
          'Ücret tablosu yüklenemedi. /api/tebligatlar.php veya /data/tebligatlar.json erişimini kontrol edin.';
        mount.append(warn);
      }
    }
  }

  (document.readyState === 'complete' || document.readyState === 'interactive')
    ? init()
    : document.addEventListener('DOMContentLoaded', init, { once: true });

})();
