import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a compassionate care planning assistant helping family caregivers navigate complex medical situations.

Based on the caregiver's care stage and most pressing concern, generate a clear, actionable 30-day action plan organized into three sections: Week 1 (immediate priorities), Weeks 2-3 (short-term actions), and Week 4 (looking ahead). Each section should have 3-4 specific, concrete action items written in plain language.

RULES:
- Never use em dashes. Use commas or short sentences instead.
- Write at a 7th grade reading level.
- Be warm but direct.
- Never suggest the caregiver needs to do everything alone.
- Make items specific to the care stage and concern provided, not generic.
- Each action item should be one sentence and immediately actionable.
- Never give medical advice or legal advice.
- Never use medical jargon without explaining it.
- If time available or caregiver role is provided, tailor the plan to that context.

Return ONLY valid JSON, no markdown, no backticks:
{
  "week1": ["item 1", "item 2", "item 3", "item 4"],
  "weeks23": ["item 1", "item 2", "item 3", "item 4"],
  "week4": ["item 1", "item 2", "item 3"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { careStage, condition, concern, timeAvailable, hoursPerWeek, isPrimary } = await req.json();

    const lines = [
      `Care stage: ${careStage}`,
      `Most pressing concern: ${concern}`,
    ];
    const timeInfo = timeAvailable || hoursPerWeek;
    if (timeInfo) lines.push(`Time available per week: ${timeInfo}`);
    if (isPrimary !== null && isPrimary !== undefined) lines.push(`Primary caregiver: ${isPrimary ? "Yes" : "No"}`);
    if (condition) lines.push(`Condition (if provided): ${condition}`);
    const userMessage = lines.join("\n");

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
