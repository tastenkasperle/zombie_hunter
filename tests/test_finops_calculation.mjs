/**
 * Test Suite: FinOps Calculation & Risk Evaluation (Gang 1)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditScanPayload } from '../src/core/finops.mjs';
import { generateMarkdownReport } from '../src/core/reporter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🧪 [GANG 1 TEST] Starte FinOps Calculation Test Suite...');

  const fixturePath = path.resolve(__dirname, 'fixtures/sample_scan.json');
  assert.strictEqual(fs.existsSync(fixturePath), true, 'Fixture file exists');

  const rawJson = fs.readFileSync(fixturePath, 'utf-8');
  const payload = JSON.parse(rawJson);

  // 1. Audit ausführen
  const audit = auditScanPayload(payload);

  // 2. Prüfung der Metadaten
  assert.strictEqual(audit.meta.unmanagedCount, 9, 'Erkennt exakt 9 unmanaged Ressourcen');
  assert.strictEqual(audit.meta.zombieResourceCount, 7, 'Erkennt exakt 7 kostenverursachende Zombies');
  assert.strictEqual(audit.meta.criticalSecurityFindings, 2, 'Erkennt 2 kritische Sicherheitsbefunde (S3 & SG 0.0.0.0/0)');

  // 3. Prüfung der Kosten-Kalkulation
  // 2 x NAT Gateway (32.85 * 2 = 65.70)
  // 1 x EBS gp3 200GB (200 * 0.08 = 16.00)
  // 1 x EBS io2 500GB (500 * 0.125 = 62.50)
  // 2 x EIP (3.65 * 2 = 7.30)
  // 1 x ALB (22.50)
  // Total = 65.70 + 16.00 + 62.50 + 7.30 + 22.50 = 174.00
  const expectedMonthly = 174.00;
  const expectedYearly = parseFloat((174.00 * 12).toFixed(2)); // 2088.00

  assert.strictEqual(audit.financialSummary.totalMonthlyWaste, expectedMonthly, `Monatliche Kosten müssen $${expectedMonthly} sein`);
  assert.strictEqual(audit.financialSummary.totalYearlyWaste, expectedYearly, `Jährliche Kosten müssen $${expectedYearly} sein`);

  // Shared-Savings Angebote prüfen
  assert.strictEqual(audit.financialSummary.sharedSavingsOfferYearly20Pct, parseFloat((expectedYearly * 0.20).toFixed(2)), '20% Jahreshonorar korrekt');
  assert.strictEqual(audit.financialSummary.sharedSavingsOfferQuarterly25Pct, parseFloat(((expectedMonthly * 3) * 0.25).toFixed(2)), '25% Quartalshonorar korrekt');

  // 4. Report-Generierung prüfen
  const report = generateMarkdownReport(audit);
  assert.strictEqual(report.includes('EXECUTIVE FINOPS & CLOUD GOVERNANCE AUDIT'), true, 'Report Header vorhanden');
  assert.strictEqual(report.includes('$174.00'), true, 'Monatsverlust im Report');
  assert.strictEqual(report.includes('$2088.00'), true, 'Jahresverlust im Report');
  assert.strictEqual(report.includes('confidential-data-test-bucket-leak'), true, 'S3 Leak im Report');
  assert.strictEqual(report.includes('nat-0a1b2c3d4e5f60001'), true, 'NAT Gateway im Report');

  console.log('✅ [GANG 1 TEST BESTANDEN] Alle FinOps- & Risk-Kalkulationen zu 100% präzise!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
