// Visa Tap-to-Pay Integration
// Use Tenzro payments with Visa tap-to-pay for real-world transactions.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Get payment gateway info
  const info = await client.payment.gatewayInfo();
  console.log("Supported protocols:", info.protocols);

  // Step 2: Create a payment challenge for a resource
  const resource = "/inference/gemma3-270m";
  const challenge = await client.payment.createChallenge(
    resource,
    500,     // amount in smallest unit
    "USDC",  // asset
    "x402"   // protocol (x402 for Visa/Coinbase integration)
  );
  console.log("\nPayment challenge:", challenge.challenge_id);

  // Step 3: In a real integration, the Visa tap-to-pay terminal would
  // emit a credential consumed by tenzro_payVisaTap. For a quickstart we
  // settle the same resource through the x402 path (Coinbase facilitator).
  const receipt = await client.payment.payX402(resource);
  console.log("Payment settled:", receipt);

  // Step 4: Access the paid resource
  const response = await client.inference.request(
    "gemma3-270m",
    "What are the benefits of tap-to-pay in Web3?",
    256
  );
  console.log("\nResponse:", response.output);
}

main().catch(console.error);
