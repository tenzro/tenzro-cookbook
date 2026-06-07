// Capital Intent — regulated capital allocation over tokenized assets.
//
// `CapitalIntent` is the capital-markets analog of an AP2 Intent Mandate:
// a signed, expiring authorization that says "I want to acquire / exit /
// rebalance / hedge / yield this basket, subject to these regulatory
// constraints, KYA, and ceilings." Solvers bid; the principal (or an
// authorized assigner) picks one; the intent runs through Execute → Settle
// with optional Verify and Compensate steps.
//
// Companion read paths:
// - `getCapitalIntent`  for the current intent state.
// - `getReserve` / `submitReserveAttestation` for the 1:1-backed reserve
//   attestations that underpin `attestedMint`.

import { TenzroClient, type CapitalIntent } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient({
    endpoint: "https://rpc.tenzro.network",
  });

  // 1) Build a signed CapitalIntent.
  //
  //    The objective is "acquire this basket of tokenized US Treasury bills,"
  //    constrained to a max price + slippage budget, gated by a reg regime
  //    + KYA assertion, and authorized for a 24h window by the principal DID.
  const intent: CapitalIntent = {
    objective: {
      kind: "acquire",
      basket: [
        { asset_id: "0xTBILL_3M", weight_bps: 6000 },
        { asset_id: "0xTBILL_6M", weight_bps: 4000 },
      ],
    },
    constraints: {
      max_price: 1_000_000_000_000, // wei
      max_eta_secs: 3_600,
      max_slippage_bps: 25,
    },
    compliance: {
      reg_regime: "us-reg-d-506c",
      required_kya: ["accredited", "kya-tier-2"],
      jurisdictions: ["US"],
    },
    authorization: {
      principal_did: "did:tenzro:human:0123...",
      signature: "0xPRINCIPAL_SIG",
      expires_at: Math.floor(Date.now() / 1000) + 86_400,
    },
    settlement_req: {
      payer: "0xPAYER",
      asset_id: "0xUSDC",
      amount: "1000000000",
    },
  };

  const opened = (await client.capital.open(intent)) as { intent_id: string };
  console.log("intent opened:", opened.intent_id);

  // 2) (Done by solver workers separately.) Submit one or more solver bids.
  //    Skipped here — see capital_intent_quote in the docs.

  // 3) Auto-assign by ERC-8004 reputation + price + eta.
  const assigned = await client.capital.assign(opened.intent_id, {
    auto: true,
    payer: "0xPAYER",
    payee: "0xCUSTODY_VAULT",
  });
  console.log("assigned:", assigned);

  // 4) Execute each leg. Solver fans out venue calls; reports each fill back.
  await client.capital.execute(opened.intent_id, {
    venue: "venue:dex:0xUSDC-TBILL3M",
    asset_id: "0xTBILL_3M",
    side: "acquire",
    quantity: "600",
    unit_price: "999_500_000",
    settlement_ref: "0xVENUE_RECEIPT_1",
  });
  await client.capital.execute(opened.intent_id, {
    venue: "venue:dex:0xUSDC-TBILL6M",
    asset_id: "0xTBILL_6M",
    side: "acquire",
    quantity: "400",
    unit_price: "1_000_200_000",
    settlement_ref: "0xVENUE_RECEIPT_2",
  });

  // 5) Verify (or compensate if a leg disputes).
  await client.capital.verify(opened.intent_id);

  // 6) Settle — releases escrow to the payee (the custody vault here).
  await client.capital.settle(opened.intent_id);

  // 7) Read the final intent state for audit.
  const state = await client.capital.get(opened.intent_id);
  console.log("final state:", state);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
