/* ============================================================
   PPS – Provence Pool Services | script.js
   Vanilla JS — zéro framework
============================================================ */

'use strict';

/* ============================================================
   LENIS — smooth momentum scroll
============================================================ */
(function initLenis() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({
    duration:    1.3,
    easing:      t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch:   false,
  });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
})();

/* ── Utilities ─────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   PRELOADER
============================================================ */
(function initPreloader() {
  const loader = $('#preloader');
  const bar    = $('#preloaderBar');
  if (!loader) return;

  // Animate bar to 100%
  requestAnimationFrame(() => {
    bar.style.width = '100%';
  });

  const done = () => {
    loader.classList.add('is-done');
    document.body.style.overflow = '';
  };

  document.body.style.overflow = 'hidden';

  if (prefersReducedMotion) {
    done();
    return;
  }

  // Use page load + minimum display time
  const minTime = 1500;
  const start   = Date.now();

  const maybeHide = () => {
    const elapsed = Date.now() - start;
    const delay   = Math.max(0, minTime - elapsed);
    setTimeout(done, delay);
  };

  if (document.readyState === 'complete') {
    maybeHide();
  } else {
    window.addEventListener('load', maybeHide, { once: true });
    // Safety fallback
    setTimeout(done, 4000);
  }
})();

/* ============================================================
   CUSTOM CURSOR
============================================================ */
(function initCursor() {
  const cursor = $('#cursor');
  const trail  = $('#cursorTrail');
  if (!cursor || !trail || prefersReducedMotion) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mx = -200, my = -200;
  let tx = -200, ty = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  });

  const lerp = (a, b, t) => a + (b - a) * t;

  const animate = () => {
    // Cursor snaps
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
    // Trail lags with lerp
    tx = lerp(tx, mx, 0.14);
    ty = lerp(ty, my, 0.14);
    trail.style.left = tx + 'px';
    trail.style.top  = ty + 'px';
    requestAnimationFrame(animate);
  };
  animate();
})();

