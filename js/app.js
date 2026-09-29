(function() {
'use strict';

var SH_ASSETS = (window.shTheme && window.shTheme.assetUrl) || '';
function assetImg(path) { return SH_ASSETS ? SH_ASSETS + 'images/' + path : 'uploads/' + path; }
function assetVid(path) { return SH_ASSETS ? SH_ASSETS + 'video/' + path : 'uploads/' + path; }
var _sh = window.shTheme || {};
var _sec = _sh.sections || {};
var _hero = _sh.hero || {};
var _opts = _sh.options || {};
var _contact = _sh.contact || {};

var self = { props: { videoQuality: _opts.video_quality || "720p", customCursor: _opts.custom_cursor !== false } };
function init() {
    self.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gate = document.querySelector('[data-gate]');
    if (gate && sessionStorage.getItem('sh_gate_dismissed') === '1') gate.setAttribute('data-dismissed', '1');
    if (gate) {
      const cont = gate.querySelector('[data-gate-continue]');
      if (cont) cont.addEventListener('click', () => { gate.setAttribute('data-dismissed', '1'); try { sessionStorage.setItem('sh_gate_dismissed', '1'); } catch (e) {} });
      const vid = gate.querySelector('video');
    }
    self.root = document.querySelector('[data-stage-root]');
    if (!self.root) return;
    self.spacer = self.root.querySelector('[data-spacer]');
    self.arrow = self.root.querySelector('[data-arrow]');
    self.header = self.root.querySelector('[data-header]');
    self.sec2 = self.root.querySelector('[data-sec2]');
    self.sec3 = self.root.querySelector('[data-sec3]');
    self.sec5 = self.root.querySelector('[data-sec5]');
    self.sec6 = self.root.querySelector('[data-sec6]');
    self.sec7 = self.root.querySelector('[data-sec7]');
    self.sec4 = self.root.querySelector('[data-sec4]');
    self.activeInst = null;
    self.heroTitle = self.root.querySelector('[data-hero-title]');
    self.heroH1 = self.heroTitle ? self.heroTitle.querySelector('h1') : null;
    self.applyHeroFont();
    self.heroScrim = self.root.querySelector('[data-hero-scrim]');
    self.arrowIcon = self.root.querySelector('[data-arrow-icon]');
    self.ringWrap = self.root.querySelector('[data-ring-wrap]');
    self.ringText = self.root.querySelector('[data-textpath]');
    self.collageEl = self.root.querySelector('[data-collage]');
    self.mouse = { x: -9999, y: -9999, on: false };
    self.stageVideo = self.root.querySelector('[data-stage-video]');
    self.transCanvas = self.root.querySelector('[data-trans-canvas]');
    self.transCtx = self.transCanvas ? self.transCanvas.getContext('2d') : null;
    self.gateVideo = document.querySelector('[data-gate-video]');
    self.N = 7;                 // 7 rest sections, 6 transitions
    self.LOOP_T = [[0, 6.0], [11.8, 17.9], [24.0, 30.0], [36.1, 42.1], [48.1, 54.2], [62.3, 68.4]];
    self.TRANS_T = [[6.0, 11.8], [17.9, 24.0], [30.0, 36.1], [42.1, 48.1], [54.2, 62.3], [68.4, 72.5]];
    self.qualitySrc = { '480p': _hero.video_480 || assetVid('full-video-480p.mp4'), '720p': _hero.video_720 || assetVid('full-video-720p.mp4'), '1080p': _hero.video_1080 || assetVid('full-video-1080p.mp4') };

    // quality: '480p' / '720p' (default) / '1080p'. localStorage lets the
    // on-page toggle persist; falls back to the Tweaks prop default.
    self.quality = self.urlProp('quality') || localStorage.getItem('sh_vq') || (self.props.videoQuality || '720p');
    self.applyQuality(self.quality, true);
    self.finishFrac = 0.2;         // first fifth of a band drives the loop to its last frame

    // React drops bare boolean media attrs — set as properties.
    if (self.stageVideo) { self.stageVideo.muted = true; self.stageVideo.defaultMuted = true; self.stageVideo.playsInline = true; }
    self.primeLoops();
    self.loopClipA(self.gateVideo);

    self.currentSection = 0;
    self.inTrans = false;
    self.bandKey = '';
    self.idleSection = null;
    self.idleDir = 1;
    self._transPlaying = false;

    self.layout();
    self.bindArrow();
    self.bindMenu();
    self.onArrowPtr = (e) => { self.mouse.x = e.clientX; self.mouse.y = e.clientY; self.mouse.on = true; };
    self.onArrowLeave = () => { self.mouse.on = false; };
    window.addEventListener('pointermove', self.onArrowPtr, { passive: true });
    window.addEventListener('pointerleave', self.onArrowLeave, { passive: true });
    self.bindKeys();
    self.bootContent();

    self.onResize = () => { self.layout(); self.pbs && self.pbs.forEach(p => self.layoutPb(p)); self.handle(self.readY()); if (self.headEl) { self.headEl._hRect = self.headEl.getBoundingClientRect(); if (self.headEl._clone) self.headEl._clone.style.width = self.headEl._hRect.width + 'px'; } };
    window.addEventListener('resize', self.onResize, { passive: true });

    const frame = (now) => { const dt = self._lastFrameT != null ? Math.min(0.05, (now - self._lastFrameT) / 1000) : 0; self._lastFrameT = now; self.renderFrame(dt); self.tickPlaybook(now); self.tickPods(); self.tickTestis(); self.tickCollage(); self.tickArrowMagnet(); self.tickMenu(); if (self.cur) self.tickCursor(); self.raf = requestAnimationFrame(frame); };    self.raf = requestAnimationFrame(frame);

    self.handle(0);
    self.runPreloader();
    self.initCursor();
  }

function bootContent() {
    self.buildTimeline();
    self.buildPlaybook();
    self.buildVentures();
    self.buildGallery();
    self.buildPods();
    self.buildTestis();
    self.buildChat();
    self.wireSocialPopup();
    self.buildCollage();
    self.addHovers();
    self.loadDepsThenScroll();
  }

function isMobile() { return window.innerWidth <= 768; }

function initCursor() {
    if (self._curOn) return;
    if (_opts.custom_cursor === false) return;
    const fine = window.matchMedia('(pointer:fine)').matches;
    if (!fine || self.reduced || self.isMobile()) return;
    self._curOn = true;
    self.CH = 'ABCDEF0123456789{}[]/<>=+*#$%&'.split('');
    self.curLens = document.querySelector('[data-cur="lens"]');
    self.curDot = document.querySelector('[data-cur="dot"]');
    if (!self.curLens || !self.curDot) { self._curOn = false; return; }
    const st = document.createElement('style');
    st.textContent = 'html.vault-cur,html.vault-cur *{cursor:none!important}';
    document.head.appendChild(st);
    document.documentElement.classList.add('vault-cur');
    self.allHeads = Array.from(self.root.querySelectorAll('h1,h2,h3'));
    self.cur = { x: innerWidth / 2, y: innerHeight / 2, lx: innerWidth / 2, ly: innerHeight / 2, _px: 0, _py: 0, speed: 0, mode: 'default', scale: 0.36, vis: false };
    self.headEl = null;
    self.curIcon = self.curLens.querySelector('[data-cur="icon"]');
    self.curRing = self.curLens.querySelector('[data-cur="ring"]');
    self.curRingText = self.curLens.querySelector('[data-cur-ringtext]');
    self.curIcons = {
      camera: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4l1.6 2.6H20A1.5 1.5 0 0 1 21.5 8.1V18A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V8.1A1.5 1.5 0 0 1 4 6.6h3.9L9.5 4z"/><circle cx="12" cy="12.6" r="3.3"/></svg>',
      hdrag: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M7 8l-4 4 4 4"/><path d="M17 8l4 4-4 4"/></svg>',
      vdrag: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/></svg>',
      rotate: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 4v5h-5"/></svg>'
    };
    self.SEL = {
      caret: 'input,textarea,[contenteditable="true"]',
      probe: 'a,button,[role="button"]',
      dialer: '[data-pb-cluster]',
      hdrag: '[data-tl-viewport],[data-pod-ring]',
      vdrag: '[data-testi-col]',
      media: 'image-slot,[data-frame]',
      heading: 'h1,h2,h3'
    };
    self.onCurMove = (e) => {
      const c = self.cur;
      c.x = e.clientX; c.y = e.clientY;
      if (!c.vis) { c.vis = true; self.applyCurStyle(); }
      const t = document.elementFromPoint(e.clientX, e.clientY);
      self.classifyCur(t);
    };
    self.onCurDown = () => { if (self.cur) { self.cur.pressed = true; self.applyCurStyle(); } };
    self.onCurUp = () => { if (self.cur) { self.cur.pressed = false; self.applyCurStyle(); } };
    self.onCurOut = (e) => { if (!e.relatedTarget && self.cur) { self.cur.vis = false; self.curLens.style.opacity = '0'; self.curDot.style.opacity = '0'; } };
    window.addEventListener('pointermove', self.onCurMove, { passive: true });
    window.addEventListener('pointerdown', self.onCurDown, { passive: true });
    window.addEventListener('pointerup', self.onCurUp, { passive: true });
    document.addEventListener('pointerout', self.onCurOut, { passive: true });
    self.setupCursorEditGuard();
  }

  // In an editor (Claude edit mode) the custom cursor gets in the way of direct
  // element editing, so auto-disable it whenever the page looks editable, and
  // expose window.vaultCursor.toggle()/off()/on() as a manual override.
function setupCursorEditGuard() {
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
    const apply = () => { if (self._curForced != null) return; if (editable()) self.disableCursor(); else self.enableCursor(); };
    self._curObs = new MutationObserver(apply);
    try { self._curObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'contenteditable', 'data-om-editing', 'data-editing'] }); } catch (e) {}
    if (document.body) { try { self._curObs.observe(document.body, { attributes: true, attributeFilter: ['class', 'contenteditable'] }); } catch (e) {} }
    document.addEventListener('focusin', apply, true);
    document.addEventListener('focusout', apply, true);
    self._curKey = (e) => { if (e.altKey && (e.key === 'c' || e.key === 'C')) { self._curForced = self._curDisabled ? false : true; if (self._curForced) self.disableCursor(); else self.enableCursor(); } };
    window.addEventListener('keydown', self._curKey);
    window.vaultCursor = { off: () => { self._curForced = true; self.disableCursor(); }, on: () => { self._curForced = false; self.enableCursor(); }, auto: () => { self._curForced = null; apply(); }, toggle: () => { self._curForced = !self._curDisabled; self._curForced ? self.disableCursor() : self.enableCursor(); } };
    self._curApply = apply;
    self.applyCursorPref();
    apply();
  }

function urlProp(name) {
    if (!self._urlParams) return null;
    const v = self._urlParams.get(name);
    if (v == null) return null;
    if (name === 'cursor' || name === 'testimonial') return v === '1';
    return v;
  }

function applyCursorPref() {
    if (!self._curOn) return;
    const cursorOverride = self.urlProp('cursor');
    const on = cursorOverride !== null ? cursorOverride : (self.props.customCursor ?? true) !== false;
    if (!on) { self._curForced = true; self.disableCursor(); }
    else { if (self._curForced === true) self._curForced = null; if (self._curApply) self._curApply(); }
  }

function disableCursor() {
    if (self._curDisabled) return; self._curDisabled = true;
    document.documentElement.classList.remove('vault-cur');
    if (self.curLens) self.curLens.style.opacity = '0';
    if (self.curDot) self.curDot.style.opacity = '0';
  }

function enableCursor() {
    if (!self._curDisabled) return; self._curDisabled = false;
    document.documentElement.classList.add('vault-cur');
  }

function _isPodCenter(cardEl) {
    if (!cardEl || self.podCenter < 0) return false;
    const i = +cardEl.getAttribute('data-i');
    return i === (((self.podCenter % self.podN) + self.podN) % self.podN);
  }

function classifyCur(t) {
    let mode = 'default', el = null;
    if (t) {
      if (t.closest(self.SEL.caret)) mode = 'caret';
      else if (t.closest(self.SEL.probe)) mode = 'probe';
      else if (t.closest('[data-tl-item-img]')) mode = 'clickview';
      else if (t.closest('[data-vgallery] image-slot') || t.closest('[data-vgallery] img')) mode = 'clickview';
      else if (t.closest('[data-pb-topic]') && t.closest('[data-pb-cluster]')) mode = 'clickview';
      else if (t.closest('[data-pod-card]') && self.pods && self._isPodCenter(t.closest('[data-pod-card]'))) mode = 'clickview';
      else if (t.closest(self.SEL.dialer)) mode = 'dialer';
      else if (t.closest(self.SEL.hdrag)) mode = 'hdrag';
      else if (t.closest(self.SEL.vdrag)) mode = 'vdrag';
      else if (t.closest(self.SEL.media)) mode = 'media';
      else if ((el = self.hitHeading(self.cur.x, self.cur.y))) mode = 'heading';
    }
    self.setHeadEl(mode === 'heading' ? el : null);
    if (mode !== self.cur.mode) { self.cur.mode = mode; self.applyCurStyle(); }
  }

function applyCurStyle() {
    const c = self.cur, L = self.curLens, D = self.curDot, I = self.curIcon, RG = self.curRing;
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
      I.innerHTML = (m === 'media' || m === 'clickview') ? self.curIcons.camera : m === 'hdrag' ? self.curIcons.hdrag : m === 'vdrag' ? self.curIcons.vdrag : self.curIcons.rotate;
      if (RG && self.curRingText) { self.curRingText.textContent = m === 'media' || m === 'clickview' ? 'CLICK TO VIEW \u00b7 CLICK TO VIEW \u00b7 ' : 'DRAG TO SCROLL \u00b7 DRAG TO SCROLL \u00b7 '; RG.style.display = 'block'; }
    } else {
      L.style.opacity = '1'; D.style.opacity = '1';
      L.style.width = '34px'; L.style.height = '34px'; L.style.borderRadius = '999px';
    }
  }

