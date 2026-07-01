import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a compassionate care planning assistant helping family caregivers.

Generate a clear, actionable 30-day action plan in three sections: Week 1 (immediate priorities), Weeks 2-3 (short-term actions), and Week 4 (looking ahead). Each section should have 3-4 specific, concrete action items.

RULES:
- Never use em dashes. Use commas or short sentences instead.
- Write at a 7th grade reading level.
- Be warm but direct.
- Never suggest the caregiver needs to do everything alone.
- Each action item must be one sentence and immediately actionable.
- Never give medical advice or legal advice.
- Never use medical jargon without explaining it.

PERSONALIZATION — this is the most important rule:
- Every action item must feel like it was written for the specific combination of care stage, concern, and condition provided. Not generic caregiving advice.
- If the care stage is Hospice and concern is Emotional support: write about emotional care in an end-of-life context specifically. Not general self-care tips.
- If conditions are provided, reference them by name where relevant. "Ask about pain management for Parkinson's" not "Ask about pain management."
- If the caregiver is managing alone (caregiverRole indicates solo), keep items achievable for one person. Fewer moving parts per item.
- If the caregiver is coordinating from a distance, focus on remote actions: video calls, shared documents, delegating to in-person contacts.
- If there are multiple people sharing care (caregiverRole indicates shared), include items about delegation, communication, and division of tasks.
- The plan should feel like a personalized roadmap, not a checklist anyone could have downloaded.

Return ONLY valid JSON, no markdown, no backticks:
{
  "week1": ["item 1", "item 2", "item 3", "item 4"],
  "weeks23": ["item 1", "item 2", "item 3", "item 4"],
  "week4": ["item 1", "item 2", "item 3"]
}`;

export async function POST(req: NextRequest) {
  try {
    const {
      careStage,
      condition,
      concern,
      timeAvailable,
      hoursPerWeek,
      isPrimary,
      caregiverRole,
    } = await req.json();

    const lines = [
      `Care stage: ${careStage}`,
      `Primary concern: ${concern}`,
    ];
    if (condition) lines.push(`Medical conditions: ${condition}`);
    if (caregiverRole) lines.push(`Caregiving situation: ${caregiverRole}`);
    const timeInfo = timeAvailable || hoursPerWeek;
    if (timeInfo) lines.push(`Time available per week: ${timeInfo}`);
    if (isPrimary !== null && isPrimary !== undefined) {
      lines.push(`Primary caregiver: ${isPrimary ? "Yes" : "No"}`);
    }

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
