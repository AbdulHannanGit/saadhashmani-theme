/*!
 * Saad Hashmani theme - page engine.
 * Section stage, background video, carousels, playbook wheel, podcast ring,
 * testimonials, chat form and cursor. Content comes from window.shTheme (PHP).
 */
(function () {
'use strict';

var SH = window.shTheme || {};

function urlFlag(name) {
  try { var v = new URLSearchParams(window.location.search).get(name); return v === null ? null : v; } catch (e) { return null; }
}

// YouTube needs the page origin (Referer) or the player shows error 153, so pass it explicitly.
function ytEmbed(id) {
  return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1&origin=' + encodeURIComponent(window.location.origin);
}

// GSAP is only downloaded when it is switched on for this device type (or forced with ?gsap=1).
function loadGsap(props, mobile) {
  var flag = urlFlag('gsap');
  var on = flag !== null ? flag === '1' : (mobile ? props.gsapMobile : props.gsapDesktop);
  if (!on || !props.gsapFiles || !props.gsapFiles.length) return null;
  return new Promise(function (resolve) {
    props.gsapFiles.forEach(function (src, i, all) {
      var el = document.createElement('script');
      el.src = src; el.async = false;
      if (i === all.length - 1) { el.onload = resolve; el.onerror = resolve; }
      document.head.appendChild(el);
    });
  });
}

class App {
  constructor(props) { this.props = props; }

  componentDidMount() {
    this.reduced = this.props.animations === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.root = document.querySelector('[data-stage-root]');
    if (!this.root) return;
    this.spacer = this.root.querySelector('[data-spacer]');
    this.arrow = this.root.querySelector('[data-arrow]');
    this.header = this.root.querySelector('[data-header]');
    this.sec2 = this.root.querySelector('[data-sec2]');
    this.sec3 = this.root.querySelector('[data-sec3]');
    this.sec5 = this.root.querySelector('[data-sec5]');
    this.sec6 = this.root.querySelector('[data-sec6]');
    this.sec7 = this.root.querySelector('[data-sec7]');
    this.sec4 = this.root.querySelector('[data-sec4]');
    this.activeInst = null;
    this.heroTitle = this.root.querySelector('[data-hero-title]');
    this.heroH1 = this.heroTitle ? this.heroTitle.querySelector('h1') : null;
    this.applyHeroFont();
    this.heroScrim = this.root.querySelector('[data-hero-scrim]');
    this.arrowIcon = this.root.querySelector('[data-arrow-icon]');
    this.ringWrap = this.root.querySelector('[data-ring-wrap]');
    this.ringText = this.root.querySelector('[data-textpath]');
    this.mouse = { x: -9999, y: -9999, on: false };
    this.N = 7;                 // 7 rest sections, 6 transitions
    this.initBg();

    this.currentSection = 0;
    this.inTrans = false;
    this.bandKey = '';
    this.idleSection = null;
    this.idleDir = 1;
    this._transPlaying = false;

    this.layout();
    this.bindArrow();
    this.bindMenu();
    this.onArrowPtr = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; this.mouse.on = true; };
    this.onArrowLeave = () => { this.mouse.on = false; };
    window.addEventListener('pointermove', this.onArrowPtr, { passive: true });
    window.addEventListener('pointerleave', this.onArrowLeave, { passive: true });
    this.bindKeys();
    this.bootContent();

    this._vw = window.innerWidth; this._vh = window.innerHeight;
    this.onResize = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      if (vw === this._vw && Math.abs(vh - this._vh) < 160 && this.isMobile()) return;
      this._vw = vw; this._vh = vh;
      this.layout(); this.pbs && this.pbs.forEach(p => this.layoutPb(p));
      if (!this._transPlaying && !this.autoReturn && !this.inLoop) this.landOn(this.currentSection);
      this.handle(this.readY()); if (this.headEl) { this.headEl._hRect = this.headEl.getBoundingClientRect(); if (this.headEl._clone) this.headEl._clone.style.width = this.headEl._hRect.width + 'px'; } };
    window.addEventListener('resize', this.onResize, { passive: true });

    const frame = (now) => { const dt = this._lastFrameT != null ? Math.min(0.05, (now - this._lastFrameT) / 1000) : 0; this._lastFrameT = now; this.raf = requestAnimationFrame(frame); try { this.tickBg(now); if (this.secOn(this.sec4)) this.tickPlaybook(now); if (this.secOn(this.sec5)) this.tickPods(); if (this.secOn(this.sec6)) this.tickTestis(); this.tickArrowMagnet(); this.tickMenu(); if (this.motion) this.motion.tick(); if (this.cur) this.tickCursor(); } catch (e) { if (!this._tickErr) { this._tickErr = true; console.error(e); } } };    this.raf = requestAnimationFrame(frame);

    this.handle(0);
    this.runPreloader();
    this.initCursor();
    const gsapReady = loadGsap(this.props, this.isMobile());
    if (gsapReady) gsapReady.then(() => window.GsapMotion && window.GsapMotion.create(this)).then((m) => { if (m) this.motion = m; });
  }

  bootContent() {
    this.buildTimeline();
    this.buildPlaybook();
    this.buildVentures();
    this.buildGallery();
    this.buildPods();
    this.buildTestis();
    this.buildChat();
    this.wireSocialPopup();
    this.addHovers();
    this.loadDepsThenScroll();
    this.openFromHash();
  }

  // Links from other pages (e.g. the 404 page) use /#contact: jump to the form once the intro has played.
  openFromHash() {
    if (window.location.hash !== '#contact') return;
    const t0 = performance.now();
    const tick = () => {
      if (this.inputReady() && this.restStart && this.restStart.length >= this.N) {
        try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) {}
        this.scrollToLastSection(1.4);
      } else if (performance.now() - t0 < 20000) setTimeout(tick, 150);
    };
    setTimeout(tick, 300);
  }

  isMobile() { return window.innerWidth <= 768; }

  secOn(el) { return !!el && el.style.opacity !== '' && parseFloat(el.style.opacity) > 0.001; }

  // Input (wheel/swipe/keys that change section) waits for the preloader and the hero intro to finish.
  inputReady() { return this._preDone !== false && !this._introLock && performance.now() >= (this._inputAt || 0); }

  initCursor() {
    if (this._curOn) return;
    if (this.props.customCursor === false && urlFlag('cursor') !== '1') return;
    const fine = window.matchMedia('(pointer:fine)').matches;
    if (!fine || this.reduced || this.isMobile()) return;
    this._curOn = true;
    this.CH = 'ABCDEF0123456789{}[]/<>=+*#$%&'.split('');
    this.curLens = document.querySelector('[data-cur="lens"]');
    this.curDot = document.querySelector('[data-cur="dot"]');
    if (!this.curLens || !this.curDot) { this._curOn = false; return; }
    const st = document.createElement('style');
    st.textContent = 'html.vault-cur,html.vault-cur *{cursor:none!important}';
    document.head.appendChild(st);
    document.documentElement.classList.add('vault-cur');
    this.allHeads = Array.from(this.root.querySelectorAll('h1,h2,h3'));
    this.cur = { x: innerWidth / 2, y: innerHeight / 2, lx: innerWidth / 2, ly: innerHeight / 2, _px: 0, _py: 0, speed: 0, mode: 'default', scale: 0.36, vis: false };
    this.headEl = null;
    this.curIcon = this.curLens.querySelector('[data-cur="icon"]');
    this.curRing = this.curLens.querySelector('[data-cur="ring"]');
    this.curRingText = this.curLens.querySelector('[data-cur-ringtext]');
    this.curIcons = {
      camera: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4l1.6 2.6H20A1.5 1.5 0 0 1 21.5 8.1V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V8.1A1.5 1.5 0 0 1 4 6.6h3.9L9.5 4z"/><circle cx="12" cy="12.6" r="3.3"/></svg>',
      hdrag: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/></svg>',
      vdrag: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/></svg>',
      rotate: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/></svg>'
    };
    this.SEL = {
      caret: 'input,textarea,[contenteditable="true"]',
      probe: 'a,button,[role="button"]',
      dialer: '[data-pb-cluster]',
      hdrag: '[data-tl-viewport],[data-pod-ring]',
      vdrag: '[data-testi-col]',
      media: 'image-slot,[data-frame]',
      heading: 'h1,h2,h3'
    };
    this.onCurMove = (e) => {
      const c = this.cur;
      c.x = e.clientX; c.y = e.clientY;
      if (!c.vis) { c.vis = true; this.applyCurStyle(); }
      const t = document.elementFromPoint(e.clientX, e.clientY);
      this.classifyCur(t);
    };
    this.onCurDown = () => { if (this.cur) { this.cur.pressed = true; this.applyCurStyle(); } };
    this.onCurUp = () => { if (this.cur) { this.cur.pressed = false; this.applyCurStyle(); } };
    this.onCurOut = (e) => { if (!e.relatedTarget && this.cur) { this.cur.vis = false; this.curLens.style.opacity = '0'; this.curDot.style.opacity = '0'; } };
    window.addEventListener('pointermove', this.onCurMove, { passive: true });
    window.addEventListener('pointerdown', this.onCurDown, { passive: true });
    window.addEventListener('pointerup', this.onCurUp, { passive: true });
    document.addEventListener('pointerout', this.onCurOut, { passive: true });
    this.setupCursorEditGuard();
  }

  // In an editor (Claude edit mode) the custom cursor gets in the way of direct
  // element editing, so auto-disable it whenever the page looks editable, and
  // expose window.vaultCursor.toggle()/off()/on() as a manual override.
  setupCursorEditGuard() {
    const editable = () => {
      try {
        if (document.designMode === 'on') return true;
        const ae = document.activeElement;
        if (ae && (ae.isContentEditable || ae.getAttribute && ae.getAttribute('contenteditable') === 'true')) return true;
        const scan = (el) => !!el && ((typeof el.className === 'string' && /edit|selectable|om-edit|dm-edit/i.test(el.className)) || el.hasAttribute('contenteditable') || el.hasAttribute('data-om-editing') || el.hasAttribute('data-editing'));
        if (scan(document.documentElement) || scan(document.body)) return true;
        if (document.querySelector('[contenteditable="true"]')) return true;
      } catch (e) {}
      return false;
    };
    const apply = () => { if (this._curForced != null) return; if (editable()) this.disableCursor(); else this.enableCursor(); };
    this._curObs = new MutationObserver(apply);
    try { this._curObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'contenteditable', 'data-om-editing', 'data-editing'] }); } catch (e) {}
    if (document.body) { try { this._curObs.observe(document.body, { attributes: true, attributeFilter: ['class', 'contenteditable'] }); } catch (e) {} }
    document.addEventListener('focusin', apply, true);
    document.addEventListener('focusout', apply, true);
    this._curKey = (e) => { if (e.altKey && (e.key === 'c' || e.key === 'C')) { this._curForced = this._curDisabled ? false : true; if (this._curForced) this.disableCursor(); else this.enableCursor(); } };
    window.addEventListener('keydown', this._curKey);
    window.vaultCursor = { off: () => { this._curForced = true; this.disableCursor(); }, on: () => { this._curForced = false; this.enableCursor(); }, auto: () => { this._curForced = null; apply(); }, toggle: () => { this._curForced = !this._curDisabled; this._curForced ? this.disableCursor() : this.enableCursor(); } };
    this._curApply = apply;
    this.applyCursorPref();
    apply();
  }

  urlProp(name) {
    if (!this._urlParams) return null;
    const v = this._urlParams.get(name);
    if (v == null) return null;
    if (name === 'cursor' || name === 'testimonial') return v === '1';
    return v;
  }

  applyCursorPref() {
    if (!this._curOn) return;
    const cursorOverride = this.urlProp('cursor');
    const on = cursorOverride !== null ? cursorOverride : (this.props.customCursor ?? true) !== false;
    if (!on) { this._curForced = true; this.disableCursor(); }
    else { if (this._curForced === true) this._curForced = null; if (this._curApply) this._curApply(); }
  }

  disableCursor() {
    if (this._curDisabled) return; this._curDisabled = true;
    document.documentElement.classList.remove('vault-cur');
    if (this.curLens) this.curLens.style.opacity = '0';
    if (this.curDot) this.curDot.style.opacity = '0';
  }

  enableCursor() {
    if (!this._curDisabled) return; this._curDisabled = false;
    document.documentElement.classList.add('vault-cur');
  }

  _isPodCenter(cardEl) {
    if (!cardEl || this.podCenter < 0) return false;
    const i = +cardEl.getAttribute('data-i');
    return i === (((this.podCenter % this.podN) + this.podN) % this.podN);
  }

  classifyCur(t) {
    let mode = 'default', el = null;
    if (t) {
      if (t.closest(this.SEL.caret)) mode = 'caret';
      else if (t.closest(this.SEL.probe)) mode = 'probe';
      else if (t.closest('[data-tl-item-img]')) mode = 'clickview';
      else if (t.closest('[data-vgallery] image-slot') || t.closest('[data-vgallery] img')) mode = 'clickview';
      else if (t.closest('[data-pb-topic]') && t.closest('[data-pb-cluster]')) mode = 'clickview';
      else if (t.closest('[data-pod-card]') && this.pods && this._isPodCenter(t.closest('[data-pod-card]'))) mode = 'clickview';
      else if (t.closest(this.SEL.dialer)) mode = 'dialer';
      else if (t.closest(this.SEL.hdrag)) mode = 'hdrag';
      else if (t.closest(this.SEL.vdrag)) mode = 'vdrag';
      else if (t.closest(this.SEL.media)) mode = 'media';
      else if ((el = this.hitHeading(this.cur.x, this.cur.y))) mode = 'heading';
    }
    this.setHeadEl(mode === 'heading' ? el : null);
    if (mode !== this.cur.mode) { this.cur.mode = mode; this.applyCurStyle(); }
  }

  applyCurStyle() {
    const c = this.cur, L = this.curLens, D = this.curDot, I = this.curIcon, RG = this.curRing;
    if (!L) return;
    I.style.display = 'none';
    if (RG) RG.style.display = 'none';
    L.style.background = 'rgba(255,255,255,.045)';
    L.style.borderColor = 'var(--line-strong,rgba(255,255,255,.14))';
    L.style.backdropFilter = 'blur(4px) saturate(1.2)';
    L.style.webkitBackdropFilter = 'blur(4px) saturate(1.2)';
    D.style.width = '6px'; D.style.height = '6px'; D.style.borderRadius = '999px';
    const m = c.mode;
    if (m === 'probe') { L.style.opacity = '0'; D.style.opacity = '0'; }
    else if (m === 'caret') { L.style.opacity = '0'; D.style.opacity = '1'; D.style.width = '2px'; D.style.height = '22px'; D.style.borderRadius = '2px'; }
    else if (m === 'heading') { L.style.opacity = '1'; D.style.opacity = '0'; }
    else if (m === 'media' || m === 'clickview' || m === 'dialer' || m === 'hdrag' || m === 'vdrag') {
      L.style.opacity = '1'; D.style.opacity = '0';
      L.style.width = '90px'; L.style.height = '90px'; L.style.borderRadius = '999px';
      I.style.display = 'flex';
      I.innerHTML = (m === 'media' || m === 'clickview') ? this.curIcons.camera : m === 'hdrag' ? this.curIcons.hdrag : m === 'vdrag' ? this.curIcons.vdrag : this.curIcons.rotate;
      if (RG && this.curRingText) { this.curRingText.textContent = m === 'media' || m === 'clickview' ? 'CLICK TO VIEW \u00b7 CLICK TO VIEW \u00b7 ' : 'DRAG TO SCROLL \u00b7 DRAG TO SCROLL \u00b7 '; RG.style.display = 'block'; }
    } else {
      L.style.opacity = '1'; D.style.opacity = '1';
      L.style.width = '34px'; L.style.height = '34px'; L.style.borderRadius = '999px';
    }
  }


  addHovers() {
    const root = this.root;
    const add = (sel, cls) => root.querySelectorAll(sel).forEach(e => e.classList.add(cls));
    ['[data-req]', '[data-menu-toggle]', '[data-vprev]', '[data-vnext]', '[data-pb-expand]', '[data-pb-cta]', '[data-tl-modal-cta]', '[data-pod-prev]', '[data-pod-next]', '[data-chat-plus]', '[data-chat-type]', '[data-tl-plus]', '[data-vg-prev]', '[data-vg-next]', '[data-gallery-prev]', '[data-gallery-next]', '[data-gallery-close]', '[data-tl-modal-close]', '[data-pod-close]', '[data-testi-plat]'].forEach(s => add(s, 'v-hbtn'));
    add('[data-menu-close]', 'v-grow');
    root.querySelectorAll('[data-sec3] a').forEach(a => {
      a.onmouseover = null; a.onmouseout = null; a.removeAttribute('onmouseover'); a.removeAttribute('onmouseout'); a.classList.add('v-hbtn');
      if (a.hasAttribute('data-ext-cta')) return;
      a.addEventListener('click', (e) => { e.preventDefault(); this.scrollToLastSection(1.4); });
    });
    if (this.sec7) this.sec7.querySelectorAll('a').forEach(a => { a.classList.add('v-hbtn'); a.classList.add('v-soc'); });
    const play = root.querySelector('[data-pod-play]'); if (play) play.classList.add('v-grow');
    const send = root.querySelector('[data-chat-send]'); if (send) send.classList.add('v-send');
    root.querySelectorAll('[data-menu-link]').forEach(a => a.classList.add('v-mgrow'));
    root.querySelectorAll('[data-vdot]').forEach(b => b.classList.add('v-grow'));
    const badge = root.querySelector('[data-header] a[aria-label] span'); if (badge) badge.classList.add('v-hbtn');
    const logoA = root.querySelector('[data-header] a[aria-label]'); if (logoA) logoA.addEventListener('mouseenter', () => this.scrambleLogo());
    const req = root.querySelector('[data-req]'); if (req) req.addEventListener('click', (e) => { e.preventDefault(); this.scrollToLastSection(1.4); });
    root.querySelectorAll('[data-pb-cta]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); this.scrollToLastSection(1.4); }));
  }

  scrambleLogo() {
    const a = this.root.querySelector('[data-header] a[aria-label]'); if (!a) return;
    const span = a.querySelectorAll('span')[1]; if (!span) return;
    if (this._logoScrambling) return;
    this._logoScrambling = true;
    const real = span.textContent;
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>#'.split('');
    const len = real.length, dur = 46; let frame = 0;
    const step = () => {
      frame++;
      const lock = Math.floor(len * frame / dur);
      let s = '';
      for (let i = 0; i < len; i++) { const ch = real[i]; if (ch === ' ' || ch === '\u00a0') { s += ch; continue; } s += i < lock ? ch : CH[(Math.random() * CH.length) | 0]; }
      span.textContent = s;
      if (frame < dur) requestAnimationFrame(step); else { span.textContent = real; this._logoScrambling = false; }
    };
    step();
  }

  buildGallery() {
    if (!this.sec3) return;
    this.galleryLb = document.querySelector('[data-gallery-lb]');
    if (!this.galleryLb) return;
    const img = this.galleryLb.querySelector('img');
    this.galleryList = []; this.galleryIdx = 0;
    const showAt = (i) => {
      const n = this.galleryList.length; if (!n) return;
      this.galleryIdx = ((i % n) + n) % n;
      img.src = this.galleryList[this.galleryIdx];
    };
    const open = (list, i) => { this.galleryList = list; showAt(i); this.galleryLb.style.display = 'flex'; requestAnimationFrame(() => { this.galleryLb.style.opacity = '1'; }); };
    this.closeGalleryLb = () => { this.galleryLb.style.opacity = '0'; setTimeout(() => { this.galleryLb.style.display = 'none'; img.src = ''; }, 300); };
    this.sec3.querySelectorAll('[data-vgallery]').forEach((wrap) => {
      const track = wrap.querySelector('[data-vg-track]');
      const items = Array.from(track.children);
      const getSrcs = () => items.map((it) => { const el = it.querySelector('image-slot,img'); return el ? (el.tagName === 'IMG' ? (el.dataset.full || el.src) : (el.getAttribute('src') || '')) : ''; });
      items.forEach((it, i) => {
        const el = it.querySelector('image-slot,img');
        if (el) el.style.cursor = 'pointer';
        it.addEventListener('click', (e) => { e.stopPropagation(); open(getSrcs(), i); });
      });
      const perView = 3, itemW = items[0] ? items[0].getBoundingClientRect().width + 12 : 86;
      let pos = 0;
      const n = items.length;
      track.style.transition = 'transform 1400ms cubic-bezier(.16,1,.3,1)';
      const paint = () => { track.style.transform = 'translateX(-' + (pos * itemW) + 'px)'; };
      if (n > perView) {
        setInterval(() => {
          pos += 1;
          if (pos > n - perView) pos = 0;
          paint();
        }, 3000);
      }
    });
    const lbPrev = this.galleryLb.querySelector('[data-gallery-prev]'), lbNext = this.galleryLb.querySelector('[data-gallery-next]');
    if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showAt(this.galleryIdx - 1); });
    if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); showAt(this.galleryIdx + 1); });
    this.galleryLb.addEventListener('click', (e) => { if (e.target === this.galleryLb) this.closeGalleryLb(); });
    const cl = this.galleryLb.querySelector('[data-gallery-close]');
    if (cl) cl.addEventListener('click', () => this.closeGalleryLb());
    document.addEventListener('keydown', (e) => {
      if (!this.galleryLb || this.galleryLb.style.display !== 'flex') return;
      if (e.key === 'Escape') this.closeGalleryLb();
      else if (e.key === 'ArrowRight') showAt(this.galleryIdx + 1);
      else if (e.key === 'ArrowLeft') showAt(this.galleryIdx - 1);
    });
  }

  hitHeading(x, y) {
    if (this.menuOpen) return null;
    const heads = this.allHeads; if (!heads) return null;
    let best = null, bestOp = 0.6;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const r = h.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const op = this.headOpacity(h);
      if (op > bestOp) { bestOp = op; best = h; }
    }
    return best;
  }

  headOpacity(h) {
    let n = h, op = 1, depth = 0;
    while (n && n !== document.body && depth < 9) {
      const s = getComputedStyle(n);
      if (s.display === 'none' || s.visibility === 'hidden') return 0;
      const o = parseFloat(s.opacity); if (!isNaN(o)) op *= o;
      if (op < 0.02) return 0;
      n = n.parentElement; depth++;
    }
    return op;
  }

  setHeadEl(el) {
    if (el === this.headEl) return;
    if (this.headEl) this.exitHead(this.headEl);
    this.headEl = el;
    if (el) this.enterHead(el);
  }

  enterHead(el) {
    const cs = getComputedStyle(el);
    el._hLineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) || 40;
    el._hRect = el.getBoundingClientRect();
    if (!el._clone) {
      const clone = el.cloneNode(true);
      if (clone.removeAttribute) clone.removeAttribute('data-comment-anchor');
      clone.style.margin = '0';
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.width = el._hRect.width + 'px';
      clone.style.textAlign = cs.textAlign;
      clone.style.pointerEvents = 'none';
      const nodes = [];
      const w = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null);
      let n; while ((n = w.nextNode())) { if (n.nodeValue && n.nodeValue.trim()) nodes.push({ node: n, real: n.nodeValue }); }
      el._cloneNodes = nodes;
      el._clone = clone;
    } else {
      el._clone.style.width = el._hRect.width + 'px';
    }
    this.curLens.appendChild(el._clone);
    const d = Math.round(el._hLineH * 1.5);
    this.curLens.style.width = d + 'px';
    this.curLens.style.height = d + 'px';
    this.curLens.style.borderRadius = '999px';
  }

  exitHead(el) {
    if (el._clone && el._clone.parentNode === this.curLens) this.curLens.removeChild(el._clone);
    if (el._cloneNodes) el._cloneNodes.forEach(o => { o.node.nodeValue = o.real; });
  }

  headScramble(el, decoded) {
    if (!el._cloneNodes) return;
    if (decoded) { el._cloneNodes.forEach(o => { if (o.node.nodeValue !== o.real) o.node.nodeValue = o.real; }); return; }
    const CH = this.CH;
    el._cloneNodes.forEach(o => {
      const r = o.real; let s = '';
      for (let i = 0; i < r.length; i++) { const ch = r[i]; s += (ch === ' ' || ch === '\u00a0' || ch === '\n' || ch === '\t') ? ch : CH[(Math.random() * CH.length) | 0]; }
      o.node.nodeValue = s;
    });
  }

  tickCursor() {
    if (this._curDisabled) return;
    const c = this.cur; if (!c || !c.vis) return;
    c.lx += (c.x - c.lx) * 0.22;
    c.ly += (c.y - c.ly) * 0.22;
    const dx = c.x - c._px, dy = c.y - c._py;
    c._px = c.x; c._py = c.y;
    c.speed += (Math.hypot(dx, dy) - c.speed) * 0.3;
    this.curDot.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px) translate(-50%,-50%)';
    const L = this.curLens, W = L.offsetWidth || 34, H = L.offsetHeight || 34;
    if (c.mode === 'heading' && this.headEl) {
      const el = this.headEl, R = el._hRect, lh = el._hLineH;
      const lines = Math.max(1, Math.round(R.height / lh));
      let li = Math.floor((c.y - R.top) / lh); li = Math.max(0, Math.min(lines - 1, li));
      const cx = c.lx, cy = R.top + li * lh + lh / 2;
      const Ll = cx - W / 2, Lt = cy - H / 2;
      L.style.transform = 'translate(' + Ll + 'px,' + Lt + 'px)';
      if (el._clone) el._clone.style.transform = 'translate(' + (R.left - Ll) + 'px,' + (R.top - Lt) + 'px)';
      c._sf = (c._sf || 0) + 1;
      if (c._sf % 2 === 0) this.headScramble(el, c.speed < 0.8);
    } else {
      L.style.transform = 'translate(' + (c.lx - W / 2) + 'px,' + (c.ly - H / 2) + 'px)';
    }
  }


  componentWillUnmount() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.hrf) cancelAnimationFrame(this.hrf);
    if (this.lrf) cancelAnimationFrame(this.lrf);
    if (this._scrollAnim) cancelAnimationFrame(this._scrollAnim);
    if (this._wheelHandler) window.removeEventListener('wheel', this._wheelHandler);
    if (this._touchStart) window.removeEventListener('touchstart', this._touchStart);
    if (this._touchMove) window.removeEventListener('touchmove', this._touchMove);
    if (this.lenis) this.lenis.destroy();
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    if (this.onScrollNative) window.removeEventListener('scroll', this.onScrollNative);
    if (this.onKey) window.removeEventListener('keydown', this.onKey);
    if (this.onArrowPtr) window.removeEventListener('pointermove', this.onArrowPtr);
    if (this.onArrowLeave) window.removeEventListener('pointerleave', this.onArrowLeave);
    if (this.onMenuKey) window.removeEventListener('keydown', this.onMenuKey);
    if (this._tlMove) window.removeEventListener('pointermove', this._tlMove);
    if (this._tlUp) { window.removeEventListener('pointerup', this._tlUp); window.removeEventListener('pointercancel', this._tlUp); }
    if (this._tlReclamp) window.removeEventListener('resize', this._tlReclamp);
    if (this.tlIrf) cancelAnimationFrame(this.tlIrf);
    if (this._preRAF) cancelAnimationFrame(this._preRAF);
    if (this._preBlock) { window.removeEventListener('wheel', this._preBlock); window.removeEventListener('touchmove', this._preBlock); }
  }

  runPreloader() {
    if (this._preRan) return;
    this._preRan = true;
    let skip = this.props.preloader === false;
    try {
      const q = new URLSearchParams(window.location.search).get('preloader');
      if (q === '0') skip = true;
      else if (q === '1') skip = false;
    } catch (e) {}
    this._urlParams = null;
    try { this._urlParams = new URLSearchParams(window.location.search); } catch (e) {}
    if (skip) {
      this.pre = this.root.querySelector('[data-preloader]');
      if (this.pre) { this.pre.style.display = 'none'; this.pre.style.opacity = '0'; }
      setTimeout(() => this.warmUp(), 1500);
      return;
    }
    this.pre = this.root.querySelector('[data-preloader]');
    if (!this.pre) return;
    this.preS1 = this.pre.querySelector('[data-pre-s1]');
    this.preS2 = this.pre.querySelector('[data-pre-s2]');
    this.preRingText = this.pre.querySelector('[data-pre-ringtext]');
    this.preWave = this.pre.querySelector('[data-pre-wave]');
    this.preArrow = this.pre.querySelector('[data-pre-arrow]');
    this.preVid = this.pre.querySelector('[data-pre-video]');
    this.preVeil = this.pre.querySelector('[data-pre-veil]');
    if (this.preVid) { this.preVid.muted = true; this.preVid.playsInline = true; const p = this.preVid.play(); if (p && p.catch) p.catch(() => {}); }
    if (this.reduced) { this.finishPreloader(true); return; }
    // lock the page at the top while assets prime
    try { window.scrollTo(0, 0); } catch (e) {}
    if (this.lenis) { try { this.lenis.scrollTo(0, { immediate: true }); this.lenis.stop(); } catch (e) {} }
    this._preBlock = (e) => { e.preventDefault(); };
    window.addEventListener('wheel', this._preBlock, { passive: false });
    window.addEventListener('touchmove', this._preBlock, { passive: false });
    this._preProg = 0; this._preTarget = 0; this._preDone = false;
    this._preStart = performance.now();
    this.revealPreName();
    this.preScrambleRAF();
    this.preload().then(() => this.finishPreloader(false));
  }

  preload() {
    this._warm = this._warm || [];
    const imgTask = (src) => new Promise((res) => {
      const im = new Image(); im.decoding = 'async';
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(res); };
      im.onerror = () => res();
      im.src = src; this._warm.push(im); setTimeout(res, 7000);
    });
    const tasks = [];
    const pa = this.props.preloadAssets, p = this.props;
    if (pa.logo && p.logo) tasks.push(imgTask(p.logo));
    if (pa.video && this.bgReady) tasks.push(this.bgReady);
    if (pa.still && p.still) tasks.push(imgTask(p.still));
    if (pa.gallery) p.preloadGallery.forEach((u) => tasks.push(imgTask(u)));
    if (pa.fonts) tasks.push(this.fontsReady(4000));
    if (pa.next) (p.sections.timeline || []).forEach((m) => { if (m.thumb || m.img) tasks.push(imgTask(m.thumb || m.img)); });
    const total = tasks.length; let done = 0;
    this._preMinUntil = performance.now() + 5000;
    return new Promise((resolve) => {
      if (!total) { this._preTarget = 1; return resolve(); }
      tasks.forEach((t) => t.then(() => { done++; this._preTarget = done / total; if (done >= total) resolve(); }));
    });
  }

  // After the reveal: fetch and decode the remaining sections' images in visiting order, a few at a
  // time and only while no section transition is playing, so the first visit to a section never
  // stalls on image decoding.
  warmUp() {
    if (this._warmed || !this.props.preloadAssets.warmup) return;
    this._warmed = true;
    const c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return;
    const S = this.props.sections, urls = [], seen = new Set();
    (this._warm || []).forEach((im) => seen.add(im.src));   // already fetched and decoded by the preloader
    const add = (u) => { if (!u) return; const abs = new URL(u, location.href).href; if (!seen.has(abs)) { seen.add(abs); urls.push(u); } };
    // images already in the page are decoded in place; the rest are fetched
    const dom = (el) => el && el.querySelectorAll('img').forEach((im) => { if (im.complete && im.naturalWidth) { seen.add(im.currentSrc || im.src); if (im.decode) urls.push(im); } else add(im.getAttribute('src')); });
    (S.timeline || []).forEach((m) => add(m.img));
    dom(this.sec3);
    this.sec3 && this.sec3.querySelectorAll('[data-full]').forEach((im) => add(im.dataset.full));
    ((S.playbook && S.playbook.reels) || []).forEach((r) => add(r.img));
    dom(this.sec5);
    dom(this.sec6);
    (S.podcasts || []).forEach((e) => add(e.img));
    this._warm = this._warm || [];
    let i = 0, active = 0;
    const limit = this.isMobile() ? 2 : 4;
    const idle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 600 }) : (f) => setTimeout(f, 60);
    const pump = () => {
      if (this._transPlaying) { setTimeout(pump, 250); return; }
      while (active < limit && i < urls.length) {
        const item = urls[i++]; active++;
        const done = () => { active--; idle(pump); };
        if (typeof item !== 'string') { item.decode().catch(() => {}).then(done); continue; }
        const im = new Image(); im.decoding = 'async';
        im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(done); };
        im.onerror = done;
        im.src = item; this._warm.push(im);
      }
    };
    idle(pump);
  }

  // Web fonts (Zodiak / General Sans) once their async stylesheet and files are in, capped so a slow
  // font host never holds the page.
  fontsReady(cap) {
    if (!this._fontsP) {
      const link = document.getElementById('sh-fonts-css') || document.getElementById('sh-google-fonts-css');
      const sheet = new Promise((r) => {
        if (!link || link.sheet) return r();
        link.addEventListener('load', () => r(), { once: true });
        link.addEventListener('error', () => r(), { once: true });
      });
      this._fontsP = sheet.then(() => {
        if (!document.fonts || !document.fonts.load) return;
        const fam = (el) => getComputedStyle(el).fontFamily;
        return Promise.all([
          document.fonts.load('500 64px ' + fam(this.preS1 || document.body), 'SAADHM'),
          document.fonts.load('400 16px ' + fam(document.body), 'a'),
        ]).then(() => document.fonts.ready);
      }).catch(() => {});
    }
    return Promise.race([this._fontsP, new Promise((r) => setTimeout(r, cap))]);
  }

  // The preloader name stays invisible until the web font is in, then each letter gets a fixed-width
  // cell: the scramble swaps glyphs inside the cells, so the line never re-flows (no layout shift),
  // and the font swap happens before anything is visible.
  revealPreName() {
    const name = this.preS1 && this.preS1.parentElement;
    if (!name) return;
    this.fontsReady(1500).then(() => {
      if (this._preCells) return;
      const spans = [[this.preS1, this.props.firstName], [this.preS2, this.props.lastName]];
      const cells = spans.map(([el, txt]) => {
        if (!el) return [];
        el.textContent = '';
        return txt.toUpperCase().split('').map((ch) => {
          const c = document.createElement('span');
          c.textContent = ch;
          c.style.display = 'inline-block';
          el.appendChild(c);
          return c;
        });
      });
      const widths = cells.map((row) => row.map((c) => c.getBoundingClientRect().width));
      cells.forEach((row, r) => row.forEach((c, i) => { c.style.width = widths[r][i] + 'px'; c.style.textAlign = 'center'; c.style.whiteSpace = 'pre'; }));
      this._preCells = cells;
      name.style.opacity = '1';
    });
  }

  setPreText(first, last) {
    if (!this._preCells) return;
    const [a, b] = this._preCells;
    for (let i = 0; i < a.length; i++) if (a[i].textContent !== first[i]) a[i].textContent = first[i] || '';
    for (let i = 0; i < b.length; i++) if (b[i].textContent !== last[i]) b[i].textContent = last[i] || '';
  }

  preScrambleRAF() {
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@01/';
    const first = this.props.firstName.toUpperCase(), last = this.props.lastName.toUpperCase();
    const full = (first + ' ' + last).split('');
    const len = full.length;
    const step = () => {
      this._preProg += ((this._preTarget || 0) - this._preProg) * 0.09;
      const timeP = (performance.now() - (this._preStart || 0)) / 5200;
      const p = this._preDone ? 1 : Math.min(Math.min(0.999, this._preProg), timeP);
      const lockR = Math.round(p * len);           // resolve left-to-right
      const out = full.map((c, i) => {
        if (c === ' ') return ' ';
        return (i < lockR) ? c : CH[(Math.random() * CH.length) | 0];
      });
      this.setPreText(out.slice(0, first.length), out.slice(first.length + 1));
      // background image reveals (opacity rises) as loading progresses
      if (this.preVeil) this.preVeil.style.opacity = (0.9 - p * 0.9).toFixed(3);
      if (!this._preDone) this._preRAF = requestAnimationFrame(step);
    };
    this._preRAF = requestAnimationFrame(step);
  }

  finishPreloader(instant) {
    const go = () => {
      this._preDone = true; this._preTarget = 1; this._preProg = 1;
      if (this._preRAF) cancelAnimationFrame(this._preRAF);
      this.setPreText(this.props.firstName.toUpperCase().split(''), this.props.lastName.toUpperCase().split(''));
      const name = this.preS1 && this.preS1.parentElement;
      if (name) name.style.opacity = '1';
      // waveform morphs into the scroll arrow, ring text becomes the hero label
      if (this.preWave) this.preWave.style.opacity = '0';
      if (this.preArrow) this.preArrow.style.opacity = '1';
      if (this.preRingText) this.preRingText.textContent = this.props.scrollText;
      this._inputAt = performance.now() + (instant ? 0 : 560) + 350;
      setTimeout(() => this.warmUp(), (instant ? 0 : 560) + 1800);
      setTimeout(() => {
        if (!this.pre) return;
        this.pre.style.opacity = '0';
        this.pre.style.pointerEvents = 'none';
        if (!this.reduced) this.heroIntro();
        if (this._preBlock) { window.removeEventListener('wheel', this._preBlock); window.removeEventListener('touchmove', this._preBlock); this._preBlock = null; }
        if (this.lenis) { try { this.lenis.start(); } catch (e) {} }
        setTimeout(() => { if (this.pre) this.pre.style.display = 'none'; if (this.preVid) { try { this.preVid.pause(); this.preVid.removeAttribute('src'); this.preVid.load(); } catch (e) {} } }, 950);
      }, instant ? 0 : 560);
    };
    if (instant) return go();
    const wait = Math.max(0, (this._preMinUntil || 0) - performance.now());
    setTimeout(go, wait);
  }

  heroIntro() {
    const E = 'cubic-bezier(.16,1,.3,1)';
    this._introLock = true;
    const reveal = (el, dx, dy, dur, delay) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.opacity = '0';
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'opacity ' + dur + 's ' + E + ', transform ' + (dur + 0.2) + 's ' + E;
        el.style.transitionDelay = delay + 'ms';
        el.style.opacity = '1';
        el.style.transform = 'translate(0,0)';
      }));
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.transitionDelay = ''; }, 1600 + delay);
    };
    // background media gallery columns sweep in from the sides
    if (this.colEls && this.colEls.length) {
      const n = this.colEls.length, mid = (n - 1) / 2;
      this.colEls.forEach((col, i) => {
        const fromLeft = i < n / 2;
        col.style.transition = 'none';
        col.style.opacity = '0';
        col.style.transform = 'translateX(' + (fromLeft ? -52 : 52) + 'px)';
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.colEls.forEach((col, i) => {
          col.style.transition = 'opacity 1s ' + E + ', transform 1.2s ' + E;
          col.style.transitionDelay = Math.round(Math.abs(i - mid) * 34) + 'ms';
          col.style.opacity = '1';
          col.style.transform = 'translateX(0)';
        });
      }));
      setTimeout(() => { this.colEls.forEach(col => { col.style.transition = ''; col.style.transform = ''; col.style.transitionDelay = ''; }); }, 2000);
    }
    // top-left logo, top-right CTA/menu group
    const logo = this.header ? this.header.querySelector('a[aria-label]') : null;
    const rightGroup = this.headerCta ? this.headerCta.parentElement : null;
    reveal(logo, -28, 0, 0.8, 120);
    reveal(rightGroup, 28, 0, 0.8, 120);
    // eyebrow fades down into place
    const eb = this.heroTitle ? this.heroTitle.querySelector('[data-eyebrow]') : null;
    reveal(eb, 0, -18, 0.8, 260);
    setTimeout(() => { this._introLock = false; }, 1700);
  }


  layout() {
    const h = window.innerHeight, w = window.innerWidth;
    const REST = h * 0.7, TRANS = h * 1.0;
    this.segs = [];
    let off = 0;
    for (let i = 0; i < this.N; i++) {
      this.segs.push({ type: 'rest', i, start: off, h: REST }); off += REST;
      if (i < this.N - 1) { this.segs.push({ type: 'trans', i, start: off, h: TRANS }); off += TRANS; }
    }
    this.total = off;
    this.loopH = h * 1.6;                       // "return to home" band after the last section
    this.loopStart = this.total;
    this.scrollEnd = this.total + this.loopH;
    this.spacer.style.height = (this.scrollEnd + h) + 'px';   // fixed stage → +1 viewport so the last frame is reachable
    this.restStart = this.segs.filter(s => s.type === 'rest').map(s => s.start);
  }

  readY() {
    if (this.lenis && typeof this.lenis.scroll === 'number') return this.lenis.scroll;
    return window.scrollY || window.pageYOffset || 0;
  }

  segAt(y) {
    for (const s of this.segs) { if (y < s.start + s.h) return s; }
    return this.segs[this.segs.length - 1];
  }




  handle(y) {
    if (this.autoReturn) return;
    y = Math.max(0, Math.min(this.scrollEnd - 1, y));
    if (this.loopStart != null && y >= this.loopStart) { this.handleLoopback(y); return; }
    if (this.inLoop) { this.inLoop = false; this.exitLoopCleanup(); }
    const s = this.segAt(y);
    this.currentSection = s.i;
    this.inTrans = s.type === 'trans';
    if (!this._transPlaying && this.bandKey !== 'r' + s.i) {
      this.bandKey = 'r' + s.i;
      this.idleSection = null;
    }
    this.updateBg(s, y);
    this.updateHero(y);
    this.updateHeaderVis(y);
    this.updateSection2(y);
    this.updateVentures(y);
    this.updateSection4(y);
    this.updateSection5(y);
    this.updateSection6(y);
    this.updateSection7(y);
    this.updateArrow();
  }

  buildTimeline() {
    if (!this.sec2) return;
    this.tlTrack = this.sec2.querySelector('[data-tl-track]');
    this.tlViewport = this.sec2.querySelector('[data-tl-viewport]');
    this.tlModal = this.root.querySelector('[data-tl-modal]');
    if (!this.tlTrack) return;

    let M = this.props.sections.timeline || [];
    this.tlData = M;

    const STEP = 202, PAD = 84, BY = 214;
    const n = M.length;
    const slots = n + 2;                  // one empty lead slot and one empty trailing slot so end items sit clear of both edges
    const trackW = PAD * 2 + (slots - 1) * STEP;
    this.tlTrack.style.width = trackW + 'px';
    const slotX = (s) => PAD + s * STEP;
    const xOf = (i) => slotX(i + 1);      // milestones start after the lead slot
    this.tlTrack.innerHTML = '';

    const base = document.createElement('div');
    base.style.cssText = 'position:absolute;left:0;right:0;top:' + BY + 'px;height:1px;background:linear-gradient(90deg,transparent,var(--line-strong,rgba(255,255,255,.16)) 3%,var(--line-strong,rgba(255,255,255,.16)) 97%,transparent)';
    this.tlTrack.appendChild(base);

    // ruler graduation + faint guide lines between every slot (lead and trailing slots stay bare: no tick, no label)
    for (let s = 0; s < slots - 1; s++) {
      const x0 = slotX(s);
      for (let k = 1; k <= 3; k++) {
        const sx = x0 + (STEP / 4) * k;
        const gt = document.createElement('div');
        gt.style.cssText = 'position:absolute;left:' + sx + 'px;top:' + BY + 'px;width:1px;height:' + (k === 2 ? 7 : 3) + 'px;transform:translateX(-50%);background:var(--line,rgba(255,255,255,.09))';
        this.tlTrack.appendChild(gt);
      }
      const guide = document.createElement('div');
      guide.style.cssText = 'position:absolute;left:' + (x0 + STEP / 2) + 'px;top:' + (BY - 118) + 'px;width:1px;height:118px;transform:translateX(-50%);background:linear-gradient(to bottom,transparent,rgba(255,255,255,.05) 70%,rgba(255,255,255,.07))';
      this.tlTrack.appendChild(guide);
    }

    // milestone markers
    this.tlItems = [];
    M.forEach((m, idx) => {
      const x = xOf(idx);
      const hit = document.createElement('div');
      hit.style.cssText = 'position:absolute;left:' + x + 'px;top:0;width:' + STEP + 'px;height:270px;transform:translateX(-50%);z-index:0;pointer-events:auto;cursor:pointer';
      this.tlTrack.appendChild(hit);
      const tick = document.createElement('div');
      tick.style.cssText = 'position:absolute;left:' + x + 'px;top:' + BY + 'px;width:1px;height:14px;transform:translateX(-50%);background:var(--tx-muted,#a1a1aa)';
      this.tlTrack.appendChild(tick);
      const lab = document.createElement('div');
      lab.textContent = m.y;
      lab.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY + 20) + 'px;transform:translateX(-50%);font-family:var(--font-mono,monospace);font-variant-numeric:tabular-nums;font-size:11px;letter-spacing:.06em;color:var(--tx-muted,#a1a1aa)';
      this.tlTrack.appendChild(lab);
      const thumb = document.createElement('div');
      thumb.setAttribute('data-tl-item', '');
      thumb.style.cssText = 'position:absolute;left:' + x + 'px;top:8px;width:128px;padding-bottom:14px;transform:translateX(-50%) translateY(' + (idx === 0 ? 0 : 10) + 'px);opacity:' + (idx === 0 ? 1 : 0) + ';cursor:pointer;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .42s cubic-bezier(.16,1,.3,1);z-index:2';
      thumb.innerHTML =
        '<div style="position:relative">' +
          '<div style="position:relative;margin-bottom:10px;border-radius:10px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 20px 46px rgba(6,6,8,.5)">' +
            '<img src="' + (m.thumb || m.img) + '" alt="" draggable="false" style="position:relative;top:-6px;width:100%;height:calc(100% + 6px);object-fit:cover;display:block;filter:grayscale(.45) contrast(1.04) brightness(.94);transition:filter .42s cubic-bezier(.16,1,.3,1)">' +
          '</div>' +
          '<button data-tl-plus aria-label="View detail" style="position:absolute;top:9px;right:9px;width:27px;height:27px;border-radius:999px;border:1px solid var(--line-strong,rgba(255,255,255,.14));background:rgba(11,11,12,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:var(--tx,#f4f4f5);font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .3s,transform .3s,border-color .3s">+</button>' +
        '</div>';
      this.tlTrack.appendChild(thumb);

      const dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY - 5) + 'px;width:11px;height:11px;border-radius:999px;transform:translateX(-50%);background:var(--bg,#0b0b0c);border:1px solid var(--line-strong,rgba(255,255,255,.14));transition:background .26s,border-color .26s,box-shadow .26s';
      this.tlTrack.appendChild(dot);

      const cap = document.createElement('div');
      cap.textContent = m.t;
      cap.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY + 37) + 'px;width:' + (STEP - 12) + 'px;transform:translateX(-50%);text-align:center;text-wrap:balance;font-family:var(--font-mono,monospace);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tx-faint,#6b6b73);transition:color .26s';
      this.tlTrack.appendChild(cap);

      const rec = { thumb, dot, cap, imgEl: thumb.querySelector('img'), plus: thumb.querySelector('[data-tl-plus]'), idx };
      this.tlItems.push(rec);

      const paint = (state) => {
        const on = state === 'hover', vis = state !== 'hidden';
        thumb.style.opacity = vis ? '1' : '0';
        thumb.style.pointerEvents = vis ? 'auto' : 'none';
        thumb.style.transform = 'translateX(-50%) translateY(' + (on ? -6 : (vis ? 0 : 10)) + 'px)';
        rec.imgEl.style.filter = on ? 'grayscale(0) contrast(1.05) brightness(1.02)' : 'grayscale(.45) contrast(1.04) brightness(.94)';
        dot.style.background = on ? 'var(--glow,#f6f5f2)' : 'var(--bg,#0b0b0c)';
        dot.style.borderColor = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))';
        dot.style.boxShadow = on ? '0 0 16px var(--glow-soft,rgba(246,245,242,.5))' : 'none';
        cap.style.color = on ? 'var(--tx,#f4f4f5)' : 'var(--tx-faint,#6b6b73)';
        rec.plus.style.background = on ? 'var(--glow,#f6f5f2)' : 'rgba(11,11,12,.6)';
        rec.plus.style.color = on ? 'var(--bg,#0b0b0c)' : 'var(--tx,#f4f4f5)';
        rec.plus.style.borderColor = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))';
      };
      rec.paint = paint;
      const enter = () => this.setTlHover(idx), leave = () => this.setTlHover(null);
      // whole-column hit area drives the hover, so the reveal is easy to navigate
      hit.addEventListener('mouseenter', enter);
      hit.addEventListener('mouseleave', leave);
      hit.addEventListener('click', () => { if (!this.tlMoved) this.openTlModal(idx); });
      thumb.addEventListener('mouseenter', enter);
      thumb.addEventListener('mouseleave', leave);
      const open = (e) => { e.preventDefault(); e.stopPropagation(); if (!this.tlMoved) this.openTlModal(idx); };
      rec.plus.addEventListener('click', open);
      thumb.addEventListener('click', (e) => { if (!this.tlMoved) this.openTlModal(idx); });
    });

    // Sticky first item shows by default; hovering any item hides the first and reveals the hovered one.
    this.setTlHover = (h) => {
      this.tlItems.forEach(r => r.paint(h === r.idx ? 'hover' : (h === null && r.idx === 0 ? 'rest' : 'hidden')));
    };
    if (this.isMobile()) {
      // Mobile: always show center item active
      this._tlCenterIdx = 0;
      this.setTlHover(0);
    } else {
      this.setTlHover(null);
    }

    this.wireTimelineDrag(trackW, xOf(0), STEP);
    this.wireTimelineModal();
  }

  wireTimelineDrag(trackW, firstX, step) {
    const vp = this.tlViewport, track = this.tlTrack;
    if (!vp || !track) return;
    this.tlV = 0; this.tlMoved = false;
    const clamp = (v) => Math.max(Math.min(0, vp.clientWidth - trackW), Math.min(0, v));
    this.tlX = this.isMobile() ? clamp(vp.clientWidth / 2 - firstX) : 0;
    const apply = () => {
      track.style.transform = 'translateX(' + this.tlX + 'px)';
      if (this.isMobile() && this.tlItems && this.tlItems.length) this.highlightCenterTlItem();
    };
    apply();
    let dragging = false, sx = 0, startX = 0, lastX = 0, lastT = 0;
    const stopInertia = () => { if (this.tlIrf) { cancelAnimationFrame(this.tlIrf); this.tlIrf = null; } };
    const inertia = () => {
      this.tlX = clamp(this.tlX + this.tlV);
      this.tlV *= 0.93;
      apply();
      if (Math.abs(this.tlV) > 0.25 && this.tlX < 0 && this.tlX > vp.clientWidth - trackW) this.tlIrf = requestAnimationFrame(inertia);
      else { this.tlIrf = null; if (this.isMobile()) this.snapTlToCenter(firstX, step, trackW); }
    };
    vp.addEventListener('pointerdown', (e) => {
      dragging = true; this.tlMoved = false; stopInertia();
      sx = e.clientX; startX = this.tlX; lastX = e.clientX; lastT = performance.now(); this.tlV = 0;
      vp.style.cursor = 'grabbing';
    });
    this._tlMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) this.tlMoved = true;
      const now = performance.now(), dt = Math.max(8, now - lastT);
      this.tlV = (e.clientX - lastX) / dt * 16;
      lastX = e.clientX; lastT = now;
      this.tlX = clamp(startX + dx); apply();
    };
    this._tlUp = () => {
      if (!dragging) return;
      dragging = false; vp.style.cursor = 'grab';
      if (Math.abs(this.tlV) > 0.4) { stopInertia(); this.tlIrf = requestAnimationFrame(inertia); }
      else if (this.isMobile()) this.snapTlToCenter(firstX, step, trackW);
    };
    window.addEventListener('pointermove', this._tlMove, { passive: true });
    window.addEventListener('pointerup', this._tlUp, { passive: true });
    window.addEventListener('pointercancel', this._tlUp, { passive: true });
    vp.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); stopInertia(); this.tlX = clamp(this.tlX - e.deltaX); apply(); }
    }, { passive: false });
    this._tlReclamp = () => { this.tlX = clamp(this.tlX); apply(); };
    window.addEventListener('resize', this._tlReclamp, { passive: true });
  }

  snapTlToCenter(firstX, step, trackW) {
    if (!this.tlItems || !this.tlItems.length || !this.tlViewport || !this.tlTrack) return;
    const vp = this.tlViewport, track = this.tlTrack;
    const vpCenter = vp.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    this.tlItems.forEach(r => {
      const itemX = this.tlX + firstX + r.idx * step;
      const d = Math.abs(itemX - vpCenter);
      if (d < bestDist) { bestDist = d; best = r.idx; }
    });
    const clamp = (v) => Math.max(Math.min(0, vp.clientWidth - trackW), Math.min(0, v));
    this.tlX = clamp(vpCenter - (firstX + best * step));
    track.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
    track.style.transform = 'translateX(' + this.tlX + 'px)';
    this._tlCenterIdx = best;
    this.tlItems.forEach(r => r.paint(r.idx === best ? 'hover' : 'hidden'));
    clearTimeout(this._tlSnapT);
    this._tlSnapT = setTimeout(() => { track.style.transition = 'none'; }, 520);
  }

  highlightCenterTlItem() {
    if (!this.tlItems || !this.tlViewport) return;
    const vpCenter = this.tlViewport.clientWidth / 2;
    let best = -1, bestDist = Infinity;
    this.tlItems.forEach((r) => {
      const rect = r.thumb.getBoundingClientRect();
      const vpRect = this.tlViewport.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2 - vpRect.left;
      const dist = Math.abs(itemCenter - vpCenter);
      if (dist < bestDist) { bestDist = dist; best = r.idx; }
    });
    if (best !== this._tlCenterIdx) {
      this._tlCenterIdx = best;
      this.tlItems.forEach(r => r.paint(r.idx === best ? 'hover' : 'hidden'));
    }
  }

  wireTimelineModal() {
    const modal = this.tlModal;
    if (!modal) return;
    const scrim = modal.querySelector('[data-tl-modal-scrim]');
    const card = modal.querySelector('[data-tl-modal-card]');
    const closeBtn = modal.querySelector('[data-tl-modal-close]');
    const imgEl = modal.querySelector('[data-tl-modal-img]');
    const ey = modal.querySelector('[data-tl-modal-ey]');
    const title = modal.querySelector('[data-tl-modal-title]');
    const body = modal.querySelector('[data-tl-modal-body]');
    const idxEl = modal.querySelector('[data-tl-modal-idx]');
    const tagEl = modal.querySelector('[data-tl-modal-tag]');
    const cta = modal.querySelector('[data-tl-modal-cta]');
    if (cta) cta.addEventListener('click', (e) => { e.preventDefault(); this.closeTlModal(); this.scrollToLastSection(1.4); });
    // in-popup navigation: prev / next through the milestones
    const metaRow = idxEl.parentElement;
    metaRow.style.alignItems = 'center';
    tagEl.style.display = 'none';
    const nav = document.createElement('div');
    nav.style.cssText = 'display:flex;gap:10px';
    const mkNav = (dir, label, glyph) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', label); b.textContent = glyph;
      b.style.cssText = 'width:40px;height:40px;border-radius:999px;border:1px solid var(--line-strong,rgba(255,255,255,.14));background:rgba(11,11,12,.5);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:var(--tx,#f4f4f5);font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .3s,color .3s,transform .3s';
      b.addEventListener('mouseenter', () => { b.style.background = 'var(--glow,#f6f5f2)'; b.style.color = 'var(--bg,#0b0b0c)'; b.style.transform = 'translateX(' + (dir > 0 ? 2 : -2) + 'px)'; });
      b.addEventListener('mouseleave', () => { b.style.background = 'rgba(11,11,12,.5)'; b.style.color = 'var(--tx,#f4f4f5)'; b.style.transform = 'none'; });
      b.addEventListener('click', (e) => { e.stopPropagation(); this.tlNav(dir); });
      return b;
    };
    nav.appendChild(mkNav(-1, 'Previous milestone', '\u2190'));
    nav.appendChild(mkNav(1, 'Next milestone', '\u2192'));
    metaRow.appendChild(nav);
    this.tlNav = (dir) => {
      const len = this.tlData.length;
      this.tlCurrent = ((this.tlCurrent + dir) % len + len) % len;
      this.openTlModal(this.tlCurrent);
    };
    this._tlEsc = (e) => {
      if (e.key === 'Escape') this.closeTlModal();
      else if (e.key === 'ArrowRight') this.tlNav(1);
      else if (e.key === 'ArrowLeft') this.tlNav(-1);
    };
    this.openTlModal = (i) => {
      const m = this.tlData[i]; if (!m) return;
      this.tlCurrent = i;
      imgEl.src = m.img;
      ey.textContent = 'Milestone \u00b7 ' + m.y + '  \u00b7  ' + m.tag;
      title.textContent = m.t;
      body.textContent = m.d;
      idxEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(this.tlData.length).padStart(2, '0');
      tagEl.textContent = m.tag;
      if (cta) cta.style.display = i === this.tlData.length - 1 ? 'inline-flex' : 'none';
      modal.style.display = 'flex';
      requestAnimationFrame(() => { modal.style.opacity = '1'; if (card) card.style.transform = 'scale(1)'; });
      document.addEventListener('keydown', this._tlEsc);
    };
    this.closeTlModal = () => {
      if (modal.style.display === 'none') return;
      modal.style.opacity = '0'; if (card) card.style.transform = 'scale(.985)';
      document.removeEventListener('keydown', this._tlEsc);
      clearTimeout(this._tlCloseT);
      this._tlCloseT = setTimeout(() => { modal.style.display = 'none'; }, 320);
    };
    if (scrim) scrim.addEventListener('click', () => this.closeTlModal());
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeTlModal());
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--glow,#f6f5f2)'; closeBtn.style.color = 'var(--bg,#0b0b0c)'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'rgba(11,11,12,.55)'; closeBtn.style.color = 'var(--tx,#f4f4f5)'; });
    }
  }

  buildPlaybook() {
    const pbData = this.props.sections.playbook || {};
    let principleTopics = (pbData.principles || []).map((p) => Object.assign({}, p));
    let videoTopics = (pbData.reels || []).map((p) => Object.assign({ open: true }, p));
    // Phones get a shorter wheel: only the topics ticked "Show on mobile" (all of them, no random pick)
    const mobilePick = this.isMobile() && (videoTopics.some(p => p.m) || principleTopics.some(p => p.m));
    const allReels = videoTopics;
    if (mobilePick) { videoTopics = videoTopics.filter(p => p.m); principleTopics = principleTopics.filter(p => p.m); }
    for (let i = principleTopics.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = principleTopics[i]; principleTopics[i] = principleTopics[j]; principleTopics[j] = t; }
    const hiddenTopics = mobilePick ? principleTopics : principleTopics.slice(0, pbData.locked_count == null ? 16 : pbData.locked_count);
    hiddenTopics.forEach(p => { p.open = false; p.img = p.img || (allReels.length ? allReels[Math.floor(Math.random() * allReels.length)].img : ''); p.embed = null; });
    this.pbTopics = videoTopics.concat(hiddenTopics);
    this.pbs = [];
    for (let i = this.pbTopics.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = this.pbTopics[i]; this.pbTopics[i] = this.pbTopics[j]; this.pbTopics[j] = t; }
    if (this.sec4) this.pbs.push(this.makePlaybook(this.sec4, 3));
    this.pbMove = (e) => {
      const inst = this.activeInst; if (!inst || !inst.drag) return;
      if (this.isMobile()) {
        // Mobile: horizontal drag only — map deltaX to rotation
        const dx = e.clientX - (inst._lastX || e.clientX);
        inst._lastX = e.clientX;
        const deg = dx * 0.5;
        inst.rot += deg; inst.vel = deg;
        if (Math.abs(dx) > 2) inst.moved = true;
      } else {
        const a = Math.atan2(e.clientY - inst.cy, e.clientX - inst.cx);
        let d = a - inst.lastA;
        if (d > Math.PI) d -= 2 * Math.PI; else if (d < -Math.PI) d += 2 * Math.PI;
        const deg = d * 180 / Math.PI;
        inst.rot += deg; inst.vel = deg; inst.lastA = a;
        if (Math.abs(deg) > 0.15) inst.moved = true;
      }
    };
    this.pbUp = () => { const inst = this.activeInst; if (inst) { inst.drag = false; inst.cluster.style.cursor = 'grab'; } this.activeInst = null; };
    window.addEventListener('pointermove', this.pbMove, { passive: true });
    window.addEventListener('pointerup', this.pbUp, { passive: true });
    window.addEventListener('pointercancel', this.pbUp, { passive: true });
  }

  makePlaybook(sec, sectionIndex) {
    const lockSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
    const inst = {
      sec, sectionIndex,
      cluster: sec.querySelector('[data-pb-cluster]'),
      card: sec.querySelector('[data-pb-card]'),
      expand: sec.querySelector('[data-pb-expand]'),
      heading: sec.querySelector('[data-pb-heading]'),
      headingTr: sec.querySelector('[data-pb-heading-tr]'),
      cta: sec.querySelector('[data-pb-cta]'),
      hoverPreview: sec.querySelector('[data-pb-hover-preview]'),
      hoverImg: sec.querySelector('[data-pb-hover-img]'),
      hoverLock: sec.querySelector('[data-pb-hover-lock]'),
      mediaImg: sec.querySelector('[data-pb-media-img]'),
      mediaPlay: sec.querySelector('[data-pb-media-play]'),
      mediaIcon: sec.querySelector('[data-pb-media-icon]'),
      mediaFrame: sec.querySelector('[data-pb-media-frame]'),
      hover: -1, selected: null, mode: 'center',
      rot: 0, vel: 0, rotTarget: null, cx: null, cy: null, tx: 0, ty: 0, R: 0,
      drag: false, moved: false, lastA: 0, visible: false, items: []
    };
    inst.group = document.createElement('div');
    inst.group.style.cssText = 'position:absolute;left:0;top:0;will-change:transform';
    inst.cluster.appendChild(inst.group);
    const N = this.pbTopics.length;
    inst.items = this.pbTopics.map((tp, i) => {
      const base = i * (360 / N);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0';
      const dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;left:-2.5px;top:-2.5px;width:5px;height:5px;border-radius:50%;background:' + (tp.open ? 'rgba(246,245,242,.9)' : 'rgba(255,255,255,.18)') + ';transition:background 200ms,box-shadow 200ms';
      const span = document.createElement('div');
      span.style.cssText = "position:absolute;left:0;top:0;margin-top:-.5em;line-height:1;white-space:nowrap;font-family:var(--font-body,sans-serif);font-weight:400;font-size:17px;letter-spacing:.05em;cursor:pointer;transform-origin:0 50%;display:flex;align-items:center;gap:7px;transition:color 200ms";
      const label = document.createElement('span');
      label.textContent = tp.t;
      const lock = document.createElement('span');
      lock.innerHTML = lockSvg;
      lock.style.cssText = 'display:inline-flex;opacity:0;transition:opacity 200ms;color:rgba(244,244,245,.7)';
      span.setAttribute('data-pb-topic', '');
      span.appendChild(label); span.appendChild(lock);
      wrap.appendChild(dot); wrap.appendChild(span);
      inst.group.appendChild(wrap);
      span.addEventListener('pointerenter', () => { inst.hover = i; this.showPbHoverPreview(inst, tp); });
      span.addEventListener('pointerleave', () => { if (inst.hover === i) inst.hover = -1; this.hidePbHoverPreview(inst); });
      span.addEventListener('click', (e) => { e.stopPropagation(); if (!inst.moved) this.selectTopic(inst, i); });
      return { wrap, span, lock, base, phase: i * 0.5, open: tp.open };
    });
    this.layoutPb(inst);
    inst.cx = inst.tx; inst.cy = inst.ty;
    inst.cluster.addEventListener('pointerdown', (e) => {
      inst.moved = false;
      // phones: only touches inside the wheel turn it (full circle when centred, the half circle at
      // the bottom when docked); everywhere else the screen taps and scrolls normally
      if (this.isMobile() && Math.hypot(e.clientX - inst.cx, e.clientY - inst.cy) > inst.R * (inst.mode === 'left' ? 0.8 : 0.95)) return;
      inst.drag = true; inst.rotTarget = null; inst.vel = 0;
      inst.lastA = Math.atan2(e.clientY - inst.cy, e.clientX - inst.cx);
      inst._lastX = e.clientX;
      inst.cluster.style.cursor = 'grabbing'; this.activeInst = inst;
    });
    inst.expand.addEventListener('click', () => this.setPbMode(inst, 'center'));
    inst.mediaPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const tp = inst.selected != null ? this.pbTopics[inst.selected] : null;
      if (!tp || !tp.open || !tp.embed) return;
      if (this.isMobile()) {
        this.openPbVideoFullscreen(tp.embed);
        return;
      }
      inst.mediaFrame.src = 'https://www.instagram.com/reel/' + tp.embed + '/embed';
      inst.mediaFrame.style.display = 'block';
      inst.mediaImg.style.display = 'none';
      inst.mediaPlay.style.display = 'none';
    });
    return inst;
  }

  showPbHoverPreview(inst, tp) {
    if (!inst.hoverPreview) return;
    if (tp.img) inst.hoverImg.src = tp.img; else inst.hoverImg.removeAttribute('src');
    inst.hoverImg.style.filter = tp.open ? 'none' : 'blur(9px) brightness(.7)';
    inst.hoverLock.style.display = tp.open ? 'none' : 'flex';
    inst.hoverPreview.style.opacity = '1';
    inst.hoverPreview.style.transform = 'translate(-50%,-50%) scale(1)';
  }

  hidePbHoverPreview(inst) {
    if (!inst.hoverPreview) return;
    inst.hoverPreview.style.opacity = '0';
    inst.hoverPreview.style.transform = 'translate(-50%,-50%) scale(.94)';
  }

  layoutPb(inst) {
    const W = window.innerWidth, H = window.innerHeight;
    const mob = this.isMobile();
    inst.R = mob ? Math.min(W, H) * 0.34 : Math.min(W, H) * 0.39;
    inst.items.forEach(it => { it.wrap.style.transform = 'rotate(' + it.base + 'deg) translate(' + inst.R + 'px,0)'; });
    const center = inst.mode !== 'left';
    if (mob) {
      inst.tx = W / 2;
      inst.ty = center ? H / 2 : H;
      // No clip needed — cluster center at screen bottom, only top half visible naturally
      inst.cluster.style.clipPath = 'none';
      inst.cluster.style.webkitClipPath = 'none';
      inst.cluster.style.overflow = 'visible';
    } else {
      inst.tx = center ? W / 2 : Math.round(W * 0.02);
      inst.ty = H / 2;
    }
  }

  tickPlaybook(now) {
    if (!this.pbs) return;
    const t = now * 0.001;
    for (const inst of this.pbs) this.tickOne(inst, t);
  }

  tickOne(inst, t) {
    inst.cx += (inst.tx - inst.cx) * 0.12;
    inst.cy += (inst.ty - inst.cy) * 0.12;
    if (inst.rotTarget != null && !inst.drag) {
      let d = inst.rotTarget - inst.rot; inst.rot += d * 0.1;
      if (Math.abs(d) < 0.05) { inst.rot = inst.rotTarget; inst.rotTarget = null; }
    } else if (!inst.drag) {
      inst.rot += inst.vel; inst.vel *= 0.94; if (Math.abs(inst.vel) < 0.002) inst.vel = 0;
    }
    const gtf = 'translate(' + inst.cx.toFixed(1) + 'px,' + inst.cy.toFixed(1) + 'px) rotate(' + inst.rot.toFixed(2) + 'deg)';
    if (inst._gtf !== gtf) { inst._gtf = gtf; inst.group.style.transform = gtf; }
    for (let i = 0; i < inst.items.length; i++) {
      const it = inst.items[i];
      // every topic reads from its dot outwards, like rays (no 180° flip on the left half)
      const breath = 8 + Math.sin(t * 0.9 + it.phase) * 4;
      const hov = inst.hover === i, sel = inst.selected === i;
      const sc = hov ? 1.28 : sel ? 1.18 : 1;
      const st = it.span.style, sv = it._sv || (it._sv = {});
      const org = '0 50%';
      const tf = 'translateX(' + breath.toFixed(1) + 'px) scale(' + sc + ')';
      const col = it.open ? 'var(--glow,#f6f5f2)' : (hov ? 'var(--glow,#f6f5f2)' : 'rgba(244,244,245,.34)');
      const op = (it.open || hov || sel) ? '1' : '0.85';
      const sh = (it.open && (hov || sel)) ? '0 0 18px rgba(255,255,255,.24)' : 'none';
      const lk = (!it.open && hov) ? '1' : '0';
      if (sv.org !== org) { sv.org = org; st.transformOrigin = org; }
      if (sv.tf !== tf) { sv.tf = tf; st.transform = tf; }
      if (sv.col !== col) { sv.col = col; st.color = col; }
      if (sv.op !== op) { sv.op = op; st.opacity = op; }
      if (sv.sh !== sh) { sv.sh = sh; st.textShadow = sh; }
      if (sv.lk !== lk) { sv.lk = lk; it.lock.style.opacity = lk; }
    }
    // In sticky (left) reading mode, the topic rotated to the center (pointing at the card)
    // auto-populates the right box, so rotating the wheel skims through playbook items.
    if (inst.mode === 'left' && inst.items.length) {
      // On mobile, active topic is at top (90°); on desktop, at right (0°)
      const activeAngle = this.isMobile() ? -90 : 0;
      let best = 0, bestD = 999;
      for (let i = 0; i < inst.items.length; i++) {
        const abs = (((inst.items[i].base + inst.rot) - activeAngle) % 360 + 360) % 360;
        const d = Math.min(abs, 360 - abs);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best !== inst.selected) { inst.selected = best; this.fillPbCard(inst, best); }
    }
  }

  fillPbCard(inst, i) {
    const tp = this.pbTopics[i];
    inst.cta.style.display = tp.open ? 'none' : 'inline-flex';
    inst.mediaFrame.removeAttribute('src');
    inst.mediaFrame.style.display = 'none';
    inst.mediaImg.style.display = 'block';
    if (tp.img) inst.mediaImg.src = tp.img; else inst.mediaImg.removeAttribute('src');
    inst.mediaImg.style.filter = tp.open ? 'none' : 'blur(10px) brightness(.65)';
    inst.mediaPlay.style.display = 'flex';
    inst.mediaPlay.style.cursor = tp.open ? 'pointer' : 'default';
    if (tp.open) {
      inst.mediaIcon.innerHTML = '<path d="M8 5v14l11-7z"></path>';
    } else {
      inst.mediaIcon.setAttribute('fill', 'none');
      inst.mediaIcon.setAttribute('stroke', 'var(--glow,#f6f5f2)');
      inst.mediaIcon.setAttribute('stroke-width', '1.8');
      inst.mediaIcon.innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    }
    if (tp.open) { inst.mediaIcon.setAttribute('fill', 'var(--glow,#f6f5f2)'); inst.mediaIcon.setAttribute('stroke', 'none'); }
  }

  openPbVideoFullscreen(embedId) {
    let lb = document.getElementById('_pb-video-lb');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = '_pb-video-lb';
      lb.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(3,4,5,.95);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)';
      const close = document.createElement('button');
      close.style.cssText = 'position:absolute;top:16px;right:16px;z-index:3;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(11,11,12,.6);color:#f4f4f5;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer';
      close.innerHTML = '✕';
      close.addEventListener('click', () => { lb.style.display = 'none'; const f = lb.querySelector('iframe'); if (f) f.src = ''; });
      const wrap = document.createElement('div');
      wrap.style.cssText = 'width:min(400px,92vw);aspect-ratio:9/16;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.08)';
      const frame = document.createElement('iframe');
      frame.style.cssText = 'width:calc(100% + 20px);height:100%;border:0;display:block';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      wrap.appendChild(frame);
      lb.appendChild(close);
      lb.appendChild(wrap);
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => { if (e.target === lb) { lb.style.display = 'none'; frame.src = ''; } });
    }
    const frame = lb.querySelector('iframe');
    frame.src = 'https://www.instagram.com/reel/' + embedId + '/embed';
    lb.style.display = 'flex';
  }

  selectTopic(inst, i) {
    const tp = this.pbTopics[i];
    inst.selected = i;
    // On mobile, pin to top center (90° offset); on desktop, pin to right (0°)
    const targetBase = this.isMobile() ? -inst.items[i].base - 90 : -inst.items[i].base;
    inst.rotTarget = this.nearestRot(inst, targetBase);
    this.setPbMode(inst, 'left');
    this.fillPbCard(inst, i);
    inst.card.style.opacity = '1';
    inst.card.style.transform = this.isMobile() ? 'translateX(0) translateY(0)' : 'translateY(-50%) translateX(0)';
    inst.card.style.pointerEvents = 'auto';
  }

  nearestRot(inst, target) {
    let r = target;
    while (r - inst.rot > 180) r -= 360;
    while (r - inst.rot < -180) r += 360;
    return r;
  }

  setPbMode(inst, m) {
    inst.mode = m;
    this.layoutPb(inst);
    const left = m === 'left';
    const mob = this.isMobile();
    inst.expand.style.opacity = left ? '1' : '0';
    inst.expand.style.pointerEvents = left ? 'auto' : 'none';
    inst.expand.style.transform = mob ? (left ? 'scale(1)' : 'scale(.82)') : (left ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(.82)');
    if (inst.heading) {
      inst.heading.style.opacity = left ? '0' : '1';
      inst.heading.style.transform = left ? 'translate(-50%,-50%) scale(.94)' : 'translate(-50%,-50%) scale(1)';
    }
    if (inst.headingTr) {
      inst.headingTr.style.opacity = left ? '1' : '0';
      inst.headingTr.style.transform = left ? 'translateY(0)' : 'translateY(-10px)';
    }
    if (!left) {
      inst.selected = null;
      inst.card.style.opacity = '0';
      inst.card.style.transform = mob ? 'translateX(0) translateY(-12px)' : 'translateY(-50%) translateX(24px)';
      inst.card.style.pointerEvents = 'none';
    }
  }

  updatePb(inst, y) {
    if (!inst || !this.segs) return;
    const seg = this.segs.find(s => s.type === 'rest' && s.i === inst.sectionIndex);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    inst.sec.style.opacity = o.toFixed(3); inst.sec.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    inst.sec.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    inst.visible = o > 0.05;
    inst.cluster.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    if (o > 0.5 && !inst._entered) { inst._entered = true; this.animPbEnter(inst); }
    if (o < 0.05) inst._entered = false;
  }

  updateSection4(y) { if (this.pbs && this.pbs[0]) this.updatePb(this.pbs[0], y); }

  buildVentures() {
    if (!this.sec3) return;
    this.vSlides = Array.from(this.sec3.querySelectorAll('[data-vslide]'));
    this.vDots = Array.from(this.sec3.querySelectorAll('[data-vdot]'));
    this.vCur = this.sec3.querySelector('[data-vcur]');
    this.vN = this.vSlides.length;
    this.vIndex = 0;
    this.vSlides.forEach((sl, i) => sl.addEventListener('click', (e) => { if (e.target.closest('a')) return; }));
    this.vDots.forEach(d => {
      const idx = +d.getAttribute('data-i');
      const n = d.querySelector('[data-vdot-n]');
      d.addEventListener('click', () => this.setVenture(idx));
      d.addEventListener('mouseenter', () => { if (this.vIndex !== idx && n) { n.style.color = 'var(--tx,#f4f4f5)'; } });
      d.addEventListener('mouseleave', () => { if (this.vIndex !== idx && n) { n.style.color = 'var(--tx-faint,#6b6b73)'; } });
    });
    const prev = this.sec3.querySelector('[data-vprev]');
    const next = this.sec3.querySelector('[data-vnext]');
    if (prev) prev.addEventListener('click', () => this.setVenture((this.vIndex - 1 + this.vN) % this.vN));
    if (next) next.addEventListener('click', () => this.setVenture((this.vIndex + 1) % this.vN));
    if (this.isMobile()) {
      let vsx = null, vsy = null, vDir = null, vFired = false;
      this.sec3.addEventListener('touchstart', (e) => { vsx = e.touches[0].clientX; vsy = e.touches[0].clientY; vDir = null; vFired = false; }, { passive: true });
      this.sec3.addEventListener('touchmove', (e) => {
        if (vsx === null) return;
        const dx = e.touches[0].clientX - vsx, dy = e.touches[0].clientY - vsy;
        if (vDir === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) vDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (vDir === 'x') {
          e.stopPropagation();
          if (!vFired && Math.abs(dx) > 40) {
            vFired = true;
            if (dx < 0) this.setVenture((this.vIndex + 1) % this.vN); else this.setVenture((this.vIndex - 1 + this.vN) % this.vN);
          }
        }
      }, { passive: true });
      this.sec3.addEventListener('touchend', () => { vsx = null; }, { passive: true });
    }
    this.setVenture(0);
  }

  setVenture(i) {
    if (!this.vSlides) return;
    this.vIndex = i;
    this.vSlides.forEach((sl, k) => {
      const on = k === i;
      sl.style.opacity = on ? '1' : '0';
      sl.style.pointerEvents = on ? 'auto' : 'none';
      sl.style.zIndex = on ? '2' : '1';
      const inner = sl.querySelector('[data-vinner]');
      if (inner) { inner.style.opacity = on ? '1' : '0'; inner.style.transform = on ? 'translateX(0)' : 'translateX(36px)'; }
      const lk = sl.querySelector('a'); if (lk) lk.style.pointerEvents = on ? 'auto' : 'none';
      sl.querySelectorAll('image-slot').forEach(s => { s.style.pointerEvents = on ? 'auto' : 'none'; });
    });
    const mob = this.isMobile();
    this.vDots.forEach((d, k) => {
      const on = k === i;
      if (mob) { d.style.display = on ? 'flex' : 'none'; }
      const n = d.querySelector('[data-vdot-n]'), l = d.querySelector('[data-vdot-l]');
      if (n) { n.style.color = on ? 'var(--glow,#f6f5f2)' : 'var(--tx-faint,#6b6b73)'; n.style.transition = 'color 260ms,font-size 300ms cubic-bezier(.16,1,.3,1)'; n.style.fontSize = on ? '15px' : '11px'; }
      if (l) { l.style.width = on ? '46px' : '20px'; l.style.background = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))'; }
    });
    if (this.vCur) this.vCur.textContent = String(i + 1).padStart(2, '0');
    if (this.motion) this.motion.venture();
  }

  updateVentures(y) {
    if (!this.sec3 || !this.segs) return;
    const seg = this.segs.find(s => s.type === 'rest' && s.i === 2);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    this.sec3.style.opacity = o.toFixed(3); this.sec3.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    this.sec3.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    this.sec3.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }

  buildPods() {
    if (!this.sec5) return;
    this.podData = this.props.sections.podcasts || [];
    this.pods = Array.from(this.sec5.querySelectorAll('[data-pod-card]')).map(el => ({ el }));
    this.podN = this.pods.length;
    this.podP = 0; this.podTarget = 0; this.podCenter = -1;
    this.podSpeed = 1; this.podSpeedMult = { 1: 1, 2: 2, 3: 3.4 };
    this.podTitle = this.sec5.querySelector('[data-pod-title]');
    this.podSrc = this.sec5.querySelector('[data-pod-src]');
    this.podDesc = this.sec5.querySelector('[data-pod-desc]');
    this.podProg = this.sec5.querySelector('[data-pod-prog]');
    this.podSpeedBtn = this.sec5.querySelector('[data-pod-speed]');
    this.podLightbox = this.sec5.querySelector('[data-pod-lightbox]');
    this.podFrame = this.sec5.querySelector('[data-pod-frame]');
    this.podPoster = this.sec5.querySelector('[data-pod-poster]');
    this.sec5.querySelector('[data-pod-lightbox-play]').addEventListener('click', () => this.playPod());
    this.pods.forEach((p, i) => p.el.addEventListener('click', () => {
      if (this.podMoved) return;
      if (i === this.podCenter) { this.openPod(); return; }
      this.podInertia = false; this.podTarget = this.nearestPodTarget(i);
    }));
    const ring = this.sec5.querySelector('[data-pod-ring]');
    ring.style.cursor = 'grab';
    ring.addEventListener('pointerdown', (e) => { this.podDrag = true; this.podMoved = false; this.podInertia = false; this.podVel = 0; this.podDragX = e.clientX; this.podDragStart = this.podP; ring.style.cursor = 'grabbing'; });
    this.podMove = (e) => { if (!this.podDrag) return; const dx = e.clientX - this.podDragX; if (Math.abs(dx) > 4) this.podMoved = true; const spacing = Math.min(window.innerWidth * 0.14, 190); const prev = this.podP; this.podP = this.podDragStart - (dx / spacing) * this.podSpeedMult[this.podSpeed]; this.podVel = this.podP - prev; this.podTarget = this.podP; };
    this.podUp = () => { if (!this.podDrag) return; this.podDrag = false; ring.style.cursor = 'grab'; const v = Math.max(-0.6, Math.min(0.6, this.podVel)); if (Math.abs(v) > 0.01) { this.podInertia = true; this.podInertiaV = v; } else { this.podTarget = Math.round(this.podP); } };
    window.addEventListener('pointermove', this.podMove, { passive: true });
    window.addEventListener('pointerup', this.podUp, { passive: true });
    window.addEventListener('pointercancel', this.podUp, { passive: true });
    this.sec5.querySelector('[data-pod-prev]').addEventListener('click', () => { this.podInertia = false; this.podTarget = Math.round(this.podTarget) - 1; });
    this.sec5.querySelector('[data-pod-next]').addEventListener('click', () => { this.podInertia = false; this.podTarget = Math.round(this.podTarget) + 1; });
    this.sec5.querySelector('[data-pod-play]').addEventListener('click', () => this.openPod());
    this.sec5.querySelector('[data-pod-close]').addEventListener('click', () => this.closePod());
    this.podLightbox.addEventListener('click', (e) => { if (e.target === this.podLightbox) this.closePod(); });
    this.podSpeedBtn.addEventListener('click', () => {
      this.podSpeed = this.podSpeed >= 3 ? 1 : this.podSpeed + 1;
      this.podSpeedBtn.textContent = this.podSpeed + 'x';
    });
    const track = this.sec5.querySelector('[data-pod-track]');
    track.addEventListener('click', (e) => { const r = track.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; this.podInertia = false; this.podTarget = Math.round(f * this.podN); });
    this.positionPods();
  }

  nearestPodTarget(i) {
    let t = i; const n = this.podN;
    while (t - this.podP > n / 2) t -= n;
    while (t - this.podP < -n / 2) t += n;
    return t;
  }

  tickPods() {
    if (!this.pods) return;
    if (this.podDrag) { this.positionPods(); return; }
    if (this.podInertia) {
      this.podP += this.podInertiaV;
      this.podInertiaV *= 0.92;
      if (Math.abs(this.podInertiaV) < 0.004) { this.podInertia = false; this.podTarget = Math.round(this.podP); }
    } else {
      this.podP += (this.podTarget - this.podP) * 0.12;
    }
    this.positionPods();
  }

  positionPods() {
    const n = this.podN;
    const mob = this.isMobile();
    const maxVis = mob ? 2.8 : 3.4;
    for (let i = 0; i < n; i++) {
      let a = i - this.podP;
      a = ((a % n) + n) % n; if (a > n / 2) a -= n;
      const el = this.pods[i].el;
      const ab = Math.abs(a);
      if (ab > maxVis) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; continue; }
      const spacing = mob ? Math.min(window.innerWidth * 0.22, 130) : Math.min(window.innerWidth * 0.14, 190);
      const x = a * spacing;
      const ry = mob ? Math.max(-50, Math.min(50, -a * 26)) : Math.max(-60, Math.min(60, -a * 24));
      const z = -ab * (mob ? 28 : 46);
      const sc = mob ? 1 + Math.min(0.5, ab * 0.12) : 1 + Math.min(0.75, ab * 0.17);
      el.style.transform = 'translate(-50%,-50%) translateX(' + x + 'px) translateZ(' + z + 'px) rotateY(' + ry + 'deg) scale(' + sc + ')';
      const fadeStart = mob ? 2.2 : 2.7;
      const fadeRange = mob ? 0.6 : 0.7;
      el.style.opacity = ab > fadeStart ? String(Math.max(0, 1 - (ab - fadeStart) / fadeRange)) : '1';
      el.style.pointerEvents = ab < maxVis ? 'auto' : 'none';
      el.style.zIndex = String(100 - Math.round(ab * 10));
    }
    const ci = ((Math.round(this.podP) % n) + n) % n;
    if (ci !== this.podCenter) {
      if (this.podCenter >= 0 && this.pods[this.podCenter]) this.pods[this.podCenter].el.style.borderColor = 'rgba(255,255,255,.08)';
      this.podCenter = ci;
      if (this.pods[ci]) this.pods[ci].el.style.borderColor = 'rgba(212,175,55,.45)';
      this.updatePodInfo(ci);
    }
    if (this.podProg) this.podProg.style.width = ((((this.podP % n) + n) % n) / n * 100).toFixed(2) + '%';
  }

  updatePodInfo(i) {
    const d = this.podData[i]; if (!d) return;
    if (this.podTitle) this.podTitle.textContent = d.t;
    if (this.podSrc) this.podSrc.textContent = d.src;
    if (this.podDesc) this.podDesc.textContent = d.d;
  }

  openPod() {
    const d = this.podData[this.podCenter]; if (!d || !this.podFrame) return;
    if (this.podPoster) { if (d.img) this.podPoster.src = d.img; else this.podPoster.removeAttribute('src'); this.podPoster.style.display = 'block'; }
    const playBtn = this.sec5.querySelector('[data-pod-lightbox-play]');
    if (playBtn) playBtn.style.display = 'flex';
    this.podFrame.removeAttribute('src');
    this.podFrame.style.display = 'none';
    this.podLightbox.style.display = 'flex';
  }
  playPod() {
    const d = this.podData[this.podCenter]; if (!d || !this.podFrame) return;
    this.podFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    this.podFrame.src = ytEmbed(d.yt);
    this.podFrame.style.display = 'block';
    if (this.podPoster) this.podPoster.style.display = 'none';
    const playBtn = this.sec5.querySelector('[data-pod-lightbox-play]');
    if (playBtn) playBtn.style.display = 'none';
  }
  closePod() {
    if (this.podFrame) { this.podFrame.removeAttribute('src'); this.podFrame.style.display = 'none'; }
    if (this.podLightbox) this.podLightbox.style.display = 'none';
  }

  updateSection5(y) {
    if (!this.sec5 || !this.segs) return;
    const seg = this.segs.find(s => s.type === 'rest' && s.i === 4);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    this.sec5.style.opacity = o.toFixed(3); this.sec5.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    this.sec5.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    this.podVisible = o > 0.05;
    this.sec5.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    this.sec5.style.zIndex = o > 0.5 ? '4' : '3';
    if (o > 0.5 && !this._sec5Entered) { this._sec5Entered = true; this.animPodEnter(); }
    if (o < 0.05) this._sec5Entered = false;
  }

  buildTestis() {
    if (!this.sec6) return;
    this.testiStats = this.props.sections.receipts_stats || {};
    this.testiCols = Array.from(this.sec6.querySelectorAll('[data-testi-col]')).map(el => ({
      el, track: el.querySelector('[data-testi-track]'), side: el.getAttribute('data-side'),
      pos: 0, half: 0, hover: false, drag: false, lastY: 0, vel: 0
    }));
    this.testiCols.forEach(c => {
      c.half = c.track.scrollHeight / 2;
      c.pos = c.side === 'right' ? c.half * 0.5 : 0;
      c.el.addEventListener('mouseenter', () => c.hover = true);
      c.el.addEventListener('mouseleave', () => c.hover = false);
      c.el.addEventListener('pointerdown', (e) => { c.drag = true; this.testiDrag = true; c.lastY = e.clientY; c.lastX = e.clientX; c.el.style.cursor = 'grabbing'; });
      window.addEventListener('pointermove', (e) => { if (!c.drag) return; const mob = this.isMobile(); const delta = mob ? (e.clientX - c.lastX) : (e.clientY - c.lastY); c.lastY = e.clientY; c.lastX = e.clientX; const dir = c.side === 'left' ? -1 : 1; const mult = mob ? 2.5 : 1; c.pos += dir * delta * mult; c.vel = dir * delta * mult; });
      const end = () => { if (c.drag) { c.drag = false; this.testiDrag = false; c.el.style.cursor = 'grab'; } };
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    });
    // Mobile: merge both columns into one rightward marquee + prevent section-jump on horizontal swipe
    if (this.isMobile()) {
      let tsx = null, tsy = null, tDir = null;
      this.sec6.addEventListener('touchstart', (e) => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; tDir = null; }, { passive: true });
      this.sec6.addEventListener('touchmove', (e) => {
        if (tsx === null) return;
        const dx = e.touches[0].clientX - tsx, dy = e.touches[0].clientY - tsy;
        if (tDir === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) tDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (tDir === 'x') e.stopPropagation();
      }, { passive: true });
      this.sec6.addEventListener('touchend', () => { tsx = null; }, { passive: true });
    }
    if (this.isMobile() && this.testiCols.length === 2) {
      const left = this.testiCols.find(c => c.side === 'left');
      const right = this.testiCols.find(c => c.side === 'right');
      if (left && right) {
        const leftCards = Array.from(left.track.querySelectorAll('[data-testi-card]'));
        const rightCards = Array.from(right.track.querySelectorAll('[data-testi-card]'));
        const leftUnique = leftCards.slice(0, Math.ceil(leftCards.length / 2));
        const rightUnique = rightCards.slice(0, Math.ceil(rightCards.length / 2));
        left.track.innerHTML = '';
        const allUnique = [...leftUnique, ...rightUnique];
        allUnique.forEach(c => left.track.appendChild(c));
        allUnique.forEach(c => left.track.appendChild(c.cloneNode(true)));
        right.el.style.display = 'none';
        left.side = 'right';
        left.half = left.track.scrollWidth / 2;
        left.pos = 0;
        this.testiCols = [left];
      }
    }
    // 3D tilt on cards
    this.sec6.querySelectorAll('[data-testi-card]').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        if (this.testiDrag) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY(' + (px * 18) + 'deg) rotateX(' + (-py * 18) + 'deg) translateZ(12px)';
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });
    // platform toggle
    this.testiPlat = null;
    this.testiPlatBtns = Array.from(this.sec6.querySelectorAll('[data-testi-plat]'));
    this.testiPlatBtns.forEach(b => b.addEventListener('click', () => this.setTestiPlat(b.getAttribute('data-p'))));
    this.testiStatEls = Array.from(this.sec6.querySelectorAll('[data-testi-stats] > div'));
    // lightbox
    this.testiLb = this.sec6.querySelector('[data-testi-lightbox]');
    this.testiFrame = this.sec6.querySelector('[data-testi-frame]');
    this.sec6.querySelectorAll('[data-testi-play]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.openTesti(b.getAttribute('data-yt')); }));
    this.sec6.querySelector('[data-testi-close]').addEventListener('click', () => this.closeTesti());
    this.testiLb.addEventListener('click', (e) => { if (e.target === this.testiLb) this.closeTesti(); });
    this.onResize2 = () => { this.testiCols.forEach(c => c.half = this.isMobile() ? c.track.scrollWidth / 2 : c.track.scrollHeight / 2); };
    window.addEventListener('resize', this.onResize2, { passive: true });
  }

  setTestiPlat(p) {
    this.testiPlat = (this.testiPlat === p) ? null : p;
    this.testiPlatBtns.forEach(b => {
      const on = b.getAttribute('data-p') === this.testiPlat;
      b.style.color = on ? 'var(--ink-900,#030405)' : 'var(--tx-faint,#6b6b73)';
      b.style.background = on ? 'var(--glow,#f6f5f2)' : 'rgba(3,4,5,.4)';
      b.style.borderColor = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))';
    });
    this.sec6.querySelectorAll('[data-testi-card]').forEach(c => {
      const match = !this.testiPlat || c.getAttribute('data-plat') === this.testiPlat;
      c.style.opacity = match ? '1' : '.14';
    });
    const st = this.testiStats[this.testiPlat || 'all'];
    this.testiStatEls.forEach((el, i) => {
      const n = el.querySelector('[data-stat-n]'), l = el.querySelector('[data-stat-l]');
      if (st[i]) { n.textContent = st[i][0]; l.textContent = st[i][1]; }
    });
  }

  tickTestis() {
    if (!this.testiCols) return;
    const mob = this.isMobile();
    const base = this.testiVisible ? 0.35 : 0;
    const vDamp = mob ? 0.96 : 0.9;
    this.testiCols.forEach(c => {
      if (!c.half) { c.half = mob ? c.track.scrollWidth / 2 : c.track.scrollHeight / 2; }
      if (c.drag) {
        // driven by pointermove
      } else if (c.hover) {
        c.pos += c.vel; c.vel *= vDamp; if (Math.abs(c.vel) < 0.01) c.vel = 0;
      } else {
        c.pos += base + c.vel;
        c.vel *= vDamp; if (Math.abs(c.vel) < 0.01) c.vel = 0;
      }
      let m = ((c.pos % c.half) + c.half) % c.half;
      if (mob) {
        const tx = c.side === 'left' ? -m : (-c.half + m);
        c.track.style.transform = 'translateX(' + tx + 'px)';
      } else {
        const ty = c.side === 'left' ? -m : (-c.half + m);
        c.track.style.transform = 'translateY(' + ty + 'px)';
      }
    });
  }

  wireSocialPopup() {
    const btn = this.root.querySelector('[data-social-toggle]');
    const pop = this.root.querySelector('[data-social-popup]');
    if (!btn || !pop) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.style.display = pop.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', (e) => {
      if (pop.style.display === 'flex' && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) pop.style.display = 'none';
    });
  }

  openTesti(yt) {
    if (!this.testiFrame) return;
    this.testiFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    this.testiFrame.src = ytEmbed(yt);
    this.testiLb.style.display = 'flex';
  }
  closeTesti() { if (this.testiFrame) this.testiFrame.src = ''; if (this.testiLb) this.testiLb.style.display = 'none'; }

  // --- Section entrance animations ---

  animSec2Enter() {
    if (!this.tlViewport) return;
    const track = this.tlTrack;
    if (!track) return;
    // settle on the current drag position (on mobile that centres the active milestone), not on 0
    const x = this.tlX || 0;
    track.style.transition = 'none';
    track.style.transform = 'translateX(' + (x + 120) + 'px)';
    track.style.opacity = '0';
    requestAnimationFrame(() => {
      track.style.transition = 'transform 1.8s cubic-bezier(.16,1,.3,1), opacity 1.4s cubic-bezier(.16,1,.3,1)';
      track.style.transform = 'translateX(' + x + 'px)';
      track.style.opacity = '1';
    });
  }

  animPbEnter(inst) {
    if (!inst || !inst.cluster) return;
    const startRot = inst.rot || 0;
    const targetRot = startRot + Math.PI * 2;
    const dur = 3000;
    const t0 = performance.now();
    const easeIO = t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2,2)/2;
    const spin = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      inst.rot = startRot + (targetRot - startRot) * easeIO(p);
      if (p < 1) requestAnimationFrame(spin);
    };
    requestAnimationFrame(spin);
  }

  animPodEnter() {
    if (!this.pods || !this.pods.length) return;
    const saved = this.podP;
    this.podP = saved + 3;
    this.podTarget = saved;
    this.positionPods();
  }

  animTestiEnter() {
    if (!this.testiCols) return;
    this.testiCols.forEach((c, i) => {
      const el = c.el;
      const dir = c.side === 'left' ? 60 : -60;
      el.style.transition = 'none';
      el.style.transform = 'translateY(' + dir + 'px)';
      el.style.opacity = '0';
      setTimeout(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 1.6s cubic-bezier(.16,1,.3,1), opacity 1.2s cubic-bezier(.16,1,.3,1)';
          el.style.transform = 'translateY(0)';
          el.style.opacity = '1';
        });
      }, i * 150);
    });
  }

  updateSection6(y) {
    if (!this.sec6 || !this.segs) return;
    // Testimonials always shown
    const seg = this.segs.find(s => s.type === 'rest' && s.i === 5);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    this.sec6.style.opacity = o.toFixed(3); this.sec6.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    this.sec6.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    this.testiVisible = o > 0.05;
    this.sec6.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    if (o > 0.5 && !this._sec6Entered) { this._sec6Entered = true; this.animTestiEnter(); }
    if (o < 0.05) this._sec6Entered = false;
  }

  buildChat() {
    if (!this.sec7) return;
    this.chatInput = this.sec7.querySelector('[data-chat-input]');
    this.chatType = 'General query';
    this.chatStep = 0; this.chatAnswers = {};
    this.chatQ = [
      "Enter your name",
      "Enter your email address",
      "What would you like to say?"
    ];
    this.sec7.querySelector('[data-chat-send]').addEventListener('click', () => this.chatSend());
    this.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.chatSend(); } });
    const clear = this.sec7.querySelector('[data-chat-clear]');
    this.chatInput.addEventListener('input', () => { clear.style.display = this.chatInput.value ? 'flex' : 'none'; });
    clear.addEventListener('click', () => { this.chatInput.value = ''; clear.style.display = 'none'; this.chatInput.focus(); });
    const typeBtn = this.sec7.querySelector('[data-chat-type]');
    const menu = this.sec7.querySelector('[data-chat-typemenu]');
    typeBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });
    this.sec7.querySelectorAll('[data-chat-typeopt]').forEach(o => {
      o.addEventListener('mouseenter', () => { o.style.background = 'rgba(255,255,255,.08)'; o.style.color = 'var(--glow,#f6f5f2)'; });
      o.addEventListener('mouseleave', () => { o.style.background = 'none'; o.style.color = 'var(--tx-muted,#a1a1aa)'; });
      o.addEventListener('click', () => { this.chatType = o.getAttribute('data-t'); this.sec7.querySelector('[data-chat-typelabel]').textContent = this.chatType; menu.style.display = 'none'; });
    });
    document.addEventListener('click', () => { menu.style.display = 'none'; });
    const plus = this.sec7.querySelector('[data-chat-plus]');
    const file = this.sec7.querySelector('[data-chat-file]');
    const attach = this.sec7.querySelector('[data-chat-attach]');
    this.chatPlus = plus;
    this.chatPlusMode = 'attach';
    plus.addEventListener('click', () => { if (this.chatPlusMode === 'refresh') this.chatRestart(); else file.click(); });
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const okType = /^image\//.test(f.type) || f.type === 'application/pdf';
      const okSize = f.size <= 10 * 1024 * 1024;
      if (!okType || !okSize) {
        attach.style.display = 'flex';
        attach.style.color = '#e0938c';
        attach.textContent = !okType ? 'Only images or PDF files are allowed.' : 'File must be 10MB or smaller.';
        file.value = '';
        this.chatAttachment = null;
        return;
      }
      attach.style.color = 'var(--glow,#f6f5f2)';
      const reader = new FileReader();
      reader.onload = () => {
        this.chatAttachment = { name: f.name, type: f.type, size: f.size, dataUrl: reader.result };
        attach.style.display = 'flex';
        attach.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M21.44 11.05 12 20.5a5 5 0 0 1-7-7l8.5-8.5a3 3 0 0 1 4 4l-8.5 8.5a1 1 0 0 1-1.5-1.5L15 9"></path></svg> Attached: ' + f.name;
      };
      reader.readAsDataURL(f);
    });
    this.chatLogEl = this.sec7.querySelector('[data-chat-history]');
    this.chatLog = [];
    this.chatLogEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-chat-restart-yes]')) this.chatRestart();
      if (e.target.closest('[data-chat-retry]')) this.sendChatSubmission();
    });
    this.chatHp = this.sec7.querySelector('[data-chat-hp]');
    const warm = () => this.loadRecaptcha();
    this.chatInput.addEventListener('focus', warm, { once: true });
    this.chatInput.addEventListener('pointerdown', warm, { once: true });
    this.chatBuilt = true;
    this.chatAsk(this.chatQ[0]);
  }

  pushChat(role, text, prompt) {
    this.chatLog.push({ role, text, prompt: !!prompt });
    this.renderChatLog();
  }

  escHtml(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  renderChatLog() {
    if (!this.chatLogEl) return;
    const has = this.chatLog.length > 0;
    this.chatLogEl.style.display = has ? 'flex' : 'none';
    this.chatLogEl.innerHTML = this.chatLog.map((m) => {
      const isUser = m.role === 'user';
      return '<div style="align-self:' + (isUser ? 'flex-end' : 'flex-start') + ';max-width:82%;padding:9px 14px;border-radius:14px;font-family:var(--font-body,sans-serif);font-size:13px;line-height:1.45;color:' + (isUser ? 'var(--ink-900,#030405)' : 'var(--tx,#f4f4f5)') + ';background:' + (isUser ? 'linear-gradient(150deg,var(--glow,#f6f5f2),var(--tx-faint,#6b6b73))' : 'rgba(255,255,255,.07)') + '">' + (m.html ? m.text : this.escHtml(m.text)) + '</div>';
    }).join('');
    this.chatLogEl.scrollTop = this.chatLogEl.scrollHeight;
  }

  setChatPlusMode(mode) {
    this.chatPlusMode = mode;
    if (!this.chatPlus) return;
    this.chatPlus.innerHTML = mode === 'refresh'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow,#f6f5f2)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 4v5h-5"></path></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow,#f6f5f2)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>';
    this.chatPlus.setAttribute('aria-label', mode === 'refresh' ? 'Start new response' : 'Attach media');
  }

  chatRestart() {
    this.chatLog = [];
    this.chatStep = 0; this.chatAnswers = {};
    this.chatDone = false;
    this.chatAttachment = null;
    this.setChatPlusMode('attach');
    this.chatInput.disabled = false;
    this.chatInput.value = '';
    const attach = this.sec7.querySelector('[data-chat-attach]');
    if (attach) { attach.style.display = 'none'; attach.style.color = 'var(--glow,#f6f5f2)'; }
    this.renderChatLog();
    this.chatAsk(this.chatQ[0]);
  }

  chatAsk(text) {
    if (this.chatTyper) clearInterval(this.chatTyper);
    const el = this.chatInput; let i = 0; const full = text;
    this.chatTyper = setInterval(() => {
      el.setAttribute('placeholder', full.slice(0, i) + (i < full.length ? '\u2588' : ''));
      i++;
      if (i > full.length) { clearInterval(this.chatTyper); el.setAttribute('placeholder', full); }
    }, 26);
  }

  chatSend() {
    if (!this.chatBuilt || this.chatStep > 2) return;
    const v = (this.chatInput.value || '').trim();
    if (!v) return;
    if (this.chatStep === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { this.chatAsk("That email looks off. Mind trying again?"); return; }
    const askedText = this.chatInput.getAttribute('placeholder') || this.chatQ[this.chatStep] || '';
    this.pushChat('assistant', askedText);
    this.pushChat('user', v);
    if (this.chatStep === 0) this.chatAnswers.name = v;
    else if (this.chatStep === 1) this.chatAnswers.email = v;
    else this.chatAnswers.message = v;
    this.chatInput.value = '';
    this.sec7.querySelector('[data-chat-clear]').style.display = 'none';
    this.chatStep++;
    if (this.chatStep === 1) {
      this.chatAsk(this.chatQ[1]);
    } else if (this.chatStep === 2) {
      this.chatAsk(this.step3Q());
    } else {
      const nm = this.chatAnswers.name || 'there';
      const em = this.chatAnswers.email || 'your email';
      const done = "Thanks, " + nm + ". Your " + this.chatType.toLowerCase() + " has been sent. We'll reply to " + em + " shortly.";
      this.chatAsk('');
      this.chatInput.disabled = true;
      this.pushChat('assistant', 'Sending…');
      this.chatDone = true;
      this.setChatPlusMode('refresh');
      this.sendChatSubmission(done);
    }
  }

  csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

  // reCAPTCHA v3 script, loaded on first use of the chat form (keeps Google's ~150 KB off page load)
  loadRecaptcha() {
    const key = this.props.contact.recaptcha;
    if (!key) return Promise.resolve(false);
    if (!this._rcP) {
      this._rcP = new Promise((res) => {
        if (window.grecaptcha && window.grecaptcha.execute) return res(true);
        const sc = document.createElement('script');
        sc.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(key);
        sc.async = true;
        sc.onload = () => res(true);
        sc.onerror = () => { this._rcP = null; res(false); };
        document.head.appendChild(sc);
        setTimeout(() => res(!!window.grecaptcha), 8000);
      });
    }
    return this._rcP;
  }

  recaptchaToken() {
    const key = this.props.contact.recaptcha;
    if (!key) return Promise.resolve('');
    return this.loadRecaptcha().then((ok) => new Promise((res) => {
      if (!ok || !window.grecaptcha) return res('');
      const t = setTimeout(() => res(''), 8000);
      window.grecaptcha.ready(() => window.grecaptcha.execute(key, { action: 'contact' }).then((tok) => { clearTimeout(t); res(tok || ''); }, () => { clearTimeout(t); res(''); }));
    }));
  }

  // Sends the answers and shows the outcome in the last chat bubble: the thank-you line, or the form
  // plugin's / server's error with a "Try again" button (which re-sends the same answers).
  sendChatSubmission(doneText) {
    if (doneText) this._chatDoneText = doneText;
    if (this._chatSending) return;
    this._chatSending = true;
    const last = this.chatLog[this.chatLog.length - 1];
    const show = (text, html) => { if (last) { last.text = text; last.html = !!html; this.renderChatLog(); } };
    show('Sending…');
    this.postSubmission().then((r) => {
      this._chatSending = false;
      if (r.ok) { show(this._chatDoneText); return; }
      show(this.escHtml(r.message || 'Sorry, your message could not be sent.') +
        ' <button type="button" data-chat-retry style="margin-left:6px;padding:3px 10px;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:none;color:inherit;font:inherit;cursor:pointer">Try again</button>', true);
    });
  }

  postSubmission() {
    const c = this.props.contact;
    const fd = new FormData();
    fd.append('action', 'sh_contact');
    fd.append('nonce', c.nonce);
    fd.append('type', this.chatType || '');
    fd.append('name', this.chatAnswers.name || '');
    fd.append('email', this.chatAnswers.email || '');
    fd.append('message', this.chatAnswers.message || '');
    fd.append('website', this.chatHp ? this.chatHp.value : '');
    const att = this.chatAttachment;
    const file = att && att.dataUrl
      ? fetch(att.dataUrl).then((r) => r.blob()).then((blob) => { fd.append('attachment', blob, att.name || 'attachment'); }).catch(() => {})
      : Promise.resolve();
    const token = this.recaptchaToken().then((t) => { if (t) fd.append('recaptcha_token', t); });
    return Promise.all([file, token])
      .then(() => fetch(c.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' }))
      .then((r) => r.json().catch(() => null).then((j) => ({
        ok: !!(j && j.success),
        message: (j && j.data && (j.data.error || j.data.message)) || (r.ok ? '' : 'Sorry, your message could not be sent (error ' + r.status + '). Please try again.'),
      })))
      .catch(() => ({ ok: false, message: "Couldn't reach the server. Check your connection and try again." }));
  }

  step3Q() {
    const m = { 'Business inquiry': 'Describe your business inquiry', 'Review': 'Share your review or experience', 'General query': 'What would you like to ask?', 'Work with me': 'Tell us about the project or role' };
    return m[this.chatType] || 'What would you like to say?';
  }

  updateSection7(y) {
    if (!this.sec7 || !this.segs) return;
    const seg = this.segs.find(s => s.type === 'rest' && s.i === 6);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = 1;
    this.sec7.style.opacity = o.toFixed(3); this.sec7.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    this.sec7.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    this.sec7.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }

  updateSection2(y) {
    if (!this.sec2) return;
    const seg = this.segs.find(s => s.type === 'rest' && s.i === 1);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    this.sec2.style.opacity = o.toFixed(3); this.sec2.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    this.sec2.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    if (o > 0.5 && !this._sec2Entered) { this._sec2Entered = true; this.animSec2Enter(); }
    if (o < 0.05) { this._sec2Entered = false; if (this.closeTlModal) this.closeTlModal(); }
  }

  updateHeaderVis(y) {
    if (!this.header) return;
    const dy = y - (this.lastHY == null ? y : this.lastHY);
    if (y < 24) this.showHeader(true);
    else if (dy > 5) this.showHeader(false);
    else if (dy < -5) this.showHeader(true);
    this.lastHY = y;
  }

  showHeader(v) {
    if (v === this.headerVis) return;
    this.headerVis = v;
    this.header.style.transform = v ? 'translateY(0)' : 'translateY(-160%)';
    this.header.style.opacity = v ? '1' : '0';
    this.header.style.pointerEvents = v ? 'auto' : 'none';
  }

  componentDidUpdate() {
    this.applyHeroFont(); this.applyCursorPref();
  }

  applyHeroFont() {
    if (!this.heroH1) return;
    const map = {
      'Cabinet Grotesk (wide)': { f: "var(--font-grotesk,serif)", w: 500, ls: '-.01em', tt: 'uppercase' },
      'Space Grotesk': { f: "'Space Grotesk',sans-serif", w: 500, ls: '-.02em', tt: 'uppercase' },
      'General Sans': { f: "var(--font-body,sans-serif)", w: 600, ls: '-.01em', tt: 'uppercase' },
      'Anton (heavy)': { f: "'Anton',sans-serif", w: 400, ls: '.01em', tt: 'uppercase' }
    };
    const c = map[this.props.heroFont] || map['Cabinet Grotesk (wide)'];
    this.heroH1.style.fontFamily = c.f;
    this.heroH1.style.fontWeight = c.w;
    this.heroH1.style.letterSpacing = c.ls;
    this.heroH1.style.textTransform = c.tt;
  }


  // The scroll-scrubber seeks to arbitrary points across the whole timeline, which needs
  // the full file's `seekable` range available immediately — progressive network buffering
  // only exposes a small window near the current playhead, so far seeks silently clamp back
  // near 0 until enough of the file has streamed in. Fetching the (small, <15MB) file as a
  // Blob and pointing the video at an object URL makes it fully local and instantly seekable.
  loadStageVideo(src, isInit) {
    if (!this.stageVideo) return;
    if (!this._blobCache) this._blobCache = {};
    const apply = (blobUrl) => {
      if (this.stageVideo.src === blobUrl) return;
      const t = this.stageVideo.currentTime || 0;
      this.stageVideo.src = blobUrl;
      this.stageVideo.load();
      if (!isInit) {
        const restore = () => { try { this.stageVideo.currentTime = t; } catch (e) {} this.stageVideo.removeEventListener('loadedmetadata', restore); };
        this.stageVideo.addEventListener('loadedmetadata', restore);
      }
    };
    if (this._blobCache[src]) { apply(this._blobCache[src]); return; }
    fetch(src, { priority: 'high' }).then(r => r.blob()).then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      this._blobCache[src] = blobUrl;
      apply(blobUrl);
    }).catch(() => {
      // fallback if fetch/blob fails (e.g. CORS): fall back to direct streaming src.
      const s = this.stageVideo.querySelector('source');
      if (s) s.setAttribute('src', src);
      this.stageVideo.src = src;
      this.stageVideo.load();
    });
  }



  rgba(hex, a) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return 'rgba(201,162,78,' + a + ')';
    return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a.toFixed(3) + ')';
  }

  updateHero(y) {
    // Title + bottom scrim belong to the hero; fade out across the first rest+transition band.
    const fadeEnd = (this.segs[1] ? this.segs[1].start + this.segs[1].h * 0.4 : window.innerHeight);
    const t = Math.max(0, Math.min(1, 1 - y / fadeEnd));
    if (this.heroTitle) {
      this.heroTitle.style.opacity = String(t);
      this.heroTitle.style.transform = 'translateY(' + ((1 - t) * 22) + 'px)';
    }
    if (this.heroScrim) this.heroScrim.style.opacity = String(t);
    // Scroll button glides from bottom-centre (hero rest) to bottom-right corner as you leave.
    if (this.arrow) {
      const w = window.innerWidth;
      const margin = Math.max(20, Math.min(44, w * 0.036));
      const startLeft = w / 2 - 60;
      const endLeft = w - 120 - margin;
      const moveP = Math.max(0, Math.min(1, y / (fadeEnd * 0.8)));
      let left = startLeft + (endLeft - startLeft) * moveP;
      let backP = 0;
      const last = this.segs.find(s => s.type === 'rest' && s.i === this.N - 1);
      if (last) { const cp = Math.max(0, Math.min(1, (y - (last.start - last.h)) / last.h)); left = left + (startLeft - left) * cp; backP = cp; }
      // left stays at the hero position; the glide is a transform (applied in tickArrowMagnet)
      const base = startLeft + 'px';   // same as the markup's calc(50% - 60px)
      if (this.arrow.style.left !== base) this.arrow.style.left = base;
      this._arrowGlide = left - startLeft;
      if (this.reduced) this.arrow.style.transform = 'translateX(' + this._arrowGlide.toFixed(1) + 'px)';
      this.arrowStuck = moveP > 0.9 && backP < 0.05;
    }
  }





  loadDepsThenScroll() {
    this.startScroll();
  }

  startScroll() {
    // Slideshow mode: intercept wheel/touch for discrete section jumps.
    // Programmatic scrollTo still moves the page (drives update* overlay fades).
    this._wheelHandler = (e) => {
      e.preventDefault();
      // A gesture starts after a pause, or with a clearly stronger push than the momentum tail.
      const now = performance.now(), mag = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : 1);
      const gap = now - (this._wLast || 0);
      const fresh = gap > 220 || (now - (this._wStepAt || 0) > 450 && mag > (this._wMag || 0) * 1.8 + 6);
      this._wLast = now; this._wMag = mag;
      if (fresh) this._wUsed = false;
      if (!this.inputReady() || this._transPlaying || this.autoReturn || this._homeGliding) { this._wUsed = true; return; }
      if (this._homeScrollActive) {
        // At last section: accumulate scroll to drive arrow toward center
        if (e.deltaY > 0) { this._homeScrollAccum = Math.min(1, (this._homeScrollAccum || 0) + Math.abs(e.deltaY) / 600); this._updateHomeScroll(); }
        else if (e.deltaY < 0) { this._homeScrollAccum = Math.max(0, (this._homeScrollAccum || 0) - Math.abs(e.deltaY) / 600); this._updateHomeScroll(); if (this._homeScrollAccum <= 0) { this._glideHomeScrollBack(); } }
        return;
      }
      if (this._wUsed || mag < 4) return;
      this._wUsed = true; this._wStepAt = now;
      if (e.deltaY > 0) this.next();
      else if (e.deltaY < 0) this.prev();
    };
    window.addEventListener('wheel', this._wheelHandler, { passive: false });
    let touchY = null, touchX = 0, zone = false;
    // horizontal drag areas: timeline, podcast ring, testimonials (phones), gallery strip, partner logos, venture slides
    const HZONES = '[data-tl-viewport],[data-pod-ring],[data-pod-track],[data-testi-col],[data-vg-viewport],[data-pmarquee],[data-vslide]';
    // areas that scroll natively (chat history, long milestone text)
    const SCROLLERS = '[data-chat-history],[data-tl-modal-card] div[style*="overflow: auto"]';
    this._touchStart = (e) => {
      const t = e.touches[0];
      touchY = t.clientY; touchX = t.clientX; this._gesture = null;
      zone = !!(e.target && e.target.closest && e.target.closest(HZONES));
      // a touch that began during the preloader or hero intro, or a pinch, never changes section
      if (!this.inputReady() || e.touches.length > 1) touchY = null;
    };
    this._touchEnd = () => { this._gesture = null; };
    this._touchMove = (e) => {
      // the page itself never pans natively: no address-bar slide, no pull-to-refresh, no rubber band
      if (e.touches.length === 1 && e.cancelable && !(e.target && e.target.closest && e.target.closest(SCROLLERS))) e.preventDefault();
      // a finger turning the playbook wheel never also changes section
      if (this.activeInst && this.activeInst.drag) { touchY = null; return; }
      if (touchY === null) return;
      const t = e.changedTouches[0], dx = t.clientX - touchX, dy0 = t.clientY - touchY;
      if (!this._gesture) {
        if (Math.abs(dx) < 10 && Math.abs(dy0) < 10) return;
        this._gesture = Math.abs(dx) > Math.abs(dy0) * 1.15 ? (zone ? 'local' : 'none') : 'section';
        // vertical intent wins: release any carousel/timeline drag that started with this touch
        if (this._gesture === 'section' && zone) { try { window.dispatchEvent(new PointerEvent('pointercancel')); } catch (err) {} }
      }
      if (this._gesture !== 'section') { touchY = null; return; }
      if (this._transPlaying || this.autoReturn || this._homeGliding) return;
      const dy = touchY - t.clientY;
      if (Math.abs(dy) > 40) {
        touchY = null;
        if (this._homeScrollActive) {
          if (dy > 0) { this._homeScrollAccum = Math.min(1, (this._homeScrollAccum || 0) + 0.25); this._updateHomeScroll(); }
          else { this._homeScrollAccum = Math.max(0, (this._homeScrollAccum || 0) - 0.25); this._updateHomeScroll(); if (this._homeScrollAccum <= 0) { this._glideHomeScrollBack(); } }
        } else {
          if (dy > 0) this.next(); else this.prev();
        }
      }
    };
    window.addEventListener('touchstart', this._touchStart, { passive: true });
    window.addEventListener('touchmove', this._touchMove, { passive: false });
    window.addEventListener('touchend', this._touchEnd, { passive: true });
    window.addEventListener('touchcancel', this._touchEnd, { passive: true });
    this.onScrollNative = () => this.handle(this.readY());
    window.addEventListener('scroll', this.onScrollNative, { passive: true });
  }

  goTo(y, duration) {
    const d = duration == null ? 0.6 : duration;
    if (d <= 0 || this.reduced) { window.scrollTo(0, y); this.handle(y); return; }
    if (this._scrollAnim) cancelAnimationFrame(this._scrollAnim);
    const start = this.readY(), dist = y - start, t0 = performance.now();
    const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / (d * 1000));
      window.scrollTo(0, start + dist * ease(p));
      if (p < 1) this._scrollAnim = requestAnimationFrame(step);
      else this._scrollAnim = null;
    };
    this._scrollAnim = requestAnimationFrame(step);
  }
  goToIndex(idx, duration) { idx = Math.max(0, Math.min(this.N - 1, idx)); this.goTo(this.restStart[idx] + 2, duration); }
  // Single hardened entry point for every "jump to contact" CTA: locks out the mid-scroll
  // auto-snap (which otherwise hijacks the animation and drops it mid-transition) for the
  // full duration of the jump, then re-verifies the landing spot once settled.
  scrollToLastSection(duration) {
    const d = duration == null ? 1.4 : duration;
    this._ctaJump = true;
    if (this._ctaJumpTimer) clearTimeout(this._ctaJumpTimer);
    this.goToIndex(this.N - 1, d);
    this._ctaJumpTimer = setTimeout(() => {
      this._ctaJump = false;
      const target = this.restStart[this.N - 1] + 2;
      if (Math.abs(this.readY() - target) > 4) this.goTo(target, 0.4);
    }, d * 1000 + 120);
  }
  _enterHomeScroll() {
    if (this._homeScrollActive) return;
    this._homeScrollActive = true;
    this._homeScrollAccum = 0;
    const w = window.innerWidth, h = window.innerHeight;
    this._homeArrowOrigin = { left: w / 2 - 60, bottomPx: Math.max(28, Math.min(56, h * 0.05)), h };
  }
  _updateHomeScroll() {
    const p = this._homeScrollAccum || 0;
    const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const e = easeIO(p);
    const o = this._homeArrowOrigin;
    if (!o || !this.arrow) return;
    const homeTop = o.h - 120 - o.bottomPx;
    const centerTop = o.h / 2 - 60;
    this.arrow.style.left = o.left + 'px';
    this.arrow.style.bottom = 'auto';
    this.arrow.style.top = (homeTop + (centerTop - homeTop) * e) + 'px';
    this._loopSpin = 180 * e;
    this.arrow.style.transform = 'rotate(' + this._loopSpin + 'deg)';
    if (this.arrowIcon) this.arrowIcon.style.setProperty('--arrow-rot', (180 * e) + 'deg');
    if (this.sec7) {
      const o2 = 1 - e;
      this.sec7.style.opacity = o2.toFixed(3);
      this.sec7.style.visibility = o2 > 0.02 ? 'visible' : 'hidden';
      this.sec7.style.pointerEvents = e > 0.3 ? 'none' : '';
      this.sec7.style.transform = 'translateY(' + (e * -12) + 'px)';
    }
    this.showHeader(false);
    this.setLoopLabel('Keep scrolling');
    // When fully scrolled to center, trigger the return
    if (p >= 0.99) { this._homeScrollActive = false; this.triggerHomeReturn(); }
  }
  _glideHomeScrollBack() {
    if (this._homeGlideBack) return;
    this._homeGlideBack = true;
    const from = this._homeScrollAccum || 0;
    const dur = 500, st = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const anim = (now) => {
      const p = Math.min(1, (now - st) / dur);
      this._homeScrollAccum = from * (1 - easeOut(p));
      this._updateHomeScroll();
      if (p < 1) { requestAnimationFrame(anim); return; }
      this._homeGlideBack = false;
      this._exitHomeScroll();
    };
    requestAnimationFrame(anim);
  }
  _exitHomeScroll() {
    this._homeScrollActive = false;
    this._homeScrollAccum = 0;
    if (this.sec7) { this.sec7.style.opacity = '1'; this.sec7.style.visibility = 'visible'; this.sec7.style.pointerEvents = ''; this.sec7.style.transform = ''; }
    if (this.arrow) { this.arrow.style.top = ''; this.arrow.style.bottom = ''; this.arrow.style.left = ''; this.arrow.style.transform = ''; }
    if (this.arrowIcon) this.arrowIcon.style.setProperty('--arrow-rot', '0deg');
    this._loopSpin = 0;
    this.arrowState = null;
    this.updateArrow();
  }
  next() {
    if (this._transPlaying || this.autoReturn || this._homeGliding || this._homeScrollActive) return;
    const from = this.currentSection;
    if (from >= this.N - 1) { this._enterHomeScroll(); return; }
    const [a, b] = this.TRANS[from], dur = (b - a) / 1.4;
    this._transPlaying = true;
    this.runStep(from, dur, false, () => { this.landOn(from + 1); this._transPlaying = false; this.bandKey = 'r' + (from + 1); });
    this.goToIndex(from + 1, dur);
  }
  prev() {
    if (this._transPlaying || this.autoReturn || this._homeGliding) return;
    const from = this.currentSection;
    if (from <= 0) return;
    this.currentSection = from - 1;
    this.idleSection = null;
    this.bandKey = 'r' + (from - 1);
    const [a, b] = this.TRANS[from - 1], dur = (b - a) / 2.2;
    this._transPlaying = true;
    this.runStep(from - 1, dur, true, () => { this.landOn(from - 1); this._transPlaying = false; });
    this.goToIndex(from - 1, dur);
  }

  bindArrow() {
    this.arrow.addEventListener('click', () => {
      if (this.isMobile()) this._arrowPeekUntil = performance.now() + 1600;
      // ≥3s glide so a one-tap jump plays the transition at a readable pace
      if (this.currentSection >= this.N - 1 && !this.inTrans) {
        if (!this._homeScrollActive) this._enterHomeScroll();
        // Animate smoothly to center over 800ms
        const from = this._homeScrollAccum || 0;
        const dur = 800, st = performance.now();
        const easeIO = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        const anim = (now) => {
          const p = Math.min(1, (now - st) / dur);
          this._homeScrollAccum = from + (1 - from) * easeIO(p);
          this._updateHomeScroll();
          if (p < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      }
      else this.next();
    });
  }

  tickArrowMagnet() {
    if (!this.arrow || this.reduced) { if (this.ringWrap) this.ringWrap.style.opacity = '1'; return; }
    if (this.autoReturn || this.inLoop) return;
    const stuck = !!this.arrowStuck;
    let curveTarget = 1, tx = 0, ty = 0;
    if (stuck && this.isMobile()) {
      // phones have no hover magnet: park the bare arrow in the corner; after a tap it eases up-left
      // with its rotating ring for a moment, then tucks back
      if (performance.now() < (this._arrowPeekUntil || 0)) { tx = -10; ty = -10; }
      else { curveTarget = 0; tx = 40; ty = 34; }
    } else if (stuck) {
      curveTarget = 0;
      if (this.mouse.on) {
        const r = this.arrow.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = this.mouse.x - cx, dy = this.mouse.y - cy, dist = Math.hypot(dx, dy);
        const RAD = 190;
        if (dist < RAD) { const pull = 1 - dist / RAD; curveTarget = Math.min(1, pull * 1.4); const soft = Math.min(1, dist / 42); const mag = pull * 20 * soft; tx = dx / (dist || 1) * mag; ty = dy / (dist || 1) * mag; }
      }
    }
    this._am = this._am || { t: 1, x: 0, y: 0 };
    this._am.t += (curveTarget - this._am.t) * 0.16;
    this._am.x += (tx - this._am.x) * 0.17;
    this._am.y += (ty - this._am.y) * 0.17;
    if (this.ringWrap) this.ringWrap.style.opacity = this._am.t.toFixed(3);
    this.arrow.style.transform = 'translate(' + ((this._arrowGlide || 0) + this._am.x).toFixed(1) + 'px,' + this._am.y.toFixed(1) + 'px)';
  }

  bindMenu() {
    this.menu = this.root.querySelector('[data-menu]');
    this.menuToggle = this.root.querySelector('[data-menu-toggle]');
    this.menuIco = this.root.querySelector('[data-menu-ico]');
    this.headerLogo = this.header ? this.header.querySelector('a[aria-label]') : null;
    this.headerCta = this.root.querySelector('[data-req]');
    if (!this.menu || !this.menuToggle) return;
    this.menuOpen = false;
    this.menuItems = Array.from(this.menu.querySelectorAll('[data-menu-link]'));
    this.menuToggle.addEventListener('click', () => this.toggleMenu());
    this.menuItems.forEach(a => {
      a.addEventListener('mouseenter', () => { a.style.color = 'var(--glow,#f6f5f2)'; });
      a.addEventListener('mouseleave', () => { a.style.color = 'var(--tx-muted,#a1a1aa)'; });
      a.addEventListener('click', (e) => { e.preventDefault(); const g = +a.getAttribute('data-go'); this.setMenu(false); this.goToIndex(g, 1.2); });
    });
    this.menu.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', (e) => {
      e.preventDefault(); this.setMenu(false);
      if (b.getAttribute('href') === '#contact') this.scrollToLastSection(1.2);
    }));
    this.onMenuKey = (e) => { if (e.key === 'Escape' && this.menuOpen) this.setMenu(false); };
    window.addEventListener('keydown', this.onMenuKey);
  }

  toggleMenu() { this.setMenu(!this.menuOpen); }

  setMenu(v) {
    if (!this.menu || v === this.menuOpen) return;
    this.menuOpen = v;
    this.menuOpenAt = performance.now();
    this.menuToggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    this.menuToggle.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    if (v) this.showHeader(true);
    if (this.lenis) { try { v ? this.lenis.stop() : this.lenis.start(); } catch (e) {} }
    this.root.querySelectorAll('[data-sec3],[data-sec4],[data-sec5],[data-sec6],[data-sec7],[data-hero-title],[data-arrow]').forEach((el) => {
      el.style.pointerEvents = v ? 'none' : '';
    });
    this.tickMenu();
  }

  // React reverts one-shot inline writes on template nodes, so re-assert every frame.
  tickMenu() {
    if (!this.menu) return;
    const v = !!this.menuOpen;
    const m = this.menu;
    m.style.opacity = v ? '1' : '0';
    m.style.visibility = v ? 'visible' : 'hidden';
    m.style.pointerEvents = v ? 'auto' : 'none';
    if (!this._introLock) {
      if (this.headerLogo) { this.headerLogo.style.transition = 'opacity .35s ease'; this.headerLogo.style.opacity = v ? '0' : '1'; this.headerLogo.style.pointerEvents = v ? 'none' : 'auto'; }
      if (this.headerCta) { this.headerCta.style.transition = 'opacity .35s ease'; this.headerCta.style.opacity = v ? '0' : '1'; this.headerCta.style.pointerEvents = v ? 'none' : 'auto'; }
    }
    const lines = this.menuIco ? this.menuIco.children : [];
    if (lines.length === 3) {
      if (v) { lines[0].style.top = '50%'; lines[0].style.transform = 'translateY(-50%) rotate(45deg)'; lines[1].style.opacity = '0'; lines[2].style.bottom = '50%'; lines[2].style.transform = 'translateY(50%) rotate(-45deg)'; }
      else { lines[0].style.top = '0'; lines[0].style.transform = 'none'; lines[1].style.opacity = '1'; lines[2].style.bottom = '0'; lines[2].style.transform = 'none'; }
    }
    const dt = performance.now() - (this.menuOpenAt || 0);
    this.menuItems.forEach((a, i) => {
      const shown = v && dt > (110 + i * 55);
      a.style.opacity = shown ? '1' : '0';
      a.style.transform = shown ? 'translateY(0)' : 'translateY(24px)';
    });
  }

  triggerHomeReturn() {
    if (this.autoReturn || this._homeGliding) return;
    this._homeGliding = true;
    this.inLoop = true;
    this.currentSection = this.N - 1; this.inTrans = false;
    // Arrow is already at center from _updateHomeScroll — spin for a moment, then smoothly bring in hero
    this.autoReturn = true;
    this._homeGliding = false;
    this.runHomeReturn();
  }








  // ---- Background: one combined video, s0 t0 s1 t1 … s6 t6 (s = section loop, t = transition).
  // At rest the section's loop plays and jumps back to its start; a step down plays its transition
  // forward; a step up cuts straight to the previous section's loop. t6 closes the door for the
  // return to the hero. Nothing ever plays backwards.
  // ?quality=480|720|1080 picks the file (default 720, 480 on phones).
  initBg() {
    const v = this.stageVideo = this.root.querySelector('[data-bg]');
    // clip lengths in the export, seconds: s0 t0 s1 t1 … s6 t6
    const L = this.props.clips;
    this.LOOP = []; this.TRANS = [];
    for (let i = 0, t = 0; i < 7; i++) { this.LOOP.push([t, t += L[2 * i]]); this.TRANS.push([t, t += L[2 * i + 1]]); }
    this.bg = { loop: null, step: null, f: '' };
    if (!v) return;
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    let q = null;
    try { q = (new URLSearchParams(window.location.search).get('quality') || '').replace(/p$/, ''); } catch (e) {}
    const def = String(this.isMobile() ? this.props.qualityMobile : this.props.qualityDesktop).replace(/p$/, '');
    this.quality = ['480', '720', '1080'].includes(q) ? q : (['480', '720', '1080'].includes(def) ? def : '720');
    const urls = this.props.video;
    const src = urls[this.quality] || urls['720'] || urls['480'] || urls['1080'];
    this.bgReady = new Promise((res) => { v.addEventListener('loadeddata', res, { once: true }); v.addEventListener('error', res, { once: true }); setTimeout(res, 9000); });
    if (!src) { this.stageVideo = null; return; }
    this.loadStageVideo(src, true);
  }

  // section brightness: the contact frame is bright behind its headline; phones dim everything
  bgLevel(i) { return this.isMobile() ? (i === 2 || i === 6 ? 0.5 : 0.72) : (i === 6 ? 0.58 : 1); }
  bgFilter(k, p) {
    const b = this.bgLevel(k) + (this.bgLevel((k + 1) % 7) - this.bgLevel(k)) * p;
    const f = 'brightness(' + b.toFixed(3) + ')';
    if (f !== this.bg.f) { this.bg.f = f; this.stageVideo.style.filter = f; }
  }

  seekBg(t) {
    const v = this.stageVideo;
    if (v.readyState >= 1 && !v.seeking && Math.abs(v.currentTime - t) > 0.02) { try { v.currentTime = t; } catch (e) {} }
  }

  // loop section i from its start (inset a frame so the neighbouring clips never show)
  startLoop(i) {
    const v = this.stageVideo;
    this.bg.loop = i;
    this.bgFilter(i, 0);
    if (v.readyState >= 1) { try { v.currentTime = this.LOOP[i][0] + 0.04; } catch (e) {} }
    if (!this.reduced && v.paused) { v.playbackRate = 1; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
  }

  tickBg() {
    const v = this.stageVideo, bg = this.bg;
    if (!v || bg.loop == null || this.reduced || v.readyState < 1) return;
    const [a0, b0] = this.LOOP[bg.loop], a = a0 + 0.04, b = b0 - 0.07;
    const t = v.currentTime;
    if (t < a - 0.15 || t >= b) { this.seekBg(a); return; }   // loop end (or drifted out): restart instantly
    if (v.paused && !v.seeking) { v.playbackRate = 1; const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); }
  }

  // scroll position -> background, whenever no section step owns the video
  updateBg(s, y) {
    const v = this.stageVideo, bg = this.bg;
    if (!v || bg.step) return;
    if (s.type === 'rest') {
      if (this.reduced) { this.bgFilter(s.i, 0); this.seekBg(this.LOOP[s.i][0] + 0.04); return; }
      if (bg.loop !== s.i) this.startLoop(s.i);
      return;
    }
    // inside a transition band (e.g. a Home/End glide): scrub the transition
    const p = Math.max(0, Math.min(1, (y - s.start) / s.h)), [a, b] = this.TRANS[s.i];
    bg.loop = null;
    if (!v.paused) v.pause();
    this.bgFilter(s.i, p);
    this.seekBg(a + (b - a) * p);
  }

  // a section change while the page glides for `dur` seconds. Down: transition k plays forward and
  // hands over to loop k+1 on the same frame. Up (reverse): cut straight to loop k.
  runStep(k, dur, reverse, done) {
    const v = this.stageVideo, bg = this.bg, id = (bg.stepId || 0) + 1, [a, b] = this.TRANS[k];
    bg.stepId = id; bg.step = true; bg.loop = null;
    if (bg.raf) cancelAnimationFrame(bg.raf);
    if (v && reverse) this.startLoop(k);
    const live = v && !reverse && !this.reduced && v.readyState >= 1, t0 = performance.now();
    const finish = () => {
      if (bg.stepId !== id) return;
      if (bg.raf) cancelAnimationFrame(bg.raf);
      if (live) { v.pause(); v.playbackRate = 1; }
      bg.step = null;
      if (done) done();
      this.handle(this.readY());
    };
    if (live) {
      try { v.currentTime = a; } catch (e) {}
      v.playbackRate = Math.max(0.5, Math.min(4, (b - a) / dur));
      const pr = v.play(); if (pr && pr.catch) pr.catch(() => {});
    }
    const tick = (now) => {
      if (bg.stepId !== id) return;
      const p = Math.min(1, (now - t0) / (dur * 1000));
      if (live) {
        this.bgFilter(k, p);
        if (v.currentTime >= b - 0.07) v.pause();   // hold the last frame, never bleed into the next loop
      }
      if (p < 1) bg.raf = requestAnimationFrame(tick); else finish();
    };
    bg.raf = requestAnimationFrame(tick);
    setTimeout(finish, dur * 1000 + 150);   // rAF is throttled in background tabs; the step still ends on time
  }

  // end of a step: make sure the page sits on the target section even if the glide lagged a frame
  landOn(i) {
    if (this._scrollAnim) { cancelAnimationFrame(this._scrollAnim); this._scrollAnim = null; }
    const y = this.restStart[i] + 2;
    if (Math.abs(this.readY() - y) > 1) window.scrollTo(0, y);
    this.currentSection = i;
  }



  bindKeys() {
    this.onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (!this.inputReady()) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') { e.preventDefault(); this.next(); }
      else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); this.prev(); }
      else if (k === 'Home') { e.preventDefault(); this.goTo(0); }
      else if (k === 'End') { e.preventDefault(); this.goToIndex(this.N - 1); }
    };
    window.addEventListener('keydown', this.onKey);
  }

  updateArrow() {
    const atEnd = this.currentSection >= this.N - 1 && !this.inTrans;
    const state = atEnd ? 'top' : (this.currentSection === 0 && !this.inTrans ? 'unlock' : 'next');
    if (state === this.arrowState) return;
    this.arrowState = state;
    const label = state === 'top' ? 'Scroll to top' : (state === 'unlock' ? 'Scroll to unlock' : 'Scroll to next section');
    if (this.ringText) this.ringText.textContent = label.toUpperCase() + ' \u00b7 ' + label.toUpperCase() + ' \u00b7 ';
    const rot = state === 'top' ? '180deg' : '0deg';
    if (this.arrowIcon) { this.arrowIcon.style.setProperty('--arrow-rot', rot); }
    this.arrow.setAttribute('aria-label', label);
  }

  // ---- Return-to-home loop (scroll past the last section) ----
  handleLoopback(y) {
    if (this.autoReturn) return;
    this.inLoop = true;
    this.currentSection = this.N - 1;
    this.inTrans = false;
    const q = Math.max(0, Math.min(1, (y - this.loopStart) / this.loopH));
    const ease = t => 1 - Math.pow(1 - t, 3);
    const w = window.innerWidth, h = window.innerHeight;
    const a = ease(Math.min(1, q / 0.45));   // arrow travels to centre over phase A

    // Phase A — the last section (contact + footer) and header fade away.
    if (this.sec7) {
      const o = 1 - a;
      this.sec7.style.opacity = o.toFixed(3);
      this.sec7.style.visibility = o > 0.02 ? 'visible' : 'hidden';
      this.sec7.style.pointerEvents = 'none';
      this.sec7.style.transform = 'translateY(' + (a * -12) + 'px)';
    }
    this.showHeader(false);
    this.setLoopLabel('Keep scrolling');

    // Arrow glides to screen centre; a small spin builds with scroll.
    if (this.arrow) {
      const leftHome = w / 2 - 60;
      const centerTop = h / 2 - 60;
      const bottomPx = Math.max(28, Math.min(56, h * 0.05));
      const homeTop = h - 120 - bottomPx;
      this.arrow.style.top = (homeTop + (centerTop - homeTop) * a) + 'px';
      this.arrow.style.bottom = 'auto';
      this.arrow.style.left = leftHome + 'px';
      this._loopSpin = 180 * a;
      this.arrow.style.transform = 'rotate(' + this._loopSpin + 'deg)';
      if (this.arrowIcon) this.arrowIcon.style.setProperty('--arrow-rot', '180deg');
    }

    // Once centred, hand off to the automatic "loading" return.
    if (a >= 0.995 && !this.autoReturn && !this.loopResetting) this.runHomeReturn();
  }

  runHomeReturn() {
    this.autoReturn = true;
    this.runStep(6, 2.1, false);   // door closes while the arrow spins and the hero returns
    if (this.reduced) { this.resetToHome(); this.autoReturn = false; return; }
    const w = window.innerWidth, h = window.innerHeight;
    const centerTop = h / 2 - 60;
    const bottomPx = Math.max(28, Math.min(56, h * 0.05));
    const homeTop = h - 120 - bottomPx;
    const SPIN = 1200, REVEAL = 900;
    const spinStart = this._loopSpin || 0;
    const loadSpeed = 0.7;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const t0 = performance.now();
    this.setLoopLabel('Loading');
    // Reset scroll and switch video immediately (content already hidden by _updateHomeScroll)
    window.scrollTo(0, 0);
    this.currentSection = 0;
    this.idleSection = null;
    this.bandKey = 'r0';
    this.inTrans = false;
    this._transPlaying = false;
    // Hide hero elements for reveal
    if (this.heroTitle) { this.heroTitle.style.opacity = '0'; this.heroTitle.style.transform = 'translateY(22px)'; }
    if (this.heroScrim) this.heroScrim.style.opacity = '0';
    this.showHeader(false);
    const step = (now) => {
      const el = now - t0;
      // Phase 1: spin at center while hero content is hidden
      if (el < SPIN) {
        this._loopSpin = spinStart + loadSpeed * el;
        this.arrow.style.top = centerTop + 'px';
        this.arrow.style.transform = 'rotate(' + this._loopSpin + 'deg)';
        this.hrf = requestAnimationFrame(step);
        return;
      }
      // Phase 2: reveal hero content, arrow glides back to bottom
      const p = Math.min(1, (el - SPIN) / REVEAL);
      const e = easeIO(p);
      if (this.heroTitle) { this.heroTitle.style.opacity = e.toFixed(3); this.heroTitle.style.transform = 'translateY(' + ((1 - e) * 22) + 'px)'; }
      if (this.heroScrim) this.heroScrim.style.opacity = e.toFixed(3);
      this.showHeader(e > 0.5);
      this.arrow.style.top = (centerTop + (homeTop - centerTop) * e) + 'px';
      const spinEnd = spinStart + loadSpeed * SPIN;
      const spinTarget = Math.ceil(spinEnd / 360 + 1) * 360;
      this.arrow.style.transform = 'rotate(' + (spinEnd + (spinTarget - spinEnd) * easeOut(e)) + 'deg)';
      if (e > 0.6) this.setLoopLabel('Scroll to unlock');
      if (p < 1) { this.hrf = requestAnimationFrame(step); return; }
      // Done
      this.autoReturn = false;
      this.inLoop = false;
      this.exitLoopCleanup();
      this.loopResetting = true;
      requestAnimationFrame(() => { this.handle(0); this.loopResetting = false; });
    };
    this.hrf = requestAnimationFrame(step);
  }

  setLoopLabel(text) {
    if (this._loopLabel === text) return;
    this._loopLabel = text;
    if (this.ringText) this.ringText.textContent = text.toUpperCase() + ' \u00b7 ' + text.toUpperCase() + ' \u00b7 ';
    this.arrowState = 'loop';
  }

  exitLoopCleanup() {
    if (this.arrow) {
      this.arrow.style.transform = 'rotate(0deg)';
      this.arrow.style.top = 'auto';
      this.arrow.style.bottom = 'clamp(28px,calc(5*var(--vh,1vh)),56px)';
    }
    if (this.sec7) this.sec7.style.pointerEvents = '';
    this.arrowState = null;
    this._loopLabel = null;
  }

  resetToHome() {
    this.inLoop = false;
    this.exitLoopCleanup();
    if (this.lenis) this.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => { this.handle(0); this.loopResetting = false; });
  }
}

