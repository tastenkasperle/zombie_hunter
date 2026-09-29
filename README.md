# 🧟‍♂️ ZombieHunter (DriftSentinel Engine)

> **FinOps-gestützte Cloud-Governance & Shadow-IT-Detektion.**  
> *Teil der Diamantenschmiede – Veredelt nach dem AYA-Protokoll v1.0.*

---

## 💡 Das Problem
Infrastructure-as-Code (Terraform & OpenTofu) verwaltet nur, was im Code steht.  
Werden Cloud-Ressourcen (NAT Gateways, EBS-Volumes, Load Balancer) manuell in Web-Konsolen angelegt oder bei Refactorings vergessen, sind Terraform und OpenTofu dafür **vollständig blind**. 

**Die Folge:** Hunderte bis Tausende Dollar verbrannte Cloud-Kosten jeden Monat ("Zombie-Infrastruktur") und unkontrollierte Sicherheitsrisiken bei Audits (SOC 2, ISO 27001).

---

## 🚀 Die Lösung
ZombieHunter scannt Cloud-Accounts read-only, vergleicht den realen Zustand mit deinen State-Files und liefert:
1. **Den FinOps-Report:** Welches Geld wird durch verwaiste Ressourcen monatlich verbrannt?
2. **Den Security-Check:** Welche unmanaged Security Groups oder Buckets klaffen offen?
3. **Auto-Remediation:** Sofortige Generierung von HCL-Code oder Bereinigungs-Skripten.

---

## 📦 Architektur & Voraussetzungen
- **Engine:** Standalone `bin/driftctl.exe` (v0.40.0, Apache 2.0).
- **Runtime:** Portables Node.js (v24.x) oder Python (3.12.x) – 100% User-Space auf Windows 11.
- **Null Admin-Rechte:** Läuft vollständig ohne Systemtreiber oder Installationen.
