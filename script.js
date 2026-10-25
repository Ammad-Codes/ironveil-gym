/* =========================================================
   IRONVEIL — Private Performance Club
   script.js — vanilla JavaScript, no libraries
   Sections of this file (search for the numbers):
     1. Helpers and environment checks
     2. Preloader
     3. Scroll handler (progress bar, header, back-to-top, parallax)
     4. Mobile menu, smooth scroll, scrollspy
     5. Scroll reveal and staggered children
     6. Counters
     7. Custom cursor and magnetic buttons, ripple
     8. Classes filter and weekly timetable
     9. Pricing toggle
    10. Before/after slider
    11. BMI and calorie calculator
    12. Testimonials slider
    13. Gallery lightbox
    14. FAQ accordion
    15. Contact form and newsletter validation
    16. Misc (year, image fallback)
   ========================================================= */

(() => {
  'use strict';

  /* ---------- 1. Helpers and environment checks ---------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const body = document.body;
  const header = $('#site-header');
  const formatNumber = (n) => n.toLocaleString('en-US');

  /* Animate a number from one value to another. Calls onUpdate(value) each frame. */
  function tweenNumber(from, to, duration, onUpdate) {
    if (reducedMotion) {
      onUpdate(to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      onUpdate(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- 2. Preloader ---------- */
  const preloader = $('#preloader');
  const plBar = $('.pl-bar span', preloader);
  const LOAD_MS = reducedMotion ? 300 : 1400;   // progress line duration
  const CURTAIN_MS = reducedMotion ? 50 : 400;  // curtain-split duration

  function removePreloader() {
    body.classList.remove('is-loading');
    if (preloader) preloader.remove();
  }

  function finishPreloader() {
    if (!preloader) {
      body.classList.remove('is-loading');
      return;
    }
    preloader.classList.add('is-done');
    preloader.addEventListener('transitionend', removePreloader, { once: true });
    // safety net in case transitionend does not fire
    window.setTimeout(removePreloader, CURTAIN_MS + 300);
  }

  function runPreloader() {
    if (!preloader || !plBar) {
      body.classList.remove('is-loading');
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / LOAD_MS, 1);
      plBar.style.transform = `scaleX(${progress})`;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        finishPreloader();
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------- 3. Scroll handler: progress bar, header, back-to-top, parallax ---------- */
  const progressBar = $('.scroll-progress');
  const toTopBtn = $('.to-top');
  const toTopRing = $('.to-top .ring-fg');
  const RING_LENGTH = 2 * Math.PI * 22; // circle r=22 in the back-to-top SVG
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;

  function updateParallax() {
    if (reducedMotion) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const frame = el.parentElement;
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return; // off screen, skip work
      const speed = parseFloat(el.dataset.parallax) || 0.15;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.15)`;
    });
  }

  function updateOnScroll() {
    const y = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? y / maxScroll : 0;

    if (progressBar) progressBar.style.transform = `scaleX(${percent})`;
    if (header) header.classList.toggle('is-scrolled', y > 60);
    if (toTopBtn) toTopBtn.classList.toggle('is-visible', y > 600);
    if (toTopRing) toTopRing.style.strokeDashoffset = String(RING_LENGTH * (1 - percent));

    updateParallax();
    ticking = false;
  }

  function requestScrollUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);

  if (toTopBtn) {
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 4. Mobile menu, smooth scroll with offset, scrollspy ---------- */
  const hamburger = $('.hamburger');
  const overlay = $('#menu-overlay');

  function setMenu(open) {
    if (!overlay || !hamburger) return;
    overlay.classList.toggle('is-open', open);
    hamburger.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    overlay.setAttribute('aria-hidden', String(!open));
    overlay.inert = !open;
    body.classList.toggle('menu-open', open);

    if (open) {
      const firstLink = $('a', overlay);
      if (firstLink) firstLink.focus();
    } else if (overlay.contains(document.activeElement)) {
      hamburger.focus();
    }
  }

  function isMenuOpen() {
    return Boolean(overlay && overlay.classList.contains('is-open'));
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => setMenu(!isMenuOpen()));
  }

  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
  }

  // Close the menu with Esc, and reset it when the screen gets wide again
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) setMenu(false);
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
    if (event.matches && isMenuOpen()) setMenu(false);
  });

  // Smooth scroll to in-page links, leaving room for the sticky header
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id.length < 2) return;
      const target = $(id);
      if (!target) return;
      event.preventDefault();
      const headerHeight = header ? header.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;
      window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', id);
      if (target.hasAttribute('tabindex') === false) target.setAttribute('tabindex', '-1');
    });
  });

  // Scrollspy: highlight the nav link for the section in the middle of the screen
  const navLinks = $$('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  $$('main section[id]').forEach((section) => spy.observe(section));

  /* ---------- 5. Scroll reveal and staggered children ---------- */
  const revealEls = $$('.reveal');

  // Each child of a [data-stagger] group starts 100ms after the one before it
  $$('[data-stagger]').forEach((group) => {
    $$('.reveal', group).forEach((el, index) => {
      el.style.transitionDelay = `${index * 100}ms`;
    });
  });

  function markVisible(el) {
    el.classList.add('is-visible');
    // clear the stagger delay after the reveal, so hover effects stay snappy
    window.setTimeout(() => {
      el.style.transitionDelay = '';
    }, 1400);
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(markVisible);
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markVisible(entry.target);
          observer.unobserve(entry.target); // run once
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- 6. Counters ---------- */
  const counters = $$('.counter');

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    tweenNumber(0, target, 1800, (value) => {
      el.textContent = formatNumber(Math.round(value));
    });
  }

  if (reducedMotion || !('IntersectionObserver' in window)) {
    counters.forEach((el) => {
      el.textContent = formatNumber(parseInt(el.dataset.target, 10) || 0);
    });
  } else {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- 7. Custom cursor, magnetic buttons, ripple ---------- */
  if (finePointer && !reducedMotion) {
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (dot && ring) {
      document.documentElement.classList.add('has-cursor');

      let mouseX = 0;
      let mouseY = 0;
      let ringX = 0;
      let ringY = 0;

      window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }, { passive: true });

      // the ring trails behind the dot for a soft, lagging feel
      const followRing = () => {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        requestAnimationFrame(followRing);
      };
      followRing();

      const hoverTargets = 'a, button, .btn, input, select, textarea, .plan, .class-card, .gallery-item';
      document.addEventListener('mouseover', (event) => {
        if (event.target.closest(hoverTargets)) ring.classList.add('is-hover');
      });
      document.addEventListener('mouseout', (event) => {
        if (event.target.closest(hoverTargets)) ring.classList.remove('is-hover');
      });
    }

    // magnetic buttons: pull slightly toward the cursor
    $$('.btn-magnetic').forEach((btn) => {
      btn.addEventListener('mousemove', (event) => {
        const rect = btn.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.25;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.3;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  // ripple on every .btn click (works with mouse, touch and keyboard)
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn');
    if (!btn || reducedMotion || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ---------- 8. Classes filter and weekly timetable ---------- */
  const filterButtons = $$('.filter-btn');
  const classCards = $$('.class-card');

  function applyFilter(filter) {
    classCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.cat === filter;
      card.hidden = !show;
      if (show) {
        // restart the entrance animation for visible cards
        card.classList.remove('anim');
        void card.offsetWidth;
        card.classList.add('anim');
      }
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      applyFilter(button.dataset.filter);
    });
  });

  // "Book" on a class card: preselect that class in the trial form and go to the form
  $$('.book-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('.class-card');
      const title = card ? $('h3', card) : null;
      const select = $('#f-class');
      if (title && select) select.value = title.textContent.trim();
      const contact = $('#contact');
      if (contact) contact.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      if (select) window.setTimeout(() => select.focus({ preventScroll: true }), 700);
    });
  });

  // Timetable data (sample schedule)
  const schedule = {
    Mon: [['06:00', 'Iron Foundations', 'Strength', 'Ali Raza'], ['18:30', 'Ring Craft', 'Boxing', 'Omar Sheikh'], ['20:00', 'Flow & Breathe', 'Yoga', 'Hina Javed']],
    Tue: [['07:00', 'Engine Room', 'Cardio', 'Sana Malik'], ['12:30', 'Red Line Intervals', 'HIIT', 'Zain Ahmed'], ['19:00', 'Heavy Lift Lab', 'Strength', 'Ali Raza']],
    Wed: [['06:00', 'Iron Foundations', 'Strength', 'Ali Raza'], ['18:30', 'Flow & Breathe', 'Yoga', 'Hina Javed'], ['20:00', 'Ring Craft', 'Boxing', 'Omar Sheikh']],
    Thu: [['07:00', 'Engine Room', 'Cardio', 'Sana Malik'], ['12:30', 'Red Line Intervals', 'HIIT', 'Zain Ahmed'], ['19:00', 'Heavy Lift Lab', 'Strength', 'Ali Raza']],
    Fri: [['06:00', 'Iron Foundations', 'Strength', 'Ali Raza'], ['18:00', 'Ring Craft', 'Boxing', 'Omar Sheikh'], ['19:30', 'Red Line Intervals', 'HIIT', 'Zain Ahmed']],
    Sat: [['08:00', 'Flow & Breathe', 'Yoga', 'Hina Javed'], ['09:30', 'Heavy Lift Lab', 'Strength', 'Ali Raza'], ['11:00', 'Engine Room', 'Cardio', 'Sana Malik']],
    Sun: [['09:00', 'Flow & Breathe', 'Yoga', 'Hina Javed'], ['10:30', 'Ring Craft', 'Boxing', 'Omar Sheikh'], ['17:00', 'Iron Foundations', 'Strength', 'Ali Raza']]
  };

  const dayTabs = $$('.day-tab');
  const ttList = $('#tt-panel');

  // Build one timetable row. Uses textContent so no class name can inject HTML.
  function buildRow([time, name, tag, trainer]) {
    const li = document.createElement('li');

    const timeEl = document.createElement('span');
    timeEl.className = 'tt-time';
    timeEl.textContent = time;

    const nameEl = document.createElement('span');
    nameEl.className = 'tt-name';
    nameEl.textContent = name;
    const trainerEl = document.createElement('span');
    trainerEl.textContent = trainer;
    nameEl.appendChild(trainerEl);

    const tagEl = document.createElement('span');
    tagEl.className = 'tt-tag';
    tagEl.textContent = tag;

    li.append(timeEl, nameEl, tagEl);
    return li;
  }

  function renderDay(day) {
    if (!ttList) return;
    ttList.replaceChildren(...schedule[day].map(buildRow));
    ttList.classList.remove('fade-in');
    void ttList.offsetWidth;
    ttList.classList.add('fade-in');
  }

  function selectDay(tab) {
    dayTabs.forEach((other) => {
      const active = other === tab;
      other.classList.toggle('is-active', active);
      other.setAttribute('aria-selected', String(active));
      other.tabIndex = active ? 0 : -1;
    });
    if (ttList) ttList.setAttribute('aria-labelledby', tab.id);
    renderDay(tab.dataset.day);
  }

  dayTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectDay(tab));
    // arrow keys move between days, as the tab pattern requires
    tab.addEventListener('keydown', (event) => {
      let next = null;
      if (event.key === 'ArrowRight') next = dayTabs[(index + 1) % dayTabs.length];
      if (event.key === 'ArrowLeft') next = dayTabs[(index - 1 + dayTabs.length) % dayTabs.length];
      if (next) {
        event.preventDefault();
        selectDay(next);
        next.focus();
      }
    });
  });

  if (dayTabs.length) renderDay('Mon');

  /* ---------- 9. Pricing toggle ---------- */
  const billingSwitch = $('#billing');
  const priceEls = $$('[data-price]');
  const YEARLY_FACTOR = 0.8; // yearly saves 20%

  function setBilling(yearly) {
    priceEls.forEach((el) => {
      const base = parseFloat(el.dataset.price);
      const target = yearly ? Math.round(base * YEARLY_FACTOR) : base;
      const current = parseFloat(el.textContent) || base;
      tweenNumber(current, target, 600, (value) => {
        el.textContent = String(Math.round(value));
      });
    });
  }

  if (billingSwitch) {
    billingSwitch.addEventListener('click', () => {
      const yearly = billingSwitch.getAttribute('aria-checked') !== 'true';
      billingSwitch.setAttribute('aria-checked', String(yearly));
      setBilling(yearly);
    });
  }

  /* ---------- 10. Before/after slider ---------- */
  const baFrame = $('#ba-frame');
  const baHandle = $('#ba-handle');
  const baBefore = $('#ba-before');
  const baAfter = $('#ba-after');
  const storyButtons = $$('.story-btn');

  const stories = [
    {
      before: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80',
      after: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1600&q=80',
      beforeAlt: 'Before: training at the start of the programme',
      afterAlt: 'After: the same member twelve weeks later'
    },
    {
      before: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=1600&q=80',
      after: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80',
      beforeAlt: 'Before: first interval session',
      afterAlt: 'After: lifting heavier after six months'
    },
    {
      before: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1600&q=80',
      after: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80',
      beforeAlt: 'Before: first boxing class',
      afterAlt: 'After: competing in her first amateur bout'
    }
  ];

  function setSliderPosition(percent) {
    if (!baFrame || !baHandle) return;
    const clamped = Math.max(0, Math.min(100, percent));
    baFrame.style.setProperty('--pos', `${clamped}%`);
    baHandle.setAttribute('aria-valuenow', String(Math.round(clamped)));
  }

  function percentFromPointer(clientX) {
    const rect = baFrame.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function showStory(index) {
    const story = stories[index];
    if (!story || !baBefore || !baAfter) return;
    baBefore.src = story.before;
    baBefore.alt = story.beforeAlt;
    baAfter.src = story.after;
    baAfter.alt = story.afterAlt;
    storyButtons.forEach((button, i) => {
      const active = i === index;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  if (baFrame && baHandle) {
    let dragging = false;

    baFrame.addEventListener('pointerdown', (event) => {
      dragging = true;
      baFrame.setPointerCapture(event.pointerId);
      setSliderPosition(percentFromPointer(event.clientX));
    });
