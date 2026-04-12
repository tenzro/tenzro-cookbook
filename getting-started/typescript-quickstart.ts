// Tenzro TypeScript SDK Quickstart
// Connect to testnet, create a wallet, fund from faucet, and run inference.
//
// npm install tenzro-sdk
// npx tsx getting-started/typescript-quickstart.ts

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  // Step 1: Connect to testnet
  const client = new TenzroClient(TESTNET_CONFIG);
  const info = await client.nodeInfo();
  console.log("Connected to Tenzro Network");
  console.log("  Chain ID:", info.chain_id);
  console.log("  Block height:", info.block_height);

  // Step 2: Create a wallet
  const walletInfo = await client.wallet.createWallet();
  console.log("\nWallet created:", walletInfo.address);

  // Step 3: Fund from faucet (100 TNZO, 24h cooldown)
  const faucet = await client.requestFaucet(walletInfo.address);
  console.log("Faucet:", faucet.amount, "TNZO received");

  // Step 4: Check balance
  const balance = await client.wallet.getBalance(walletInfo.address);
  console.log("Balance:", Number(balance) / 1e18, "TNZO");

  // Step 5: Register a TDIP identity
  const idResult = await client.identity.registerHuman("Alice");
  console.log("\nIdentity DID:", idResult.did);

  // Step 6: List models and run inference
  const models = await client.inference.listModels();
  console.log("\nAvailable models:", models.length);

  const response = await client.inference.request(
    "gemma3-270m",
    "What is the Tenzro Network?",
    100
  );
  console.log("Response:", response.output);
  console.log("Tokens:", response.tokens_used);
  console.log("Cost:", response.cost, "TNZO");
}

main().catch(console.error);
