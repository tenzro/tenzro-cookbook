// deBridge Cross-Chain Swap
// Execute intent-based cross-chain swaps via deBridge DLN.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create a cross-chain DLN order. Returns unsigned tx data to sign
  // and submit on the source chain.
  const debridge = client.debridge();
  const order = await debridge.createTx(
    1,        // srcChain: Ethereum
    7565164,  // dstChain: Solana
    "0x0000000000000000000000000000000000000000",   // ETH
    "So11111111111111111111111111111111111111112",  // SOL
    "1000000000000000000",                           // 1 ETH (wei)
    "SolanaRecipientAddress..."
  );
  console.log("deBridge order:");
  console.log("  Order ID:", order.order_id);
  console.log("  Tx to sign:", order.tx_data?.substring(0, 60) + "...");

  // Step 2: Discover Tenzro-side bridge routes between the two chains
  const bridge = client.bridge();
  const routes = await bridge.getRoutes("ethereum", "solana", "ETH");
  console.log("\nAvailable routes:");
  for (const route of routes) {
    console.log(`  ${route.adapter}: fee ${route.fee}`);
  }

  // Step 3: Execute the bridge via the Tenzro bridge adapter
  const result = await bridge.bridgeTokens(
    "ethereum",
    "solana",
    "ETH",
    "1.0",
    "SolanaRecipientAddress...",
    "debridge"
  );
  console.log("\nBridge result:");
  console.log("  TX:", result.tx_hash);
  console.log("  Status:", result.status);

  // Step 4: Poll the DLN order status
  const status = await debridge.getOrderStatus(order.order_id);
  console.log("\nOrder status:", status.status);
}

main().catch(console.error);
