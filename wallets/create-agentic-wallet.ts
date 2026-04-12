// Create an Agentic Wallet
// Register a TDIP identity, create a wallet, fund from faucet, and send TNZO.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: One-click participation (creates identity + wallet + hardware profile)
  const result = await client.provider.participate("my-secure-password");
  console.log("DID:", result.did);
  console.log("Wallet:", result.address);

  // Step 2: Fund from faucet
  const faucet = await client.requestFaucet(result.address);
  console.log("Funded:", faucet.amount, "TNZO");

  // Step 3: Check balance
  const balance = await client.wallet.getBalance(result.address);
  console.log("Balance:", Number(balance) / 1e18, "TNZO");

  // Step 4: Send TNZO to another address
  const txHash = await client.wallet.sendTransaction(
    result.address,
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
    1000000000000000000n // 1 TNZO
  );
  console.log("Sent 1 TNZO, tx:", txHash);

  // Step 5: Resolve the identity
  const identity = await client.identity.resolve(result.did);
  console.log("Identity type:", identity.identity_type);
  console.log("KYC tier:", identity.kyc_tier);
}

main().catch(console.error);
