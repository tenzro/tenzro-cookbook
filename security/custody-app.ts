// Custody Application
// Secure key management with MPC wallets, policies, and TEE sealing.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create MPC threshold wallet
  const wallet = await client.wallet.createWallet();
  console.log("MPC Wallet:", wallet.address);
  console.log("  Threshold:", wallet.threshold, "of", wallet.total_shares);

  // Step 2: Set up custody controls
  const custody = client.custody;

  // Create spending policy
  const policy = await custody.createSpendingPolicy(wallet.address, {
    dailyLimit: 50000000000000000000n, // 50 TNZO/day
    perTxLimit: 10000000000000000000n, // 10 TNZO per tx
  });
  console.log("\nSpending policy:", policy);

  // Step 3: Create time-limited session key
  const session = await custody.createSessionKey(
    wallet.address,
    3600, // 1 hour
    ["transfer", "inference", "staking"]
  );
  console.log("Session key:", session.session_id);

  // Step 4: Seal the private key material in TEE
  const tee = await client.tee.detectTee();
  if (tee.available) {
    const sealed = await client.tee.sealData(
      Buffer.from("private-key-material-hex").toString("hex"),
      "custody-master-key"
    );
    console.log("\nKey material sealed in TEE:", sealed.key_id);
  }

  // Step 5: Multi-sig approval flow
  const keypair1 = await client.crypto.generateKeypair("ed25519");
  const keypair2 = await client.crypto.generateKeypair("ed25519");

  // Both signers approve the transaction
  const txData = Buffer.from("approve-withdrawal-001").toString("hex");
  const sig1 = await client.crypto.signMessage(keypair1.private_key, txData);
  const sig2 = await client.crypto.signMessage(keypair2.private_key, txData);

  console.log("\nSigner 1 approved:", sig1.signature.substring(0, 20) + "...");
  console.log("Signer 2 approved:", sig2.signature.substring(0, 20) + "...");
}

main().catch(console.error);
