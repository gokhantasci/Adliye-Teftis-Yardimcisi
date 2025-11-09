/**
 * Tests for utils.js utility functions
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read and execute utils.js in a test environment
const utilsPath = path.join(__dirname, '../assets/js/utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

// Create a mock window object
let TeftisUtils;
beforeAll(() => {
  const mockWindow = {};
  // Execute the IIFE manually
  const utilsFunction = new Function('window', utilsCode.replace('(function(window) {', '').replace(/}\)\(window\);?\s*$/, ''));
  utilsFunction(mockWindow);
  TeftisUtils = mockWindow.TeftisUtils;
});

describe('TeftisUtils', () => {
  describe('letterToIndex', () => {
    test('converts single letters correctly', () => {
      expect(TeftisUtils.letterToIndex('A')).toBe(0);
      expect(TeftisUtils.letterToIndex('B')).toBe(1);
      expect(TeftisUtils.letterToIndex('Z')).toBe(25);
    });

    test('converts double letters correctly', () => {
      expect(TeftisUtils.letterToIndex('AA')).toBe(26);
      expect(TeftisUtils.letterToIndex('AB')).toBe(27);
      expect(TeftisUtils.letterToIndex('AZ')).toBe(51);
    });

    test('handles lowercase letters', () => {
      expect(TeftisUtils.letterToIndex('a')).toBe(0);
      expect(TeftisUtils.letterToIndex('z')).toBe(25);
    });

    test('handles whitespace', () => {
      expect(TeftisUtils.letterToIndex(' A ')).toBe(0);
      expect(TeftisUtils.letterToIndex(' AB ')).toBe(27);
    });
  });

  describe('escapeHtml', () => {
    test('escapes HTML special characters', () => {
      expect(TeftisUtils.escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('escapes ampersands', () => {
      expect(TeftisUtils.escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('escapes quotes', () => {
      expect(TeftisUtils.escapeHtml('It\'s a "test"'))
        .toBe('It&#39;s a &quot;test&quot;');
    });

    test('handles null and undefined', () => {
      expect(TeftisUtils.escapeHtml(null)).toBe('');
      expect(TeftisUtils.escapeHtml(undefined)).toBe('');
    });

    test('handles non-string values', () => {
      expect(TeftisUtils.escapeHtml(123)).toBe('123');
      expect(TeftisUtils.escapeHtml(true)).toBe('true');
    });
  });

  describe('normalizeTurkish', () => {
    test('converts Turkish characters to ASCII', () => {
      // Note: İ (Turkish capital I with dot) becomes i with combining dot when lowercased
      const result = TeftisUtils.normalizeTurkish('ışğüöçİŞĞÜÖÇ');
      expect(result).toContain('i');
      expect(result).toContain('s');
      expect(result).toContain('g');
      expect(result).toContain('u');
      expect(result).toContain('o');
      expect(result).toContain('c');
    });

    test('converts to lowercase', () => {
      expect(TeftisUtils.normalizeTurkish('HELLO WORLD')).toBe('hello world');
    });

    test('normalizes whitespace', () => {
      expect(TeftisUtils.normalizeTurkish('  multiple   spaces  ')).toBe('multiple spaces');
    });

    test('handles newlines', () => {
      expect(TeftisUtils.normalizeTurkish('line1\nline2\r\nline3')).toBe('line1 line2 line3');
    });
  });

  describe('formatNumber', () => {
    test('formats numbers with Turkish locale', () => {
      expect(TeftisUtils.formatNumber(1234567.89)).toBe('1.234.567,89');
    });

    test('handles integers', () => {
      expect(TeftisUtils.formatNumber(1000)).toBe('1.000');
    });

    test('handles zero', () => {
      expect(TeftisUtils.formatNumber(0)).toBe('0');
    });

    test('handles negative numbers', () => {
      const result = TeftisUtils.formatNumber(-1234.56);
      expect(result).toContain('-');
      expect(result).toContain('1');
    });
  });

  describe('isExcelFile', () => {
    test('accepts .xls files', () => {
      const file = { name: 'data.xls', type: 'application/vnd.ms-excel' };
      expect(TeftisUtils.isExcelFile(file)).toBe(true);
    });

    test('accepts .xlsx files', () => {
      const file = { name: 'data.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
      expect(TeftisUtils.isExcelFile(file)).toBe(true);
    });

    test('rejects non-Excel files', () => {
      const file = { name: 'document.pdf', type: 'application/pdf' };
      expect(TeftisUtils.isExcelFile(file)).toBe(false);
    });

    test('checks file extension when type is not standard', () => {
      const file = { name: 'data.xlsx', type: 'application/octet-stream' };
      expect(TeftisUtils.isExcelFile(file)).toBe(true);
    });
  });

  describe('isValidAdaletEmail', () => {
    test('accepts valid @adalet.gov.tr emails', () => {
      expect(TeftisUtils.isValidAdaletEmail('user@adalet.gov.tr')).toBe(true);
      expect(TeftisUtils.isValidAdaletEmail('test.user@adalet.gov.tr')).toBe(true);
    });

    test('rejects invalid domain', () => {
      expect(TeftisUtils.isValidAdaletEmail('user@gmail.com')).toBe(false);
      expect(TeftisUtils.isValidAdaletEmail('user@adalet.com')).toBe(false);
    });

    test('rejects malformed emails', () => {
      expect(TeftisUtils.isValidAdaletEmail('notanemail')).toBe(false);
      expect(TeftisUtils.isValidAdaletEmail('@adalet.gov.tr')).toBe(false);
    });

    test('handles null and undefined', () => {
      expect(TeftisUtils.isValidAdaletEmail(null)).toBe(false);
      expect(TeftisUtils.isValidAdaletEmail(undefined)).toBe(false);
    });
  });

  describe('debounce', () => {
    test('delays function execution', (done) => {
      let callCount = 0;
      const mockFn = () => { callCount++; };
      const debounced = TeftisUtils.debounce(mockFn, 50);

      debounced();
      expect(callCount).toBe(0);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    test('only calls function once for multiple rapid calls', (done) => {
      let callCount = 0;
      const mockFn = () => { callCount++; };
      const debounced = TeftisUtils.debounce(mockFn, 50);

      debounced();
      debounced();
      debounced();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });
});
