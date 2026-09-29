/**
 * Test Suite: CLI Interface & Execution (Gang 2)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🧪 [GANG 2 TEST] Starte CLI Interface Test Suite...');

  const cliPath = path.resolve(__dirname, '../src/cli/index.mjs');
  const fixturePath = path.resolve(__dirname, 'fixtures/sample_scan.json');
  const tempDir = path.resolve(__dirname, 'temp_cli_out');

  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  // 1. Test CLI Help
  const helpResult = await execFileAsync('node', [cliPath, 'help']);
  assert.strictEqual(helpResult.stdout.includes('ZombieHunter CLI'), true, 'Help Output korrekt');

  // 2. Test CLI Audit
  const auditReportOut = path.join(tempDir, 'audit_report.md');
  fs.mkdirSync(tempDir, { recursive: true });

  const auditResult = await execFileAsync('node', [cliPath, 'audit', fixturePath, '--out', auditReportOut]);
  assert.strictEqual(auditResult.stdout.includes('EXECUTIVE FINOPS'), true, 'CLI Audit Output vorhanden');
  assert.strictEqual(fs.existsSync(auditReportOut), true, 'Report-Datei wurde geschrieben');

  // 3. Test CLI Remediate
  const remediateDir = path.join(tempDir, 'remediation');
  const remResult = await execFileAsync('node', [cliPath, 'remediate', fixturePath, '--dir', remediateDir]);
  assert.strictEqual(remResult.stdout.includes('REMEDIATION BEREITGESTELLT'), true, 'Remediation Bestätigung');
  assert.strictEqual(fs.existsSync(path.join(remediateDir, 'imports.tf')), true, 'imports.tf existiert');
  assert.strictEqual(fs.existsSync(path.join(remediateDir, 'teardown_zombies.ps1')), true, 'teardown_zombies.ps1 existiert');

  // Cleanup
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log('✅ [GANG 2 TEST BESTANDEN] CLI Interface (audit, remediate, help) zu 100% grün!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
