/**
 * Test Suite: Auto-Remediation ("Drift-to-Code" & Zombie-Purge)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTerraformImports, generateZombiePurgeScripts } from '../src/core/remediator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🧪 [GANG 2 TEST] Starte Auto-Remediation Test Suite...');

  const fixturePath = path.resolve(__dirname, 'fixtures/sample_scan.json');
  const payload = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  // 1. Terraform Imports generieren
  const { importCommands, hclStubs } = generateTerraformImports(payload.unmanaged);

  assert.strictEqual(importCommands.length, 9, '9 Import-Befehle generiert');
  assert.strictEqual(importCommands[0].includes('tofu import aws_nat_gateway.imported_nat_0a1b2c3d4e5f60001 nat-0a1b2c3d4e5f60001'), true, 'OpenTofu Import Syntax korrekt');
  assert.strictEqual(hclStubs.includes('import {'), true, 'HCL 1.5+ import block syntax vorhanden');
  assert.strictEqual(hclStubs.includes('resource "aws_ebs_volume"'), true, 'EBS Volume HCL Block vorhanden');

  // 2. Teardown Purge Scripts generieren
  const zombieBreakdown = [
    { type: 'aws_nat_gateway', id: 'nat-01234567', monthlyCost: 32.85 },
    { type: 'aws_ebs_volume', id: 'vol-01234567', monthlyCost: 16.00 },
    { type: 'aws_eip', id: 'eipalloc-01234567', monthlyCost: 3.65 }
  ];

  const { ps1Script, shScript } = generateZombiePurgeScripts(zombieBreakdown);

  // PowerShell Script Assertions
  assert.strictEqual(ps1Script.includes('aws ec2 delete-nat-gateway --nat-gateway-id nat-01234567'), true, 'PS1 löscht NAT Gateway');
  assert.strictEqual(ps1Script.includes('aws ec2 delete-volume --volume-id vol-01234567'), true, 'PS1 löscht EBS Volume');
  assert.strictEqual(ps1Script.includes('aws ec2 release-address --allocation-id eipalloc-01234567'), true, 'PS1 gibt EIP frei');
  assert.strictEqual(ps1Script.includes('Read-Host'), true, 'PS1 Sicherheitsabfrage vorhanden');

  // Bash Script Assertions
  assert.strictEqual(shScript.includes('#!/usr/bin/env bash'), true, 'Bash Shebang vorhanden');
  assert.strictEqual(shScript.includes('aws ec2 delete-nat-gateway'), true, 'Bash löscht NAT Gateway');

  console.log('✅ [GANG 2 TEST BESTANDEN] Auto-Remediation & Zombie-Purge Scripts zu 100% funktionsfähig!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
