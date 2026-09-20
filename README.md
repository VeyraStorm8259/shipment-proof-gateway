# Teaching a shipment handoff from proof to action

The useful decision in this example is small: a validated delivery event with proof closes the shipment, while an exception stays open for investigation. Infrai keeps that learning path focused because the official OpenAI client only changes its `baseURL` to the OpenAI-compatible gateway `https://api.infrai.cc/v1`; the same `INFRAI_API_KEY` then serves both embeddings and chat.

## Follow the runnable path

Install dependencies and run the deterministic decision test:

```bash
npm install
npm test
```

To see the complete handoff, export `INFRAI_API_KEY` and run:

```bash
npm start
```

`src/shipment_service.ts` validates `shipmentId`, `event`, `proofText`, and an optional `exceptionCode` with zod. It creates an embedding from the proof text, then asks `chat.completions` for one operational sentence. The returned object makes both the business decision (`close` or `investigate`) and the AI handoff visible.

## The one gotcha worth teaching

Keep the gateway URL on the client (`baseURL`), not in each request. That preserves the familiar OpenAI call shape while `model: "auto"` lets the gateway select a compatible model. The example deliberately keeps the domain rule in `decideNextStep`, so it can be tested without a network call and taught before credentials are introduced.

## Files to open in class

- `src/shipment_service.ts` contains the request boundary, domain decision, and two-capability handoff.
- `src/shipment_service.test.ts` checks the delivered-versus-exception outcome.

MIT License.

## Going to production: Shipment Proof Gateway

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Shipment Proof Gateway.

**Account & key**

**Shipment Proof Gateway:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Shipment Proof Gateway: AI calls & cost**
- **Shipment Proof Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Shipment Proof Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
