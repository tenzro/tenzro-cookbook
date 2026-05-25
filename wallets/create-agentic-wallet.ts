// Create an Agentic Wallet
//
// One-click identity + MPC wallet via `participate`, fund from faucet,
// poll until the faucet credits land, then send 1 TNZO. Runs against the
// live Tenzro testnet.
//
// Honest caveat: the `participate` password is silently ignored by the
// live RPC handler. We pass an empty string to make that explicit.

import { TenzroClient } from "tenzro-sdk";

const FAUCET_POLL_SECS = 180;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const client = TenzroClient.testnet();

  // Step 1: one-click participation — provisions identity + MPC wallet
  // and returns a hardware profile snapshot.
  const result = await client.provider.participate("");
  console.log("DID:    ", result.did);
  console.log("Address:", result.address);

  // Step 2: fund from the testnet faucet, then poll until the balance
  // shows up. The faucet is a single-MPC-signer contention point, so
  // give it ~3 minutes before timing out.
  const faucet = await client.requestFaucet(result.address);
  console.log("Faucet :", faucet.amount, "wei requested");

  const target = 1_000_000_000_000_000_000n; // 1 TNZO
  const started = Date.now();
  let funded = false;
  while ((Date.now() - started) / 1000 < FAUCET_POLL_SECS) {
    let balance = 0n;
    try {
      balance = await client.getBalance(result.address);
    } catch { /* transient — keep polling */ }
    if (balance >= target) {
      console.log(`Funded after ${Math.round((Date.now() - started) / 1000)}s, balance=${balance} wei`);
      funded = true;
      break;
    }
    await sleep(3000);
  }
  if (!funded) throw new Error(`address never funded within ${FAUCET_POLL_SECS}s`);

  // Step 3: spawn a recipient and send 1 TNZO via the hybrid-signing
  // path. The node identifies the signer from the ambient auth context,
  // builds the canonical preimage, signs both the Ed25519 and ML-DSA-65
  // legs, and submits to the mempool — private keys never leave the node.
  const recipient = await client.provider.participate("");
  console.log("Recipient:", recipient.address);

  const txHash = await client.wallet.signAndSend({
    from: result.address,
    to: recipient.address,
    value: target,
  });
  console.log("Sent 1 TNZO, tx:", txHash);

  // Step 4: resolve the identity to confirm it landed in the registry.
  // `tenzro_resolveIdentity` returns the on-chain `TenzroIdentity` record
  // with snake_case fields. Human/machine flag is two booleans; KYC tier
  // is not surfaced by this endpoint (resolve via the DID Document if
  // you need it).
  const identity = await client.identity.resolve(result.did);
  console.log("DID    :", identity.did);
  console.log("Human? :", identity.is_human);
  console.log("Machine?:", identity.is_machine);
  console.log("Status :", identity.status);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
