// AI Coding Assistant via Model Serving
// Use a locally served model for code generation with streaming.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: List available model endpoints
  const endpoints = await client.provider.listModelEndpoints();
  console.log("Available endpoints:");
  for (const ep of endpoints) {
    console.log(`  ${ep.model_name} (${ep.status}) at ${ep.location}`);
  }

  // Step 2: Run code generation
  const response = await client.inference.request(
    "gemma3-270m",
    "Write a Rust function to validate an Ethereum address checksum (EIP-55). Include unit tests.",
    2048
  );
  console.log("\nGenerated code:");
  console.log(response.output);
  console.log("\nTokens:", response.tokens_used);
  console.log("Cost:", response.cost, "TNZO");

  // Step 3: Use the streaming client for real-time output
  const streaming = client.streaming;
  console.log("\nStreaming code review...");
  const stream = await streaming.streamInference(
    "gemma3-270m",
    "Review this Rust code for security issues and suggest improvements: fn main() { unsafe { } }",
    512
  );
  console.log("Stream result:", stream);

  // Step 4: Chat with model for iterative refinement
  const chat = await client.provider.chat("gemma3-270m", [
    { role: "system", content: "You are a senior Rust developer. Be concise." },
    { role: "user", content: "What is the idiomatic way to handle errors in async Rust?" },
  ]);
  console.log("\nChat:", chat.response);
}

main().catch(console.error);
