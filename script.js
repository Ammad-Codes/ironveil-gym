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
    baFrame.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      setSliderPosition(percentFromPointer(event.clientX));
    });

    const stopDrag = (event) => {
      dragging = false;
      if (event && baFrame.hasPointerCapture && baFrame.hasPointerCapture(event.pointerId)) {
        baFrame.releasePointerCapture(event.pointerId);
      }
    };
    baFrame.addEventListener('pointerup', stopDrag);
    baFrame.addEventListener('pointercancel', stopDrag);

    // keyboard: arrows move 5%, Shift+arrows 15%, Home and End jump to the ends
    baHandle.addEventListener('keydown', (event) => {
      const current = parseFloat(baHandle.getAttribute('aria-valuenow')) || 50;
      const step = event.shiftKey ? 15 : 5;
      let next = null;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = current - step;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = current + step;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = 100;
      if (next !== null) {
        event.preventDefault();
        setSliderPosition(next);
      }
    });

    setSliderPosition(50);
  }

  storyButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      showStory(index);
      setSliderPosition(50);
    });
  });

  /* ---------- 11. BMI and calorie calculator ---------- */
  const calcForm = $('#calc-form');
  const calcResult = $('#calc-result');

  function setFieldError(form, name, message) {
    const error = $(`[data-error-for="${name}"]`, form);
    const input = form.elements[name];
    if (error) error.textContent = message;
    if (input && input.closest) {
      const field = input.closest('.field');
      if (field) field.classList.toggle('is-invalid', Boolean(message));
      if (input.setAttribute) input.setAttribute('aria-invalid', message ? 'true' : 'false');
    }
  }

  // Map a BMI value onto the colour scale (segments: 14% / 26% / 20% / 40%)
  function bmiToPercent(bmi) {
    const points = [[15, 0], [18.5, 14], [25, 40], [30, 60], [40, 100]];
    if (bmi <= points[0][0]) return 0;
    for (let i = 1; i < points.length; i += 1) {
      const [x1, y1] = points[i];
      const [x0, y0] = points[i - 1];
      if (bmi <= x1) return y0 + ((bmi - x0) / (x1 - x0)) * (y1 - y0);
    }
    return 100;
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Healthy';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function showNumber(id, value, decimals = 0, suffix = '') {
    const el = $(id);
    if (!el) return;
    tweenNumber(0, value, 900, (v) => {
      el.textContent = (decimals ? v.toFixed(decimals) : formatNumber(Math.round(v))) + suffix;
    });
  }

  if (calcForm) {
    calcForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(calcForm);
      const sex = data.get('sex');
      const age = parseFloat(data.get('age'));
      const height = parseFloat(data.get('height'));
      const weight = parseFloat(data.get('weight'));
      const activity = parseFloat(data.get('activity'));
      const goal = parseFloat(data.get('goal'));

      let valid = true;
      const check = (name, value, min, max, label) => {
        if (!Number.isFinite(value)) {
          setFieldError(calcForm, name, `Please enter your ${label}.`);
          valid = false;
        } else if (value < min || value > max) {
          setFieldError(calcForm, name, `${label[0].toUpperCase()}${label.slice(1)} should be between ${min} and ${max}.`);
          valid = false;
        } else {
          setFieldError(calcForm, name, '');
        }
      };
      check('age', age, 16, 90, 'age');
      check('height', height, 120, 230, 'height in cm');
      check('weight', weight, 35, 250, 'weight in kg');

      if (!valid) {
        if (calcResult) calcResult.hidden = true;
        const firstInvalid = $('.field.is-invalid input', calcForm);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const bmi = weight / Math.pow(height / 100, 2);
      // Mifflin-St Jeor equation
      const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === 'female' ? -161 : 5);
      const maintenance = bmr * activity;
      const target = maintenance * (1 + goal);
      // simple macro split: 2 g protein per kg, 25% of calories as fat, the rest carbohydrate
      const protein = weight * 2;
      const fat = (target * 0.25) / 9;
      const carbs = Math.max(0, (target - protein * 4 - fat * 9) / 4);

      if (calcResult) calcResult.hidden = false;
      showNumber('#bmi-value', bmi, 1);
      const cat = $('#bmi-cat');
      if (cat) cat.textContent = bmiCategory(bmi);
      const marker = $('#bmi-marker');
      if (marker) {
        marker.style.setProperty('--p', '0%');
        window.setTimeout(() => marker.style.setProperty('--p', `${bmiToPercent(bmi).toFixed(1)}%`), 60);
      }
      showNumber('#cal-maint', maintenance);
      showNumber('#cal-target', target);
      showNumber('#macro-p', protein);
      showNumber('#macro-c', carbs);
      showNumber('#macro-f', fat);
    });

    calcForm.addEventListener('reset', () => {
      ['age', 'height', 'weight'].forEach((name) => setFieldError(calcForm, name, ''));
      if (calcResult) calcResult.hidden = true;
    });
  }

  /* ---------- 12. Testimonials slider ---------- */
  const tSlider = $('#t-slider');

  if (tSlider) {
    const track = $('#t-track', tSlider);
    const slides = $$('.t-slide', tSlider);
    const dotsWrap = $('.t-dots', tSlider);
    const prevBtn = $('.t-prev', tSlider);
    const nextBtn = $('.t-next', tSlider);
    let current = 0;
    let timer = null;

    const dots = slides.map((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 't-dot';
      dot.setAttribute('aria-label', `Show testimonial ${i + 1} of ${slides.length}`);
      dot.addEventListener('click', () => { goTo(i); restart(); });
      if (dotsWrap) dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      track.style.transform = `translateX(${-100 * current}%)`;
      slides.forEach((slide, i) => {
        slide.inert = i !== current;
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === current);
        dot.setAttribute('aria-current', i === current ? 'true' : 'false');
      });
    }

    function start() {
      if (reducedMotion || timer) return;
      timer = window.setInterval(() => goTo(current + 1), 7000);
    }
    function stop() {
      window.clearInterval(timer);
      timer = null;
    }
    function restart() {
      stop();
      start();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); restart(); });
    tSlider.addEventListener('mouseenter', stop);
    tSlider.addEventListener('mouseleave', start);
    tSlider.addEventListener('focusin', stop);
    tSlider.addEventListener('focusout', start);
    tSlider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') goTo(current - 1);
      if (event.key === 'ArrowRight') goTo(current + 1);
    });

    // swipe on touch screens
    let touchX = null;
    tSlider.addEventListener('touchstart', (event) => { touchX = event.touches[0].clientX; }, { passive: true });
    tSlider.addEventListener('touchend', (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
      touchX = null;
      restart();
    });

    // pause when the tab is hidden
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    goTo(0);
    start();
  }

  /* ---------- 13. Gallery lightbox ---------- */
  const lightbox = $('#lightbox');
  const galleryItems = $$('.gallery-item');

  if (lightbox && galleryItems.length) {
    const lbImg = $('.lb-img', lightbox);
    const lbCaption = $('.lb-caption', lightbox);
    const lbCount = $('.lb-count', lightbox);
    let lbIndex = 0;
    let lastFocus = null;

    function showLightbox(index) {
      lbIndex = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[lbIndex];
      const thumb = $('img', item);
      lbImg.src = item.dataset.full || (thumb ? thumb.src : '');
      lbImg.alt = thumb ? thumb.alt : '';
      lbCaption.textContent = item.dataset.caption || '';
      lbCount.textContent = `${lbIndex + 1} / ${galleryItems.length}`;
    }

    function openLightbox(index) {
      lastFocus = document.activeElement;
      showLightbox(index);
      lightbox.inert = false;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      body.classList.add('lb-open');
      const closeBtn = $('.lb-close', lightbox);
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.inert = true;
      body.classList.remove('lb-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function lightboxOpen() {
      return lightbox.classList.contains('is-open');
    }

    galleryItems.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
    });
    $('.lb-close', lightbox).addEventListener('click', closeLightbox);
    $('.lb-prev', lightbox).addEventListener('click', () => showLightbox(lbIndex - 1));
    $('.lb-next', lightbox).addEventListener('click', () => showLightbox(lbIndex + 1));
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    window.addEventListener('keydown', (event) => {
      if (!lightboxOpen()) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showLightbox(lbIndex - 1);
      if (event.key === 'ArrowRight') showLightbox(lbIndex + 1);
      if (event.key === 'Tab') {
        // keep focus inside the dialog
        const focusable = $$('button', lightbox);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------- 14. FAQ accordion ---------- */
  const faqItems = $$('.faq-item');

  function setFaq(item, open) {
    const button = $('.faq-q', item);
    const answer = $('.faq-a', item);
    if (!button || !answer) return;
    item.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    answer.inert = !open;
  }

  faqItems.forEach((item) => {
    const button = $('.faq-q', item);
    if (!button) return;
    button.addEventListener('click', () => {
      const willOpen = button.getAttribute('aria-expanded') !== 'true';
      faqItems.forEach((other) => setFaq(other, other === item && willOpen));
    });
  });

  /* ---------- 15. Contact form and newsletter validation ---------- */
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const contactForm = $('#contact-form');
  const contactSuccess = $('#contact-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = contactForm.elements.name.value.trim();
      const email = contactForm.elements.email.value.trim();
      const phone = contactForm.elements.phone.value.trim();
      const message = contactForm.elements.message.value.trim();

      const errors = {
        name: name.length < 2 ? 'Please enter your full name.' : '',
        email: !email ? 'Please enter your email address.' : (emailPattern.test(email) ? '' : 'That email address does not look right.'),
        phone: phone && !/^[+()\d\s.-]{7,20}$/.test(phone) ? 'Please enter a valid phone number.' : '',
        message: message.length < 10 ? 'Please tell us a little more (at least 10 characters).' : ''
      };

      Object.keys(errors).forEach((key) => setFieldError(contactForm, key, errors[key]));
      const firstBad = Object.keys(errors).find((key) => errors[key]);
      if (contactSuccess) contactSuccess.hidden = true;

      if (firstBad) {
        contactForm.elements[firstBad].focus();
        return;
      }

      // demo only: nothing is sent anywhere
      contactForm.reset();
      if (contactSuccess) contactSuccess.hidden = false;
    });

    // clear an error as soon as the visitor starts fixing it
    contactForm.addEventListener('input', (event) => {
      const input = event.target;
      if (input && input.name) setFieldError(contactForm, input.name, '');
    });
  }

  const newsletterForm = $('#newsletter-form');
  const newsletterMsg = $('#newsletter-msg');

  if (newsletterForm && newsletterMsg) {
    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = $('#nl-email');
      const value = input.value.trim();
      newsletterMsg.classList.remove('is-error', 'is-success');
      if (!emailPattern.test(value)) {
        newsletterMsg.textContent = 'Please enter a valid email address.';
        newsletterMsg.classList.add('is-error');
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.setAttribute('aria-invalid', 'false');
      newsletterMsg.textContent = 'Thank you. You are on the list (demo only, nothing was sent).';
      newsletterMsg.classList.add('is-success');
      newsletterForm.reset();
    });
  }

  /* ---------- 16. Misc: year, billing labels, cursor visibility, image fallback, start-up ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // highlight the Monthly / Yearly label next to the pricing switch
  const billingLabels = $$('.billing-opt');
  function syncBillingLabels() {
    const yearly = billingSwitch && billingSwitch.getAttribute('aria-checked') === 'true';
    billingLabels.forEach((label) => label.classList.toggle('is-active', (label.dataset.bill === 'yearly') === Boolean(yearly)));
    $$('.price small').forEach((el) => { el.textContent = yearly ? '/ month, billed yearly' : '/ month'; });
  }
  if (billingSwitch) {
    billingSwitch.addEventListener('click', syncBillingLabels);
    billingLabels.forEach((label) => {
      label.addEventListener('click', () => {
        const wantYearly = label.dataset.bill === 'yearly';
        const isYearly = billingSwitch.getAttribute('aria-checked') === 'true';
        if (wantYearly !== isYearly) billingSwitch.click();
      });
    });
  }

  // show the custom cursor only once the mouse has moved over the page
  if (finePointer && !reducedMotion) {
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (dot && ring) {
      window.addEventListener('mousemove', () => {
        dot.classList.add('is-active');
        ring.classList.add('is-active');
      }, { passive: true, once: true });
      document.addEventListener('mouseleave', () => {
        dot.classList.remove('is-active');
        ring.classList.remove('is-active');
      });
      document.addEventListener('mouseenter', () => {
        dot.classList.add('is-active');
        ring.classList.add('is-active');
      });
      window.addEventListener('mousedown', () => ring.classList.add('is-down'));
      window.addEventListener('mouseup', () => ring.classList.remove('is-down'));
    }
  }

  // if a photo fails to load, fade it out instead of showing a broken icon
  $$('img').forEach((img) => {
    img.addEventListener('error', () => {
      img.style.visibility = 'hidden';
    }, { once: true });
  });

  // initial scroll state, then start the preloader
  updateOnScroll();

  let preloaderStarted = false;
  function startPreloader() {
    if (preloaderStarted) return;
    preloaderStarted = true;
    runPreloader();
  }

  if (document.readyState === 'complete') {
    startPreloader();
  } else {
    window.addEventListener('load', startPreloader, { once: true });
  }
  // safety nets: never leave the page hidden behind the preloader
  window.setTimeout(startPreloader, 4000);
  window.setTimeout(() => {
    if (document.getElementById('preloader') || body.classList.contains('is-loading')) removePreloader();
  }, 6500);
})();
