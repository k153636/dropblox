import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  const match = url.match(/games\/(\d+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid Roblox URL" }, { status: 400 });
  }

  const placeId = match[1];

  try {
    const universeRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    if (!universeRes.ok) {
      return NextResponse.json({ screenshots: [] });
    }
    const { universeId } = await universeRes.json();

    // Get game media (screenshots uploaded by developer)
    const mediaRes = await fetch(
      `https://games.roblox.com/v1/games/${universeId}/media`
    );
    const mediaData = await mediaRes.json();
    const imageAssets = (mediaData.data || [])
      .filter((m: { assetTypeId: number }) => m.assetTypeId === 1)
      .map((m: { imageId: number }) => m.imageId);

    if (imageAssets.length === 0) {
      return NextResponse.json({ screenshots: [] });
    }

    // Get thumbnail URLs for the media assets
    const assetIds = imageAssets.join(",");
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&returnPolicy=PlaceHolder&size=768x432&format=Png&isCircular=false`
    );
    const thumbData = await thumbRes.json();
    const screenshots = (thumbData.data || [])
      .map((t: { imageUrl?: string }) => t.imageUrl)
      .filter((u: string | undefined): u is string => !!u);

    return NextResponse.json({ screenshots });
  } catch {
    return NextResponse.json({ screenshots: [] });
  }
}
