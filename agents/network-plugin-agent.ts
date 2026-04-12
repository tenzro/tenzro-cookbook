// Network Plugin Agent
// Build an agent with skills and tools from the registry.

import { TenzroClient, TESTNET_CONFIG } from "tenzro-sdk";

async function main() {
  const client = new TenzroClient(TESTNET_CONFIG);

  // Step 1: Register the agent
  const agent = await client.agent.register(
    "defi-plugin-agent",
    "DeFi Plugin Agent",
    ["defi", "bridge", "swap"]
  );
  console.log("Agent registered:", agent.agent_id);

  // Step 2: Discover available skills
  const skills = await client.skill.listSkills();
  console.log("\nAvailable skills:");
  for (const skill of skills) {
    console.log(`  ${skill.skill_id}: ${skill.name} (${skill.category})`);
  }

  // Step 3: Discover available tools (MCP servers)
  const tools = await client.tool.listTools();
  console.log("\nAvailable tools:");
  for (const tool of tools) {
    console.log(`  ${tool.tool_id}: ${tool.name} (${tool.tool_type})`);
  }

  // Step 4: Spawn agent with a specific skill
  const skilledAgent = await client.agent.spawnAgentWithSkill(
    agent.agent_id,
    "solana-defi-agent",
    "solana-defi",
    ["swap", "stake", "nft"]
  );
  console.log("\nSkilled agent:", skilledAgent);

  // Step 5: Run an agentic task loop
  const result = await client.agent.runAgentTask(
    agent.agent_id,
    "Check TNZO price and find the best bridge route to Ethereum"
  );
  console.log("\nTask result:", result.result);

  // Step 6: Discover models for inference
  const models = await client.agent.discoverModels({ servingOnly: true });
  console.log("\nServing models:", models);
}

main().catch(console.error);