function addHovers() {
    const root = self.root;
    const add = (sel, cls) => root.querySelectorAll(sel).forEach(e => e.classList.add(cls));
    ['[data-req]', '[data-menu-toggle]', '[data-vprev]', '[data-vnext]', '[data-pb-expand]', '[data-pb-cta]', '[data-tl-modal-cta]', '[data-pod-prev]', '[data-pod-next]', '[data-chat-plus]', '[data-chat-type]', '[data-tl-plus]', '[data-vg-prev]', '[data-vg-next]', '[data-gallery-prev]', '[data-gallery-next]', '[data-gallery-close]', '[data-tl-modal-close]', '[data-pod-close]', '[data-testi-plat]'].forEach(s => add(s, 'v-hbtn'));
    add('[data-menu-close]', 'v-grow');
    root.querySelectorAll('[data-sec3] a').forEach(a => {
      a.onmouseover = null; a.onmouseout = null; a.removeAttribute('onmouseover'); a.removeAttribute('onmouseout'); a.classList.add('v-hbtn');
      if (a.hasAttribute('data-ext-cta')) return;
      a.addEventListener('click', (e) => { e.preventDefault(); self.scrollToLastSection(1.4); });
    });
    if (self.sec7) self.sec7.querySelectorAll('a').forEach(a => { a.classList.add('v-hbtn'); a.classList.add('v-soc'); });
    const play = root.querySelector('[data-pod-play]'); if (play) play.classList.add('v-grow');
    const send = root.querySelector('[data-chat-send]'); if (send) send.classList.add('v-send');
    root.querySelectorAll('[data-menu-link]').forEach(a => a.classList.add('v-mgrow'));
    root.querySelectorAll('[data-vdot]').forEach(b => b.classList.add('v-grow'));
    const badge = root.querySelector('[data-header] a[aria-label] span'); if (badge) badge.classList.add('v-hbtn');
    const logoA = root.querySelector('[data-header] a[aria-label]'); if (logoA) logoA.addEventListener('mouseenter', () => self.scrambleLogo());
    const req = root.querySelector('[data-req]'); if (req) req.addEventListener('click', (e) => { e.preventDefault(); self.scrollToLastSection(1.4); });
    root.querySelectorAll('[data-pb-cta]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); self.scrollToLastSection(1.4); }));
  }

function scrambleLogo() {
    const a = self.root.querySelector('[data-header] a[aria-label]'); if (!a) return;
    const span = a.querySelectorAll('span')[1]; if (!span) return;
    if (self._logoScrambling) return;
    self._logoScrambling = true;
    const real = span.textContent;
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>#'.split('');
    const len = real.length, dur = 46; let frame = 0;
    const step = () => {
      frame++;
      const lock = Math.floor(len * frame / dur);
      let s = '';
      for (let i = 0; i < len; i++) { const ch = real[i]; if (ch === ' ' || ch === '\u00a0') { s += ch; continue; } s += i < lock ? ch : CH[(Math.random() * CH.length) | 0]; }
      span.textContent = s;
      if (frame < dur) requestAnimationFrame(step); else { span.textContent = real; self._logoScrambling = false; }
    };
    step();
  }

function buildGallery() {
    if (!self.sec3) return;
    self.galleryLb = document.querySelector('[data-gallery-lb]');
    if (!self.galleryLb) return;
    const img = self.galleryLb.querySelector('img');
    self.galleryList = []; self.galleryIdx = 0;
    const showAt = (i) => {
      const n = self.galleryList.length; if (!n) return;
      self.galleryIdx = ((i % n) + n) % n;
      img.src = self.galleryList[self.galleryIdx];
    };
    const open = (list, i) => { self.galleryList = list; showAt(i); self.galleryLb.style.display = 'flex'; requestAnimationFrame(() => { self.galleryLb.style.opacity = '1'; }); };
    self.closeGalleryLb = () => { self.galleryLb.style.opacity = '0'; setTimeout(() => { self.galleryLb.style.display = 'none'; img.src = ''; }, 300); };
    self.sec3.querySelectorAll('[data-vgallery]').forEach((wrap) => {
      const track = wrap.querySelector('[data-vg-track]');
      const items = Array.from(track.children);
      const getSrcs = () => items.map((it) => { const el = it.querySelector('image-slot,img'); return el ? (el.tagName === 'IMG' ? el.src : (el.getAttribute('src') || '')) : ''; });
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
    const lbPrev = self.galleryLb.querySelector('[data-gallery-prev]'), lbNext = self.galleryLb.querySelector('[data-gallery-next]');
    if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); showAt(self.galleryIdx - 1); });
    if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); showAt(self.galleryIdx + 1); });
    self.galleryLb.addEventListener('click', (e) => { if (e.target === self.galleryLb) self.closeGalleryLb(); });
    const cl = self.galleryLb.querySelector('[data-gallery-close]');
    if (cl) cl.addEventListener('click', () => self.closeGalleryLb());
    document.addEventListener('keydown', (e) => {
      if (!self.galleryLb || self.galleryLb.style.display !== 'flex') return;
      if (e.key === 'Escape') self.closeGalleryLb();
      else if (e.key === 'ArrowRight') showAt(self.galleryIdx + 1);
      else if (e.key === 'ArrowLeft') showAt(self.galleryIdx - 1);
    });
  }

function hitHeading(x, y) {
    if (self.menuOpen) return null;
    const heads = self.allHeads; if (!heads) return null;
    let best = null, bestOp = 0.6;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const r = h.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const op = self.headOpacity(h);
      if (op > bestOp) { bestOp = op; best = h; }
    }
    return best;
  }

function headOpacity(h) {
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

function setHeadEl(el) {
    if (el === self.headEl) return;
    if (self.headEl) self.exitHead(self.headEl);
    self.headEl = el;
    if (el) self.enterHead(el);
  }

function enterHead(el) {
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
    self.curLens.appendChild(el._clone);
    const d = Math.round(el._hLineH * 1.5);
    self.curLens.style.width = d + 'px';
    self.curLens.style.height = d + 'px';
    self.curLens.style.borderRadius = '999px';
  }

function exitHead(el) {
    if (el._clone && el._clone.parentNode === self.curLens) self.curLens.removeChild(el._clone);
    if (el._cloneNodes) el._cloneNodes.forEach(o => { o.node.nodeValue = o.real; });
  }

function headScramble(el, decoded) {
    if (!el._cloneNodes) return;
    if (decoded) { el._cloneNodes.forEach(o => { if (o.node.nodeValue !== o.real) o.node.nodeValue = o.real; }); return; }
    const CH = self.CH;
    el._cloneNodes.forEach(o => {
      const r = o.real; let s = '';
      for (let i = 0; i < r.length; i++) { const ch = r[i]; s += (ch === ' ' || ch === '\u00a0' || ch === '\n' || ch === '\t') ? ch : CH[(Math.random() * CH.length) | 0]; }
      o.node.nodeValue = s;
    });
  }

function tickCursor() {
    if (self._curDisabled) return;
    const c = self.cur; if (!c || !c.vis) return;
    c.lx += (c.x - c.lx) * 0.22;
    c.ly += (c.y - c.ly) * 0.22;
    const dx = c.x - c._px, dy = c.y - c._py;
    c._px = c.x; c._py = c.y;
    c.speed += (Math.hypot(dx, dy) - c.speed) * 0.3;
    self.curDot.style.transform = 'translate(' + c.x + 'px,' + c.y + 'px) translate(-50%,-50%)';
    const L = self.curLens, W = L.offsetWidth || 34, H = L.offsetHeight || 34;
    if (c.mode === 'heading' && self.headEl) {
      const el = self.headEl, R = el._hRect, lh = el._hLineH;
      const lines = Math.max(1, Math.round(R.height / lh));
      let li = Math.floor((c.y - R.top) / lh); li = Math.max(0, Math.min(lines - 1, li));
      const cx = c.lx, cy = R.top + li * lh + lh / 2;
      const Ll = cx - W / 2, Lt = cy - H / 2;
      L.style.transform = 'translate(' + Ll + 'px,' + Lt + 'px)';
      if (el._clone) el._clone.style.transform = 'translate(' + (R.left - Ll) + 'px,' + (R.top - Lt) + 'px)';
      c._sf = (c._sf || 0) + 1;
      if (c._sf % 2 === 0) self.headScramble(el, c.speed < 0.8);
    } else {
      L.style.transform = 'translate(' + (c.lx - W / 2) + 'px,' + (c.ly - H / 2) + 'px)';
    }
  }

  function destroy() {
    if (self.raf) cancelAnimationFrame(self.raf);
    if (self.hrf) cancelAnimationFrame(self.hrf);
    if (self.lrf) cancelAnimationFrame(self.lrf);
    if (self._scrollAnim) cancelAnimationFrame(self._scrollAnim);
    if (self._wheelHandler) window.removeEventListener('wheel', self._wheelHandler);
    if (self._touchStart) window.removeEventListener('touchstart', self._touchStart);
    if (self._touchMove) window.removeEventListener('touchmove', self._touchMove);
    if (self.lenis) self.lenis.destroy();
    if (self.onResize) window.removeEventListener('resize', self.onResize);
    if (self.onScrollNative) window.removeEventListener('scroll', self.onScrollNative);
    if (self.onKey) window.removeEventListener('keydown', self.onKey);
    if (self.onCollageMove) window.removeEventListener('pointermove', self.onCollageMove);
    if (self.onArrowPtr) window.removeEventListener('pointermove', self.onArrowPtr);
    if (self.onArrowLeave) window.removeEventListener('pointerleave', self.onArrowLeave);
    if (self.onMenuKey) window.removeEventListener('keydown', self.onMenuKey);
    if (self.onCollageLeave) window.removeEventListener('pointerleave', self.onCollageLeave);
    if (self._tlMove) window.removeEventListener('pointermove', self._tlMove);
    if (self._tlUp) { window.removeEventListener('pointerup', self._tlUp); window.removeEventListener('pointercancel', self._tlUp); }
    if (self._tlReclamp) window.removeEventListener('resize', self._tlReclamp);
    if (self.tlIrf) cancelAnimationFrame(self.tlIrf);
    if (self._preRAF) cancelAnimationFrame(self._preRAF);
    if (self._preBlock) { window.removeEventListener('wheel', self._preBlock); window.removeEventListener('touchmove', self._preBlock); }
  }

function runPreloader() {
    if (self._preRan) return;
    self._preRan = true;
    let skip = false;
    try {
      const q = new URLSearchParams(window.location.search).get('preloader');
      if (q === '0') skip = true;
      else if (q === '1') skip = false;
    } catch (e) {}
    self._urlParams = null;
    try { self._urlParams = new URLSearchParams(window.location.search); } catch (e) {}
    if (skip) {
      self.pre = self.root.querySelector('[data-preloader]');
      if (self.pre) { self.pre.style.display = 'none'; self.pre.style.opacity = '0'; }
      self.primeLoops();
      return;
    }
    self.pre = self.root.querySelector('[data-preloader]');
    if (!self.pre) return;
    self.preS1 = self.pre.querySelector('[data-pre-s1]');
    self.preS2 = self.pre.querySelector('[data-pre-s2]');
    self.preRingText = self.pre.querySelector('[data-pre-ringtext]');
    self.preWave = self.pre.querySelector('[data-pre-wave]');
    self.preArrow = self.pre.querySelector('[data-pre-arrow]');
    self.preVid = self.pre.querySelector('[data-pre-video]');
    self.preVeil = self.pre.querySelector('[data-pre-veil]');
    if (self.preVid) { self.preVid.muted = true; self.preVid.playsInline = true; const p = self.preVid.play(); if (p && p.catch) p.catch(() => {}); }
    self.loopClipA && self.loopClipA(self.preVid);
    if (self.reduced) { self.finishPreloader(true); return; }
    // lock the page at the top while assets prime
    try { window.scrollTo(0, 0); } catch (e) {}
    if (self.lenis) { try { self.lenis.scrollTo(0, { immediate: true }); self.lenis.stop(); } catch (e) {} }
    self._preBlock = (e) => { e.preventDefault(); };
    window.addEventListener('wheel', self._preBlock, { passive: false });
    window.addEventListener('touchmove', self._preBlock, { passive: false });
    self._preProg = 0; self._preTarget = 0; self._preDone = false;
    self._preStart = performance.now();
    self.preScrambleRAF();
    self.preload().then(() => self.finishPreloader(false));
  }

function preload() {
    const imgTask = (src) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => res(); im.decoding = 'async'; im.src = src; setTimeout(res, 7000); });
    const tasks = [];
    // Priority 0 - the logo mark, since it renders above the fold in the header immediately.
    if (_hero.logo_url) tasks.push(imgTask(_hero.logo_url));
    if (self.stageVideo) tasks.push(new Promise((res) => {
      const v = self.stageVideo;
      if (v.readyState >= 3) return res();
      const done = () => { v.removeEventListener('canplay', done); v.removeEventListener('canplaythrough', done); v.removeEventListener('error', done); res(); };
      v.addEventListener('canplay', done, { once: true });
      v.addEventListener('canplaythrough', done, { once: true });
      v.addEventListener('error', done, { once: true });
      try { v.preload = 'auto'; v.load(); } catch (e) {}
      setTimeout(done, 9000);
    }));
    if (_hero.poster_url) tasks.push(imgTask(_hero.poster_url));
    var venData = _sec.ventures || [];
    if (venData.length > 0 && venData[0].gallery_thumbs) {
      venData[0].gallery_thumbs.slice(0, 2).forEach(function(u) { if (u) tasks.push(imgTask(u)); });
    }
    const total = tasks.length; let done = 0;
    self._preMinUntil = performance.now() + 5000;
    return new Promise((resolve) => {
      if (!total) { self._preTarget = 1; return resolve(); }
      tasks.forEach((t) => t.then(() => { done++; self._preTarget = done / total; if (done >= total) resolve(); }));
    });
  }

function preScrambleRAF() {
    const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$@01/';
    const full = 'SAAD HASHMANI'.split('');
    const len = full.length;
    const step = () => {
      self._preProg += ((self._preTarget || 0) - self._preProg) * 0.09;
      const timeP = (performance.now() - (self._preStart || 0)) / 5200;
      const p = self._preDone ? 1 : Math.min(Math.min(0.999, self._preProg), timeP);
      const lockR = Math.round(p * len);           // resolve left-to-right
      const out = full.map((c, i) => {
        if (c === ' ') return ' ';
        return (i < lockR) ? c : CH[(Math.random() * CH.length) | 0];
      });
      if (self.preS1) self.preS1.textContent = out.slice(0, 4).join('');
      if (self.preS2) self.preS2.textContent = out.slice(5).join('');
      // background image reveals (opacity rises) as loading progresses
      if (self.preVeil) self.preVeil.style.opacity = (0.9 - p * 0.9).toFixed(3);
      if (!self._preDone) self._preRAF = requestAnimationFrame(step);
    };
    self._preRAF = requestAnimationFrame(step);
  }

function finishPreloader(instant) {
    const go = () => {
      self._preDone = true; self._preTarget = 1; self._preProg = 1;
      if (self._preRAF) cancelAnimationFrame(self._preRAF);
      if (self.preS1) self.preS1.textContent = 'Saad';
      if (self.preS2) self.preS2.textContent = 'Hashmani';
      // waveform morphs into the scroll arrow, ring text becomes the hero label
      if (self.preWave) self.preWave.style.opacity = '0';
      if (self.preArrow) self.preArrow.style.opacity = '1';
      if (self.preRingText) self.preRingText.textContent = 'SCROLL TO UNLOCK \u00b7 SCROLL TO UNLOCK \u00b7 ';
      setTimeout(() => {
        if (!self.pre) return;
        self.pre.style.opacity = '0';
        self.pre.style.pointerEvents = 'none';
        if (!self.reduced) self.heroIntro();
        if (self._preBlock) { window.removeEventListener('wheel', self._preBlock); window.removeEventListener('touchmove', self._preBlock); self._preBlock = null; }
        if (self.lenis) { try { self.lenis.start(); } catch (e) {} }
        setTimeout(() => { if (self.pre) self.pre.style.display = 'none'; if (self.preVid) { try { self.preVid.pause(); self.preVid.removeAttribute('src'); self.preVid.load(); } catch (e) {} } }, 950);
      }, instant ? 0 : 560);
    };
    if (instant) return go();
    const wait = Math.max(0, (self._preMinUntil || 0) - performance.now());
    setTimeout(go, wait);
  }

