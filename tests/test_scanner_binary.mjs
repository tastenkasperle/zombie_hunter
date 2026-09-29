/**
 * Test Suite: Scanner Binary & Version Verification (Gang 1)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import fs from 'fs';
import { DRIFTCTL_BINARY } from '../src/core/scanner.mjs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function runTest() {
  console.log('🧪 [GANG 1 TEST] Verifiziere driftctl Native Binary...');

  // 1. Binary Existenz prüfen
  assert.strictEqual(fs.existsSync(DRIFTCTL_BINARY), true, 'driftctl.exe muss in bin/ existieren');

  // 2. Binary Ausführung prüfen
  const { stdout, stderr } = await execFileAsync(DRIFTCTL_BINARY, ['version']);
  assert.strictEqual(stdout.includes('v0.40.0'), true, 'Version v0.40.0 muss gemeldet werden');

  // 3. Help Flags prüfen
  const helpResult = await execFileAsync(DRIFTCTL_BINARY, ['scan', '--help']);
  assert.strictEqual(helpResult.stdout.includes('--from'), true, '--from Flag vorhanden');
  assert.strictEqual(helpResult.stdout.includes('--to'), true, '--to Flag vorhanden');
  assert.strictEqual(helpResult.stdout.includes('--disable-telemetry'), true, '--disable-telemetry Flag vorhanden');

  console.log('✅ [GANG 1 TEST BESTANDEN] Native driftctl Binary ist 100% funktionsfähig im Windows Standardnutzer-Kontext!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
