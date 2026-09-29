#!/usr/bin/env node
/**
 * ZombieHunter Standalone CLI Interface
 * Part of Diamantenschmiede (AYA Protocol)
 */

import fs from 'fs';
import path from 'path';
import { auditScanPayload } from '../core/finops.mjs';
import { generateMarkdownReport } from '../core/reporter.mjs';
import { generateTerraformImports, generateZombiePurgeScripts } from '../core/remediator.mjs';
import { runDriftScan } from '../core/scanner.mjs';
import { SecurityGuard } from '../core/guard.mjs';

function printHelp() {
  console.log(`
🧟‍♂️ ZombieHunter CLI – FinOps Cloud Governance & Shadow IT Hunter

VERWENDUNG:
  zombie-hunter <command> [options]

BEFEHLE:
  audit <scan.json>        Analysiert einen driftctl JSON-Scan auf Zombie-Kosten & Risiken
                           Optionen: --out <report.md> (Bericht speichern)

  remediate <scan.json>    Erzeugt Terraform/OpenTofu 'imports.tf' und Teardown-Skripte
                           Optionen: --dir <ziel-ordner> (Standard: ./remediation)

  scan                     Führt einen Live-Scan über driftctl aus
                           Optionen: --from <tfstate-pfad> --to <cloud-ziel> --out <scan.json>

  help                     Zeigt diese Hilfe an
`);
}

async function handleAudit(args) {
  const filePath = args[0];
  if (!filePath) {
    console.error('❌ Fehler: Bitte Pfad zur scan.json angeben. (z. B. zombie-hunter audit scan.json)');
    process.exit(1);
  }

  const safePath = SecurityGuard.validateSafePath(filePath);
  if (!fs.existsSync(safePath)) {
    console.error(`❌ Fehler: Datei nicht gefunden: ${safePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(safePath, 'utf-8');
  const payload = JSON.parse(raw);
  const audit = auditScanPayload(payload);
  const report = generateMarkdownReport(audit);

  // Mask sensitive credentials before display
  const maskedReport = SecurityGuard.maskSensitiveData(report);

  // Check if --out specified
  const outIdx = args.indexOf('--out');
  if (outIdx !== -1 && args[outIdx + 1]) {
    const outPath = SecurityGuard.validateSafePath(args[outIdx + 1]);
    fs.writeFileSync(outPath, maskedReport, 'utf-8');
    console.log(`💾 Bericht erfolgreich gespeichert unter: ${outPath}`);
  }

  console.log(maskedReport);
}

async function handleRemediate(args) {
  const filePath = args[0];
  if (!filePath) {
    console.error('❌ Fehler: Bitte Pfad zur scan.json angeben.');
    process.exit(1);
  }

  const safePath = SecurityGuard.validateSafePath(filePath);
  if (!fs.existsSync(safePath)) {
    console.error(`❌ Fehler: Datei nicht gefunden: ${safePath}`);
    process.exit(1);
  }

  let targetDir = path.resolve(process.cwd(), 'remediation');
  const dirIdx = args.indexOf('--dir');
  if (dirIdx !== -1 && args[dirIdx + 1]) {
    targetDir = SecurityGuard.validateSafePath(args[dirIdx + 1]);
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const raw = fs.readFileSync(safePath, 'utf-8');
  const payload = JSON.parse(raw);
  const audit = auditScanPayload(payload);

  // 1. Generate Terraform/OpenTofu imports
  const { hclStubs, importCommands } = generateTerraformImports(payload.unmanaged || []);
  const hclPath = path.join(targetDir, 'imports.tf');
  fs.writeFileSync(hclPath, hclStubs, 'utf-8');

  const cmdPath = path.join(targetDir, 'import_commands.sh');
  fs.writeFileSync(cmdPath, importCommands.join('\n'), 'utf-8');

  // 2. Generate Teardown Purge Scripts
  const { ps1Script, shScript } = generateZombiePurgeScripts(audit.zombieBreakdown);
  const ps1Path = path.join(targetDir, 'teardown_zombies.ps1');
  const shPath = path.join(targetDir, 'teardown_zombies.sh');
  fs.writeFileSync(ps1Path, ps1Script, 'utf-8');
  fs.writeFileSync(shPath, shScript, 'utf-8');

  console.log(`
✅ [REMEDIATION BEREITGESTELLT]
Ziel-Ordner: ${targetDir}
  📄 ${hclPath} (OpenTofu / Terraform 1.5+ HCL Import Blocks)
  📄 ${cmdPath} (CLI Import-Befehle)
  📄 ${ps1Path} (PowerShell Zombie-Purge Skript)
  📄 ${shPath} (Bash Zombie-Purge Skript)
`);
}

async function handleScan(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from' && args[i + 1]) options.from = args[++i];
    if (args[i] === '--to' && args[i + 1]) options.to = args[++i];
    if (args[i] === '--filter' && args[i + 1]) options.filter = SecurityGuard.sanitizeArgument(args[++i]);
    if (args[i] === '--out' && args[i + 1]) options.outputJsonPath = SecurityGuard.validateSafePath(args[++i]);
  }

  console.log('🔍 Starte driftctl Cloud-Scan...');
  const result = await runDriftScan(options);
  console.log(SecurityGuard.maskSensitiveData(result.stdout));
  if (result.stderr) {
    console.error(SecurityGuard.maskSensitiveData(result.stderr));
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  const args = argv.slice(1);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  switch (command) {
    case 'audit':
      await handleAudit(args);
      break;
    case 'remediate':
      await handleRemediate(args);
      break;
    case 'scan':
      await handleScan(args);
      break;
    default:
      console.error(`❌ Unbekannter Befehl: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('❌ Unerwarteter Fehler:', err.message);
  process.exit(1);
});
