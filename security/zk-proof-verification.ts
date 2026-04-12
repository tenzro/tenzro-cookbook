// Zero-Knowledge Proof Verification
// Generate and verify Groth16 proofs for inference and settlement.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: List available ZK circuits
  const circuits = await client.zk.listCircuits();
  console.log("Available circuits:");
  for (const c of circuits) {
    console.log(`  ${c.name}: ${c.circuit_type} (${c.constraints} constraints)`);
  }

  // Step 2: Create an inference verification proof
  const inferenceProof = await client.zk.createProof(
    "inference",
    {
      model_hash: "0xa1b2c3d4e5f6...",
      input_hash: "0xf6e5d4c3b2a1...",
      output_hash: "0x1234567890ab...",
    },
    ["0x1234...", "0x5678..."]
  );
  console.log("\nInference proof:", inferenceProof.proof.substring(0, 40) + "...");
  console.log("Proof type:", inferenceProof.proof_type);

  // Step 3: Verify the proof
  const result = await client.zk.verifyProof(
    inferenceProof.proof,
    "groth16",
    inferenceProof.public_inputs
  );
  console.log("\nVerification result:", result.valid);
  console.log("Message:", result.message);

  // Step 4: Create a settlement proof
  const settlementProof = await client.zk.createProof(
    "settlement",
    {
      provider_address: "0x7f3a...9c1e",
      customer_address: "0x4b2d...8f3a",
      amount: 50,
      fee: 0.25,
    },
    ["0xabcd...", "0xef01..."]
  );
  console.log("\nSettlement proof:", settlementProof.proof.substring(0, 40) + "...");

  // Step 5: Create an identity proof (prove KYC tier without revealing data)
  const identityProof = await client.zk.createProof(
    "identity",
    {
      did_hash: "0xdid-hash-7890...",
      kyc_tier: 2,
      credential_hash: "0xcred-hash-abcd...",
    },
    ["0x0002"] // public input: required KYC tier
  );
  console.log("Identity proof:", identityProof.proof.substring(0, 40) + "...");

  // Step 6: Generate a proving key
  const provingKey = await client.zk.generateProvingKey("inference");
  console.log("\nProving key ID:", provingKey.key_id);
}

main().catch(console.error);
