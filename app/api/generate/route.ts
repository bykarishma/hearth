import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Hearth, a tool that helps family caregivers organize and articulate their caregiving situation clearly.

Your job is to take the caregiver's answers and produce a clean, plain-English Caregiver Brief.

RULES:
- Write at a 7th grade reading level. Short sentences. No jargon.
- Only use information the caregiver provided. Never add clinical interpretation or medical advice.
- Never mention names of patients, providers, or facilities — the caregiver has been instructed not to provide them.
- Never give legal advice or interpret legal documents.
- Never suggest diagnoses or treatment changes.
- Always be warm but factual in tone.
- If a field is empty or skipped, omit that section from the brief rather than noting it as missing.

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "atAGlance": "2-3 sentence plain-English summary of the situation",
  "conditions": "string or null",
  "allergies": "string or null",
  "medications": "string or null",
  "careTeam": "string or null",
  "livingSituation": "string or null",
  "careStage": "string",
  "comfortGoals": "string or null",
  "importantNotes": "string or null",
  "forYou": "2-3 warm sentences acknowledging what the caregiver shared about how they are doing. Grounded in the fact that anticipatory grief is real, caregiver exhaustion is real, and they are not alone."
}

Return ONLY the JSON object. No preamble, no markdown backticks, no explanation.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stage, situation, medical, caregiverWellbeing } = body;

    const userMessage = `
Care stage: ${stage}

The situation: ${situation || "Not provided"}

Medical overview: ${medical || "Not provided"}

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

    const parsed = JSON.parse(content.text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
