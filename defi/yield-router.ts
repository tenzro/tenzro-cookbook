// Yield Router
// Automatically route funds to the highest-yielding opportunities.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Register yield routing agent
  const agent = await client.agent.register(
    "yield-router",
    creator,
    ["defi", "yield", "staking"]
  );
  console.log("Yield Router:", agent.agent_id);

  // Step 2: Inspect current staking state for this address
  const staking = client.staking;
  const stakingBalance = await staking.getStakingBalance(creator);
  const rewards = await staking.getRewards(creator);
  const unbonding = await staking.getUnbonding(creator);
  console.log("\nStaking balance:", stakingBalance);
  console.log("Pending rewards:", rewards);
  console.log("Unbonding entries:", unbonding.length);

  // Step 3: Stake TNZO as a validator (amount as decimal-string in base units)
  const stakeResult = await staking.stake(
    "100000000000000000000", // 100 TNZO
    "validator"
  );
  console.log("\nStaked:", stakeResult.tx_hash);

  // Step 4: Monitor wallet balance
  const balance = await client.wallet.getBalance(creator);
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
