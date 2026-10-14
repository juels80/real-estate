const IMG = id => `assets/images/${id}.jpg`;
const VID = id => `assets/videos/${id}.mp4`;
const PHOTO = id => `assets/images/${id}.jpg`;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const listings = [
  { title: "Casa Blanca Terrace", loc: "Marbella, Spain", type: "Villa", price: 4250000, beds: 5, baths: 6, sqft: 6200, acres: 0.8, img: IMG("photo-1613490493576-7fde63acd811"), desc: "A study in light and limestone. Floor-to-ceiling glazing opens onto an infinity terrace overlooking the Mediterranean." },
  { title: "The Linear House", loc: "Scottsdale, Arizona", type: "Villa", price: 3150000, beds: 4, baths: 5, sqft: 4800, acres: 1.2, img: IMG("photo-1706808849780-7a04fbac83ef"), desc: "Long horizontal planes, a resort-scale pool, and desert views framed from every room." },
  { title: "Campoamor Residence", loc: "Costa Blanca, Spain", type: "Coastal", video: 30357, price: 2650000, beds: 4, baths: 4, sqft: 4100, acres: 0.5, img: IMG("photo-1512917774080-9991f1c4c750"), desc: "Minutes from the coast and golf course, with a sunlit courtyard pool and generous indoor-outdoor living." },
  { title: "Villa Serena", loc: "Lake Como, Italy", type: "Estate", video: 8603, price: 8900000, beds: 7, baths: 8, sqft: 11400, acres: 4.5, img: IMG("photo-1600596542815-ffad4c1539a9"), desc: "A restored Mediterranean estate set among terraced gardens, with a private guest house and boat access." },
  { title: "Glasshouse No. 9", loc: "Kiawah Island, SC", type: "Coastal", video: 27543, price: 5400000, beds: 5, baths: 5, sqft: 5600, acres: 1, img: IMG("photo-1748063578185-3d68121b11ff"), desc: "After dark it glows like a lantern. A warm-lit modern home steps from the dunes." },
  { title: "Cedar Ridge", loc: "Asheville, NC", type: "Estate", price: 1950000, beds: 4, baths: 3, sqft: 3900, acres: 6, img: IMG("photo-1591474200742-8e512e6f98f8"), desc: "Timber, stone, and quiet. A mountain retreat on six private acres with long ridge views." },
  { title: "Azure Sky Penthouse", loc: "Miami Beach, FL", type: "Penthouse", video: 26757, price: 7250000, beds: 4, baths: 5, sqft: 4600, acres: 0, img: IMG("photo-1670589953882-b94c9cb380f5"), desc: "A full-floor residence with a rooftop pool, private elevator, and unobstructed ocean horizons." },
  { title: "Monolith House", loc: "Austin, Texas", type: "Villa", price: 3650000, beds: 5, baths: 5, sqft: 5200, acres: 0.9, img: IMG("photo-1580587771525-78b9dba3b914"), desc: "Clean geometry in white render and warm wood, with a landscaped garden designed for long evenings." },
];

const $ = s => document.querySelector(s);
const money = n => n >= 1e6 ? `$${+(n / 1e6).toFixed(2)}M` : `$${n.toLocaleString()}`;
const isTyping = t => t.closest && t.closest("input, select, textarea, [contenteditable]");
const favs = new Set();
let chip = "all";

