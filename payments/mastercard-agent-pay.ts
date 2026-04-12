// Mastercard Agent Pay
// Agent-initiated payments using Mastercard Agent Pay protocol.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register a payment agent
  const agent = await client.agent.register(
    "payment-agent",
    "Payment Processing Agent",
    ["payments", "commerce"]
  );
  console.log("Payment agent:", agent.agent_id);

  // Step 2: Create MPP payment challenge (Stripe-compatible)
  const challenge = await client.payment.createChallenge(
    "/api/checkout",
    2500,    // amount
    "USDC",
    "mpp"    // Machine Payments Protocol
  );
  console.log("\nPayment challenge:", challenge.challenge_id);

  // Step 3: Agent pays on behalf of user
  const receipt = await client.payment.payMpp(challenge.challenge_id);
  console.log("Agent payment receipt:", receipt);

  // Step 4: Verify payment
  const sessions = await client.payment.listSessions();
  console.log("\nPayment sessions:", sessions.length);

  // Step 5: Use AP2 (Agentic Payment Protocol) for agent-to-agent payments
  const ap2 = client.ap2();
  const agentPayment = await ap2.createPayment({
    from_agent: agent.agent_id,
    to_agent: "service-provider-agent",
    amount: "1000000000000000000", // 1 TNZO
    asset: "TNZO",
    purpose: "inference-service",
  });
  console.log("\nAP2 Payment:", agentPayment);
}

main().catch(console.error);
