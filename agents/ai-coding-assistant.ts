// AI Coding Assistant
// Agent that uses inference with payment integration for code generation.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register coding assistant agent
  const agent = await client.agent.register(
    "code-assistant",
    "Code Assistant",
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

  // Step 4: Set up payment for API access
  const challenge = await client.payment.createChallenge(
    "/api/inference/gemma3-270m",
    1000,  // amount
    "TNZO",
    "mpp"  // Machine Payments Protocol
  );
  console.log("\nPayment challenge:", challenge.challenge_id);

  // Step 5: Pay for the challenge
  const receipt = await client.payment.payMpp(challenge.challenge_id);
  console.log("Payment receipt:", receipt);

  // Step 6: Spawn from marketplace template
  const marketplace = client.marketplace();
  const templates = await marketplace.listAgentTemplates();
  console.log("\nMarketplace templates:", templates.length);
}

main().catch(console.error);
