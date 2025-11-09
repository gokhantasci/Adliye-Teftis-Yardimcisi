<?php
declare(strict_types=1);

@ini_set('display_errors','0');
@ini_set('zlib.output_compression','Off');
if (function_exists('ob_get_level')) { while (ob_get_level()>0) { @ob_end_clean(); } }

// --- CORS (preflight ve cross-origin POST için) ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Vary: Origin');
  header('Access-Control-Allow-Credentials: false');
}
$reqMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($reqMethod === 'OPTIONS') {
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
  header('Access-Control-Max-Age: 600');
  http_response_code(204);
  exit;
}

function jerr(int $code, string $msg){
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  // Basit hata kaydı (kritik değil)
  if ($code >= 400) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $m  = $_SERVER['REQUEST_METHOD'] ?? '?';
    @error_log('[iddianame_writer] '.$code.' '.$msg.' ip='.$ip.' method='.$m);
  }
  echo json_encode(['ok'=>false,'reason'=>$msg], JSON_UNESCAPED_UNICODE);
  exit;
}

// Health probe
if (isset($_GET['ping'])) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode([
    'ok'        => true,
    'cwd'       => getcwd(),
    'script'    => __FILE__,
    'temp'      => sys_get_temp_dir(),
    'hasZip'    => class_exists('ZipArchive'),
    'tplExists' => is_file(__DIR__.'/../data/iddianame.docx'),
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// ---------- Input (defensive)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
// Bazı sunucularda redirect sonrası method GET'e düşebiliyor; bu durumda yardımcı mesaj verelim
if ($method !== 'POST' && !isset($_GET['ping'])) {
  header('Allow: POST, OPTIONS');
  // İstemci tarafında POST gönderildiğini sanıp burada GET görürsek muhtemel sebep: 301/302 redirect veya servis arası proxy.
  $hint = 'Sadece POST kabul edilir (method='.$method.'). Olası neden: redirect POST->GET (örn. URL yeniden yazımı). Sağlık kontrolü için ?ping=1 kullanın.';
  jerr(405, $hint);
}
$ctype  = $_SERVER['CONTENT_TYPE']    ?? '';
$raw    = file_get_contents('php://input') ?: '';
$data   = null;

if ($raw !== '') { $data = json_decode($raw, true); }
if (!is_array($data) && $raw !== '' && stripos($ctype, 'application/x-www-form-urlencoded') !== false) {
  parse_str($raw, $formArr);
  if (isset($formArr['payload'])) {
    $data = json_decode((string)$formArr['payload'], true);
  } elseif (isset($formArr['rows'])) {
    $data = [
      'birimAdi'       => $formArr['birimAdi']       ?? '',
      'denetimAraligi' => $formArr['denetimAraligi'] ?? '',
      'rows'           => json_decode((string)$formArr['rows'], true)
    ];
  }
}
if (!is_array($data) && !empty($_POST)) {
  if (isset($_POST['payload'])) {
    $data = json_decode((string)$_POST['payload'], true);
  } elseif (isset($_POST['rows'])) {
    $data = [
      'birimAdi'       => $_POST['birimAdi']       ?? '',
      'denetimAraligi' => $_POST['denetimAraligi'] ?? '',
      'rows'           => json_decode((string)$_POST['rows'], true)
    ];
  }
}
if (!is_array($data)) {
  jerr(400, 'Geçersiz JSON (method='.$method.', ctype='.($ctype ?: 'yok').', rawLen='.strlen($raw).')');
}

$rows  = $data['rows'] ?? null;
$birim = (string)($data['birimAdi'] ?? '');
if (!is_array($rows)) jerr(400,'rows alanı eksik veya hatalı.');

// ---------- Template / working ----------
$tplPath = __DIR__ . '/../data/iddianame.docx';
if (!is_file($tplPath)) jerr(404,'Şablon bulunamadı: /data/iddianame.docx');
if (!class_exists('ZipArchive')) jerr(500,'PHP ZipArchive eklentisi yok.');

$tmpBase = is_writable(sys_get_temp_dir()) ? sys_get_temp_dir() : (__DIR__.'/../data');
$tmpFile = tempnam($tmpBase, 'idd_');
if (!$tmpFile) jerr(500,'Geçici dosya oluşturulamadı.');
$outDocx = $tmpFile . '.docx';
if (!copy($tplPath, $outDocx)) jerr(500,'Şablon kopyalanamadı.');

$zip = new ZipArchive();
if ($zip->open($outDocx) !== true) jerr(500,'DOCX açılamadı (Zip).');

$xmlPath = 'word/document.xml';
$xml = $zip->getFromName($xmlPath);
if ($xml === false) { $zip->close(); jerr(500,'word/document.xml yok.'); }

// Yerine koymalarda metni güvenli hale getir
$xmlEnt = static function(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8'); };
// TR büyük harfe çevir (i/ı, ö/Ö vb.)
function tr_upper(string $s): string {
  $s = strtr($s, [
    'i'=>'İ','ı'=>'I','ğ'=>'Ğ','ü'=>'Ü','ş'=>'Ş','ö'=>'Ö','ç'=>'Ç',
  ]);
  return mb_strtoupper($s, 'UTF-8');
}
// TR sadece ilk harfi büyük yap (kalanı olduğu gibi bırakır)
function tr_ucfirst(string $s): string {
  if ($s === '') return '';
  $first = mb_substr($s, 0, 1, 'UTF-8');
  $rest  = mb_substr($s, 1, null, 'UTF-8');
  return tr_upper($first) . $rest;
}
// TR capitalize: tamamını küçük yapıp ilk harfi büyük
function tr_capitalize(string $s): string {
  $s = mb_strtolower($s, 'UTF-8');
  return tr_ucfirst($s);
}

// ${BIRIM_ADI} yerleştir (tümü BÜYÜK HARF) ve {{TARIH}} dd/mm/yyyy
$xml = str_replace('${BIRIM_ADI}', $xmlEnt(tr_upper($birim)), $xml);
$xml = str_replace('{{TARIH}}', date('d/m/Y'), $xml);
// ${YER}-${TARIH}: BIRIM_ADI ilk kelimenin ilk harfi büyük + güncel yıl
$firstWord = '';
$trimBirim = trim($birim);
if ($trimBirim !== '') {
  $parts = preg_split('/\s+/', $trimBirim);
  $firstWord = isset($parts[0]) ? (string)$parts[0] : '';
}
$yerWord = tr_capitalize($firstWord);
$year = date('Y');
// Birleşik yer tutucu tek parça ise
$xml = str_replace('${YER}-${TARIH}', $xmlEnt($yerWord.'-'.$year), $xml);
// Ayrık yer tutucular için ayrıca tek tek değiştir
$xml = str_replace('${YER}', $xmlEnt($yerWord), $xml);
$xml = str_replace('${TARIH}', $year, $xml);

// --- content control ile değiştirme için güvenli fonksiyon ---
// --- content control ile değiştirme: formatı koruyan güvenli fonksiyon ---
function replaceContentControlByTag(DOMXPath $xp, DOMDocument $doc, string $nsW, string $tag, string $text): void {
  $nodes = $xp->query("//w:sdt[w:sdtPr/w:tag[@w:val='{$tag}']]");
  if (!$nodes || $nodes->length === 0) return;

  foreach ($nodes as $sdt) {
    // sdtContent alt düğümünü bul
    $content = null;
    foreach ($sdt->childNodes as $c) {
      if ($c instanceof DOMElement && $c->localName === 'sdtContent' && $c->namespaceURI === $nsW) {
        $content = $c;
        break;
      }
    }
    if (!$content) continue;

    // İçerikte ilk paragrafı bulmaya çalış
    $pNodeList = $xp->query('.//w:p', $content);
    if ($pNodeList && $pNodeList->length > 0) {
      $p = $pNodeList->item(0);

      // İlk run'ı bul (varsa) ve onun rPr'sini koruyarak yeni bir run oluştur
      $firstRList = $xp->query('.//w:r', $p);
      if ($firstRList && $firstRList->length > 0) {
        $firstR = $firstRList->item(0);
        // Klonla (rPr ve diğer özellikleri kalsın)
        $newR = $firstR->cloneNode(true);

        // İçindeki tüm w:t düğümlerini kaldır
        $tNodes = $xp->query('.//w:t', $newR);
        foreach ($tNodes as $tn) {
          $tn->parentNode->removeChild($tn);
        }
        // Yeni tek w:t ekle (xml:space preserve gerektiğinde ayarla)
        $t = $doc->createElementNS($nsW, 'w:t');
        if (preg_match('/^\s|\s$/', $text)) {
          $t->setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        }
        $t->appendChild($doc->createTextNode($text));
        $newR->appendChild($t);

        // Paragraftaki var olan w:r'ları kaldır ve tek yeni run ekle
        $oldR = [];
        foreach ($xp->query('./w:r', $p) as $rnode) { $oldR[] = $rnode; }
        foreach ($oldR as $rnode) { $p->removeChild($rnode); }
        $p->appendChild($newR);
      } else {
        // Paragraf var ama run yoksa: sadece bir run+t ekle (pPr korunur)
        $r = $doc->createElementNS($nsW, 'w:r');
        $t = $doc->createElementNS($nsW, 'w:t');
        if (preg_match('/^\s|\s$/', $text)) {
          $t->setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
        }
        $t->appendChild($doc->createTextNode($text));
        $r->appendChild($t);
        // Mevcut run'lar zaten yoksa append
        $p->appendChild($r);
      }
    } else {
      // sdtContent içinde paragraf yoksa: temizle ve yeni p->r->t ekle
      while ($content->firstChild) { $content->removeChild($content->firstChild); }
      $p = $doc->createElementNS($nsW, 'w:p');
      $r = $doc->createElementNS($nsW, 'w:r');
      $t = $doc->createElementNS($nsW, 'w:t');
      if (preg_match('/^\s|\s$/', $text)) {
        $t->setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
      }
      $t->appendChild($doc->createTextNode($text));
      $r->appendChild($t);
      $p->appendChild($r);
      $content->appendChild($p);
    }
  }
}

// DOM yükle
$doc = new DOMDocument();
$doc->preserveWhiteSpace = true;
$doc->formatOutput = false;
if (!@$doc->loadXML($xml)) { $zip->close(); jerr(500,'Şablon document.xml okunamadı.'); }

$xp  = new DOMXPath($doc);
$nsW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
$xp->registerNamespace('w', $nsW);

// YER_TARIH content control'ünü güncelle
$firstWord = '';
$trimBirim = trim($birim);
if ($trimBirim !== '') {
  $parts = preg_split('/\s+/', $trimBirim);
  $firstWord = isset($parts[0]) ? (string)$parts[0] : '';
}
$yerWord = tr_ucfirst(mb_strtolower($firstWord, 'UTF-8'));
$yerText = $yerWord . '-' . date('d/m/Y');

replaceContentControlByTag($xp, $doc, $nsW, 'TARIH_ZAMAN', $yerText);

// Yardımcılar
$createTextCell = function(string $text) use ($doc, $nsW): DOMElement {
  $tc = $doc->createElementNS($nsW, 'w:tc');
  $p  = $doc->createElementNS($nsW, 'w:p');
  $r  = $doc->createElementNS($nsW, 'w:r');
  $t  = $doc->createElementNS($nsW, 'w:t');
  $t->appendChild($doc->createTextNode($text));
  $r->appendChild($t); $p->appendChild($r); $tc->appendChild($p);
  return $tc;
};
$buildSimpleTable = function(array $rows) use ($doc, $nsW, $createTextCell): DOMElement {
  $tbl = $doc->createElementNS($nsW, 'w:tbl');
  // Basit başlık
  $hdr = $doc->createElementNS($nsW, 'w:tr');
  foreach (['SIRA','İDDİANAME NO','İDD. DEĞERLENDİRME NO','İDD. GÖNDERİLDİĞİ TARİH','İDD. DEĞERLENDİRME TARİHİ','DEĞERLENDİRME (Kabul-İade)','SÜRE (Gün)','HAKİM'] as $h){
    $hdr->appendChild($createTextCell($h));
  }
  $tbl->appendChild($hdr);
  // Veri
  foreach ($rows as $i=>$r){
    $tr = $doc->createElementNS($nsW, 'w:tr');
    $vals = [
      (string)($i+1),
      (string)($r['iddianameNo']    ?? ''),
      (string)($r['degerNo']        ?? ''),
      (string)($r['gonderimTarihi'] ?? ''),
      (string)($r['degerTar']       ?? ''),
      tr_ucfirst((string)($r['degerDurum'] ?? '')),
      (string)($r['sureGun']        ?? ''),
      (string)($r['hakim']          ?? ''),
    ];
    foreach ($vals as $v) { $tr->appendChild($createTextCell($v)); }
    $tbl->appendChild($tr);
  }
  return $tbl;
};

// Yardımcı: Bir w:tr satırındaki her hücrenin metnini tek parça olarak değiştir (run bölünmelerine dayanıklı)
$replaceTokensInTr = function(DOMElement $tr, array $map) use ($xp, $doc, $nsW): void {
  foreach ($xp->query('.//w:tc', $tr) as $tc) {
    // Hücre metinlerini birleştir
    $texts = [];
    foreach ($xp->query('.//w:t', $tc) as $tn) { $texts[] = $tn->textContent; }
    $joined = implode('', $texts);
    if ($joined === '' && empty($texts)) continue;
    foreach ($map as $k=>$v) { if ($joined !== '' && strpos($joined, $k) !== false) { $joined = str_replace($k, (string)$v, $joined); } }

    // İlk p/r'yi bul ve stilini koruyarak yeniden yaz
    $p = $xp->query('.//w:p', $tc)->item(0);
    if (!$p) { $p = $doc->createElementNS($nsW, 'w:p'); $tc->appendChild($p); }
    $firstR = $xp->query('.//w:r', $p)->item(0);
    if ($firstR) {
      $newR = $firstR->cloneNode(true);
      foreach ($xp->query('.//w:t', $newR) as $oldT) { $oldT->parentNode->removeChild($oldT); }
    } else {
      $newR = $doc->createElementNS($nsW, 'w:r');
    }
    $t = $doc->createElementNS($nsW, 'w:t');
    if (preg_match('/^\s|\s$/', $joined)) {
      $t->setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    }
    $t->appendChild($doc->createTextNode($joined));
    $newR->appendChild($t);
    $toRemove = [];
    foreach ($xp->query('./w:r', $p) as $rnode) { $toRemove[] = $rnode; }
    foreach ($toRemove as $rn) { $p->removeChild($rn); }
    $p->appendChild($newR);
  }
};

// 1) Önce ${sNo} içeren bir şablon satırı arayın (run bölünmelerine dayanıklı)
$tplNodes = $xp->query('//w:tr[contains(string(.), "${sNo}")]');
if ($tplNodes && $tplNodes->length > 0) {
  $tplTr = $tplNodes->item(0);
  $parentTbl = $tplTr->parentNode; // w:tbl
  if (!$parentTbl) { $zip->close(); jerr(500,'Şablon satırı bulundu ama tablo hiyerarşisi hatalı.'); }

  // Üretilen satırları ekle
  foreach ($rows as $i => $r) {
    $tr = $tplTr->cloneNode(true);
    // Placeholder metinlerini değiştir (hücre bazında, formatı koruyarak)
    $map = [
      '${sNo}'     => (string)($i+1),
      '${IDD_NO}'  => (string)($r['iddianameNo']    ?? ''),
      '${DEG_NO}'  => (string)($r['degerNo']        ?? ''),
      '${GON_TAR}' => (string)($r['gonderimTarihi'] ?? ''),
      '${DEG_TAR}' => (string)($r['degerTar']       ?? ''),
      '${DEG_DUR}' => tr_ucfirst((string)($r['degerDurum'] ?? '')),
      '${SURE}'    => (string)($r['sureGun']        ?? ''),
      '${HAKIM}'   => (string)($r['hakim']          ?? ''),
    ];
    $replaceTokensInTr($tr, $map);
    $parentTbl->insertBefore($tr, $tplTr);
  }
  // Şablon satırı kaldır
  $parentTbl->removeChild($tplTr);

} else {
  // 2) Şablon satırı yoksa, basit bir tablo üretip ekleyin (stil: şablondaki tablo stilinden bağımsız)
  $tbl = $buildSimpleTable($rows);
  $body = $xp->query('/w:document/w:body')->item(0);
  if (!$body) { $zip->close(); jerr(500,'Belgede w:body bulunamadı.'); }
  // sectPr varsa onun önüne, yoksa body sonuna ekle
  $sect = $xp->query('/w:document/w:body/w:sectPr')->item(0);
  if ($sect) { $body->insertBefore($tbl, $sect); } else { $body->appendChild($tbl); }
}

// Yeni şablon: "Kayıtlara uygun olduğu tasdik olunur." satırından sonra ayrı bir paragrafta
// doğrudan ${YER}-${TARIH} placeholder'ı olacak. Bu durumda, ilgili w:t düğümünü bulup yerine
// Yer-DD-MM-YYYY formatında metin koyuyoruz. (Önceki davranışı koruyoruz: ilk kelime, ilk harfi büyük.)
try {
  // Bulacağımız placeholder metni XPath içinde kullanırken PHP string interpolation olmasın diye tek tırnak kullanalım
  $placeholderNodes = $xp->query('//w:t[contains(., "${YER}-${TARIH}")]');
  if ($placeholderNodes && $placeholderNodes->length > 0) {
    // Hazırlık: yer kelimesini hesapla (ilk kelimenin ilk harfi büyük, kalan küçük)
    $firstWord = '';
    $trimBirim = trim($birim);
    if ($trimBirim !== '') { $parts = preg_split('/\s+/', $trimBirim); $firstWord = isset($parts[0]) ? (string)$parts[0] : ''; }
    $yerWord = tr_ucfirst(mb_strtolower($firstWord, 'UTF-8'));
    $targetText = $yerWord . '-' . date('d-m-Y');

    foreach ($placeholderNodes as $pn) {
      // parent paragraph'ı bul
      $p = $pn->parentNode;
      while ($p && !($p instanceof DOMElement && $p->namespaceURI === $nsW && $p->localName === 'p')) {
        $p = $p->parentNode;
      }
      if ($p instanceof DOMElement) {
        $tNodes = $xp->query('.//w:t', $p);
        if ($tNodes && $tNodes->length > 0) {
          // İlk w:t'ye hedef metni koy, diğerlerini temizle (ör. placeholder parçalansa bile düzgün olur)
          $tNodes->item(0)->textContent = $targetText;
          for ($i=1; $i<$tNodes->length; $i++) { $tNodes->item($i)->textContent = ''; }
        } else {
          // Hiç w:t yoksa yeni bir run ve t ekle
          $r = $doc->createElementNS($nsW, 'w:r');
          $t = $doc->createElementNS($nsW, 'w:t');
          $t->appendChild($doc->createTextNode($targetText));
          $r->appendChild($t); $p->appendChild($r);
        }
      } else {
        // Eğer paragraph bulunamadıysa, sadece bu t düğümünü güncelle
        $pn->textContent = $targetText;
      }
    }
  } else {
    // Eğer placeholder yoksa, önceki mantık (eski template'ler için) çalışmaya devam eder:
    $bodyAfter = $xp->query('/w:document/w:body')->item(0);
    if ($bodyAfter) {
      $tbls = $xp->query('./w:tbl', $bodyAfter);
      if ($tbls && $tbls->length > 0) {
        $lastTbl = $tbls->item($tbls->length - 1);
        // Tablodan sonra "Kayıtlara uygun olduğu tasdik olunur." metnini içeren ilk paragrafı bul
        $p = $lastTbl->nextSibling; $tasdikPara = null; $scan = 12;
        while ($p && $scan-- > 0) {
          if ($p instanceof DOMElement && $p->namespaceURI === $nsW && $p->localName === 'p') {
            $txt = '';
            foreach ($xp->query('.//w:t', $p) as $tn) { $txt .= $tn->textContent; }
            $norm = mb_strtolower(strtr($txt, ['İ'=>'i','I'=>'i','ı'=>'i','ğ'=>'g','Ğ'=>'g','ü'=>'u','Ü'=>'u','ş'=>'s','Ş'=>'s','ö'=>'o','Ö'=>'o','ç'=>'c','Ç'=>'c']), 'UTF-8');
            if (strpos($norm, 'kayitlara uygun oldugu tasdik olunur') !== false) { $tasdikPara = $p; break; }
          }
          $p = $p->nextSibling;
        }
        if ($tasdikPara) {
          // Sonraki paragrafı güncelle: Yer-YYYY
          $targetPara = $tasdikPara->nextSibling; $steps=4;
          while ($targetPara && $steps-- > 0 && !($targetPara instanceof DOMElement && $targetPara->namespaceURI === $nsW && $targetPara->localName === 'p')) {
            $targetPara = $targetPara->nextSibling;
          }
          if ($targetPara instanceof DOMElement) {
            $firstWord = '';
            $trimBirim = trim($birim);
            if ($trimBirim !== '') { $parts = preg_split('/\s+/', $trimBirim); $firstWord = isset($parts[0]) ? (string)$parts[0] : ''; }
            $yerWord = tr_ucfirst(mb_strtolower($firstWord, 'UTF-8'));
            $targetText = $yerWord . '-' . date('d-m-Y');
            $tNodes = $xp->query('.//w:t', $targetPara);
            if ($tNodes && $tNodes->length > 0) {
              $tNodes->item(0)->textContent = $targetText;
              for ($i=1; $i<$tNodes->length; $i++) { $tNodes->item($i)->textContent = ''; }
            } else {
              $r = $doc->createElementNS($nsW, 'w:r');
              $t = $doc->createElementNS($nsW, 'w:t');
              $t->appendChild($doc->createTextNode($targetText));
              $r->appendChild($t); $targetPara->appendChild($r);
            }
          }
        }
      }
    }
  }
} catch (Throwable $__) { /* no-op */ }

// Not: Paragraflarda (w:p) stilin bozulmaması için genel bir toplu rewrite uygulanmıyor; baştaki
// basit yer değiştirmeler $xml üzerinde yapılır.

// Geçerli XML olarak yaz
$xmlOut = $doc->saveXML();
if ($xmlOut === false) { $zip->close(); jerr(500,'XML serialize edilemedi.'); }
$zip->addFromString($xmlPath, $xmlOut);
$zip->close();

// ---------- Stream ----------
if (function_exists('ob_get_level')) { while (ob_get_level()>0) { @ob_end_clean(); } }
if (!is_file($outDocx)) jerr(500,'DOCX kaydedilemedi.');
if (filesize($outDocx) <= 0) jerr(500,'DOCX boş kaydedildi.');

header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Disposition: attachment; filename="1- İDDİANAME DEĞERLENDİRME ZAMAN KONTROLÜ.docx"');
header('Content-Length: '.filesize($outDocx));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: public');

$fh = fopen($outDocx,'rb');
if ($fh) { fpassthru($fh); fclose($fh); } else { readfile($outDocx); }
@unlink($outDocx);
@unlink($tmpFile);
exit;