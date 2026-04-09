import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchGameData } from "@/lib/roblox";

// Batch update stale posts — called by Vercel Cron
export async function GET(req: NextRequest) {
  // Auth: always require CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Guard: ensure service role key is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Find posts that haven't been updated in the last 24 hours (Hobby: daily cron)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: posts, error: fetchError } = await supabase
      .from("posts")
      .select("id, url, last_fetched_at")
      .or(`last_fetched_at.lt.${oneDayAgo},last_fetched_at.is.null`)
      .order("last_fetched_at", { ascending: true, nullsFirst: true })
      .limit(50);

    if (fetchError) {
      console.error("Error fetching stale posts:", fetchError);
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ updated: 0, message: "No stale posts" });
    }

    // Process sequentially with a small delay to respect Roblox rate limits
    const results: { id: string; status: string; error?: string }[] = [];

    for (const post of posts) {
      try {
        const gameData = await fetchGameData(post.url);

        if (!gameData) {
          // Still bump last_fetched_at to prevent infinite retry on invalid URLs
          await supabase
            .from("posts")
            .update({ last_fetched_at: new Date().toISOString() })
            .eq("id", post.id);
          results.push({ id: post.id, status: "skipped" });
          continue;
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
          console.error(`Error updating post ${post.id}:`, updateError);
          results.push({ id: post.id, status: "error", error: updateError.message });
        } else {
          results.push({ id: post.id, status: "updated" });
        }
      } catch (err) {
        console.error(`Error processing post ${post.id}:`, err);
        results.push({ id: post.id, status: "error", error: String(err) });
      }

      // 200ms delay between requests to avoid Roblox rate limits
      if (posts.indexOf(post) < posts.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({ updated, errors, total: posts.length, results });
  } catch (err) {
    console.error("Batch update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
