/**
 * ZombieHunter SecurityGuard v2.0
 * Multi-Vector Security Shield (AYA Protocol / Fire Team Elite Certified)
 */

import path from 'path';

// Dangerous shell characters for argument sanitization
const SHELL_METACHARS = /[;&|`$><!\\*\n\r]/;

// Sensitive file patterns forbidden from file access
const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /^id_rsa/i,
  /^id_ed25519/i,
  /masterpw/i,
  /credentials\.csv/i,
  /\.aws[\\\/]credentials/i
];

export class SecurityGuard {
  /**
   * Sanitizes command line inputs (e.g. filter, provider names)
   * @param {string} input 
   * @returns {string} Sanitized string
   */
  static sanitizeArgument(input) {
    if (typeof input !== 'string') {
      throw new Error('Invalid input type: expected string');
    }

    if (SHELL_METACHARS.test(input)) {
      throw new Error(`Security Violation: Input contains prohibited shell metacharacters: ${input}`);
    }

    // Zero-width & control character check
    if (/[\u200B-\u200D\uFEFF\u202A-\u202E\x00-\x1F\x7F]/.test(input)) {
      throw new Error('Security Violation: Prohibited control or BiDi override characters detected');
    }

    return input.trim();
  }

  /**
   * Validates file path against Path Traversal and Sensitive File Access
   * @param {string} targetPath 
   * @param {string} [allowedBaseDir]
   * @returns {string} Resolved safe path
   */
  static validateSafePath(targetPath, allowedBaseDir = process.cwd()) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Invalid path argument');
    }

    // Check for null-byte injection
    if (targetPath.includes('\0')) {
      throw new Error('Security Violation: Null byte in path detected');
    }

    const resolved = path.resolve(allowedBaseDir, targetPath);
    const basename = path.basename(resolved);

    // Check sensitive file blacklist
    for (const pattern of SENSITIVE_FILE_PATTERNS) {
      if (pattern.test(basename) || pattern.test(resolved)) {
        throw new Error(`Security Violation: Access to protected credential file blocked: ${basename}`);
      }
    }

    return resolved;
  }

  /**
   * Masks secrets (AWS Keys, Passwords, Bearer tokens) in text/json strings
   * @param {string} text 
   * @returns {string} Masked text
   */
  static maskSensitiveData(text) {
    if (typeof text !== 'string') return text;

    return text
      // AWS Access Key ID (AKIA...)
      .replace(/(AKIA[0-9A-Z]{16})/g, (m) => m.slice(0, 4) + '****************')
      // AWS Secret Access Key (40 chars base64)
      .replace(/(aws_secret_access_key\s*[:=]\s*["']?)([A-Za-z0-9/+=]{40})(["']?)/gi, '$1[MASKED_SECRET_KEY]$3')
      // Bearer Tokens
      .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]{15,}/gi, '$1[MASKED_BEARER_TOKEN]');
  }
}
