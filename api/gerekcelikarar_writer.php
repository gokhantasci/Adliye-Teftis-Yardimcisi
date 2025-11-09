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
  if ($code >= 400) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $m  = $_SERVER['REQUEST_METHOD'] ?? '?';
    @error_log('[gerekcelikarar_writer] '.$code.' '.$msg.' ip='.$ip.' method='.$m);
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
    'tplExists' => is_file(__DIR__.'/../data/gerekcelikarar.docx'),
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

// ---------- Input (defensive)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST' && !isset($_GET['ping'])) {
  header('Allow: POST, OPTIONS');
  $hint = 'Sadece POST kabul edilir (method='.$method.'). Sağlık kontrolü için ?ping=1 kullanın.';
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
$tplPath = __DIR__ . '/../data/gerekcelikarar.docx';
if (!is_file($tplPath)) jerr(404,'Şablon bulunamadı: /data/gerekcelikarar.docx (Henüz oluşturulmamış olabilir)');
if (!class_exists('ZipArchive')) jerr(500,'PHP ZipArchive eklentisi yok.');

$tmpBase = is_writable(sys_get_temp_dir()) ? sys_get_temp_dir() : (__DIR__.'/../data');
$tmpFile = tempnam($tmpBase, 'grk_');
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

// ${BIRIM_ADI} yerleştir (tümü BÜYÜK HARF) ve {{TARIH}} dd/mm/yyyy
$xml = str_replace('${BIRIM_ADI}', $xmlEnt(tr_upper($birim)), $xml);
$xml = str_replace('{{TARIH}}', date('d/m/Y'), $xml);

// DOM yükle
$doc = new DOMDocument();
$doc->preserveWhiteSpace = true;
$doc->formatOutput = false;
if (!@$doc->loadXML($xml)) { $zip->close(); jerr(500,'Şablon document.xml okunamadı.'); }

$xp  = new DOMXPath($doc);
$nsW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
$xp->registerNamespace('w', $nsW);

// --- content control ile değiştirme için güvenli fonksiyon ---
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

// TARIH_ZAMAN content control'ünü güncelle (Yer-DD/MM/YYYY)
$firstWord = '';
$trimBirim = trim($birim);
if ($trimBirim !== '') {
  $parts = preg_split('/\s+/', $trimBirim);
  $firstWord = isset($parts[0]) ? (string)$parts[0] : '';
}
function tr_ucfirst_internal(string $s): string {
  if ($s === '') return '';
  $first = mb_substr($s, 0, 1, 'UTF-8');
  $rest  = mb_substr($s, 1, null, 'UTF-8');
  return tr_upper($first) . $rest;
}
$yerWord = tr_ucfirst_internal(mb_strtolower($firstWord, 'UTF-8'));
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
  foreach (['SIRA','ESAS NO','KARAR TÜRÜ','KISA KARAR TARİHİ','GEREKÇELİ KARAR TARİHİ','GECİKME SÜRESİ (GÜN)','HAKİM'] as $h){
    $hdr->appendChild($createTextCell($h));
  }
  $tbl->appendChild($hdr);
  // Veri
  foreach ($rows as $i=>$r){
    $tr = $doc->createElementNS($nsW, 'w:tr');
    $vals = [
      (string)($i+1),
      (string)($r['esasNo']              ?? ''),
      (string)($r['kararTuru']           ?? ''),
      (string)($r['kisaKararTarihi']     ?? ''),
      (string)($r['gerekceliKararTarihi']?? ''),
      (string)($r['gecikme']             ?? ''),
      (string)($r['hakim']               ?? ''),
    ];
    foreach ($vals as $v) { $tr->appendChild($createTextCell($v)); }
    $tbl->appendChild($tr);
  }
  return $tbl;
};

