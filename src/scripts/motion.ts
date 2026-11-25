// All page motion. Content is visible by default; motion only runs when <html> has the
// "motion" class (set in Base.astro when the visitor has not asked for reduced motion).

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

declare global {
  interface Window { __motionReady?: boolean }
}

export function initMotion() {
  window.__motionReady = true;
  const motion = document.documentElement.classList.contains('motion');

  setupNav();
  setupLossChart();
  if (!motion) {
    document.querySelectorAll('.loss-dot, .epoch-row').forEach((el) => el.classList.add('is-on'));
    return;
  }

  setupReveals();
  setupCounters();
  setupParallax();
  setupLossCurve();
  setupNetPulses();
}

/* ---------- nav: background on scroll + active section ---------- */
function setupNav() {
  const nav = document.querySelector('.site-nav');
  const update = () => nav?.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });

  const links = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav]')];
  const sections = links.map((l) => document.getElementById(l.dataset.nav!)).filter((s): s is HTMLElement => !!s);
  const inBand = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inBand.add(e.target.id); else inBand.delete(e.target.id);
      }
      // the last section (in page order) that crosses the middle band is the active one
      const active = [...sections].reverse().find((s) => inBand.has(s.id))?.id;
      links.forEach((l) => l.classList.toggle('is-active', l.dataset.nav === active));
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));
}

/* ---------- reveal on scroll (fade, chalk-write, stroke draw, fills) ---------- */
function setupReveals() {
  // Clip-path-hidden elements ([data-write]) count as invisible to IntersectionObserver,
  // so we watch their parent instead and reveal the children from there.
  const targets = new Map<Element, Element[]>();
  const add = (watch: Element, el: Element) => {
    if (!targets.has(watch)) targets.set(watch, []);
    targets.get(watch)!.push(el);
  };
  document
    .querySelectorAll('[data-reveal], [data-draw], [data-fill], [data-reveal-target]')
    .forEach((el) => add(el, el));
  document.querySelectorAll('[data-write]').forEach((el) => add(el.parentElement ?? el, el));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        targets.get(e.target)?.forEach((el) => el.classList.add('is-in'));
        io.unobserve(e.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
  );
  targets.forEach((_, watch) => io.observe(watch));
}

/* ---------- numbers count up when seen ---------- */
function setupCounters() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target as HTMLElement;
        const to = parseFloat(el.dataset.count!);
        const dec = parseInt(el.dataset.decimals || '0', 10);
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        const start = performance.now() + 250;
        const dur = 1400;
        const tick = (now: number) => {
          const t = clamp((now - start) / dur);
          el.textContent = pre + (to * easeOutExpo(t)).toFixed(dec) + suf;
          if (t < 1) requestAnimationFrame(tick);
        };
        el.textContent = pre + (0).toFixed(dec) + suf;
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll('[data-count]').forEach((el) => io.observe(el));
}

/* ---------- background equations drift at different speeds ---------- */
function setupParallax() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  if (!els.length) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.5) return;
    for (const el of els) el.style.translate = `0 ${(-y * parseFloat(el.dataset.parallax!)).toFixed(1)}px`;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
}

/* ---------- loss curve draws as you scroll through the training log ---------- */
function setupLossCurve() {
  const section = document.querySelector<HTMLElement>('[data-loss-section]');
  const path = section?.querySelector<SVGPathElement>('.loss-path');
  if (!section || !path) return;
  const dots = [...section.querySelectorAll<SVGGElement>('.loss-dot')];
  const rows = [...section.querySelectorAll<HTMLElement>('.epoch-row')];

  // Where along the path each dot sits (0..1), found by searching the path for its x.
  const total = path.getTotalLength();
  const fractions = dots.map((d) => {
    const x = parseFloat(d.dataset.x!);
    let lo = 0, hi = total;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (path.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
    }
    return lo / total;
  });

  let ticking = false;
  const update = () => {
    ticking = false;
    // Fully drawn by the time the chart reaches the middle of the screen.
    const r = (path.ownerSVGElement ?? section).getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.95 - r.top) / (vh * 0.5));
    path.style.strokeDashoffset = String(1 - p);
    fractions.forEach((f, i) => {
      const on = p >= f - 0.005;
      dots[i]?.classList.toggle('is-on', on);
      rows[i]?.classList.toggle('is-on', on);
    });
  };
  update();
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
}

