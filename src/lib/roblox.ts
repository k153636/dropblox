// Shared Roblox API helper — single source of truth for fetching game data

export interface RobloxGameData {
  name: string;
  description: string;
  thumbnail: string;
  playing: number;
  visits: number;
  genre: string;
}

export async function fetchGameScreenshots(robloxUrl: string): Promise<string[]> {
  const match = robloxUrl.match(/games\/(\d+)/);
  if (!match) return [];

  const placeId = match[1];

  try {
    const universeRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    if (!universeRes.ok) return [];
    const { universeId } = await universeRes.json();

    // Get game media (screenshots/videos uploaded by developer)
    const mediaRes = await fetch(
      `https://games.roblox.com/v1/games/${universeId}/media`
    );
    const mediaData = await mediaRes.json();
    const imageAssets = (mediaData.data || [])
      .filter((m: { assetTypeId: number }) => m.assetTypeId === 1)
      .map((m: { imageId: number }) => m.imageId);

    if (imageAssets.length === 0) return [];

    // Get thumbnail URLs for the media assets
    const assetIds = imageAssets.join(",");
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${assetIds}&returnPolicy=PlaceHolder&size=768x432&format=Png&isCircular=false`
    );
    const thumbData = await thumbRes.json();
    return (thumbData.data || [])
      .map((t: { imageUrl?: string }) => t.imageUrl)
      .filter((url: string | undefined): url is string => !!url);
  } catch {
    return [];
  }
}

export async function fetchGameData(robloxUrl: string): Promise<RobloxGameData | null> {
  const match = robloxUrl.match(/games\/(\d+)/);
  if (!match) return null;

  const placeId = match[1];

  try {
    // Get universe ID
    const universeRes = await fetch(
      `https://apis.roblox.com/universes/v1/places/${placeId}/universe`
    );
    if (!universeRes.ok) return null;
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

    if (!game) return null;

    const genre = game.genre || "";

    return {
      name: game.name,
      description: (game.description || "").slice(0, 1000),
      thumbnail: thumb?.imageUrl || "",
      playing: game.playing || 0,
      visits: game.visits || 0,
      genre: genre,
    };
  } catch {
    return null;
  }
}
