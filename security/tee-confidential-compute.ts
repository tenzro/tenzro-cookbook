// TEE Confidential Computing
// Detect TEE hardware, generate attestation, seal data, and verify.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Detect TEE hardware
  const teeInfo = await client.tee.detectTee();
  console.log("TEE available:", teeInfo.available);
  console.log("Vendor:", teeInfo.vendor);
  console.log("Capabilities:", teeInfo.capabilities);

  // Step 2: Generate attestation report
  if (teeInfo.available) {
    const attestation = await client.tee.getAttestation(teeInfo.vendor);
    console.log("\nAttestation report:", attestation.report.substring(0, 32) + "...");
    console.log("Cert chain:", attestation.certificate_chain.length, "certificates");

    // Step 3: Verify the attestation
    const verification = await client.tee.verifyAttestation(
      attestation.report,
      teeInfo.vendor
    );
    console.log("\nVerification:", verification.valid ? "PASSED" : "FAILED");
    console.log("Message:", verification.message);
  }

  // Step 4: Seal sensitive data in TEE enclave
  const secretData = Buffer.from("api-key-abc123-secret").toString("hex");
  const sealed = await client.tee.sealData(secretData, "my-app-key-v1");
  console.log("\nSealed data:", sealed.ciphertext.substring(0, 40) + "...");
  console.log("Key ID:", sealed.key_id);

  // Step 5: Unseal data
  const unsealed = await client.tee.unsealData(sealed.ciphertext, sealed.key_id);
  console.log("Unsealed:", Buffer.from(unsealed.data, "hex").toString("utf-8"));

  // Step 6: List TEE providers on the network
  const providers = await client.tee.listTeeProviders();
  console.log("\nTEE providers on network:", providers.length);
  for (const p of providers) {
    console.log(`  ${p.address} (${p.vendor}) - available: ${p.available}`);
  }
}

main().catch(console.error);