/* ---------- interactive loss chart: probe rides the curve, snaps to epochs ---------- */
function setupLossChart() {
  const chart = document.querySelector<HTMLElement>('[data-loss-chart]');
  const svg = chart?.querySelector('svg');
  if (!chart || !svg) return;
  const cfg = JSON.parse(chart.dataset.lossChart!) as {
    W: number; VH: number; TOP: number; AMP: number; X0: number; K: number; xs: number[];
  };
  const yAt = (x: number) => cfg.TOP - cfg.AMP * Math.exp(-(x - cfg.X0) / cfg.K);
  const lossAt = (x: number) => (cfg.TOP - yAt(x)) / cfg.AMP;
  // fractional epoch for any x: 0 at the start, 1 at the first dot, 2 at the second...
  const epochAt = (x: number) => {
    const stops = [cfg.X0, ...cfg.xs];
    for (let i = 0; i < stops.length - 1; i++) {
      if (x <= stops[i + 1]) return i + (x - stops[i]) / (stops[i + 1] - stops[i]);
    }
    const last = stops.length - 1;
    return last + (x - stops[last]) / (stops[last] - stops[last - 1]);
  };

  const line = svg.querySelector<SVGLineElement>('.probe-line')!;
  const hline = svg.querySelector<SVGLineElement>('.probe-h')!;
  const dot = svg.querySelector<SVGCircleElement>('.probe-dot')!;
  const dots = [...svg.querySelectorAll<SVGGElement>('.loss-dot')];
  const readout = chart.querySelector<HTMLElement>('.readout')!;
  const tip = chart.querySelector<HTMLElement>('.epoch-tip')!;
  const tipBodies = [...tip.querySelectorAll<HTMLElement>('.tip-body')];
  const rows = [...document.querySelectorAll<HTMLElement>('.epoch-row')];
  const SNAP = 55; // svg units

  let hot = -1;
  const pctX = (x: number) => `${(x / cfg.W) * 100}%`;
  const pctY = (y: number) => `${(y / cfg.VH) * 100}%`;

  const setHot = (i: number) => {
    if (i === hot) return;
    hot = i;
    dots.forEach((d, j) => d.classList.toggle('is-hot', j === i));
    rows.forEach((r, j) => r.classList.toggle('is-hot', j === i));
    if (i < 0) { tip.classList.remove('is-visible'); return; }
    tipBodies.forEach((b, j) => b.classList.toggle('hidden', j !== i));
    tip.classList.add('is-visible');
  };

  const placeProbe = (x: number, snapped: boolean) => {
    const y = yAt(x);
    line.setAttribute('x1', String(x));
    line.setAttribute('x2', String(x));
    hline.setAttribute('x2', String(x));
    hline.setAttribute('y1', String(y));
    hline.setAttribute('y2', String(y));
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(y));
    if (snapped) {
      readout.classList.remove('is-visible');
      // keep the card inside the chart horizontally
      const cx = Math.min(Math.max(x, cfg.W * 0.14), cfg.W * 0.86);
      tip.style.left = pctX(cx);
      tip.style.top = pctY(y);
    } else {
      readout.textContent = `epoch ${epochAt(x).toFixed(1)} · loss ${lossAt(x).toFixed(2)}`;
      readout.style.left = pctX(x);
      readout.style.top = pctY(y);
      readout.classList.add('is-visible');
    }
  };

  const toSvgX = (clientX: number) => {
    const r = svg.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * cfg.W;
  };

  const onMove = (e: PointerEvent) => {
    chart.classList.add('is-hover');
    let x = Math.min(Math.max(toSvgX(e.clientX), cfg.X0), 980);
    let best = -1, bestD = Infinity;
    cfg.xs.forEach((dx, i) => { const dd = Math.abs(dx - x); if (dd < bestD) { bestD = dd; best = i; } });
    const snapped = bestD < SNAP;
    if (snapped) x = cfg.xs[best];
    setHot(snapped ? best : -1);
    placeProbe(x, snapped);
  };
  const clear = (e?: Event) => {
    // on touch, keep the last tapped point visible
    if (e instanceof PointerEvent && e.pointerType === 'touch') return;
    chart.classList.remove('is-hover');
    readout.classList.remove('is-visible');
    setHot(-1);
  };

  chart.addEventListener('pointermove', onMove);
  chart.addEventListener('pointerdown', onMove);
  chart.addEventListener('pointerleave', clear);

  // rows drive the chart too (hover and keyboard focus)
  rows.forEach((row, i) => {
    const show = () => { chart.classList.add('is-hover'); setHot(i); placeProbe(cfg.xs[i], true); };
    row.addEventListener('pointerenter', show);
    row.addEventListener('focus', show);
    row.addEventListener('pointerleave', clear);
    row.addEventListener('blur', () => clear());
  });
}

/* ---------- signals travel through the hero network, layer by layer ---------- */
function setupNetPulses() {
  const svg = document.querySelector<SVGSVGElement>('svg[data-net]');
  const layer = svg?.querySelector<SVGGElement>('.pulses');
  if (!svg || !layer) return;
  type Pt = [number, number];
  const edges: [Pt, Pt][] = JSON.parse(svg.dataset.net!);
  const key = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`;
  // index edges by the node they start from
  const from = new Map<string, [Pt, Pt][]>();
  for (const e of edges) {
    const k = key(e[0][0] - 12, e[0][1]);
    if (!from.has(k)) from.set(k, []);
    from.get(k)!.push(e);
  }
  const startX = Math.min(...edges.map((e) => e[0][0]));
  const firstEdges = edges.filter((e) => e[0][0] === startX);

  type Pulse = { el: SVGCircleElement; edge: [Pt, Pt]; t0: number };
  const pulses: Pulse[] = [];
  const NS = 'http://www.w3.org/2000/svg';
  const DUR = 700;

  const spawn = (edge: [Pt, Pt], now: number) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '3.2');
    c.setAttribute('fill', '#F2D06B');
    layer.appendChild(c);
    pulses.push({ el: c, edge, t0: now });
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(svg);

  let lastSpawn = 0;
  const begin = performance.now() + 2200; // after the network has drawn itself
  const frame = (now: number) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || now < begin) return;
    if (now - lastSpawn > 650 && pulses.length < 10) {
      lastSpawn = now;
      spawn(firstEdges[Math.floor(Math.random() * firstEdges.length)], now);
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const t = (now - p.t0) / DUR;
      const [a, b] = p.edge;
      if (t >= 1) {
        p.el.remove();
        pulses.splice(i, 1);
        const next = from.get(key(b[0] + 12, b[1]));
        if (next && Math.random() < 0.85) spawn(next[Math.floor(Math.random() * next.length)], now);
        continue;
      }
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      p.el.setAttribute('cx', String(a[0] + (b[0] - a[0]) * e));
      p.el.setAttribute('cy', String(a[1] + (b[1] - a[1]) * e));
      p.el.setAttribute('opacity', String(Math.sin(Math.PI * t) * 0.9 + 0.1));
    }
  };
  requestAnimationFrame(frame);
}
