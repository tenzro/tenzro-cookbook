# Creating a did:tenzro identity (walkthrough, not runnable here)

[Resolving](https://github.com/tenzro/tenzro-sdk-rust/blob/main/examples/did_resolve.rs) a `did:tenzro`
identity is a plain read and is tested in this programme (Rust and TypeScript examples, both run
against a live node). Creating one is not: a real creation needs proof that the caller holds a
hardware key (a passkey, a TPM, or a Secure Enclave), and nothing in this environment can honestly
produce that proof. This recipe describes the real flow with exact RPC names and source citations,
instead of shipping code nobody ran.

## The flow, as the node implements it

1. **`tenzro_createCustodyChallenge`** (`crates/tenzro-node/src/passkey_rpc.rs`) issues a challenge for
   an `enroll_passkey` operation, bound to the caller's P-256 public key and credential id.
2. The caller signs that challenge with its hardware key, producing a `CompositeSignature`
   (`sdk/tenzro-ts-sdk/packages/core/src/passkey-rpc.ts`): a classical P-256 leg — either a real
   WebAuthn assertion (`{form: "web_authn", authenticator_data, client_data_json, signature}`) from a
   browser ceremony, or a raw hardware signature (`{form: "raw", signature}`) from a TPM/Secure
   Enclave — plus, where the hardware has one, an ML-DSA-65 (post-quantum) signature over the same
   challenge.
3. **`tenzro_enrollPasskey`** verifies that signature and the proof of possession, and returns the
   derived account address.
4. **`tenzro_registerIdentity`** (wrapped as `registerHuman`/`registerMachine` in the SDKs,
   `sdk/tenzro-ts-sdk/packages/core/src/identity.ts`) writes the `did:tenzro` document.

## Why this repo doesn't ship a tested example

- A real WebAuthn ceremony (step 2's `web_authn` form) needs a browser and a real or
  CDP-virtual authenticator; building and verifying that harness correctly is real engineering work
  that was not attempted here rather than rushed.
- A real TPM/Secure Enclave ceremony (step 2's `raw` form) needs real hardware this environment
  doesn't have.
- The node's own test suite proves the flow works without either: `crates/tenzro-node/tests/auth_integration.rs`'s
  `SigningIdentity::register` uses `tenzro_crypto::testing::TestHybridSigner`, a software hybrid
  signer, to write a human identity straight into the node's registry via `register_human_via_binder` —
  but that's an internal test helper that bypasses the public custody-challenge RPCs on purpose (its own
  doc comment explains why: production keeps the signing key inside the node, which defeats a test
  that has to *prove* ownership). It demonstrates the identity-registry side works, not the public
  create path a real SDK caller uses.

## The honest next step

Someone with time to build it right: a small test harness using `TestHybridSigner` (or an equivalent
software hybrid signer) to produce a valid `raw`-form `CompositeSignature` and exercise
`tenzro_createCustodyChallenge` → `tenzro_enrollPasskey` → `tenzro_registerIdentity` end to end against
a real node, labeled clearly as a software test signer (the same pattern `crates/tenzro-node/examples/test_passkey.rs`
already uses for a different flow: gated behind an explicit opt-in env var, refuses outside a private
test network, never a secret). That is real, scoped work — not attempted tonight to avoid shipping a
signature construction nobody checked against the node's actual verifier.
