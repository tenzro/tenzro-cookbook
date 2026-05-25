// NFT Marketplace
// Create collections, mint NFTs, transfer ownership, and create cross-VM pointers.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 0: Provision an identity + wallet so we have a creator address.
  const me = await client.provider.participate("local-password");
  const creator = me.wallet.address;

  // Step 1: Create an NFT collection (ERC-721)
  const nft = client.nft;
  const collection = await nft.createCollection(
    "Tenzro Art",
    "TART",
    "ERC-721",
    creator
  );
  console.log("Collection created:", collection.collection_id);

  // Step 2: Mint an NFT
  const minted = await nft.mintNft(
    collection.collection_id,
    "1",
    creator,
    "ipfs://bafy.../tenzro-genesis-1.json"
  );
  console.log("Minted:", minted.token_id);

  // Step 3: Look up the NFT
  const info = await nft.getNftInfo(collection.collection_id, minted.token_id);
  console.log("NFT info:", info);

  // Step 4: Transfer ownership
  // (For brevity, transferring to self — replace `recipient` with a real address.)
  const recipient = creator;
  const transfer = await nft.transferNft(
    collection.collection_id,
    minted.token_id,
    creator,
    recipient
  );
  console.log("Transferred:", transfer.tx_hash);

  // Step 5: Create a fungible ERC-20 alongside the collection (e.g., for royalty payouts)
  const token = client.token;
  const newToken = await token.createToken({
    name: "My Token",
    symbol: "MTK",
    decimals: 18,
    initial_supply: "1000000",
    creator,
  });
  console.log("\nERC-20 Token created:", newToken.token_id);

  // Step 6: Look up the token
  const tokenInfo = await token.getTokenInfo({ symbol: "MTK" });
  console.log("Token info:", tokenInfo);
}

main().catch(console.error);
