// Yield Router
// Automatically route funds to the highest-yielding opportunities.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register yield routing agent
  const agent = await client.agent.register(
    "yield-router",
    "Yield Router Agent",
    ["defi", "yield", "staking"]
  );
  console.log("Yield Router:", agent.agent_id);

  // Step 2: Check staking yields on Tenzro
  const staking = client.staking;
  const stakingInfo = await staking.getStakingInfo();
  console.log("\nStaking info:", stakingInfo);

  // Step 3: Stake TNZO as a validator
  const stakeResult = await staking.stake(
    100000000000000000000n, // 100 TNZO
    "validator"
  );
  console.log("Staked:", stakeResult.tx_hash);

  // Step 4: Monitor yield across protocols
  const balance = await client.wallet.getBalance(
    "0xMyWallet1234567890abcdef1234567890abcdef12"
  );
  console.log("\nCurrent balance:", Number(balance) / 1e18, "TNZO");

  // Step 5: Use AI to recommend optimal allocation
  const recommendation = await client.inference.request(
    "gemma3-270m",
    `Given ${Number(balance) / 1e18} TNZO, recommend optimal yield allocation between staking (estimated 8% APY) and providing model inference (estimated 12% APY).`,
    256
  );
  console.log("\nAllocation recommendation:", recommendation.output);
}

main().catch(console.error);
