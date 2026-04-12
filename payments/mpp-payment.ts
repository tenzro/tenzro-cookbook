// MPP (Machine Payments Protocol) Payment
// Session-based streaming payments co-authored by Stripe and Tempo.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Get payment gateway info
  const info = await client.payment.gatewayInfo();
  console.log("Payment protocols:", info.protocols);

  // Step 2: Create a payment challenge (server-side)
  const challenge = await client.payment.createChallenge(
    "/api/inference/gemma3-270m", // resource
    1000,                         // amount (in smallest unit)
    "TNZO",                       // asset
    "mpp"                         // protocol: Machine Payments Protocol
  );
  console.log("\nMPP Challenge:");
  console.log("  ID:", challenge.challenge_id);
  console.log("  Resource:", challenge.resource);

  // Step 3: Pay the challenge (client-side)
  const receipt = await client.payment.payMpp(challenge.challenge_id);
  console.log("\nPayment receipt:", receipt);

  // Step 4: List payment sessions
  const sessions = await client.payment.listSessions();
  console.log("\nActive sessions:", sessions.length);

  // Step 5: Access the resource after payment
  const response = await client.inference.request(
    "gemma3-270m",
    "What are micropayments?",
    100
  );
  console.log("\nInference result:", response.output);
}

main().catch(console.error);
