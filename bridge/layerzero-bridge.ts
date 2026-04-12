// LayerZero V2 Bridge
// OFT transfer via LayerZero V2 EndpointV2 with TYPE_3 options.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: List bridge adapters
  const bridge = client.bridge();
  const adapters = await bridge.listAdapters();
  console.log("Bridge adapters:");
  for (const a of adapters) {
    console.log(`  ${a.name}: ${a.adapter_type}`);
  }

  // Step 2: Get routes from Tenzro to Ethereum via LayerZero
  // LayerZero EIDs: Ethereum=30101, Arbitrum=30110, Base=30184, Solana=30168
  const routes = await bridge.getRoutes("tenzro", "ethereum", "TNZO");
  const lzRoute = routes.find((r) => r.adapter === "layerzero");
  if (lzRoute) {
    console.log("\nLayerZero route found:");
    console.log("  Fee:", lzRoute.fee);
    console.log("  Estimated time:", lzRoute.estimated_time, "seconds");
  }

  // Step 3: Bridge TNZO via LayerZero
  // OFT transfers use uint64 amountSD (shared decimals), not uint256
  const result = await bridge.bridgeTokens(
    "tenzro",
    "ethereum",
    "TNZO",
    "10.0",     // 10 TNZO
    "0xEthereumRecipientAddress...",
    "layerzero"
  );
  console.log("\nBridge initiated:");
  console.log("  TX hash:", result.tx_hash);
  console.log("  Status:", result.status);

  // Step 4: Track via LayerZero Scan API
  // Messages tracked at: https://scan.layerzero-api.com/v1/messages/tx/{txHash}
  console.log("\nTrack at: https://layerzeroscan.com/tx/" + result.tx_hash);
}

main().catch(console.error);
