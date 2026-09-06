import assert from "node:assert/strict";
import { decideNextStep, shipmentRequest } from "./shipment_service.js";

const delivered = shipmentRequest.parse({ shipmentId: "SHP-1", event: "delivered", proofText: "Signed at dock" });
assert.equal(decideNextStep(delivered), "close");
assert.equal(decideNextStep({ ...delivered, event: "exception" }), "investigate");
console.log("shipment decision test passed");
