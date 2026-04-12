// Cross-Chain DeFi
// Bridge tokens between chains and execute cross-chain operations.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Check available bridge routes
  const bridge = client.bridge();
  const routes = await bridge.getRoutes("tenzro", "ethereum", "TNZO");
  console.log("Available routes:");
  for (const route of routes) {
    console.log(`  ${route.adapter}: fee ${route.fee}, ~${route.estimated_time}s`);
  }

  // Step 2: List bridge adapters
  const adapters = await bridge.listAdapters();
  console.log("\nBridge adapters:");
  for (const adapter of adapters) {
    console.log(`  ${adapter.name} (${adapter.adapter_type})`);
  }

  // Step 3: Bridge TNZO to Ethereum via LayerZero
  const result = await bridge.bridgeTokens(
    "tenzro",    // from chain
    "ethereum",  // to chain
    "TNZO",      // token
    "1.0",       // amount
    "0xRecipientOnEthereum...", // recipient
    "layerzero"  // adapter
  );
  console.log("\nBridge initiated:");
  console.log("  TX hash:", result.tx_hash);
  console.log("  Status:", result.status);

  // Step 4: Track bridge status
  const status = await bridge.getTransferStatus(result.tx_hash);
  console.log("  Transfer status:", status);
}

main().catch(console.error);
