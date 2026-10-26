const { money, num, slugify, filterListings, sortListings, stateToQuery, queryToState, monthlyPayment } = window.Meridian;
const IMG = id => `assets/images/${id}.jpg`;
const IMG_SM = id => `assets/images/${id}-800.jpg`;
const SRCSET = id => `${IMG_SM(id)} 800w, ${IMG(id)} 1800w`;
const VID = id => `assets/videos/${id}.mp4`;
// First-frame stills exported from each clip (so nothing renders as a black box before playback)
const POSTER = id => `assets/images/poster-${id}.jpg`;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Small screens and data-saver connections get posters instead of autoplaying background film
const lite = matchMedia("(max-width: 720px)").matches || !!(navigator.connection && navigator.connection.saveData);
const PLACEHOLDER = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#1a1917"/><text x="400" y="300" fill="#9a9284" font-family="Georgia,serif" font-size="28" text-anchor="middle">Photo unavailable</text></svg>`);

// Any image that fails to load is swapped for a neutral placeholder
document.addEventListener("error", e => {
  const img = e.target;
  if (img.tagName !== "IMG" || img.dataset.fallback) return;
  img.dataset.fallback = "1"; img.removeAttribute("srcset"); img.src = PLACEHOLDER;
}, true);

// status: "active" | "pending" | "sold"
const listings = [
  { title: "Casa Blanca Terrace", loc: "Marbella, Spain", type: "Villa", status: "active", price: 4250000, beds: 5, baths: 6, sqft: 6200, acres: 0.8, img: "photo-1613490493576-7fde63acd811", desc: "A study in light and limestone. Floor-to-ceiling glazing opens onto an infinity terrace overlooking the Mediterranean." },
  { title: "The Linear House", loc: "Scottsdale, Arizona", type: "Villa", status: "active", price: 3150000, beds: 4, baths: 5, sqft: 4800, acres: 1.2, img: "photo-1706808849780-7a04fbac83ef", desc: "Long horizontal planes, a resort-scale pool, and desert views framed from every room." },
  { title: "Campoamor Residence", loc: "Costa Blanca, Spain", type: "Coastal", status: "active", video: 30357, price: 2650000, beds: 4, baths: 4, sqft: 4100, acres: 0.5, img: "photo-1512917774080-9991f1c4c750", desc: "Minutes from the coast and golf course, with a sunlit courtyard pool and generous indoor-outdoor living." },
  { title: "Villa Serena", loc: "Lake Como, Italy", type: "Estate", status: "active", video: 8603, price: 8900000, beds: 7, baths: 8, sqft: 11400, acres: 4.5, img: "photo-1600596542815-ffad4c1539a9", desc: "A restored Mediterranean estate set among terraced gardens and orchards, with a private guest house and boat access." },
  { title: "Glasshouse No. 9", loc: "Kiawah Island, SC", type: "Coastal", status: "active", video: 27543, price: 5400000, beds: 5, baths: 5, sqft: 5600, acres: 1, img: "photo-1748063578185-3d68121b11ff", desc: "After dark it glows like a lantern. A warm-lit modern home steps from the dunes." },
  { title: "Cedar Ridge", loc: "Asheville, NC", type: "Estate", status: "pending", price: 1950000, beds: 4, baths: 3, sqft: 3900, acres: 6, img: "photo-1591474200742-8e512e6f98f8", desc: "Timber, stone, and quiet. A mountain retreat on six private acres with long ridge views." },
  { title: "Azure Sky Penthouse", loc: "Miami Beach, FL", type: "Penthouse", status: "active", video: 26757, price: 7250000, beds: 4, baths: 5, sqft: 4600, acres: 0, img: "photo-1670589953882-b94c9cb380f5", desc: "A full-floor residence with a rooftop pool, private elevator, crystal-lit salon, and unobstructed ocean horizons." },
  { title: "Monolith House", loc: "Austin, Texas", type: "Villa", status: "sold", price: 3650000, beds: 5, baths: 5, sqft: 5200, acres: 0.9, img: "photo-1580587771525-78b9dba3b914", desc: "Clean geometry in white render and warm wood, with a landscaped garden designed for long evenings." },
];
listings.forEach(l => { l.slug = slugify(l.title); });
const STATUS_LABEL = { pending: "Under offer", sold: "Sold" };

