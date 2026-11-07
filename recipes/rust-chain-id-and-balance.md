# Rust: read the chain id and a balance

Connect the `tenzro-sdk` crate to a Tenzro endpoint and read the chain id and an account balance (read-only).

```bash
cargo add tenzro-sdk tokio --features tokio/full
```

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let local = tenzro_sdk::TenzroClient::new("http://127.0.0.1:8545").await?;
    let address = tenzro_sdk::Address::from_hex(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    )
    .unwrap();
    println!("{} {}", local.get_chain_id().await?, local.get_balance(address).await?);
    Ok(())
}
```

`TenzroClient::new` takes one endpoint: `https://rpc.tenzro.com` for the preview network, or the local chain `tenzro dev` serves. An address is 32 bytes (`0x` plus 64 hex characters).

## What was verified

`cargo check` passes for exactly this program against `tenzro-sdk` 0.7.0 from crates.io. It was not run against a live endpoint when this recipe was written. The GUIDE quickstart omits the `tokio` setup and the `Address` construction; both were added here so the program compiles.

Source: [docs/GUIDE.md, section 0 (Quickstart)](https://github.com/tenzro/tenzro-network/blob/main/docs/GUIDE.md), and the [Rust SDK quickstart](https://www.tenzro.com/tutorials/sdk-quickstart-rust).
