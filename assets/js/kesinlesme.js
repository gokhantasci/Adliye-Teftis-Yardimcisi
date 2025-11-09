(() => {
  'use strict';

  // ======================
  //  Layout Hotfix (rev3)
  // ======================
  if (!document.getElementById('kesinlesme-layout-hotfix')) {
    const css = `
      .container, .card, .card-head, .card-body, .ustsag, .altsol, .altsag { min-width: 0; }
      .card-body { box-sizing: border-box; max-width: 100%; overflow-wrap: anywhere; }

      /* ---- Holiday tags ---- */
      #holidayMount { max-width: 100%; overflow: hidden; }
      #holidayMount .tags-wrap {
        display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; max-width: 100%;
      }
      #holidayMount .tag {
        display: inline-block; border-radius: 999px; padding: .28rem .62rem;
        font-size: .9rem; line-height: 1; white-space: nowrap; max-width: 100%;
        overflow: hidden; text-overflow: ellipsis; border: 1px solid transparent;
        font-family: inherit;
      }
      /* GEÇMİŞ günler = DOLU rozet */
      #holidayMount .tag--full  { background: #A5D6A7; color: #0b3d17; border-color: #A5D6A7; } /* Green 200 */
      #holidayMount .tag--half  { background: #FFCC80; color: #4a2b00; border-color: #FFCC80; } /* Orange 200 */
      /* BUGÜNDEN SONRA = SADECE ÇERÇEVE RENKLİ, YAZI TEMADAN */
      #holidayMount .tag--o-full { background: transparent; color: inherit; border-color: #A5D6A7; }
      #holidayMount .tag--o-half { background: transparent; color: inherit; border-color: #FFCC80; }

      /* ---- Form rows ---- */
      .form-row{display:flex;align-items:center;gap:.75rem;margin:.5rem 0;}
      .row-label{min-width:180px;font-weight:500;}
      .row-field{flex:1;display:flex;align-items:center;gap:.4rem}

      /* ---- Buttons & icons ---- */
      .icon-btn{
        display:inline-flex;align-items:center;justify-content:center;
        width:2.25rem;height:2.25rem;border:1px solid var(--btn-bd,#ccc);
        border-radius:.5rem;background: var(--icon-bg,transparent); cursor:pointer;
        color:var(--icon-fg,inherit);
      }
      .icon-btn:hover{ border-color: var(--btn-bd-hover,#888); }

      /* Dark mode: icon bg beyaz kalmasın */
      [data-theme="dark"] .icon-btn{
        --icon-bg: transparent;
        --icon-fg: #e8e8e8;
        --btn-bd: #555; --btn-bd-hover:#777;
        backdrop-filter: saturate(120%);
      }

      /* Date action group modernized via .btn small */
      .date-actions{ display:flex; flex-wrap:wrap; gap:.4rem; align-items:center; }

      /* KPI */
      .kpi .kpi-value{font-size:2rem;font-weight:700}
      .list{margin:0;padding-left:1.1rem}
      .list li{margin:.15rem 0}

      /* ---- Sidebar toggle (dark mode bg fix) ---- */
      #sidebarToggle, .sidebar-toggle, .btn-sidebar-toggle{
        background: var(--st-bg,transparent);
        color: var(--st-fg,inherit);
        border: 1px solid var(--st-bd,transparent);
      }
      #sidebarToggle:hover, .sidebar-toggle:hover, .btn-sidebar-toggle:hover{
        border-color: var(--st-bd-h,#888);
      }
      [data-theme="dark"] #sidebarToggle,
      [data-theme="dark"] .sidebar-toggle,
      [data-theme="dark"] .btn-sidebar-toggle{
        --st-bg: transparent;    /* beyaz yok */
        --st-fg: #e8e8e8;
        --st-bd: #555;
        --st-bd-h: #777;
      }
    `;
    const s = document.createElement('style');
    s.id = 'kesinlesme-layout-hotfix'; s.textContent = css;
    document.head.appendChild(s);
  }
  // ====== Bugün tatil / en yakın tatil toast'ları (10 sn) ======
  let __holidayToastShown = false;

  function normalizeStr(s){
	  return String(s || '').toLowerCase()
      .replace(/\s+/g,' ')
      .replace(/[’']/g,"'") // tek tırnak varyantları
      .trim();
  }

  function getHolidayMessage(aciklama, year){
	  const t = normalizeStr(aciklama);

	  // Sıraya dikkat: daha spesifikler önce
	  if (t.includes('yılbaşı')) {
      return {
		  type: 'primary',
		  title: 'Mutlu Yıllar',
		  body: `Mutlu Yıllar, ${year} tüm Adalet Bakanlığı Çalışanlarına huzur ve sağlık getirmesi dileğiyle,`
      };
	  }
	  if (t.includes('cumhuriyet bayram')) { // 28/29 ekim ve yarım gün varyantları
      return {
		  type: 'primary',
		  title: 'Cumhuriyet Bayramı',
		  body: `Cumhuriyet; eşitliğin, özgürlüğün ve bağımsızlığın en güzel ifadesidir. Ne mutlu Türküm diyene!”
		  `
      };
	  }
	  if (t.includes('ramazan bayram')) {
      return {
		  type: 'primary',
		  title: 'Ramazan Bayramı',
		  body: 'Ramazan Bayramınızı tebrik ederiz!'
      };
	  }
	  if (t.includes('kurban bayram')) {
      return {
		  type: 'primary',
		  title: 'Kurban Bayramı',
		  body: 'Kurban Bayramınızı tebrik ederiz!'
      };
	  }
	  if (t.includes('ulusal egemenlik ve çocuk bayramı')) {
      return {
		  type: 'primary',
		  title: '23 Nisan',
		  body: 'Ulusal Egemenlik ve Çocuk Bayramı Kutlu Olsun,'
      };
	  }
	  if (t.includes('emek ve dayanışma günü') || t.includes('işçi bayram')) {
      return {
		  type: 'primary',
		  title: '1 Mayıs',
		  body: "Birlik ve dayanışma içinde, eşit haklarla çalışacağımız güzel bir dünya dileğiyle 1 Mayıs İşçi Bayramı'mız kutlu olsun!,"
      };
	  }
	  if (t.includes("atatürk'ü anma, gençlik ve spor bayramı") || t.includes('gençlik ve spor bayramı')) {
      return {
		  type: 'primary',
		  title: '19 Mayıs',
		  body: "Ey yükselen yeni nesil, gelecek sizindir. Cumhuriyeti biz kurduk; onu yükseltecek ve sürdürecek sizsiniz (K. Atatürk). 19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramınız kutlu olsun."
      };
	  }
	  if (t.includes('demokrasi ve milli birlik günü') || t.includes('15 temmuz')) {
      return {
		  type: 'primary',
		  title: '15 Temmuz',
		  body: 'Bir bayrak uğruna can veren yiğitleri minnetle anıyoruz. 15 Temmuz Demokrasi ve Milli Birlik Günü kutlu olsun'
      };
	  }
	  if (t.includes('zafer bayramı') || t.includes('30 ağustos')) {
      return {
		  type: 'primary',
		  title: '30 Ağustos',
		  body: '30 Ağustos Zafer Bayramı kutlu olsun! Başta Gazi Mustafa Kemal Atatürk olmak üzere tüm şehitlerimizi rahmet ve minnetle anıyoruz.'
      };
	  }
	  // Varsayılan (her ihtimale karşı)
	  return {
      type: 'primary',
      title: 'Tatil',
      body: aciklama || 'Güzel bir gün dileriz.'
	  };
  }

  function findTodayHoliday(){
	  const today = new Date(); today.setHours(0,0,0,0);
	  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
	  return tatiller.find(t => t.iso === todayISO) || null;
  }

  function findNextHoliday(){
	  const today = new Date(); today.setHours(0,0,0,0);
	  const next = tatiller
      .map(t => ({...t, d: new Date(`${t.iso}T00:00:00`) }))
      .filter(x => x.d.getTime() > today.getTime())
      .sort((a,b) => a.d - b.d)[0];
	  return next || null;
  }

  function maybeHolidayToast(){
	  if (__holidayToastShown || typeof window.toast !== 'function') return;
	  const today = new Date(); today.setHours(0,0,0,0);

	  const th = findTodayHoliday();
	  if (th) {
      const msg = getHolidayMessage(th.aciklama || '', today.getFullYear());
      window.toast({ type: msg.type, title: msg.title, body: msg.body, delay: 10000 });
      __holidayToastShown = true;
      return;
	  }

	  const nh = findNextHoliday();
	  if (nh) {
      const diffDays = Math.round((new Date(`${nh.iso}T00:00:00`).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const label = nh.aciklama ? ` : ${nh.aciklama}` : '';
      window.toast({
		  type: 'info',
		  title: 'Yaklaşan Tatil',
		  body: `En Yakın Tatil${label} — ${fmt_dots(new Date(`${nh.iso}T00:00:00`))} (${diffDays} gün sonra)`,
		  delay: 10000
      });
      __holidayToastShown = true;
	  }
  }


  // ======================
  //  Kısa yardımcılar
  // ======================
  const $ = (s, r = document) => r.querySelector(s);
  const pad = n => String(n).padStart(2, '0');
  const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = iso => (iso ? new Date(`${iso}T00:00:00`) : null);
  const fmt_ddmm = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const fmt_dots = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
  const addDays = (d, n) => { const x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; };
  const trDays = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];

  // ======================
  //  Tatiller (API → JSON fallback) ve normalize
  // ======================
  let tatiller = []; // { iso: "YYYY-MM-DD", tur: 1|2, aciklama: string }

  function buildPathCandidates(subpath) {
    const path = window.location.pathname;
    const segs = path.split('/').filter(Boolean);
    const out = [];
    for (let i = segs.length - 1; i >= 0; i--) {
      const prefix = '/' + segs.slice(0, i).join('/');
      const base = prefix.endsWith('/') ? prefix : (prefix ? prefix + '/' : '/');
      out.push(base + subpath.replace(/^\/+/, ''));
    }
    const root = '/' + subpath.replace(/^\/+/, '');
    if (!out.includes(root)) out.push(root);
    return [...new Set(out)];
  }

  async function fetchJsonWithFallback(paths) {
    for (const p of paths) {
      const url = new URL(p, window.location.origin).href;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch { /* pass */ }
    }
    throw new Error('tatiller kaynakları bulunamadı');
  }

  function normalizeTatiller(raw) {
    const out = [];
    const toISOguess = (v) => {
      if (!v) return null;
      let m;
      if ((m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) {
        const [, d, M, y] = m; return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
      if ((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
        const [, d, M, y] = m; return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(v)) {
        const [y, M, d] = v.split('-'); return `${y}-${String(M).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
      return null;
    };
    if (Array.isArray(raw)) {
      for (const it of raw) {
        if (it && typeof it === 'object') {
          const iso = toISOguess(it.tarih || it.iso);
          if (!iso) continue;
          out.push({ iso, tur: Number(it.tur) === 2 ? 2 : 1, aciklama: it.aciklama || '' });
        } else if (typeof it === 'string') {
          const iso = toISOguess(it); if (iso) out.push({ iso, tur: 1, aciklama: '' });
        }
      }
    }
    return out;
  }

  async function loadHolidays() {
    try {
      const apiPaths  = buildPathCandidates('api/tatiller.php');
      const rawApi    = await fetchJsonWithFallback(apiPaths);
      const arr       = Array.isArray(rawApi?.data) ? rawApi.data : rawApi;
      tatiller        = normalizeTatiller(arr);
      paintHolidays();
	  maybeHolidayToast();
    } catch (eApi) {
      try {
        const jsonPaths = buildPathCandidates('data/tatiller.json');
        const rawJson   = await fetchJsonWithFallback(jsonPaths);
        const arr2      = Array.isArray(rawJson?.data) ? rawJson.data : rawJson;
        tatiller        = normalizeTatiller(arr2);
        paintHolidays();
        maybeHolidayToast();
      } catch (eJson) {
        $('#holidayInfo').textContent = 'tatiller yüklenemedi.';
      }
    }
  }

  // ======================
  //  Form (default bugün + kısayollar)
  // ======================
  function mountForm() {
    const todayISO = toISO(new Date());
    $('#formMount').innerHTML = `
	  <div class="form-row">
		<label class="row-label" for="tebligTarihi">Tebliğ Tarihi</label>
		<div class="row-field">
          <input id="tebligTarihi" type="date" class="input"/>
          <div class="date-actions">
            <button class="btn small" data-delta="-7">-1 Hf</button>
            <button class="btn small" data-delta="-1">-1 G</button>
            <button class="btn small" data-today="1">Bugün</button>
            <button class="btn small" data-delta="1">+1 G</button>
            <button class="btn small" data-delta="7">+1 Hf</button>
          </div>
		</div>
	  </div>
      <div class="form-row">
        <label class="row-label" for="sureSayi">Süre (Sayı)</label>
        <div class="row-field"><input id="sureSayi" type="number" class="input" min="1" step="1" value="2"/></div>
      </div>
      <div class="form-row">
        <label class="row-label" for="sureTur">Süre Türü</label>
        <div class="row-field">
          <select id="sureTur" class="input">
            <option value="gun">Gün</option>
            <option value="hafta" selected>Hafta</option>
            <option value="ay">Ay</option>
          </select>
        </div>
      </div>
    `;
    $('#tebligTarihi').value = todayISO;

    $('#formMount').querySelectorAll('.date-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
		  const inp = $('#tebligTarihi');
		  let d = fromISO(inp.value) || new Date();
		  if (btn.dataset.today === '1') {
          d = new Date();
          if (window.toast) {window.toast({ type: 'info', title: 'Tarih sıfırlandı', body: 'Bugüne alındı' });}
		  } else {
          const delta = parseInt(btn.dataset.delta, 10) || 0;
          d = addDays(d, delta);
          const infoTxt = `${fmt_dots(d)} (${trDays[d.getDay()]})`;
          if (window.toast) {window.toast({ type: 'info', title: 'Tarih değişti', body: `Yeni tarih: ${infoTxt}` });}
		  }
		  inp.value = toISO(d);
      });
    });

    $('#btnCalc')?.addEventListener('click', onCalc);
    $('#btnClear')?.addEventListener('click', onClear);
  }

  // ======================
  //  Tatiller paneli (dd/mm/yyyy; geçmiş=filled, gelecek=outline)
  // ======================
  function paintHolidays() {
    const info  = $('#holidayInfo');
    const mount = $('#holidayMount');
    const items = tatiller.slice().sort((a,b) => a.iso.localeCompare(b.iso));
    info.textContent = items.length ? `${items.length} kayıt` : 'kayıt yok';

    const today = new Date(); today.setHours(0,0,0,0);
    // Gruplar: geçmiş ve gelecek ayrı; her grup hover/focus ile açılır.
    const past = [];
    const future = [];
    items.forEach(t => {
      const d = fromISO(t.iso); if (!d) return;
      if (d.getTime() < today.getTime()) past.push(t); else future.push(t);
    });
    function renderTag(t){
      const d = fromISO(t.iso); if (!d) return '';
      const label = fmt_ddmm(d);
      const isFuture = d.getTime() >= today.getTime();
      const cls = isFuture
        ? (t.tur === 2 ? 'tag tag--o-half' : 'tag tag--o-full')
        : (t.tur === 2 ? 'tag tag--half'  : 'tag tag--full');
      const title = (t.aciklama || '').replace(/"/g,'&quot;');
      return `<span class="${cls}" title="${title}">${label}</span>`;
    }
    function groupHtml(list, groupLabel){
      if (!list.length) return '';
      const head = `<div class="holiday-group-head muted"><span class="chevron">▸</span><span>${groupLabel} (${list.length})</span></div>`;
      const inner = list.map(renderTag).join('');
      return `<div class="holiday-group" tabindex="0">${head}<div class="holiday-group-inner">${inner}</div></div>`;
    }
    const toolbar = `<div class="holiday-groups-toolbar"><button class="toggle-all-btn" type="button" id="btnToggleAll"><span class="material-symbols-rounded" style="font-size:16px;"> unfold_more </span><span>Tümünü aç</span></button><div id="holidayInfoInline" class="muted small"></div></div>`;
    const html = toolbar + groupHtml(past, 'Geçmiş') + groupHtml(future, 'Gelecek');
    mount.innerHTML = html || '<em>Tanımlı yok</em>';

    // Bilgiyi toolbar'a da yaz
    const infoInline = $('#holidayInfoInline'); if (infoInline) infoInline.textContent = items.length ? `${items.length} kayıt` : 'kayıt yok';

    // Etkileşimler: tek tek aç/kapa ve tümünü aç/kapa
    mount.querySelectorAll('.holiday-group').forEach(el => {
      const toggle = () => el.classList.toggle('open');
      el.addEventListener('click', (e) => {
        // Yalnızca başlığı tıklayınca tetikleyelim; içerikteki tag'e tıklama flicker yapmasın
        if (e.target.closest('.holiday-group-head')) toggle();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        if (e.key === 'ArrowRight') el.classList.add('open');
        if (e.key === 'ArrowLeft')  el.classList.remove('open');
      });
    });
    const btnAll = $('#btnToggleAll');
    if (btnAll){
      let allOpen = false;
      const updateLabel = () => {
        const spanText = btnAll.querySelector('span:last-child');
        const icon = btnAll.querySelector('.material-symbols-rounded');
        if (spanText) spanText.textContent = allOpen ? 'Tümünü kapat' : 'Tümünü aç';
        if (icon) icon.textContent = allOpen ? 'unfold_less' : 'unfold_more';
      };
      updateLabel();
      btnAll.addEventListener('click', () => {
        allOpen = !allOpen;
        mount.querySelectorAll('.holiday-group').forEach(el => el.classList.toggle('open', allOpen));
        updateLabel();
      });
    }

    // Tag tıklamalarında kısa (1.5s) toast göster
    mount.querySelectorAll('.holiday-group-inner .tag').forEach(tagEl => {
      tagEl.addEventListener('click', (e) => {
        e.stopPropagation(); // grup aç/kapa ile çakışmasın
        const dateTxt = tagEl.textContent || '';
        const desc = tagEl.getAttribute('title') || '';
        if (typeof window.toast === 'function') {
          window.toast({ type: 'info', title: dateTxt, body: desc || 'Tatil', delay: 1500 });
        }
      });
    });
  }

  // ======================
  //  C# kuralları (Ceza rejimi sabit)
  // ======================
  function computeKesinlesme({ tebligISO, count, unit }) {
    const notes = [];
    let teblig = fromISO(tebligISO);
    if (!teblig) return null;

    const y = teblig.getFullYear();
    const adliBas = new Date(`${y}-07-20T00:00:00`);
    const adliBit = new Date(`${y}-08-31T00:00:00`);
    const inAdli = (d) => d >= adliBas && d <= adliBit;

    if (inAdli(teblig)) {
      notes.push(`${fmt_dots(teblig)} günü Adli Tatil içerisine denk geldiğinden, tebliğ tarihini Adli tatilin Bitiş tarihi olan 01.09.${y} olarak esas almak gerekmiştir.`);
      teblig = new Date(`${y}-09-01T00:00:00`);
    }

    let son = new Date(teblig);
    if (unit === 'hafta') son = addDays(son, 7 * count);
    else if (unit === 'ay') { const d = new Date(son); d.setMonth(d.getMonth() + count); son = d; } else son = addDays(son, count);

    for (let i = 0;i < 3;i++){
      if (inAdli(son)) {
        notes.push(`${fmt_dots(son)} günü Adli Tatil içerisine denk geldiğinden, CMK 331/4 maddesi uyarınca Adlî tatile rastlayan süreler işlemez. Bu süreler adli tatilin bittiği günden itibaren üç gün uzatılmış sayılır.`);
        son = addDays(new Date(`${y}-09-01T00:00:00`), 2); // 01.09 + 2 = 03.09
      }
      const day = son.getDay(); // 0 Pazar, 6 Cumartesi
      if (day === 6) {
        notes.push(`${fmt_dots(son)} günü Cumartesi  günü olduğundan, CMK Madde 39/4 uyarınca 'Son gün bir tatile rastlarsa süre, tatilin ertesi günü biter'.`);
        son = addDays(son, 2);
      } else if (day === 0) {
        notes.push(`${fmt_dots(son)} günü Pazar  günü olduğundan, CMK Madde 39/4 uyarınca 'Son gün bir tatile rastlarsa süre, tatilin ertesi günü biter'.`);
        son = addDays(son, 1);
      }
      const hol = tatiller.find(t => t.iso === toISO(son));
      if (hol) {
        if (hol.tur === 2) {
          notes.push(`${fmt_dots(son)} tarihi ${hol.aciklama}  günü yarım gün Resmi Tatil ise de, Yargıtay Ceza Genel Kurulu’nun 22.06.2022 tarih ve 2020/255 E. , 2022/365 K. sayılı ilamıyla özetle *öngörülen bir haftalık temyiz süresinin 6,5 güne indirilmesi anlamına geleceği, dolayısıyla da kanun yoluna başvuru hakkını kısıtlayıcı sonuç doğuracağı ve temyiz süresinin son günü normal mesai saati bitiminden önce saat 13.00’ten itibaren resmî tatilin başlaması nedeniyle sanığın temyiz süresinin resmî tatilin bitimine kadar uzayacağı kabul edilmelidir.* kararına istinaden süre tatilin bitimine UZAR,  <a href="https://657.com.tr/tebligin-son-gunu-yarim-gun-tatile-denk-gelirse-surenin-uzayacagi-karari/" target="_blank">Yargıtay Kararı için tıklayınız.</a>`);
		  son = addDays(son, 1);
        } else {
          notes.push(`${fmt_dots(son)} günü ${hol.aciklama || 'Resmî Tatil'}  günü olduğundan, CMK Madde 39/4 uyarınca 'Son gün bir tatile rastlarsa süre, tatilin ertesi günü biter'.`);
          son = addDays(son, 1);
        }
      }
    }

    const kesin = addDays(son, 1);
    notes.push(`\r\n`);
    notes.push(`Kesinleşme tarihi : ${fmt_ddmm(kesin)} ${trDays[kesin.getDay()]}`);

    const uniqNotes = Array.from(new Set(notes));
    return { teblig, son, kesin, notes: uniqNotes };
  }

  // ======================
  //  Hesapla / Temizle
  // ======================
  function onCalc() {
	  const tebligISO = $('#tebligTarihi').value;
	  const count = Math.max(1, parseInt($('#sureSayi').value, 10) || 0);
	  const unit  = $('#sureTur').value;

	  if (!tebligISO) {
      if (typeof window.toast === 'function') window.toast({type:'warning', title:'Uyarı', body:'Tebliğ tarihi seçiniz.'});
      return;
	  }

	  const out = computeKesinlesme({ tebligISO, count, unit });
	  if (!out) {
      if (typeof window.toast === 'function') window.toast({type:'warning', title:'Uyarı', body:'Hesaplama yapılamadı.'});
      return;
	  }

	  // --- Sonuç kutusu: gün adı + durum etiketi (renk + ikon) ---
    const kesin = out.kesin;
    const dayName = trDays[kesin.getDay()];
    const today = new Date(); today.setHours(0,0,0,0);
    const diffDays = Math.round((kesin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let colorClass = 'text-muted';
    let phrase = '', icon = '';

    if (diffDays === 0) {
		  colorClass = 'text-warning';
		  phrase = 'BUGÜN';
		  icon = '🟡';
    } else if (diffDays > 0) {
		  colorClass = 'text-success';
		  phrase = `${diffDays} gün sonra`;
		  icon = '✅';
    } else {
		  colorClass = 'text-danger';
		  phrase = `${Math.abs(diffDays)} gün GECİKTİ`;
		  icon = '🔴';
    }

    $('#resultBox').innerHTML = `
		  <div class="kpi-value">${fmt_ddmm(kesin)}</div>
		  <div class="kpi-label">${dayName} <span class="status-chip ${colorClass}">– ${phrase} ${icon}</span></div>
		`;


	  // --- Açıklamalar: whitespace temizle; tek öğe kalırsa gizle; linkleri HTML render et ---
	  const cleanNotes = out.notes
      .map(n => String(n || '').replace(/\s+/g, ' ').trim())
      .filter(n => n.length > 0);

	  const ul = $('#explainList');
	  if (cleanNotes.length <= 1) {
      ul.innerHTML = '';
	  } else {
      ul.innerHTML = cleanNotes.map(n => {
		  // Eğer metinde <a href= geçiyorsa HTML render et
		  if (n.includes('<a ')) return `<li>${n}</li>`;
		  const safe = n.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
		  return `<li>${safe}</li>`;
      }).join('');
	  }

	  refreshOpsCounter();

	  if (window.toast) {
      window.toast({
		  type: 'success',
		  title: 'Hesaplandı',
		  body: `Kesinleşme tarihi: ${fmt_dots(kesin)} (${trDays[kesin.getDay()]})`
      });
	  }
  }


  function onClear() {
    const todayISO = toISO(new Date());
    $('#tebligTarihi').value = todayISO;
    $('#sureSayi').value = 2;
    $('#sureTur').value  = 'hafta';
    $('#resultBox').innerHTML = `
      <div class="kpi-value muted">—</div>
      <div class="kpi-label">—</div>`;
    $('#explainList').innerHTML = '';
    refreshOpsCounter();
    if (window.toast) {window.toast({ type: 'warning', title: 'Form sıfırlandı', body: 'Alanlar temizlendi' });}

  }

  // ======================
  //  Toplam İşlem Sayısı kartı
  // ======================
  function ensureOpsCounterCard() {
    const altsag = document.querySelector('section.altsag');
    if (!altsag) return null;

    let wrap = document.querySelector('#opsCounterWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'opsCounterWrap';
      wrap.className = 'card';
      wrap.innerHTML = `
        <div class="card-body">
          <strong>Toplam İşlem Sayısı :</strong> <span id="opsCount">—</span>
        </div>
      `;
      altsag.appendChild(wrap);
    }
    return wrap;
  }

  function refreshOpsCounter() {
    const wrap = ensureOpsCounterCard();
    if (!wrap) return;
    const outEl = $('#opsCount');
    if (!outEl) return;

    function updateDom(val){ outEl.textContent = String(val); }
    function onError(){ /* sessiz geç */ }

    if (window.jQuery && typeof window.jQuery.getJSON === 'function') {
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response) {
        try {
          const adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
          updateDom(adetRaw);
        } catch (e) { onError(); }
      }).fail(onError);
      return;
    }
    // jQuery yoksa şimdilik pas; istersen fetch sürümü ekleyebilirim.
  }

  // ======================
  //  Başlat
  // ======================
  document.addEventListener('DOMContentLoaded', () => {
    mountForm();
    loadHolidays();
    ensureOpsCounterCard();
  });
})();