// Focus handling shared by the listing modal and the gallery lightbox
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';
let lastFocus = null;
function trapFocus(container, e) {
  if (e.key !== "Tab") return;
  const items = [...container.querySelectorAll(FOCUSABLE)].filter(el => !el.hidden && el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function favIcon(on) {
  return `<svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.7 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>`;
}

function render() {
  const loc = $("#qLoc").value.trim().toLowerCase();
  const type = chip !== "all" ? chip : $("#qType").value;
  const budget = +$("#qBudget").value, beds = +$("#qBeds").value;
  const items = listings.filter(l =>
    (type === "all" || l.type === type) &&
    (!loc || (l.loc + " " + l.title).toLowerCase().includes(loc)) &&
    (!budget || l.price <= budget) && l.beds >= beds);
  $("#count").textContent = `${items.length} of ${listings.length} residences`;
  $("#grid").innerHTML = items.length ? items.map(l => {
    const i = listings.indexOf(l), on = favs.has(i);
    return `<article class="card" data-i="${i}" tabindex="0" role="button" aria-label="View ${l.title}, ${l.loc}, ${money(l.price)}">
      <div class="card-img"><img src="${l.img}" alt="${l.title}" loading="lazy">${l.video ? `<video muted loop playsinline preload="none" poster="${l.img}" src="${VID(l.video)}" aria-hidden="true"></video><span class="vtag">Film</span>` : ""}<span class="tag">${l.type}</span>
        <button class="fav ${on ? "on" : ""}" data-fav="${i}" aria-pressed="${on}" aria-label="Save ${l.title} to shortlist">${favIcon(on)}</button>
      </div>
      <div class="card-body"><div class="price">${money(l.price)}</div><h3>${l.title}</h3><div class="loc">${l.loc}</div>
        <div class="specs"><span><b>${l.beds}</b> Beds</span><span><b>${l.baths}</b> Baths</span><span><b>${l.sqft.toLocaleString()}</b> Sq Ft</span></div>
      </div></article>`;
  }).join("") : `<div class="empty">No residences match those criteria. Try widening your search.</div>`;
  document.querySelectorAll("#grid .card").forEach(card => {
    const v = card.querySelector("video"); if (!v || reduceMotion) return;
    card.addEventListener("mouseenter", () => { card.classList.add("vplay"); v.play().catch(() => {}); });
    card.addEventListener("mouseleave", () => { card.classList.remove("vplay"); v.pause(); });
  });
}

$("#filters").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip").forEach(c => { c.classList.toggle("active", c === b); c.setAttribute("aria-pressed", c === b); });
  chip = b.dataset.f; $("#qType").value = "all"; render();
});
$("#search").addEventListener("submit", e => {
  e.preventDefault(); chip = "all";
  const t = $("#qType").value;
  document.querySelectorAll(".chip").forEach(c => { c.classList.toggle("active", c.dataset.f === t); c.setAttribute("aria-pressed", c.dataset.f === t); });
  render(); $("#listings").scrollIntoView();
});

$("#grid").addEventListener("click", e => {
  const f = e.target.closest("[data-fav]");
  if (f) {
    const i = +f.dataset.fav, on = !favs.has(i);
    on ? favs.add(i) : favs.delete(i);
    f.classList.toggle("on", on); f.setAttribute("aria-pressed", on); f.innerHTML = favIcon(on);
    toast(on ? "Saved to your shortlist" : "Removed from shortlist");
    return;
  }
  const c = e.target.closest(".card"); if (c) openModal(+c.dataset.i);
});
$("#grid").addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("card")) { e.preventDefault(); openModal(+e.target.dataset.i); }
});

const modal = $("#modal");
function openModal(i) {
  const l = listings[i];
  $("#mImg").src = l.img; $("#mImg").alt = l.title;
  const mv = $("#mVid");
  $("#mImg").hidden = !!l.video; mv.hidden = !l.video;
  if (l.video) { mv.poster = l.img; mv.src = VID(l.video); if (!reduceMotion) mv.play().catch(() => {}); }
  $("#mType").textContent = l.type; $("#mTitle").textContent = l.title; $("#mLoc").textContent = l.loc;
  $("#mPrice").textContent = money(l.price); $("#mDesc").textContent = l.desc;
  $("#mStats").innerHTML = `<div><b>${l.beds}</b>Beds</div><div><b>${l.baths}</b>Baths</div><div><b>${l.sqft.toLocaleString()}</b>Sq Ft</div><div><b>${l.acres || "—"}</b>Acres</div>`;
  lastFocus = document.activeElement;
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  pauseStage(true);
  $("#mClose").focus();
}
function closeModal() {
  if (!modal.classList.contains("open")) return;
  $("#mVid").pause(); modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  pauseStage(false);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
$("#mClose").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
modal.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); else trapFocus(modal, e); });
$("#tourForm").addEventListener("submit", e => { e.preventDefault(); e.target.reset(); closeModal(); toast("Viewing requested. An advisor will be in touch."); });

