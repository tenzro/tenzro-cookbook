// End-to-End Encrypted Messaging
// X25519 key exchange + AES-256-GCM encryption over agent messaging.
//
// Note: X25519 keys are 32-byte clamped scalars and are NOT interchangeable
// with Ed25519 signing keys. We generate raw 32-byte secrets locally via
// Node's crypto and let the node derive the shared secret over the wire.

import { randomBytes } from "node:crypto";
import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Provision two identities + wallets so we have real creator addresses.
  const aliceMe = await client.provider.participate("alice-password");
  const bobMe = await client.provider.participate("bob-password");
  const aliceCreator = aliceMe.wallet.address;
  const bobCreator = bobMe.wallet.address;

  // Step 1: Register two agents (Alice and Bob)
  const alice = await client.agent.register(
    "alice-messenger",
    aliceCreator,
    ["messaging", "encryption"]
  );
  const bob = await client.agent.register(
    "bob-messenger",
    bobCreator,
    ["messaging", "encryption"]
  );
  console.log("Alice:", alice.agent_id);
  console.log("Bob:", bob.agent_id);

  // Step 2: Generate fresh 32-byte X25519 secrets locally
  const aliceSecret = "0x" + randomBytes(32).toString("hex");
  const bobSecret = "0x" + randomBytes(32).toString("hex");

  // Step 3: Derive each side's public key + shared secret via the node's
  // X25519 helper (the response also surfaces our public key so both sides
  // can publish it).
  const aliceExchange = await client.crypto.x25519KeyExchange(
    aliceSecret,
    "0x" + "00".repeat(32) // placeholder; replaced below once we know Bob's public key
  ).catch(async () => {
    // Some node versions reject the all-zero peer; derive Alice's public key
    // by running the exchange against a throwaway peer key.
    return client.crypto.x25519KeyExchange(aliceSecret, "0x" + randomBytes(32).toString("hex"));
  });
  const bobExchange = await client.crypto.x25519KeyExchange(
    bobSecret,
    aliceExchange.our_public_key_hex ?? "0x" + randomBytes(32).toString("hex")
  );

  // Final exchange: Alice derives her shared secret using Bob's real pubkey.
  const aliceFinal = await client.crypto.x25519KeyExchange(
    aliceSecret,
    bobExchange.our_public_key_hex
  );
  const bobFinal = await client.crypto.x25519KeyExchange(
    bobSecret,
    aliceExchange.our_public_key_hex
  );
  console.log(
    "\nShared secrets match:",
    aliceFinal.shared_secret_hex === bobFinal.shared_secret_hex
  );

  // Step 4: Encrypt a message (Alice -> Bob)
  const plaintext = "Hello Bob! This is a secret message from Alice.";
  const encrypted = await client.crypto.encrypt(
    aliceFinal.shared_secret_hex,
    Buffer.from(plaintext).toString("hex")
  );
  console.log("\nEncrypted ciphertext:", encrypted.ciphertext.substring(0, 40) + "...");
  console.log("Nonce:", encrypted.nonce);

  // Step 5: Send encrypted message via agent messaging (from, to, message)
  const envelope = JSON.stringify({
    type: "encrypted_message",
    sender_public_key: aliceExchange.our_public_key_hex,
    nonce: encrypted.nonce,
    ciphertext: encrypted.ciphertext,
  });

  const response = await client.agent.sendMessage(
    alice.agent_id,
    bob.agent_id,
    envelope
  );
  console.log("\nMessage sent, ID:", response.message_id);

  // Step 6: Bob decrypts the message
  const received = JSON.parse(envelope);
  const decrypted = await client.crypto.decrypt(
    bobFinal.shared_secret_hex,
    received.ciphertext,
    received.nonce
  );
  const message = Buffer.from(decrypted.plaintext, "hex").toString("utf-8");
  console.log("Decrypted:", message);
}

main().catch(console.error);
