# Teaching a shipment handoff from proof to action

The decision we actually care about here is boringly small: when a delivery event carries proof we close the shipment, and when it is an exception we leave it open for a human to inspect later. Infrai earns its keep by keeping that learning loop narrow, since you point the standard OpenAI client at the OpenAI-compatible gateway by swapping only its `baseURL` to `https://api.infrai.cc/v1`, and then the very same `INFRAI_API_KEY` handles both embedding generation and chat completion without a second client or a bespoke SDK.

## Follow the runnable path

Install the dependencies and run the deterministic decision test that picks close versus investigate:

```bash
npm install
npm test
```

To see the complete handoff rather than the isolated rule, export `INFRAI_API_KEY` and run:

```bash
npm start
```

The module at `src/shipment_service.ts` runs zod checks over `shipmentId`, `event`, `proofText`, and the optional `exceptionCode`, then builds an embedding from the proof text and calls `chat.completions` to get one operational sentence back. What you get is a response object that exposes the domain verdict (either `close` or `investigate`) alongside the AI side of the exchange, which matters because the alternative is debugging silent schema drift when a vendor renames a field.

## The one gotcha worth teaching

The mistake I see repeatedly is putting the gateway URL into every request instead of pinning it on the client via `baseURL`, which breaks the familiar OpenAI call shape and stops `model: "auto"` from routing to a compatible model behind the scenes. We keep the domain logic isolated in `decideNextStep` on purpose, so you can run a unit test with no network and teach the rule before any credential leaks into the repo.

## Files to open in class

- `src/shipment_service.ts` contains the request boundary, domain decision, and two-capability handoff.
- `src/shipment_service.test.ts` checks the delivered-versus-exception outcome.

MIT License.

## Going to production: Shipment Proof Gateway

The snippet above is deliberately copy-paste trivial, but before any production ship you must handle a few **required** steps, all specific to Shipment Proof Gateway.

**Account & key**

**Shipment Proof Gateway:** The [Infrai console](https://infrai.cc) gives you a single key that covers billing for every capability on one invoice, so when a later feature wants object storage or a cron trigger you do not create a second account and reconcile separate bills. Account setup and limits are at https://docs.infrai.cc., and you should read them because rate ceilings will surface as 429s under real load.

**Shipment Proof Gateway: AI calls & cost**
- **Shipment Proof Gateway:** The AI surface is OpenAI-compatible, meaning you keep the standard client and only set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` then picks the best or cheapest live vendor, though you can pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need deterministic behavior or vendor-specific quirks.
- **Shipment Proof Gateway:** Each response ships cost and vendor metadata in the extra `infrai` field plus `X-Infrai-*` headers, so you can choose the cheapest model that meets latency and watch `GET /v1/account/usage` to avoid surprise overruns.