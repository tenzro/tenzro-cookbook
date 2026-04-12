// Institutional AML Agent
// Compliance agent with TEE attestation, ERC-3643, and ZK proofs.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register the AML agent
  const agent = await client.agent.register(
    "aml-compliance-oracle",
    "AML Compliance Oracle",
    ["compliance", "kyc", "screening", "aml"]
  );
  console.log("AML Agent:", agent.agent_id);

  // Step 2: Detect TEE hardware
  const tee = await client.tee.detectTee();
  console.log("\nTEE available:", tee.available);
  console.log("Vendor:", tee.vendor);

  // Step 3: Generate TEE attestation
  if (tee.available) {
    const attestation = await client.tee.getAttestation(tee.vendor);
    console.log("Attestation report:", attestation.report.substring(0, 32) + "...");
  }

  // Step 4: Register ERC-3643 compliance rules
  const rules = await client.compliance.registerCompliance("TNZO", true, 10000);
  console.log("\nCompliance rules:", rules);

  // Step 5: Check transfer compliance
  const check = await client.compliance.checkCompliance(
    "TNZO",
    "0xSender1234567890abcdef1234567890abcdef1234",
    "0xRecipient234567890abcdef1234567890abcdef12",
    "50000000000000000000" // 50 TNZO
  );
  console.log("Compliant:", check.compliant);

  // Step 6: Run AI analysis
  const analysis = await client.inference.request(
    "gemma3-270m",
    "Analyze this transaction for AML risk: sender=0xSender, amount=50 TNZO",
    512
  );
  console.log("\nAML Analysis:", analysis.output);

  // Step 7: Generate ZK proof of compliance
  const proof = await client.zk.createProof(
    "settlement",
    { amount: 50, compliant: true, risk_score: 0.1 },
    ["0x01", "0x02"]
  );
  console.log("ZK Proof:", proof.proof.substring(0, 32) + "...");

  // Step 8: Publish to agent marketplace
  const marketplace = client.marketplace();
  const template = await marketplace.registerAgentTemplate({
    name: "AML Compliance Oracle",
    description: "Real-time AML screening with TEE and ZK proofs",
    template_type: "infrastructure",
    tags: ["compliance", "aml", "kyc"],
  });
  console.log("\nMarketplace template:", template.template_id);
}

main().catch(console.error);
