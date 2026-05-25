// Mastercard Agent Pay
// Agent-initiated payments using the MPP rails plus AP2 agent-to-agent sessions.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Register a payment agent
  const agent = await client.agent.register(
    "payment-agent",
    creator,
    ["payments", "commerce"]
  );
  console.log("Payment agent:", agent.agent_id);

  // Step 2: Create an MPP payment challenge for a checkout resource
  const resource = "/checkout";
  const challenge = await client.payment.createChallenge(
    resource,
    2500,    // amount
    "USDC",
    "mpp"    // Machine Payments Protocol
  );
  console.log("\nPayment challenge:", challenge.challenge_id);

  // Step 3: Agent settles the resource (pass the resource URL, not the challenge ID)
  const receipt = await client.payment.payMpp(resource);
  console.log("Agent payment receipt:", receipt);

  // Step 4: Inspect open payment sessions
  const sessions = await client.payment.listSessions();
  console.log("\nPayment sessions:", sessions.length);

  // Step 5: Agent-to-agent settlement via AP2 (Agentic Payment Protocol)
  const ap2 = client.ap2();
  const providerDid = "did:tenzro:machine:service-provider";
  const session = await ap2.createSession(
    agent.tenzro_did,
    providerDid,
    "inference-service",
    "1000000000000000000", // 1 TNZO cap
    "TNZO"
  );
  console.log("\nAP2 session:", session.session_id);

  const authorization = await ap2.authorizePayment(
    session.session_id,
    "1000000000000000000"
  );
  console.log("AP2 authorization:", authorization.authorization_id);

  const ap2Receipt = await ap2.executePayment(
    session.session_id,
    authorization.authorization_id
  );
  console.log("AP2 settlement receipt:", ap2Receipt);
}

main().catch(console.error);
