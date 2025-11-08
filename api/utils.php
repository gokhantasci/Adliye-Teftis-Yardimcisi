<?php
/**
 * ========================================
 * CENTRALIZED API UTILITIES
 * ========================================
 * Common utility functions for all API endpoints
 * Include this file in all API scripts
 * ========================================
 */

declare(strict_types=1);

// Set JSON response header
if (!headers_sent()) {
    header("Content-Type: application/json; charset=utf-8");
}

// Define constants
if (!defined('DATA_DIR')) {
    define('DATA_DIR', __DIR__ . '/../data');
}
if (!defined('NOTES_FILE')) {
    define('NOTES_FILE', DATA_DIR . '/notes.json');
}

// Ensure data directory exists
if (!is_dir(DATA_DIR)) {
    mkdir(DATA_DIR, 0755, true);
}

/**
 * Send JSON response and exit
 * 
 * @param bool $ok Success status
 * @param mixed $data Data to return
 * @param int $code HTTP status code
 * @return void
 */
function api_respond($ok, $data = null, $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'ok' => $ok,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send error response and exit
 * 
 * @param string $error Error message
 * @param int $code HTTP status code
 * @return void
 */
function api_error($error, $code = 400): void {
    http_response_code($code);
    echo json_encode([
        'ok' => false,
        'error' => $error
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Read JSON file with file locking
 * 
 * @param string $path File path
 * @return array Decoded JSON data
 */
function api_read_json(string $path): array {
    if (!file_exists($path)) {
        return [];
    }
    
    $fp = fopen($path, 'r');
    if (!$fp) {
        return [];
    }
    
    flock($fp, LOCK_SH);
    $raw = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    $data = json_decode($raw ?: "[]", true);
    return is_array($data) ? $data : [];
}

/**
 * Write JSON file with atomic write and file locking
 * 
 * @param string $path File path
 * @param mixed $data Data to write
 * @return bool Success status
 */
function api_write_json(string $path, $data): bool {
    $tmp = $path . '.tmp.' . uniqid();
    
    $fp = fopen($tmp, 'w');
    if (!$fp) {
        return false;
    }
    
    flock($fp, LOCK_EX);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    $success = rename($tmp, $path);
    
    // Clean up temp file if rename failed
    if (!$success && file_exists($tmp)) {
        unlink($tmp);
    }
    
    return $success;
}

/**
 * Get JSON body from request
 * 
 * @return array Decoded JSON data
 */
function api_get_json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?? "", true);
    return is_array($data) ? $data : [];
}

/**
 * Generate unique ID
 * 
 * @param int $length Length in bytes (default: 6)
 * @return string Hex string ID
 */
function api_generate_id(int $length = 6): string {
    return bin2hex(random_bytes($length));
}

/**
 * Validate required fields in data array
 * 
 * @param array $data Data to validate
 * @param array $required Required field names
 * @return bool True if all required fields present
 */
function api_validate_required(array $data, array $required): bool {
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return false;
        }
    }
    return true;
}

/**
 * Sanitize string for output
 * 
 * @param string $str String to sanitize
 * @return string Sanitized string
 */
function api_sanitize(string $str): string {
    return htmlspecialchars(trim($str), ENT_QUOTES, 'UTF-8');
}

/**
 * Check if request method matches
 * 
 * @param string $method Expected HTTP method
 * @return bool True if matches
 */
function api_check_method(string $method): bool {
    return $_SERVER['REQUEST_METHOD'] === strtoupper($method);
}

/**
 * Require specific request method or exit with error
 * 
 * @param string $method Required HTTP method
 * @return void
 */
function api_require_method(string $method): void {
    if (!api_check_method($method)) {
        api_error('Method not allowed', 405);
    }
}

/**
 * Get client IP address
 * 
 * @return string Client IP
 */
function api_get_client_ip(): string {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

/**
 * Log API access or error
 * 
 * @param string $message Log message
 * @param string $level Log level (info, error, warning)
 * @return void
 */
function api_log(string $message, string $level = 'info'): void {
    $logFile = DATA_DIR . '/api.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = api_get_client_ip();
    $logLine = sprintf("[%s] [%s] [%s] %s\n", $timestamp, $level, $ip, $message);
    
    @file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
}

/**
 * CORS headers for API endpoints
 * 
 * @param array $allowedOrigins Allowed origins (default: same origin only)
 * @return void
 */
function api_enable_cors(array $allowedOrigins = []): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (empty($allowedOrigins) || in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-HP');
        header('Access-Control-Max-Age: 86400');
    }
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Backward compatibility aliases
if (!function_exists('respond')) {
    function respond($ok, $data = null, $code = 200) {
        api_respond($ok, $data, $code);
    }
}

if (!function_exists('read_json_file')) {
    function read_json_file(string $path) {
        return api_read_json($path);
    }
}

if (!function_exists('write_json_file')) {
    function write_json_file(string $path, $arr) {
        return api_write_json($path, $arr);
    }
}

if (!function_exists('body_json')) {
    function body_json() {
        return api_get_json_body();
    }
}

if (!function_exists('uid')) {
    function uid(): string {
        return api_generate_id();
    }
}
