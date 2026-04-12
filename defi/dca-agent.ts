// Dollar-Cost Averaging Agent
// Automated periodic buys using agent scheduling.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register DCA agent
  const agent = await client.agent.register(
    "dca-agent",
    "DCA Investment Agent",
    ["defi", "dca", "scheduling"]
  );
  console.log("DCA Agent:", agent.agent_id);

  // Step 2: Set up the DCA parameters
  const dcaConfig = {
    token: "TNZO",
    amountPerBuy: 10000000000000000000n, // 10 TNZO per buy
    intervalHours: 24,
    totalBuys: 30,
  };
  console.log("\nDCA Config:");
  console.log("  Token:", dcaConfig.token);
  console.log("  Amount per buy:", Number(dcaConfig.amountPerBuy) / 1e18, "TNZO");
  console.log("  Interval:", dcaConfig.intervalHours, "hours");
  console.log("  Total buys:", dcaConfig.totalBuys);

  // Step 3: Execute a single buy
  const balance = await client.wallet.getBalance(
    "0xMyWallet1234567890abcdef1234567890abcdef12"
  );
  console.log("\nCurrent balance:", Number(balance) / 1e18, "TNZO");

  // Step 4: Stake purchased tokens
  const stakeResult = await client.staking.stake(
    dcaConfig.amountPerBuy,
    "model_provider"
  );
  console.log("Staked:", stakeResult.tx_hash);

  // Step 5: Track performance with inference
  const report = await client.inference.request(
    "gemma3-270m",
    "Generate a brief DCA performance report for 30 daily purchases of 10 TNZO each.",
    256
  );
  console.log("\nPerformance report:", report.output);
}

main().catch(console.error);
