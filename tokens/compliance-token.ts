// Compliance Token (ERC-3643)
// Create a regulated security token with KYC enforcement.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Create a regulated token
  const token = client.token;
  const secToken = await token.createToken({
    name: "Security Token Alpha",
    symbol: "STA",
    decimals: 18,
    initial_supply: "1000000",
    creator,
  });
  console.log("Security token created:", secToken.token_id);

  // Step 2: Register ERC-3643 compliance rules on the token_id
  const compliance = client.compliance();
  const rules = await compliance.registerCompliance(
    secToken.token_id,
    true,   // KYC required
    500     // max 500 holders
  );
  console.log("\nCompliance rules registered:", rules);

  // Step 3: Check if a transfer would be compliant
  const check = await compliance.checkCompliance(
    secToken.token_id,
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
      secToken.token_id,
      "0xSender1234567890abcdef1234567890abcdef1234"
    );
    console.log("Address frozen:", freeze);
  }

  // Step 5: Read back the current compliance rules
  const status = await compliance.getCompliance(secToken.token_id);
  console.log("\nCompliance rules:", status);
}

main().catch(console.error);