let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600); }

// Mortgage calculator
function calc() {
  const P = +$("#price").value, d = +$("#down").value, r = +$("#rate").value, y = +$("#term").value;
  const loan = P * (1 - d / 100), m = r / 100 / 12, n = y * 12;
  const pay = loan * m / (1 - Math.pow(1 + m, -n));
  const out = {
    price: "$" + P.toLocaleString(),
    down: `${d}% · $${Math.round(P * d / 100).toLocaleString()}`,
    rate: r.toFixed(2) + "%",
    term: y + " years",
  };
  $("#oPrice").textContent = out.price; $("#oDown").textContent = out.down;
  $("#oRate").textContent = out.rate; $("#oTerm").textContent = out.term;
  for (const id in out) $("#" + id).setAttribute("aria-valuetext", out[id]);
  $("#monthly").textContent = "$" + Math.round(pay).toLocaleString();
}
["price", "down", "rate", "term"].forEach(id => $("#" + id).addEventListener("input", calc));

// Hero video: respect reduced motion (the poster frame stays)
const heroVideo = $("#heroVideo");
if (reduceMotion) { heroVideo.removeAttribute("autoplay"); heroVideo.pause(); }

// Gallery
const slides = [
  { kind: "video", src: VID(27543), poster: IMG("photo-1748063578185-3d68121b11ff"), title: "Glasshouse No. 9", meta: "Kiawah Island, SC", text: "Steps from the dunes, open to the tide." },
  { kind: "image", src: PHOTO("photo-1600596542815-ffad4c1539a9"), title: "Villa Serena", meta: "Lake Como, Italy", text: "Terraced gardens and a century of quiet." },
  { kind: "video", src: VID(30357), title: "The Aegean Line", meta: "Greek Coast · Aerial", text: "A shoreline of private villas, seen from above." },
  { kind: "image", src: PHOTO("photo-1758957701419-2c6e266f7988"), title: "Interior Study", meta: "Monolith House · Austin", text: "Raw concrete, live-edge oak, and soft north light." },
  { kind: "video", src: VID(8603), title: "Orchard Manor", meta: "Countryside Estate · Aerial", text: "Forty acres of orchard around a restored manor." },
  { kind: "video", src: VID(48394), title: "Above the Avenues", meta: "Neighborhood · Aerial", text: "Tree-lined streets, quiet by design." },
];

const stage = $("#stage"), caption = $("#caption"), bar = $("#bar");
const playIcon = `<span class="play" aria-hidden="true"><svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg></span>`;
slides.forEach((s, i) => {
  const el = document.createElement("div");
  el.className = "slide";
  el.setAttribute("role", "group");
  el.setAttribute("aria-roledescription", "slide");
  el.setAttribute("aria-label", `${i + 1} of ${slides.length}: ${s.title}`);
  el.innerHTML = s.kind === "video"
    ? `<video muted playsinline preload="metadata" ${s.poster ? `poster="${s.poster}"` : ""} src="${s.src}"></video>`
    : `<img src="${s.src}" alt="${s.title}" ${i ? 'loading="lazy"' : ""}>`;
  stage.insertBefore(el, caption);
  s.el = el;
  const t = document.createElement("button");
  t.className = "thumb"; t.setAttribute("aria-label", `Show slide ${i + 1}: ${s.title}`);
  t.innerHTML = (s.kind === "video"
    ? `<video muted playsinline preload="metadata" ${s.poster ? `poster="${s.poster}"` : ""} src="${s.src}#t=2" aria-hidden="true"></video>${playIcon}`
    : `<img src="${s.src}" alt="" loading="lazy">`);
  t.onclick = () => go(i, i > cur ? 1 : -1, true);
  $("#thumbs").appendChild(t);
});

