/**
 * ZombieHunter MCP Server (Model Context Protocol)
 * Native Stdio JSON-RPC 2.0 Server for Local AI Agents
 * Part of Diamantenschmiede (AYA Protocol / Gang 3)
 */

import readline from 'readline';
import fs from 'fs';
import { auditScanPayload } from '../core/finops.mjs';
import { generateMarkdownReport } from '../core/reporter.mjs';
import { generateTerraformImports, generateZombiePurgeScripts } from '../core/remediator.mjs';
import { runDriftScan, DRIFTCTL_BINARY } from '../core/scanner.mjs';
import { SecurityGuard } from '../core/guard.mjs';

const SERVER_NAME = 'zombie-hunter-mcp';
const SERVER_VERSION = '1.0.0';

// Available MCP Tools
const TOOLS = [
  {
    name: 'finops_status',
    description: 'Returns the ZombieHunter engine health, driftctl binary version, and active cost benchmark rates.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'finops_audit_scan',
    description: 'Audits a driftctl scan payload (JSON string or file path), calculates monthly/yearly cloud waste, and evaluates security risks.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Absolute or relative path to driftctl scan.json file' },
        rawJson: { type: 'string', description: 'Direct JSON string of the driftctl scan result (optional)' }
      }
    }
  },
  {
    name: 'finops_remediate_drift',
    description: 'Generates OpenTofu/Terraform HCL import blocks and safe automated teardown scripts (PowerShell & Bash) for identified zombie resources.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: { type: 'string', description: 'Path to driftctl scan.json file' }
      },
      required: ['filePath']
    }
  },
  {
    name: 'finops_scan_cloud',
    description: 'Executes a live cloud drift scan via driftctl with security guardrails and telemetry disabled.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'IaC source (e.g. tfstate://path/to/terraform.tfstate)' },
        to: { type: 'string', description: 'Cloud provider target (aws+tf, gcp+tf, azure+tf, github+tf)' },
        filter: { type: 'string', description: 'Safe JMESPath filter expression' }
      }
    }
  }
];

// JSON-RPC Dispatcher
export async function handleRequest(request) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params;

    try {
      if (name === 'finops_status') {
        const binaryExists = fs.existsSync(DRIFTCTL_BINARY);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'online',
                engine: 'ZombieHunter',
                version: SERVER_VERSION,
                driftctlBinaryInstalled: binaryExists,
                supportedClouds: ['aws', 'gcp', 'azure', 'github']
              }, null, 2)
            }]
          }
        };
      }

      if (name === 'finops_audit_scan') {
        let payload;
        if (args.rawJson) {
          payload = JSON.parse(args.rawJson);
        } else if (args.filePath) {
          const safePath = SecurityGuard.validateSafePath(args.filePath);
          payload = JSON.parse(fs.readFileSync(safePath, 'utf-8'));
        } else {
          throw new Error('Either filePath or rawJson must be provided');
        }

        const audit = auditScanPayload(payload);
        const report = SecurityGuard.maskSensitiveData(generateMarkdownReport(audit));

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              { type: 'text', text: report },
              { type: 'text', text: JSON.stringify(audit.financialSummary, null, 2) }
            ]
          }
        };
      }

      if (name === 'finops_remediate_drift') {
        const safePath = SecurityGuard.validateSafePath(args.filePath);
        const payload = JSON.parse(fs.readFileSync(safePath, 'utf-8'));
        const audit = auditScanPayload(payload);

        const { hclStubs, importCommands } = generateTerraformImports(payload.unmanaged || []);
        const { ps1Script, shScript } = generateZombiePurgeScripts(audit.zombieBreakdown);

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: `### OpenTofu / Terraform Import Commands:\n\`\`\`bash\n${importCommands.join('\n')}\n\`\`\`\n\n### HCL 1.5+ Import Blocks:\n\`\`\`hcl\n${hclStubs}\n\`\`\``
              },
              { type: 'text', text: `### PowerShell Purge Script:\n\`\`\`powershell\n${ps1Script}\n\`\`\`` }
            ]
          }
        };
      }

      if (name === 'finops_scan_cloud') {
        const scanOptions = {};
        if (args.from) scanOptions.from = args.from;
        if (args.to) scanOptions.to = args.to;
        if (args.filter) scanOptions.filter = SecurityGuard.sanitizeArgument(args.filter);

        const scanResult = await runDriftScan(scanOptions);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: SecurityGuard.maskSensitiveData(scanResult.stdout || 'Scan completed.')
            }]
          }
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

// Start Stdio Loop if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

  rl.on('line', async (line) => {
    if (!line.trim()) return;
    try {
      const request = JSON.parse(line);
      const response = await handleRequest(request);
      process.stdout.write(JSON.stringify(response) + '\n');
    } catch (err) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: ' + err.message }
      }) + '\n');
    }
  });
}
