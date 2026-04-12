// Compliance Token (ERC-3643)
// Create a regulated security token with KYC enforcement.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create a regulated token
  const token = client.token;
  const secToken = await token.createToken(
    "Security Token Alpha",
    "STA",
    18,
    "1000000" // 1M supply
  );
  console.log("Security token created:", secToken.token_id);

  // Step 2: Register ERC-3643 compliance rules
  const compliance = client.compliance;
  const rules = await compliance.registerCompliance(
    "STA",
    true,   // KYC required
    500     // max 500 holders
  );
  console.log("\nCompliance rules registered:", rules);

  // Step 3: Check if a transfer would be compliant
  const check = await compliance.checkCompliance(
    "STA",
    "0xSender1234567890abcdef1234567890abcdef1234",
    "0xRecipient234567890abcdef1234567890abcdef12",
    "100000000000000000000" // 100 tokens
  );
  console.log("\nTransfer compliant:", check.compliant);
  if (!check.compliant) {
    console.log("Reason:", check.reason);
  }

  // Step 4: Freeze a non-compliant address
  if (!check.compliant) {
    const freeze = await compliance.freezeAddress(
      "STA",
      "0xSender1234567890abcdef1234567890abcdef1234"
    );
    console.log("Address frozen:", freeze.frozen);
  }

  // Step 5: Get compliance status
  const status = await compliance.getComplianceStatus("STA");
  console.log("\nCompliance status:", status);
}

main().catch(console.error);
