import { withCORS, json, error, setCookie, makeCookie } from "./utils";
import type { Env } from "./types";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

async function parseJSON<T = any>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new Error("Invalid JSON");
  }
}

export default {
  fetch: withCORS(async (req: Request, env: Env) => {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/,"");

    if (path === "/api/status" && req.method === "GET") {
      return json({ ok: true, service: "aioban-api", ts: Date.now() });
    }

    // AUTH: signup
    if (path === "/api/auth/signup" && req.method === "POST") {
      const { email, password, username } = await parseJSON(req);
      if (!email || !password) return error("email and password are required", 422);

      // Supabase signup
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: {
          ...JSON_HEADERS,
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return error(data.error?.message || "Signup failed", res.status);
      }

      // Set cookies if tokens present
      let response = json({ ok: true, user: data.user || null });
      if (data?.access_token && data?.refresh_token) {
        response = setCookie(response, makeCookie("sb-access-token", data.access_token, { sameSite: "Lax", maxAge: 60 * 60 * 24 * 7 }));
        response = setCookie(response, makeCookie("sb-refresh-token", data.refresh_token, { sameSite: "Lax", maxAge: 60 * 60 * 24 * 30 }));
      }

      // Optionally upsert profile using service role
      if (env.USE_SERVICE_ROLE_FOR_PROFILE === "true" && env.SUPABASE_SERVICE_ROLE_KEY && (data?.user?.id || data?.user?.id === 0)) {
        const userId = data.user.id;
        const payload = { id: userId, username: username || null, created_at: new Date().toISOString() };
        await fetch(`${env.SUPABASE_URL}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            ...JSON_HEADERS,
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        }).catch(()=>{});
      }

      return response;
    }

    // AUTH: login
    if (path === "/api/auth/login" && req.method === "POST") {
      const { email, password } = await parseJSON(req);
      if (!email || !password) return error("email and password are required", 422);
      const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          ...JSON_HEADERS,
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return error(data.error_description || data.error?.message || "Login failed", res.status);

      let response = json({ ok: true, user: data.user || null });
      if (data?.access_token && data?.refresh_token) {
        response = setCookie(response, makeCookie("sb-access-token", data.access_token, { sameSite: "Lax", maxAge: 60 * 60 * 24 * 7 }));
        response = setCookie(response, makeCookie("sb-refresh-token", data.refresh_token, { sameSite: "Lax", maxAge: 60 * 60 * 24 * 30 }));
      }
      return response;
    }

    // AUTH: logout
    if (path === "/api/auth/logout" && req.method === "POST") {
      let response = json({ ok: true, message: "logged out" });
      response = setCookie(response, makeCookie("sb-access-token", "", { maxAge: 0 }));
      response = setCookie(response, makeCookie("sb-refresh-token", "", { maxAge: 0 }));
      return response;
    }

    // ME: fetch profile using bearer from cookie (RLS friendly)
    if (path === "/api/me" && req.method === "GET") {
      const token = (req.headers.get("cookie") || "").split(";").map(s=>s.trim()).find(c=>c.startsWith("sb-access-token="))?.split("=",2)[1];
      if (!token) return error("not authenticated", 401);

      // Get user info
      const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${decodeURIComponent(token)}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) return error("invalid token", 401);

      // Fetch profile by user id (public read policy recommended)
      const profRes = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userData.id}`, {
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${decodeURIComponent(token)}` }
      });
      const prof = await profRes.json();
      return json({ ok: true, user: userData, profile: Array.isArray(prof) ? prof[0] : null });
    }

    // PUBLIC: profile by username
    const m = path.match(/^\/api\/profile\/([a-zA-Z0-9_\-\.]+)$/);
    if (m && req.method === "GET") {
      const username = m[1];
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?select=*&username=eq.${encodeURIComponent(username)}`, {
        headers: { ...JSON_HEADERS, apikey: env.SUPABASE_ANON_KEY }
      });
      const rows = await res.json();
      return json({ ok: true, profile: Array.isArray(rows) ? rows[0] : null });
    }

    // ME: update profile (requires auth cookie)
    if (path === "/api/me" && (req.method === "PUT" || req.method === "PATCH")) {
      const token = (req.headers.get("cookie") || "").split(";").map(s=>s.trim()).find(c=>c.startsWith("sb-access-token="))?.split("=",2)[1];
      if (!token) return error("not authenticated", 401);
      const patch = await parseJSON(req);

      // Get user to discover id
      const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${decodeURIComponent(token)}` }
      });
      const userData = await userRes.json();
      if (!userRes.ok) return error("invalid token", 401);

      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?id=eq.${userData.id}`, {
        method: "PATCH",
        headers: {
          ...JSON_HEADERS,
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${decodeURIComponent(token)}`,
          Prefer: "return=representation"
        },
        body: JSON.stringify(patch),
      });
      const body = await res.json();
      if (!res.ok) return error("update failed", res.status);
      return json({ ok: true, profile: Array.isArray(body) ? body[0] : body });
    }

    return new Response("Not found", { status: 404 });
  }, (globalThis as any).ORIGIN || "https://aioban.github.io"),
} satisfies ExportedHandler<Env>;
