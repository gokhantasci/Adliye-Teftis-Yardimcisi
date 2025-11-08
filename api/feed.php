<?php
/**
 * ========================================
 * RSS/ATOM FEED GENERATOR
 * ========================================
 * Generates RSS 2.0 and Atom feeds from teftis.json
 * Access: /api/feed.php or /api/feed.php?format=atom
 * ========================================
 */

require_once __DIR__ . '/utils.php';

// Get feed format from query parameter
$format = $_GET['format'] ?? 'rss';
$format = in_array($format, ['rss', 'atom']) ? $format : 'rss';

// Load news data
$newsFile = DATA_DIR . '/teftis.json';
$newsData = api_read_json($newsFile);

// Sort by date (newest first)
usort($newsData, function($a, $b) {
    $dateA = strtotime($a['tarih'] ?? $a['Tarih'] ?? $a['date'] ?? '');
    $dateB = strtotime($b['tarih'] ?? $b['Tarih'] ?? $b['date'] ?? '');
    return $dateB - $dateA;
});

// Limit to 20 most recent items
$newsData = array_slice($newsData, 0, 20);

// Site information
$siteTitle = 'Adliye Teftiş Yardımcısı - Haberler';
$siteUrl = 'https://teftis.657.com.tr';
$siteDescription = 'Adliye teftiş işlemleri için güncellemeler ve duyurular';
$feedUrl = $siteUrl . '/api/feed.php';

/**
 * Generate RSS 2.0 feed
 */
function generateRSS($newsData, $siteTitle, $siteUrl, $siteDescription, $feedUrl) {
    header('Content-Type: application/rss+xml; charset=utf-8');
    
    $buildDate = date('r');
    
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">' . "\n";
    echo '<channel>' . "\n";
    echo '  <title>' . htmlspecialchars($siteTitle, ENT_XML1) . '</title>' . "\n";
    echo '  <link>' . htmlspecialchars($siteUrl, ENT_XML1) . '</link>' . "\n";
    echo '  <description>' . htmlspecialchars($siteDescription, ENT_XML1) . '</description>' . "\n";
    echo '  <language>tr</language>' . "\n";
    echo '  <lastBuildDate>' . $buildDate . '</lastBuildDate>' . "\n";
    echo '  <atom:link href="' . htmlspecialchars($feedUrl, ENT_XML1) . '" rel="self" type="application/rss+xml" />' . "\n";
    
    foreach ($newsData as $item) {
        $tarih = $item['tarih'] ?? $item['Tarih'] ?? $item['date'] ?? '';
        $icerik = $item['icerik'] ?? $item['İcerik'] ?? $item['İÇERİK'] ?? $item['content'] ?? '';
        
        if (empty($tarih) || empty($icerik)) continue;
        
        $timestamp = strtotime($tarih);
        $pubDate = $timestamp ? date('r', $timestamp) : date('r');
        
        // Create unique GUID
        $guid = md5($tarih . $icerik);
        
        // Clean content
        $title = mb_substr(strip_tags($icerik), 0, 100);
        if (mb_strlen($icerik) > 100) {
            $title .= '...';
        }
        
        echo '  <item>' . "\n";
        echo '    <title>' . htmlspecialchars($title, ENT_XML1) . '</title>' . "\n";
        echo '    <link>' . htmlspecialchars($siteUrl, ENT_XML1) . '</link>' . "\n";
        echo '    <description><![CDATA[' . $icerik . ']]></description>' . "\n";
        echo '    <pubDate>' . $pubDate . '</pubDate>' . "\n";
        echo '    <guid isPermaLink="false">' . $guid . '</guid>' . "\n";
        echo '  </item>' . "\n";
    }
    
    echo '</channel>' . "\n";
    echo '</rss>' . "\n";
}

/**
 * Generate Atom feed
 */
function generateAtom($newsData, $siteTitle, $siteUrl, $siteDescription, $feedUrl) {
    header('Content-Type: application/atom+xml; charset=utf-8');
    
    $updated = date('c');
    
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<feed xmlns="http://www.w3.org/2005/Atom">' . "\n";
    echo '  <title>' . htmlspecialchars($siteTitle, ENT_XML1) . '</title>' . "\n";
    echo '  <link href="' . htmlspecialchars($siteUrl, ENT_XML1) . '" />' . "\n";
    echo '  <link href="' . htmlspecialchars($feedUrl . '?format=atom', ENT_XML1) . '" rel="self" />' . "\n";
    echo '  <id>' . htmlspecialchars($feedUrl, ENT_XML1) . '</id>' . "\n";
    echo '  <updated>' . $updated . '</updated>' . "\n";
    echo '  <subtitle>' . htmlspecialchars($siteDescription, ENT_XML1) . '</subtitle>' . "\n";
    echo '  <author>' . "\n";
    echo '    <name>Gökhan TAŞÇI</name>' . "\n";
    echo '    <email>gkhntasci@gmail.com</email>' . "\n";
    echo '  </author>' . "\n";
    
    foreach ($newsData as $item) {
        $tarih = $item['tarih'] ?? $item['Tarih'] ?? $item['date'] ?? '';
        $icerik = $item['icerik'] ?? $item['İcerik'] ?? $item['İÇERİK'] ?? $item['content'] ?? '';
        
        if (empty($tarih) || empty($icerik)) continue;
        
        $timestamp = strtotime($tarih);
        $updated = $timestamp ? date('c', $timestamp) : date('c');
        
        // Create unique ID
        $id = md5($tarih . $icerik);
        
        // Clean title
        $title = mb_substr(strip_tags($icerik), 0, 100);
        if (mb_strlen($icerik) > 100) {
            $title .= '...';
        }
        
        echo '  <entry>' . "\n";
        echo '    <title>' . htmlspecialchars($title, ENT_XML1) . '</title>' . "\n";
        echo '    <link href="' . htmlspecialchars($siteUrl, ENT_XML1) . '" />' . "\n";
        echo '    <id>urn:uuid:' . $id . '</id>' . "\n";
        echo '    <updated>' . $updated . '</updated>' . "\n";
        echo '    <content type="html"><![CDATA[' . $icerik . ']]></content>' . "\n";
        echo '  </entry>' . "\n";
    }
    
    echo '</feed>' . "\n";
}

// Generate feed based on format
if ($format === 'atom') {
    generateAtom($newsData, $siteTitle, $siteUrl, $siteDescription, $feedUrl);
} else {
    generateRSS($newsData, $siteTitle, $siteUrl, $siteDescription, $feedUrl);
}
