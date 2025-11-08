<?php
declare(strict_types=1);
/**
 * API Bootstrap - Legacy compatibility wrapper
 * Now uses centralized api/utils.php for all functionality
 */

// Include centralized utilities
require_once __DIR__ . '/utils.php';

// All functions are now available through utils.php
// This file kept for backward compatibility

