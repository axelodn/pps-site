/* ==========================================================================
   PPS — Provence Pool Services — interactions front-end
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Image hotlink fallback ---------- */
  // Unsplash images are hotlinked; if one fails to load, swap in a styled
  // gradient placeholder instead of a broken-image icon.
  document.addEventListener(
    'error',
    function (e) {
      var el = e.target;
      if (el && el.tagName === 'IMG' && el.dataset.fallbackApplied !== 'true') {
        el.dataset.fallbackApplied = 'true';
        el.classList.add('img-fallback');
        el.style.background = 'linear-gradient(135deg, #1B3A5C, #2AACE2)';
      }
    },
    true
  );

  /* ---------- Custom cursor ---------- */
  (function initCursor() {
    if (reduceMotion || window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    var dot = document.createElement('div');
    var ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('has-custom-cursor');

    var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
    });

    function loop() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    var hoverTargets = 'a, button, .filter-btn, .portfolio-item, .ba-slider__handle-btn, input, textarea, select';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverTargets)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverTargets)) ring.classList.remove('is-hover');
    });
  })();

  /* ---------- Sticky header ---------- */
  (function initHeader() {
    var header = document.getElementById('header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 40) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /* ---------- Mobile menu ---------- */
  (function initBurger() {
    var burger = document.getElementById('burger');
    var mobileNav = document.getElementById('mobileNav');
    if (!burger || !mobileNav) return;
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
      mobileNav.classList.toggle('is-open', !open);
      document.body.style.overflow = open ? '' : 'hidden';
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        mobileNav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  })();

  /* ---------- Hero title letter reveal ---------- */
  (function initHeroReveal() {
    var h1 = document.querySelector('.hero__h1[data-letter-reveal]');
    if (!h1) return;
    var text = h1.textContent.trim();
    h1.textContent = '';
    var delay = 0.35;
    text.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch === ' ' ? ' ' : ch;
      if (!reduceMotion) {
        span.style.animationDelay = delay.toFixed(2) + 's';
        delay += 0.028;
      } else {
        span.style.opacity = '1';
        span.style.transform = 'none';
      }
      h1.appendChild(span);
    });
  })();

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  (function initReveal() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = el.getAttribute('data-reveal-delay');
            if (delay) el.style.transitionDelay = delay + 's';
            el.classList.add('is-visible');
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Smooth scroll for in-page anchors ---------- */
  (function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  })();

  /* ---------- Testimonials carousel ---------- */
  (function initTestimonials() {
    var wrap = document.querySelector('.testi-track-wrap');
    var track = document.querySelector('.testi-track');
    if (!wrap || !track) return;
    var slides = track.children.length;
    var index = 0;
    var prevBtn = document.querySelector('[data-testi-prev]');
    var nextBtn = document.querySelector('[data-testi-next]');

    function perView() {
      var w = window.innerWidth;
      if (w >= 1080) return 3;
      if (w >= 760) return 2;
      return 1;
    }

    function update() {
      var max = Math.max(0, slides - perView());
      if (index > max) index = max;
      if (index < 0) index = 0;
      var pct = (100 / slides) * index;
      track.style.transform = 'translateX(-' + pct + '%)';
    }

    if (nextBtn) nextBtn.addEventListener('click', function () {
      var max = Math.max(0, slides - perView());
      index = index >= max ? 0 : index + 1;
      update();
    });
    if (prevBtn) prevBtn.addEventListener('click', function () {
      var max = Math.max(0, slides - perView());
      index = index <= 0 ? max : index - 1;
      update();
    });
    window.addEventListener('resize', update);
    update();

    if (!reduceMotion) {
      setInterval(function () {
        var max = Math.max(0, slides - perView());
        index = index >= max ? 0 : index + 1;
        update();
      }, 6000);
    }
  })();

  /* ---------- Before / after sliders ---------- */
  (function initBeforeAfter() {
    document.querySelectorAll('.ba-slider').forEach(function (slider) {
      var before = slider.querySelector('.ba-slider__before');
      var handleBtn = slider.querySelector('.ba-slider__handle-btn');
      var dragging = false;

      function setPos(clientX) {
        var rect = slider.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        pct = Math.max(2, Math.min(98, pct));
        slider.style.setProperty('--pos', pct + '%');
        var img = before.querySelector('img');
        if (img) img.style.width = rect.width + 'px';
      }

      function syncBeforeWidth() {
        var rect = slider.getBoundingClientRect();
        var img = before.querySelector('img');
        if (img) img.style.width = rect.width + 'px';
      }
      syncBeforeWidth();
      window.addEventListener('resize', syncBeforeWidth);

      function down(e) { dragging = true; move(e); }
      function up() { dragging = false; }
      function move(e) {
        if (!dragging && e.type !== 'click') return;
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setPos(clientX);
      }

      slider.addEventListener('mousedown', down);
      window.addEventListener('mouseup', up);
      window.addEventListener('mousemove', move);
      slider.addEventListener('touchstart', down, { passive: true });
      window.addEventListener('touchend', up);
      slider.addEventListener('touchmove', move, { passive: true });

      if (handleBtn) {
        handleBtn.addEventListener('keydown', function (e) {
          var rect = slider.getBoundingClientRect();
          var current = parseFloat(getComputedStyle(slider).getPropertyValue('--pos')) || 50;
          if (e.key === 'ArrowLeft') { current -= 3; e.preventDefault(); }
          if (e.key === 'ArrowRight') { current += 3; e.preventDefault(); }
          current = Math.max(2, Math.min(98, current));
          slider.style.setProperty('--pos', current + '%');
          var img = before.querySelector('img');
          if (img) img.style.width = rect.width + 'px';
        });
      }
    });

    /* Before/after set navigation (dots swap image pairs) */
    document.querySelectorAll('[data-ba-group]').forEach(function (group) {
      var slider = group.querySelector('.ba-slider');
      var caption = group.querySelector('.ba-caption');
      var dots = group.querySelectorAll('.ba-nav__dot');
      if (!slider || !dots.length) return;
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          dots.forEach(function (d) { d.classList.remove('is-active'); });
          dot.classList.add('is-active');
          var beforeSrc = dot.getAttribute('data-before');
          var afterSrc = dot.getAttribute('data-after');
          var text = dot.getAttribute('data-caption');
          var beforeImg = slider.querySelector('.ba-slider__before img');
          var afterImg = slider.querySelector('.ba-slider__after img');
          if (beforeSrc) beforeImg.src = beforeSrc;
          if (afterSrc) afterImg.src = afterSrc;
          if (caption && text) caption.textContent = text;
        });
      });
    });
  })();

  /* ---------- Portfolio filter ---------- */
  (function initFilter() {
    var buttons = document.querySelectorAll('.filter-btn');
    var items = document.querySelectorAll('.portfolio-item');
    if (!buttons.length || !items.length) return;
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        var filter = btn.getAttribute('data-filter');
        items.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-category') === filter;
          item.classList.toggle('is-hidden', !match);
        });
      });
    });
  })();

  /* ---------- Lightbox gallery ---------- */
  (function initLightbox() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    if (!triggers.length) return;
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var imgEl = lightbox.querySelector('.lightbox__figure img');
    var captionEl = lightbox.querySelector('.lightbox__caption');
    var closeBtn = lightbox.querySelector('.lightbox__close');
    var prevBtn = lightbox.querySelector('.lightbox__prev');
    var nextBtn = lightbox.querySelector('.lightbox__next');
    var current = 0;

    function open(i) {
      current = i;
      var t = triggers[current];
      imgEl.src = t.getAttribute('href') || t.getAttribute('data-full') || t.querySelector('img').src;
      imgEl.alt = t.querySelector('img') ? t.querySelector('img').alt : '';
      captionEl.textContent = t.getAttribute('data-caption') || imgEl.alt;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    function next() { open((current + 1) % triggers.length); }
    function prev() { open((current - 1 + triggers.length) % triggers.length); }

    triggers.forEach(function (t, i) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        open(i);
      });
    });
    closeBtn.addEventListener('click', close);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  })();

  /* ---------- Contact form validation ---------- */
  (function initForm() {
    var form = document.getElementById('quoteForm');
    if (!form) return;
    var success = document.getElementById('formSuccess');

    function setError(field, message) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      var errorEl = wrap.querySelector('.field__error');
      wrap.classList.toggle('has-error', !!message);
      if (errorEl) errorEl.textContent = message || '';
    }

    function validateField(field) {
      if (field.hasAttribute('required') && !field.value.trim()) {
        setError(field, 'Ce champ est requis.');
        return false;
      }
      if (field.type === 'email' && field.value.trim()) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(field.value.trim())) {
          setError(field, 'Adresse email invalide.');
          return false;
        }
      }
      if (field.type === 'tel' && field.value.trim()) {
        var digits = field.value.replace(/[^0-9+]/g, '');
        if (digits.length < 8) {
          setError(field, 'Numéro de téléphone invalide.');
          return false;
        }
      }
      setError(field, '');
      return true;
    }

    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = form.querySelectorAll('input, select, textarea');
      var valid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) valid = false;
      });
      if (!valid) {
        var firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstError) firstError.focus();
        return;
      }
      form.reset();
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
    });
  })();

  /* ---------- Active nav link ---------- */
  (function markActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link, .mobile-nav a').forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path) link.classList.add('is-active');
    });
  })();
})();
