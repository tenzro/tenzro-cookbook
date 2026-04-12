// Paymaster Application (Gasless App)
// Developer funds all operations via a master wallet. Users never see gas fees.

import { AppClient } from "tenzro-sdk";

async function main() {
  // Step 1: Initialize AppClient with master wallet
  const app = await AppClient.new(
    "https://rpc.tenzro.network",
    process.env.MASTER_PRIVATE_KEY!
  );
  console.log("Master wallet:", app.masterWallet.address);

  // Step 2: Check master balance
  const balance = await app.getMasterBalance();
  console.log("Master balance:", Number(balance) / 1e18, "TNZO");

  // Step 3: Create user wallets (funded from master)
  const alice = await app.createUserWallet("alice", 1000000000000000000n); // 1 TNZO
  console.log("\nAlice wallet:", alice.address);

  const bob = await app.createUserWallet("bob", 500000000000000000n); // 0.5 TNZO
  console.log("Bob wallet:", bob.address);

  // Step 4: Set spending limits
  await app.setUserLimits(
    alice.address,
    10000000000000000000n, // 10 TNZO daily
    2000000000000000000n   // 2 TNZO per tx
  );

  // Step 5: Create session keys
  const session = await app.createSessionKey(alice.address, 86400, [
    "inference",
    "balance_query",
  ]);
  console.log("\nSession:", session.sessionId);

  // Step 6: Sponsor inference (master pays)
  const result = await app.sponsorInference(
    alice.address,
    "gemma3-270m",
    "Explain smart contracts in one sentence"
  );
  console.log("\nInference output:", result.output);
  console.log("Cost:", result.cost, "TNZO (paid by master)");

  // Step 7: Sponsor a transaction (master pays gas)
  const tx = await app.sponsorTransaction(
    alice.address,
    bob.address,
    100000000000000000n // 0.1 TNZO
  );
  console.log("\nSponsored tx:", tx.txHash);

  // Step 8: Check usage stats
  const stats = await app.getUsageStats();
  console.log("\nUsage Stats:");
  console.log("  Gas spent:", stats.totalGasSpent.toString(), "wei");
  console.log("  Inference cost:", stats.totalInferenceCost, "TNZO");
  console.log("  Users:", stats.userCount);
  console.log("  Transactions:", stats.transactionCount);
}

main().catch(console.error);
