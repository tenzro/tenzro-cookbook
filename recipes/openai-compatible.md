# Point an OpenAI-compatible client at a Tenzro node

A Tenzro node serves `POST /v1/chat/completions`, `POST /v1/embeddings` and `GET /v1/models` itself (see `crates/tenzro-node/src/infer.rs` and `modality_http.rs` in tenzro-network). Clients that let you set a `base_url` (the `openai` Python and JS SDKs, and the frameworks built on them: LangChain `ChatOpenAI`, LlamaIndex `OpenAI`, LiteLLM `openai/<model>` with `api_base`, Vercel AI SDK `createOpenAI({ baseURL })`) can in principle talk to it. Only the plain `openai` Python package was tried here.

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8545/v1", api_key="unused")  # your node's RPC address
print(client.models.list().data)           # models this node serves right now
r = client.chat.completions.create(
    model="<a model id from models.list()>",
    messages=[{"role": "user", "content": "hi"}],
)
# Embeddings: the node serves only float encoding, so say so explicitly.
e = client.embeddings.create(model="<embedding model id>", input="hi", encoding_format="float")
```

The node's RPC listener is loopback-only by default; reach a remote node through an SSH tunnel or your own HTTPS reverse proxy. Whether a call is free, paid (HTTP 402 payment gate) or refused depends on the node's access policy and the model's visibility (`public` / `gated` / `private`, see `crates/tenzro-node/src/inference_admission.rs`). A client that cannot send the payment credential will not get past a paid model.

## What was verified

Tested 2026-11-07 against the live dev node (chain 13380, `127.0.0.1:28545` on server3) with `openai` 3.46.0:

- `GET /v1/models` returned HTTP 200 with `{"object":"list","data":[], ...}`; `client.models.list()` parsed it.
- `POST /v1/chat/completions` and `POST /v1/embeddings` (raw curl and the `openai` client) both returned **HTTP 404** `{"error":{"message":"model <id> not served here","type":"invalid_request_error","code":"model_not_served"}}`. The routes are mounted and the error is in OpenAI's error shape (the client raised `NotFoundError` with `code == "model_not_served"`), but **that node has no model loaded**, so no successful completion or embedding was observed.
- Not verified: a successful completion, streaming through a framework, the 402 payment flow, and the `encoding_format="float"` requirement (read from source, not exercised). I did not load a model into the dev node, because it is a shared node; it needs `tenzro_serveModel` with a catalog model present on that node.
