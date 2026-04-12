// deBridge Cross-Chain Swap
// Execute intent-based cross-chain swaps via deBridge DLN.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Get a quote for cross-chain swap via deBridge
  const debridge = client.debridge;
  const quote = await debridge.getQuote({
    srcChainId: 1,        // Ethereum
    dstChainId: 7565164,  // Solana
    srcTokenAddress: "0x0000000000000000000000000000000000000000", // ETH
    dstTokenAddress: "So11111111111111111111111111111111111111112", // SOL
    amount: "1000000000000000000", // 1 ETH
    slippage: 0.5,
  });
  console.log("deBridge Quote:");
  console.log("  Estimated output:", quote.estimation?.dstTokenAmount);
  console.log("  Fees:", quote.estimation?.fees);

  // Step 2: Bridge tokens via the Tenzro bridge client
  const bridge = client.bridge();
  const routes = await bridge.getRoutes("ethereum", "solana", "ETH");
  console.log("\nAvailable routes:");
  for (const route of routes) {
    console.log(`  ${route.adapter}: fee ${route.fee}`);
  }

  // Step 3: Execute the bridge
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
}

main().catch(console.error);