function heroIntro() {
    const E = 'cubic-bezier(.16,1,.3,1)';
    self._introLock = true;
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
    if (self.colEls && self.colEls.length) {
      const n = self.colEls.length, mid = (n - 1) / 2;
      self.colEls.forEach((col, i) => {
        const fromLeft = i < n / 2;
        col.style.transition = 'none';
        col.style.opacity = '0';
        col.style.transform = 'translateX(' + (fromLeft ? -52 : 52) + 'px)';
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        self.colEls.forEach((col, i) => {
          col.style.transition = 'opacity 1s ' + E + ', transform 1.2s ' + E;
          col.style.transitionDelay = Math.round(Math.abs(i - mid) * 34) + 'ms';
          col.style.opacity = '1';
          col.style.transform = 'translateX(0)';
        });
      }));
      setTimeout(() => { self.colEls.forEach(col => { col.style.transition = ''; col.style.transform = ''; col.style.transitionDelay = ''; }); }, 2000);
    }
    // top-left logo, top-right CTA/menu group
    const logo = self.header ? self.header.querySelector('a[aria-label]') : null;
    const rightGroup = self.headerCta ? self.headerCta.parentElement : null;
    reveal(logo, -28, 0, 0.8, 120);
    reveal(rightGroup, 28, 0, 0.8, 120);
    // eyebrow fades down into place
    const eb = self.heroTitle ? self.heroTitle.querySelector('[data-eyebrow]') : null;
    reveal(eb, 0, -18, 0.8, 260);
    setTimeout(() => { self._introLock = false; }, 1700);
  }


function layout() {
    const h = window.innerHeight, w = window.innerWidth;
    const REST = h * 0.7, TRANS = h * 1.0;
    self.segs = [];
    let off = 0;
    for (let i = 0; i < self.N; i++) {
      self.segs.push({ type: 'rest', i, start: off, h: REST }); off += REST;
      if (i < self.N - 1) { self.segs.push({ type: 'trans', i, start: off, h: TRANS }); off += TRANS; }
    }
    self.total = off;
    self.loopH = h * 1.6;                       // "return to home" band after the last section
    self.loopStart = self.total;
    self.scrollEnd = self.total + self.loopH;
    self.spacer.style.height = (self.scrollEnd + h) + 'px';   // fixed stage → +1 viewport so the last frame is reachable
    self.restStart = self.segs.filter(s => s.type === 'rest').map(s => s.start);
  }

function readY() {
    if (self.lenis && typeof self.lenis.scroll === 'number') return self.lenis.scroll;
    return window.scrollY || window.pageYOffset || 0;
  }

function segAt(y) {
    for (const s of self.segs) { if (y < s.start + s.h) return s; }
    return self.segs[self.segs.length - 1];
  }

function primeLoops() {
    if (!self.stageVideo) return;
    self.stageVideo.preload = 'auto';
    try { self.stageVideo.load(); } catch (e) {}
  }

function loopClipA(v) {
    if (!v) return;
    const [s0, s1] = self.LOOP_T[0];
    v.addEventListener('timeupdate', () => { if (v.currentTime >= s1 - 0.05) { try { v.currentTime = s0; } catch (e) {} } });
    try { v.currentTime = s0; const p = v.play && v.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
  }

function loopRangeFor(i) { return i < 6 ? self.LOOP_T[i] : self.LOOP_T[0]; }
function transRangeFor(i) { return self.TRANS_T[i]; }

function handle(y) {
    if (self.autoReturn) return;
    y = Math.max(0, Math.min(self.scrollEnd - 1, y));
    if (self.loopStart != null && y >= self.loopStart) { self.handleLoopback(y); return; }
    if (self.inLoop) { self.inLoop = false; self.exitLoopCleanup(); }
    const s = self.segAt(y);
    self.currentSection = s.i;
    self.inTrans = s.type === 'trans';
    if (!self._transPlaying && self.bandKey !== 'r' + s.i) {
      self.bandKey = 'r' + s.i;
      self.idleSection = null;
    }
    self.updateHero(y);
    self.updateHeaderVis(y);
    self.updateSection2(y);
    self.updateVentures(y);
    self.updateSection4(y);
    self.updateSection5(y);
    self.updateSection6(y);
    self.updateSection7(y);
    self.updateArrow();
  }

function buildTimeline() {
    if (!self.sec2) return;
    self.tlTrack = self.sec2.querySelector('[data-tl-track]');
    self.tlViewport = self.sec2.querySelector('[data-tl-viewport]');
    self.tlModal = self.root.querySelector('[data-tl-modal]');
    if (!self.tlTrack) return;

    let M = (_sec.timeline && _sec.timeline.length) ? _sec.timeline : [];
    self.tlData = M;

    const STEP = 202, PAD = 84, BY = 214;
    const n = M.length;
    const slots = n + 2;                  // one empty lead slot and one empty trailing slot so end items sit clear of both edges
    const trackW = PAD * 2 + (slots - 1) * STEP;
    self.tlTrack.style.width = trackW + 'px';
    const slotX = (s) => PAD + s * STEP;
    const xOf = (i) => slotX(i + 1);      // milestones start after the lead slot
    self.tlTrack.innerHTML = '';

    const base = document.createElement('div');
    base.style.cssText = 'position:absolute;left:0;right:0;top:' + BY + 'px;height:1px;background:linear-gradient(90deg,transparent,var(--line-strong,rgba(255,255,255,.16)) 3%,var(--line-strong,rgba(255,255,255,.16)) 97%,transparent)';
    self.tlTrack.appendChild(base);

    // ruler graduation + faint guide lines between every slot (lead and trailing slots stay bare: no tick, no label)
    for (let s = 0; s < slots - 1; s++) {
      const x0 = slotX(s);
      for (let k = 1; k <= 3; k++) {
        const sx = x0 + (STEP / 4) * k;
        const gt = document.createElement('div');
        gt.style.cssText = 'position:absolute;left:' + sx + 'px;top:' + BY + 'px;width:1px;height:' + (k === 2 ? 7 : 3) + 'px;transform:translateX(-50%);background:var(--line,rgba(255,255,255,.09))';
        self.tlTrack.appendChild(gt);
      }
      const guide = document.createElement('div');
      guide.style.cssText = 'position:absolute;left:' + (x0 + STEP / 2) + 'px;top:' + (BY - 118) + 'px;width:1px;height:118px;transform:translateX(-50%);background:linear-gradient(to bottom,transparent,rgba(255,255,255,.05) 70%,rgba(255,255,255,.07))';
      self.tlTrack.appendChild(guide);
    }

    // milestone markers
    self.tlItems = [];
    M.forEach((m, idx) => {
      const x = xOf(idx);
      const hit = document.createElement('div');
      hit.style.cssText = 'position:absolute;left:' + x + 'px;top:0;width:' + STEP + 'px;height:270px;transform:translateX(-50%);z-index:0;pointer-events:auto;cursor:pointer';
      self.tlTrack.appendChild(hit);
      const tick = document.createElement('div');
      tick.style.cssText = 'position:absolute;left:' + x + 'px;top:' + BY + 'px;width:1px;height:14px;transform:translateX(-50%);background:var(--tx-muted,#a1a1aa)';
      self.tlTrack.appendChild(tick);
      const lab = document.createElement('div');
      lab.textContent = m.y;
      lab.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY + 20) + 'px;transform:translateX(-50%);font-family:var(--font-mono,monospace);font-variant-numeric:tabular-nums;font-size:11px;letter-spacing:.06em;color:var(--tx-muted,#a1a1aa)';
      self.tlTrack.appendChild(lab);
      const thumb = document.createElement('div');
      thumb.setAttribute('data-tl-item', '');
      thumb.style.cssText = 'position:absolute;left:' + x + 'px;top:8px;width:128px;padding-bottom:14px;transform:translateX(-50%) translateY(' + (idx === 0 ? 0 : 10) + 'px);opacity:' + (idx === 0 ? 1 : 0) + ';cursor:pointer;transition:transform .42s cubic-bezier(.16,1,.3,1),opacity .42s cubic-bezier(.16,1,.3,1);z-index:2';
      thumb.innerHTML =
        '<div style="position:relative">' +
          '<div style="position:relative;margin-bottom:10px;border-radius:10px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 20px 46px rgba(6,6,8,.5)">' +
            '<img src="' + m.img + '" alt="" draggable="false" style="position:relative;top:-6px;width:100%;height:calc(100% + 6px);object-fit:cover;display:block;filter:grayscale(.45) contrast(1.04) brightness(.94);transition:filter .42s cubic-bezier(.16,1,.3,1)">' +
          '</div>' +
          '<button data-tl-plus aria-label="View detail" style="position:absolute;top:9px;right:9px;width:27px;height:27px;border-radius:999px;border:1px solid var(--line-strong,rgba(255,255,255,.14));background:rgba(11,11,12,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:var(--tx,#f4f4f5);font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .3s,transform .3s,border-color .3s">+</button>' +
        '</div>';
      self.tlTrack.appendChild(thumb);

      const dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY - 5) + 'px;width:11px;height:11px;border-radius:999px;transform:translateX(-50%);background:var(--bg,#0b0b0c);border:1px solid var(--line-strong,rgba(255,255,255,.14));transition:background .26s,border-color .26s,box-shadow .26s';
      self.tlTrack.appendChild(dot);

      const cap = document.createElement('div');
      cap.textContent = m.t;
      cap.style.cssText = 'position:absolute;left:' + x + 'px;top:' + (BY + 37) + 'px;width:150px;transform:translateX(-50%);text-align:center;font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--tx-faint,#6b6b73);transition:color .26s';
      self.tlTrack.appendChild(cap);

      const rec = { thumb, dot, cap, imgEl: thumb.querySelector('img'), plus: thumb.querySelector('[data-tl-plus]'), idx };
      self.tlItems.push(rec);

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
      const enter = () => self.setTlHover(idx), leave = () => self.setTlHover(null);
      // whole-column hit area drives the hover, so the reveal is easy to navigate
      hit.addEventListener('mouseenter', enter);
      hit.addEventListener('mouseleave', leave);
      hit.addEventListener('click', () => { if (!self.tlMoved) self.openTlModal(idx); });
      thumb.addEventListener('mouseenter', enter);
      thumb.addEventListener('mouseleave', leave);
      const open = (e) => { e.preventDefault(); e.stopPropagation(); if (!self.tlMoved) self.openTlModal(idx); };
      rec.plus.addEventListener('click', open);
      thumb.addEventListener('click', (e) => { if (!self.tlMoved) self.openTlModal(idx); });
    });

    // Sticky first item shows by default; hovering any item hides the first and reveals the hovered one.
    self.setTlHover = (h) => {
      self.tlItems.forEach(r => r.paint(h === r.idx ? 'hover' : (h === null && r.idx === 0 ? 'rest' : 'hidden')));
    };
    if (self.isMobile()) {
      // Mobile: always show center item active
      self._tlCenterIdx = 0;
      self.setTlHover(0);
    } else {
      self.setTlHover(null);
    }

    self.wireTimelineDrag(trackW, xOf(0), STEP);
    self.wireTimelineModal();
  }

function wireTimelineDrag(trackW, firstX, step) {
    const vp = self.tlViewport, track = self.tlTrack;
    if (!vp || !track) return;
    self.tlV = 0; self.tlMoved = false;
    const clamp = (v) => Math.max(Math.min(0, vp.clientWidth - trackW), Math.min(0, v));
    self.tlX = self.isMobile() ? clamp(vp.clientWidth / 2 - firstX) : 0;
    const apply = () => {
      track.style.transform = 'translateX(' + self.tlX + 'px)';
      if (self.isMobile() && self.tlItems && self.tlItems.length) self.highlightCenterTlItem();
    };
    apply();
    let dragging = false, sx = 0, startX = 0, lastX = 0, lastT = 0;
    const stopInertia = () => { if (self.tlIrf) { cancelAnimationFrame(self.tlIrf); self.tlIrf = null; } };
    const inertia = () => {
      self.tlX = clamp(self.tlX + self.tlV);
      self.tlV *= 0.93;
      apply();
      if (Math.abs(self.tlV) > 0.25 && self.tlX < 0 && self.tlX > vp.clientWidth - trackW) self.tlIrf = requestAnimationFrame(inertia);
      else { self.tlIrf = null; if (self.isMobile()) self.snapTlToCenter(firstX, step, trackW); }
    };
    vp.addEventListener('pointerdown', (e) => {
      dragging = true; self.tlMoved = false; stopInertia();
      sx = e.clientX; startX = self.tlX; lastX = e.clientX; lastT = performance.now(); self.tlV = 0;
      vp.style.cursor = 'grabbing';
    });
    self._tlMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 4) self.tlMoved = true;
      const now = performance.now(), dt = Math.max(8, now - lastT);
      self.tlV = (e.clientX - lastX) / dt * 16;
      lastX = e.clientX; lastT = now;
      self.tlX = clamp(startX + dx); apply();
    };
    self._tlUp = () => {
      if (!dragging) return;
      dragging = false; vp.style.cursor = 'grab';
      if (Math.abs(self.tlV) > 0.4) { stopInertia(); self.tlIrf = requestAnimationFrame(inertia); }
      else if (self.isMobile()) self.snapTlToCenter(firstX, step, trackW);
    };
    window.addEventListener('pointermove', self._tlMove, { passive: true });
    window.addEventListener('pointerup', self._tlUp, { passive: true });
    window.addEventListener('pointercancel', self._tlUp, { passive: true });
    vp.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); stopInertia(); self.tlX = clamp(self.tlX - e.deltaX); apply(); }
    }, { passive: false });
    self._tlReclamp = () => { self.tlX = clamp(self.tlX); apply(); };
    window.addEventListener('resize', self._tlReclamp, { passive: true });
  }

function snapTlToCenter(firstX, step, trackW) {
    if (!self.tlItems || !self.tlItems.length || !self.tlViewport || !self.tlTrack) return;
    const vp = self.tlViewport, track = self.tlTrack;
    const vpCenter = vp.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    self.tlItems.forEach(r => {
      const itemX = self.tlX + firstX + r.idx * step;
      const d = Math.abs(itemX - vpCenter);
      if (d < bestDist) { bestDist = d; best = r.idx; }
    });
    const clamp = (v) => Math.max(Math.min(0, vp.clientWidth - trackW), Math.min(0, v));
    self.tlX = clamp(vpCenter - (firstX + best * step));
    track.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
    track.style.transform = 'translateX(' + self.tlX + 'px)';
    self._tlCenterIdx = best;
    self.tlItems.forEach(r => r.paint(r.idx === best ? 'hover' : 'hidden'));
    clearTimeout(self._tlSnapT);
    self._tlSnapT = setTimeout(() => { track.style.transition = 'none'; }, 520);
  }

function highlightCenterTlItem() {
    if (!self.tlItems || !self.tlViewport) return;
    const vpCenter = self.tlViewport.clientWidth / 2;
    let best = -1, bestDist = Infinity;
    self.tlItems.forEach((r) => {
      const rect = r.thumb.getBoundingClientRect();
      const vpRect = self.tlViewport.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2 - vpRect.left;
      const dist = Math.abs(itemCenter - vpCenter);
      if (dist < bestDist) { bestDist = dist; best = r.idx; }
    });
    if (best !== self._tlCenterIdx) {
      self._tlCenterIdx = best;
      self.tlItems.forEach(r => r.paint(r.idx === best ? 'hover' : 'hidden'));
    }
  }

