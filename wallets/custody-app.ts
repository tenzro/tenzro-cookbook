// Custody Application
// MPC threshold wallet with spending policies, session keys, and key management.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create an MPC threshold wallet (default 2-of-3)
  const wallet = await client.wallet.createWallet();
  console.log("MPC Wallet created:");
  console.log("  Address:", wallet.address);
  console.log("  Threshold:", wallet.threshold, "of", wallet.total_shares);
  console.log("  Key type:", wallet.key_type);

  // Step 2: Set up custody policies via the custody client
  const custody = client.custody;

  // Create a spending policy
  const policy = await custody.createSpendingPolicy(wallet.address, {
    dailyLimit: 10000000000000000000n, // 10 TNZO/day
    perTxLimit: 2000000000000000000n,  // 2 TNZO per tx
  });
  console.log("\nSpending policy set:", policy);

  // Step 3: Create a session key (scoped, time-limited access)
  const session = await custody.createSessionKey(
    wallet.address,
    3600, // 1 hour
    ["transfer", "inference"]
  );
  console.log("\nSession key:", session.session_id);
  console.log("  Expires:", session.expires_at);
  console.log("  Operations:", session.operations);

  // Step 4: Generate a keypair for signing
  const keypair = await client.crypto.generateKeypair("ed25519");
  console.log("\nKeypair generated:");
  console.log("  Public key:", keypair.public_key.substring(0, 20) + "...");

  // Step 5: Sign and verify a message
  const signed = await client.crypto.signMessage(
    keypair.private_key,
    Buffer.from("authorize-transfer-001").toString("hex")
  );
  console.log("\nSignature:", signed.signature.substring(0, 40) + "...");

  const verified = await client.crypto.verifySignature(
    keypair.public_key,
    Buffer.from("authorize-transfer-001").toString("hex"),
    signed.signature
  );
  console.log("Verified:", verified.valid);
}

main().catch(console.error);
