# MCP: check the Tenzro MCP server

Tenzro serves the Model Context Protocol at `https://mcp.tenzro.com/mcp` over Streamable HTTP. The server speaks MCP revision 2026-07-28: there is no `initialize` handshake and no session. Every request carries the protocol version and client capabilities in `_meta`.

```bash
curl -s -X POST https://mcp.tenzro.com/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover",
       "params":{"_meta":{
         "io.modelcontextprotocol/protocolVersion":"2026-07-28",
         "io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The reply lists the revision the server serves. Any other revision, and any `initialize` request, returns error -32022.

## What was verified

The command is copied verbatim from the tutorial below. It was not run when this recipe was written (the host did not resolve from the build machine), so no sample output is shown. Treat the tutorial as the authority.

Source: [Connect an MCP client](https://www.tenzro.com/tutorials/connect-an-mcp-client), step 1.
