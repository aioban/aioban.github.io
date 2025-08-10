export function json(data: any, status = 200, headers: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export function error(message: string, status = 400) {
  return json({ ok: false, error: message }, status);
}

export function cors(req: Request, origin: string) {
  const h = new Headers();
  const reqOrigin = req.headers.get("origin") || "";
  const allow = reqOrigin && reqOrigin === origin ? reqOrigin : origin;
  h.set("access-control-allow-origin", allow);
  h.set("access-control-allow-credentials", "true");
  h.set("access-control-allow-headers", "content-type, authorization");
  h.set("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
  return h;
}

export function withCORS(handler: (req: Request, env: any) => Promise<Response> | Response, origin: string) {
  return async (req: Request, env: any, ctx: any) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors(req, origin) });
    }
    const res = await (handler as any)(req, env, ctx);
    const h = cors(req, origin);
    // Merge headers
    h.forEach((v, k) => res.headers.set(k, v));
    return res;
  };
}

export function setCookie(res: Response, cookie: string) {
  res.headers.append("set-cookie", cookie);
  return res;
}

export function makeCookie(name: string, value: string, opts: { httpOnly?: boolean, secure?: boolean, path?: string, sameSite?: "Lax"|"Strict"|"None", maxAge?: number } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.path) parts.push(`Path=${opts.path}`); else parts.push("Path=/");
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure !== false) parts.push("Secure");
  parts.push(`SameSite=${opts.sameSite || "Lax"}`);
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join("; ");
}
