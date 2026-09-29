/**
 * ZombieHunter FinOps Cost & Risk Evaluator
 * Part of Diamantenschmiede (AYA Protocol)
 */

export const COST_BENCHMARKS = {
  // Base rates in USD / month (AWS eu-central-1 / us-east-1 reference)
  aws_nat_gateway: 32.85, // $0.045 / hour base cost without data transfer
  aws_eip: 3.65,          // $0.005 / hour unattached IPv4 penalty fee
  aws_lb: 22.50,          // ~$0.0225 / hour ALB base cost
  aws_alb: 22.50,
  aws_elb: 18.00,
  aws_ebs_volume: {
    gp2: 0.10,            // $ per GB-month
    gp3: 0.08,            // $ per GB-month
    io1: 0.125,
    io2: 0.125,
    standard: 0.05
  }
};

/**
 * Calculates monthly waste for a single resource
 * @param {Object} resource 
 * @returns {{ cost: number, reason: string }}
 */
export function estimateResourceCost(resource) {
  const type = resource.type;
  const attrs = resource.attrs || {};

  if (type === 'aws_nat_gateway') {
    return {
      monthlyCost: COST_BENCHMARKS.aws_nat_gateway,
      unit: 'USD/mo',
      reason: 'Idle/Unmanaged NAT Gateway base reservation'
    };
  }

  if (type === 'aws_eip') {
    return {
      monthlyCost: COST_BENCHMARKS.aws_eip,
      unit: 'USD/mo',
      reason: 'Unassociated Public IPv4 Penalty Fee'
    };
  }

  if (type === 'aws_lb' || type === 'aws_alb' || type === 'aws_elb') {
    return {
      monthlyCost: COST_BENCHMARKS.aws_lb,
      unit: 'USD/mo',
      reason: 'Application Load Balancer Base Rate'
    };
  }

  if (type === 'aws_ebs_volume') {
    const size = attrs.size || 100;
    const volType = attrs.volume_type || 'gp3';
    const rate = COST_BENCHMARKS.aws_ebs_volume[volType] || 0.08;
    const monthlyCost = size * rate;
    return {
      monthlyCost: parseFloat(monthlyCost.toFixed(2)),
      unit: 'USD/mo',
      reason: `Unattached ${volType.toUpperCase()} Volume (${size} GB)`
    };
  }

  return {
    monthlyCost: 0,
    unit: 'USD/mo',
    reason: 'Non-billable or negligible base cost'
  };
}

/**
 * Evaluates security risk for unmanaged resources
 * @param {Object} resource 
 * @returns {{ riskLevel: 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'INFO', reason: string }}
 */
export function evaluateSecurityRisk(resource) {
  const type = resource.type;
  const attrs = resource.attrs || {};

  if (type === 'aws_s3_bucket' && (attrs.acl === 'public-read' || attrs.acl === 'public-read-write')) {
    return {
      riskLevel: 'CRITICAL',
      reason: 'Publicly readable S3 Bucket unmanaged by IaC (High Exfiltration Risk)'
    };
  }

  if (type === 'aws_security_group_rule') {
    const cidrs = attrs.cidr_blocks || [];
    if (cidrs.includes('0.0.0.0/0') && (attrs.from_port === 22 || attrs.from_port === 3389)) {
      return {
        riskLevel: 'CRITICAL',
        reason: 'Unmanaged SSH/RDP ingress open to the entire internet (0.0.0.0/0)'
      };
    }
    if (cidrs.includes('0.0.0.0/0')) {
      return {
        riskLevel: 'HIGH',
        reason: 'Unmanaged Ingress open to 0.0.0.0/0'
      };
    }
  }

  if (type === 'aws_iam_access_key') {
    return {
      riskLevel: 'HIGH',
      reason: 'Unmanaged long-term IAM User Access Key'
    };
  }

  return {
    riskLevel: 'INFO',
    reason: 'Unmanaged resource without critical direct security exposure'
  };
}

/**
 * Audits a full driftctl scan payload
 * @param {Object} scanPayload 
 * @returns {Object} FinOps Audit Dossier
 */
export function auditScanPayload(scanPayload) {
  const unmanaged = scanPayload.unmanaged || [];
  
  let totalMonthlyWaste = 0;
  const zombieBreakdown = [];
  const securityFindings = [];

  for (const item of unmanaged) {
    const costInfo = estimateResourceCost(item);
    const riskInfo = evaluateSecurityRisk(item);

    if (costInfo.monthlyCost > 0) {
      totalMonthlyWaste += costInfo.monthlyCost;
      zombieBreakdown.push({
        id: item.id,
        type: item.type,
        monthlyCost: costInfo.monthlyCost,
        reason: costInfo.reason
      });
    }

    if (riskInfo.riskLevel === 'CRITICAL' || riskInfo.riskLevel === 'HIGH') {
      securityFindings.push({
        id: item.id,
        type: item.type,
        riskLevel: riskInfo.riskLevel,
        reason: riskInfo.reason
      });
    }
  }

  totalMonthlyWaste = parseFloat(totalMonthlyWaste.toFixed(2));
  const totalYearlyWaste = parseFloat((totalMonthlyWaste * 12).toFixed(2));

  // Shared Savings Proposals:
  // 20% on 1 year savings OR 25% on 1 quarter savings
  const sharedSavingsYear = parseFloat((totalYearlyWaste * 0.20).toFixed(2));
  const sharedSavingsQuarter = parseFloat(((totalMonthlyWaste * 3) * 0.25).toFixed(2));

  return {
    meta: {
      timestamp: new Date().toISOString(),
      analyzedResources: (scanPayload.managed?.length || 0) + unmanaged.length,
      unmanagedCount: unmanaged.length,
      zombieResourceCount: zombieBreakdown.length,
      criticalSecurityFindings: securityFindings.length
    },
    financialSummary: {
      currency: 'USD',
      totalMonthlyWaste,
      totalYearlyWaste,
      sharedSavingsOfferYearly20Pct: sharedSavingsYear,
      sharedSavingsOfferQuarterly25Pct: sharedSavingsQuarter
    },
    zombieBreakdown: zombieBreakdown.sort((a, b) => b.monthlyCost - a.monthlyCost),
    securityFindings
  };
}
