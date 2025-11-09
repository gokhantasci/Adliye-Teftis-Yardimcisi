<?php
// Secure download endpoint for Duruşma Kaçağı template
// Reads protected file from /data and streams to client

declare(strict_types=1);

$root = dirname(__DIR__);
$file = $root . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'durusma.docx';
$downloadName = '3- DURUŞMA KAÇAĞI KONTROLÜ.docx';

// Basic security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (!is_file($file) || !is_readable($file)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok' => false, 'error' => 'Template not found']);
    exit;
}

$filesize = filesize($file);

// Disable caching
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// DOCX mime type
header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
header('Content-Length: ' . $filesize);
header('Content-Disposition: attachment; filename="' . $downloadName . '"');

$chunk = 8192;
$fh = fopen($file, 'rb');
if ($fh === false) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['ok' => false, 'error' => 'Unable to open file']);
    exit;
}
while (!feof($fh)) {
    $buf = fread($fh, $chunk);
    if ($buf === false) break;
    echo $buf;
    @ob_flush();
    flush();
}
fclose($fh);
exit;
