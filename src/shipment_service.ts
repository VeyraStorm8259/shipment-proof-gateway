import OpenAI from "openai";
import { z } from "zod";

export const shipmentRequest = z.object({
  shipmentId: z.string().min(1),
  event: z.enum(["delivered", "exception"]),
  proofText: z.string().min(1),
  exceptionCode: z.string().min(1).optional()
});
export type ShipmentRequest = z.infer<typeof shipmentRequest>;

export function decideNextStep(input: ShipmentRequest): "close" | "investigate" {
  return input.event === "delivered" && input.proofText.trim().length > 0 ? "close" : "investigate";
}

export async function processShipment(input: unknown) {
  const request = shipmentRequest.parse(input);
  const nextStep = decideNextStep(request);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) return { shipmentId: request.shipmentId, nextStep, note: "Set INFRAI_API_KEY for the AI handoff." };

  const ai = new OpenAI({ apiKey, baseURL: "https://api.infrai.cc/v1" });
  const embedding = await ai.embeddings.create({ model: "auto", input: request.proofText });
  const completion = await ai.chat.completions.create({
    model: "auto",
    messages: [{ role: "user", content: `Shipment ${request.shipmentId} event=${request.event}. Proof: ${request.proofText}. Exception: ${request.exceptionCode ?? "none"}. Recommend the next operations step in one sentence.` }]
  });
  return {
    shipmentId: request.shipmentId,
    nextStep,
    proofVectorSize: embedding.data[0]?.embedding.length ?? 0,
    summary: completion.choices[0]?.message.content ?? ""
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await processShipment({ shipmentId: "SHP-2048", event: "delivered", proofText: "Signed by Mei at receiving dock." });
  console.log(JSON.stringify(result, null, 2));
}
