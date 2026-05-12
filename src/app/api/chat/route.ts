import { NextRequest, NextResponse } from "next/server";
import { chatWithKimiK26, OpenRouterMessage } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: OpenRouterMessage[] = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 });
    }

    const response = await chatWithKimiK26(messages, {
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
