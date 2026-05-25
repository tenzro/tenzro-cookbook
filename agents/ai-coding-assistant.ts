// AI Coding Assistant
// Agent that uses inference with payment integration for code generation.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Register a coding assistant agent
  const agent = await client.agent.register(
    "code-assistant",
    creator,
    ["code-generation", "code-review", "debugging"]
  );
  console.log("Agent:", agent.agent_id);

  // Step 2: Find available coding models
  const models = await client.inference.listModels();
  const codingModels = models.filter((m) =>
    m.name.toLowerCase().includes("code") || m.category === "code"
  );
  console.log("\nCoding models available:", codingModels.length);

  // Step 3: Run inference for code generation
  const response = await client.inference.request(
    "gemma3-270m",
    "Write a TypeScript function that calculates the Fibonacci sequence using memoization.",
    1024
  );
  console.log("\nGenerated code:");
  console.log(response.output);
  console.log("\nTokens used:", response.tokens_used);
  console.log("Cost:", response.cost, "TNZO");

  // Step 4: Create a payment challenge for a paid resource URL
  const resource = "/inference/gemma3-270m";
  const challenge = await client.payment.createChallenge(
    resource,
    1000,  // amount
    "TNZO",
    "mpp"  // Machine Payments Protocol
  );
  console.log("\nPayment challenge:", challenge.challenge_id);

  // Step 5: Pay by passing the resource URL (same string used to create the challenge)
  const receipt = await client.payment.payMpp(resource);
  console.log("Payment receipt:", receipt);

  // Step 6: Spawn from marketplace template
  const marketplace = client.marketplace();
  const templates = await marketplace.listAgentTemplates();
  console.log("\nMarketplace templates:", templates.length);
}

main().catch(console.error);