function wireTimelineModal() {
    const modal = self.tlModal;
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
    if (cta) cta.addEventListener('click', (e) => { e.preventDefault(); self.closeTlModal(); self.scrollToLastSection(1.4); });
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
      b.addEventListener('click', (e) => { e.stopPropagation(); self.tlNav(dir); });
      return b;
    };
    nav.appendChild(mkNav(-1, 'Previous milestone', '\u2190'));
    nav.appendChild(mkNav(1, 'Next milestone', '\u2192'));
    metaRow.appendChild(nav);
    self.tlNav = (dir) => {
      const len = self.tlData.length;
      self.tlCurrent = ((self.tlCurrent + dir) % len + len) % len;
      self.openTlModal(self.tlCurrent);
    };
    self._tlEsc = (e) => {
      if (e.key === 'Escape') self.closeTlModal();
      else if (e.key === 'ArrowRight') self.tlNav(1);
      else if (e.key === 'ArrowLeft') self.tlNav(-1);
    };
    self.openTlModal = (i) => {
      const m = self.tlData[i]; if (!m) return;
      self.tlCurrent = i;
      imgEl.src = m.img;
      ey.textContent = 'Milestone \u00b7 ' + m.y + '  \u00b7  ' + m.tag;
      title.textContent = m.t;
      body.textContent = m.d;
      idxEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(self.tlData.length).padStart(2, '0');
      tagEl.textContent = m.tag;
      if (cta) cta.style.display = i === self.tlData.length - 1 ? 'inline-flex' : 'none';
      modal.style.display = 'flex';
      requestAnimationFrame(() => { modal.style.opacity = '1'; if (card) card.style.transform = 'scale(1)'; });
      document.addEventListener('keydown', self._tlEsc);
    };
    self.closeTlModal = () => {
      if (modal.style.display === 'none') return;
      modal.style.opacity = '0'; if (card) card.style.transform = 'scale(.985)';
      document.removeEventListener('keydown', self._tlEsc);
      clearTimeout(self._tlCloseT);
      self._tlCloseT = setTimeout(() => { modal.style.display = 'none'; }, 320);
    };
    if (scrim) scrim.addEventListener('click', () => self.closeTlModal());
    if (closeBtn) {
      closeBtn.addEventListener('click', () => self.closeTlModal());
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--glow,#f6f5f2)'; closeBtn.style.color = 'var(--bg,#0b0b0c)'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'rgba(11,11,12,.55)'; closeBtn.style.color = 'var(--tx,#f4f4f5)'; });
    }
  }

function buildPlaybook() {
    const principleTopics = (_sec.playbook && _sec.playbook.principles) || [];
    const videoTopics = (_sec.playbook && _sec.playbook.reels) || [];
    for (let i = principleTopics.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = principleTopics[i]; principleTopics[i] = principleTopics[j]; principleTopics[j] = t; }
    const hiddenTopics = principleTopics.slice(0, 16);
    hiddenTopics.forEach(p => { p.open = false; p.img = videoTopics[Math.floor(Math.random() * videoTopics.length)].img; p.embed = null; });
    self.pbTopics = videoTopics.concat(hiddenTopics);
    self.pbs = [];
    for (let i = self.pbTopics.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = self.pbTopics[i]; self.pbTopics[i] = self.pbTopics[j]; self.pbTopics[j] = t; }
    if (self.sec4) self.pbs.push(self.makePlaybook(self.sec4, 3));
    self.pbMove = (e) => {
      const inst = self.activeInst; if (!inst || !inst.drag) return;
      if (self.isMobile()) {
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
    self.pbUp = () => { const inst = self.activeInst; if (inst) { inst.drag = false; inst.cluster.style.cursor = 'grab'; } self.activeInst = null; };
    window.addEventListener('pointermove', self.pbMove, { passive: true });
    window.addEventListener('pointerup', self.pbUp, { passive: true });
  }

function makePlaybook(sec, sectionIndex) {
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
    const N = self.pbTopics.length;
    inst.items = self.pbTopics.map((tp, i) => {
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
      span.addEventListener('pointerenter', () => { inst.hover = i; self.showPbHoverPreview(inst, tp); });
      span.addEventListener('pointerleave', () => { if (inst.hover === i) inst.hover = -1; self.hidePbHoverPreview(inst); });
      span.addEventListener('click', (e) => { e.stopPropagation(); if (!inst.moved) self.selectTopic(inst, i); });
      return { wrap, span, lock, base, phase: i * 0.5, open: tp.open };
    });
    self.layoutPb(inst);
    inst.cx = inst.tx; inst.cy = inst.ty;
    inst.cluster.addEventListener('pointerdown', (e) => {
      inst.drag = true; inst.moved = false; inst.rotTarget = null; inst.vel = 0;
      inst.lastA = Math.atan2(e.clientY - inst.cy, e.clientX - inst.cx);
      inst._lastX = e.clientX;
      inst.cluster.style.cursor = 'grabbing'; self.activeInst = inst;
    });
    inst.expand.addEventListener('click', () => self.setPbMode(inst, 'center'));
    inst.mediaPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const tp = inst.selected != null ? self.pbTopics[inst.selected] : null;
      if (!tp || !tp.open || !tp.embed) return;
      if (self.isMobile()) {
        self.openPbVideoFullscreen(tp.embed);
        return;
      }
      inst.mediaFrame.src = 'https://www.instagram.com/reel/' + tp.embed + '/embed';
      inst.mediaFrame.style.display = 'block';
      inst.mediaImg.style.display = 'none';
      inst.mediaPlay.style.display = 'none';
    });
    return inst;
  }

function showPbHoverPreview(inst, tp) {
    if (!inst.hoverPreview) return;
    if (tp.img) inst.hoverImg.src = tp.img; else inst.hoverImg.removeAttribute('src');
    inst.hoverImg.style.filter = tp.open ? 'none' : 'blur(9px) brightness(.7)';
    inst.hoverLock.style.display = tp.open ? 'none' : 'flex';
    inst.hoverPreview.style.opacity = '1';
    inst.hoverPreview.style.transform = 'translate(-50%,-50%) scale(1)';
  }

function hidePbHoverPreview(inst) {
    if (!inst.hoverPreview) return;
    inst.hoverPreview.style.opacity = '0';
    inst.hoverPreview.style.transform = 'translate(-50%,-50%) scale(.94)';
  }

