import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Support /ja/games/, /games/, etc.
  const match = url.match(/games\/(\d+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid Roblox URL" }, { status: 400 });
  }

  const placeId = match[1];

  try {
    // Get universe ID
    const universeRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    if (!universeRes.ok) {
      return NextResponse.json({ error: "Failed to fetch universe" }, { status: 502 });
    }
    const { universeId } = await universeRes.json();

    // Get game details + thumbnail in parallel
    const [detailRes, thumbRes] = await Promise.all([
      fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
      fetch(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`
      ),
    ]);

    const detailData = await detailRes.json();
    const thumbData = await thumbRes.json();

    const game = detailData.data?.[0];
    const thumb = thumbData.data?.[0];

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: game.name,
      description: (game.description || "").slice(0, 200),
      thumbnail: thumb?.imageUrl || "",
      playing: game.playing || 0,
      visits: game.visits || 0,
    });
  } catch {
    return NextResponse.json({ error: "API request failed" }, { status: 502 });
  }
}
