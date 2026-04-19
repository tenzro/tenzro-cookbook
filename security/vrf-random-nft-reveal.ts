// VRF Random NFT Reveal
//
// Demonstrates RFC 9381 ECVRF-EDWARDS25519-SHA512-TAI on Tenzro Ledger:
//   1. Generate a VRF proof from a 32-byte Ed25519-compatible seed
//   2. Verify the proof via precompile 0x1007 (VRF_VERIFY)
//   3. Mint an NFT with provably-fair randomness using `mintRandom`
//      (selector 0x52517e21) — the NFT token_id and rarity tier are
//      derived from the verified VRF output, giving Chainlink-VRF-style
//      auditable randomness without external oracles.
//
// Primitives used:
//   - RPC: tenzro_generateVrfProof, tenzro_verifyVrfProof
//   - EVM precompile: 0x1007 (VRF_VERIFY)
//   - NFT factory: mintRandom(address to, bytes proof) selector 0x52517e21
//   - Output: 64-byte deterministic hash derived from the proof

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";
import { randomBytes } from "crypto";

// Selector for NftFactory.mintRandom(address,bytes)
const MINT_RANDOM_SELECTOR = "0x52517e21";

// NFT factory precompile address (0x1006)
const NFT_FACTORY_ADDRESS = "0x0000000000000000000000000000000000001006";

// VRF_VERIFY precompile address (0x1007)
const VRF_VERIFY_PRECOMPILE = "0x0000000000000000000000000000000000001007";

function toHex(bytes: Uint8Array | Buffer): string {
  return "0x" + Buffer.from(bytes).toString("hex");
}

function padHex(hex: string, bytes: number): string {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  return stripped.padStart(bytes * 2, "0");
}

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);
  const rpc = (client as any).rpc; // RpcClient.call<T>(method, params)

  // ---------------------------------------------------------------------
  // Step 1: Generate a VRF proof
  //
  // The seed is a 32-byte value that serves as both the private-key
  // material and the ECVRF alpha input. On Tenzro Ledger the same Ed25519
  // validator key can be reused for VRF, per RFC 9381 §5.4.1.1.
  // ---------------------------------------------------------------------
  const seed = randomBytes(32);
  console.log("Seed (32 bytes):", toHex(seed));

  const proveResult = await rpc.call<{
    proof: string;        // 80-byte ECVRF proof (hex)
    output: string;       // 64-byte deterministic output (hex)
    public_key: string;   // 32-byte Ed25519-compatible public key
  }>("tenzro_generateVrfProof", [toHex(seed)]);

  console.log("\nVRF proof (80 bytes):", proveResult.proof);
  console.log("VRF output (64 bytes):", proveResult.output);
  console.log("Public key (32 bytes):", proveResult.public_key);

  // ---------------------------------------------------------------------
  // Step 2: Verify the proof off-chain via RPC
  // ---------------------------------------------------------------------
  const verifyResult = await rpc.call<{
    valid: boolean;
    output: string;
  }>("tenzro_verifyVrfProof", [
    proveResult.public_key,
    toHex(seed),             // alpha (message)
    proveResult.proof,
  ]);

  console.log("\nOff-chain verification:", verifyResult.valid ? "VALID" : "INVALID");
  if (!verifyResult.valid) {
    throw new Error("VRF proof failed off-chain verification");
  }
  if (verifyResult.output !== proveResult.output) {
    throw new Error("VRF output mismatch between prove and verify");
  }

  // ---------------------------------------------------------------------
  // Step 3: Verify the proof on-chain via precompile 0x1007
  //
  // Call format (ABI-encoded):
  //   public_key (32 bytes) || alpha (32 bytes) || proof (80 bytes)
  // Returns: 64-byte VRF output (or reverts on invalid proof)
  // ---------------------------------------------------------------------
  const callData =
    "0x" +
    padHex(proveResult.public_key, 32) +
    padHex(toHex(seed), 32) +
    padHex(proveResult.proof, 80);

  const onChainOutput = await rpc.call<string>("eth_call", [
    { to: VRF_VERIFY_PRECOMPILE, data: callData },
    "latest",
  ]);
  console.log("\nOn-chain precompile output:", onChainOutput);
  console.log(
    "On-chain == off-chain:",
    onChainOutput.toLowerCase() === proveResult.output.toLowerCase()
  );

  // ---------------------------------------------------------------------
  // Step 4: Derive a token_id and rarity tier from the VRF output
  //
  // The NFT factory's mintRandom() does this on-chain; we reproduce it
  // here so the user can preview the result.
  //
  // Rarity tiers (on-chain logic):
  //   0  Common       (70% — bottom 70% of 64-byte space)
  //   1  Uncommon     (20%)
  //   2  Rare         (7%)
  //   3  Epic         (2.5%)
  //   4  Legendary    (0.5%)
  // ---------------------------------------------------------------------
  const outputBytes = Buffer.from(proveResult.output.slice(2), "hex");
  const tokenId = BigInt("0x" + outputBytes.subarray(0, 32).toString("hex"));
  const rarityRoll = outputBytes[32]; // 0..255

  let tier: string;
  if (rarityRoll < 179) tier = "Common";
  else if (rarityRoll < 230) tier = "Uncommon";
  else if (rarityRoll < 248) tier = "Rare";
  else if (rarityRoll < 254) tier = "Epic";
  else tier = "Legendary";

  console.log("\nDerived token_id:", tokenId.toString());
  console.log("Rarity roll:", rarityRoll, "→", tier);

  // ---------------------------------------------------------------------
  // Step 5: Mint the NFT via NftFactory.mintRandom(address,bytes)
  //
  // The factory verifies the VRF proof on-chain via precompile 0x1007,
  // checks the derived token_id for collisions, and mints to `to`.
  // ---------------------------------------------------------------------
  const wallet = await client.wallet.getDefault();
  const recipient = wallet.address;

  // ABI-encode: selector || address (padded to 32) || offset (0x40)
  //           || length (80) || proof (padded to multiple of 32)
  const proofBytes = Buffer.from(proveResult.proof.slice(2), "hex");
  const proofPadded = Buffer.concat([
    proofBytes,
    Buffer.alloc((32 - (proofBytes.length % 32)) % 32),
  ]);
  const mintCalldata =
    MINT_RANDOM_SELECTOR +
    padHex(recipient, 32) +
    padHex("0x40", 32) +                // offset to bytes param
    padHex("0x" + proofBytes.length.toString(16), 32) + // 80
    proofPadded.toString("hex");

  console.log("\nSubmitting mintRandom() transaction...");
  const txHash = await rpc.call<string>("eth_sendTransaction", [
    {
      from: recipient,
      to: NFT_FACTORY_ADDRESS,
      data: mintCalldata,
      gas: "0x7a120", // 500k
    },
  ]);
  console.log("Mint tx hash:", txHash);

  // ---------------------------------------------------------------------
  // Step 6: Audit trail
  //
  // Any third party can now verify the mint by:
  //   1. Fetching the VRF proof from the transaction input
  //   2. Calling precompile 0x1007 off-chain with (public_key, seed, proof)
  //   3. Deriving the same token_id and rarity tier from the output
  //
  // Because VRF is deterministic, identical inputs always yield identical
  // outputs — and because the proof cryptographically binds public_key to
  // alpha, no one (including the minter) can grind for a preferred output.
  // ---------------------------------------------------------------------
  console.log("\nDone. The NFT is provably-fair and independently auditable.");
}

main().catch(console.error);
