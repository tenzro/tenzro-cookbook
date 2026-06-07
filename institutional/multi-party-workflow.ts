// Multi-party saga workflow — Execute → Verify → Compensate step lifecycles
// with optional per-step escrow and optional Canton DAML mirroring.
//
// The workflow runtime is the orchestration layer for multi-party transactions
// where each step needs explicit verification (or rollback) and durable
// receipts. Workflows can mirror to a Canton synchronizer for regulated
// counterparties that need DAML-side reconciliation.

import { TenzroClient, type WorkflowPayload } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient({
    endpoint: "https://rpc.tenzro.network",
  });

  // 1) Declare a workflow with two ordered steps.
  //    Step 1: Buyer escrows USDC to a custody vault.
  //    Step 2: Seller delivers tokenized treasury bills to the buyer.
  const payload: WorkflowPayload = {
    creator_did: "did:tenzro:human:alice",
    participants: [
      "did:tenzro:human:alice", // buyer
      "did:tenzro:human:bob",   // seller (also a regulated dealer)
    ],
    steps: [
      { step_id: "escrow-funds", status: "pending" },
      { step_id: "deliver-tbills", status: "pending" },
    ],
    metadata: {
      purpose: "DvP — delivery-versus-payment, T-bill primary purchase",
    },
  };

  const opened = (await client.workflow.open(payload)) as { workflow_id: string };
  console.log("workflow opened:", opened.workflow_id);

  // 2) Execute step 1 with per-step escrow (the runtime locks the amount
  //    on Tenzro Ledger; Verify will only succeed once Bob's delivery
  //    receipt also lands).
  await client.workflow.stepExecute(
    opened.workflow_id,
    "escrow-funds",
    1_000_000_000n, // smallest-unit u128 ceiling for the escrow
  );

  await client.workflow.stepVerify(opened.workflow_id, "escrow-funds");

  // 3) Execute step 2 — Bob's delivery. The participant's RPC client (Bob's
  //    DID) would call this with the delivery proof in the payload.
  await client.workflow.stepExecute(opened.workflow_id, "deliver-tbills");

  // If verify fails for any reason (mismatched delivery proof, etc.),
  // compensate the step to roll back its side-effects, then compensate
  // step 1 to refund Alice's escrow.
  try {
    await client.workflow.stepVerify(opened.workflow_id, "deliver-tbills");
  } catch (err) {
    console.warn("delivery verify failed — compensating:", err);
    await client.workflow.stepCompensate(opened.workflow_id, "deliver-tbills");
    await client.workflow.stepCompensate(opened.workflow_id, "escrow-funds");
    return;
  }

  // 4) Finalize — emits a WorkflowReceipt on-chain (queryable via
  //    `tenzro_getWorkflowReceipt`).
  await client.workflow.finalize(opened.workflow_id);

  // 5) Mirror the workflow to Canton for the regulated counterparty's
  //    DAML reconciliation. The Canton package id is supplied by the
  //    operator (see CantonConfig::from_env).
  await client.workflow.mirrorToCanton(opened.workflow_id);

  // 6) Read the final receipt + metrics for audit.
  const receipt = await client.workflow.getReceipt(opened.workflow_id);
  const metrics = await client.workflow.getOperationalMetrics(opened.workflow_id);
  console.log("receipt:", receipt);
  console.log("metrics:", metrics);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
