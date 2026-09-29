/**
 * ZombieHunter Executive Audit Report Generator
 * Part of Diamantenschmiede (AYA Protocol)
 */

/**
 * Generates an executive Markdown audit report
 * @param {Object} auditResult Result from auditScanPayload()
 * @returns {string} Markdown report
 */
export function generateMarkdownReport(auditResult) {
  const { meta, financialSummary, zombieBreakdown, securityFindings } = auditResult;

  let md = `# 🧟‍♂️ EXECUTIVE FINOPS & CLOUD GOVERNANCE AUDIT
**Generiert am:** ${new Date(meta.timestamp).toLocaleString()}  
**Tool:** ZombieHunter (DriftSentinel Engine)  
**Standard:** Diamantenschmiede AYA Protocol v1.0

---

## 💰 1. Executive Summary & Financial Exposure

| Kennzahl | Wert |
| :--- | :--- |
| **Gescannte Ressourcen gesamt** | **${meta.analyzedResources}** |
| **Nicht im Code verwaltet (Shadow IT / Unmanaged)** | **${meta.unmanagedCount}** |
| **Identifizierte Zombie-Kostenfresser** | **${meta.zombieResourceCount}** |
| **Kritische Sicherheits-Befunde (Security Gaps)** | **${meta.criticalSecurityFindings}** |
| **Monatlich verbranntes Budget (Monthly Waste)** | **$${financialSummary.totalMonthlyWaste.toFixed(2)}** |
| **Hochgerechneter Jahresverlust (Annual Waste)** | **$${financialSummary.totalYearlyWaste.toFixed(2)}** |

> [!IMPORTANT]
> **FinOps Erkenntnis:** Ihr Cloud-Account verbrennt aktuell **$${financialSummary.totalMonthlyWaste.toFixed(2)} jeden Monat** für Ressourcen, die in keinem Terraform/OpenTofu-Code deklariert sind.

---

## 🤝 2. Der Shared-Savings Liquiditäts-Vorschlag

Um dieses verbrannte Budget sofort in Ihren Cashflow zurückzuholen, bieten wir zwei risikofreie Bereinigungs-Modelle:

* **Modell A (Quarterly Shared-Savings):**  
  Wir eliminieren die Zombie-Ressourcen für Sie. Unser Honorar beträgt **25% der Ersparnis des ersten Quartals**:  
  👉 **$${financialSummary.sharedSavingsOfferQuarterly25Pct.toFixed(2)} einmalig.**  
  *(Sie behalten 75% der Ersparnis im ersten Quartal und 100% aller folgenden Monate).*

* **Modell B (Annual Shared-Savings):**  
  Umfassende Bereinigung + Einrichtung des ZombieHunter Continuous Drift Guards:  
  👉 **$${financialSummary.sharedSavingsOfferYearly20Pct.toFixed(2)} (20% der Jahreseinsparung).**  
  *(Netto-Gewinn für Ihr Unternehmen im 1. Jahr: **$${(financialSummary.totalYearlyWaste - financialSummary.sharedSavingsOfferYearly20Pct).toFixed(2)}**).*

---

## 🔍 3. Detaillierte Zombie-Aufstellung (Top Kostenfresser)

| Typ | Ressourcen-ID | Monatliche Kosten | Ursache / Detail |
| :--- | :--- | :--- | :--- |
`;

  for (const z of zombieBreakdown) {
    md += `| \`${z.type}\` | \`${z.id}\` | **$${z.monthlyCost.toFixed(2)}** | ${z.reason} |\n`;
  }

  if (securityFindings.length > 0) {
    md += `\n---

## 🚨 4. Kritische Sicherheits-Befunde (Compliance-Risiko)

| Risiko | Typ | Ressourcen-ID | Befund |
| :--- | :--- | :--- | :--- |
`;
    for (const s of securityFindings) {
      md += `| **${s.riskLevel}** | \`${s.type}\` | \`${s.id}\` | ${s.reason} |\n`;
    }
  }

  md += `\n---\n*Audit erstellt durch ZombieHunter. Vertrauliches Dokument für Management & FinOps.*`;

  return md;
}