const $ = s => document.querySelector(s);
const isTyping = t => t.closest && t.closest("input, select, textarea, [contenteditable]");
// The shortlist is remembered between visits; storage can be blocked, so every access is guarded
const FAV_KEY = "meridian:shortlist";
const known = new Set(listings.map(l => l.slug));
const storedFavs = (() => {
  try { const v = JSON.parse(localStorage.getItem(FAV_KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
})();
const favs = new Set(storedFavs.filter(x => known.has(x)));
const saveFavs = () => { try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs])); } catch {} };
if (favs.size !== storedFavs.length) saveFavs();
let chip = "all";
let openSlug = null;

// Focus handling shared by the listing modal and the gallery lightbox
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, video[controls], [tabindex]:not([tabindex="-1"])';
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

// The page's filter controls as one state object (same shape the URL uses)
function readState() {
  return {
    type: chip !== "all" ? chip : $("#qType").value, loc: $("#qLoc").value, budget: +$("#qBudget").value, beds: +$("#qBeds").value,
    showSold: $("#qSold").checked, saved: $("#savedChip").getAttribute("aria-pressed") === "true", sort: $("#qSort").value,
  };
}
// Keep the address bar in step with the filters (and the open listing) so any view can be shared
function syncUrl() {
  const q = new URLSearchParams(stateToQuery(readState()));
  if (openSlug) q.set("home", openSlug);
  const qs = q.toString();
  try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch {}
}
function updateSaved() { $("#savedChip").textContent = `Saved (${favs.size})`; }
function render() {
  const st = readState();
  const items = sortListings(filterListings(listings, { ...st, saved: st.saved ? favs : null }), st.sort);
  updateSaved(); syncUrl();
  const shortlistEmpty = st.saved && !favs.size;
  $("#count").textContent = shortlistEmpty ? "Your shortlist is empty. Tap the heart on any residence to save it." : `${items.length} of ${listings.length} residences`;
  $("#grid").innerHTML = items.length ? items.map(l => {
    const i = listings.indexOf(l), on = favs.has(l.slug), st = STATUS_LABEL[l.status];
    return `<article class="card${l.status === "sold" ? " is-sold" : ""}" data-i="${i}">
      <div class="card-img"><img src="${IMG(l.img)}" srcset="${SRCSET(l.img)}" sizes="(max-width: 720px) 100vw, (max-width: 1024px) 50vw, 400px" alt="${l.title}" loading="lazy">${l.video ? `<video muted loop playsinline preload="none" poster="${IMG_SM(l.img)}" src="${VID(l.video)}" aria-hidden="true"></video><span class="vtag">Film</span>` : ""}<span class="tag">${l.type}</span>${st ? `<span class="status status-${l.status}">${st}</span>` : ""}
        <button class="fav ${on ? "on" : ""}" data-fav="${l.slug}" aria-pressed="${on}" aria-label="Save ${l.title} to shortlist">${favIcon(on)}</button>
      </div>
      <div class="card-body"><div class="price">${money(l.price)}</div><h3><button class="card-link" type="button">${l.title}</button></h3><div class="loc">${l.loc}</div>
        <div class="specs"><span><b>${num(l.beds)}</b> Beds</span><span><b>${num(l.baths)}</b> Baths</span><span><b>${num(l.sqft)}</b> Sq Ft</span></div>
      </div></article>`;
  }).join("") : `<div class="empty" aria-hidden="true">${shortlistEmpty ? "Your shortlist is empty. Tap the heart on any residence to save it." : "No residences match those criteria. Try widening your search."}</div>`;
  document.querySelectorAll("#grid .card").forEach(card => {
    const v = card.querySelector("video"); if (!v || reduceMotion) return;
    card.addEventListener("mouseenter", () => { card.classList.add("vplay"); v.play().catch(() => {}); });
    card.addEventListener("mouseleave", () => { card.classList.remove("vplay"); v.pause(); });
  });
}

