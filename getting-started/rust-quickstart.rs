// Tenzro Rust SDK Quickstart
// Connect to testnet, create a wallet, fund from faucet, and run inference.
//
// Add to Cargo.toml:
//   tenzro-sdk = "0.1"
//   tenzro-types = "0.1"
//   tokio = { version = "1", features = ["full"] }

use tenzro_sdk::{TenzroClient, config::SdkConfig};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Step 1: Connect to testnet
    let config = SdkConfig::testnet();
    let client = TenzroClient::connect(config).await?;

    let info = client.node_info().await?;
    println!("Connected to Tenzro Network");
    println!("  Chain ID: {}", info.chain_id);
    println!("  Block height: {}", info.block_height);
    println!("  Peers: {}", info.peer_count);

    // Step 2: Create a wallet
    let wallet = client.wallet();
    let wallet_info = wallet.create_wallet().await?;
    println!("\nWallet created: {}", wallet_info.address);

    // Step 3: Request testnet TNZO from faucet
    let faucet = client.request_faucet(tenzro_types::Address::zero()).await?;
    println!("Faucet: {} (tx: {:?})", faucet.amount, faucet.tx_hash);

    // Step 4: Check balance
    let balance = wallet.get_balance(tenzro_types::Address::zero()).await?;
    println!("Balance: {} wei", balance);

    // Step 5: Register an identity
    let identity = client.identity();
    let id_result = identity.register_human("Alice").await?;
    println!("\nIdentity registered: {}", id_result.did);

    // Step 6: List available models
    let inference = client.inference();
    let models = inference.list_models().await?;
    println!("\nAvailable models: {}", models.len());
    for m in &models {
        println!("  {} - {}", m.model_id, m.name);
    }

    // Step 7: Run inference
    let response = inference.request(
        "gemma3-270m",
        "What is the Tenzro Network?",
        Some(100),
    ).await?;
    println!("\nInference result: {}", response.output);
    println!("Tokens used: {}", response.tokens_used);

    Ok(())
}
