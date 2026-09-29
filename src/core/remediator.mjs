/**
 * ZombieHunter Auto-Remediation Engine ("Drift-to-Code" & "Zombie-Purge")
 * Part of Diamantenschmiede (AYA Protocol)
 */

/**
 * Generates Terraform/OpenTofu import commands and HCL stubs for unmanaged resources
 * @param {Array<Object>} unmanagedResources List of unmanaged resources from scan
 * @returns {{ importCommands: string[], hclStubs: string }}
 */
export function generateTerraformImports(unmanagedResources = []) {
  const importCommands = [];
  const hclBlocks = [];

  for (const res of unmanagedResources) {
    const { type, id } = res;
    if (!type || !id) continue;

    // Clean resource name for HCL (replace invalid chars with underscores)
    const resourceName = `imported_${id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;

    // 1. Generate CLI import command
    importCommands.push(`tofu import ${type}.${resourceName} ${id}`);

    // 2. Generate minimal HCL stub block for Terraform / OpenTofu 1.5+
    hclBlocks.push(
`# Unmanaged Resource detected by ZombieHunter
import {
  to = ${type}.${resourceName}
  id = "${id}"
}

resource "${type}" "${resourceName}" {
  # Configuration managed by ZombieHunter import
}
`
    );
  }

  return {
    importCommands,
    hclStubs: hclBlocks.join('\n')
  };
}

/**
 * Generates a safe PowerShell/Bash teardown script to delete confirmed zombies
 * @param {Array<Object>} zombieBreakdown List of identified cost zombies
 * @returns {{ ps1Script: string, shScript: string }}
 */
export function generateZombiePurgeScripts(zombieBreakdown = []) {
  const ps1Lines = [
    '# ⚠️ ZOMBIEHUNTER AUTOMATED TEARDOWN SCRIPT (POWERSHELL)',
    '# Generated automatically to eliminate unmanaged cloud waste.',
    '# CAUTION: Review resource IDs before execution!\n',
    '$confirm = Read-Host "Are you sure you want to delete all identified zombie resources? (type YES)"',
    'if ($confirm -ne "YES") { Write-Host "Aborted."; exit 1 }\n'
  ];

  const shLines = [
    '#!/usr/bin/env bash',
    '# ⚠️ ZOMBIEHUNTER AUTOMATED TEARDOWN SCRIPT (BASH)',
    '# Generated automatically to eliminate unmanaged cloud waste.',
    '# CAUTION: Review resource IDs before execution!\n',
    'read -p "Are you sure you want to delete all identified zombie resources? (type YES): " confirm',
    'if [ "$confirm" != "YES" ]; then echo "Aborted."; exit 1; fi\n'
  ];

  for (const z of zombieBreakdown) {
    if (z.type === 'aws_nat_gateway') {
      ps1Lines.push(`Write-Host "Deleting NAT Gateway: ${z.id} ($${z.monthlyCost}/mo)..."`);
      ps1Lines.push(`aws ec2 delete-nat-gateway --nat-gateway-id ${z.id}`);

      shLines.push(`echo "Deleting NAT Gateway: ${z.id} ($${z.monthlyCost}/mo)..."`);
      shLines.push(`aws ec2 delete-nat-gateway --nat-gateway-id ${z.id}`);
    } else if (z.type === 'aws_ebs_volume') {
      ps1Lines.push(`Write-Host "Deleting unattached EBS Volume: ${z.id} ($${z.monthlyCost}/mo)..."`);
      ps1Lines.push(`aws ec2 delete-volume --volume-id ${z.id}`);

      shLines.push(`echo "Deleting unattached EBS Volume: ${z.id} ($${z.monthlyCost}/mo)..."`);
      shLines.push(`aws ec2 delete-volume --volume-id ${z.id}`);
    } else if (z.type === 'aws_eip') {
      ps1Lines.push(`Write-Host "Releasing unattached Elastic IP: ${z.id} ($${z.monthlyCost}/mo)..."`);
      ps1Lines.push(`aws ec2 release-address --allocation-id ${z.id}`);

      shLines.push(`echo "Releasing unattached Elastic IP: ${z.id} ($${z.monthlyCost}/mo)..."`);
      shLines.push(`aws ec2 release-address --allocation-id ${z.id}`);
    } else if (z.type === 'aws_lb' || z.type === 'aws_alb') {
      ps1Lines.push(`Write-Host "Deleting Load Balancer: ${z.id} ($${z.monthlyCost}/mo)..."`);
      ps1Lines.push(`aws elbv2 delete-load-balancer --load-balancer-arn ${z.id}`);

      shLines.push(`echo "Deleting Load Balancer: ${z.id} ($${z.monthlyCost}/mo)..."`);
      shLines.push(`aws elbv2 delete-load-balancer --load-balancer-arn ${z.id}`);
    }
  }

  ps1Lines.push('\nWrite-Host "✅ Zombie teardown complete. Monthly waste eliminated!"');
  shLines.push('\necho "✅ Zombie teardown complete. Monthly waste eliminated!"');

  return {
    ps1Script: ps1Lines.join('\n'),
    shScript: shLines.join('\n')
  };
}
