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

  // criteria: { type: "all" | "Villa" | ..., loc: string, budget: number (0 = no limit), beds: number, showSold: boolean }
  function filterListings(listings, criteria = {}) {
    const { type = "all", loc = "", budget = 0, beds = 0, showSold = false } = criteria;
    const q = loc.trim().toLowerCase();
    return listings.filter(l =>
      (type === "all" || l.type === type) &&
      (!q || `${l.loc} ${l.title}`.toLowerCase().includes(q)) &&
      (!budget || (isNum(l.price) && l.price <= budget)) &&
      (!beds || (isNum(l.beds) && l.beds >= beds)) &&
      (showSold || l.status !== "sold"));
  }

  // Monthly principal and interest on a fixed-rate loan
  function monthlyPayment(price, downPct, ratePct, years) {
    const loan = price * (1 - downPct / 100), n = years * 12, m = ratePct / 100 / 12;
    if (loan <= 0 || n <= 0) return 0;
    if (m === 0) return loan / n;
    return loan * m / (1 - Math.pow(1 + m, -n));
  }

  const api = { money, num, filterListings, monthlyPayment };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Meridian = api;
})(this);
