// x402 Payment (Coinbase)
// Stateless HTTP 402 payment using Coinbase's x402 protocol.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create an x402 payment challenge (server-side)
  const resource = "/data/market-feed";
  const challenge = await client.payment.createChallenge(
    resource,                 // resource URL/path
    500,                      // amount
    "USDC",                   // asset (x402 typically uses USDC)
    "x402"                    // protocol: Coinbase x402
  );
  console.log("x402 Challenge:");
  console.log("  ID:", challenge.challenge_id);

  // Step 2: Pay by passing the resource URL (x402 is stateless)
  const receipt = await client.payment.payX402(resource);
  console.log("\nx402 Payment receipt:", receipt);

  // Step 3: Gateway info shows supported protocols
  const info = await client.payment.gatewayInfo();
  console.log("\nGateway info:");
  console.log("  Protocols:", info.protocols);
}

main().catch(console.error);
