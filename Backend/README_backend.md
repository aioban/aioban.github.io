# Backend — Cloudflare Workers + Supabase (AIOban)

## Qué resuelve
- Autenticación (`/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`).
- Perfil:
  - `/api/me` (GET: tu perfil; PUT/PATCH: actualizar)
  - `/api/profile/:username` (GET: perfil público por username)
- Healthcheck: `/api/status`

## Requisitos
- Cuenta **Cloudflare** (Workers).
- Proyecto **Supabase** con:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - (opcional) `SUPABASE_SERVICE_ROLE_KEY` para auto-crear perfil al registrarse.

## Setup (rápido)
1. **Subí esta carpeta** a un repo (o agregala a tu repo actual).
2. Conectá el repo en Cloudflare Workers (o instalá wrangler en local).

### Variables/secrets en Cloudflare
- `ORIGIN` = `https://aioban.github.io`
- `SUPABASE_URL` = `https://<tu-proyecto>.supabase.co`
- `SUPABASE_ANON_KEY` = `<anon key>`
- `SUPABASE_SERVICE_ROLE_KEY` = `<service role key>` (opcional)
- `USE_SERVICE_ROLE_FOR_PROFILE` = `true` (opcional; si no, usá un trigger en Supabase para crear perfil)

> En dashboard: **Workers → tu worker → Settings → Variables** (o `wrangler secret put ...`).

### Deploy
- Con GitHub integration (recomendado): cada push a `main` despliega.  
- O local: `npm i` → `npm run deploy` (necesitás `wrangler` login).

## Supabase — tabla `profiles` + RLS (SQL para el editor de Supabase)
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Public read profiles"
on public.profiles for select
using (true);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);
```

## Frontend (simple)
- Llamá al backend desde tu sitio estático (mismo dominio si usás Cloudflare Pages + Functions o un subdominio tipo `api.tudominio.com`).  
- Cookies `sb-access-token` / `sb-refresh-token` se guardan **HttpOnly** (el JS del cliente no las ve; seguridad).

## Endpoints (resumen)
- `GET /api/status` → `{ ok: true }`
- `POST /api/auth/signup` → body `{ email, password, username? }`
- `POST /api/auth/login` → body `{ email, password }`
- `POST /api/auth/logout`
- `GET /api/me` → perfil del usuario autenticado
- `PUT /api/me` → body p.ej. `{ display_name, bio }`
- `GET /api/profile/:username` → perfil público

## Notas
- **CORS**: permitido el origen definido en `ORIGIN`.  
- **Spotify/YouTube**: se integran en el front. Spotify Web Playback requiere OAuth y cuenta Premium del usuario; más adelante te doy los archivos listos.
