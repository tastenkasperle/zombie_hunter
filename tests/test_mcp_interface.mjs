/**
 * Test Suite: Model Context Protocol (MCP) Interface (Gang 3)
 * Part of Diamantenschmiede (AYA Protocol)
 */

import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleRequest } from '../src/mcp/server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  console.log('🧪 [GANG 3 TEST] Starte MCP Server Interface Test Suite...');

  const fixturePath = path.resolve(__dirname, 'fixtures/sample_scan.json');

  // 1. Test initialize
  const initRes = await handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  });
  assert.strictEqual(initRes.result.serverInfo.name, 'zombie-hunter-mcp', 'Server Info Name korrekt');

  // 2. Test tools/list
  const listRes = await handleRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  });
  assert.strictEqual(listRes.result.tools.length, 4, '4 MCP Tools deklariert');
  const toolNames = listRes.result.tools.map(t => t.name);
  assert.strictEqual(toolNames.includes('finops_audit_scan'), true, 'finops_audit_scan vorhanden');
  assert.strictEqual(toolNames.includes('finops_remediate_drift'), true, 'finops_remediate_drift vorhanden');

  // 3. Test finops_status
  const statusRes = await handleRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'finops_status', arguments: {} }
  });
  const statusData = JSON.parse(statusRes.result.content[0].text);
  assert.strictEqual(statusData.status, 'online', 'Status online');
  assert.strictEqual(statusData.driftctlBinaryInstalled, true, 'driftctl binary verifiziert');

  // 4. Test finops_audit_scan
  const auditRes = await handleRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'finops_audit_scan', arguments: { filePath: fixturePath } }
  });
  assert.strictEqual(auditRes.result.content[0].text.includes('EXECUTIVE FINOPS'), true, 'Audit Report via MCP generiert');
  const summaryJson = JSON.parse(auditRes.result.content[1].text);
  assert.strictEqual(summaryJson.totalMonthlyWaste, 174.00, 'FinOps Waste Summary stimmt');

  // 5. Test finops_remediate_drift
  const remRes = await handleRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: { name: 'finops_remediate_drift', arguments: { filePath: fixturePath } }
  });
  assert.strictEqual(remRes.result.content[0].text.includes('tofu import'), true, 'HCL Import Blocks via MCP vorhanden');
  assert.strictEqual(remRes.result.content[1].text.includes('aws ec2 delete-nat-gateway'), true, 'Purge Skripte via MCP vorhanden');

  console.log('✅ [GANG 3 TEST BESTANDEN] MCP Server Interface zu 100% funktionsfähig!');
}

runTest().catch((err) => {
  console.error('❌ [TEST FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
