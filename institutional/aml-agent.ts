// Institutional AML Agent with Canton Settlement
// AML compliance with Canton DAML for institutional reporting.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register AML agent
  const agent = await client.agent.register(
    "institutional-aml",
    "Institutional AML Agent",
    ["compliance", "aml", "canton"]
  );
  console.log("AML Agent:", agent.agent_id);

  // Step 2: Run AML analysis
  const analysis = await client.inference.request(
    "gemma3-270m",
    "Analyze this institutional transaction for AML risk: " +
    "sender=Bank-A, recipient=Bank-B, amount=50000 TNZO, " +
    "asset=BOND-2026-Q1, type=DvP settlement.",
    512
  );
  console.log("\nAML Analysis:", analysis.output);

  // Step 3: Check ERC-3643 compliance
  const compliance = await client.compliance.checkCompliance(
    "TNZO",
    "0xBankA234567890abcdef1234567890abcdef1234",
    "0xBankB234567890abcdef1234567890abcdef1234",
    "50000000000000000000000" // 50,000 TNZO
  );
  console.log("\nCompliant:", compliance.compliant);

  // Step 4: Generate ZK proof of compliance check
  const proof = await client.zk.createProof(
    "settlement",
    {
      amount: 50000,
      compliant: compliance.compliant,
      risk_score: 0.05,
    },
    ["0x01"]
  );
  console.log("ZK Proof:", proof.proof.substring(0, 32) + "...");

  // Step 5: Record result on Canton DAML
  const domains = await client.canton.listDomains();
  const result = await client.canton.submitCommand({
    domain_id: domains[0]?.id || "default",
    command_type: "create",
    act_as: ["AML-Compliance-Party"],
    template_id: "AmlComplianceResult",
    payload: {
      transaction_id: "dvp-001",
      compliant: compliance.compliant,
      risk_score: 0.05,
      zk_proof: proof.proof,
      timestamp: new Date().toISOString(),
    },
  });
  console.log("\nCompliance record created on Canton:", result);
}

main().catch(console.error);
