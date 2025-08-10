// main_check.js — wiring accesible e idempotente
(() => {
  if (window.__aiobanChecked) return; window.__aiobanChecked = true;
  const prefersReduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $id = (id) => document.getElementById(id);
  const report = []; const log=(n,o,i='')=>report.push({n,o,i});

  // Menu móvil
  ;(() => {
    const btn=$id('menuBtn'), nav=$id('mobileNav');
    if (!btn||!nav) return log('menu',false,'faltan #menuBtn/#mobileNav');
    btn.setAttribute('aria-controls','mobileNav');
    if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', String(!nav.classList.contains('hidden')));
    if (!btn.dataset.inited){
      btn.addEventListener('click',()=>{
        const hidden = nav.classList.toggle('hidden');
        btn.setAttribute('aria-expanded', String(!hidden));
      }, { passive:true });
      btn.dataset.inited='1';
    }
    log('menu',true,'ok');
  })();

  // Dock → scroll a #projects
  ;(() => {
    const btn=$id('dockBtn'), dock=$id('dock'), dockNav=$id('dockNav'), target=$id('projects');
    if (!btn||!dock||!dockNav||!target) return log('dock',false,'faltan ids');
    if (!btn.dataset.inited){
      btn.addEventListener('click',()=>{
        dock.classList.add('pointer-events-none'); dockNav.classList.add('puff-out');
        target.scrollIntoView({ behavior: prefersReduce()?'auto':'smooth', block:'start' });
        setTimeout(()=>{ dock.classList.remove('pointer-events-none'); dockNav.classList.remove('puff-out');},600);
      }, { passive:true });
      btn.dataset.inited='1';
    }
    log('dock',true,'ok');
  })();

  // Spotlight (si existe)
  ;(() => {
    const el=$id('spotlight');
    if (!el) return log('spotlight',false,'no existe');
    if (prefersReduce() || !matchMedia('(pointer:fine)').matches) return log('spotlight',true,'desactivado');
    if (!el.dataset.inited){
      let rafId=0;
      addEventListener('pointermove',(e)=>{
        if (rafId) return;
        rafId=requestAnimationFrame(()=>{
          const r=document.body.getBoundingClientRect();
          el.style.setProperty('--mx', ((e.clientX-r.left)/r.width*100)+'%');
          el.style.setProperty('--my', ((e.clientY-r.top)/r.height*100)+'%');
          rafId=0;
        });
      }, { passive:true });
      el.dataset.inited='1';
    }
    log('spotlight',true,'ok');
  })();

  // Proyectos placeholders
  ;(() => {
    const wrap=$id('projects'); if(!wrap) return log('projects',false,'no existe');
    let disabled=0;
    wrap.querySelectorAll('a').forEach(a=>{
      const href=(a.getAttribute('href')||'').trim();
      if (!href || href==='#' || href==='javascript:void(0)'){
        a.setAttribute('aria-disabled','true'); a.setAttribute('tabindex','-1');
        a.classList.add('pointer-events-none','opacity-60','select-none');
        a.addEventListener('click',(e)=>e.preventDefault());
        disabled++;
      } else {
        a.setAttribute('rel','noopener noreferrer'); a.setAttribute('target','_blank');
      }
    });
    log('projects',true, disabled ? `placeholders=${disabled}` : 'todos con destino');
  })();

  // Footer: año
  ;(() => {
    const y=$id('year'); if (y) y.textContent = new Date().getFullYear();
    log('year', !!$id('year'), 'ok');
  })();

  setTimeout(()=>{ try{ console.table(report); }catch{ console.log(report);} },0);
})();
// Contact form handler (replaces inline onsubmit)
;(() => {
  const f = document.getElementById('contactForm');
  if (!f || f.dataset.inited) return;
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('[contactForm] submit prevented (placeholder).');
    // TODO: integrate with backend or mailto as needed.
  });
  f.dataset.inited = '1';
})();
