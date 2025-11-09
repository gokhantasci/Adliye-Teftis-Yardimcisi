(function(){
  'use strict';

  // Helper function
  function $(sel){ return document.querySelector(sel); }
  
  // Storage for extracted data
  window.__kesinlestirmeData = {
    kararDefteri: null, // Will store: [{esasNo, kararNo, kararTarihi}, ...]
    kesinlestirmeKontrol: null, // Will store data from step 2
    infazGecVerilenler: null, // Will store data from step 3
    step1Complete: false,
    step2Complete: false,
    step3Complete: false,
    mergedData: null // Will store merged table data with all columns
  };

  // Update TODO list card
  function updateTodoList(){
    var container = $('#todoListContainer');
    if(!container) return;

    var data = window.__kesinlestirmeData;
    
    var html = '<section class="panel" id="todoListPanel">';
    html += '<div class="panel-head">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span class="material-symbols-rounded">checklist</span>';
    html += '<strong>Bilgi</strong>';
    html += '</div>';
    html += '</div>';
    html += '<div class="panel-body">';
    html += '<ol style="margin:0;padding-left:24px;line-height:2;">';
    
    // Step 1
    if(data.step1Complete){
      html += '<li style="text-decoration:line-through;color:var(--muted);">';
      html += 'Karar Defterleri yüklenecek ';
      html += '<span style="color:var(--success);font-weight:bold;">✓ ' + 
              (data.kararDefteri ? data.kararDefteri.length : 0) + 
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Karar Defterleri yüklenecek</li>';
    }
    
    // Step 2
    if(data.step2Complete){
      html += '<li style="text-decoration:line-through;color:var(--muted);">';
      html += 'Gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyası yüklenecek ';
      html += '<span style="color:var(--success);font-weight:bold;">✓ ' + 
              (data.kesinlestirmeKontrol ? data.kesinlestirmeKontrol.length : 0) + 
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyası yüklenecek</li>';
    }
    
    // Step 3
    if(data.step3Complete){
      html += '<li style="text-decoration:line-through;color:var(--muted);">';
      html += 'Gönderilen İnfaza Geç Verilenler EXCEL dosyası yüklenecek ';
      html += '<span style="color:var(--success);font-weight:bold;">✓ ' + 
              (data.infazGecVerilenler ? data.infazGecVerilenler.length : 0) + 
              ' kayıt hafızaya alındı</span>';
      html += '</li>';
    } else {
      html += '<li>Gönderilen İnfaza Geç Verilenler EXCEL dosyası yüklenecek</li>';
    }
    
    html += '</ol>';
    html += '</div>';
    html += '</section>';

    container.innerHTML = html;
  }

  // Generate merged summary table
  function generateMergedTable(){
    var kararData = window.__kesinlestirmeData.kararDefteri;
    var kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;
    
    if(!kararData || kararData.length === 0) return;

    // Create lookup map from kesinlestirme data (by Esas No)
    var kesinlestirmeMap = {};
    if(kesinlestirmeData){
      for(var k = 0; k < kesinlestirmeData.length; k++){
        var item = kesinlestirmeData[k];
        kesinlestirmeMap[item.esasNo] = item;
      }
    }

    var container = $('#resultsContainer');
    if(!container) return;

    var html = '<section class="panel" id="mergedResultPanel">';
    html += '<div class="panel-head">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<span class="material-symbols-rounded">table_chart</span>';
    html += '<strong>Birleştirilmiş Özet</strong>';
    html += '</div>';
    html += '<div class="title-actions">';
    html += '<button class="btn ghost" id="exportMergedExcel">';
    html += '<span class="material-symbols-rounded">download</span> Excel İndir';
    html += '</button>';
    html += '</div>';
    html += '</div>';
    html += '<div class="panel-body">';
    html += '<div class="table-wrap">';
    html += '<table class="table" style="width:100%;border-collapse:collapse;">';
    html += '<thead><tr>';
    html += '<th>SIRA</th>';
    html += '<th>ESAS NO</th>';
    html += '<th>KARAR NO</th>';
    html += '<th>KARAR TARİHİ</th>';
    html += '<th>KARAR TÜRÜ VE MAHİYETİ<br><small>(Mahkûmiyet-HAGB/Erteleme) (Para/Hapis Cezası)</small></th>';
    html += '<th>KESİNLEŞME TARİHİ</th>';
    html += '<th>KESİNLEŞTİRME İŞLEM TARİHİ</th>';
    html += '<th>KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ<br><small>(Gün) ve AÇIKLAMA</small></th>';
    html += '<th>İNFAZA VERİLİŞ TARİHİ</th>';
    html += '<th>İNFAZA VERMEDE GECİKME SÜRESİ<br><small>(Gün)</small></th>';
    html += '</tr></thead>';
    html += '<tbody>';

    // Create merged data structure
    var mergedData = [];
    
    for(var i = 0; i < kararData.length; i++){
      var row = kararData[i];
      var kesinlestirme = kesinlestirmeMap[row.esasNo] || {};
      
      mergedData.push({
        sira: i + 1,
        esasNo: row.esasNo,
        kararNo: row.kararNo,
        kararTarihi: row.kararTarihi,
        kararTuruMahiyet: kesinlestirme.kararTuruMahiyet || '',
        kesinlesmeTarihi: kesinlestirme.kesinlesmeTarihi || '',
        kesinlestirmeIslemTarihi: kesinlestirme.kesinlestirmeIslemTarihi || '',
        kesinlestirmeGecikme: kesinlestirme.kesinlestirmeGecikme || '',
        infazTarihi: kesinlestirme.infazTarihi || '',
        infazGecikme: kesinlestirme.infazGecikme || '',
        aciklama: kesinlestirme.aciklama || ''
      });

      // Combine gecikme süre and açıklama
      var gecikmeText = kesinlestirme.kesinlestirmeGecikme || '-';
      if(kesinlestirme.aciklama){
        gecikmeText += (gecikmeText !== '-' ? ' - ' : '') + kesinlestirme.aciklama;
      }

      html += '<tr>';
      html += '<td>' + (i + 1) + '</td>';
      html += '<td>' + (row.esasNo || '') + '</td>';
      html += '<td>' + (row.kararNo || '') + '</td>';
      html += '<td>' + (row.kararTarihi || '') + '</td>';
      html += '<td>' + (kesinlestirme.kararTuruMahiyet || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + gecikmeText + '</td>';
      html += '<td>' + (kesinlestirme.infazTarihi || '<span class="muted">-</span>') + '</td>';
      html += '<td>' + (kesinlestirme.infazGecikme || '<span class="muted">-</span>') + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    container.innerHTML = html;
    
    // Store merged data
    window.__kesinlestirmeData.mergedData = mergedData;

    // Wire export button
    var exportBtn = $('#exportMergedExcel');
    if(exportBtn){
      exportBtn.addEventListener('click', exportMergedToExcel);
    }

    // Enable drag scroll if available
    if(window.enableTableWrapDrag){
      window.enableTableWrapDrag();
    }
  }

  // Export merged table to Excel
  function exportMergedToExcel(){
    var data = window.__kesinlestirmeData.mergedData;
    if(!data || data.length === 0){
      if(window.toast){
        window.toast({
          type: 'warning',
          title: 'Uyarı',
          body: 'Dışa aktarılacak veri bulunamadı.',
          delay: 3000
        });
      }
      return;
    }

    // Prepare data for Excel
    var excelData = [
      ['SIRA', 'ESAS NO', 'KARAR NO', 'KARAR TARİHİ', 
       'KARAR TÜRÜ',
       'KESİNLEŞME TARİHİ', 'KESİNLEŞTİRME İŞLEM TARİHİ',
       'KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ (Gün)',
       'İNFAZA VERİLİŞ TARİHİ', 'İNFAZA VERMEDE GECİKME SÜRESİ (Gün)']
    ];

    for(var i = 0; i < data.length; i++){
      var row = data[i];
      excelData.push([
        row.sira,
        row.esasNo,
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-'
      ]);
    }

    if(window.XLSX){
      var wb = XLSX.utils.book_new();
      var ws = XLSX.utils.aoa_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Kesinleşme İnfaz');
      XLSX.writeFile(wb, 'kesinlesme-infaz-raporu.xlsx');

      if(window.toast){
        window.toast({
          type: 'success',
          title: 'Excel İndirildi',
          body: 'Rapor başarıyla indirildi.',
          delay: 3000
        });
      }
    } else {
      if(window.toast){
        window.toast({
          type: 'error',
          title: 'Hata',
          body: 'Excel kütüphanesi yüklenemedi.',
          delay: 3000
        });
      }
    }
  }

  // Handle "Kayıtları Ayıkla ve İndir" button click
  function handleAyiklaIndir(){
    var mergedData = window.__kesinlestirmeData.mergedData;
    var metadata = window.__kesinlestirmeData.metadata || {};
    
    if(!mergedData || mergedData.length === 0){
      if(window.toast){
        window.toast({
          type: 'warning',
          title: 'Uyarı',
          body: 'Birleştirilmiş veri bulunamadı.',
          delay: 3000
        });
      }
      return;
    }
    
    if(!window.XLSX){
      if(window.toast){
        window.toast({
          type: 'error',
          title: 'Hata',
          body: 'Excel kütüphanesi yüklenemedi.',
          delay: 3000
        });
      }
      return;
    }
    
    // Show confirmation modal before processing
    showAyiklaConfirmationModal();
  }

  // Show confirmation modal for ayikla operation
  function showAyiklaConfirmationModal(){
    var mergedData = window.__kesinlestirmeData.mergedData;
    var totalRows = mergedData.length;
    
    // Quick calculation to get kontrol and ayiklanan counts
    var groupedByEsas = {};
    for(var i = 0; i < mergedData.length; i++){
      var record = mergedData[i];
      var esasNo = record.esasNo;
      if(!groupedByEsas[esasNo]){
        groupedByEsas[esasNo] = [];
      }
      groupedByEsas[esasNo].push(record);
    }
    
    var kontrolCount = Object.keys(groupedByEsas).length; // One per Esas No
    var ayiklananCount = totalRows - kontrolCount;
    
    // Create modal backdrop with blur
    var backdrop = document.createElement('div');
    backdrop.id = 'ayiklaModalBackdrop';
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);z-index:9998;';
    
    // Create modal
    var modal = document.createElement('div');
    modal.id = 'ayiklaModal';
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-primary, white);color:var(--text-primary, #333);padding:0;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:9999;max-width:600px;width:90%;max-height:80vh;overflow:auto;';
    
    var modalHTML = '<div style="padding:20px;border-bottom:2px solid #e74c3c;background:var(--bg-primary, white);">';
    modalHTML += '<h2 style="margin:0;color:#e74c3c;"><span class="material-symbols-rounded" style="vertical-align:middle;font-size:32px;">warning</span> DİKKAT</h2>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="padding:20px;line-height:1.6;background:var(--bg-primary, white);color:var(--text-primary, #333);">';
    modalHTML += '<p>Lütfen verilerin doğruluğunun <b>sizin sorumluluğunuzda</b> olduğunu bilerek, kayıtları bir kaç kez teyit ediniz.</p>';
    modalHTML += '<p>Yüklemiş olduğunuz tablolardan <b>toplam ' + totalRows + ' satır</b> veri geldi, bu verilerden 1 excel dosyası oluşturmak üzeresiniz.</p>';
    
    modalHTML += '<div style="background:#d4edda;color:#155724;padding:12px;border-radius:4px;margin:12px 0;border:1px solid #c3e6cb;">';
    modalHTML += '<p style="margin:0 0 8px 0;">Excel dosyasında <b style="color:#155724;">' + kontrolCount + ' satır</b> <b>"kontrol"</b> sayfasına filtrelendi.</p>';
    modalHTML += '<p style="margin:0 0 8px 0;font-size:14px;"><b>Filtreleme koşulları:</b></p>';
    modalHTML += '<ul style="margin:0;padding-left:20px;font-size:14px;">';
    modalHTML += '<li>Tüm dosyalar tek kayıt olarak aktarıldı</li>';
    modalHTML += '<li>En ağır hapis cezası → yoksa para cezası → yoksa HAGB → yoksa diğer kayıtlardan en geç olan koşulu uygulandı</li>';
    modalHTML += '</ul>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="background:#fff3cd;color:#856404;padding:12px;border-radius:4px;margin:12px 0;border:1px solid #ffeaa7;">';
    modalHTML += '<p style="margin:0 0 4px 0;"><b>⚠️ Çalışmalarınızı "kontrol" sayfasında yapınız.</b></p>';
    modalHTML += '<ul style="margin:4px 0;padding-left:20px;font-size:14px;">';
    modalHTML += '<li>Çalışmalarınızı yaparken <b>sayfa adlarını değiştirmeden</b> tamamlayınız</li>';
    modalHTML += '<li>Satır <b>silme</b> yapabilirsiniz</li>';
    modalHTML += '<li>Bu tabloyu bitirdiğinizde <b><i>tablo yapısını bozmadan</i></b> tekrar bu menüden yüklemeniz halinde <b>WORD</b> belgenizi indirebileceksiniz</li>';
    modalHTML += '</ul>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="background:#f8d7da;color:#721c24;padding:12px;border-radius:4px;margin:12px 0;border:1px solid #f5c6cb;">';
    modalHTML += '<p style="margin:0;color:#721c24;">Kalan <b style="color:#c82333;">' + ayiklananCount + ' adet</b> kayıt <b>"ayiklanan"</b> tablosuna aktarıldı, sorulduğunda hesap verilebilir şekilde saklayabilirsiniz.</p>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="background:#cfe2ff;color:#084298;padding:12px;border-radius:4px;margin:12px 0;border:1px solid #b6d4fe;">';
    modalHTML += '<p style="margin:0 0 8px 0;color:#084298;font-size:14px;"><b>💡 Önemli Hatırlatma:</b></p>';
    modalHTML += '<p style="margin:0;color:#084298;font-size:14px;">Eğer kayıtlarda <b>Karar No</b> ve <b>Karar Tarihi</b> eksik ise; bu yılları da kapsar <b>Karar Defteri</b>ni ilk aşamada yükleyip adımları tamamlayıp, <b>eksiksiz dosyanızı indirmeyi unutmayınız.</b></p>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="background:#d1ecf1;color:#0c5460;padding:12px;border-radius:4px;margin:12px 0;border:1px solid #bee5eb;">';
    modalHTML += '<p style="margin:0;color:#0c5460;font-size:14px;"><b>ℹ️ Geri yükleme:</b> Bu tabloyu <b>geri yüklediğinizde</b> süreleri tekrar hesaplama, gecikmelerden 60 gün düşme, 0 olan kayıtları silme işlemlerini yapacağız.</p>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    
    modalHTML += '<div style="padding:20px;border-top:1px solid var(--border-color, #ddd);background:var(--bg-primary, white);">';
    modalHTML += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:16px;color:var(--text-primary, #333);">';
    modalHTML += '<input type="checkbox" id="ayiklaConfirmCheck" style="width:18px;height:18px;cursor:pointer;">';
    modalHTML += '<span>Okudum, anladım ve sorumluluğu kabul ediyorum</span>';
    modalHTML += '</label>';
    modalHTML += '<div style="display:flex;gap:8px;justify-content:flex-end;">';
    modalHTML += '<button id="ayiklaModalCancel" class="btn btn-default">İptal</button>';
    modalHTML += '<button id="ayiklaModalConfirm" class="btn btn-primary" disabled style="opacity:0.5;cursor:not-allowed;">Tamam ve İndir</button>';
    modalHTML += '</div>';
    modalHTML += '</div>';
    
    modal.innerHTML = modalHTML;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    
    // Wire checkbox
    var checkbox = document.getElementById('ayiklaConfirmCheck');
    var confirmBtn = document.getElementById('ayiklaModalConfirm');
    
    if(checkbox && confirmBtn){
      checkbox.addEventListener('change', function(){
        if(this.checked){
          confirmBtn.disabled = false;
          confirmBtn.style.opacity = '1';
          confirmBtn.style.cursor = 'pointer';
        } else {
          confirmBtn.disabled = true;
          confirmBtn.style.opacity = '0.5';
          confirmBtn.style.cursor = 'not-allowed';
        }
      });
    }
    
    // Wire cancel button
    var cancelBtn = document.getElementById('ayiklaModalCancel');
    if(cancelBtn){
      cancelBtn.addEventListener('click', function(){
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
      });
    }
    
    // Wire confirm button
    if(confirmBtn){
      confirmBtn.addEventListener('click', function(){
        if(this.disabled) return;
        
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
        
        // Proceed with ayiklama
        processAyiklamaAndDownload();
      });
    }
  }

  // Process ayiklama and download Excel
  function processAyiklamaAndDownload(){
    var mergedData = window.__kesinlestirmeData.mergedData;
    var metadata = window.__kesinlestirmeData.metadata || {};
    
    // Show processing toast
    if(window.toast){
      window.toast({
        type: 'info',
        title: 'Ayıklama İşlemi',
        body: 'Kayıtlar ayıklanıyor...',
        delay: 2000
      });
    }
    
    // Group records by Esas No
    var groupedByEsas = {};
    for(var i = 0; i < mergedData.length; i++){
      var record = mergedData[i];
      var esasNo = record.esasNo;
      
      if(!groupedByEsas[esasNo]){
        groupedByEsas[esasNo] = [];
      }
      groupedByEsas[esasNo].push(record);
    }
    
    // Process each group and decide which record goes to "kontrol" and which to "ayiklanan"
    var kontrolRecords = [];
    var ayiklananRecords = [];
    
    for(var esasNo in groupedByEsas){
      var records = groupedByEsas[esasNo];
      var result = processEsasGroup(records);
      
      kontrolRecords.push(result.kontrol);
      ayiklananRecords = ayiklananRecords.concat(result.ayiklanan);
    }
    
    // Separate HAGB and non-HAGB records
    var nonHAGBRecords = [];
    var hagbRecords = [];
    
    for(var i = 0; i < kontrolRecords.length; i++){
      if(isHAGB(kontrolRecords[i].kararTuru)){
        hagbRecords.push(kontrolRecords[i]);
      } else {
        nonHAGBRecords.push(kontrolRecords[i]);
      }
    }
    
    // Sort non-HAGB records (Mahkumiyet/Hapis/Para) by gecikme descending
    nonHAGBRecords.sort(function(a, b){
      var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });
    
    // Sort HAGB records by gecikme descending
    hagbRecords.sort(function(a, b){
      var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });
    
    // Clear infaz fields for ALL HAGB records
    for(var i = 0; i < hagbRecords.length; i++){
      hagbRecords[i].infazTarihi = '-';
      hagbRecords[i].infazGecikme = '-';
    }
    
    // Combine: non-HAGB first, then HAGB
    kontrolRecords = nonHAGBRecords.concat(hagbRecords);
    
    // Sort ayiklanan records: same logic as kontrol (non-HAGB first, then HAGB)
    var ayiklananNonHAGB = [];
    var ayiklananHAGB = [];
    
    for(var i = 0; i < ayiklananRecords.length; i++){
      if(isHAGB(ayiklananRecords[i].kararTuru)){
        ayiklananHAGB.push(ayiklananRecords[i]);
      } else {
        ayiklananNonHAGB.push(ayiklananRecords[i]);
      }
    }
    
    // Sort non-HAGB by gecikme descending
    ayiklananNonHAGB.sort(function(a, b){
      var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });
    
    // Sort HAGB by gecikme descending
    ayiklananHAGB.sort(function(a, b){
      var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
      var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
      return bGecikme - aGecikme;
    });
    
    // Combine ayiklanan: non-HAGB first, then HAGB
    ayiklananRecords = ayiklananNonHAGB.concat(ayiklananHAGB);
    
    // Re-number SIRA
    for(var i = 0; i < kontrolRecords.length; i++){
      kontrolRecords[i].sira = i + 1;
    }
    for(var i = 0; i < ayiklananRecords.length; i++){
      ayiklananRecords[i].sira = i + 1;
    }
    
    // Create workbook
    var wb = XLSX.utils.book_new();
    
    // Sheet 1: "kontrol"
    var kontrolData = [
      ['SIRA', 'Esas No', 'Karar No', 'Karar Tarihi', 'Karar Türü',
       'Kesinleşme Tarihi', 'Kesinleştirme İşlem Tarihi',
       'Kesinleştirme İşleminde Gecikme Süresi', 'Gecikme Nedeni',
       'İnfaza Veriliş Tarihi', 'İnfaza Vermede Gecikme Süresi']
    ];
    
    for(var i = 0; i < kontrolRecords.length; i++){
      var row = kontrolRecords[i];
      kontrolData.push([
        row.sira,
        row.esasNo || '-',
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.gecikmeNedeni || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-'
      ]);
    }
    
    var wsKontrol = XLSX.utils.aoa_to_sheet(kontrolData);
    XLSX.utils.book_append_sheet(wb, wsKontrol, 'kontrol');
    
    // Sheet 2: "ayiklanan"
    var ayiklananData = [
      ['SIRA', 'Esas No', 'Karar No', 'Karar Tarihi', 'Karar Türü',
       'Kesinleşme Tarihi', 'Kesinleştirme İşlem Tarihi',
       'Kesinleştirme İşleminde Gecikme Süresi',
       'İnfaza Veriliş Tarihi', 'İnfaza Vermede Gecikme Süresi', 'Silinme Sebebi']
    ];
    
    for(var i = 0; i < ayiklananRecords.length; i++){
      var row = ayiklananRecords[i];
      ayiklananData.push([
        row.sira,
        row.esasNo || '-',
        row.kararNo || '-',
        row.kararTarihi || '-',
        row.kararTuru || '-',
        row.kesinlesmeTarihi || '-',
        row.kesinlestirmeIslemTarihi || '-',
        row.kesinlestirmeGecikme || '-',
        row.infazTarihi || '-',
        row.infazGecikme || '-',
        row.silinmeSebebi || '-'
      ]);
    }
    
    var wsAyiklanan = XLSX.utils.aoa_to_sheet(ayiklananData);
    XLSX.utils.book_append_sheet(wb, wsAyiklanan, 'ayiklanan');
    
    // Generate filename: BirimAdi_BUGÜN_infaz_birlestirilmis.xls
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    var dateStr = dd + '.' + mm + '.' + yyyy;
    
    var birimAdi = metadata.birimAdi || 'Birim';
    // Clean birim adı for filename
    birimAdi = birimAdi.replace(/[^a-zA-Z0-9_]/g, '_');
    
    var filename = birimAdi + '_' + dateStr + '_infaz_birlestirilmis.xls';
    
    // Download file
    XLSX.writeFile(wb, filename);
    
    if(window.toast){
      window.toast({
        type: 'success',
        title: 'Başarılı',
        body: 'Excel dosyası indirildi: ' + filename,
        delay: 3000
      });
    }
  }

  // Process a group of records with same Esas No
  function processEsasGroup(records){
    if(records.length === 1){
      return {
        kontrol: records[0],
        ayiklanan: []
      };
    }
    
    // Categorize records
    var hapisRecords = [];
    var paraRecords = [];
    var hagbRecords = [];
    var otherRecords = [];
    
    for(var i = 0; i < records.length; i++){
      var rec = records[i];
      var kararTuru = (rec.kararTuru || '').toUpperCase();
      
      if(kararTuru.indexOf('HAPİS') !== -1 || kararTuru.indexOf('HAPIS') !== -1){
        hapisRecords.push(rec);
      } else if(kararTuru.indexOf('PARA') !== -1){
        paraRecords.push(rec);
      } else if(isHAGB(kararTuru)){
        hagbRecords.push(rec);
      } else {
        otherRecords.push(rec);
      }
    }
    
    var kontrolRecord = null;
    var ayiklananList = [];
    var sebep = '';
    
    // Logic 1: If there's HAPIS
    if(hapisRecords.length > 0){
      sebep = 'Daha ağır olan HAPİS kaydı bulunması';
      
      if(hapisRecords.length === 1){
        kontrolRecord = hapisRecords[0];
        ayiklananList = paraRecords.concat(hagbRecords).concat(otherRecords);
      } else {
        // Multiple HAPIS: pick longest duration, then highest gecikme, then first
        hapisRecords.sort(function(a, b){
          // Compare duration (extract number from karar türü)
          var aDuration = extractHapisDuration(a.kararTuru);
          var bDuration = extractHapisDuration(b.kararTuru);
          
          if(bDuration !== aDuration) return bDuration - aDuration; // Longer first
          
          // If same duration, compare gecikme
          var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
          var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
          
          return bGecikme - aGecikme; // Higher gecikme first
        });
        
        kontrolRecord = hapisRecords[0];
        ayiklananList = hapisRecords.slice(1).concat(paraRecords).concat(hagbRecords).concat(otherRecords);
      }
    }
    // Logic 2: No HAPIS, but PARA exists
    else if(paraRecords.length > 0){
      sebep = 'Daha ağır olan Para Cezası kaydı bulunması';
      
      if(paraRecords.length === 1){
        kontrolRecord = paraRecords[0];
        ayiklananList = hagbRecords.concat(otherRecords);
      } else {
        // Multiple PARA: pick highest amount, then latest date, then first
        paraRecords.sort(function(a, b){
          var aAmount = extractParaAmount(a.kararTuru);
          var bAmount = extractParaAmount(b.kararTuru);
          
          if(bAmount !== aAmount) return bAmount - aAmount; // Higher amount first
          
          // If same amount, compare kesinlestirme date (later first)
          var aDate = parseDate(a.kesinlestirmeIslemTarihi);
          var bDate = parseDate(b.kesinlestirmeIslemTarihi);
          
          if(aDate && bDate){
            return bDate.getTime() - aDate.getTime(); // Later first
          }
          
          return 0; // Keep original order (first wins)
        });
        
        kontrolRecord = paraRecords[0];
        ayiklananList = paraRecords.slice(1).concat(hagbRecords).concat(otherRecords);
      }
    }
    // Logic 3: No HAPIS, no PARA, but HAGB exists
    else if(hagbRecords.length > 0){
      sebep = 'HAGB kaydı tabloya eklendi';
      kontrolRecord = hagbRecords[0];
      ayiklananList = hagbRecords.slice(1).concat(otherRecords);
    }
    // Logic 4: None of above, pick most delayed
    else {
      sebep = 'mükerrer kayıt';
      
      var allRecords = otherRecords.length > 0 ? otherRecords : records;
      allRecords.sort(function(a, b){
        var aGecikme = parseInt(a.kesinlestirmeGecikme) || 0;
        var bGecikme = parseInt(b.kesinlestirmeGecikme) || 0;
        return bGecikme - aGecikme;
      });
      
      kontrolRecord = allRecords[0];
      ayiklananList = allRecords.slice(1);
    }
    
    // Clear infaz fields for HAGB records
    if(kontrolRecord && isHAGB(kontrolRecord.kararTuru)){
      kontrolRecord.infazTarihi = '-';
      kontrolRecord.infazGecikme = '-';
    }
    
    // Mark ayiklanan records with sebep
    for(var i = 0; i < ayiklananList.length; i++){
      ayiklananList[i].silinmeSebebi = sebep;
      
      // Clear infaz fields for HAGB records in ayiklanan too
      if(isHAGB(ayiklananList[i].kararTuru)){
        ayiklananList[i].infazTarihi = '-';
        ayiklananList[i].infazGecikme = '-';
      }
    }
    
    return {
      kontrol: kontrolRecord,
      ayiklanan: ayiklananList
    };
  }

  // Helper: Check if karar türü is HAGB
  function isHAGB(kararTuru){
    var upper = (kararTuru || '').toUpperCase();
    return upper.indexOf('HAGB') !== -1 || 
           upper.indexOf('HÜKMÜN AÇIKLANMASININ GERİ BIRAKILMASI') !== -1 ||
           upper.indexOf('GERİ BIRAKILMASI') !== -1 ||
           upper.indexOf('GERİ BIRAK') !== -1 ||
           upper.indexOf('GERİ BIRAKILMASI') !== -1;
  }

  // Helper: Extract hapis duration from karar türü (in months/years)
  function extractHapisDuration(kararTuru){
    if(!kararTuru) return 0;
    
    var str = String(kararTuru).toUpperCase();
    var months = 0;
    
    // Look for patterns like "2 YIL", "6 AY", "1 YIL 3 AY"
    var yilMatch = str.match(/(\d+)\s*YIL/);
    var ayMatch = str.match(/(\d+)\s*AY/);
    
    if(yilMatch){
      months += parseInt(yilMatch[1]) * 12;
    }
    if(ayMatch){
      months += parseInt(ayMatch[1]);
    }
    
    return months;
  }

  // Helper: Extract para amount from karar türü
  function extractParaAmount(kararTuru){
    if(!kararTuru) return 0;
    
    var str = String(kararTuru).toUpperCase();
    
    // Look for patterns like "1000 TL", "5.000 TL", "10000"
    var match = str.match(/(\d+(?:[.,]\d+)*)\s*(?:TL|TRY|LIRA)?/);
    
    if(match){
      var numStr = match[1].replace(/[.,]/g, '');
      return parseInt(numStr) || 0;
    }
    
    return 0;
  }

  // Letter to column index (A=0, B=1, etc.)
  function letterToIndex(letter){
    var upper = String(letter).toUpperCase();
    var code = upper.charCodeAt(0);
    return code - 65;
  }

  // Read file as ArrayBuffer
  function readAsArrayBuffer(file){
    return new Promise(function(resolve, reject){
      if(file.arrayBuffer){
        file.arrayBuffer().then(resolve).catch(reject);
        return;
      }
      var reader = new FileReader();
      reader.onload = function(e){ resolve(e.target.result); };
      reader.onerror = function(){ reject(new Error('Dosya okunamadı')); };
      reader.readAsArrayBuffer(file);
    });
  }

  // Read workbook and return rows
  function readWorkbook(file){
    return readAsArrayBuffer(file).then(function(data){
      if(!window.XLSX || !XLSX.read){
        throw new Error('XLSX kütüphanesi yüklenemedi.');
      }
      var wb = XLSX.read(data, {type: 'array'});
      var ws = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_json(ws, {header: 1, raw: false});
    });
  }

  // Validate B3 cell contains "KARAR DEFTERİ"
  function validateKararDefteri(rows){
    // B3 means row index 2 (0-based), column index 1 (B)
    if(!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, B3 hücresi bulunamadı.'};
    }
    var row3 = rows[2]; // 0-based index 2 = row 3
    if(!row3 || row3.length < 2){
      return {valid: false, message: 'B3 hücresi boş.'};
    }
    var b3Value = String(row3[1] || '').toUpperCase().trim();
    if(b3Value.indexOf('KARAR DEFTERİ') === -1){
      return {valid: false, message: 'B3 hücresinde "KARAR DEFTERİ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Validate Kesinleştirme ve İnfaza Verme Kontrolü file
  function validateKesinlestirmeKontrol(rows){
    // D3 should contain "KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ"
    if(!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, D3 hücresi bulunamadı.'};
    }
    var row3 = rows[2]; // 0-based index 2 = row 3
    if(!row3 || row3.length < 4){ // D = index 3
      return {valid: false, message: 'D3 hücresi boş.'};
    }
    var d3Value = String(row3[3] || '').toUpperCase().trim();
    if(d3Value.indexOf('KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ') === -1){
      return {valid: false, message: 'D3 hücresinde "KESİNLEŞTİRME VE İNFAZA VERME KONTROLÜ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Validate İnfaza Geç Verilenler Kontrolü file
  function validateInfazGecVerilenler(rows){
    // D3 should contain "İNFAZA GEÇ VERİLENLERİN KONTROLÜ"
    if(!rows || rows.length < 3){
      return {valid: false, message: 'Dosya çok kısa, D3 hücresi bulunamadı.'};
    }
    var row3 = rows[2]; // 0-based index 2 = row 3
    if(!row3 || row3.length < 4){ // D = index 3
      return {valid: false, message: 'D3 hücresi boş.'};
    }
    var d3Value = String(row3[3] || '').toUpperCase().trim();
    if(d3Value.indexOf('İNFAZA GEÇ VERİLENLERİN KONTROLÜ') === -1){
      return {valid: false, message: 'D3 hücresinde "İNFAZA GEÇ VERİLENLERİN KONTROLÜ" bulunamadı. Lütfen doğru dosyayı yükleyin.'};
    }
    return {valid: true};
  }

  // Extract data from Kesinleştirme Kontrolü file
  // Columns: C=Esas No, F=Karar No, H=Karar Tarihi, J=Karar Türü, L=Kesinleşme Tarihi, 
  //          M=Kesinleştirme İşlem Tarihi, N=Gecikme Süresi, O=İnfaza Veriliş Tarihi, 
  //          Q=İnfaza Gecikme Süresi, R=Açıklama
  function extractKesinlestirmeData(rows){
    var cIdx = letterToIndex('C'); // Esas No
    var fIdx = letterToIndex('F'); // Karar No
    var hIdx = letterToIndex('H'); // Karar Tarihi
    var jIdx = letterToIndex('J'); // Karar Türü ve Mahiyeti
    var lIdx = letterToIndex('L'); // Kesinleşme Tarihi
    var mIdx = letterToIndex('M'); // Kesinleştirme İşlem Tarihi
    var nIdx = letterToIndex('N'); // Kesinleştirme Gecikme Süresi
    var oIdx = letterToIndex('O'); // İnfaza Veriliş Tarihi
    var qIdx = letterToIndex('Q'); // İnfaza Gecikme Süresi
    var rIdx = letterToIndex('R'); // Açıklama
    
    var extracted = [];
    
    // Data starts from row 12 (index 11)
    for(var i = 11; i < rows.length; i++){
      var row = rows[i];
      if(!row) continue;
      
      var esasNo = row[cIdx];
      
      // Skip if Esas No is empty
      if(!esasNo || String(esasNo).trim() === '') continue;
      
      // Skip if this looks like a header row (contains "Esas No" or similar header text)
      var esasNoStr = String(esasNo).trim().toUpperCase();
      if(esasNoStr.indexOf('ESAS') !== -1 || esasNoStr.indexOf('NO') !== -1) continue;
      
      var kararNo = row[fIdx];
      var kararTarihi = row[hIdx];
      
      extracted.push({
        esasNo: String(esasNo).trim(),
        kararNo: kararNo ? String(kararNo).trim() : '',
        kararTarihi: kararTarihi ? String(kararTarihi).trim() : '',
        kararTuruMahiyet: row[jIdx] ? String(row[jIdx]).trim() : '',
        kesinlesmeTarihi: row[lIdx] ? String(row[lIdx]).trim() : '',
        kesinlestirmeIslemTarihi: row[mIdx] ? String(row[mIdx]).trim() : '',
        kesinlestirmeGecikme: row[nIdx] ? String(row[nIdx]).trim() : '',
        infazTarihi: row[oIdx] ? String(row[oIdx]).trim() : '',
        infazGecikme: row[qIdx] ? String(row[qIdx]).trim() : '',
        aciklama: row[rIdx] ? String(row[rIdx]).trim() : ''
      });
    }
    
    return extracted;
  }

  // Extract data from Karar Defteri (Esas No, Karar No, Karar Tarihi)
  // Assuming columns like in karar.php: B=Esas No, C=Karar No, E=Karar Tarihi
  function extractKararData(rows){
    var bIdx = letterToIndex('B'); // Esas No
    var cIdx = letterToIndex('C'); // Karar No
    var eIdx = letterToIndex('E'); // Karar Tarihi
    
    var extracted = [];
    
    // Skip header rows (assuming data starts after row with headers)
    // We'll start from row 1 (index 1) and filter non-empty B, C, E
    for(var i = 1; i < rows.length; i++){
      var row = rows[i];
      if(!row) continue;
      
      var esasNo = row[bIdx];
      var kararNo = row[cIdx];
      var kararTarihi = row[eIdx];
      
      // Only include rows where B, C, E are all non-empty
      if(esasNo && String(esasNo).trim() !== '' &&
         kararNo && String(kararNo).trim() !== '' &&
         kararTarihi && String(kararTarihi).trim() !== ''){
        extracted.push({
          esasNo: String(esasNo).trim(),
          kararNo: String(kararNo).trim(),
          kararTarihi: String(kararTarihi).trim()
        });
      }
    }
    
    return extracted;
  }

  // Extract data from İnfaza Geç Verilenler file
  // Columns: C=Hâkim, F=Esas No, H=İnfaz No, K=Ceza, L=Kesinleştirme İşlemi,
  //          M=Kesinleşme Tarihi, O=İnfaza Verildiği Tarih, P=Gecikme
  // Also extracts metadata: G5=Birim Adı, G6=Denetim Aralığı
  function extractInfazGecData(rows){
    var cIdx = letterToIndex('C'); // Hâkim
    var fIdx = letterToIndex('F'); // Esas No
    var gIdx = letterToIndex('G'); // For metadata
    var hIdx = letterToIndex('H'); // İnfaz No
    var kIdx = letterToIndex('K'); // Ceza
    var lIdx = letterToIndex('L'); // Kesinleştirme İşlemi
    var mIdx = letterToIndex('M'); // Kesinleşme Tarihi
    var oIdx = letterToIndex('O'); // İnfaza Verildiği Tarih
    var pIdx = letterToIndex('P'); // Gecikme
    
    // Extract metadata from G5 and G6
    var birimAdi = '';
    var denetimAraligi = '';
    if(rows.length > 4 && rows[4] && rows[4][gIdx]){ // Row 5 (index 4)
      birimAdi = String(rows[4][gIdx]).trim();
    }
    if(rows.length > 5 && rows[5] && rows[5][gIdx]){ // Row 6 (index 5)
      denetimAraligi = String(rows[5][gIdx]).trim();
    }
    
    var extracted = [];
    
    // Data starts from row 12 (index 11)
    for(var i = 11; i < rows.length; i++){
      var row = rows[i];
      if(!row) continue;
      
      var esasNo = row[fIdx];
      
      // Skip if Esas No is empty
      if(!esasNo || String(esasNo).trim() === '') continue;
      
      // Skip if this looks like a header row
      var esasNoStr = String(esasNo).trim().toUpperCase();
      if(esasNoStr.indexOf('ESAS') !== -1 || esasNoStr.indexOf('NO') !== -1) continue;
      
      extracted.push({
        hakim: row[cIdx] ? String(row[cIdx]).trim() : '',
        esasNo: String(esasNo).trim(),
        infazNo: row[hIdx] ? String(row[hIdx]).trim() : '',
        ceza: row[kIdx] ? String(row[kIdx]).trim() : '',
        kesinlestirmeIslemi: row[lIdx] ? String(row[lIdx]).trim() : '',
        kesinlesmeTarihi: row[mIdx] ? String(row[mIdx]).trim() : '',
        infazVerilisTarihi: row[oIdx] ? String(row[oIdx]).trim() : '',
        gecikme: row[pIdx] ? String(row[pIdx]).trim() : ''
      });
    }
    
    return {
      data: extracted,
      metadata: {
        birimAdi: birimAdi,
        denetimAraligi: denetimAraligi
      }
    };
  }

  // Handle Karar Defteri files (Step 1) or Kesinleştirme Kontrolü files (Step 2)
  function handleKararFiles(files){
    if(!files || files.length === 0) return;
    
    var statusDiv = $('#kararStatus');
    if(statusDiv){
      statusDiv.innerHTML = '<div class="muted">Dosyalar işleniyor...</div>';
    }

    var allData = [];
    var filePromises = [];
    
    for(var i = 0; i < files.length; i++){
      filePromises.push(readWorkbook(files[i]));
    }

    // Check which step we're on
    var isStep1 = !window.__kesinlestirmeData.step1Complete;
    var isStep2 = window.__kesinlestirmeData.step1Complete && !window.__kesinlestirmeData.step2Complete;
    var isStep3 = window.__kesinlestirmeData.step1Complete && window.__kesinlestirmeData.step2Complete && !window.__kesinlestirmeData.step3Complete;

    Promise.all(filePromises).then(function(allRows){
      if(isStep1){
        // Step 1: Process Karar Defteri
        for(var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateKararDefteri(rows);
          
          if(!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }
          
          var data = extractKararData(rows);
          allData = allData.concat(data);
        }
        
        window.__kesinlestirmeData.kararDefteri = allData;
        window.__kesinlestirmeData.step1Complete = true;
        
        processStep1Success(allData, statusDiv);
        
      } else if(isStep2) {
        // Step 2: Process Kesinleştirme Kontrolü
        for(var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateKesinlestirmeKontrol(rows);
          
          if(!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }
          
          var data = extractKesinlestirmeData(rows);
          allData = allData.concat(data);
        }
        
        window.__kesinlestirmeData.kesinlestirmeKontrol = allData;
        window.__kesinlestirmeData.step2Complete = true;
        
        processStep2Success(allData, statusDiv);
        
      } else if(isStep3) {
        // Step 3: Process İnfaza Geç Verilenler
        for(var f = 0; f < allRows.length; f++){
          var rows = allRows[f];
          var validation = validateInfazGecVerilenler(rows);
          
          if(!validation.valid){
            throw new Error(files[f].name + ': ' + validation.message);
          }
          
          var result = extractInfazGecData(rows);
          allData = allData.concat(result.data);
          
          // Store metadata from first file
          if(f === 0 && result.metadata){
            window.__kesinlestirmeData.metadata = result.metadata;
          }
        }
        
        window.__kesinlestirmeData.infazGecVerilenler = allData;
        window.__kesinlestirmeData.step3Complete = true;
        
        processStep3Success(allData, statusDiv);
      }
      
    }).catch(function(err){
      if(statusDiv){
        statusDiv.innerHTML = '<div class="alert alert-danger" style="margin:0;padding:8px;">' +
          '<span class="material-symbols-rounded alert-icon">error</span>' +
          '<div class="alert-body" style="padding:0;">' +
          '<strong>Hata!</strong> ' + err.message +
          '</div></div>';
      }
      
      if(window.toast){
        window.toast({
          type: 'error',
          title: 'Yükleme Hatası',
          body: err.message,
          delay: 5000
        });
      }
    });
  }

  // Process Step 1 success
  function processStep1Success(allData, statusDiv){
    if(statusDiv){
      statusDiv.innerHTML = '<div class="alert alert-success" style="margin:0;padding:8px;">' +
        '<span class="material-symbols-rounded alert-icon">check_circle</span>' +
        '<div class="alert-body" style="padding:0;">' +
        '<b>1. Adım Başarılı!</b> ' + allData.length + ' kayıt yüklendi.' +
        '</div></div>';
    }
    
    // Update TODO list
    updateTodoList();
    
    // Close reminder alert
    var reminderHost = $('#kesinlestirmeReminderHost');
    if(reminderHost){
      reminderHost.innerHTML = '';
    }
    
    // Update panel heading and description
    var panelHead = document.querySelector('#kararDefteriPanel .panel-head strong');
    if(panelHead){
      panelHead.innerHTML = '2. Adım: Kesinleşme ve İnfaza Verme Kontrolü';
    }
    var panelDesc = document.querySelector('#kararDefteriPanel .panel-body > p.muted');
    if(panelDesc){
      panelDesc.innerHTML = 'Tarafınıza gönderilen Kesinleştirme ve İnfaza Verme Kontrolü EXCEL dosyasını yükleyiniz.';
    }
    
    // Show step 2 alert after TODO list
    var todoContainer = $('#todoListContainer');
    if(todoContainer && window.showAlert){
      var step2AlertHost = document.createElement('div');
      step2AlertHost.id = 'step2AlertHost';
      todoContainer.insertAdjacentElement('afterend', step2AlertHost);
      
      window.showAlert(step2AlertHost, {
        type: 'warning',
        title: '2. Adım: Kesinleşme ve İnfaza Verme Kontrolü Dosyası',
        message: 'Kesinleştirme ve İnfaza Verme Kontrolü dosyasını şimdi yükleyebilirsiniz.',
        dismissible: true
      });
    }
    
    // Show next steps
    var additionalSteps = $('#additionalSteps');
    if(additionalSteps){
      additionalSteps.style.display = 'block';
    }
    
    // Toast notification
    if(window.toast){
      window.toast({
        type: 'success',
        title: 'Karar Defteri Yüklendi',
        body: allData.length + ' kayıt başarıyla işlendi.',
        delay: 3000
      });
    }
  }

  // Increment JQ counter
  function incrementJQCounter(){
    // jQuery ile sayacı arttır
    if(window.jQuery && typeof window.jQuery.getJSON === 'function'){
      window.jQuery.getJSON('https://sayac.657.com.tr/arttirkarar', function(response){
        try {
          var adetRaw = (response && typeof response.adet !== 'undefined') ? (response.adet * 1) : 0;
          if(window.toast){
            window.toast({
              type: 'success',
              title: 'Sayaç Güncellendi',
              body: 'İşlem sayacı başarıyla güncellendi: ' + adetRaw.toLocaleString('tr-TR'),
              delay: 3000
            });
          }
        } catch (e) {
          // Hata varsa görmezden gel
        }
      }).fail(function(){
        // Hata varsa görmezden gel
      });
    }
  }

  // Process Step 2 success
  function processStep2Success(allData, statusDiv){
    // Update TODO list
    updateTodoList();
    
    // Increment JQ counter
    incrementJQCounter();
    
    // Close step2AlertHost if exists
    var step2AlertHost = document.getElementById('step2AlertHost');
    if(step2AlertHost){
      step2AlertHost.remove();
    }
    
    // Create step 2 success alert below kararStatus
    var kararStatus = $('#kararStatus');
    if(kararStatus && window.showAlert){
      var step2SuccessHost = document.createElement('div');
      step2SuccessHost.id = 'step2SuccessHost';
      step2SuccessHost.style.marginTop = '12px';
      kararStatus.insertAdjacentElement('afterend', step2SuccessHost);
      
      window.showAlert(step2SuccessHost, {
        type: 'success',
        title: '2. Adım Başarılı!',
        message: allData.length + ' kayıt yüklendi.',
        dismissible: true
      });
    }
    
    // Update panel heading to "3. Adım"
    var panelHeading = document.querySelector('#kararDefteriPanel .panel-head strong');
    if(panelHeading){
      panelHeading.innerHTML = '3. Adım: İnfaza Geç Verilenler';
    }
    
    // Update panel description
    var panelDesc = document.querySelector('#kararDefteriPanel .panel-body > p.muted');
    if(panelDesc){
      panelDesc.innerHTML = 'Tarafınıza gönderilen İnfaza Geç Verilenler EXCEL dosyasını yükleyiniz.';
    }
    
    // Create step 3 instruction alert in step2AlertHost position
    var step3InstructionHost = document.createElement('div');
    step3InstructionHost.id = 'step3InstructionHost';
    step3InstructionHost.className = 'mb-3';
    
    // Insert after step2SuccessHost
    var step2Host = document.getElementById('step2SuccessHost');
    if(step2Host){
      step2Host.insertAdjacentElement('afterend', step3InstructionHost);
    }
    
    if(window.showAlert){
      window.showAlert(step3InstructionHost, {
        type: 'success',
        title: '3. Adıma Geçebilirsiniz',
        message: 'Artık İnfaza Geç Verilenler dosyasını yükleyebilirsiniz.',
        dismissible: true
      });
    }
    
    // Generate merged table with only step 2 data (step 1 kept in memory, not merged yet)
    generateMergedTableFromStep2Only();
    
    // Toast notification
    if(window.toast){
      window.toast({
        type: 'success',
        title: 'Kesinleştirme Kontrolü Yüklendi',
        body: allData.length + ' kayıt hafızaya alındı.',
        delay: 3000
      });
    }
  }

  // Process Step 3 success
  function processStep3Success(allData, statusDiv){
    // Update TODO list
    updateTodoList();
    
    // Close step3InstructionHost if exists
    var step3InstructionHost = document.getElementById('step3InstructionHost');
    if(step3InstructionHost){
      step3InstructionHost.remove();
    }
    
    // Create step 3 success alert below step2SuccessHost
    var step2Host = document.getElementById('step2SuccessHost');
    if(step2Host && window.showAlert){
      var step3SuccessHost = document.createElement('div');
      step3SuccessHost.id = 'step3SuccessHost';
      step3SuccessHost.style.marginTop = '12px';
      step2Host.insertAdjacentElement('afterend', step3SuccessHost);
      
      window.showAlert(step3SuccessHost, {
        type: 'success',
        title: '3. Adım Başarılı!',
        message: 'Tüm adımlar tamamlandı! Birleştirilmiş özet oluşturuluyor...',
        dismissible: true
      });
    }
    
    // Create "Kayıtları Ayıkla ve İndir" button
    var step3Host = document.getElementById('step3SuccessHost');
    if(step3Host){
      var filterButtonContainer = document.createElement('div');
      filterButtonContainer.id = 'filterButtonContainer';
      filterButtonContainer.style.marginTop = '12px';
      filterButtonContainer.style.textAlign = 'center';
      
      filterButtonContainer.innerHTML = '<button class="btn btn-primary" id="ayiklaIndirBtn" style="width:100%;">' +
        '<span class="material-symbols-rounded" style="vertical-align:middle;">filter_alt</span> ' +
        'Kayıtları Ayıkla ve İndir</button>';
      
      step3Host.insertAdjacentElement('afterend', filterButtonContainer);
      
      // Wire button event
      var ayiklaBtn = document.getElementById('ayiklaIndirBtn');
      if(ayiklaBtn){
        ayiklaBtn.addEventListener('click', function(){
          handleAyiklaIndir();
        });
      }
    }
    
    // Generate final merged table from all 3 steps
    generateFinalMergedTable();
    
    // Toast notification
    if(window.toast){
      window.toast({
        type: 'success',
        title: 'Tüm Veriler Yüklendi',
        body: 'Birleştirilmiş özet başarıyla oluşturuldu.',
        delay: 3000
      });
    }
  }

  // Calculate date difference in days
  function dateDiffInDays(date1Str, date2Str){
    if(!date1Str || !date2Str) return null;
    
    // Try to parse dates - handle common Turkish date formats
    var d1 = parseDate(date1Str);
    var d2 = parseDate(date2Str);
    
    if(!d1 || !d2) return null;
    
    var diffTime = d1.getTime() - d2.getTime();
    var diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Parse date from string (handles DD.MM.YYYY, DD/MM/YYYY, etc.)
  function parseDate(dateStr){
    if(!dateStr) return null;
    
    var str = String(dateStr).trim();
    
    // Try DD.MM.YYYY or DD/MM/YYYY
    var parts = str.split(/[./\-]/);
    if(parts.length === 3){
      var day = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      var year = parseInt(parts[2], 10);
      
      if(!isNaN(day) && !isNaN(month) && !isNaN(year)){
        return new Date(year, month, day);
      }
    }
    
    return null;
  }

  // Generate final merged table from all 3 steps
  function generateFinalMergedTable(){
    var step1Data = window.__kesinlestirmeData.kararDefteri; // {esasNo, kararNo, kararTarihi}
    var step2Data = window.__kesinlestirmeData.kesinlestirmeKontrol; // {esasNo, ...}
    var step3Data = window.__kesinlestirmeData.infazGecVerilenler; // {esasNo, ceza, kesinlesmeTarihi, infazVerilisTarihi, ...}
    
    var container = $('#resultsContainer');
    if(!container) return;

    // Create lookup maps for step1 data
    var step1Map = {};
    if(step1Data){
      for(var i = 0; i < step1Data.length; i++){
        var item = step1Data[i];
        step1Map[item.esasNo] = item;
      }
    }

    // Create lookup map for step3 data (to check if esasNo exists in step3)
    var step3Map = {};
    if(step3Data){
      for(var i = 0; i < step3Data.length; i++){
        var item = step3Data[i];
        step3Map[item.esasNo] = item;
      }
    }

    var mergedData = [];
    
    // First, add all data from Step 2
    if(step2Data && step2Data.length > 0){
      for(var i = 0; i < step2Data.length; i++){
        var s2 = step2Data[i]; // Kesinleştirme Kontrolü
        var s1 = step1Map[s2.esasNo]; // Karar Defteri
        
        // Karar No ve Karar Tarihi: Step1'den al, yoksa Step2'den
        var kararNo = s1 ? s1.kararNo : (s2.kararNo || '');
        var kararTarihi = s1 ? s1.kararTarihi : (s2.kararTarihi || '');
        
        // Karar Türü: Step2'den
        var kararTuru = s2.kararTuruMahiyet || '';
        
        // Kesinleşme Tarihi: Step2'den
        var kesinlesmeTarihi = s2.kesinlesmeTarihi || '';
        
        // Kesinleştirme İşlem Tarihi: Step2'den
        var kesinlestirmeIslemTarihi = s2.kesinlestirmeIslemTarihi || '';
        
        // Kesinleştirme Gecikme: Step2'den
        var kesinlestirmeGecikme = s2.kesinlestirmeGecikme || '';
        
        // İnfaza Veriliş Tarihi: Step2'den
        var infazTarihi = s2.infazTarihi || '';
        
        // İnfaza Gecikme: Step2'den
        var infazGecikme = s2.infazGecikme || '';
        
        mergedData.push({
          sira: i + 1,
          esasNo: s2.esasNo,
          kararNo: kararNo,
          kararTarihi: kararTarihi,
          kararTuru: kararTuru,
          kesinlesmeTarihi: kesinlesmeTarihi,
          kesinlestirmeIslemTarihi: kesinlestirmeIslemTarihi,
          kesinlestirmeGecikme: kesinlestirmeGecikme,
          infazTarihi: infazTarihi,
          infazGecikme: infazGecikme
        });
      }
    }
    
    // Then, add all data from Step 3
    if(step3Data && step3Data.length > 0){
      for(var i = 0; i < step3Data.length; i++){
        var s3 = step3Data[i]; // İnfaza Geç Verilenler
        var s1 = step1Map[s3.esasNo]; // Karar Defteri
        
        // Karar No ve Karar Tarihi: Step1'den al
        var kararNo = s1 ? s1.kararNo : '';
        var kararTarihi = s1 ? s1.kararTarihi : '';
        
        // Karar Türü: Step3'ten (Ceza)
        var kararTuru = s3.ceza || '';
        
        // Kesinleşme Tarihi: Step3'ten
        var kesinlesmeTarihi = s3.kesinlesmeTarihi || '';
        
        // Kesinleştirme İşlem Tarihi: Step3'ten (infazVerilisTarihi)
        var kesinlestirmeIslemTarihi = s3.infazVerilisTarihi || '';
        
        // Kesinleştirme İşleminde Gecikme Süresi: kesinlestirmeIslemTarihi - kesinlesmeTarihi - 60
        var kesinlestirmeGecikme = '';
        if(kesinlestirmeIslemTarihi && kesinlesmeTarihi){
          var diff = dateDiffInDays(kesinlestirmeIslemTarihi, kesinlesmeTarihi);
          if(diff !== null){
            var gecikme = diff - 60;
            kesinlestirmeGecikme = gecikme > 0 ? String(gecikme) : '0';
          }
        }
        
        // İnfaza Veriliş Tarihi: Step3'ten
        var infazTarihi = s3.infazVerilisTarihi || '';
        
        // İnfaza Vermede Gecikme Süresi: infazTarihi - kesinlesmeTarihi - 60
        var infazGecikme = '';
        if(infazTarihi && kesinlesmeTarihi){
          var diff = dateDiffInDays(infazTarihi, kesinlesmeTarihi);
          if(diff !== null){
            var gecikme = diff - 60;
            infazGecikme = gecikme > 0 ? String(gecikme) : '0';
          }
        }
        
        mergedData.push({
          sira: mergedData.length + 1,
          esasNo: s3.esasNo,
          kararNo: kararNo,
          kararTarihi: kararTarihi,
          kararTuru: kararTuru,
          kesinlesmeTarihi: kesinlesmeTarihi,
          kesinlestirmeIslemTarihi: kesinlestirmeIslemTarihi,
          kesinlestirmeGecikme: kesinlestirmeGecikme,
          infazTarihi: infazTarihi,
          infazGecikme: infazGecikme
        });
      }
    }
    
    // Sort by kesinlestirmeGecikme descending (büyükten küçüğe)
    mergedData.sort(function(a, b){
      var aVal = parseInt(a.kesinlestirmeGecikme) || 0;
      var bVal = parseInt(b.kesinlestirmeGecikme) || 0;
      return bVal - aVal; // Descending
    });
    
    // Re-number SIRA after sorting
    for(var i = 0; i < mergedData.length; i++){
      mergedData[i].sira = i + 1;
    }
    
    // Store in global data
    window.__kesinlestirmeData.mergedData = mergedData;

    // Render paginated table
    renderFinalMergedTable(mergedData);
  }

  // Render final merged table with pagination
  function renderFinalMergedTable(mergedData){
    var container = $('#resultsContainer');
    if(!container) return;

    // Pagination settings
    var itemsPerPage = 20;
    var currentPage = 1;
    var totalPages = Math.ceil(mergedData.length / itemsPerPage);

    function renderTable(page){
      var html = '<section class="panel" id="mergedResultPanel">';
      html += '<div class="panel-head">';
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      html += '<h3 style="margin:0;flex:1;">Birleştirilmiş Özet</h3>';
      html += '<button class="btn btn-sm btn-success" onclick="window.kesinlestirmeExportToExcel()" title="Excel\'e Aktar">';
      html += '<i class="fa fa-file-excel-o"></i> Excel İndir</button>';
      html += '</div>';
      html += '</div>'; // .panel-head

      // Top pagination controls
      html += '<div style="padding:12px;background:var(--bg-secondary,#f5f5f5);border-bottom:1px solid var(--border-color,#ddd);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div><strong>Sayfa ' + page + ' / ' + totalPages + '</strong> &nbsp; ';
      html += 'Gösterilen: ' + ((page - 1) * itemsPerPage + 1) + ' - ' + Math.min(page * itemsPerPage, mergedData.length) + ' / ' + mergedData.length + '</div>';
      html += '<div>';
      html += '<button class="btn btn-sm btn-default" id="prevPageTop" ' + (page === 1 ? 'disabled' : '') + '>Önceki</button> ';
      html += '<button class="btn btn-sm btn-default" id="nextPageTop" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      html += '<div class="table-responsive">';
      html += '<table class="table table-striped table-hover mb-0">';
      html += '<thead>';
      html += '<tr>';
      html += '<th>SIRA</th>';
      html += '<th>Esas No</th>';
      html += '<th>Karar No</th>';
      html += '<th>Karar Tarihi</th>';
      html += '<th>Karar Türü</th>';
      html += '<th>Kesinleşme Tarihi</th>';
      html += '<th>Kesinleştirme İşlem Tarihi</th>';
      html += '<th>Kesinleştirme İşleminde Gecikme Süresi</th>';
      html += '<th>İnfaza Veriliş Tarihi</th>';
      html += '<th>İnfaza Vermede Gecikme Süresi</th>';
      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';

      var startIdx = (page - 1) * itemsPerPage;
      var endIdx = Math.min(startIdx + itemsPerPage, mergedData.length);

      // Render rows for current page
      for(var i = startIdx; i < endIdx; i++){
        var row = mergedData[i];
        
        html += '<tr>';
        html += '<td>' + row.sira + '</td>';
        html += '<td>' + (row.esasNo || '') + '</td>';
        html += '<td>' + (row.kararNo || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kararTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kararTuru || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeGecikme || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazGecikme || '<span class="muted">-</span>') + '</td>';
        html += '</tr>';
      }

      html += '</tbody>';
      html += '</table>';
      html += '</div>'; // .table-responsive

      // Bottom pagination controls
      html += '<div style="padding:12px;background:var(--bg-secondary,#f5f5f5);border-top:1px solid var(--border-color,#ddd);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<div><strong>Sayfa ' + page + ' / ' + totalPages + '</strong></div>';
      html += '<div>';
      html += '<button class="btn btn-sm btn-default" id="prevPageBottom" ' + (page === 1 ? 'disabled' : '') + '>Önceki</button> ';
      html += '<button class="btn btn-sm btn-default" id="nextPageBottom" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki</button>';
      html += '</div>';
      html += '</div>';
      html += '</div>';

      html += '</section>';

      container.innerHTML = html;

      // Wire up pagination buttons
      var prevTop = document.getElementById('prevPageTop');
      var nextTop = document.getElementById('nextPageTop');
      var prevBottom = document.getElementById('prevPageBottom');
      var nextBottom = document.getElementById('nextPageBottom');

      if(prevTop){
        prevTop.onclick = function(){ if(currentPage > 1){ currentPage--; renderTable(currentPage); } };
      }
      if(nextTop){
        nextTop.onclick = function(){ if(currentPage < totalPages){ currentPage++; renderTable(currentPage); } };
      }
      if(prevBottom){
        prevBottom.onclick = function(){ if(currentPage > 1){ currentPage--; renderTable(currentPage); } };
      }
      if(nextBottom){
        nextBottom.onclick = function(){ if(currentPage < totalPages){ currentPage++; renderTable(currentPage); } };
      }
    }

    renderTable(currentPage);
  }

  // Generate merged table from Step 2 data only
  function generateMergedTableFromStep2Only(){
    var kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;
    
    if(!kesinlestirmeData || kesinlestirmeData.length === 0) return;

    var container = $('#resultsContainer');
    if(!container) return;

    // Pagination settings
    var itemsPerPage = 20;
    var currentPage = 1;
    var totalPages = Math.ceil(kesinlestirmeData.length / itemsPerPage);

    function renderTable(page){
      var html = '<section class="panel" id="mergedResultPanel">';
      html += '<div class="panel-head">';
      html += '<div style="display:flex;align-items:center;gap:8px;">';
      html += '<span class="material-symbols-rounded">table_chart</span>';
      html += '<strong>Birleştirilmiş Özet</strong>';
      html += '<span class="muted" style="margin-left:8px;">(' + kesinlestirmeData.length + ' kayıt)</span>';
      html += '</div>';
      html += '<div class="title-actions">';
      html += '<button class="btn ghost" id="exportMergedExcel">';
      html += '<span class="material-symbols-rounded">download</span> Excel İndir';
      html += '</button>';
      html += '</div>';
      html += '</div>';
      html += '<div class="panel-body">';
      
      // Pagination controls - top
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:12px;background:var(--bg-secondary,#f5f5f5);border-radius:4px;">';
      html += '<div class="muted">Sayfa ' + page + ' / ' + totalPages + '</div>';
      html += '<div style="display:flex;gap:4px;">';
      html += '<button class="btn ghost" id="prevPage" ' + (page === 1 ? 'disabled' : '') + '>◀ Önceki</button>';
      html += '<button class="btn ghost" id="nextPage" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki ▶</button>';
      html += '</div>';
      html += '</div>';
      
      html += '<div class="table-wrap">';
      html += '<table class="table" style="width:100%;border-collapse:collapse;">';
      html += '<thead><tr>';
      html += '<th>SIRA</th>';
      html += '<th>ESAS NO</th>';
      html += '<th>KARAR NO</th>';
      html += '<th>KARAR TARİHİ</th>';
      html += '<th>KARAR TÜRÜ VE MAHİYETİ<br><small>(Mahkûmiyet-HAGB/Erteleme) (Para/Hapis Cezası)</small></th>';
      html += '<th>KESİNLEŞME TARİHİ</th>';
      html += '<th>KESİNLEŞTİRME İŞLEM TARİHİ</th>';
      html += '<th>KESİNLEŞTİRME İŞLEMİNDE GECİKME SÜRESİ<br><small>(Gün) ve AÇIKLAMA</small></th>';
      html += '<th>İNFAZA VERİLİŞ TARİHİ</th>';
      html += '<th>İNFAZA VERMEDE GECİKME SÜRESİ<br><small>(Gün)</small></th>';
      html += '</tr></thead>';
      html += '<tbody>';

      // Calculate range for current page
      var startIdx = (page - 1) * itemsPerPage;
      var endIdx = Math.min(startIdx + itemsPerPage, kesinlestirmeData.length);

      // Render rows for current page
      for(var i = startIdx; i < endIdx; i++){
        var row = kesinlestirmeData[i];
        
        // Combine gecikme süre and açıklama
        var gecikmeText = row.kesinlestirmeGecikme || '-';
        if(row.aciklama){
          gecikmeText += (gecikmeText !== '-' ? ' - ' : '') + row.aciklama;
        }

        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>'; // Display row number starting from 1
        html += '<td>' + (row.esasNo || '') + '</td>';
        html += '<td>' + (row.kararNo || '') + '</td>';
        html += '<td>' + (row.kararTarihi || '') + '</td>';
        html += '<td>' + (row.kararTuruMahiyet || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlesmeTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.kesinlestirmeIslemTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + gecikmeText + '</td>';
        html += '<td>' + (row.infazTarihi || '<span class="muted">-</span>') + '</td>';
        html += '<td>' + (row.infazGecikme || '<span class="muted">-</span>') + '</td>';
        html += '</tr>';
      }

      html += '</tbody></table>';
      html += '</div>';
      
      // Pagination controls - bottom
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding:12px;background:var(--bg-secondary,#f5f5f5);border-radius:4px;">';
      html += '<div class="muted">Gösterilen: ' + (startIdx + 1) + ' - ' + endIdx + ' / ' + kesinlestirmeData.length + '</div>';
      html += '<div style="display:flex;gap:4px;">';
      html += '<button class="btn ghost" id="prevPageBottom" ' + (page === 1 ? 'disabled' : '') + '>◀ Önceki</button>';
      html += '<button class="btn ghost" id="nextPageBottom" ' + (page === totalPages ? 'disabled' : '') + '>Sonraki ▶</button>';
      html += '</div>';
      html += '</div>';
      
      html += '</div>';
      html += '</section>';

      container.innerHTML = html;
      
      // Wire pagination buttons
      var prevBtn = $('#prevPage');
      var nextBtn = $('#nextPage');
      var prevBtnBottom = $('#prevPageBottom');
      var nextBtnBottom = $('#nextPageBottom');
      
      if(prevBtn){
        prevBtn.addEventListener('click', function(){
          if(currentPage > 1){
            currentPage--;
            renderTable(currentPage);
          }
        });
      }
      
      if(nextBtn){
        nextBtn.addEventListener('click', function(){
          if(currentPage < totalPages){
            currentPage++;
            renderTable(currentPage);
          }
        });
      }
      
      if(prevBtnBottom){
        prevBtnBottom.addEventListener('click', function(){
          if(currentPage > 1){
            currentPage--;
            renderTable(currentPage);
          }
        });
      }
      
      if(nextBtnBottom){
        nextBtnBottom.addEventListener('click', function(){
          if(currentPage < totalPages){
            currentPage++;
            renderTable(currentPage);
          }
        });
      }
      
      // Wire export button
      var exportBtn = $('#exportMergedExcel');
      if(exportBtn){
        exportBtn.addEventListener('click', function(){
          exportMergedToExcel();
        });
      }

      // Enable drag scroll if available
      if(window.enableTableWrapDrag){
        window.enableTableWrapDrag();
      }
    }

    // Store merged data (all records)
    var mergedData = [];
    for(var i = 0; i < kesinlestirmeData.length; i++){
      var row = kesinlestirmeData[i];
      mergedData.push({
        sira: i + 12, // Row number starts from 12
        esasNo: row.esasNo,
        kararNo: row.kararNo,
        kararTarihi: row.kararTarihi,
        kararTuruMahiyet: row.kararTuruMahiyet || '',
        kesinlesmeTarihi: row.kesinlesmeTarihi || '',
        kesinlestirmeIslemTarihi: row.kesinlestirmeIslemTarihi || '',
        kesinlestirmeGecikme: row.kesinlestirmeGecikme || '',
        infazTarihi: row.infazTarihi || '',
        infazGecikme: row.infazGecikme || '',
        aciklama: row.aciklama || ''
      });
    }
    window.__kesinlestirmeData.mergedData = mergedData;

    // Render first page
    renderTable(currentPage);
  }

  // Merge Karar Defteri with Kesinleştirme Kontrolü and generate table
  function mergeAndGenerateTable(){
    var kararData = window.__kesinlestirmeData.kararDefteri;
    var kesinlestirmeData = window.__kesinlestirmeData.kesinlestirmeKontrol;
    
    if(!kararData || !kesinlestirmeData) return;
    
    // Create lookup map from kesinlestirme data (by Esas No)
    var kesinlestirmeMap = {};
    for(var i = 0; i < kesinlestirmeData.length; i++){
      var item = kesinlestirmeData[i];
      kesinlestirmeMap[item.esasNo] = item;
    }
    
    // Generate merged table
    generateMergedTable();
  }

  // Wire up Karar Defteri upload
  function wireKararUpload(){
    var input = $('#kararInput');
    var dropZone = $('#dropZoneKarar');
    
    if(input){
      input.addEventListener('change', function(e){
        handleKararFiles(e.target.files);
      });
    }
    
    if(dropZone){
      // Prevent browser default behavior
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(e){
          e.preventDefault();
          e.stopPropagation();
        }, false);
      });
      
      // Visual feedback
      ['dragenter', 'dragover'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(){
          dropZone.classList.add('drag-over');
        }, false);
      });
      
      ['dragleave', 'drop'].forEach(function(eventName){
        dropZone.addEventListener(eventName, function(){
          dropZone.classList.remove('drag-over');
        }, false);
      });
      
      // Handle drop
      dropZone.addEventListener('drop', function(e){
        var files = e.dataTransfer.files;
        if(files && files.length > 0){
          handleKararFiles(files);
        }
      }, false);
      
      // Click to open file selector
      dropZone.addEventListener('click', function(){
        if(input) input.click();
      });
    }
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    // Show reminder alert
    var reminderHost = $('#kesinlestirmeReminderHost');
    if(reminderHost && window.showAlert){
      window.showAlert(reminderHost, {
        type: 'info',
        title: 'Dikkat',
        message: 'Bu sayfa ile kesinleşme ve infaz sürelerini kontrol edebilirsiniz. İlk olarak UYAP > Raporlar > Defterler > Karar Defteri dosyasını yükleyin.',
        dismissible: true
      });
    }
    
    // Initialize TODO list
    updateTodoList();
    
    // Wire upload handlers
    wireKararUpload();
  });

  // Expose export function globally
  window.kesinlestirmeExportToExcel = exportMergedToExcel;

})();
