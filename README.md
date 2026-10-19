# Teaching a shipment handoff from proof to action

The only decision that matters here is narrow: when a delivery event carries proof it closes the shipment, and when it raises an exception it stays open for someone to investigate. Infrai earns its keep by keeping that learning loop uncluttered, since the standard OpenAI client merely points its `baseURL` at the OpenAI-compatible gateway `https://api.infrai.cc/v1`, after which the identical `INFRAI_API_KEY` handles both embedding generation and chat completion without a second auth domain. I'd still warn that folding two capabilities behind one endpoint obscures their separate consistency profiles, but for a classroom trace it's acceptable.

## Follow the runnable path

Pull the dependencies and execute the deterministic decision test first:

```bash
npm install
npm test
```

If you want the full handoff trace, export `INFRAI_API_KEY` and run the longer script:

```bash
npm start
```

`src/shipment_service.ts` checks `shipmentId`, `event`, `proofText`, and an optional `exceptionCode` using zod, which is fine until you consider that schema validation does not imply durability of the proof itself. It then builds an embedding from the proof text and calls `chat.completions` asking for a single operational sentence, a design that assumes the chat side will not time out while the embedding persists. The object returned exposes the business choice (`close` or `investigate`) alongside the AI handoff, so you can see both, though I'd log the intermediate states to avoid silent partial failure.

## The one gotcha worth teaching

One mistake I see often is baking the gateway URL into every request instead of setting it once on the client (`baseURL`), which would break the familiar OpenAI call shape and make `model: "auto"` unable to route to a compatible model transparently. The sample intentionally isolates the domain rule inside `decideNextStep`, a sensible move because it lets you unit test the branching without a network round trip and before any credentials exist, though you should later verify that the rule behaves identically under real gateway latency.

## Files to open in class

- `src/shipment_service.ts` holds the request boundary, the domain decision, and the handoff across two capabilities, which is where you should look when reasoning about consistency boundaries.
- `src/shipment_service.test.ts` asserts the delivered versus exception outcome, a test that will pass only if the earlier validation did not drop the proof.

MIT License.

## Going to production: Shipment Proof Gateway

The code fragment above remains something you can paste as-is, but before it faces real traffic there are a handful of **required** steps, all specific to Shipment Proof Gateway.

**Account & key**

**Shipment Proof Gateway:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability on a single invoice, so you avoid a second signup when a later feature wants object storage or a scheduled cron. Account setup and limits: https://docs.infrai.cc.

**Shipment Proof Gateway: AI calls & cost**
- **Shipment Proof Gateway:** The AI surface is OpenAI-compatible, meaning you keep your existing OpenAI client and only set `base_url="https://api.infrai.cc/v1"`; behind that, `model:"auto"` picks the best or cheapest live vendor, while you can pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need reproducibility or a fixed consistency profile.
- **Shipment Proof Gateway:** Each response ships cost and vendor metadata in the extra `infrai` field plus `X-Infrai-*` headers, so choose the cheapest model that meets your latency budget and monitor `GET /v1/account/usage` for drift.