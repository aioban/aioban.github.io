tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              brand: { 50:'#f0fdfa',100:'#ccfbf1',200:'#99f6e4',300:'#5eead4',400:'#2dd4bf',500:'#14b8a6',600:'#0d9488',700:'#0f766e',800:'#115e59',900:'#134e4a' },
              accent: { 50:'#fff1f2', 400:'#fca5a5' }
            },
            boxShadow: { soft: '0 6px 24px -6px rgb(0 0 0 / 0.15)' }
          }
        }
      }


// Extra bindings added after migration:
(function(){
  const form = document.getElementById('contactForm');
  if (form && !form.dataset.inited){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      console.log('[contactForm] submit prevented (demo).');
    });
    form.dataset.inited = '1';
  }
  const menuBtn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if (menuBtn && mobileNav){
    // ensure aria-expanded reflects state
    const updateAria = () => menuBtn.setAttribute('aria-expanded', String(!mobileNav.classList.contains('hidden')));
    menuBtn.addEventListener('click', ()=> setTimeout(updateAria, 0), { passive:true });
    updateAria();
  }
})();