$("#filters").addEventListener("click", e => {
  const b = e.target.closest(".chip[data-f]"); if (!b) return;
  document.querySelectorAll(".chip[data-f]").forEach(c => { c.classList.toggle("active", c === b); c.setAttribute("aria-pressed", c === b); });
  chip = b.dataset.f; $("#qType").value = "all"; render();
});
$("#qSold").addEventListener("change", render);
$("#qSort").addEventListener("change", render);
$("#savedChip").addEventListener("click", e => {
  const b = e.currentTarget, on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", on); b.classList.toggle("active", on); render();
});
// Share the current search (or the open listing) as a link
async function copyLink(label) {
  syncUrl();
  try { await navigator.clipboard.writeText(location.href); toast(`Link to ${label} copied`); }
  catch { toast("Copy the address from your browser's address bar to share this."); }
}
$("#shareBtn").addEventListener("click", () => copyLink("this search"));
$("#search").addEventListener("submit", e => {
  e.preventDefault(); chip = "all";
  $("#savedChip").setAttribute("aria-pressed", "false"); $("#savedChip").classList.remove("active");
  const t = $("#qType").value;
  document.querySelectorAll(".chip[data-f]").forEach(c => { c.classList.toggle("active", c.dataset.f === t); c.setAttribute("aria-pressed", c.dataset.f === t); });
  render(); $("#listings").scrollIntoView();
});

$("#grid").addEventListener("click", e => {
  const f = e.target.closest("[data-fav]");
  if (f) {
    toggleFav(f.dataset.fav);
    return;
  }
  const c = e.target.closest(".card"); if (c) openModal(+c.dataset.i, c.querySelector(".card-link"));
});

function toggleFav(slug) {
  const on = !favs.has(slug);
  on ? favs.add(slug) : favs.delete(slug);
  saveFavs();
  // On the shortlist view, un-saving should drop the card, so redraw; otherwise just flip the heart
  if (readState().saved) {
    const idx = [...document.querySelectorAll("#grid .card")].findIndex(c => c.querySelector(`[data-fav="${slug}"]`));
    render();
    if (!modal.classList.contains("open")) {
      const hearts = document.querySelectorAll("#grid .fav");
      (hearts[Math.min(idx, hearts.length - 1)] || $("#savedChip")).focus();
    }
  } else {
    const f = document.querySelector(`[data-fav="${slug}"]`);
    if (f) { f.classList.toggle("on", on); f.setAttribute("aria-pressed", on); f.innerHTML = favIcon(on); }
    updateSaved();
  }
  syncModalFav();
  toast(on ? "Saved to your shortlist" : "Removed from shortlist");
}