let cur = -1, startT = 0, dur = 6500, inView = false, busy = false;
let hoverPaused = false, overlayPaused = false;
const isPaused = () => hoverPaused || overlayPaused;
function stageVideo() { return slides[cur] && slides[cur].el.querySelector("video"); }
function pauseStage(on) {
  overlayPaused = on;
  const v = stageVideo(); if (!v) return;
  if (on) v.pause(); else if (inView && !reduceMotion) v.play().catch(() => {});
}

function go(n, dir = n > cur ? 1 : -1, user = false) {
  n = (n + slides.length) % slides.length;
  if (n === cur || busy) return;
  const prev = slides[cur], next = slides[n];
  if (prev) {
    busy = true; setTimeout(() => busy = false, 1200);
    prev.el.classList.remove("active"); prev.el.classList.add("leaving");
    const pv = prev.el.querySelector("video");
    clearTimeout(prev.leaveT);
    prev.leaveT = setTimeout(() => {
      prev.el.classList.remove("leaving");
      if (pv && slides[cur] !== prev) pv.pause();
    }, 1200);
  }
  clearTimeout(next.leaveT);
  next.el.classList.remove("leaving");
  // Snap to the correct start edge before animating the wipe in
  next.el.style.transition = "none";
  next.el.classList.toggle("rev", dir < 0);
  void next.el.offsetWidth;
  next.el.style.transition = "";
  next.el.classList.add("active");
  const v = next.el.querySelector("video");
  if (v) { v.currentTime = 0; if (inView && !isPaused() && !reduceMotion) v.play().catch(() => {}); }
  dur = v ? 10000 : 6500;
  cur = n; startT = performance.now();
  caption.setAttribute("aria-live", user ? "polite" : "off");
  caption.classList.remove("show");
  setTimeout(() => {
    caption.innerHTML = `<p class="eyebrow">${next.kind === "video" ? '<span class="live">Film</span>' : ""}${next.meta}</p><h3>${next.title}</h3><p>${next.text}</p>`;
    caption.classList.add("show");
  }, prev ? 450 : 0);
  $("#counter").innerHTML = `${String(n + 1).padStart(2, "0")} <span>/ ${String(slides.length).padStart(2, "0")}</span>`;
  document.querySelectorAll(".thumb").forEach((t, i) => { t.classList.toggle("active", i === n); t.toggleAttribute("aria-current", i === n); });
}
function tick(now) {
  if (isPaused() || !inView || reduceMotion) startT += now - (tick.last || now);
  tick.last = now;
  const p = Math.min((now - startT) / dur, 1);
  bar.style.width = p * 100 + "%";
  if (p >= 1 && !busy) go(cur + 1, 1);
  requestAnimationFrame(tick);
}
$("#sPrev").onclick = () => go(cur - 1, -1, true);
$("#sNext").onclick = () => go(cur + 1, 1, true);
// Hover pause is for mouse users only; touch pointers never fire a matching leave
stage.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") hoverPaused = true; });
stage.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hoverPaused = false; });
let sx = null;
stage.addEventListener("pointerdown", e => sx = e.clientX);
stage.addEventListener("pointerup", e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, true); sx = null; });
new IntersectionObserver(([en]) => {
  inView = en.isIntersecting;
  const v = stageVideo();
  if (v) inView && !isPaused() && !reduceMotion ? v.play().catch(() => {}) : v.pause();
}, { threshold: .35 }).observe(stage);
go(0, 1); requestAnimationFrame(tick);

