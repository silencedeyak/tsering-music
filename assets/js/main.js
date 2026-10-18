/* ==========================================================================
   TSERING MUSIC — Interaction layer
   ========================================================================== */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Preloader ---------- */
  function preloader() {
    const el = $('.loader');
    const pct = $('.loader__pct');
    if (!el) { document.documentElement.classList.add('is-loaded'); return; }

    let v = 0;
    const tick = setInterval(() => {
      v = Math.min(100, v + Math.random() * 14 + 6);
      if (pct) pct.textContent = String(Math.floor(v)).padStart(3, '0') + ' — Loading';
      if (v >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          el.classList.add('is-done');
          document.documentElement.classList.add('is-loaded', 'is-ready');
        }, 320);
      }
    }, 110);

    // Hard safety: never block the page more than 3.5s
    setTimeout(() => {
      if (!document.documentElement.classList.contains('is-loaded')) {
        clearInterval(tick);
        el.classList.add('is-done');
        document.documentElement.classList.add('is-loaded', 'is-ready');
      }
    }, 3500);
  }

  /* ---------- Split heading into words (keeps inline tags like <em> intact) ---------- */
  function splitWords() {
    let n = 0;
    function wrapText(node, parent) {
      const parts = node.nodeValue.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (p === '') return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        const w = document.createElement('span');
        w.className = 'word';
        w.style.transitionDelay = (n * 0.055).toFixed(3) + 's';
        const inner = document.createElement('span');
        inner.textContent = p;
        w.appendChild(inner);
        frag.appendChild(w);
        n++;
      });
      parent.replaceChild(frag, node);
    }
    function walk(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) { if (child.nodeValue.trim()) wrapText(child, node); }
        else if (child.nodeType === 1) { walk(child); }
      });
    }
    $$('.js-split').forEach((el) => { n = 0; walk(el); });
  }

  /* ---------- Scroll progress + sticky nav ---------- */
  function scrollFx() {
    const bar = $('.progress__bar');
    const nav = $('.nav');
    let raf = null;

    function update() {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      if (bar) bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (nav) nav.classList.toggle('is-stuck', y > 60);
      raf = null;
    }
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- Reveal on scroll ---------- */
  function reveals() {
    const items = $$('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const d = parseFloat(e.target.dataset.delay || 0);
          setTimeout(() => e.target.classList.add('is-in'), d);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach((i) => io.observe(i));
  }

  /* ---------- Cursor spotlight on cards ---------- */
  function spotlight() {
    if (reduce || window.matchMedia('(hover: none)').matches) return;
    $$('.card, .pillar').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---------- Hero parallax ---------- */
  function parallax() {
    const bg = $('.hero__bg');
    if (!bg || reduce) return;
    let raf = null;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight * 1.4) {
          bg.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(2) + 'px,0) scale(' + (1 + y * 0.00016).toFixed(4) + ')';
        }
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- Counters ---------- */
  function counters() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1600;
      const t0 = performance.now();
      function step(t) {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.5 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Mobile drawer ---------- */
  function drawer() {
    const btn = $('.burger');
    const panel = $('.drawer');
    if (!btn || !panel) return;
    const toggle = () => {
      const open = panel.classList.toggle('is-open');
      btn.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', toggle);
    panel.addEventListener('click', (e) => {
      if (e.target.closest('a')) { if (panel.classList.contains('is-open')) toggle(); }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) toggle();
    });
  }

  /* ---------- Discography filters ---------- */
  function filters() {
    const btns = $$('.filter');
    if (!btns.length) return;
    btns.forEach((b) => {
      b.addEventListener('click', () => {
        btns.forEach((x) => x.classList.remove('is-active'));
        b.classList.add('is-active');
        const f = b.dataset.filter;
        $$('.track').forEach((t) => {
          const match = f === 'all' || t.dataset.cat === f;
          t.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ---------- Lightbox ---------- */
  function lightbox() {
    const box = $('.lightbox');
    if (!box) return;
    const img = box.querySelector('img');
    const cap = box.querySelector('.lightbox__cap');
    const close = box.querySelector('.lightbox__close');

    $$('.shot').forEach((s) => {
      s.addEventListener('click', () => {
        const src = s.dataset.full || (s.querySelector('img') || {}).src;
        img.src = src;
        img.alt = (s.querySelector('img') || {}).alt || '';
        cap.textContent = s.dataset.caption || '';
        box.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        close.focus();
      });
    });
    const shut = () => { box.classList.remove('is-open'); document.body.style.overflow = ''; };
    close.addEventListener('click', shut);
    box.addEventListener('click', (e) => { if (e.target === box) shut(); });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('is-open')) shut(); });
  }

  /* ---------- Form (front-end only) ---------- */
  function form() {
    const f = $('.js-form');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = $('.form__ok');
      if (ok) ok.classList.add('is-shown');
      f.reset();
    });
  }

  /* ---------- Equalizer bars ---------- */
  function eq() {
    $$('.eq').forEach((el) => {
      const n = parseInt(el.dataset.bars || 5, 10);
      let html = '';
      for (let i = 0; i < n; i++) {
        html += '<i style="animation-delay:' + (i * 0.13).toFixed(2) + 's;animation-duration:' + (0.9 + (i % 3) * 0.22).toFixed(2) + 's"></i>';
      }
      el.innerHTML = html;
    });
  }

  /* ---------- Track play toggle (visual only) ---------- */
  function tracks() {
    $$('.track').forEach((t) => {
      const btn = t.querySelector('.track__play');
      if (!btn) return;
      t.addEventListener('click', () => {
        const on = t.classList.toggle('is-playing');
        const eqEl = t.querySelector('.eq');
        if (eqEl) eqEl.style.opacity = on ? '1' : '0.35';
      });
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    splitWords();
    eq();
    preloader();
    scrollFx();
    drawer();
    reveals();
    spotlight();
    parallax();
    counters();
    filters();
    lightbox();
    form();
    tracks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
