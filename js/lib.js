// Pure helpers shared by the page (window.Meridian) and the Node tests (module.exports).
(function (root) {
  const isNum = n => typeof n === "number" && isFinite(n);

  // "$4.25M", "$8.9M", "$950,000"; missing prices read "Price on request"
  function money(n) {
    if (!isNum(n)) return "Price on request";
    return n >= 1e6 ? `$${+(n / 1e6).toFixed(2)}M` : `$${Math.round(n).toLocaleString("en-US")}`;
  }

  // Grouped number, or an em dash when the value is missing
  function num(n) {
    return isNum(n) ? n.toLocaleString("en-US") : "—";
  }

  // "Casa Blanca Terrace" -> "casa-blanca-terrace"
  function slugify(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // criteria: { type: "all" | "Villa" | ..., loc: string, budget: number (0 = no limit), beds: number, showSold: boolean,
  //             saved: Set of slugs (when given, only those homes are kept, sold or not) }
  function filterListings(listings, criteria = {}) {
    const { type = "all", loc = "", budget = 0, beds = 0, showSold = false, saved = null } = criteria;
    const q = loc.trim().toLowerCase();
    return listings.filter(l =>
      (type === "all" || l.type === type) &&
      (!q || `${l.loc} ${l.title}`.toLowerCase().includes(q)) &&
      (!budget || (isNum(l.price) && l.price <= budget)) &&
      (!beds || (isNum(l.beds) && l.beds >= beds)) &&
      (showSold || saved || l.status !== "sold") &&
      (!saved || saved.has(slugify(l.title))));
  }

  // Returns a sorted copy. Homes with no price/beds/size always sort last.
  const SORTS = {
    "price-asc": ["price", 1], "price-desc": ["price", -1], "beds-desc": ["beds", -1], "size-desc": ["sqft", -1],
  };
  function sortListings(listings, by = "featured") {
    const out = listings.slice(), rule = SORTS[by];
    if (!rule) return out;
    const [key, dir] = rule;
    return out.sort((a, b) => {
      const av = a[key], bv = b[key], am = !isNum(av), bm = !isNum(bv);
      if (am || bm) return am - bm;
      return (av - bv) * dir;
    });
  }

  // Filter state <-> URL query string, so a search can be shared. Defaults are left out.
  const DEFAULTS = { type: "all", loc: "", budget: 0, beds: 0, showSold: false, saved: false, sort: "featured" };
  function stateToQuery(state) {
    const p = new URLSearchParams();
    for (const k in DEFAULTS) {
      const v = state[k];
      if (v === undefined || v === DEFAULTS[k] || v === "") continue;
      p.set(k, v === true ? "1" : String(v));
    }
    return p.toString();
  }
  function queryToState(query) {
    const p = new URLSearchParams(query), s = { ...DEFAULTS };
    if (p.has("type")) s.type = p.get("type");
    if (p.has("loc")) s.loc = p.get("loc").slice(0, 80);
    if (p.has("budget")) s.budget = Math.max(0, +p.get("budget") || 0);
    if (p.has("beds")) s.beds = Math.max(0, +p.get("beds") || 0);
    if (p.has("sort") && (p.get("sort") in SORTS)) s.sort = p.get("sort");
    s.showSold = p.get("showSold") === "1";
    s.saved = p.get("saved") === "1";
    return s;
  }

  // Monthly principal and interest on a fixed-rate loan
  function monthlyPayment(price, downPct, ratePct, years) {
    const loan = price * (1 - downPct / 100), n = years * 12, m = ratePct / 100 / 12;
    if (loan <= 0 || n <= 0) return 0;
    if (m === 0) return loan / n;
    return loan * m / (1 - Math.pow(1 + m, -n));
  }

  const api = { money, num, slugify, filterListings, sortListings, stateToQuery, queryToState, monthlyPayment };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Meridian = api;
})(this);
