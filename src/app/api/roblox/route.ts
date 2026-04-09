import { NextRequest, NextResponse } from "next/server";
import { fetchGameData } from "@/lib/roblox";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  if (!url.includes("roblox.com") || !url.match(/games\/\d+/)) {
    return NextResponse.json({ error: "Invalid Roblox URL" }, { status: 400 });
  }

  try {
    const gameData = await fetchGameData(url);
    if (!gameData) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    return NextResponse.json(gameData);
  } catch {
    return NextResponse.json({ error: "API request failed" }, { status: 502 });
  }
}
