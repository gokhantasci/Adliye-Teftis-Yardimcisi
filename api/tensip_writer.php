<?php
declare(strict_types=1);

@ini_set('display_errors','0');
@ini_set('zlib.output_compression','Off');
if (function_exists('ob_get_level')) { while (ob_get_level()>0) { @ob_end_clean(); } }

function jerr(int $code, string $msg){
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok'=>false,'reason'=>$msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { header('Access-Control-Allow-Methods: POST, OPTIONS'); header('Access-Control-Allow-Headers: Content-Type, X-Requested-With'); header('Access-Control-Max-Age: 600'); http_response_code(204); exit; }
if ($method !== 'POST') { header('Allow: POST, OPTIONS'); jerr(405,'Sadece POST kabul edilir.'); }

$raw = file_get_contents('php://input') ?: '';
$data = $raw !== '' ? json_decode($raw, true) : null;
if (!is_array($data)) jerr(400,'Geçersiz JSON.');
$rows  = $data['rows'] ?? null; $birim = (string)($data['birimAdi'] ?? '');
if (!is_array($rows)) jerr(400,'rows alanı eksik veya hatalı.');

$tplPath = __DIR__ . '/../data/tensip.docx';
if (!is_file($tplPath)) jerr(404,'Şablon bulunamadı: /data/tensip.docx');
if (!class_exists('ZipArchive')) jerr(500,'PHP ZipArchive eklentisi yok.');

$tmpBase = is_writable(sys_get_temp_dir()) ? sys_get_temp_dir() : (__DIR__.'/../data');
$tmpFile = tempnam($tmpBase, 'tsp_'); if (!$tmpFile) jerr(500,'Geçici dosya oluşturulamadı.');
$outDocx = $tmpFile . '.docx'; if (!copy($tplPath, $outDocx)) jerr(500,'Şablon kopyalanamadı.');

$zip = new ZipArchive(); if ($zip->open($outDocx) !== true) jerr(500,'DOCX açılamadı (Zip).');
$xmlPath = 'word/document.xml'; $xml = $zip->getFromName($xmlPath); if ($xml === false) { $zip->close(); jerr(500,'word/document.xml yok.'); }

// Basit değişkenler
$xmlEnt = static function(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_XML1, 'UTF-8'); };
function tr_upper(string $s): string { $s = strtr($s, ['i'=>'İ','ı'=>'I','ğ'=>'Ğ','ü'=>'Ü','ş'=>'Ş','ö'=>'Ö','ç'=>'Ç']); return mb_strtoupper($s, 'UTF-8'); }
$xml = str_replace('${BIRIM_ADI}', $xmlEnt(tr_upper($birim)), $xml);
$xml = str_replace('{{TARIH}}', date('d/m/Y'), $xml);

$doc = new DOMDocument(); $doc->preserveWhiteSpace = true; $doc->formatOutput = false; if (!@$doc->loadXML($xml)) { $zip->close(); jerr(500,'Şablon document.xml okunamadı.'); }
$xp  = new DOMXPath($doc); $nsW = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'; $xp->registerNamespace('w', $nsW);