// Yardımcı: Bir w:tr satırındaki her hücrenin metnini tek parça olarak değiştir (run bölünmelerine dayanıklı)
$replaceTokensInTr = function(DOMElement $tr, array $map) use ($xp, $doc, $nsW): void {
  // Her hücre (w:tc) için çalış
  foreach ($xp->query('.//w:tc', $tr) as $tc) {
    // Hücredeki tüm metni topla
    $texts = [];
    foreach ($xp->query('.//w:t', $tc) as $tn) { $texts[] = $tn->textContent; }
    $joined = implode('', $texts);
    if ($joined === '' && empty($texts)) continue;
    // Yer tutucuları değiştir
    foreach ($map as $k=>$v) { if ($joined !== '' && strpos($joined, $k) !== false) { $joined = str_replace($k, (string)$v, $joined); } }

    // Hücrede ilk paragraf ve ilk run'ı bul (stil korumak için)
    $p = $xp->query('.//w:p', $tc)->item(0);
    if (!$p) { $p = $doc->createElementNS($nsW, 'w:p'); $tc->appendChild($p); }
    $firstR = $xp->query('.//w:r', $p)->item(0);
    if ($firstR) {
      $newR = $firstR->cloneNode(true);
      // İçteki tüm w:t düğümlerini temizle
      foreach ($xp->query('.//w:t', $newR) as $oldT) { $oldT->parentNode->removeChild($oldT); }
    } else {
      $newR = $doc->createElementNS($nsW, 'w:r');
    }
    // Yeni tek metin düğümü ekle
    $t = $doc->createElementNS($nsW, 'w:t');
    if (preg_match('/^\s|\s$/', $joined)) {
      $t->setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
    }
    $t->appendChild($doc->createTextNode($joined));
    $newR->appendChild($t);
    // Paragraftaki mevcut w:r'ları kaldırıp tek run ekle
    $toRemove = [];
    foreach ($xp->query('./w:r', $p) as $rnode) { $toRemove[] = $rnode; }
    foreach ($toRemove as $rn) { $p->removeChild($rn); }
    $p->appendChild($newR);
  }
};

// 1) Önce ${sNo} içeren bir şablon satırı arayın (run bölünmelerine dayanıklı arama)
$tplNodes = $xp->query('//w:tr[contains(string(.), "${sNo}")]');
if ($tplNodes && $tplNodes->length > 0) {
  $tplTr = $tplNodes->item(0);
  $parentTbl = $tplTr->parentNode; // w:tbl
  if (!$parentTbl) { $zip->close(); jerr(500,'Şablon satırı bulundu ama tablo hiyerarşisi hatalı.'); }

  // Üretilen satırları ekle (Gerekçeli Karar field mapping)
  foreach ($rows as $i => $r) {
    $tr = $tplTr->cloneNode(true);
    $map = [
      '${sNo}'           => (string)($i+1),
      '${ESAS_NO}'       => (string)($r['esasNo']              ?? ''),
      '${KARAR_TURU}'    => (string)($r['kararTuru']           ?? ''),
      '${KISA_TAR}'      => (string)($r['kisaKararTarihi']     ?? ''),
      '${GEREKCELI_TAR}' => (string)($r['gerekceliKararTarihi']?? ''),
      '${GECIKME}'       => (string)($r['gecikme']             ?? ''),
      '${HAKIM}'         => (string)($r['hakim']               ?? ''),
    ];
    $replaceTokensInTr($tr, $map);
    $parentTbl->insertBefore($tr, $tplTr);
  }
  // Şablon satırı kaldır
  $parentTbl->removeChild($tplTr);

} else {
  // 2) Şablon satırı yoksa, basit bir tablo üretip ekleyin
  $tbl = $buildSimpleTable($rows);
  $body = $xp->query('/w:document/w:body')->item(0);
  if (!$body) { $zip->close(); jerr(500,'Belgede w:body bulunamadı.'); }
  $sect = $xp->query('/w:document/w:body/w:sectPr')->item(0);
  if ($sect) { $body->insertBefore($tbl, $sect); } else { $body->appendChild($tbl); }
}

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
header('Content-Disposition: attachment; filename="5- GEREKÇELİ KARAR ZAMAN KONTROLÜ.docx"');
header('Content-Length: '.filesize($outDocx));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: public');

$fh = fopen($outDocx,'rb');
if ($fh) { fpassthru($fh); fclose($fh); } else { readfile($outDocx); }
@unlink($outDocx);
@unlink($tmpFile);
exit;
