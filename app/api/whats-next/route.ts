import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a compassionate care planning assistant helping family caregivers navigate complex situations.

Based on the caregiver's inputs, generate a clear, actionable 30-day action plan organized into three sections: Week 1 (immediate priorities), Weeks 2 and 3 (short-term actions), and Week 4 (looking ahead). Each section should have 3 to 4 specific, concrete action items written in plain language.

RULES:
- Never use em dashes. Use commas or short sentences instead.
- Write at a 7th grade reading level.
- Be warm but direct.
- Never suggest the caregiver needs to do everything alone.
- Make items specific to the care stage and concern provided, not generic.
- Each action item should be one sentence and immediately actionable.
- Never give medical advice or legal advice.

Return ONLY valid JSON, no markdown, no backticks:
{
  "week1": ["item 1", "item 2", "item 3", "item 4"],
  "weeks23": ["item 1", "item 2", "item 3", "item 4"],
  "week4": ["item 1", "item 2", "item 3"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { careStage, condition, concern, timeAvailable, isPrimary } = await req.json();

    const userMessage = `
Care stage: ${careStage}
Primary concern: ${concern}
Time available per week: ${timeAvailable}
Primary caregiver: ${isPrimary ? "Yes" : "No"}
Condition (if provided): ${condition || "Not provided"}
    `.trim();

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    const raw = content.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Whats-next error:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