// Content control değiştirici
function replaceContentControlByTag(DOMXPath $xp, DOMDocument $doc, string $nsW, string $tag, string $text): void {
  $nodes = $xp->query("//w:sdt[w:sdtPr/w:tag[@w:val='{$tag}']]"); if (!$nodes || $nodes->length === 0) return;
  foreach ($nodes as $sdt) {
    $content = null; foreach ($sdt->childNodes as $c) { if ($c instanceof DOMElement && $c->localName==='sdtContent' && $c->namespaceURI===$nsW) { $content=$c; break; } }
    if (!$content) continue;
    $pNodeList = $xp->query('.//w:p', $content);
    if ($pNodeList && $pNodeList->length>0) {
      $p = $pNodeList->item(0); $firstR = $xp->query('.//w:r', $p)->item(0);
      if ($firstR) {
        $newR = $firstR->cloneNode(true); foreach ($xp->query('.//w:t', $newR) as $tn) { $tn->parentNode->removeChild($tn); }
      } else { $newR = $doc->createElementNS($nsW, 'w:r'); }
      $t = $doc->createElementNS($nsW, 'w:t'); if (preg_match('/^\s|\s$/',$text)) { $t->setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve'); }
      $t->appendChild($doc->createTextNode($text)); $newR->appendChild($t);
      foreach ($xp->query('./w:r', $p) as $rnode) { $p->removeChild($rnode); } $p->appendChild($newR);
    } else {
      while ($content->firstChild) { $content->removeChild($content->firstChild); }
      $p = $doc->createElementNS($nsW, 'w:p'); $r = $doc->createElementNS($nsW, 'w:r'); $t = $doc->createElementNS($nsW, 'w:t'); $t->appendChild($doc->createTextNode($text)); $r->appendChild($t); $p->appendChild($r); $content->appendChild($p);
    }
  }
}

// TARIH_ZAMAN = BirimİlkKelime-gg/aa/yyyy
$firstWord = '';
$parts = preg_split('/\s+/', trim($birim)); if (!empty($parts)) $firstWord = (string)$parts[0];
$yerWord = $firstWord !== '' ? (tr_upper(mb_substr($firstWord,0,1,'UTF-8')).mb_substr($firstWord,1,null,'UTF-8')) : '';
$yerText = $yerWord . '-' . date('d/m/Y');
replaceContentControlByTag($xp,$doc,$nsW,'TARIH_ZAMAN',$yerText);

// Hücre bazlı yer değiştirici
$replaceTokensInTr = function(DOMElement $tr, array $map) use ($xp, $doc, $nsW): void {
  foreach ($xp->query('.//w:tc', $tr) as $tc) {
    $joined = '';
    foreach ($xp->query('.//w:t', $tc) as $tn) { $joined .= $tn->textContent; }
    // Hücrede placeholder var mı? (örn: ${...})
    $hadPlaceholder = (bool)preg_match('/\$\{[^}]+\}/', $joined);
    // Yer tutuculara göre değiştir (alt anahtarlar: '_' ve ' ' varyantları)
    $replaced = false;
    foreach ($map as $k=>$v) {
      $alts = [$k];
      if (strpos($k,'_') !== false) { $alts[] = str_replace('_',' ',$k); }
      foreach ($alts as $kk) {
        if ($joined !== '' && strpos($joined, $kk) !== false) {
          $joined = str_replace($kk, (string)$v, $joined);
          $replaced = true;
        }
      }
    }
    // Eğer hücre başlangıçta placeholder içeriyorsa ve hiçbiri eşleşmediyse, hücreyi boşalt
    if ($hadPlaceholder && !$replaced) { $joined = ''; }
    $p = $xp->query('.//w:p', $tc)->item(0); if (!$p) { $p = $doc->createElementNS($nsW,'w:p'); $tc->appendChild($p); }
    $firstR = $xp->query('.//w:r', $p)->item(0);
    $newR = $firstR ? $firstR->cloneNode(true) : $doc->createElementNS($nsW,'w:r');
    foreach ($xp->query('.//w:t', $newR) as $oldT) { $oldT->parentNode->removeChild($oldT); }
    $t = $doc->createElementNS($nsW,'w:t'); if (preg_match('/^\s|\s$/',$joined)) { $t->setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve'); }
    $t->appendChild($doc->createTextNode($joined)); $newR->appendChild($t);
    foreach ($xp->query('./w:r', $p) as $rnode) { $p->removeChild($rnode); } $p->appendChild($newR);
  }
};

// 1) Şablon satırı ara (run bölünmesine dayanıklı, çoklu adaylı)
// Beklenen placeholder kümeleri (boşluklu/alt çizgili varyantlar)
$expectedTokens = [
  '${sNo}',
  '${ESAS_NO}', '${ESAS NO}',
  '${IDD_KABUL_TAR}', '${IDD KABUL TAR}',
  '${TENSIP_TAR}', '${TENSIP TAR}',
  '${SURE}',
  '${HAKIM}'
];
$bestTr = null; $bestScore = 0;
foreach ($xp->query('//w:tr') as $trCand) {
  // Satırın tüm metnini topla
  $text = '';
  foreach ($xp->query('.//w:t', $trCand) as $tn) { $text .= $tn->textContent; }
  // Kaç token içeriyor?
  $score = 0; foreach ($expectedTokens as $tok) { if ($text !== '' && strpos($text, $tok) !== false) $score++; }
  if ($score > $bestScore) { $bestScore = $score; $bestTr = $trCand; }
}

if ($bestTr && $bestScore >= 2) { // en az 2 placeholder bulunsun
  $tplTr = $bestTr; $parentTbl = $tplTr->parentNode; if (!$parentTbl) { $zip->close(); jerr(500,'Şablon satırı bulundu ama tablo hiyerarşisi hatalı.'); }
  foreach ($rows as $i=>$r){
    $tr = $tplTr->cloneNode(true);
    $map = [
      '${sNo}'            => (string)($i+1),
      '${ESAS_NO}'        => (string)($r['esasNo']        ?? ''),
      '${ESAS NO}'        => (string)($r['esasNo']        ?? ''),
      '${IDD_KABUL_TAR}'  => (string)($r['iddKabulTar']   ?? ''),
      '${IDD KABUL TAR}'  => (string)($r['iddKabulTar']   ?? ''),
      '${TENSIP_TAR}'     => (string)($r['tensipTar']     ?? ''),
      '${TENSIP TAR}'     => (string)($r['tensipTar']     ?? ''),
      '${SURE}'           => (string)($r['sureGun']       ?? ''),
      '${HAKIM}'          => (string)($r['hakim']         ?? ''),
    ];
    $replaceTokensInTr($tr,$map); $parentTbl->insertBefore($tr, $tplTr);
  }
  $parentTbl->removeChild($tplTr);
} else {
  // 2) Basit tablo oluştur
  $tbl = $doc->createElementNS($nsW,'w:tbl');
  $mkCell = function(string $text) use ($doc,$nsW){ $tc=$doc->createElementNS($nsW,'w:tc'); $p=$doc->createElementNS($nsW,'w:p'); $r=$doc->createElementNS($nsW,'w:r'); $t=$doc->createElementNS($nsW,'w:t'); $t->appendChild($doc->createTextNode($text)); $r->appendChild($t); $p->appendChild($r); $tc->appendChild($p); return $tc; };
  $hdr = $doc->createElementNS($nsW,'w:tr');
  foreach (['SIRA','ESAS NO','İDDİANAME KABUL TARİHİ','TENSİP TARİHİ','SÜRE (GÜN)','HAKİM'] as $h){ $hdr->appendChild($mkCell($h)); }
  $tbl->appendChild($hdr);
  foreach ($rows as $i=>$r){
    $tr = $doc->createElementNS($nsW,'w:tr');
    foreach ([(string)($i+1),(string)($r['esasNo']??''),(string)($r['iddKabulTar']??''),(string)($r['tensipTar']??''),(string)($r['sureGun']??''),(string)($r['hakim']??'')] as $v){ $tr->appendChild($mkCell($v)); }
    $tbl->appendChild($tr);
  }
  $body = $xp->query('/w:document/w:body')->item(0); if (!$body){ $zip->close(); jerr(500,'Belgede w:body bulunamadı.'); }
  $sect = $xp->query('/w:document/w:body/w:sectPr')->item(0); if ($sect){ $body->insertBefore($tbl,$sect);} else { $body->appendChild($tbl);} 
}

$xmlOut = $doc->saveXML(); if ($xmlOut === false) { $zip->close(); jerr(500,'XML serialize edilemedi.'); }
$zip->addFromString($xmlPath, $xmlOut); $zip->close();

if (function_exists('ob_get_level')) { while (ob_get_level()>0) { @ob_end_clean(); } }
if (!is_file($outDocx)) jerr(500,'DOCX kaydedilemedi.');
if (filesize($outDocx) <= 0) jerr(500,'DOCX boş kaydedildi.');
header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Disposition: attachment; filename="2- TENSİP ZAMAN KONTROLÜ.docx"');
header('Content-Length: '.filesize($outDocx));
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: public');
$fh = fopen($outDocx,'rb'); if ($fh){ fpassthru($fh); fclose($fh);} else { readfile($outDocx);} @unlink($outDocx); @unlink($tmpFile); exit;
