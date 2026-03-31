import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Hearth, a tool that helps family caregivers organize what they know into a clear, useful document.

Your job is to produce a Caregiver Brief that is specific, substantive, and immediately useful. Not generic. Not vague. Every sentence should give a reader something they could not have assumed without reading it.

STRICT RULES:
- Write at a 7th grade reading level. Short sentences. Plain English.
- Never use em dashes. Use commas or periods instead.
- Never use the words "navigate", "journey", "empower", or "holistic".
- Only use information the caregiver provided. Never invent details.
- If a field is empty, omit that section entirely. Do not say "not provided".
- Never give medical advice, legal advice, or clinical interpretation.
- Never mention names of people, facilities, or providers.
- The atAGlance should be 3 to 4 specific sentences that give a complete picture of the situation. It should feel like something a home aide would read before their first shift.
- The forYou field should directly acknowledge what the caregiver checked in the wellbeing section. Be warm, specific, and grounded. Reference anticipatory grief by name if grief was checked. Reference caregiver burnout research if exhausted was checked. Never be generic.

OUTPUT FORMAT — return ONLY this JSON object with no markdown, no backticks, no preamble:
{
  "atAGlance": "3-4 specific sentences summarizing the full situation",
  "careStage": "the care stage they selected",
  "conditions": "comma-separated list or short description, null if not provided",
  "medications": "each medication on its own line with dosing info, null if not provided",
  "allergies": "list of known allergies, null if not provided",
  "careTeam": "types of providers involved and how often if mentioned, null if not provided",
  "livingSituation": "where they live and any relevant context, null if not provided",
  "comfortGoals": "only for palliative or hospice stage, null otherwise",
  "importantNotes": "recent changes, things a new helper must know, anything urgent, null if not provided",
  "forYou": "3-4 warm specific sentences acknowledging exactly what the caregiver shared about how they are doing. Ground this in real research. Name anticipatory grief if relevant. Name caregiver burnout if relevant. Be specific to what they checked, not generic."
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, situation, situationMore, medical, medications, allergies, recentChanges, caregiverWellbeing } = body;

    const userMessage = `
Care stage: ${stage}
Main situation: ${situation || "Not provided"}
Additional context: ${situationMore || "Not provided"}
Conditions and diagnoses: ${medical || "Not provided"}
Medications: ${medications || "Not provided"}
Known allergies: ${allergies || "Not provided"}
Recent changes: ${recentChanges || "Not provided"}
How the caregiver is doing: ${caregiverWellbeing || "Not provided"}
`.trim();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const raw = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);
    const response = NextResponse.json(parsed);
    response.headers.set("Content-Disposition", 'inline; filename="caregiver_brief.pdf"');
    return response;
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
