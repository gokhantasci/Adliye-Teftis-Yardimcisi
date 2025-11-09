(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);

  // ---- DOM elemanları
  const dropZone = $('#dropZone');
  const fileInput = $('#fileInput');
  const hintEl = $('#selectedFilesHint');
  const statsBody = $('#cardUstSol .panel-body'); // KPI & karar türleri (üst sağ)

  // ---- Sabitler
  const REQUIRED_SHEET = 'czmIstinafDefteriRaporu';
  const pageSize = 20;

  // ---- Durum
  const ozetData = [];
  const currentPage = 1;

  // ---- Yardımcılar
  const escapeHtml = s => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } [m]));
  const normalize = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  const letterToIndex = L => {
    L = String(L).toUpperCase().trim();
    let n = 0;
    for (let i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64);
    return n - 1;
  };

  function iconFor(type) {
    return type === 'success' ? 'check_circle' : type === 'warning' ? 'warning' : type === 'danger' ? 'error' : 'info';
  }

  function toastWithIcon(type, title, msg, delay = 5000) {
    const bodyHtml = `<div style="display:flex;align-items:flex-start;gap:.5rem;">
      <span class="material-symbols-rounded" style="font-size:22px;">${iconFor(type)}</span>
      <div>${msg}</div></div>`;
    window.toast({
      type,
      title,
      body: bodyHtml,
      delay
    });
  }

  function isExcelFile(f) {
    if (!f || !f.name) return false;
    const n = f.name.toLowerCase();
    return n.endsWith('.xls') || n.endsWith('.xlsx');
  }


  // ---- Üst Sağ (detay) ve Üst Sol (KPI) render
  function renderStatsPanels(stats) {
    // ÜST SAĞ: detay + karar türleri (eski düzen)
    if (statsBody) {
      statsBody.innerHTML = `
        <section class="panel">
          <div class="panel-head"><h3>Karar Türleri</h3></div>
          <div class="panel-body">
            <table class="table"><thead><tr><th>Tür</th><th>Adet</th></tr></thead><tbody>
              ${
  Object.keys(stats.decisions).length
    ? Object.keys(stats.decisions).sort().map(k => `<tr><td>${escapeHtml(k)}</td><td class="num">${stats.decisions[k]}</td></tr>`).join('')
    : `<tr><td colspan="2" class="muted">Henüz karar yok</td></tr>`
  }
            </tbody></table>
          </div>
        </section>`;
    }

    // ÜST SOL: KPI kartları
    ensureKpiCards();
    $('#kpiIstinafEdilen') && ($('#kpiIstinafEdilen').textContent = stats.total.toLocaleString('tr-TR'));
    $('#kpiVazgecilen') && ($('#kpiVazgecilen').textContent = stats.withdrawn.toLocaleString('tr-TR'));
    $('#kpiNotSent') && ($('#kpiNotSent').textContent = stats.not_sent.toLocaleString('tr-TR'));
    $('#kpiPending') && ($('#kpiPending').textContent = stats.pending_review.toLocaleString('tr-TR'));
    $('#kpiDecided') && ($('#kpiDecided').textContent = stats.decided.toLocaleString('tr-TR'));
  }


  // ---- Üst Sol KPI: card-head'i kaldır, KPI grid ekle
  function ensureKpiCards() {
    const ustSol = $('#cardAltSol');
    if (!ustSol) return;

    const ch = ustSol.querySelector('.card-head');
    if (ch) ch.remove();

    let body = ustSol.querySelector('.card-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'card-body';
      ustSol.appendChild(body);
    }

    if (body.querySelector('.kpi-grid')) return;

    body.innerHTML = `
		<section class="kpi-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;">
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Temyiz Edilen</span><span class="material-symbols-rounded kpi-icon">work</span></div>
			<div class="kpi-value" id="kpiIstinafEdilen">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <!-- Yeni Vazgeçilen Kartı Eklendi -->
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Vazgeçilen<br></span><span class="material-symbols-rounded kpi-icon">cancel</span></div>
			<div class="kpi-value" id="kpiVazgecilen">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Henüz Gönderilmemiş</span><span class="material-symbols-rounded kpi-icon">outgoing_mail</span></div>
			<div class="kpi-value" id="kpiNotSent">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Temyiz İncelemesinde</span><span class="material-symbols-rounded kpi-icon">assignment</span></div>
			<div class="kpi-value" id="kpiPending">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>
		  <div class="card kpi">
			<div class="kpi-head"><span class="kpi-title">Karar Verilmiş<br></span><span class="material-symbols-rounded kpi-icon">gavel</span></div>
			<div class="kpi-value" id="kpiDecided">0</div>
			<div class="kpi-sub muted">Toplam</div>
		  </div>

		  <!-- YENİ: İşlem Sayısı -->
		  <div class="card kpi">
			<div class="kpi-head">
			  <span class="kpi-title">İşlem Sayısı</span>
			  <span class="material-symbols-rounded kpi-icon">contract_edit</span>
			</div>
			<div class="kpi-value" id="kpiIslem">0</div>
			<div class="kpi-sub muted">28/10/2025 tarihinden bugüne</div>
		  </div>
		</section>
		`;
  }
  ensureKpiCards();

}) ();