function layoutPb(inst) {
    const W = window.innerWidth, H = window.innerHeight;
    const mob = self.isMobile();
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

function tickPlaybook(now) {
    if (!self.pbs) return;
    const t = now * 0.001;
    for (const inst of self.pbs) self.tickOne(inst, t);
  }

function tickOne(inst, t) {
    inst.cx += (inst.tx - inst.cx) * 0.12;
    inst.cy += (inst.ty - inst.cy) * 0.12;
    if (inst.rotTarget != null && !inst.drag) {
      let d = inst.rotTarget - inst.rot; inst.rot += d * 0.1;
      if (Math.abs(d) < 0.05) { inst.rot = inst.rotTarget; inst.rotTarget = null; }
    } else if (!inst.drag) {
      inst.rot += inst.vel; inst.vel *= 0.94; if (Math.abs(inst.vel) < 0.002) inst.vel = 0;
    }
    inst.group.style.transform = 'translate(' + inst.cx + 'px,' + inst.cy + 'px) rotate(' + inst.rot + 'deg)';
    for (let i = 0; i < inst.items.length; i++) {
      const it = inst.items[i];
      const abs = ((it.base + inst.rot) % 360 + 360) % 360;
      const left = abs > 90 && abs < 270;
      const breath = 8 + Math.sin(t * 0.9 + it.phase) * 4;
      const hov = inst.hover === i, sel = inst.selected === i;
      const sc = hov ? 1.28 : sel ? 1.18 : 1;
      if (left) { it.span.style.transformOrigin = '50% 50%'; it.span.style.transform = 'translateX(' + breath + 'px) rotate(180deg) scale(' + sc + ')'; }
      else { it.span.style.transformOrigin = '0 50%'; it.span.style.transform = 'translateX(' + breath + 'px) scale(' + sc + ')'; }
      let col;
      if (it.open) col = 'var(--glow,#f6f5f2)';
      else col = hov ? 'var(--glow,#f6f5f2)' : 'rgba(244,244,245,.34)';
      it.span.style.color = col;
      it.span.style.opacity = (it.open || hov || sel) ? '1' : '0.85';
      it.span.style.textShadow = (it.open && (hov || sel)) ? '0 0 18px rgba(255,255,255,.24)' : 'none';
      it.lock.style.opacity = (!it.open && hov) ? '1' : '0';
    }
    // In sticky (left) reading mode, the topic rotated to the center (pointing at the card)
    // auto-populates the right box, so rotating the wheel skims through playbook items.
    if (inst.mode === 'left' && inst.items.length) {
      // On mobile, active topic is at top (90°); on desktop, at right (0°)
      const activeAngle = self.isMobile() ? -90 : 0;
      let best = 0, bestD = 999;
      for (let i = 0; i < inst.items.length; i++) {
        const abs = (((inst.items[i].base + inst.rot) - activeAngle) % 360 + 360) % 360;
        const d = Math.min(abs, 360 - abs);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best !== inst.selected) { inst.selected = best; self.fillPbCard(inst, best); }
    }
  }

function fillPbCard(inst, i) {
    const tp = self.pbTopics[i];
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

function openPbVideoFullscreen(embedId) {
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

function selectTopic(inst, i) {
    const tp = self.pbTopics[i];
    inst.selected = i;
    // On mobile, pin to top center (90° offset); on desktop, pin to right (0°)
    const targetBase = self.isMobile() ? -inst.items[i].base - 90 : -inst.items[i].base;
    inst.rotTarget = self.nearestRot(inst, targetBase);
    self.setPbMode(inst, 'left');
    self.fillPbCard(inst, i);
    inst.card.style.opacity = '1';
    inst.card.style.transform = self.isMobile() ? 'translateX(0) translateY(0)' : 'translateY(-50%) translateX(0)';
    inst.card.style.pointerEvents = 'auto';
  }

function nearestRot(inst, target) {
    let r = target;
    while (r - inst.rot > 180) r -= 360;
    while (r - inst.rot < -180) r += 360;
    return r;
  }

function setPbMode(inst, m) {
    inst.mode = m;
    self.layoutPb(inst);
    const left = m === 'left';
    const mob = self.isMobile();
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

function updatePb(inst, y) {
    if (!inst || !self.segs) return;
    const seg = self.segs.find(s => s.type === 'rest' && s.i === inst.sectionIndex);
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
    if (o > 0.5 && !inst._entered) { inst._entered = true; self.animPbEnter(inst); }
    if (o < 0.05) inst._entered = false;
  }

function updateSection4(y) { if (self.pbs && self.pbs[0]) self.updatePb(self.pbs[0], y); }

function buildVentures() {
    if (!self.sec3) return;
    self.vSlides = Array.from(self.sec3.querySelectorAll('[data-vslide]'));
    self.vDots = Array.from(self.sec3.querySelectorAll('[data-vdot]'));
    self.vCur = self.sec3.querySelector('[data-vcur]');
    self.vN = self.vSlides.length;
    self.vIndex = 0;
    self.vSlides.forEach((sl, i) => sl.addEventListener('click', (e) => { if (e.target.closest('a')) return; }));
    self.vDots.forEach(d => {
      const idx = +d.getAttribute('data-i');
      const n = d.querySelector('[data-vdot-n]');
      d.addEventListener('click', () => self.setVenture(idx));
      d.addEventListener('mouseenter', () => { if (self.vIndex !== idx && n) { n.style.color = 'var(--tx,#f4f4f5)'; } });
      d.addEventListener('mouseleave', () => { if (self.vIndex !== idx && n) { n.style.color = 'var(--tx-faint,#6b6b73)'; } });
    });
    const prev = self.sec3.querySelector('[data-vprev]');
    const next = self.sec3.querySelector('[data-vnext]');
    if (prev) prev.addEventListener('click', () => self.setVenture((self.vIndex - 1 + self.vN) % self.vN));
    if (next) next.addEventListener('click', () => self.setVenture((self.vIndex + 1) % self.vN));
    if (self.isMobile()) {
      let vsx = null, vsy = null, vDir = null, vFired = false;
      self.sec3.addEventListener('touchstart', (e) => { vsx = e.touches[0].clientX; vsy = e.touches[0].clientY; vDir = null; vFired = false; }, { passive: true });
      self.sec3.addEventListener('touchmove', (e) => {
        if (vsx === null) return;
        const dx = e.touches[0].clientX - vsx, dy = e.touches[0].clientY - vsy;
        if (vDir === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) vDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (vDir === 'x') {
          e.stopPropagation();
          if (!vFired && Math.abs(dx) > 40) {
            vFired = true;
            if (dx < 0) self.setVenture((self.vIndex + 1) % self.vN); else self.setVenture((self.vIndex - 1 + self.vN) % self.vN);
          }
        }
      }, { passive: true });
      self.sec3.addEventListener('touchend', () => { vsx = null; }, { passive: true });
    }
    self.setVenture(0);
  }

function setVenture(i) {
    if (!self.vSlides) return;
    self.vIndex = i;
    self.vSlides.forEach((sl, k) => {
      const on = k === i;
      sl.style.opacity = on ? '1' : '0';
      sl.style.pointerEvents = on ? 'auto' : 'none';
      sl.style.zIndex = on ? '2' : '1';
      const inner = sl.querySelector('[data-vinner]');
      if (inner) { inner.style.opacity = on ? '1' : '0'; inner.style.transform = on ? 'translateX(0)' : 'translateX(36px)'; }
      const lk = sl.querySelector('a'); if (lk) lk.style.pointerEvents = on ? 'auto' : 'none';
      sl.querySelectorAll('image-slot').forEach(s => { s.style.pointerEvents = on ? 'auto' : 'none'; });
    });
    const mob = self.isMobile();
    self.vDots.forEach((d, k) => {
      const on = k === i;
      if (mob) { d.style.display = on ? 'flex' : 'none'; }
      const n = d.querySelector('[data-vdot-n]'), l = d.querySelector('[data-vdot-l]');
      if (n) { n.style.color = on ? 'var(--glow,#f6f5f2)' : 'var(--tx-faint,#6b6b73)'; n.style.transition = 'color 260ms,font-size 300ms cubic-bezier(.16,1,.3,1)'; n.style.fontSize = on ? '15px' : '11px'; }
      if (l) { l.style.width = on ? '46px' : '20px'; l.style.background = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))'; }
    });
    if (self.vCur) self.vCur.textContent = String(i + 1).padStart(2, '0');
  }

function updateVentures(y) {
    if (!self.sec3 || !self.segs) return;
    const seg = self.segs.find(s => s.type === 'rest' && s.i === 2);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    self.sec3.style.opacity = o.toFixed(3); self.sec3.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    self.sec3.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    self.sec3.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }

function buildPods() {
    if (!self.sec5) return;
    self.podData = (_sec.podcasts && _sec.podcasts.length) ? _sec.podcasts : [];
    self.pods = Array.from(self.sec5.querySelectorAll('[data-pod-card]')).map(el => ({ el }));
    self.podN = self.pods.length;
    self.podP = 0; self.podTarget = 0; self.podCenter = -1;
    self.podSpeed = 1; self.podSpeedMult = { 1: 1, 2: 2, 3: 3.4 };
    self.podTitle = self.sec5.querySelector('[data-pod-title]');
    self.podSrc = self.sec5.querySelector('[data-pod-src]');
    self.podDesc = self.sec5.querySelector('[data-pod-desc]');
    self.podProg = self.sec5.querySelector('[data-pod-prog]');
    self.podSpeedBtn = self.sec5.querySelector('[data-pod-speed]');
    self.podLightbox = self.sec5.querySelector('[data-pod-lightbox]');
    self.podFrame = self.sec5.querySelector('[data-pod-frame]');
    self.podPoster = self.sec5.querySelector('[data-pod-poster]');
    self.sec5.querySelector('[data-pod-lightbox-play]').addEventListener('click', () => self.playPod());
    self.pods.forEach((p, i) => p.el.addEventListener('click', () => {
      if (self.podMoved) return;
      if (i === self.podCenter) { self.openPod(); return; }
      self.podInertia = false; self.podTarget = self.nearestPodTarget(i);
    }));
    const ring = self.sec5.querySelector('[data-pod-ring]');
    ring.style.cursor = 'grab';
    ring.addEventListener('pointerdown', (e) => { self.podDrag = true; self.podMoved = false; self.podInertia = false; self.podVel = 0; self.podDragX = e.clientX; self.podDragStart = self.podP; ring.style.cursor = 'grabbing'; });
    self.podMove = (e) => { if (!self.podDrag) return; const dx = e.clientX - self.podDragX; if (Math.abs(dx) > 4) self.podMoved = true; const spacing = Math.min(window.innerWidth * 0.14, 190); const prev = self.podP; self.podP = self.podDragStart - (dx / spacing) * self.podSpeedMult[self.podSpeed]; self.podVel = self.podP - prev; self.podTarget = self.podP; };
    self.podUp = () => { if (!self.podDrag) return; self.podDrag = false; ring.style.cursor = 'grab'; const v = Math.max(-0.6, Math.min(0.6, self.podVel)); if (Math.abs(v) > 0.01) { self.podInertia = true; self.podInertiaV = v; } else { self.podTarget = Math.round(self.podP); } };
    window.addEventListener('pointermove', self.podMove, { passive: true });
    window.addEventListener('pointerup', self.podUp, { passive: true });
    self.sec5.querySelector('[data-pod-prev]').addEventListener('click', () => { self.podInertia = false; self.podTarget = Math.round(self.podTarget) - 1; });
    self.sec5.querySelector('[data-pod-next]').addEventListener('click', () => { self.podInertia = false; self.podTarget = Math.round(self.podTarget) + 1; });
    self.sec5.querySelector('[data-pod-play]').addEventListener('click', () => self.openPod());
    self.sec5.querySelector('[data-pod-close]').addEventListener('click', () => self.closePod());
    self.podLightbox.addEventListener('click', (e) => { if (e.target === self.podLightbox) self.closePod(); });
    self.podSpeedBtn.addEventListener('click', () => {
      self.podSpeed = self.podSpeed >= 3 ? 1 : self.podSpeed + 1;
      self.podSpeedBtn.textContent = self.podSpeed + 'x';
    });
    const track = self.sec5.querySelector('[data-pod-track]');
    track.addEventListener('click', (e) => { const r = track.getBoundingClientRect(); const f = (e.clientX - r.left) / r.width; self.podInertia = false; self.podTarget = Math.round(f * self.podN); });
    self.positionPods();
  }

function nearestPodTarget(i) {
    let t = i; const n = self.podN;
    while (t - self.podP > n / 2) t -= n;
    while (t - self.podP < -n / 2) t += n;
    return t;
  }

function tickPods() {
    if (!self.pods) return;
    if (self.podDrag) { self.positionPods(); return; }
    if (self.podInertia) {
      self.podP += self.podInertiaV;
      self.podInertiaV *= 0.92;
      if (Math.abs(self.podInertiaV) < 0.004) { self.podInertia = false; self.podTarget = Math.round(self.podP); }
    } else {
      self.podP += (self.podTarget - self.podP) * 0.12;
    }
    self.positionPods();
  }

function positionPods() {
    const n = self.podN;
    const mob = self.isMobile();
    const maxVis = mob ? 2.8 : 3.4;
    for (let i = 0; i < n; i++) {
      let a = i - self.podP;
      a = ((a % n) + n) % n; if (a > n / 2) a -= n;
      const el = self.pods[i].el;
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
    const ci = ((Math.round(self.podP) % n) + n) % n;
    if (ci !== self.podCenter) {
      if (self.podCenter >= 0 && self.pods[self.podCenter]) self.pods[self.podCenter].el.style.borderColor = 'rgba(255,255,255,.08)';
      self.podCenter = ci;
      if (self.pods[ci]) self.pods[ci].el.style.borderColor = 'rgba(212,175,55,.45)';
      self.updatePodInfo(ci);
    }
    if (self.podProg) self.podProg.style.width = ((((self.podP % n) + n) % n) / n * 100).toFixed(2) + '%';
  }

function updatePodInfo(i) {
    const d = self.podData[i]; if (!d) return;
    if (self.podTitle) self.podTitle.textContent = d.t;
    if (self.podSrc) self.podSrc.textContent = d.src;
    if (self.podDesc) self.podDesc.textContent = d.d;
  }

function openPod() {
    const d = self.podData[self.podCenter]; if (!d || !self.podFrame) return;
    if (self.podPoster) { if (d.img) self.podPoster.src = d.img; else self.podPoster.removeAttribute('src'); self.podPoster.style.display = 'block'; }
    const playBtn = self.sec5.querySelector('[data-pod-lightbox-play]');
    if (playBtn) playBtn.style.display = 'flex';
    self.podFrame.removeAttribute('src');
    self.podFrame.style.display = 'none';
    self.podLightbox.style.display = 'flex';
  }
function playPod() {
    const d = self.podData[self.podCenter]; if (!d || !self.podFrame) return;
    self.podFrame.src = 'https://www.youtube.com/embed/' + d.yt + '?autoplay=1&rel=0';
    self.podFrame.style.display = 'block';
    if (self.podPoster) self.podPoster.style.display = 'none';
    const playBtn = self.sec5.querySelector('[data-pod-lightbox-play]');
    if (playBtn) playBtn.style.display = 'none';
  }
function closePod() {
    if (self.podFrame) { self.podFrame.removeAttribute('src'); self.podFrame.style.display = 'none'; }
    if (self.podLightbox) self.podLightbox.style.display = 'none';
  }

function updateSection5(y) {
    if (!self.sec5 || !self.segs) return;
    const seg = self.segs.find(s => s.type === 'rest' && s.i === 4);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    self.sec5.style.opacity = o.toFixed(3); self.sec5.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    self.sec5.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    self.podVisible = o > 0.05;
    self.sec5.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    self.sec5.style.zIndex = o > 0.5 ? '4' : '3';
    if (o > 0.5 && !self._sec5Entered) { self._sec5Entered = true; self.animPodEnter(); }
    if (o < 0.05) self._sec5Entered = false;
  }

function buildTestis() {
    if (!self.sec6) return;
    self.testiStats = (_sec.receipts_stats && Object.keys(_sec.receipts_stats).length) ? _sec.receipts_stats : {};
    self.testiCols = Array.from(self.sec6.querySelectorAll('[data-testi-col]')).map(el => ({
      el, track: el.querySelector('[data-testi-track]'), side: el.getAttribute('data-side'),
      pos: 0, half: 0, hover: false, drag: false, lastY: 0, vel: 0
    }));
    self.testiCols.forEach(c => {
      c.half = c.track.scrollHeight / 2;
      c.pos = c.side === 'right' ? c.half * 0.5 : 0;
      c.el.addEventListener('mouseenter', () => c.hover = true);
      c.el.addEventListener('mouseleave', () => c.hover = false);
      c.el.addEventListener('pointerdown', (e) => { c.drag = true; self.testiDrag = true; c.lastY = e.clientY; c.lastX = e.clientX; c.el.style.cursor = 'grabbing'; });
      window.addEventListener('pointermove', (e) => { if (!c.drag) return; const mob = self.isMobile(); const delta = mob ? (e.clientX - c.lastX) : (e.clientY - c.lastY); c.lastY = e.clientY; c.lastX = e.clientX; const dir = c.side === 'left' ? -1 : 1; const mult = mob ? 2.5 : 1; c.pos += dir * delta * mult; c.vel = dir * delta * mult; });
      window.addEventListener('pointerup', () => { if (c.drag) { c.drag = false; self.testiDrag = false; c.el.style.cursor = 'grab'; } });
    });
    // Mobile: merge both columns into one rightward marquee + prevent section-jump on horizontal swipe
    if (self.isMobile()) {
      let tsx = null, tsy = null, tDir = null;
      self.sec6.addEventListener('touchstart', (e) => { tsx = e.touches[0].clientX; tsy = e.touches[0].clientY; tDir = null; }, { passive: true });
      self.sec6.addEventListener('touchmove', (e) => {
        if (tsx === null) return;
        const dx = e.touches[0].clientX - tsx, dy = e.touches[0].clientY - tsy;
        if (tDir === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) tDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (tDir === 'x') e.stopPropagation();
      }, { passive: true });
      self.sec6.addEventListener('touchend', () => { tsx = null; }, { passive: true });
    }
    if (self.isMobile() && self.testiCols.length === 2) {
      const left = self.testiCols.find(c => c.side === 'left');
      const right = self.testiCols.find(c => c.side === 'right');
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
        self.testiCols = [left];
      }
    }
    // 3D tilt on cards
    self.sec6.querySelectorAll('[data-testi-card]').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        if (self.testiDrag) return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateY(' + (px * 18) + 'deg) rotateX(' + (-py * 18) + 'deg) translateZ(12px)';
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; card.style.boxShadow = ''; });
    });
    // platform toggle
    self.testiPlat = null;
    self.testiPlatBtns = Array.from(self.sec6.querySelectorAll('[data-testi-plat]'));
    self.testiPlatBtns.forEach(b => b.addEventListener('click', () => self.setTestiPlat(b.getAttribute('data-p'))));
    self.testiStatEls = Array.from(self.sec6.querySelectorAll('[data-testi-stats] > div'));
    // lightbox
    self.testiLb = self.sec6.querySelector('[data-testi-lightbox]');
    self.testiFrame = self.sec6.querySelector('[data-testi-frame]');
    self.sec6.querySelectorAll('[data-testi-play]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); self.openTesti(b.getAttribute('data-yt')); }));
    self.sec6.querySelector('[data-testi-close]').addEventListener('click', () => self.closeTesti());
    self.testiLb.addEventListener('click', (e) => { if (e.target === self.testiLb) self.closeTesti(); });
    self.onResize2 = () => { self.testiCols.forEach(c => c.half = self.isMobile() ? c.track.scrollWidth / 2 : c.track.scrollHeight / 2); };
    window.addEventListener('resize', self.onResize2, { passive: true });
  }

function setTestiPlat(p) {
    self.testiPlat = (self.testiPlat === p) ? null : p;
    self.testiPlatBtns.forEach(b => {
      const on = b.getAttribute('data-p') === self.testiPlat;
      b.style.color = on ? 'var(--ink-900,#030405)' : 'var(--tx-faint,#6b6b73)';
      b.style.background = on ? 'var(--glow,#f6f5f2)' : 'rgba(3,4,5,.4)';
      b.style.borderColor = on ? 'var(--glow,#f6f5f2)' : 'var(--line-strong,rgba(255,255,255,.14))';
    });
    self.sec6.querySelectorAll('[data-testi-card]').forEach(c => {
      const match = !self.testiPlat || c.getAttribute('data-plat') === self.testiPlat;
      c.style.opacity = match ? '1' : '.14';
    });
    const st = self.testiStats[self.testiPlat || 'all'];
    self.testiStatEls.forEach((el, i) => {
      const n = el.querySelector('[data-stat-n]'), l = el.querySelector('[data-stat-l]');
      if (st[i]) { n.textContent = st[i][0]; l.textContent = st[i][1]; }
    });
  }

function tickTestis() {
    if (!self.testiCols) return;
    const mob = self.isMobile();
    const base = self.testiVisible ? 0.35 : 0;
    const vDamp = mob ? 0.96 : 0.9;
    self.testiCols.forEach(c => {
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

function wireSocialPopup() {
    const btn = self.root.querySelector('[data-social-toggle]');
    const pop = self.root.querySelector('[data-social-popup]');
    if (!btn || !pop) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      pop.style.display = pop.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', (e) => {
      if (pop.style.display === 'flex' && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) pop.style.display = 'none';
    });
  }

function openTesti(yt) {
    if (!self.testiFrame) return;
    self.testiFrame.src = 'https://www.youtube.com/embed/' + yt + '?autoplay=1&rel=0';
    self.testiLb.style.display = 'flex';
  }
function closeTesti() { if (self.testiFrame) self.testiFrame.src = ''; if (self.testiLb) self.testiLb.style.display = 'none'; }

  // --- Section entrance animations ---

function animSec2Enter() {
    if (!self.tlViewport) return;
    const track = self.tlTrack;
    if (!track) return;
    track.style.transition = 'none';
    track.style.transform = 'translateX(120px)';
    track.style.opacity = '0';
    requestAnimationFrame(() => {
      track.style.transition = 'transform 1.8s cubic-bezier(.16,1,.3,1), opacity 1.4s cubic-bezier(.16,1,.3,1)';
      track.style.transform = 'translateX(0)';
      track.style.opacity = '1';
    });
  }

function animPbEnter(inst) {
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

function animPodEnter() {
    if (!self.pods || !self.pods.length) return;
    const saved = self.podP;
    self.podP = saved + 3;
    self.podTarget = saved;
    self.positionPods();
  }

function animTestiEnter() {
    if (!self.testiCols) return;
    self.testiCols.forEach((c, i) => {
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

function updateSection6(y) {
    if (!self.sec6 || !self.segs) return;
    // Testimonials always shown
    const seg = self.segs.find(s => s.type === 'rest' && s.i === 5);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    self.sec6.style.opacity = o.toFixed(3); self.sec6.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    self.sec6.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    self.testiVisible = o > 0.05;
    self.sec6.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    if (o > 0.5 && !self._sec6Entered) { self._sec6Entered = true; self.animTestiEnter(); }
    if (o < 0.05) self._sec6Entered = false;
  }

function buildChat() {
    if (!self.sec7) return;
    self.chatInput = self.sec7.querySelector('[data-chat-input]');
    self.chatType = 'General query';
    self.chatStep = 0; self.chatAnswers = {};
    self.chatQ = [
      "Enter your name",
      "Enter your email address",
      "What would you like to say?"
    ];
    self.sec7.querySelector('[data-chat-send]').addEventListener('click', () => self.chatSend());
    self.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); self.chatSend(); } });
    const clear = self.sec7.querySelector('[data-chat-clear]');
    self.chatInput.addEventListener('input', () => { clear.style.display = self.chatInput.value ? 'flex' : 'none'; });
    clear.addEventListener('click', () => { self.chatInput.value = ''; clear.style.display = 'none'; self.chatInput.focus(); });
    const typeBtn = self.sec7.querySelector('[data-chat-type]');
    const menu = self.sec7.querySelector('[data-chat-typemenu]');
    typeBtn.addEventListener('click', (e) => { e.stopPropagation(); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });
    self.sec7.querySelectorAll('[data-chat-typeopt]').forEach(o => {
      o.addEventListener('mouseenter', () => { o.style.background = 'rgba(255,255,255,.08)'; o.style.color = 'var(--glow,#f6f5f2)'; });
      o.addEventListener('mouseleave', () => { o.style.background = 'none'; o.style.color = 'var(--tx-muted,#a1a1aa)'; });
      o.addEventListener('click', () => { self.chatType = o.getAttribute('data-t'); self.sec7.querySelector('[data-chat-typelabel]').textContent = self.chatType; menu.style.display = 'none'; });
    });
    document.addEventListener('click', () => { menu.style.display = 'none'; });
    const plus = self.sec7.querySelector('[data-chat-plus]');
    const file = self.sec7.querySelector('[data-chat-file]');
    const attach = self.sec7.querySelector('[data-chat-attach]');
    self.chatPlus = plus;
    self.chatPlusMode = 'attach';
    plus.addEventListener('click', () => { if (self.chatPlusMode === 'refresh') self.chatRestart(); else file.click(); });
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
        self.chatAttachment = null;
        return;
      }
      attach.style.color = '';
      const reader = new FileReader();
      reader.onload = () => {
        self.chatAttachment = { name: f.name, type: f.type, size: f.size, dataUrl: reader.result };
        attach.style.display = 'flex';
        attach.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M21.44 11.05 12 20.5a5 5 0 0 1-7-7l8.5-8.5a3 3 0 0 1 4 4l-8.5 8.5a1 1 0 0 1-1.5-1.5L15 9"></path></svg> Attached: ' + f.name;
      };
      reader.readAsDataURL(f);
    });
    self.chatLogEl = self.sec7.querySelector('[data-chat-history]');
    self.chatLog = [];
    self.chatLogEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-chat-restart-yes]')) self.chatRestart();
    });
    self.chatBuilt = true;
    self.chatAsk(self.chatQ[0]);
  }

