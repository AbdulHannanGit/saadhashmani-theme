// GSAP motion layer. Loaded by app.js only when GSAP is enabled for the device (Theme Options) or forced with ?gsap=1.
//
// Thesis: every section is a vault chapter that unlocks on arrival. Eyebrows dial in like a
// combination lock (ScrambleText through digits), then each chapter arrives in its own way:
// the hero name rises letter by letter, proof numbers count up, the ventures heading slides
// open like a door, the playbook comes into focus, and the contact form opens from its centre
// as the last door. A section resets while it is out of sight and builds as it fades in, so
// arrival is always the authored moment; the page's own quick cross-fade stays the exit.
(function () {
  const DIAL = '0123456789';
  const NUM = /^(\D*)(\d+(?:\.\d+)?)(.*)$/;

  function create(app) {
    gsap.registerPlugin(SplitText, ScrambleTextPlugin);
    gsap.defaults({ ease: 'expo.out', duration: 0.9 });
    // keep real time after dropped frames or a backgrounded tab, so hidden content always finishes revealing
    gsap.ticker.lagSmoothing(0);
    const reduce = app.reduced || matchMedia('(prefers-reduced-motion: reduce)').matches;

    // split masks: keep descenders visible while lines rise
    const st = document.createElement('style');
    st.textContent = '.gm-line-mask{padding-bottom:.14em;margin-bottom:-.14em}.gm-char-mask{padding-bottom:.08em;margin-bottom:-.08em}';
    document.head.appendChild(st);

    const roots = [app.heroTitle, app.sec2, app.sec3, app.sec4, app.sec5, app.sec6, app.sec7];
    const state = roots.map(() => ({ primed: false, entered: false }));
    let live = null, splits = [];

    const q = (el, sel) => (el ? Array.from(el.querySelectorAll(sel)) : []);
    const one = (el, sel) => (el ? el.querySelector(sel) : null);
    const opacityOf = (el) => { if (!el) return 0; const o = parseFloat(el.style.opacity); return isNaN(o) ? 1 : o; };
    const heroReady = () => !app.pre || app._preDone || app.pre.style.display === 'none';
    const activeSlide = () => (app.vSlides ? app.vSlides[app.vIndex || 0] : null);

    // what moves in each section
    function parts(i) {
      const r = roots[i];
      switch (i) {
        case 0: return { eyebrows: q(r, '[data-eyebrow]'), chars: q(r, 'h1 > span') };
        case 1: { const stats = q(r, '[style*="tabular-nums"]').filter((el) => !el.closest('[data-tl]')); // not the timeline years
          return { eyebrows: q(r, '[data-eyebrow]'), lines: q(r, 'h2'), nums: stats, items: stats.map((el) => el.nextElementSibling).filter(Boolean) }; }
        case 2: { const s = activeSlide(); return { eyebrows: q(s, '[data-eyebrow]'), wipe: q(s, 'h2'), nums: q(s, 'div').filter((d) => !d.children.length && NUM.test(d.textContent.trim()) && /\d/.test(d.textContent) && d.textContent.trim().length < 8), items: q(s, 'p, [data-ext-cta], [data-vgallery]') }; }
        case 3: return { eyebrows: q(one(r, '[data-pb-heading]'), '[data-eyebrow]'), focus: q(one(r, '[data-pb-heading]'), 'h2') };
        case 4: return { eyebrows: q(r, '[data-pod-src]'), wipe: q(r, '[data-pod-title]'), items: q(r, '[data-pod-desc], [data-pod-prev], [data-pod-play], [data-pod-next], [data-pod-track]') };
        case 5: return { eyebrows: q(r, '[data-eyebrow]'), lines: q(r, 'h2'), fan: q(r, '[data-testi-plat]'), nums: q(r, '[data-stat-n]'), items: q(r, '[data-stat-l]') };
        case 6: return { eyebrows: q(r, '[data-eyebrow]'), lines: q(r, 'h2'), items: q(r, 'h2 + p'), door: q(r, '[data-chat]'), foot: q(r, '[data-sec7-footer]') };
      }
      return {};
    }

    // hidden starting state, applied while the section is invisible
    function prime(i) {
      const p = parts(i);
      gsap.set([...(p.eyebrows || []), ...(p.lines || []), ...(p.chars || []), ...(p.wipe || []), ...(p.focus || []), ...(p.nums || []), ...(p.items || []), ...(p.fan || []), ...(p.door || []), ...(p.foot || [])], { autoAlpha: 0 });
    }

    function finishLive() {
      // progress(1) runs onComplete, which clears `live`; keep our own reference
      if (live) { const tl = live; live = null; tl.progress(1); tl.kill(); }
      splits.forEach((s) => s.revert()); splits = [];
    }

    // count a proof number up from zero, keeping its prefix/suffix and decimals
    function countUp(tl, el, at) {
      const txt = el.textContent.trim(), m = txt.match(NUM);
      if (!m) { tl.to(el, { autoAlpha: 1, duration: 0.5 }, at); return; }
      const dec = (m[2].split('.')[1] || '').length, end = parseFloat(m[2]), o = { v: 0 };
      let wrote = m[1] + (0).toFixed(dec) + m[3];
      tl.set(el, { autoAlpha: 1, textContent: wrote }, at);
      tl.to(o, {
        v: end, duration: 1.6, ease: 'power3.out',
        // another control (e.g. a platform pill) may rewrite the number mid-count: stop touching it then
        onUpdate: () => { if (el.textContent !== wrote) return; wrote = m[1] + o.v.toFixed(dec) + m[3]; el.textContent = wrote; },
        onComplete: () => { if (el.textContent === wrote) el.textContent = txt; }
      }, at);
    }

    function enter(i) {
      finishLive();
      const p = parts(i);
      const all = [...(p.eyebrows || []), ...(p.lines || []), ...(p.chars || []), ...(p.wipe || []), ...(p.focus || []), ...(p.nums || []), ...(p.items || []), ...(p.fan || []), ...(p.door || []), ...(p.foot || [])];
      const tl = gsap.timeline({ onComplete: () => { splits.forEach((s) => s.revert()); splits = []; live = null; } });
      live = tl;
      if (reduce) { tl.to(all, { autoAlpha: 1, duration: 0.4, ease: 'power1.out', stagger: 0.03 }); return; }

      // the combination dial: shared by every chapter
      p.eyebrows && p.eyebrows.forEach((el) => {
        const text = el.dataset.gmText || (el.dataset.gmText = el.textContent);
        tl.set(el, { autoAlpha: 1, textContent: '' }, 0)
          .to(el, { duration: 1, ease: 'none', scrambleText: { text, chars: DIAL, speed: 0.5, revealDelay: 0.25 } }, 0);
      });
      // hero: the name rises letter by letter out of the preloader handoff
      if (p.chars && p.chars.length) {
        const sp = p.chars.map((el) => SplitText.create(el, { type: 'chars', mask: 'chars', tag: 'span', charsClass: 'gm-char' }));
        splits.push(...sp);
        tl.set(p.chars, { autoAlpha: 1 }, 0)
          .from(sp.flatMap((s) => s.chars), { yPercent: 110, duration: 1.1, stagger: 0.045, ease: 'expo.out' }, 0.05);
      }
      // headings that rise line by line
      if (p.lines && p.lines.length) {
        p.lines.forEach((el) => {
          const s = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'gm-line' }); splits.push(s);
          tl.set(el, { autoAlpha: 1 }, 0.1).from(s.lines, { yPercent: 105, duration: 1, stagger: 0.09 }, 0.1);
        });
      }
      // ventures / podcast title: wipe open from the left like a sliding door
      if (p.wipe && p.wipe.length) {
        tl.fromTo(p.wipe, { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0%)', x: -18 }, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, duration: 1.1, ease: 'expo.inOut', clearProps: 'clipPath,transform' }, 0.1);
      }
      // playbook: principles come into focus
      if (p.focus && p.focus.length) {
        tl.fromTo(p.focus, { autoAlpha: 0, filter: 'blur(14px)', scale: 1.06 }, { autoAlpha: 1, filter: 'blur(0px)', scale: 1, duration: 1.3, clearProps: 'filter,transform' }, 0.15);
      }
      // proof numbers count up
      (p.nums || []).forEach((el, k) => countUp(tl, el, 0.35 + k * 0.08));
      // platform pills fan out from the centre
      if (p.fan && p.fan.length) tl.fromTo(p.fan, { autoAlpha: 0, y: 10, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: { each: 0.06, from: 'center' }, ease: 'back.out(1.6)' }, 0.35);
      // supporting items settle in after the heading
      if (p.items && p.items.length) tl.fromTo(p.items, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, clearProps: 'transform' }, 0.45);
      // contact: the form opens from its centre, the last door
      if (p.door && p.door.length) {
        tl.fromTo(p.door, { autoAlpha: 1, clipPath: 'inset(0% 50% 0% 50% round 999px)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.2, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.5);
      }
      if (p.foot && p.foot.length) tl.fromTo(p.foot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0.9);
    }

    // every frame: reset sections that are out of sight, build the one that is arriving
    function tick() {
      for (let i = 0; i < roots.length; i++) {
        const o = opacityOf(roots[i]), s = state[i];
        if (o < 0.02) {
          if (!s.primed) { if (s.entered && live) finishLive(); prime(i); s.primed = true; s.entered = false; }
        } else if (o > 0.6 && !s.entered && (i !== 0 || heroReady())) {
          s.entered = true; s.primed = false; enter(i);
        }
      }
    }

    // ventures: a new slide unlocks in place
    function venture() {
      const s = state[2];
      if (!s.entered) return;
      finishLive();
      prime(2); enter(2);
    }

    // start: everything not on screen is primed; the hero waits for the preloader
    roots.forEach((r, i) => { if (i !== 0) { prime(i); state[i].primed = true; } });
    if (!heroReady() || opacityOf(roots[0]) > 0.6) { prime(0); state[0].primed = true; }
    return { tick, venture };
  }

  window.GsapMotion = {
    create: (app) => document.fonts.ready.then(() => create(app))
  };
})();
