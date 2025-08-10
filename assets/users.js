// users.js — UI mínima para crear usuario / login y mostrar perfil (sin inline)
(() => {
  const ENDPOINT = (window.API_BASE || "").replace(/\/+$/,""); // opcional, si usás subdominio
  const api = (p, opts={}) => fetch((ENDPOINT||"") + p, { credentials: "include", ...opts });

  function addNavButtons() {
    const nav = document.querySelector("header nav, header .nav, header [aria-label='Primary']") || document.querySelector("header");
    if (!nav) return;

    const wrap = document.createElement("div");
    wrap.className = "flex items-center gap-2";
    const btnSignup = document.createElement("button");
    btnSignup.className = "text-sm px-2 py-1 rounded border";
    btnSignup.textContent = "Crear usuario";
    btnSignup.addEventListener("click", async () => {
      const email = prompt("Email:");
      if (!email) return;
      const password = prompt("Contraseña (mín. 6):");
      if (!password) return;
      const username = prompt("Usuario público (opcional):") || undefined;
      const res = await api("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, username })
      });
      const data = await res.json().catch(()=>({}));
      alert(res.ok ? "Cuenta creada. Revisa tu email (confirmación)." : ("Error: " + (data.error||res.status)));
    });

    const btnLogin = document.createElement("button");
    btnLogin.className = "text-sm px-2 py-1 rounded border";
    btnLogin.textContent = "Entrar";
    btnLogin.addEventListener("click", async () => {
      const email = prompt("Email:");
      if (!email) return;
      const password = prompt("Contraseña:");
      if (!password) return;
      const res = await api("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(()=>({}));
      alert(res.ok ? "Sesión iniciada" : ("Error: " + (data.error||res.status)));
    });

    const btnMe = document.createElement("button");
    btnMe.className = "text-sm px-2 py-1 rounded border";
    btnMe.textContent = "Mi perfil";
    btnMe.addEventListener("click", async () => {
      const res = await api("/api/me");
      const data = await res.json().catch(()=>({}));
      if (!res.ok) { alert("No logueado."); return; }
      alert("Perfil:\n" + JSON.stringify(data.profile || data.user, null, 2));
    });

    wrap.append(btnSignup, btnLogin, btnMe);
    nav.appendChild(wrap);
  }

  addNavButtons();
})();