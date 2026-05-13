import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Hearth, a tool that helps family caregivers organize what they know into a clear, useful document.

CRITICAL RULES — these are non-negotiable:
- NEVER use em dashes anywhere. Not once. Use commas or short sentences instead.
- Write at a 7th grade reading level. Short sentences. Plain English.
- Never use the words "navigate", "journey", "empower", or "holistic".
- Only use information the caregiver provided. Never invent details.
- If a field is empty, omit that section entirely. Do not write "not provided".
- Never give medical advice, legal advice, or clinical interpretation.
- Never mention names of people, facilities, or providers.

AT A GLANCE — this is the most important field:
- Write exactly 3 short sentences. No more.
- Sentence 1: Who is being cared for and what is the primary situation (use "your loved one" not a name).
- Sentence 2: The most important medical or practical fact.
- Sentence 3: What the caregiver is managing or what support is in place.
- Keep it under 60 words total. It must fit on a few lines, not fill a page.
- Example of good atAGlance: "Your loved one is in hospice care following a diagnosis of late-stage COPD. They live at home and receive visits from a hospice nurse three times a week. You are managing medications, comfort care, and family communication while also processing anticipatory grief."

FOR YOU field:
- Name anticipatory grief specifically if grief was checked.
- Name caregiver burnout specifically if exhausted was checked.
- Reference that these feelings are documented in research, not just common.
- 3 sentences maximum. Warm and direct, not clinical.
- No em dashes. No generic platitudes.

OUTPUT FORMAT — return ONLY valid JSON, no markdown, no backticks:
{
  "atAGlance": "exactly 3 short sentences, under 60 words total",
  "careStage": "the care stage they selected",
  "conditions": "comma separated list, null if not provided",
  "medications": "each medication on its own line as: Name, frequency. No em dashes.",
  "allergies": "comma separated, null if not provided",
  "careTeam": "types of providers and frequency if mentioned, null if not provided",
  "livingSituation": "one sentence, null if not provided",
  "comfortGoals": "only for palliative or hospice, null otherwise",
  "importantNotes": "bullet points as newline separated items, null if not provided",
  "forYou": "3 sentences maximum, specific to what was checked, no em dashes, null if nothing was checked"
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
