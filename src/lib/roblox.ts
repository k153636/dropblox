// Shared Roblox API helper — single source of truth for fetching game data

export interface RobloxGameData {
  name: string;
  description: string;
  thumbnail: string;
  playing: number;
  visits: number;
  genre: string;
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

    return {
      name: game.name,
      description: (game.description || "").slice(0, 200),
      thumbnail: thumb?.imageUrl || "",
      playing: game.playing || 0,
      visits: game.visits || 0,
      genre: game.genre || "",
    };
  } catch {
    return null;
  }
}
