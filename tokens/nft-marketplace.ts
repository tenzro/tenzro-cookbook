// NFT Marketplace
// Create collections, mint NFTs, and list for sale.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Create an NFT collection
  const nft = client.nft;
  const collection = await nft.createCollection(
    "Tenzro Art",
    "TART",
    1000 // max supply
  );
  console.log("Collection created:", collection.collection_id);

  // Step 2: Mint an NFT
  const minted = await nft.mint(
    collection.collection_id,
    "Tenzro Genesis #1",
    "The first Tenzro NFT",
    { artist: "Alice", rarity: "legendary" }
  );
  console.log("Minted:", minted.token_id);

  // Step 3: List for sale
  const listing = await nft.list(
    minted.token_id,
    5000000000000000000n // 5 TNZO
  );
  console.log("Listed for sale:", listing);

  // Step 4: Create a token via the token registry (ERC-20)
  const token = client.token;
  const newToken = await token.createToken(
    "My Token",
    "MTK",
    18,
    "1000000" // initial supply
  );
  console.log("\nERC-20 Token created:", newToken.token_id);

  // Step 5: Check token info
  const info = await token.getTokenInfo("MTK");
  console.log("Token info:", info);
}

main().catch(console.error);