const modal = $("#modal");
function syncModalFav() {
  const b = $("#mFav"), on = !!openSlug && favs.has(openSlug);
  b.setAttribute("aria-pressed", on); b.textContent = on ? "Saved ♥" : "Save to shortlist";
}
function openModal(i, opener) {
  const l = listings[i];
  openSlug = l.slug;
  const mi = $("#mImg"), mv = $("#mVid");
  delete mi.dataset.fallback;
  mi.srcset = SRCSET(l.img); mi.sizes = "(max-width: 1024px) 100vw, 600px"; mi.src = IMG(l.img); mi.alt = l.title;
  mi.hidden = !!l.video; mv.hidden = !l.video;
  if (l.video) {
    mv.poster = IMG(l.img); mv.src = VID(l.video); mv.setAttribute("aria-label", `Film of ${l.title}`);
    if (!reduceMotion) mv.play().catch(() => {});
  }
  const st = STATUS_LABEL[l.status];
  $("#mType").textContent = st ? `${l.type} · ${st}` : l.type;
  $("#mTitle").textContent = l.title; $("#mLoc").textContent = l.loc;
  $("#mPrice").textContent = money(l.price); $("#mDesc").textContent = l.desc;
  const ppsf = $("#mPpsf");
  ppsf.textContent = l.price && l.sqft ? `$${Math.round(l.price / l.sqft).toLocaleString("en-US")} per sq ft` : "";
  ppsf.hidden = !ppsf.textContent;
  $("#mCalc").hidden = !l.price || l.status === "sold";
  syncModalFav();
  // Up to three other homes of the same type, nearest in price first
  const sim = listings.filter(x => x !== l && x.status !== "sold" && x.type === l.type)
    .sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price)).slice(0, 3);
  $("#similar").hidden = !sim.length;
  $("#similarList").innerHTML = sim.map(x => `<button type="button" data-open="${x.slug}">${x.title}<span>${money(x.price)}</span></button>`).join("");
  $("#mStats").innerHTML = `<div><b>${num(l.beds)}</b>Beds</div><div><b>${num(l.baths)}</b>Baths</div><div><b>${num(l.sqft)}</b>Sq Ft</div><div><b>${l.acres ? num(l.acres) : "—"}</b>Acres</div>`;
  // Sold homes can't be toured; everything else gets the viewing form, tagged with the listing
  $("#tourForm").hidden = l.status === "sold";
  $("#soldNote").hidden = l.status !== "sold";
  $("#tourListing").value = l.title;
  lastFocus = opener || document.activeElement;
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  pauseStage(true);
  $("#mClose").focus();
  syncUrl();
}
function closeModal() {
  if (!modal.classList.contains("open")) return;
  $("#mVid").pause(); modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  pauseStage(false);
  const slug = openSlug;
  openSlug = null; syncUrl();
  let back = lastFocus;
  if (!back || !back.isConnected || back === document.body) {
    // The opener was redrawn away (Saved view) or the page opened straight onto a listing
    back = slug && document.querySelector(`[data-fav="${slug}"]`)?.closest(".card")?.querySelector(".card-link");
    if (!back) { back = $("#listings"); back.tabIndex = -1; }
  }
  back.focus({ preventScroll: true });
}
$("#mClose").onclick = closeModal;
$("#mFav").onclick = () => openSlug && toggleFav(openSlug);
$("#mShare").onclick = () => copyLink("this residence");
// Send this home's price to the mortgage calculator
$("#mCalc").onclick = () => {
  const l = listings.find(x => x.slug === openSlug), range = $("#price");
  if (!l || !l.price) return;
  range.value = Math.min(+range.max, Math.max(+range.min, Math.round(l.price / +range.step) * +range.step));
  calc(); closeModal();
  range.focus({ preventScroll: true });
  $("#calculator").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  const used = +range.value;
  toast(used === l.price ? `Calculator set to ${l.title} (${money(l.price)})` : `Calculator set to ${money(used)}, the closest it goes to ${l.title} (${money(l.price)})`);
};
// "Similar residences" swaps the open listing in place
$("#similarList").addEventListener("click", e => {
  const b = e.target.closest("[data-open]"); if (!b) return;
  openModal(listings.findIndex(x => x.slug === b.dataset.open), lastFocus);
});
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
modal.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); else trapFocus(modal, e); });
// This is a concept site: the form never sends anything, and says so
$("#tourForm").addEventListener("submit", e => { e.preventDefault(); e.target.reset(); closeModal(); toast("Demo only: nothing was sent. In a live build this would reach an advisor."); });

let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3200); }

// Mortgage calculator
function calc() {
  const P = +$("#price").value, d = +$("#down").value, r = +$("#rate").value, y = +$("#term").value;
  const out = {
    price: "$" + P.toLocaleString("en-US"),
    down: `${d}% · $${Math.round(P * d / 100).toLocaleString("en-US")}`,
    rate: r.toFixed(2) + "%",
    term: y + " years",
  };
  $("#oPrice").textContent = out.price; $("#oDown").textContent = out.down;
  $("#oRate").textContent = out.rate; $("#oTerm").textContent = out.term;
  for (const id in out) $("#" + id).setAttribute("aria-valuetext", out[id]);
  $("#monthly").textContent = "$" + Math.round(monthlyPayment(P, d, r, y)).toLocaleString("en-US");
}
["price", "down", "rate", "term"].forEach(id => $("#" + id).addEventListener("input", calc));