function boot() {
  // Reloads must start at the hero: the browser's own scroll restoration would land mid-page.
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (window.scrollY) window.scrollTo(0, 0);
  var o = SH.options || {}, h = SH.hero || {};
  var pa = o.preloader_assets || {};
  var on = function (v) { return v !== false && v !== 0 && v !== '0' && v !== ''; };
  var props = {
    customCursor: on(o.custom_cursor),
    animations: on(o.animations),
    preloader: on(o.preloader),
    preloadAssets: { logo: on(pa.logo), video: on(pa.video), still: on(pa.poster), gallery: on(pa.gallery), fonts: on(pa.fonts), next: on(pa.next_section), warmup: on(pa.warmup) },
    qualityDesktop: o.video_quality || '720p',
    qualityMobile: o.mobile_video_quality || '480p',
    gsapDesktop: on(o.gsap_desktop),
    gsapMobile: on(o.gsap_mobile),
    gsapFiles: SH.gsapFiles || [],
    clips: (h.clips && h.clips.length === 14) ? h.clips : [4.04, 5.04, 4.04, 5.04, 4.04, 5.04, 5, 5.04, 5, 5.04, 4.04, 5.04, 4.04, 5.04],
    video: { '480': h.video_480 || '', '720': h.video_720 || '', '1080': h.video_1080 || '' },
    logo: h.logo_url || '',
    still: h.poster_url || '',
    firstName: h.first_name || '',
    lastName: h.last_name || '',
    scrollText: h.scroll_text || '',
    preloadGallery: SH.preloadGallery || [],
    sections: SH.sections || {},
    contact: { ajaxUrl: SH.ajaxUrl || '', nonce: SH.nonce || '', recaptcha: (SH.contact && SH.contact.recaptcha_site) || '' }
  };
  new App(props).componentDidMount();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
