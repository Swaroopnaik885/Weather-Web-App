/* motion.js (GSAP Helper + Skiper-UI)
   Helper wrapper for GSAP animations — initializes site-wide animations,
   hover effects, and a subtle parallax background. Includes Skiper-UI integration.
*/
(function(){
  function whenGsapReady(cb){
    if(window.gsap) return cb();
    const t = setInterval(()=>{ if(window.gsap){ clearInterval(t); cb(); } },50);
    setTimeout(()=> clearInterval(t), 5000);
  }

  whenGsapReady(()=>{
    if(!window.gsap) return;
    // Utility: animate every visible element inside a root, with safe limits
    function animateAllElements(rootSelector = '#app', opts = {}){
      try{
        if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const root = document.querySelector(rootSelector);
        if(!root) return;

        // selectors that we already animate individually — exclude to avoid duplicate motion
        const excludeSelectors = ['.metric-card', '.forecast-card', '.week-card', '.hero-content', '.logo h1', '.search-wrapper', '#weatherIcon', '.weather-background'];

        const all = Array.from(root.querySelectorAll('*')).filter(el=>{
          if(!(el instanceof Element)) return false;
          if(el.offsetParent === null) return false; // hidden
          // skip very small/utility elements
          const tag = el.tagName.toLowerCase();
          if(tag === 'script' || tag === 'style' || tag === 'link') return false;
          // exclude if element or ancestor matches excluded selectors
          for(const s of excludeSelectors){ if(el.closest(s)) return false; }
          return true;
        });

        const max = opts.max || 250;
        const list = all.slice(0, max);
        if(list.length === 0) return;

        gsap.from(list, {
          y: (i)=> (i % 2 === 0 ? 10 : 6),
          x: (i)=> (i % 3 === 0 ? 6 : 0),
          scale: 0.985,
          duration: opts.duration || 0.42,
          stagger: opts.stagger || 0.02,
          ease: 'power2.out'
        });
      }catch(e){ console.warn('animateAllElements error', e); }
    }

    window.motionHelpers = {
      animateOnRender(){
        try{
          // Logo animation (no opacity)
          gsap.from('.logo h1', { x: -40, duration: 0.8, ease: 'power2.out' });

          // Search wrapper animation (no opacity)
          gsap.from('.search-wrapper', { scale: 0.98, y: 6, duration: 0.6, delay: 0.08, ease: 'power2.out' });

          // Hero content animations (no opacity)
          gsap.from('.hero-content > *', { y: 30, scale: 0.995, duration: 0.7, delay: 0.12, stagger: 0.08, ease: 'power2.out' });

          // Metric cards with rotation
          const metricCards = document.querySelectorAll('.metric-card');
          metricCards.forEach((el, i) => {
            gsap.from(el, {
              y: 20,
              scale: 0.985,
              rotation: i % 2 ? 6 : -6,
              duration: 0.55,
              delay: 0.18 + i * 0.06,
              ease: 'power2.out'
            });
          });

          // Forecast cards animation (no opacity)
          if (document.querySelector('.forecast-card')) {
            gsap.from('.forecast-card', { scale: 0.94, y: 10, duration: 0.5, delay: 0.28, stagger: 0.06, ease: 'power2.out' });
          }

          // Weekly forecast animation (no opacity)
          if (document.querySelector('.week-card')) {
            gsap.from('.week-card', { y: 22, scale: 0.992, duration: 0.55, delay: 0.42, stagger: 0.08, ease: 'power2.out' });
          }

          // Pulsing weather icon
          const icon = document.getElementById('weatherIcon');
          if(icon){
            gsap.to(icon, { scale: 1.06, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
          }

          // Animate remaining elements safely after the targeted animations
          setTimeout(()=> animateAllElements('#app', { max: 300, duration: 0.42, stagger: 0.02 }), 450);
        }catch(e){ console.warn('motionHelpers.animateOnRender error', e); }
      },

      // Show a short-lived weather effect on screen depending on condition
      showWeatherEffect(condition = '', opts = {}){
        try{
          if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          const dur = opts.duration || 4500;
          const root = document.getElementById('app') || document.body;

          const container = document.createElement('div');
          container.id = 'weatherEffect';
          container.style.position = 'absolute';
          container.style.inset = '0';
          container.style.pointerEvents = 'none';
          container.style.overflow = 'hidden';
          container.style.zIndex = 9999;
          root.appendChild(container);

          const c = condition.toLowerCase();

          function cleanup(){
            try{ gsap.to(container, { opacity: 0, duration: 0.35, onComplete: ()=> container.remove() }); }catch(e){ try{ container.remove(); }catch(_){} }
          }

          // Sunny / clear: radial sun burst
          if(c.includes('clear') || c.includes('sun')){
            const sun = document.createElement('div');
            sun.style.position = 'absolute';
            sun.style.left = '50%'; sun.style.top = '18%';
            sun.style.transform = 'translateX(-50%)';
            sun.style.width = '140px'; sun.style.height = '140px';
            sun.style.borderRadius = '50%';
            sun.style.background = 'radial-gradient(circle at 30% 30%, rgba(255,230,140,0.95), rgba(255,200,60,0.9))';
            sun.style.filter = 'blur(6px)';
            container.appendChild(sun);

            gsap.fromTo(sun, { scale: 0.8, opacity: 0.9 }, { scale: 1.06, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            gsap.to(sun, { rotation: 8, duration: 12, repeat: -1, ease: 'none' });
            setTimeout(cleanup, dur);
            return;
          }

          // Rain: create drops that fall
          if(c.includes('rain') || c.includes('drizzle')){
            const count = Math.min(60, Math.floor((window.innerWidth/80)));
            for(let i=0;i<count;i++){
              const d = document.createElement('div');
              d.className = 'r-drop';
              const left = Math.random()*100;
              d.style.position = 'absolute'; d.style.left = left + '%';
              d.style.top = (Math.random()*-40) + '%';
              d.style.width = '2px'; d.style.height = (8+Math.random()*12) + 'px';
              d.style.background = 'linear-gradient(180deg, rgba(200,220,255,0.9), rgba(120,160,255,0.6))';
              d.style.opacity = '0.9'; d.style.borderRadius = '2px';
              container.appendChild(d);
              const fall = 0.9 + Math.random()*1.2;
              gsap.to(d, { y: window.innerHeight + 120, duration: 1.2*fall, ease: 'power1.in', delay: Math.random()*0.6, repeat: -1 });
            }
            setTimeout(()=> cleanup(), dur);
            return;
          }

          // Snow: soft slow flakes
          if(c.includes('snow')){
            const count = Math.min(80, Math.floor((window.innerWidth/60)));
            for(let i=0;i<count;i++){
              const f = document.createElement('div');
              f.className = 's-flake';
              const left = Math.random()*100;
              f.style.position = 'absolute'; f.style.left = left + '%';
              f.style.top = (Math.random()*-30) + '%';
              const size = 4 + Math.random()*8;
              f.style.width = size + 'px'; f.style.height = size + 'px';
              f.style.background = 'white'; f.style.borderRadius = '50%'; f.style.opacity = 0.9; f.style.filter = 'blur(0.6px)';
              container.appendChild(f);
              gsap.to(f, { y: window.innerHeight + 120, x: '+= ' + (Math.random()*80-40), duration: 6 + Math.random()*4, ease: 'none', delay: Math.random()*1, repeat: -1 });
            }
            setTimeout(()=> cleanup(), dur);
            return;
          }

          // Storm: flashes + quick diagonal bolts
          if(c.includes('storm') || c.includes('thunder') || c.includes('lightning')){
            const flash = document.createElement('div');
            flash.style.position = 'absolute'; flash.style.inset = '0'; flash.style.background = 'white'; flash.style.opacity = '0'; container.appendChild(flash);
            const tl = gsap.timeline({ repeat: Math.max(1, Math.floor(dur/800)) });
            tl.to(flash, { opacity: 0.6, duration: 0.06 }).to(flash, { opacity: 0, duration: 0.25, delay: 0.12 }).pause(0);
            // trigger a few quick flashes at random times
            const flashes = Math.max(2, Math.floor(dur/900));
            for(let i=0;i<flashes;i++){ tl.call(()=> tl.play(), null, '+= ' + (Math.random()*0.8 + i*0.3)); }
            setTimeout(()=> cleanup(), dur);
            return;
          }

          // Fog / mist: soft blurred layers moving
          if(c.includes('fog') || c.includes('mist') || c.includes('haze')){
            for(let i=0;i<3;i++){
              const layer = document.createElement('div');
              layer.style.position = 'absolute'; layer.style.left = '-10%'; layer.style.top = (10 + i*22) + '%';
              layer.style.width = '120%'; layer.style.height = '28%'; layer.style.background = 'rgba(220,220,230,0.08)';
              layer.style.filter = 'blur(18px)'; layer.style.opacity = 0.85; container.appendChild(layer);
              gsap.to(layer, { x: '+=40%', duration: 8 + i*2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            }
            setTimeout(()=> cleanup(), dur);
            return;
          }

          // Default: subtle pop/shift in center
          const e = document.createElement('div');
          e.style.position = 'absolute'; e.style.left = '50%'; e.style.top = '12%'; e.style.transform = 'translateX(-50%)';
          e.style.padding = '10px 18px'; e.style.background = 'rgba(255,255,255,0.04)'; e.style.borderRadius = '14px';
          e.style.backdropFilter = 'blur(6px)';
          e.textContent = condition || '';
          e.style.color = 'white'; e.style.fontSize = '14px'; container.appendChild(e);
          gsap.fromTo(e, { scale: 0.96 }, { scale: 1.03, duration: 0.5, yoyo: true, repeat: Math.max(1, Math.floor(dur/900)), ease: 'sine.inOut' });
          setTimeout(()=> cleanup(), dur);
        }catch(err){ console.warn('showWeatherEffect error', err); }
      },

      setupHoverAndParallax(){
        try{
          // Hover / focus effects on interactive elements and keyboard activation
          // exclude .forecast-card so CSS hover handles the large scale effect
          const interactiveSel = '.icon-btn, .week-card, .metric-card, .search-wrapper input';
          document.querySelectorAll(interactiveSel).forEach(el=>{
            // ensure inputs keep native behavior
            const tag = el.tagName.toLowerCase();

            // Make non-focusable elements keyboard-focusable for interactivity
            const naturallyFocusable = (e)=>{
              const t = e.tagName.toLowerCase();
              if(t === 'a' || t === 'button' || t === 'input' || t === 'select' || t === 'textarea') return true;
              if(e.hasAttribute('tabindex') && e.getAttribute('tabindex') !== '-1') return true;
              if(e.hasAttribute('role') && e.getAttribute('role') === 'button') return true;
              return false;
            };

            if(!naturallyFocusable(el) && tag !== 'input' && tag !== 'textarea'){
              try{ el.tabIndex = 0; }catch(e){}
            }

            if(tag !== 'input' && tag !== 'textarea') el.style.cursor = 'pointer';

            const enterAnim = ()=> gsap.to(el, { scale: 1.03, duration: 0.18, ease: 'power2.out' });
            const leaveAnim = ()=> gsap.to(el, { scale: 1, duration: 0.28, ease: 'power2.out' });

            el.addEventListener('mouseenter', enterAnim);
            el.addEventListener('mouseleave', leaveAnim);
            el.addEventListener('focus', enterAnim);
            el.addEventListener('blur', leaveAnim);

            // keyboard 'activation' visual feedback (Enter / Space)
            el.addEventListener('keydown', (ev)=>{
              if(ev.key === 'Enter' || ev.key === ' '){
                // quick press animation
                gsap.fromTo(el, { scale: 0.97 }, { scale: 1.04, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' });
              }
            });
          });


          // Global subtle 'pop' on hover for most visible elements (safe defaults)
          (function setupGlobalPop(){
            if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const root = document.getElementById('app') || document.body;
            const excludeTags = ['script','style','link','meta','svg','canvas','video','audio','source'];
            // include .forecast-card in excluded ancestors so global pop won't attach
            const excludeClosest = 'button,input,textarea,select,a,svg,video,audio,.forecast-card';

            const els = Array.from(root.querySelectorAll('*'));
            let attached = 0;
            els.forEach((el)=>{
              try{
                const tag = el.tagName.toLowerCase();
                if(excludeTags.includes(tag)) return;
                if(el.closest(excludeClosest)) return; // skip native controls and links
                if(el.dataset && el.dataset.popAttached) return;
                // Avoid scaling things that are inline text nodes within flow that may break layout: allow block-level elements
                const style = window.getComputedStyle(el);
                if(style.display === 'inline' && tag !== 'img') return;

                el.dataset.popAttached = '1';
                attached++;

                const enter = ()=> gsap.to(el, { scale: 1.02, duration: 0.12, ease: 'power1.out' });
                const leave = ()=> gsap.to(el, { scale: 1, duration: 0.16, ease: 'power1.out' });

                el.addEventListener('mouseenter', enter);
                el.addEventListener('mouseleave', leave);
                el.addEventListener('focus', enter);
                el.addEventListener('blur', leave);
              }catch(e){}
            });
          })();

          // Parallax background effect on mouse move
          const app = document.getElementById('app');
          const bg = document.querySelector('.weather-background');
          if(app && bg){
            app.addEventListener('mousemove', (e)=>{
              const rect = app.getBoundingClientRect();
              const x = (e.clientX - rect.left)/rect.width - 0.5;
              const y = (e.clientY - rect.top)/rect.height - 0.5;
              const tx = x * 12;
              const ty = y * 8;
              gsap.to(bg, { x: tx, y: ty, scale: 1.02, duration: 0.8, ease: 'power2.out' });
            });

            app.addEventListener('mouseleave', ()=>{
              gsap.to(bg, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power2.out' });
            });
          }
        }catch(e){ console.warn('motionHelpers.setupHoverAndParallax error', e); }
      }
    };

    window.motionHelpers.setup = function(){
      try{ window.motionHelpers.animateOnRender(); window.motionHelpers.setupHoverAndParallax(); }catch(e){}
    };

    // Run setup when motion helpers are ready and DOM is available
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      window.motionHelpers.setup();
    } else {
      document.addEventListener('DOMContentLoaded', window.motionHelpers.setup);
    }
  });
})();
