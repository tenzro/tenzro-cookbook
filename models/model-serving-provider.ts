// Model Serving Provider
// Download, serve, and monetize AI models on the Tenzro Network.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Get hardware profile
  const hardware = await client.provider.getHardwareProfile();
  console.log("Hardware:");
  console.log("  CPU:", hardware.cpu);
  console.log("  Memory:", hardware.memory_gb, "GB");
  console.log("  GPU:", hardware.gpu || "None");
  console.log("  TEE:", hardware.tee_support);

  // Step 2: Download a model
  const taskId = await client.provider.downloadModel("gemma3-270m");
  console.log("\nDownload started:", taskId);

  // Step 3: Check download progress
  const progress = await client.provider.getDownloadProgress("gemma3-270m");
  console.log("Progress:", (progress.progress * 100).toFixed(1) + "%");
  console.log("Status:", progress.status);

  // Step 4: Register as a provider (no staking required for model providers)
  const txHash = await client.provider.register(["gemma3-270m"], 0);
  console.log("\nRegistration tx:", txHash);

  // Step 5: Start serving the model
  await client.provider.serveModel("gemma3-270m");
  console.log("Model serving started");

  // Step 6: List model endpoints
  const endpoints = await client.provider.listModelEndpoints();
  for (const ep of endpoints) {
    console.log(`\n  ${ep.model_name}: ${ep.status} (${ep.location})`);
    console.log(`    API: ${ep.api_endpoint}`);
    console.log(`    MCP: ${ep.mcp_endpoint}`);
    if (ep.load) {
      console.log(
        `    Load: ${ep.load.active_requests}/${ep.load.max_concurrent} (${ep.load.utilization_percent}%)`
      );
    }
  }

  // Step 7: Check provider stats
  const stats = await client.provider.stats();
  console.log("\nProvider stats:");
  console.log("  Serving:", stats.is_serving);
  console.log("  Models:", stats.models_served);
  console.log("  Total inferences:", stats.total_inferences);

  // Step 8: Chat with the served model
  const response = await client.provider.chat("gemma3-270m", [
    { role: "user", content: "What is the Tenzro Network?" },
  ]);
  console.log("\nChat response:", response.response);
  console.log("Tokens used:", response.tokens_used);

  // To stop serving:
  // await client.provider.stopModel("gemma3-270m");
}

main().catch(console.error);
