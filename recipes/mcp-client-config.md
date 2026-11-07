# MCP: register the Tenzro server in a client

Most MCP clients that support remote servers keep them in a JSON settings file under an `mcpServers` key. The exact file and key names depend on the client; the entry looks like this:

```json
{
  "mcpServers": {
    "tenzro": {
      "type": "http",
      "url": "https://mcp.tenzro.com/mcp"
    }
  }
}
```

The client must support Streamable HTTP and MCP revision 2026-07-28. Read tools (for example `get_node_status`, `get_block`, `list_models`, `get_balance`) need no authentication; tools that move money or change state need a bearer token.

## What was verified

The JSON is parsed as valid JSON by this repository's CI. The entry itself is copied from the tutorial and was not tested against a client here.

Source: [Connect an MCP client](https://www.tenzro.com/tutorials/connect-an-mcp-client), step 2.
