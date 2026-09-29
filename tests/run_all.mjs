/**
 * Master Test Runner (ZombieHunter – Gang 1, Gang 2 & Gang 3)
 * Full AYA-Protocol Verification
 */

import { execSync } from 'child_process';

const tests = [
  'tests/test_scanner_binary.mjs',
  'tests/test_finops_calculation.mjs',
  'tests/test_remediation.mjs',
  'tests/test_cli_interface.mjs',
  'tests/test_security_guard.mjs',
  'tests/test_mcp_interface.mjs',
  'tests/test_fireteam_pen_test.mjs'
];

console.log('🚀 Starte ZombieHunter Master Test Runner (7 Test-Suiten)...\n');

for (const t of tests) {
  console.log(`▶ Führe aus: ${t}`);
  execSync(`node ${t}`, { stdio: 'inherit' });
  console.log('');
}

console.log('🎉 ALLE 7 TEST-SUITEN ZU 100% BESTANDEN (VOLLSTÄNDIG GRÜN)!');
