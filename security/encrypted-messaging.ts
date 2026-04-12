// End-to-End Encrypted Messaging
// X25519 key exchange + AES-256-GCM encryption over agent messaging.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register two agents (Alice and Bob)
  const alice = await client.agent.register(
    "alice-messenger",
    "Alice",
    ["messaging", "encryption"]
  );
  const bob = await client.agent.register(
    "bob-messenger",
    "Bob",
    ["messaging", "encryption"]
  );
  console.log("Alice:", alice.agent_id);
  console.log("Bob:", bob.agent_id);

  // Step 2: Generate Ed25519 keypairs for key exchange
  const aliceKeypair = await client.crypto.generateKeypair("ed25519");
  const bobKeypair = await client.crypto.generateKeypair("ed25519");
  console.log("\nAlice pubkey:", aliceKeypair.public_key.substring(0, 20) + "...");
  console.log("Bob pubkey:", bobKeypair.public_key.substring(0, 20) + "...");

  // Step 3: Derive shared secret via X25519 key exchange
  const aliceShared = await client.crypto.x25519KeyExchange(
    aliceKeypair.private_key,
    bobKeypair.public_key
  );
  const bobShared = await client.crypto.x25519KeyExchange(
    bobKeypair.private_key,
    aliceKeypair.public_key
  );
  console.log("\nShared secrets match:", aliceShared.secret === bobShared.secret);

  // Step 4: Encrypt a message (Alice -> Bob)
  const plaintext = "Hello Bob! This is a secret message from Alice.";
  const encrypted = await client.crypto.encrypt(
    aliceShared.secret,
    Buffer.from(plaintext).toString("hex")
  );
  console.log("\nEncrypted ciphertext:", encrypted.ciphertext.substring(0, 40) + "...");
  console.log("Nonce:", encrypted.nonce);

  // Step 5: Send encrypted message via agent messaging
  const envelope = JSON.stringify({
    type: "encrypted_message",
    sender_public_key: aliceKeypair.public_key,
    nonce: encrypted.nonce,
    ciphertext: encrypted.ciphertext,
  });

  const response = await client.agent.sendMessage("bob-messenger", envelope);
  console.log("\nMessage sent, ID:", response.message_id);

  // Step 6: Bob decrypts the message
  const received = JSON.parse(response.payload || envelope);
  const decrypted = await client.crypto.decrypt(
    bobShared.secret,
    received.ciphertext,
    received.nonce
  );
  const message = Buffer.from(decrypted.plaintext, "hex").toString("utf-8");
  console.log("Decrypted:", message);
}

main().catch(console.error);