// Mosaic + lightbox
const tiles = [
  { kind: "image", src: "photo-1564078516393-cf04bd966897", title: "Sunset Lounge", meta: "Interior · Los Angeles", cls: "h2" },
  { kind: "image", src: "photo-1512917774080-9991f1c4c750", title: "Campoamor Residence", meta: "Costa Blanca" },
  { kind: "image", src: "photo-1705326701287-346fc37a2c86", title: "The White Salon", meta: "Interior · Paris" },
  { kind: "video", src: VID(26757), title: "Crystal & Light", meta: "Detail film", cls: "w2" },
  { kind: "video", src: VID(48394), title: "Above the Avenues", meta: "Aerial neighborhood film", cls: "w2 h2" },
  { kind: "image", src: "photo-1704040686428-7534b262d0d8", title: "Garden Room", meta: "Interior · Toronto" },
  { kind: "image", src: "photo-1748063578185-3d68121b11ff", title: "Glasshouse at Night", meta: "Kiawah Island, SC" },
  { kind: "video", src: VID(24945), title: "Edge of Town", meta: "Neighborhood film", cls: "w2" },
  { kind: "image", src: "photo-1580587771525-78b9dba3b914", title: "Monolith House", meta: "Austin, Texas" },
  { kind: "image", src: "photo-1704040686413-2c607dbd2f06", title: "Media Lounge", meta: "Interior · Toronto" },
];
$("#mosaic").innerHTML = tiles.map((t, i) => `
  <figure class="tile reveal ${t.cls || ""}" style="--d:${i % 4}" data-i="${i}" tabindex="0" role="button" aria-label="Open ${t.title}${t.kind === "video" ? " film" : ""}">
    ${t.kind === "video"
      ? `<video muted loop playsinline preload="metadata" src="${t.src}#t=1.5" aria-hidden="true"></video><span class="badge-v">Film</span>`
      : `<img src="${PHOTO(t.src)}" alt="${t.title}" loading="lazy">`}
    <figcaption><div><small>${t.meta}</small><b>${t.title}</b></div></figcaption>
  </figure>`).join("");
document.querySelectorAll("#mosaic .tile").forEach(el => {
  const v = el.querySelector("video"); if (!v || reduceMotion) return;
  el.addEventListener("mouseenter", () => v.play().catch(() => {}));
  el.addEventListener("mouseleave", () => v.pause());
});

let lbI = 0, lbSwapT, lbClearT;
const lb = $("#lb"), lbMedia = $("#lbMedia");
function lbShow(i, dir = 0) {
  clearTimeout(lbSwapT); clearTimeout(lbClearT);
  lbI = (i + tiles.length) % tiles.length;
  const t = tiles[lbI];
  const swap = () => {
    lbMedia.innerHTML = t.kind === "video"
      ? `<video src="${t.src}" ${reduceMotion ? "" : "autoplay"} loop playsinline controls muted></video>`
      : `<img src="${PHOTO(t.src)}" alt="${t.title}">`;
    $("#lbTitle").textContent = t.title;
    $("#lbMeta").textContent = `${t.meta} · ${String(lbI + 1).padStart(2, "0")} / ${tiles.length}`;
    lbMedia.className = "lb-media out " + (dir > 0 ? "r" : dir < 0 ? "l" : "");
    requestAnimationFrame(() => requestAnimationFrame(() => lbMedia.className = "lb-media"));
  };
  if (lb.classList.contains("open") && lbMedia.firstChild) {
    lbMedia.className = "lb-media out " + (dir > 0 ? "l" : "r");
    lbSwapT = setTimeout(swap, 300);
  } else swap();
}
function lbOpen(i) {
  lastFocus = document.activeElement;
  lbShow(i); lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; pauseStage(true);
  $("#lbClose").focus();
}
function lbClose() {
  clearTimeout(lbSwapT);
  lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = ""; pauseStage(false);
  const v = lbMedia.querySelector("video"); if (v) v.pause();
  lbClearT = setTimeout(() => { if (!lb.classList.contains("open")) lbMedia.innerHTML = ""; }, 500);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}
