import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchGameData } from "@/lib/roblox";

// Update a single post by ID (internal use — requires CRON_SECRET)
export async function POST(req: NextRequest) {
  // Auth guard
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, url")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const gameData = await fetchGameData(post.url);
    if (!gameData) {
      // Bump timestamp even on failure to avoid infinite retry
      await supabase
        .from("posts")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", post.id);
      return NextResponse.json({ error: "Failed to fetch game data" }, { status: 502 });
    }

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

    return NextResponse.json({ success: true, postId, data: gameData });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
