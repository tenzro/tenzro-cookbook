// Canton DvP (Delivery vs Payment)
// Institutional settlement on Canton DAML ledger.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: List Canton synchronization domains
  const domains = await client.canton.listDomains();
  console.log("Canton domains:");
  for (const d of domains) {
    console.log(`  ${d.id}: ${d.name} (${d.status})`);
  }

  // Step 2: List DAML contracts
  const contracts = await client.canton.listContracts();
  console.log("\nDAML contracts:", contracts.length);

  // Step 3: Create a DvP settlement contract
  // Canton uses JSON Ledger API v2 with submit-and-wait
  const result = await client.canton.submitCommand({
    domain_id: domains[0]?.id || "default",
    command_type: "create",
    act_as: ["Bank-A"],
    template_id: "DvPSettlement",
    payload: {
      buyer: "Bank-A",
      seller: "Bank-B",
      asset: "BOND-2026-Q1",
      quantity: 100,
      price: "50000", // 50,000 TNZO
      settlementDate: new Date().toISOString(),
    },
  });
  console.log("\nDvP contract created:", result);

  // Step 4: Exercise the settlement choice
  const settlement = await client.canton.submitCommand({
    domain_id: domains[0]?.id || "default",
    command_type: "exercise",
    act_as: ["Bank-B"],
    template_id: "DvPSettlement",
    choice: "Accept",
    payload: {
      contract_id: result.contract_id || "dvp-001",
    },
  });
  console.log("Settlement executed:", settlement);
}

main().catch(console.error);
