# 📋 SPECIFICATION: ZombieHunter (DriftSentinel Engine)
**Projekt:** ZombieHunter / DriftSentinel  
**Status:** In Entwicklung (Gang 1)  
**Standard:** Diamantenschmiede AYA-Protokoll v1.0  
**Standort:** `C:\Users\UserS2025\Desktop\Development\diamantenschmiede\zombie_hunter`

---

## 1. Executive Summary
ZombieHunter ist ein FinOps-gestütztes Cloud-Governance- und Drift-Detection-System. Auf der Basis der verwaisten `driftctl`-Engine (Apache 2.0) schließt ZombieHunter die kritische Lücke zwischen Infrastructure-as-Code (Terraform/OpenTofu) und realen Cloud-Kosten.

Während Terraform und OpenTofu nur deklarierte Ressourcen überwachen können (`refresh-only`), detektiert ZombieHunter **unmanaged "Zombie"-Ressourcen** (Shadow IT), quantifiziert das verbrannte monatliche Budget und liefert automatisierte Executive Audits sowie 1-Klick Auto-Remediation ("Drift-to-Code").

---

## 2. Kern-Architektur

```
+-------------------------------------------------------------------------+
|                              ZombieHunter                               |
|                                                                         |
|  +--------------------+    +--------------------+    +----------------+ |
|  |   Driftctl Core    |--->| FinOps Evaluator   |--->| Audit Report   | |
|  |   (Go Binary)      |    | (Cost & Risk Map)  |    | (JSON/HTML/PDF)| |
|  +--------------------+    +--------------------+    +----------------+ |
|            |                                                 |          |
|            v                                                 v          |
|  +--------------------+                            +----------------+   |
|  | Security Guard v2  |                            | MCP Server     |   |
|  | (Cred & Leak Shield)                            | (Stdio Agent)  |   |
|  +--------------------+                            +----------------+   |
+-------------------------------------------------------------------------+
```

### Module:
1. `bin/driftctl.exe`: Standalone Native Go Engine (v0.40.0) für Multi-Cloud-Scans (AWS, Azure, GCP, GitHub).
2. `src/core/scanner.mjs`: Isolierter Execution-Wrapper mit Hardening (Telemetry Aus, No-Crash-Report, Timeout-Schutz, Sanitization).
3. `src/core/finops.mjs`: FinOps-Matrix zur automatischen Kostenberechnung unmanaged Cloud-Ressourcen (NAT Gateways, EBS, EIP, ALBs).
4. `src/core/reporter.mjs`: Generierung von Human- und CFO-tauglichen Audit-Reports (Kostenersparnis, Risikoeinstufung, Shared-Savings Kalkulation).
5. `src/mcp/server.mjs`: Model Context Protocol Interface für autonome Security- & FinOps-Agenten.

---

## 3. FinOps Zombie-Kosten-Matrix (AWS Benchmark)

| Ressource | Typischer monatlicher Zombie-Schaden | Erkennungs-Logik |
| :--- | :--- | :--- |
| `aws_nat_gateway` | **~$32.85 / Monat** + Traffic | Unmanaged oder 0 Bytes Transfer über 14 Tage |
| `aws_ebs_volume` | **~$8.00 – $80.00 / Monat** (je nach GB/Typ) | Status `available` (nicht an EC2 gemountet) |
| `aws_eip` | **~$3.65 / Monat** ($0.005/h) | Unattached Elastic IP (AWS Strafgebühr!) |
| `aws_lb` / `aws_alb` | **~$22.50 / Monat** + LCU | Load Balancer ohne aktive Target Group Instances |
| `aws_rds_cluster_snapshot`| **~$0.095 / GB / Monat** | Verwaiste manuelle Snapshots gelöschter Datenbanken |

---

## 4. Sicherheits- und Sandboxing-Regeln (Standardnutzer-Viona)
1. **Zero-Cred-Exposure:** Keine AWS-Keys werden in Logs, stdout oder temporären Dateien im Klartext abgelegt.
2. **Offline-Fähigkeit:** Umfassende Mock-Suiten für Tests ohne aktive Cloud-Kosten.
3. **Telemetry-Killswitch:** Zwingendes `--disable-telemetry` und `--no-version-check` bei jedem Scan-Aufruf.
