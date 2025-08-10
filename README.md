# AIOban — Sitio estático optimizado

## 1) Resumen
Base estática con **seguridad**, **performance** y **accesibilidad** listas para producción.  
**Regla absoluta:** el archivo principal se llama **`index.html`** (nunca cambia el nombre).

---

## 2) Arquitectura / Stack
- **HTML + Tailwind CSS** (compilado a `assets/app.css` por GitHub Actions o manualmente).
- JS modular en `assets/*.js` (sin inline).
- **CSP** estricta (sin `unsafe-inline` en scripts; estilos sin inline cuando usemos `app.css`).
- Web Component opcional: `aioban-widget`.

Estructura esperada:
```
.
├─ index.html
├─ assets/
│  ├─ input.css          # fuente de Tailwind
│  ├─ app.css            # CSS compilado (generado)
│  ├─ main_check.js      # wiring + auto‑QA en consola
│  ├─ aioban-widget.js   # (opcional) widget
│  └─ worker.js          # (opcional) worker del widget
├─ .github/workflows/
│  └─ build-css.yml      # CI para compilar Tailwind (opcional artefacto)
├─ tailwind.config.js
└─ package.json
```

---

## 3) Compilación de Tailwind (vía GitHub Actions)
1. Asegurate de tener estos archivos en el repo (con las rutas exactas):  
   - `assets/input.css`  
   - `tailwind.config.js`  
   - `.github/workflows/build-css.yml`
2. Hacé un commit a `main`. En **Actions** corré “Build Tailwind CSS”.
3. Resultado esperado:
   - **Auto‑commit**: aparece `assets/app.css` en el repo; o
   - **Artefacto**: descargás **app.css** del run y lo subís a `assets/app.css`.

> Si el workflow falla por permisos o falta de lockfile, usá la variante “artefacto” (el YAML más simple con `upload-artifact`).

---

## 4) Patch mínimo de `index.html` (cuando exista `assets/app.css`)
Reemplazar Tailwind CDN por CSS local y endurecer la CSP:
```diff
- <script src="https://cdn.tailwindcss.com"></script>
+ <link rel="stylesheet" href="./assets/app.css">
```
```diff
- style-src 'self' 'unsafe-inline';
+ style-src 'self';
```
Si existe el preconnect a Tailwind CDN, quitarlo:
```diff
- <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
+ <!-- preconnect removido: ya no usamos CDN -->
```

CSP objetivo final (scripts y estilos sin inline):
```
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self' data: https:;
connect-src 'self' https:;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

---

## 5) Cómo correr localmente (liviano)
Con Python (sin instalar nada):
```bash
python3 -m http.server 5173
# abrir http://localhost:5173
```
Con Node (opcional):
```bash
npx serve .
```

---

## 6) Pruebas / QA
- **Consola:** al cargar, `assets/main_check.js` imprime una tabla con:
  `menu`, `dock`, `spotlight`, `projects`, `links`, `year`.
- **Accesibilidad:**
  - `aria-expanded/controls` en el menú, navegación por teclado.
  - Respeta `prefers-reduced-motion` (scroll y animaciones).
- **Performance:**
  - Imágenes con `width/height`, `loading="lazy"`, `decoding="async"`.
  - JS sin inline; CSS compilado y minimizado.
- **Lighthouse (móvil):** Perf ≥ 90, Accesibilidad ≥ 95, Best Practices ≥ 95.
- **CSP:** sin errores en consola (scripts y estilos sin inline tras `app.css`).

---

## 7) Deploy
- **GitHub Pages**: rama `main` o `/docs` (según configuración del repo).
- **Vercel/Netlify**: deploy directo como sitio estático.
- Archivo de entrada: **`index.html`** (regla absoluta).

---

## 8) Siguientes pasos (calidad + eficiencia)
- Carga condicional: importar `aioban-widget` solo si existe `[ANCHOR:WIDGET]`.
- **SRI** para terceros si quedan (`cdnjs`, `jsdelivr`).
- **Imágenes**: AVIF/WEBP + `srcset/sizes` y `fetchpriority` para LCP.
- **CI de calidad**: Lighthouse CI + axe-core con umbrales.
- **SEO**: `sitemap.xml`, `robots.txt`, JSON‑LD (Organization/Person).

---

### Notas
- Mientras uses Tailwind por CDN, **no** se puede quitar `unsafe-inline` en `style-src` (el CDN inyecta `<style>`).  
  Pasate a `assets/app.css` para una CSP “a prueba de balas”.
- Mantené todo el JS/CSS en `assets/` y **evitá inline** para seguridad y caché.