$("#mosaic").addEventListener("click", e => { const t = e.target.closest(".tile"); if (t) lbOpen(+t.dataset.i); });
$("#mosaic").addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("tile")) { e.preventDefault(); lbOpen(+e.target.dataset.i); }
});
$("#lbPrev").onclick = () => lbShow(lbI - 1, -1);
$("#lbNext").onclick = () => lbShow(lbI + 1, 1);
$("#lbClose").onclick = lbClose;
lb.addEventListener("click", e => { if (e.target.classList.contains("lb-stage")) lbClose(); });
lb.addEventListener("keydown", e => trapFocus(lb, e));
let lx = null;
lb.addEventListener("touchstart", e => lx = e.touches[0].clientX, { passive: true });
lb.addEventListener("touchend", e => { if (lx === null) return; const dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); lx = null; });
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (lb.classList.contains("open")) {
    if (e.key === "Escape") lbClose();
    if (e.key === "ArrowRight") lbShow(lbI + 1, 1);
    if (e.key === "ArrowLeft") lbShow(lbI - 1, -1);
  } else if (inView && !modal.classList.contains("open") && !isTyping(e.target)) {
    if (e.key === "ArrowRight") go(cur + 1, 1, true);
    if (e.key === "ArrowLeft") go(cur - 1, -1, true);
  }
});

// Scroll film: frame opens to full bleed, then chapters advance
const film = $("#film"), filmVid = $("#filmVid"), filmSticky = film.querySelector(".film-sticky");
const chapters = [...document.querySelectorAll(".chapter")], meters = [...document.querySelectorAll(".film-meter span")];
let filmTick = false;
function filmUpdate() {
  filmTick = false;
  const span = film.offsetHeight - filmSticky.offsetHeight;
  const p = reduceMotion ? 1 : Math.min(Math.max((scrollY - film.offsetTop) / span, 0), 1);
  const e = Math.min(p / .3, 1), ease = 1 - Math.pow(1 - e, 3);
  const s = film.style;
  s.setProperty("--cy", (1 - ease) * 16 + "%");
  s.setProperty("--cx", (1 - ease) * 22 + "%");
  s.setProperty("--r", (1 - ease) * 28 + "px");
  s.setProperty("--fs", 1.15 - .15 * ease);
  s.setProperty("--to", Math.max(1 - p / .2, 0));
  s.setProperty("--dim", Math.min(Math.max((p - .25) / .1, 0), 1));
  // Reduced motion: no scroll choreography, show the first chapter statically
  const c = reduceMotion ? 0 : p < .32 ? -1 : p < .55 ? 0 : p < .78 ? 1 : 2;
  chapters.forEach((el, i) => el.classList.toggle("on", i === c));
  meters.forEach((el, i) => el.classList.toggle("on", i <= c));
}
addEventListener("scroll", () => { if (!filmTick) { filmTick = true; requestAnimationFrame(filmUpdate); } }, { passive: true });
addEventListener("resize", filmUpdate);
new IntersectionObserver(([en]) => en.isIntersecting && !reduceMotion ? filmVid.play().catch(() => {}) : filmVid.pause()).observe(film);
filmUpdate();

// Nav + reveal
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });
$("#menuBtn").onclick = () => { const o = $("#menu").classList.toggle("open"); $("#menuBtn").setAttribute("aria-expanded", o); };
$("#menu").addEventListener("click", e => {
  if (e.target.closest("a")) { $("#menu").classList.remove("open"); $("#menuBtn").setAttribute("aria-expanded", "false"); }
});
const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
document.querySelectorAll(".reveal").forEach(el => { if (!el.closest(".hero")) io.observe(el); });

// Intro curtain, then the hero entrance (staggered via --i)
const intro = $("#intro");
const heroReveals = document.querySelectorAll(".hero .reveal");
heroReveals.forEach((el, i) => el.style.setProperty("--i", i));
const lift = () => {
  if (intro.classList.contains("done")) return;
  intro.classList.add("done");
  setTimeout(() => heroReveals.forEach(el => el.classList.add("in")), reduceMotion ? 0 : 300);
};
if (reduceMotion) lift(); else { addEventListener("load", () => setTimeout(lift, 400)); setTimeout(lift, 2600); }

render(); calc();