// Play/pause toggle shared by the hero, the slideshow and the scroll film (WCAG 2.2.2)
function setToggle(btn, playing, what) {
  btn.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${what}`);
  btn.classList.toggle("is-paused", !playing);
}

// Hero video: plays on large screens only, never with reduced motion
const heroVideo = $("#heroVideo"), heroToggle = $("#heroToggle");
// Phones show a still photo (CSS) and never load the film or its poster
const phone = matchMedia("(max-width: 720px)").matches;
if (!phone) heroVideo.poster = POSTER("27543-lg");
let heroPlaying = !reduceMotion && !lite;
function syncHero() {
  if (heroPlaying) { heroVideo.preload = "auto"; heroVideo.play().catch(() => {}); } else heroVideo.pause();
  setToggle(heroToggle, heroPlaying, "background video");
}
heroToggle.onclick = () => { heroPlaying = !heroPlaying; syncHero(); };
syncHero();

// Gallery. Film captions name the listing they show so footage is never passed off as another home.
const slides = [
  { kind: "video", src: VID(27543), poster: POSTER(27543), title: "Glasshouse No. 9", meta: "Kiawah Island, SC", text: "Steps from the dunes, open to the tide." },
  { kind: "image", img: "photo-1600596542815-ffad4c1539a9", title: "Villa Serena", meta: "Lake Como, Italy", text: "Terraced gardens and a century of quiet." },
  { kind: "video", src: VID(30357), poster: POSTER(30357), title: "Campoamor Residence", meta: "Costa Blanca, Spain · Aerial", text: "The coastline, the golf course, and the short walk between them." },
  { kind: "image", img: "photo-1758957701419-2c6e266f7988", title: "Interior Study", meta: "Concept interior", text: "Raw concrete, live-edge oak, and soft north light." },
  { kind: "video", src: VID(8603), poster: POSTER(8603), title: "Villa Serena, from above", meta: "Lake Como, Italy · Aerial", text: "The orchards and terraces that surround the house." },
  { kind: "video", src: VID(48394), poster: POSTER(48394), title: "Above the Avenues", meta: "Neighborhood · Aerial", text: "Tree-lined streets, quiet by design." },
];

const stage = $("#stage"), caption = $("#caption"), bar = $("#bar"), stageToggle = $("#sPlay");
const playIcon = `<span class="play" aria-hidden="true"><svg viewBox="0 0 10 10"><path d="M2 1l7 4-7 4z"/></svg></span>`;
slides.forEach((s, i) => {
  const el = document.createElement("div");
  el.className = "slide";
  el.setAttribute("role", "group");
  el.setAttribute("aria-roledescription", "slide");
  el.setAttribute("aria-label", `${i + 1} of ${slides.length}: ${s.title}`);
  el.innerHTML = s.kind === "video"
    ? `<video muted playsinline preload="${lite ? "none" : "metadata"}" ${s.poster ? `poster="${s.poster}"` : ""} src="${s.src}"></video>`
    : `<img src="${IMG(s.img)}" srcset="${SRCSET(s.img)}" sizes="(max-width: 1240px) 100vw, 1240px" alt="${s.title}" ${i ? 'loading="lazy"' : ""}>`;
  stage.insertBefore(el, caption);
  s.el = el;
  const t = document.createElement("button");
  t.className = "thumb"; t.setAttribute("aria-label", `Show slide ${i + 1}: ${s.title}`);
  t.innerHTML = s.kind === "video"
    ? (s.poster
      ? `<img src="${s.poster}" alt="" loading="lazy">`
      : `<video muted playsinline preload="metadata" src="${s.src}#t=2" aria-hidden="true"></video>`) + playIcon
    : `<img src="${IMG_SM(s.img)}" alt="" loading="lazy">`;
  t.onclick = () => go(i, i > cur ? 1 : -1, true);
  $("#thumbs").appendChild(t);
});

let cur = -1, elapsed = 0, dur = 6500, inView = false, busy = false;
let hoverPaused = false, focusPaused = false, overlayPaused = false, userPaused = reduceMotion;
const isPaused = () => userPaused || hoverPaused || focusPaused || overlayPaused;
function stageVideo() { return slides[cur] && slides[cur].el.querySelector("video"); }
function syncStageVideo() {
  const v = stageVideo(); if (!v) return;
  if (inView && !isPaused()) v.play().catch(() => {}); else v.pause();
}
function pauseStage(on) { overlayPaused = on; syncStageVideo(); }

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
  dur = v ? 10000 : 6500;
  cur = n; elapsed = 0;
  if (v) { v.currentTime = 0; syncStageVideo(); }
  caption.setAttribute("aria-live", user ? "polite" : "off");
  caption.classList.remove("show");
  setTimeout(() => {
    caption.innerHTML = `<p class="eyebrow">${next.kind === "video" ? '<span class="live">Film</span>' : ""}${next.meta}</p><h3>${next.title}</h3><p>${next.text}</p>`;
    caption.classList.add("show");
  }, prev ? 450 : 0);
  $("#counter").innerHTML = `${String(n + 1).padStart(2, "0")} <span>/ ${String(slides.length).padStart(2, "0")}</span>`;
  document.querySelectorAll(".thumb").forEach((t, i) => { t.classList.toggle("active", i === n); t.toggleAttribute("aria-current", i === n); });
}

// Autoplay clock: runs only while the stage is on screen, so nothing ticks in the background
let rafId = null, lastT = 0;
function tick(now) {
  if (!inView) { rafId = null; return; }
  if (!isPaused()) elapsed += now - lastT;
  lastT = now;
  const p = Math.min(elapsed / dur, 1);
  bar.style.width = p * 100 + "%";
  if (p >= 1 && !busy) go(cur + 1, 1);
  rafId = requestAnimationFrame(tick);
}
function startTick() { if (rafId === null) { lastT = performance.now(); rafId = requestAnimationFrame(tick); } }

$("#sPrev").onclick = () => go(cur - 1, -1, true);
$("#sNext").onclick = () => go(cur + 1, 1, true);
stageToggle.onclick = () => { userPaused = !userPaused; stage.classList.toggle("is-paused", userPaused); setToggle(stageToggle, !userPaused, "slideshow"); syncStageVideo(); };
setToggle(stageToggle, !userPaused, "slideshow");
stage.classList.toggle("is-paused", userPaused);
// Hover pause is for mouse users only; touch pointers never fire a matching leave
stage.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") { hoverPaused = true; syncStageVideo(); } });
stage.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { hoverPaused = false; syncStageVideo(); } });
// Keyboard users get the same courtesy: no slide changes while focus is inside the gallery
const gallery = $("#gallery-controls");
gallery.addEventListener("focusin", e => { if (e.target.matches(":focus-visible")) { focusPaused = true; syncStageVideo(); } });
gallery.addEventListener("focusout", e => { if (!gallery.contains(e.relatedTarget)) { focusPaused = false; syncStageVideo(); } });
gallery.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1, 1, true); }
  if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1, -1, true); }
});
let sx = null;
stage.addEventListener("pointerdown", e => sx = e.clientX);
stage.addEventListener("pointerup", e => { if (sx === null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, true); sx = null; });
new IntersectionObserver(([en]) => {
  inView = en.isIntersecting;
  syncStageVideo();
  if (inView) startTick();
}, { threshold: .35 }).observe(stage);
go(0, 1);

// Mosaic + lightbox
const tiles = [
  { kind: "image", img: "photo-1564078516393-cf04bd966897", title: "Sunset Lounge", meta: "Concept interior", cls: "h2" },
  { kind: "image", img: "photo-1512917774080-9991f1c4c750", title: "Campoamor Residence", meta: "Costa Blanca, Spain" },
  { kind: "image", img: "photo-1705326701287-346fc37a2c86", title: "The White Salon", meta: "Concept interior" },
  { kind: "video", src: VID(26757), poster: POSTER(26757), title: "Azure Sky Penthouse", meta: "Detail film · Miami Beach", cls: "w2" },
  { kind: "video", src: VID(48394), poster: POSTER(48394), title: "Above the Avenues", meta: "Neighborhood film", cls: "w2 h2" },
  { kind: "image", img: "photo-1704040686428-7534b262d0d8", title: "Garden Room", meta: "Concept interior" },
  { kind: "image", img: "photo-1748063578185-3d68121b11ff", title: "Glasshouse No. 9", meta: "Kiawah Island, SC" },
  { kind: "video", src: VID(24945), poster: POSTER(24945), title: "Edge of Town", meta: "Neighborhood film", cls: "w2" },
  { kind: "image", img: "photo-1580587771525-78b9dba3b914", title: "Monolith House", meta: "Austin, Texas · Sold" },
  { kind: "image", img: "photo-1704040686413-2c607dbd2f06", title: "Media Lounge", meta: "Concept interior" },
];
$("#mosaic").innerHTML = tiles.map((t, i) => `
  <figure class="tile reveal ${t.cls || ""}" style="--d:${i % 4}" data-i="${i}" tabindex="0" role="button" aria-label="Open ${t.title}${t.kind === "video" ? " film" : ""}">
    ${t.kind === "video"
      ? `<video muted loop playsinline preload="none" poster="${t.poster}" src="${t.src}" aria-hidden="true"></video><span class="badge-v">Film</span>`
      : `<img src="${IMG(t.img)}" srcset="${SRCSET(t.img)}" sizes="(max-width: 1024px) 50vw, 600px" alt="${t.title}" loading="lazy">`}
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
    const hadFocus = lbMedia.contains(document.activeElement);
    lbMedia.innerHTML = t.kind === "video"
      ? `<video src="${t.src}" ${reduceMotion ? "" : "autoplay"} loop playsinline controls muted aria-label="${t.title}"></video>`
      : `<img src="${IMG(t.img)}" alt="${t.title}">`;
    if (hadFocus) $("#lbClose").focus();
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
lb.addEventListener("keydown", e => {
  if (e.key === "Escape") lbClose();
  else if (e.key === "ArrowRight") lbShow(lbI + 1, 1);
  else if (e.key === "ArrowLeft") lbShow(lbI - 1, -1);
  else trapFocus(lb, e);
});
let lx = null;
lb.addEventListener("touchstart", e => lx = e.touches[0].clientX, { passive: true });
lb.addEventListener("touchend", e => { if (lx === null) return; const dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 50) lbShow(lbI + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); lx = null; });