function pushChat(role, text, prompt) {
    self.chatLog.push({ role, text, prompt: !!prompt });
    self.renderChatLog();
  }

function renderChatLog() {
    if (!self.chatLogEl) return;
    const has = self.chatLog.length > 0;
    self.chatLogEl.style.display = has ? 'flex' : 'none';
    self.chatLogEl.innerHTML = self.chatLog.map((m) => {
      const isUser = m.role === 'user';
      return '<div style="align-self:' + (isUser ? 'flex-end' : 'flex-start') + ';max-width:82%;padding:9px 14px;border-radius:14px;font-family:var(--font-body,sans-serif);font-size:13px;line-height:1.45;color:' + (isUser ? 'var(--ink-900,#030405)' : 'var(--tx,#f4f4f5)') + ';background:' + (isUser ? 'linear-gradient(150deg,var(--glow,#f6f5f2),var(--tx-faint,#6b6b73))' : 'rgba(255,255,255,.07)') + '">' + m.text + '</div>';
    }).join('');
    self.chatLogEl.scrollTop = self.chatLogEl.scrollHeight;
  }

function setChatPlusMode(mode) {
    self.chatPlusMode = mode;
    if (!self.chatPlus) return;
    self.chatPlus.innerHTML = mode === 'refresh'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow,#f6f5f2)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 4v5h-5"></path></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--glow,#f6f5f2)" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>';
    self.chatPlus.setAttribute('aria-label', mode === 'refresh' ? 'Start new response' : 'Attach media');
  }

function chatRestart() {
    self.chatLog = [];
    self.chatStep = 0; self.chatAnswers = {};
    self.chatDone = false;
    self.chatAttachment = null;
    self.setChatPlusMode('attach');
    self.chatInput.disabled = false;
    self.chatInput.value = '';
    const attach = self.sec7.querySelector('[data-chat-attach]');
    if (attach) { attach.style.display = 'none'; attach.style.color = ''; }
    self.renderChatLog();
    self.chatAsk(self.chatQ[0]);
  }

function chatAsk(text) {
    if (self.chatTyper) clearInterval(self.chatTyper);
    const el = self.chatInput; let i = 0; const full = text;
    self.chatTyper = setInterval(() => {
      el.setAttribute('placeholder', full.slice(0, i) + (i < full.length ? '\u2588' : ''));
      i++;
      if (i > full.length) { clearInterval(self.chatTyper); el.setAttribute('placeholder', full); }
    }, 26);
  }

function chatSend() {
    if (!self.chatBuilt || self.chatStep > 2) return;
    const v = (self.chatInput.value || '').trim();
    if (!v) return;
    if (self.chatStep === 1 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { self.chatAsk("That email looks off. Mind trying again?"); return; }
    const askedText = self.chatInput.getAttribute('placeholder') || self.chatQ[self.chatStep] || '';
    self.pushChat('assistant', askedText);
    self.pushChat('user', v);
    if (self.chatStep === 0) self.chatAnswers.name = v;
    else if (self.chatStep === 1) self.chatAnswers.email = v;
    else self.chatAnswers.message = v;
    self.chatInput.value = '';
    self.sec7.querySelector('[data-chat-clear]').style.display = 'none';
    self.chatStep++;
    if (self.chatStep === 1) {
      self.chatAsk(self.chatQ[1]);
    } else if (self.chatStep === 2) {
      self.chatAsk(self.step3Q());
    } else {
      const nm = self.chatAnswers.name || 'there';
      const em = self.chatAnswers.email || 'your email';
      const done = "Thanks, " + nm + ". Your " + self.chatType.toLowerCase() + " has been sent. We'll reply to " + em + " shortly.";
      self.chatAsk('');
      self.chatInput.disabled = true;
      self.pushChat('assistant', done);
      self.chatDone = true;
      self.setChatPlusMode('refresh');
      self.saveSubmission();
    }
  }

function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

function saveSubmission() {
    // Keeps a local CSV backup in this browser's localStorage, and also posts the
    // submission to submit.php which stores it in the Hostinger MySQL database
    // (attachments land in uploads/submissions/, only the path is stored in the DB).
    const now = new Date();
    const attPath = self.chatAttachment ? assetImg('form-uploads/') + self.chatAttachment.name : '';
    const row = [
      now.toISOString().slice(0, 10),
      now.toTimeString().slice(0, 8),
      self.chatType,
      self.chatAnswers.name || '',
      self.chatAnswers.email || '',
      self.chatAnswers.message || '',
      attPath
    ].map((v) => self.csvCell(v)).join(',');
    const header = 'date,time,type,name,email,message,attachment';
    let csv = localStorage.getItem('form.csv');
    if (!csv) csv = header + '\n';
    csv += row + '\n';
    try { localStorage.setItem('form.csv', csv); } catch (e) {}
    self.postSubmission();
  }

function postSubmission() {
    try {
      const fd = new FormData();
      fd.append('type', self.chatType || '');
      fd.append('name', self.chatAnswers.name || '');
      fd.append('email', self.chatAnswers.email || '');
      fd.append('message', self.chatAnswers.message || '');
      const att = self.chatAttachment;
      fd.append('action', 'sh_contact');
      fd.append('nonce', (window.shTheme && window.shTheme.nonce) || '');
      var ajaxUrl = (window.shTheme && window.shTheme.ajaxUrl) || 'submit.php';
      const send = () => fetch(ajaxUrl, { method: 'POST', body: fd }).catch(() => {});
      if (att && att.dataUrl) {
        fetch(att.dataUrl).then((r) => r.blob()).then((blob) => {
          fd.append('attachment', blob, att.name || 'attachment');
          send();
        }).catch(send);
      } else {
        send();
      }
    } catch (e) {}
  }

function step3Q() {
    const m = { 'Business inquiry': 'Describe your business inquiry', 'Review': 'Share your review or experience', 'General query': 'What would you like to ask?', 'Work with me': 'Tell us about the project or role' };
    return m[self.chatType] || 'What would you like to say?';
  }

function updateSection7(y) {
    if (!self.sec7 || !self.segs) return;
    const seg = self.segs.find(s => s.type === 'rest' && s.i === 6);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = 1;
    self.sec7.style.opacity = o.toFixed(3); self.sec7.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    self.sec7.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    self.sec7.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
  }

function updateSection2(y) {
    if (!self.sec2) return;
    const seg = self.segs.find(s => s.type === 'rest' && s.i === 1);
    if (!seg) return;
    const s0 = seg.start, s1 = seg.start + seg.h, fz = seg.h * 0.7;
    let o;
    if (y >= s0 && y <= s1) o = 1;
    else if (y < s0) o = Math.max(0, 1 - (s0 - y) / fz);
    else o = Math.max(0, 1 - (y - s1) / fz);
    self.sec2.style.opacity = o.toFixed(3); self.sec2.style.visibility = o > 0.02 ? 'visible' : 'hidden';
    self.sec2.style.transform = 'translateY(' + ((1 - o) * 16) + 'px)';
    if (o > 0.5 && !self._sec2Entered) { self._sec2Entered = true; self.animSec2Enter(); }
    if (o < 0.05) { self._sec2Entered = false; if (self.closeTlModal) self.closeTlModal(); }
  }

function updateHeaderVis(y) {
    if (!self.header) return;
    const dy = y - (self.lastHY == null ? y : self.lastHY);
    if (y < 24) self.showHeader(true);
    else if (dy > 5) self.showHeader(false);
    else if (dy < -5) self.showHeader(true);
    self.lastHY = y;
  }

function showHeader(v) {
    if (v === self.headerVis) return;
    self.headerVis = v;
    self.header.style.transform = v ? 'translateY(0)' : 'translateY(-160%)';
    self.header.style.opacity = v ? '1' : '0';
    self.header.style.pointerEvents = v ? 'auto' : 'none';
  }

function componentDidUpdate() {
    self.applyHeroFont(); self.applyCursorPref();
    const q = self.urlProp('quality') || self.props.videoQuality || '720p';
    if (q !== self.quality) { localStorage.setItem('sh_vq', q); self.applyQuality(q, false); }
  }

function applyHeroFont() {
    if (!self.heroH1) return;
    const map = {
      'Cabinet Grotesk (wide)': { f: "var(--font-grotesk,sans-serif)", w: 500, ls: '-.02em', tt: 'uppercase' },
      'Space Grotesk': { f: "'Space Grotesk',sans-serif", w: 500, ls: '-.02em', tt: 'uppercase' },
      'General Sans': { f: "var(--font-body,sans-serif)", w: 600, ls: '-.01em', tt: 'uppercase' },
      'Anton (heavy)': { f: "'Anton',sans-serif", w: 400, ls: '.01em', tt: 'uppercase' }
    };
    const c = map[self.props.heroFont] || map['Cabinet Grotesk (wide)'];
    self.heroH1.style.fontFamily = c.f;
    self.heroH1.style.fontWeight = c.w;
    self.heroH1.style.letterSpacing = c.ls;
    self.heroH1.style.textTransform = c.tt;
  }

function applyQuality(q, isInit) {
    self.quality = q;
    const src = self.qualitySrc[q] || self.qualitySrc['720p'];
    // Gate/preloader videos only ever autoplay forward or reset to 0 — normal progressive
    // streaming is fine for them.
    [self.gateVideo, self.preVid].forEach((v) => {
      if (!v) return;
      const s = v.querySelector('source');
      if (s && s.getAttribute('src') !== src) { s.setAttribute('src', src); if (!isInit) v.load(); }
    });
    self.loadStageVideo(src, isInit);
  }

  // The scroll-scrubber seeks to arbitrary points across the whole timeline, which needs
  // the full file's `seekable` range available immediately — progressive network buffering
  // only exposes a small window near the current playhead, so far seeks silently clamp back
  // near 0 until enough of the file has streamed in. Fetching the (small, <15MB) file as a
  // Blob and pointing the video at an object URL makes it fully local and instantly seekable.
function loadStageVideo(src, isInit) {
    if (!self.stageVideo) return;
    if (!self._blobCache) self._blobCache = {};
    const apply = (blobUrl) => {
      if (self.stageVideo.src === blobUrl) return;
      const t = self.stageVideo.currentTime || 0;
      self.stageVideo.src = blobUrl;
      self.stageVideo.load();
      if (!isInit) {
        const restore = () => { try { self.stageVideo.currentTime = t; } catch (e) {} self.stageVideo.removeEventListener('loadedmetadata', restore); };
        self.stageVideo.addEventListener('loadedmetadata', restore);
      }
    };
    if (self._blobCache[src]) { apply(self._blobCache[src]); return; }
    fetch(src).then(r => r.blob()).then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      self._blobCache[src] = blobUrl;
      apply(blobUrl);
    }).catch(() => {
      // fallback if fetch/blob fails (e.g. CORS): fall back to direct streaming src.
      const s = self.stageVideo.querySelector('source');
      if (s) s.setAttribute('src', src);
      self.stageVideo.src = src;
      self.stageVideo.load();
    });
  }

function setQuality(q) {
    if (q === self.quality) return;
    localStorage.setItem('sh_vq', q);
    self.applyQuality(q, false);
  }

function buildCollage() {
    if (!self.collageEl) return;
    if ((self.props.heroCollage ?? true) === false) { self.collageEl.style.display = 'none'; return; }
    var collageUrls = _sec.collage || [];
    if (!collageUrls.length) return;
    var imgs = collageUrls;
    const rnd = (a, b) => a + Math.random() * (b - a);
    self.collageEl.innerHTML = '';
    self.tiles = [];
    self.colEls = [];
    // Dense vertical marquee: many small tiles stacked in columns, each column drifting
    // slowly upward. Each column's tile set is duplicated so the -50% loop is seamless.
    const mob = self.isMobile();
    const cols = mob ? 6 : 12, perCol = mob ? 6 : 11, colW = 100 / cols;
    const bag = [];
    while (bag.length < cols * perCol) { const s = imgs.map((_, i) => i).sort(() => Math.random() - 0.5); bag.push(...s); }
    for (let c = 0; c < cols; c++) {
      const col = document.createElement('div');
      col.style.cssText = 'position:absolute;top:0;left:' + (c * colW).toFixed(3) + '%;width:' + colW.toFixed(3) + '%;height:100%;overflow:visible';
      const gap = rnd(9, 20);
      const dur = rnd(46, 78);                 // slow upward pace
      const track = document.createElement('div');
      track.style.cssText = 'position:absolute;left:0;top:0;width:100%;display:flex;flex-direction:column;gap:' + gap.toFixed(0) + 'px;will-change:transform;animation:vault-cmarquee ' + dur.toFixed(1) + 's linear infinite;animation-delay:' + (-rnd(0, dur)).toFixed(1) + 's';
      const set = [];
      for (let j = 0; j < perCol; j++) set.push({ src: imgs[bag[c * perCol + j] % imgs.length], wpc: rnd(60, 100), ar: rnd(0.74, 0.98), off: rnd(0, 1), op: mob ? rnd(.55, .85) : rnd(.4, .72) });
      const colFrac = (c + 0.5) / cols;
      [...set, ...set].forEach((d) => {
        const wrap = document.createElement('div');
        wrap.setAttribute('data-ctile', '');
        wrap.style.cssText = 'width:100%;display:flex;justify-content:' + (d.off < .5 ? 'flex-start' : 'flex-end') + ';will-change:transform';
        const img = document.createElement('img');
        img.src = d.src;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.draggable = false;
        img.style.cssText = 'width:' + d.wpc.toFixed(0) + '%;aspect-ratio:' + d.ar.toFixed(2) + ';object-fit:cover;border-radius:5px;display:block;opacity:' + d.op.toFixed(2) + ';will-change:transform,filter;transform:translate(0,0) scale(1);filter:grayscale(1) contrast(1.06) brightness(.82)';
        wrap.appendChild(img);
        track.appendChild(wrap);
        self.tiles.push({ wrap, img, g: 0, mx: 0, my: 0, colFrac });
      });
      col.appendChild(track);
      self.collageEl.appendChild(col);
      self.colEls.push(col);
    }
    self.onCollageMove = (e) => { self.mouse.x = e.clientX; self.mouse.y = e.clientY; self.mouse.on = true; };
    self.onCollageLeave = () => { self.mouse.on = false; };
    window.addEventListener('pointermove', self.onCollageMove, { passive: true });
    window.addEventListener('pointerleave', self.onCollageLeave, { passive: true });
    self.collageVisible = true;
  }

