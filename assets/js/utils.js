/**
 * ========================================
 * GLOBAL UTILITY FUNCTIONS
 * ========================================
 * Centralized utility functions used across the application
 * This file should be loaded before other JavaScript files
 * ========================================
 */

(function(window) {
  'use strict';

  // Prevent double initialization
  if (window.TeftisUtils) return;

  /**
   * Convert Excel column letter to zero-based index
   * @param {string} col - Column letter (e.g., "A", "B", "AA")
   * @returns {number} Zero-based column index
   */
  function letterToIndex(col) {
    col = String(col || "").trim().toUpperCase();
    let n = 0;
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + (col.charCodeAt(i) - 64);
    }
    return n - 1;
  }

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} s - String to escape
   * @returns {string} Escaped string
   */
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  }

  /**
   * Normalize Turkish text for comparison
   * Converts to lowercase, removes diacritics, normalizes whitespace
   * @param {string} s - String to normalize
   * @returns {string} Normalized string
   */
  function normalizeTurkish(s) {
    return String(s ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/\r?\n+/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replaceAll("ı", "i")
      .replaceAll("İ", "i")
      .replaceAll("ş", "s")
      .replaceAll("Ş", "s")
      .replaceAll("ğ", "g")
      .replaceAll("Ğ", "g")
      .replaceAll("ö", "o")
      .replaceAll("Ö", "o")
      .replaceAll("ü", "u")
      .replaceAll("Ü", "u")
      .replaceAll("ç", "c")
      .replaceAll("Ç", "c");
  }

  /**
   * Show a toast notification
   * @param {Object} opts - Toast options
   * @param {string} opts.type - Toast type (success, danger, warning, info)
   * @param {string} opts.title - Toast title
   * @param {string} opts.body - Toast message
   * @param {number} opts.delay - Auto-hide delay in milliseconds
   */
  function showToast(opts) {
    if (typeof window.toast === "function") {
      window.toast(opts);
    } else {
      // Fallback to console
      const level = opts.type === 'danger' ? 'error' : 
                    opts.type === 'warning' ? 'warn' : 'log';
      console[level](`${opts.title}: ${opts.body}`);
    }
  }

  /**
   * Toast with icon helper
   * @param {string} type - Toast type
   * @param {string} title - Toast title
   * @param {string} msg - Toast message
   * @param {number} delay - Auto-hide delay
   */
  function toastWithIcon(type, title, msg, delay = 5000) {
    const icons = {
      success: "check_circle",
      warning: "warning",
      danger: "error",
      info: "info"
    };
    const icon = icons[type] || "info";
    
    const bodyHtml = `<div style="display:flex;align-items:flex-start;gap:.5rem;">
      <span class="material-symbols-rounded" style="font-size:22px;">${icon}</span>
      <div>${msg}</div>
    </div>`;
    
    showToast({ type, title, body: bodyHtml, delay });
  }

  /**
   * Format number with Turkish locale
   * @param {number} n - Number to format
   * @returns {string} Formatted number
   */
  function formatNumber(n) {
    return new Intl.NumberFormat("tr-TR").format(n || 0);
  }

  /**
   * Format date with Turkish locale
   * @param {Date|string} d - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  function formatDate(d, options = { dateStyle: 'short', timeStyle: 'short' }) {
    try {
      const date = d instanceof Date ? d : new Date(d);
      return new Intl.DateTimeFormat('tr-TR', options).format(date);
    } catch (e) {
      return String(d);
    }
  }

  /**
   * Debounce function execution
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(fn, delay) {
    let timer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  }

  /**
   * Check if file is an Excel file
   * @param {File} file - File object
   * @returns {boolean} True if Excel file
   */
  function isExcelFile(file) {
    if (!file || !file.name) return false;
    const name = file.name.toLowerCase();
    return name.endsWith('.xls') || name.endsWith('.xlsx');
  }

  /**
   * Validate email with @adalet.gov.tr domain
   * @param {string} email - Email address
   * @returns {boolean} True if valid
   */
  function isValidAdaletEmail(email) {
    return /^[A-Z0-9._%+-]+@adalet\.gov\.tr$/i.test(String(email || "").trim());
  }

  /**
   * Extract email from text
   * @param {string} text - Text containing email
   * @returns {string} Extracted email or empty string
   */
  function extractEmail(text) {
    const match = String(text || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    return match ? match[0].trim() : '';
  }

  /**
   * Format retry message based on seconds
   * @param {number} sec - Seconds to wait
   * @returns {string} Formatted message
   */
  function formatRetryMessage(sec) {
    sec = Number(sec) || 0;
    if (sec <= 0) return 'Bir süre sonra tekrar deneyin.';
    if (sec < 60) return sec + ' sn sonra tekrar deneyin.';
    const mins = Math.ceil(sec / 60);
    return mins + ' dk sonra tekrar deneyin.';
  }

  /**
   * Simple DOM element creator
   * @param {string} tag - HTML tag name
   * @param {Object} attrs - Element attributes
   * @param {string} html - Inner HTML
   * @returns {HTMLElement} Created element
   */
  function createElement(tag, attrs, html) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          el.setAttribute(key, attrs[key]);
        }
      }
    }
    if (html != null) {
      el.innerHTML = html;
    }
    return el;
  }

  /**
   * Simple selector helper
   * @param {string} selector - CSS selector
   * @param {Element} root - Root element (default: document)
   * @returns {Element|null} Found element
   */
  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  /**
   * Multiple selector helper
   * @param {string} selector - CSS selector
   * @param {Element} root - Root element (default: document)
   * @returns {NodeList} Found elements
   */
  function $$(selector, root = document) {
    return root.querySelectorAll(selector);
  }

  // Export utilities to global scope
  window.TeftisUtils = {
    letterToIndex,
    escapeHtml,
    normalizeTurkish,
    showToast,
    toastWithIcon,
    formatNumber,
    formatDate,
    debounce,
    isExcelFile,
    isValidAdaletEmail,
    extractEmail,
    formatRetryMessage,
    createElement,
    $,
    $$
  };

  // Also expose individual functions for backward compatibility
  window.letterToIndex = letterToIndex;
  window.escapeHtml = escapeHtml;
  window.normalizeTurkish = normalizeTurkish;
  window.formatRetryMessage = formatRetryMessage;

})(window);
