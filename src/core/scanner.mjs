/**
 * ZombieHunter Safe Scanner Wrapper
 * Part of Diamantenschmiede (AYA Protocol)
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to prebuilt driftctl binary
export const DRIFTCTL_BINARY = path.resolve(__dirname, '../../bin/driftctl.exe');

/**
 * Runs a scan safely with sandboxed arguments & strict telemetry killswitch
 * @param {Object} options 
 * @param {string} [options.from] IaC source (e.g. tfstate://path/to/terraform.tfstate)
 * @param {string} [options.to] Cloud provider (e.g. aws+tf)
 * @param {string} [options.filter] JMESPath filter expression
 * @param {string} [options.outputJsonPath] Output path for json
 * @param {number} [options.timeoutMs=60000] Timeout in ms
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string, durationMs: number }>}
 */
export async function runDriftScan(options = {}) {
  const binary = DRIFTCTL_BINARY;
  if (!fs.existsSync(binary)) {
    throw new Error(`driftctl binary not found at: ${binary}`);
  }

  const args = [
    'scan',
    '--disable-telemetry',
    '--no-version-check'
  ];

  if (options.from) {
    args.push('--from', options.from);
  }

  if (options.to) {
    args.push('--to', options.to);
  }

  if (options.filter) {
    args.push('--filter', options.filter);
  }

  if (options.outputJsonPath) {
    args.push('-o', `json://${options.outputJsonPath}`);
  }

  const timeoutMs = options.timeoutMs || 60000;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      windowsHide: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;
      if (timedOut) {
        return reject(new Error(`driftctl scan timed out after ${timeoutMs}ms`));
      }
      resolve({
        exitCode: exitCode ?? 0,
        stdout,
        stderr,
        durationMs
      });
    });
  });
}