function tickCollage() {
    if (!self.tiles || !self.tiles.length || self.reduced) return;
    if (!self.collageVisible) {
      // release any residual magnetic/golden state once hidden
      if (self._collageWasActive) {
        self.tiles.forEach(t => { t.g = 0; t.mx = 0; t.my = 0; t.img.style.transform = 'translate(0,0) scale(1)'; t.img.style.filter = 'grayscale(1) contrast(1.06) brightness(.82)'; t.img.style.boxShadow = 'none'; });
        self._collageWasActive = false;
      }
      return;
    }
    self._collageWasActive = true;
    const R = 200, gold = self.props.collageGold ?? '#c9a24e';
    const mx = self.mouse.x, my = self.mouse.y, on = self.mouse.on;
    const vw = window.innerWidth, colHalf = vw / 12 / 2 + R;
    for (const t of self.tiles) {
      let targetG = 0, tx = 0, ty = 0;
      // cheap column reject: skip tiles whose column is far from the cursor
      const near = on && Math.abs(mx - t.colFrac * vw) < colHalf;
      if (near) {
        const rect = t.wrap.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = mx - cx, dy = my - cy, dist = Math.hypot(dx, dy);
        if (dist < R) {
          const pull = 1 - dist / R;               // 0..1, stronger when nearer
          targetG = Math.min(1, pull * 0.85);
          const mag = pull * 15;                   // gentle magnetic draw toward the cursor
          tx = (dx / (dist || 1)) * mag;
          ty = (dy / (dist || 1)) * mag;
        }
      }
      // ease each tile toward its target for smooth, non-jittery motion
      t.g += (targetG - t.g) * 0.12;
      t.mx += (tx - t.mx) * 0.14;
      t.my += (ty - t.my) * 0.14;
      const g = t.g;
      t.img.style.transform = 'translate(' + t.mx.toFixed(1) + 'px,' + t.my.toFixed(1) + 'px) scale(' + (1 + g * 0.08).toFixed(3) + ')';
      if (g > 0.004) {
        t.img.style.filter = 'grayscale(' + (1 - g * 0.85).toFixed(3) + ') sepia(' + (g * 0.7).toFixed(3) + ') saturate(' + (1 + g * 1.05).toFixed(3) + ') hue-rotate(' + (-9 * g).toFixed(1) + 'deg) brightness(' + (.82 + g * .2).toFixed(3) + ') contrast(' + (1.06 + g * .12).toFixed(3) + ')';
        t.img.style.boxShadow = '0 0 ' + (g * 22).toFixed(0) + 'px ' + self.rgba(gold, g * 0.38);
        t.img.style.zIndex = String(10 + Math.round(g * 10));
      } else {
        t.img.style.filter = 'grayscale(1) contrast(1.06) brightness(.82)';
        t.img.style.boxShadow = 'none';
        t.img.style.zIndex = '';
      }
    }
  }

function rgba(hex, a) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return 'rgba(201,162,78,' + a + ')';
    return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a.toFixed(3) + ')';
  }

function updateHero(y) {
    // Title + bottom scrim belong to the hero; fade out across the first rest+transition band.
    const fadeEnd = (self.segs[1] ? self.segs[1].start + self.segs[1].h * 0.4 : window.innerHeight);
    const t = Math.max(0, Math.min(1, 1 - y / fadeEnd));
    if (self.heroTitle) {
      self.heroTitle.style.opacity = String(t);
      self.heroTitle.style.transform = 'translateY(' + ((1 - t) * 22) + 'px)';
    }
    if (self.heroScrim) self.heroScrim.style.opacity = String(t);
    if (self.collageEl) {
      // Circular hole grows from ~22vmax to full-screen, hiding the collage well before
      // the first scroll transition band (which begins at segs[1].start).
      const restEnd = self.segs[0].start + self.segs[0].h;
      const cp = Math.max(0, Math.min(1, y / (restEnd * 0.82)));
      const hole = 34 + cp * 126;
      self.collageEl.style.setProperty('--hole', hole.toFixed(1) + 'vmax');
      self.collageEl.style.opacity = String(Math.max(0, Math.min(1, 1 - cp * 1.08)));
      self.collageVisible = cp < 0.98 && (self.props.heroCollage ?? true) !== false;
    }
    // Scroll button glides from bottom-centre (hero rest) to bottom-right corner as you leave.
    if (self.arrow) {
      const w = window.innerWidth;
      const margin = Math.max(20, Math.min(44, w * 0.036));
      const startLeft = w / 2 - 60;
      const endLeft = w - 120 - margin;
      const moveP = Math.max(0, Math.min(1, y / (fadeEnd * 0.8)));
      let left = startLeft + (endLeft - startLeft) * moveP;
      let backP = 0;
      const last = self.segs.find(s => s.type === 'rest' && s.i === self.N - 1);
      if (last) { const cp = Math.max(0, Math.min(1, (y - (last.start - last.h)) / last.h)); left = left + (startLeft - left) * cp; backP = cp; }
      self.arrow.style.left = left + 'px';
      self.arrowStuck = moveP > 0.9 && backP < 0.05;
    }
  }

function seekTo(t) {
    const v = self.stageVideo;
    if (!v) return;
    const d = v.duration;
    if (d && !isNaN(d)) t = Math.max(0, Math.min(d - 0.03, t));
    if (Math.abs((v.currentTime || 0) - t) > 0.008) { try { v.currentTime = t; } catch (e) {} }
  }

function renderFrame(dt) {
    if (self._transPlaying) return;   // video driven by playTransition's play()
    self.tickIdleLoop(dt || 0);
  }

function playTransition(fromIdx, speed, callback, reverse) {
    const v = self.stageVideo;
    if (!v || fromIdx < 0 || fromIdx >= self.TRANS_T.length) { if (callback) callback(); return; }
    const [t0, t1] = self.transRangeFor(fromIdx);
    const clipDur = t1 - t0;
    v.pause();
    let done = false;
    const finish = () => { if (done) return; done = true; if (self._transRAF) cancelAnimationFrame(self._transRAF); v.pause(); v.playbackRate = 1; if (self.transCanvas) self.transCanvas.style.opacity = '0'; if (callback) callback(); };
    if (reverse) {
      const canvas = self.transCanvas, ctx = self.transCtx;
      if (!canvas || !ctx) { finish(); return; }
      canvas.style.opacity = '1';
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      v.currentTime = t1;
      const durMs = (clipDur / speed) * 1000;
      const drawFrame = () => {
        if (v.readyState >= 2) {
          const cw = canvas.width, ch = canvas.height, vw = v.videoWidth, vh = v.videoHeight;
          const ir = vw / vh, cr = cw / ch;
          let w, h;
          if (cr > ir) { w = cw; h = cw / ir; } else { h = ch; w = ch * ir; }
          ctx.drawImage(v, (cw - w) / 2, (ch - h) / 2, w, h);
        }
      };
      const startT = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - startT) / durMs);
        drawFrame();
        const target = t1 - p * clipDur;
        if (Math.abs(v.currentTime - target) > 0.01) v.currentTime = target;
        if (p < 1 && !done) self._transRAF = requestAnimationFrame(step);
        else finish();
      };
      const onSeeked = () => { v.removeEventListener('seeked', onSeeked); drawFrame(); self._transRAF = requestAnimationFrame(step); };
      v.addEventListener('seeked', onSeeked);
      setTimeout(finish, durMs + 1000);
    } else {
      v.currentTime = t0;
      v.playbackRate = speed;
      const check = () => { if (v.currentTime >= t1 - 0.05) { v.removeEventListener('timeupdate', check); finish(); } };
      v.addEventListener('timeupdate', check);
      v.play().catch(() => { v.removeEventListener('timeupdate', check); finish(); });
      setTimeout(() => { v.removeEventListener('timeupdate', check); finish(); }, (clipDur / speed) * 1000 + 500);
    }
  }

function tickIdleLoop(dt) {
    const v = self.stageVideo;
    if (!v) return;
    const rng = self.loopRangeFor(self.currentSection);
    if (self.idleSection !== self.currentSection) {
      self.idleSection = self.currentSection;
      const cur = v.currentTime || rng[0];
      if (cur < rng[0] || cur > rng[1]) v.currentTime = rng[0];
    }
    if (self.reduced) return;
    // Simple forward loop within range — instant restart at boundary for seamless looping
    if (v.paused) { const p = v.play && v.play(); if (p && p.catch) p.catch(() => {}); }
    if ((v.currentTime || 0) >= rng[1] - 0.03) { v.currentTime = rng[0]; }
  }

function loadDepsThenScroll() {
    const addLink = (href) => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); };
    addLink('https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700,800&f[]=general-sans@400,500,600&display=swap');
    addLink('https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    self.startScroll();
  }

function startScroll() {
    // Slideshow mode: intercept wheel/touch for discrete section jumps.
    // Programmatic scrollTo still moves the page (drives update* overlay fades).
    self._wheelHandler = (e) => {
      e.preventDefault();
      if (self._transPlaying || self.autoReturn || self._homeGliding) return;
      if (self._homeScrollActive) {
        // At last section: accumulate scroll to drive arrow toward center
        if (e.deltaY > 0) { self._homeScrollAccum = Math.min(1, (self._homeScrollAccum || 0) + Math.abs(e.deltaY) / 600); self._updateHomeScroll(); }
        else if (e.deltaY < 0) { self._homeScrollAccum = Math.max(0, (self._homeScrollAccum || 0) - Math.abs(e.deltaY) / 600); self._updateHomeScroll(); if (self._homeScrollAccum <= 0) { self._glideHomeScrollBack(); } }
        return;
      }
      if (self._wheelLock) return;
      self._wheelLock = true;
      setTimeout(() => { self._wheelLock = false; }, 600);
      if (e.deltaY > 0) self.next();
      else if (e.deltaY < 0) self.prev();
    };
    window.addEventListener('wheel', self._wheelHandler, { passive: false });
    let touchY = null;
    self._touchStart = (e) => { touchY = e.touches[0].clientY; };
    self._touchMove = (e) => {
      if (touchY === null || self._transPlaying || self.autoReturn || self._homeGliding) return;
      const dy = touchY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) {
        e.preventDefault(); touchY = null;
        if (self._homeScrollActive) {
          if (dy > 0) { self._homeScrollAccum = Math.min(1, (self._homeScrollAccum || 0) + 0.25); self._updateHomeScroll(); }
          else { self._homeScrollAccum = Math.max(0, (self._homeScrollAccum || 0) - 0.25); self._updateHomeScroll(); if (self._homeScrollAccum <= 0) { self._glideHomeScrollBack(); } }
        } else {
          if (dy > 0) self.next(); else self.prev();
        }
      }
    };
    window.addEventListener('touchstart', self._touchStart, { passive: true });
    window.addEventListener('touchmove', self._touchMove, { passive: false });
    self.onScrollNative = () => self.handle(self.readY());
    window.addEventListener('scroll', self.onScrollNative, { passive: true });
  }

function goTo(y, duration) {
    const d = duration == null ? 0.6 : duration;
    if (d <= 0 || self.reduced) { window.scrollTo(0, y); self.handle(y); return; }
    if (self._scrollAnim) cancelAnimationFrame(self._scrollAnim);
    const start = self.readY(), dist = y - start, t0 = performance.now();
    const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / (d * 1000));
      window.scrollTo(0, start + dist * ease(p));
      if (p < 1) self._scrollAnim = requestAnimationFrame(step);
      else self._scrollAnim = null;
    };
    self._scrollAnim = requestAnimationFrame(step);
  }
function goToIndex(idx, duration) { idx = Math.max(0, Math.min(self.N - 1, idx)); self.goTo(self.restStart[idx] + 2, duration); }
  // Single hardened entry point for every "jump to contact" CTA: locks out the mid-scroll
  // auto-snap (which otherwise hijacks the animation and drops it mid-transition) for the
  // full duration of the jump, then re-verifies the landing spot once settled.
function scrollToLastSection(duration) {
    const d = duration == null ? 1.4 : duration;
    self._ctaJump = true;
    if (self._ctaJumpTimer) clearTimeout(self._ctaJumpTimer);
    self.goToIndex(self.N - 1, d);
    self._ctaJumpTimer = setTimeout(() => {
      self._ctaJump = false;
      const target = self.restStart[self.N - 1] + 2;
      if (Math.abs(self.readY() - target) > 4) self.goTo(target, 0.4);
    }, d * 1000 + 120);
  }
function _enterHomeScroll() {
    if (self._homeScrollActive) return;
    self._homeScrollActive = true;
    self._homeScrollAccum = 0;
    const w = window.innerWidth, h = window.innerHeight;
    self._homeArrowOrigin = { left: w / 2 - 60, bottomPx: Math.max(28, Math.min(56, h * 0.05)), h };
  }
function _updateHomeScroll() {
    const p = self._homeScrollAccum || 0;
    const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const e = easeIO(p);
    const o = self._homeArrowOrigin;
    if (!o || !self.arrow) return;
    const homeTop = o.h - 120 - o.bottomPx;
    const centerTop = o.h / 2 - 60;
    self.arrow.style.left = o.left + 'px';
    self.arrow.style.bottom = 'auto';
    self.arrow.style.top = (homeTop + (centerTop - homeTop) * e) + 'px';
    self._loopSpin = 180 * e;
    self.arrow.style.transform = 'rotate(' + self._loopSpin + 'deg)';
    if (self.arrowIcon) self.arrowIcon.style.setProperty('--arrow-rot', (180 * e) + 'deg');
    if (self.sec7) {
      const o2 = 1 - e;
      self.sec7.style.opacity = o2.toFixed(3);
      self.sec7.style.visibility = o2 > 0.02 ? 'visible' : 'hidden';
      self.sec7.style.pointerEvents = e > 0.3 ? 'none' : '';
      self.sec7.style.transform = 'translateY(' + (e * -12) + 'px)';
    }
    self.showHeader(false);
    self.setLoopLabel('Keep scrolling');
    // When fully scrolled to center, trigger the return
    if (p >= 0.99) { self._homeScrollActive = false; self.triggerHomeReturn(); }
  }
