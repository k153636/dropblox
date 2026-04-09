import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Update a single post by ID
export async function POST(req: NextRequest) {
  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch post
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, url")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch fresh data from Roblox
    const gameData = await fetchGameData(post.url);
    if (!gameData) {
      return NextResponse.json({ error: "Failed to fetch game data" }, { status: 502 });
    }

    // Update post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        preview_name: gameData.name,
        preview_description: gameData.description,
        preview_thumbnail: gameData.thumbnail,
        preview_playing: gameData.playing,
        preview_visits: gameData.visits,
        preview_genre: gameData.genre || "",
        last_fetched_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    if (updateError) {
      console.error("Error updating post:", updateError);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      postId,
      data: gameData,
    });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchGameData(url: string) {
  const match = url.match(/games\/(\d+)/);
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