// Scroll film: frame opens to full bleed, then chapters advance
const film = $("#film"), filmVid = $("#filmVid"), filmSticky = film.querySelector(".film-sticky"), filmToggle = $("#filmToggle");
const chapters = [...document.querySelectorAll(".chapter")], meters = [...document.querySelectorAll(".film-meter span")];
let filmTick = false, filmInView = false, filmPlaying = !reduceMotion;
function syncFilm() {
  if (filmInView && filmPlaying) filmVid.play().catch(() => {}); else filmVid.pause();
  setToggle(filmToggle, filmPlaying, "film");
}
filmToggle.onclick = () => { filmPlaying = !filmPlaying; syncFilm(); };
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
new IntersectionObserver(([en]) => { filmInView = en.isIntersecting; syncFilm(); }).observe(film);
filmUpdate(); syncFilm();

// Nav + reveal
const nav = $("#nav"), menu = $("#menu"), menuBtn = $("#menuBtn");
const closeMenu = () => { menu.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); };
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 40), { passive: true });
menuBtn.onclick = () => { const o = menu.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); };
menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && menu.classList.contains("open")) { closeMenu(); menuBtn.focus(); }
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

// Restore filters and any open listing from the address bar, then draw
(function restore() {
  const q = new URLSearchParams(location.search), st = queryToState(q);
  chip = st.type !== "all" && [...document.querySelectorAll(".chip[data-f]")].some(c => c.dataset.f === st.type) ? st.type : "all";
  document.querySelectorAll(".chip[data-f]").forEach(c => { c.classList.toggle("active", c.dataset.f === chip); c.setAttribute("aria-pressed", c.dataset.f === chip); });
  $("#qLoc").value = st.loc; $("#qSold").checked = st.showSold; $("#qSort").value = st.sort;
  for (const [id, v] of [["#qBudget", st.budget], ["#qBeds", st.beds]]) { $(id).value = v; if ($(id).value !== String(v)) $(id).value = "0"; }
  $("#savedChip").setAttribute("aria-pressed", st.saved); $("#savedChip").classList.toggle("active", st.saved);
  const home = listings.findIndex(l => l.slug === q.get("home"));
  render(); calc();
  if (home >= 0) openModal(home, null);
})();