function _glideHomeScrollBack() {
    if (self._homeGlideBack) return;
    self._homeGlideBack = true;
    const from = self._homeScrollAccum || 0;
    const dur = 500, st = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const anim = (now) => {
      const p = Math.min(1, (now - st) / dur);
      self._homeScrollAccum = from * (1 - easeOut(p));
      self._updateHomeScroll();
      if (p < 1) { requestAnimationFrame(anim); return; }
      self._homeGlideBack = false;
      self._exitHomeScroll();
    };
    requestAnimationFrame(anim);
  }
function _exitHomeScroll() {
    self._homeScrollActive = false;
    self._homeScrollAccum = 0;
    if (self.sec7) { self.sec7.style.opacity = '1'; self.sec7.style.visibility = 'visible'; self.sec7.style.pointerEvents = ''; self.sec7.style.transform = ''; }
    if (self.arrow) { self.arrow.style.top = ''; self.arrow.style.bottom = ''; self.arrow.style.left = ''; self.arrow.style.transform = ''; }
    if (self.arrowIcon) self.arrowIcon.style.setProperty('--arrow-rot', '0deg');
    self._loopSpin = 0;
    self.arrowState = null;
    self.updateArrow();
  }
function next() {
    if (self._transPlaying || self.autoReturn || self._homeGliding || self._homeScrollActive) return;
    const from = self.currentSection;
    if (from >= self.N - 1) { self._enterHomeScroll(); return; }
    self._transPlaying = true;
    const speed = +(self.props.transitionSpeed ?? 3);
    const tr = self.transRangeFor(from);
    const dur = (tr[1] - tr[0]) / speed;
    self.playTransition(from, speed, () => {
      self._transPlaying = false;
      self.currentSection = from + 1;
      self.idleSection = null;
      self.bandKey = 'r' + (from + 1);
    });
    self.goToIndex(from + 1, dur);
  }
function prev() {
    if (self._transPlaying || self.autoReturn || self._homeGliding) return;
    const from = self.currentSection;
    if (from <= 0) return;
    self.currentSection = from - 1;
    self.idleSection = null;
    self.bandKey = 'r' + (from - 1);
    self.goToIndex(from - 1, 0.5);
  }

function bindArrow() {
    self.arrow.addEventListener('click', () => {
      // ≥3s glide so a one-tap jump plays the transition at a readable pace
      if (self.currentSection >= self.N - 1 && !self.inTrans) {
        if (!self._homeScrollActive) self._enterHomeScroll();
        // Animate smoothly to center over 800ms
        const from = self._homeScrollAccum || 0;
        const dur = 800, st = performance.now();
        const easeIO = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
        const anim = (now) => {
          const p = Math.min(1, (now - st) / dur);
          self._homeScrollAccum = from + (1 - from) * easeIO(p);
          self._updateHomeScroll();
          if (p < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
      }
      else self.next();
    });
  }

function tickArrowMagnet() {
    if (!self.arrow || self.reduced) { if (self.ringWrap) self.ringWrap.style.opacity = '1'; return; }
    if (self.autoReturn || self.inLoop) return;
    const stuck = !!self.arrowStuck;
    let curveTarget = 1, tx = 0, ty = 0;
    if (stuck) {
      curveTarget = 0;
      if (self.mouse.on) {
        const r = self.arrow.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = self.mouse.x - cx, dy = self.mouse.y - cy, dist = Math.hypot(dx, dy);
        const RAD = 190;
        if (dist < RAD) { const pull = 1 - dist / RAD; curveTarget = Math.min(1, pull * 1.4); const soft = Math.min(1, dist / 42); const mag = pull * 20 * soft; tx = dx / (dist || 1) * mag; ty = dy / (dist || 1) * mag; }
      }
    }
    self._am = self._am || { t: 1, x: 0, y: 0 };
    self._am.t += (curveTarget - self._am.t) * 0.16;
    self._am.x += (tx - self._am.x) * 0.17;
    self._am.y += (ty - self._am.y) * 0.17;
    if (self.ringWrap) self.ringWrap.style.opacity = self._am.t.toFixed(3);
    self.arrow.style.transform = 'translate(' + self._am.x.toFixed(1) + 'px,' + self._am.y.toFixed(1) + 'px)';
  }

function bindMenu() {
    self.menu = self.root.querySelector('[data-menu]');
    self.menuToggle = self.root.querySelector('[data-menu-toggle]');
    self.menuIco = self.root.querySelector('[data-menu-ico]');
    self.headerLogo = self.header ? self.header.querySelector('a[aria-label]') : null;
    self.headerCta = self.root.querySelector('[data-req]');
    if (!self.menu || !self.menuToggle) return;
    self.menuOpen = false;
    self.menuItems = Array.from(self.menu.querySelectorAll('[data-menu-link]'));
    self.menuToggle.addEventListener('click', () => self.toggleMenu());
    self.menuItems.forEach(a => {
      a.addEventListener('mouseenter', () => { a.style.color = 'var(--glow,#f6f5f2)'; });
      a.addEventListener('mouseleave', () => { a.style.color = 'var(--tx-muted,#a1a1aa)'; });
      a.addEventListener('click', (e) => { e.preventDefault(); const g = +a.getAttribute('data-go'); self.setMenu(false); self.goToIndex(g, 1.2); });
    });
    self.menu.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); self.setMenu(false); }));
    self.onMenuKey = (e) => { if (e.key === 'Escape' && self.menuOpen) self.setMenu(false); };
    window.addEventListener('keydown', self.onMenuKey);
  }

function toggleMenu() { self.setMenu(!self.menuOpen); }

function setMenu(v) {
    if (!self.menu || v === self.menuOpen) return;
    self.menuOpen = v;
    self.menuOpenAt = performance.now();
    self.menuToggle.setAttribute('aria-expanded', v ? 'true' : 'false');
    self.menuToggle.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    if (v) self.showHeader(true);
    if (self.lenis) { try { v ? self.lenis.stop() : self.lenis.start(); } catch (e) {} }
    self.root.querySelectorAll('[data-sec3],[data-sec4],[data-sec5],[data-sec6],[data-sec7],[data-hero-title],[data-arrow]').forEach((el) => {
      el.style.pointerEvents = v ? 'none' : '';
    });
    self.tickMenu();
  }

  // React reverts one-shot inline writes on template nodes, so re-assert every frame.
function tickMenu() {
    if (!self.menu) return;
    const v = !!self.menuOpen;
    const m = self.menu;
    m.style.opacity = v ? '1' : '0';
    m.style.visibility = v ? 'visible' : 'hidden';
    m.style.pointerEvents = v ? 'auto' : 'none';
    if (!self._introLock) {
      if (self.headerLogo) { self.headerLogo.style.transition = 'opacity .35s ease'; self.headerLogo.style.opacity = v ? '0' : '1'; self.headerLogo.style.pointerEvents = v ? 'none' : 'auto'; }
      if (self.headerCta) { self.headerCta.style.transition = 'opacity .35s ease'; self.headerCta.style.opacity = v ? '0' : '1'; self.headerCta.style.pointerEvents = v ? 'none' : 'auto'; }
    }
    const lines = self.menuIco ? self.menuIco.children : [];
    if (lines.length === 3) {
      if (v) { lines[0].style.top = '50%'; lines[0].style.transform = 'translateY(-50%) rotate(45deg)'; lines[1].style.opacity = '0'; lines[2].style.bottom = '50%'; lines[2].style.transform = 'translateY(50%) rotate(-45deg)'; }
      else { lines[0].style.top = '0'; lines[0].style.transform = 'none'; lines[1].style.opacity = '1'; lines[2].style.bottom = '0'; lines[2].style.transform = 'none'; }
    }
    const dt = performance.now() - (self.menuOpenAt || 0);
    self.menuItems.forEach((a, i) => {
      const shown = v && dt > (110 + i * 55);
      a.style.opacity = shown ? '1' : '0';
      a.style.transform = shown ? 'translateY(0)' : 'translateY(24px)';
    });
  }

function triggerHomeReturn() {
    if (self.autoReturn || self._homeGliding) return;
    self._homeGliding = true;
    self.inLoop = true;
    self.currentSection = self.N - 1; self.inTrans = false;
    // Arrow is already at center from _updateHomeScroll — spin for a moment, then smoothly bring in hero
    self.autoReturn = true;
    self._homeGliding = false;
    self.runHomeReturn();
  }

function bindKeys() {
    self.onKey = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Spacebar') { e.preventDefault(); self.next(); }
      else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); self.prev(); }
      else if (k === 'Home') { e.preventDefault(); self.goTo(0); }
      else if (k === 'End') { e.preventDefault(); self.goToIndex(self.N - 1); }
    };
    window.addEventListener('keydown', self.onKey);
  }

function updateArrow() {
    const atEnd = self.currentSection >= self.N - 1 && !self.inTrans;
    const state = atEnd ? 'top' : (self.currentSection === 0 && !self.inTrans ? 'unlock' : 'next');
    if (state === self.arrowState) return;
    self.arrowState = state;
    const label = state === 'top' ? 'Scroll to top' : (state === 'unlock' ? 'Scroll to unlock' : 'Scroll to next section');
    if (self.ringText) self.ringText.textContent = label.toUpperCase() + ' \u00b7 ' + label.toUpperCase() + ' \u00b7 ';
    const rot = state === 'top' ? '180deg' : '0deg';
    if (self.arrowIcon) { self.arrowIcon.style.setProperty('--arrow-rot', rot); }
    self.arrow.setAttribute('aria-label', label);
  }

  // ---- Return-to-home loop (scroll past the last section) ----
function handleLoopback(y) {
    if (self.autoReturn) return;
    self.inLoop = true;
    self.currentSection = self.N - 1;
    self.inTrans = false;
    const q = Math.max(0, Math.min(1, (y - self.loopStart) / self.loopH));
    const ease = t => 1 - Math.pow(1 - t, 3);
    const w = window.innerWidth, h = window.innerHeight;
    const a = ease(Math.min(1, q / 0.45));   // arrow travels to centre over phase A

    // Phase A — the last section (contact + footer) and header fade away.
    if (self.sec7) {
      const o = 1 - a;
      self.sec7.style.opacity = o.toFixed(3);
      self.sec7.style.visibility = o > 0.02 ? 'visible' : 'hidden';
      self.sec7.style.pointerEvents = 'none';
      self.sec7.style.transform = 'translateY(' + (a * -12) + 'px)';
    }
    self.showHeader(false);
    self.setLoopLabel('Keep scrolling');

    // Arrow glides to screen centre; a small spin builds with scroll.
    if (self.arrow) {
      const leftHome = w / 2 - 60;
      const centerTop = h / 2 - 60;
      const bottomPx = Math.max(28, Math.min(56, h * 0.05));
      const homeTop = h - 120 - bottomPx;
      self.arrow.style.top = (homeTop + (centerTop - homeTop) * a) + 'px';
      self.arrow.style.bottom = 'auto';
      self.arrow.style.left = leftHome + 'px';
      self._loopSpin = 180 * a;
      self.arrow.style.transform = 'rotate(' + self._loopSpin + 'deg)';
      if (self.arrowIcon) self.arrowIcon.style.setProperty('--arrow-rot', '180deg');
    }

    // Once centred, hand off to the automatic "loading" return.
    if (a >= 0.995 && !self.autoReturn && !self.loopResetting) self.runHomeReturn();
  }

function runHomeReturn() {
    self.autoReturn = true;
    if (self.reduced) { self.resetToHome(); self.autoReturn = false; return; }
    const w = window.innerWidth, h = window.innerHeight;
    const centerTop = h / 2 - 60;
    const bottomPx = Math.max(28, Math.min(56, h * 0.05));
    const homeTop = h - 120 - bottomPx;
    const SPIN = 1200, REVEAL = 900;
    const spinStart = self._loopSpin || 0;
    const loadSpeed = 0.7;
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const t0 = performance.now();
    self.setLoopLabel('Loading');
    // Reset scroll and switch video immediately (content already hidden by _updateHomeScroll)
    window.scrollTo(0, 0);
    self.currentSection = 0;
    self.idleSection = null;
    self.bandKey = 'r0';
    self.inTrans = false;
    self._transPlaying = false;
    // Hide hero elements for reveal
    if (self.heroTitle) { self.heroTitle.style.opacity = '0'; self.heroTitle.style.transform = 'translateY(22px)'; }
    if (self.heroScrim) self.heroScrim.style.opacity = '0';
    self.showHeader(false);
    const step = (now) => {
      const el = now - t0;
      // Phase 1: spin at center while hero content is hidden
      if (el < SPIN) {
        self._loopSpin = spinStart + loadSpeed * el;
        self.arrow.style.top = centerTop + 'px';
        self.arrow.style.transform = 'rotate(' + self._loopSpin + 'deg)';
        self.hrf = requestAnimationFrame(step);
        return;
      }
      // Phase 2: reveal hero content, arrow glides back to bottom
      const p = Math.min(1, (el - SPIN) / REVEAL);
      const e = easeIO(p);
      if (self.heroTitle) { self.heroTitle.style.opacity = e.toFixed(3); self.heroTitle.style.transform = 'translateY(' + ((1 - e) * 22) + 'px)'; }
      if (self.heroScrim) self.heroScrim.style.opacity = e.toFixed(3);
      self.showHeader(e > 0.5);
      self.arrow.style.top = (centerTop + (homeTop - centerTop) * e) + 'px';
      const spinEnd = spinStart + loadSpeed * SPIN;
      const spinTarget = Math.ceil(spinEnd / 360 + 1) * 360;
      self.arrow.style.transform = 'rotate(' + (spinEnd + (spinTarget - spinEnd) * easeOut(e)) + 'deg)';
      if (e > 0.6) self.setLoopLabel('Scroll to unlock');
      if (p < 1) { self.hrf = requestAnimationFrame(step); return; }
      // Done
      self.autoReturn = false;
      self.inLoop = false;
      self.exitLoopCleanup();
      self.loopResetting = true;
      requestAnimationFrame(() => { self.handle(0); self.loopResetting = false; });
    };
    self.hrf = requestAnimationFrame(step);
  }

function setLoopLabel(text) {
    if (self._loopLabel === text) return;
    self._loopLabel = text;
    if (self.ringText) self.ringText.textContent = text.toUpperCase() + ' \u00b7 ' + text.toUpperCase() + ' \u00b7 ';
    self.arrowState = 'loop';
  }

function exitLoopCleanup() {
    if (self.arrow) {
      self.arrow.style.transform = 'rotate(0deg)';
      self.arrow.style.top = 'auto';
      self.arrow.style.bottom = 'clamp(28px,5vh,56px)';
    }
    if (self.sec7) self.sec7.style.pointerEvents = '';
    self.arrowState = null;
    self._loopLabel = null;
  }

function resetToHome() {
    self.inLoop = false;
    self.exitLoopCleanup();
    if (self.lenis) self.lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => { self.handle(0); self.loopResetting = false; });
  }

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on unload
window.addEventListener('beforeunload', destroy);

})();
