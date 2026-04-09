import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Batch update stale posts (older than 1 minute)
export async function GET(req: NextRequest) {
  // Verify cron secret if provided
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow Vercel Cron headers
    const vercelSignature = req.headers.get("x-vercel-signature");
    if (!vercelSignature) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find posts that haven't been updated in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id, url, last_fetched_at")
      .or(`last_fetched_at.lt.${oneMinuteAgo},last_fetched_at.is.null`)
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .limit(10); // Process max 10 per batch to avoid rate limits

    if (fetchError) {
      console.error("Error fetching stale posts:", fetchError);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ updated: 0, message: "No stale posts to update" });
    }

    // Update each post
    const results = await Promise.allSettled(
      posts.map(async (post) => {
        try {
          const gameData = await fetchGameData(post.url);
          if (!gameData) return { id: post.id, status: "skipped", reason: "No data" };

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
            console.error(`Error updating post ${post.id}:`, updateError);
            return { id: post.id, status: "error", error: updateError.message };
          }

          return { id: post.id, status: "updated" };
        } catch (err) {
          console.error(`Error processing post ${post.id}:`, err);
          return { id: post.id, status: "error", error: String(err) };
        }
      })
    );

    const updated = results.filter((r) => r.status === "fulfilled" && (r.value as { status: string }).status === "updated").length;
    const errors = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && (r.value as { status: string }).status === "error")).length;

    return NextResponse.json({
      updated,
      errors,
      total: posts.length,
      results: results.map((r) => (r.status === "fulfilled" ? r.value : { status: "error", error: r.reason })),
    });
  } catch (err) {
    console.error("Batch update error:", err);
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