/* ============================================================
   HEADER — scroll + mobile nav
============================================================ */
(function initHeader() {
  const header = $('#header');
  const burger = $('#burger');
  const nav    = $('#nav');
  if (!header) return;

  const heroSection = document.getElementById('hero');
  const onScroll = () => {
    const heroH = heroSection ? heroSection.offsetHeight : window.innerHeight;
    if (heroH < 200) return; // hero pas encore rendu — on ignore
    const pastHero = window.scrollY > heroH - 20;
    header.classList.toggle('is-past-hero', pastHero);
    header.classList.toggle('is-scrolled',  pastHero);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // Premier appel après rendu complet (évite le flash de transition)
  requestAnimationFrame(onScroll);

  // Mobile burger
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on nav link click
    $$('.header__nav-link', nav).forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
})();

/* ============================================================
   WATER CAUSTICS — reflets d'eau naturels sur le hero
   (remplace les particules "web3" par des reflets lumineux
    horizontaux évoquant la lumière sur une piscine)
============================================================ */
(function initParticles() {
  const canvas = $('#particlesCanvas');
  if (!canvas || prefersReducedMotion) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  let t = 0;

  // Caustic patches: horizontal shimmer lines
  const rand = (a, b) => Math.random() * (b - a) + a;

  const caustics = Array.from({ length: 18 }, () => ({
    x:      rand(0, 1),     // relative X position
    y:      rand(0, 1),     // relative Y
    w:      rand(60, 200),  // width of shimmer
    h:      rand(2, 5),     // height
    speed:  rand(0.0003, 0.0008),
    phase:  rand(0, Math.PI * 2),
    alpha:  rand(0.04, 0.13),
    curve:  rand(-0.3, 0.3), // horizontal drift
  }));

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    t += 1;

    caustics.forEach(c => {
      const cx = (c.x * W + Math.sin(t * c.speed * 0.7 + c.phase) * 80 + t * c.speed * 30) % W;
      const cy = c.y * H + Math.sin(t * c.speed + c.phase * 1.3) * 12;
      const alpha = c.alpha * (0.6 + 0.4 * Math.sin(t * c.speed * 2 + c.phase));

      // Elongated ellipse shimmer
      const grd = ctx.createLinearGradient(cx - c.w / 2, cy, cx + c.w / 2, cy);
      grd.addColorStop(0,   `rgba(255,255,255,0)`);
      grd.addColorStop(0.3, `rgba(255,255,255,${alpha})`);
      grd.addColorStop(0.5, `rgba(200,235,255,${alpha * 1.3})`);
      grd.addColorStop(0.7, `rgba(255,255,255,${alpha})`);
      grd.addColorStop(1,   `rgba(255,255,255,0)`);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(c.curve);
      ctx.beginPath();
      ctx.ellipse(0, 0, c.w / 2, c.h, 0, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();
})();

/* (hero scroll supprimé — hero plein écran statique avec animations CSS) */


/* ============================================================
   SCROLL REVEAL
============================================================ */
(function initScrollReveal() {
  if (prefersReducedMotion) {
    $$('.scroll-reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.scroll-reveal').forEach(el => io.observe(el));
})();

/* ============================================================
   ANIMATED COUNTERS
============================================================ */
(function initCounters() {
  const items = $$('[data-count]');
  if (!items.length) return;

  const ease = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = prefersReducedMotion ? 0 : 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(ease(progress) * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  items.forEach(el => io.observe(el));
})();

/* ============================================================
   BEFORE / AFTER SLIDERS
============================================================ */
(function initBASliders() {
  $$('.ba-slider').forEach(slider => {
    const beforeSide = $('.ba-slider__side--before', slider);
    const handle     = $('.ba-slider__handle', slider);
    if (!beforeSide || !handle) return;

    let isDragging = false;
    let pct = 50;

    const setPosition = (x) => {
      const rect = slider.getBoundingClientRect();
      pct = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
      beforeSide.style.clipPath  = `inset(0 ${100 - pct}% 0 0)`;
      handle.style.left          = pct + '%';
    };

    // Init
    setPosition(slider.getBoundingClientRect().left + slider.offsetWidth / 2);

    const onMove = (clientX) => { if (isDragging) setPosition(clientX); };

    slider.addEventListener('mousedown',  e => { isDragging = true; setPosition(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove',  e => onMove(e.clientX));
    window.addEventListener('mouseup',    () => { isDragging = false; });

    // Touch
    slider.addEventListener('touchstart', e => { isDragging = true; setPosition(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchmove',  e => { if (isDragging) setPosition(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend',   () => { isDragging = false; });

    // Keyboard accessibility
    slider.setAttribute('tabindex', '0');
    slider.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft')  { pct = Math.max(0, pct - 5); beforeSide.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + '%'; }
      if (e.key === 'ArrowRight') { pct = Math.min(100, pct + 5); beforeSide.style.clipPath = `inset(0 ${100 - pct}% 0 0)`; handle.style.left = pct + '%'; }
    });
  });
})();

/* ============================================================
   GALLERY LIGHTBOX
============================================================ */
(function initLightbox() {
  const lightbox  = $('#lightbox');
  const lbImg     = $('#lightboxImg');
  const lbCaption = $('#lightboxCaption');
  const lbClose   = $('#lightboxClose');
  const lbPrev    = $('#lightboxPrev');
  const lbNext    = $('#lightboxNext');
  const lbCounter = $('#lightboxCounter');
  if (!lightbox) return;

  const items = $$('.gallery__item');
  let current = 0;

  const open = (index) => {
    current = index;
    const item = items[index];
    lbImg.src = item.dataset.src;
    lbImg.alt = $('img', item).alt;
    lbCaption.textContent = item.dataset.caption || '';
    lbCounter.textContent = `${index + 1} / ${items.length}`;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lbImg.focus?.();
  };

  const close = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    items[current]?.focus();
  };

  const prev = () => { current = (current - 1 + items.length) % items.length; open(current); };
  const next = () => { current = (current + 1) % items.length; open(current); };

  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);

  document.addEventListener('keydown', e => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape')     close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend',   e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  });

  // Click outside image closes
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) close();
  });
})();

/* ============================================================
   TESTIMONIALS CAROUSEL
============================================================ */
(function initTestimonials() {
  const track    = $('#testimonialsTrack');
  const dotsWrap = $('#testimonialsDots');
  const prevBtn  = $('#testimPrev');
  const nextBtn  = $('#testimNext');
  if (!track) return;

  const cards        = $$('.testimonial-card', track);
  const totalCards   = cards.length;
  let current        = 0;
  let autoPlayTimer  = null;

  // Determine how many cards are visible
  const visibleCount = () => {
    const w = window.innerWidth;
    if (w <= 640)  return 1;
    if (w <= 1024) return 2;
    return 3;
  };

  const maxIndex = () => Math.max(0, totalCards - visibleCount());

  // Build dots
  const buildDots = () => {
    dotsWrap.innerHTML = '';
    const count = maxIndex() + 1;
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.className = 'testimonials__dot' + (i === current ? ' is-active' : '');
      btn.setAttribute('aria-label', `Témoignage ${i + 1}`);
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    }
  };

  const goTo = (index) => {
    current = Math.max(0, Math.min(index, maxIndex()));
    // Card width + gap
    const cardW = cards[0]?.offsetWidth || 0;
    const gap = 24;
    track.style.transform = `translateX(-${current * (cardW + gap)}px)`;
    $$('.testimonials__dot', dotsWrap).forEach((d, i) => d.classList.toggle('is-active', i === current));
  };

  const startAuto = () => {
    if (prefersReducedMotion) return;
    autoPlayTimer = setInterval(() => goTo((current + 1) > maxIndex() ? 0 : current + 1), 5000);
  };
  const stopAuto = () => clearInterval(autoPlayTimer);

  prevBtn?.addEventListener('click', () => { goTo(current - 1); stopAuto(); startAuto(); });
  nextBtn?.addEventListener('click', () => { goTo(current + 1); stopAuto(); startAuto(); });

  track.parentElement?.addEventListener('mouseenter', stopAuto);
  track.parentElement?.addEventListener('mouseleave', startAuto);

  // Touch swipe on track
  let swipeStart = 0;
  track.addEventListener('touchstart', e => { swipeStart = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = swipeStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goTo(current + 1) : goTo(current - 1);
      stopAuto(); startAuto();
    }
  });

  const init = () => {
    buildDots();
    goTo(0);
    startAuto();
  };

  window.addEventListener('resize', () => { buildDots(); goTo(current); });
  init();
})();

/* ============================================================
   CONTACT FORM — floating labels + validation + success
============================================================ */
(function initContactForm() {
  const form    = $('#contactForm');
  const success = $('#formSuccess');
  if (!form) return;

  // Live validation feedback
  const validateField = (field) => {
    const wrap = field.closest('.form-field');
    if (!wrap) return;
    const valid = field.checkValidity() && field.value.trim() !== '';
    wrap.classList.toggle('is-valid', valid);
  };

  $$('input, select, textarea', form).forEach(field => {
    field.addEventListener('input',  () => validateField(field));
    field.addEventListener('blur',   () => validateField(field));
    field.addEventListener('change', () => validateField(field));
  });

  // Handle select label float (value-based)
  $$('select', form).forEach(sel => {
    const label = sel.nextElementSibling;
    const check = () => {
      if (sel.value) {
        label?.classList.add('is-floated');
      } else {
        label?.classList.remove('is-floated');
      }
      validateField(sel);
    };
    sel.addEventListener('change', check);
    check();
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Basic required check
    let valid = true;
    $$('[required]', form).forEach(field => {
      if (!field.value.trim()) {
        field.closest('.form-field')?.classList.add('is-error');
        valid = false;
      }
    });
    if (!valid) return;

    // Simulate async send
    const btn = $('#formSubmit');
    const btnText = btn?.querySelector('.btn-submit__text');
    if (btn) { btn.disabled = true; if (btnText) btnText.textContent = 'Envoi en cours…'; }

    setTimeout(() => {
      form.hidden = true;
      success.hidden = false;
    }, 1200);
  });
})();

/* ============================================================
   SELECT LABEL FLOAT FIX
   (native selects need JS to detect non-empty state for CSS)
============================================================ */
(function fixSelectLabels() {
  $$('select').forEach(sel => {
    const updateLabel = () => {
      if (sel.value) {
        sel.setAttribute('data-has-value', '');
      } else {
        sel.removeAttribute('data-has-value');
      }
    };
    sel.addEventListener('change', updateLabel);
    updateLabel();
  });

  // Also add CSS hook via stylesheet
  const style = document.createElement('style');
  style.textContent = `
    select[data-has-value] + label,
    select:focus + label {
      top: 0.35rem !important;
      font-size: 0.68rem !important;
      color: var(--color-accent) !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
})();

/* ============================================================
   SMOOTH ANCHOR SCROLL
============================================================ */
(function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = $('#header')?.offsetHeight || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
})();

/* ============================================================
   ACTIVE NAV HIGHLIGHT
============================================================ */
(function initActiveNav() {
  const sections = $$('section[id]');
  const links    = $$('.header__nav-link[href^="#"]');
  if (!sections.length || !links.length) return;

  const headerH = () => $('#header')?.offsetHeight || 80;

  const onScroll = () => {
    const scrollY = window.scrollY + headerH() + 40;
    let active = '';
    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) active = '#' + sec.id;
    });
    links.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === active);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   FAQ ACCORDION
============================================================ */
(function initFaq() {
  const items = $$('.faq-item');
  if (!items.length) return;

  const close = (item) => {
    const btn = $('.faq-item__q', item);
    const ans = $('.faq-item__a', item);
    btn.setAttribute('aria-expanded', 'false');
    ans.style.maxHeight = '0px';
  };

  const open = (item) => {
    const btn = $('.faq-item__q', item);
    const ans = $('.faq-item__a', item);
    btn.setAttribute('aria-expanded', 'true');
    ans.style.maxHeight = ans.scrollHeight + 'px';
  };

  items.forEach(item => {
    const btn = $('.faq-item__q', item);
    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      items.forEach(close);
      if (!isOpen) open(item);
    });
  });

  // Recalcule la hauteur de l'item ouvert au redimensionnement
  window.addEventListener('resize', () => {
    items.forEach(item => {
      const btn = $('.faq-item__q', item);
      if (btn.getAttribute('aria-expanded') === 'true') {
        $('.faq-item__a', item).style.maxHeight = $('.faq-item__a', item).scrollHeight + 'px';
      }
    });
  }, { passive: true });
})();
