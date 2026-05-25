// Dollar-Cost Averaging Agent
// Automated periodic buys using agent scheduling.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Register DCA agent
  const agent = await client.agent.register(
    "dca-agent",
    creator,
    ["defi", "dca", "scheduling"]
  );
  console.log("DCA Agent:", agent.agent_id);

  // Step 2: Set up the DCA parameters (amount as decimal-string in base units)
  const dcaConfig = {
    token: "TNZO",
    amountPerBuy: "10000000000000000000", // 10 TNZO per buy
    intervalHours: 24,
    totalBuys: 30,
  };
  console.log("\nDCA Config:");
  console.log("  Token:", dcaConfig.token);
  console.log("  Amount per buy:", Number(BigInt(dcaConfig.amountPerBuy)) / 1e18, "TNZO");
  console.log("  Interval:", dcaConfig.intervalHours, "hours");
  console.log("  Total buys:", dcaConfig.totalBuys);

  // Step 3: Check the wallet balance before buying
  const balance = await client.wallet.getBalance(creator);
  console.log("\nCurrent balance:", Number(balance) / 1e18, "TNZO");

  // Step 4: Stake purchased tokens as a model_provider
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
