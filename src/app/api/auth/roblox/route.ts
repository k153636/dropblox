import { createHash } from "crypto";
import { createClient, type Session } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface RobloxTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface RobloxUserInfo {
  sub?: string;
  name?: string;
  nickname?: string;
  preferred_username?: string;
  picture?: string;
}

interface ProfileRecord {
  id: string;
  github_id: string | null;
  roblox_id: string | null;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
}

interface RobloxAuthSuccess {
  success: true;
  user: {
    id: string;
    github_id: string | null;
    roblox_id: string | null;
    provider: "roblox";
    username: string;
    avatarUrl: string | null;
    bio: string;
    createdAt: string | null;
  };
  session: Session;
  session_token: string;
  tokens: {
    access_token: string;
    refresh_token: string | null;
    expires_in: number;
  };
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function parseJsonError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error_description?: string; error?: string };
    return data.error_description || data.error || response.statusText;
  } catch {
    return response.statusText;
  }
}

function getRedirectUri(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const requestOrigin =
    forwardedProto && forwardedHost ? `${forwardedProto}://${forwardedHost}` : request.nextUrl.origin;
  const origin = requestOrigin || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return `${origin}/auth/callback/roblox`;
}

function getRobloxPassword(robloxId: string, clientSecret: string): string {
  return createHash("sha256").update(`${clientSecret}:${robloxId}`).digest("hex");
}

function getRobloxEmail(robloxId: string): string {
  return `roblox-${robloxId}@dropblox.local`;
}

function getRobloxAvatarUrl(robloxId: string, picture?: string): string {
  return picture || `https://www.roblox.com/headshot-thumbnail/image?userId=${robloxId}&width=150&height=150&format=png`;
}

function toAuthResponse(profile: ProfileRecord, session: Session, token: RobloxTokenResponse): RobloxAuthSuccess {
  return {
    success: true,
    user: {
      id: profile.id,
      github_id: profile.github_id,
      roblox_id: profile.roblox_id,
      provider: "roblox",
      username: profile.username,
      avatarUrl: profile.avatar_url,
      bio: profile.bio || "",
      createdAt: profile.created_at || null,
    },
    session,
    session_token: session.access_token,
    tokens: {
      access_token: token.access_token,
      refresh_token: token.refresh_token || null,
      expires_in: token.expires_in,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim();

    if (!code) {
      return jsonError("Authorization code is required", 400);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const clientId = process.env.NEXT_PUBLIC_ROBLOX_CLIENT_ID;
    const clientSecret = process.env.ROBLOX_CLIENT_SECRET;

    const missingConfig = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !supabaseAnonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
      !clientId && "NEXT_PUBLIC_ROBLOX_CLIENT_ID",
      !clientSecret && "ROBLOX_CLIENT_SECRET",
    ].filter((value): value is string => Boolean(value));

    if (missingConfig.length > 0) {
      return jsonError(`Roblox auth is missing: ${missingConfig.join(", ")}`, 500);
    }

    const config = {
      supabaseUrl,
      supabaseAnonKey,
      serviceRoleKey,
      clientId,
      clientSecret,
    } as {
      supabaseUrl: string;
      supabaseAnonKey: string;
      serviceRoleKey: string;
      clientId: string;
      clientSecret: string;
    };

    const redirectUri = getRedirectUri(request);
    const tokenResponse = await fetch("https://apis.roblox.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return jsonError(await parseJsonError(tokenResponse), 400);
    }

    const tokenData = (await tokenResponse.json()) as RobloxTokenResponse;
    const userInfoResponse = await fetch("https://apis.roblox.com/oauth/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      return jsonError(await parseJsonError(userInfoResponse), 400);
    }

    const userInfo = (await userInfoResponse.json()) as RobloxUserInfo;
    const robloxId = userInfo.sub;
    if (!robloxId) {
      return jsonError("Roblox did not return a user id", 400);
    }

    const username = userInfo.nickname || userInfo.preferred_username || userInfo.name || "RobloxUser";
    const avatarUrl = getRobloxAvatarUrl(robloxId, userInfo.picture);
    const email = getRobloxEmail(robloxId);
    const password = getRobloxPassword(robloxId, config.clientSecret);
    const admin = createClient(config.supabaseUrl, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const authClient = createClient(config.supabaseUrl, config.supabaseAnonKey);

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, github_id, roblox_id, username, avatar_url, bio, created_at")
      .eq("roblox_id", robloxId)
      .maybeSingle<ProfileRecord>();

    if (existingProfile) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(existingProfile.id, {
        password,
        user_metadata: {
          provider: "roblox",
          provider_id: robloxId,
          sub: robloxId,
          name: username,
          avatar_url: avatarUrl,
          picture: avatarUrl,
        },
      });

      if (updateAuthError) {
        return jsonError(updateAuthError.message, 500);
      }
    } else {
      const { error: createUserError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          provider: "roblox",
          provider_id: robloxId,
          sub: robloxId,
          name: username,
          avatar_url: avatarUrl,
          picture: avatarUrl,
        },
      });

      if (createUserError && !createUserError.message.toLowerCase().includes("already")) {
        return jsonError(createUserError.message, 500);
      }
    }

    const {
      data: { session },
      error: signInError,
    } = await authClient.auth.signInWithPassword({ email, password });

    if (signInError || !session) {
      return jsonError(signInError?.message || "Failed to create Supabase session", 500);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: session.user.id,
          github_id: null,
          roblox_id: robloxId,
          username,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      )
      .select("id, github_id, roblox_id, username, avatar_url, bio, created_at")
      .single<ProfileRecord>();

    if (profileError) {
      return jsonError(profileError.message, 500);
    }

    return NextResponse.json(toAuthResponse(profile, session, tokenData));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonError(message, 500);
  }
}
