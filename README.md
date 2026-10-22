# 🧟‍♂️ ZombieHunter (DriftSentinel Engine)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Glama Score](https://glama.ai/mcp/servers/tastenkasperle/zombie_hunter/badges/score.svg)](https://glama.ai/mcp/servers/tastenkasperle/zombie_hunter)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Test Suite](https://img.shields.io/badge/Tests-7%2F7%20Passed-brightgreen.svg)](tests/)
[![Security Guard](https://img.shields.io/badge/Security-Raptor_Guard_Hardened-orange.svg)](src/core/guard.mjs)

> **FinOps-powered Cloud Governance & Shadow-IT Detection engine for Terraform & OpenTofu.**  
> *Discovers orphaned cloud zombies, calculates monthly burn ($/mo), generates drift-to-code remediation, and provides Model Context Protocol (MCP) tools for autonomous DevOps agents.*

---

## 💡 The Problem

Infrastructure-as-Code (Terraform & OpenTofu) only knows what is written in your code files.  
When cloud resources (NAT Gateways, unattached EBS volumes, zombie ALBs, idle Elastic IPs) are spun up manually in web consoles or left behind after hasty refactorings, Terraform and OpenTofu are **completely blind** to them.

* **Financial Hemorrhage:** Hundreds to thousands of dollars wasted every single month on forgotten infrastructure.
* **Security & Compliance Blindspots:** Unmanaged security groups and open buckets fail SOC 2 and ISO 27001 audits.
* **Agentic Limitation:** Modern AI DevOps agents lack direct, safe tools to detect and remediate out-of-band cloud drift.

---

## ⚡ Key Capabilities

* 🔍 **Zero-Knowledge Cloud Scans:** Compares live cloud state (AWS) against your `.tfstate` to detect unmanaged and rogue resources.
* 💰 **FinOps Burn Matrix:** Automatically calculates monthly wasted budget ($/month) and potential shared savings.
* 🛠️ **Drift-to-Code Remediation:** Generates native Terraform 1.5+ `import` blocks to bring rogue assets under control.
* 🧹 **Safe Purge Generator:** Emits defensive, double-confirmed bash and PowerShell scripts to clean up orphaned assets.
* 🤖 **Native Model Context Protocol (MCP):** Exposes structured, hardened tools for AI agents (Claude Desktop, Cursor, Antigravity, AutoGen, CrewAI).
* 🛡️ **Raptor Guard v2.0:** Hardened against shell injection, path traversal, null bytes, and accidental AWS credential leakage.

---

## 🤖 Model Context Protocol (MCP) Integration

ZombieHunter runs out-of-the-box as an MCP stdio server.

### Add to Claude Desktop / Cursor / Antigravity

Add this to your `claude_desktop_config.json` or MCP settings:

```json
{
  "mcpServers": {
    "zombie-hunter": {
      "command": "node",
      "args": ["/path/to/zombie_hunter/src/mcp/server.mjs"],
      "env": {
        "AWS_REGION": "eu-central-1"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
| :--- | :--- |
| `finops_status` | Returns supported AWS resource types, FinOps unit costs, and security guard status. |
| `finops_audit_scan` | Ingests scan findings, calculates total monthly burn ($/mo), and returns an executive FinOps report. |
| `finops_remediate_drift` | Generates Terraform/OpenTofu HCL `import` blocks and safe purge scripts. |
| `finops_scan_cloud` | Executes a live drift scan against AWS using IaC state files. |

---

## 💻 CLI Usage

ZombieHunter can also be executed directly via terminal:

```bash
# Display help and available commands
node src/cli/index.mjs help

# Perform an executive FinOps audit on a scan report
node src/cli/index.mjs audit report.json

# Generate HCL remediation import blocks
node src/cli/index.mjs remediate report.json --mode import

# Generate safe deletion scripts
node src/cli/index.mjs remediate report.json --mode purge --shell bash
```

---

## 🧪 Testing & Verification

ZombieHunter passes 7 hermetic test suites including the Fire Team Elite Pen-Test:

```bash
node tests/test_finops_calculation.mjs
node tests/test_security_guard.mjs
node tests/test_remediation.mjs
node tests/test_cli_interface.mjs
node tests/test_mcp_interface.mjs
node tests/test_fireteam_pen_test.mjs
```

---

## 📄 License & Origin

* **Core Engine:** Standalone `driftctl` (originally by Snyk/CloudSkiff, Apache 2.0).
* **Veredelung & Architecture:** Diamantenschmiede & Wolfsrudel (AYA Protocol v1.0).
* **License:** [Apache 2.0](LICENSE).
