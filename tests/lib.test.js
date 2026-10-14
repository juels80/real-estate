const test = require("node:test");
const assert = require("node:assert/strict");
const { money, num, filterListings, monthlyPayment } = require("../js/lib.js");

const listings = [
  { title: "Casa Blanca Terrace", loc: "Marbella, Spain", type: "Villa", price: 4250000, beds: 5, status: "active" },
  { title: "Villa Serena", loc: "Lake Como, Italy", type: "Estate", price: 8900000, beds: 7, status: "active" },
  { title: "Cedar Ridge", loc: "Asheville, NC", type: "Estate", price: 1950000, beds: 4, status: "pending" },
  { title: "Monolith House", loc: "Austin, Texas", type: "Villa", price: 3650000, beds: 5, status: "sold" },
  { title: "Unpriced Loft", loc: "Charleston, SC", type: "Penthouse", price: null, beds: null, status: "active" },
];
const titles = r => r.map(l => l.title);

test("money formats millions without trailing zeros", () => {
  assert.equal(money(4250000), "$4.25M");
  assert.equal(money(8900000), "$8.9M");
  assert.equal(money(5000000), "$5M");
  assert.equal(money(950000), "$950,000");
});

test("money and num handle missing values", () => {
  assert.equal(money(null), "Price on request");
  assert.equal(money(undefined), "Price on request");
  assert.equal(money(NaN), "Price on request");
  assert.equal(num(null), "—");
  assert.equal(num(11400), "11,400");
});

test("filterListings hides sold homes unless asked", () => {
  assert.ok(!titles(filterListings(listings)).includes("Monolith House"));
  assert.ok(titles(filterListings(listings, { showSold: true })).includes("Monolith House"));
});

test("filterListings keeps pending homes", () => {
  assert.ok(titles(filterListings(listings)).includes("Cedar Ridge"));
});

test("filterListings by type, location, budget and beds", () => {
  assert.deepEqual(titles(filterListings(listings, { type: "Estate" })), ["Villa Serena", "Cedar Ridge"]);
  assert.deepEqual(titles(filterListings(listings, { loc: "  como " })), ["Villa Serena"]);
  assert.deepEqual(titles(filterListings(listings, { budget: 3000000 })), ["Cedar Ridge"]);
  assert.deepEqual(titles(filterListings(listings, { beds: 6 })), ["Villa Serena"]);
});

test("listings with no price or beds drop out of budget and bedroom filters only", () => {
  assert.ok(titles(filterListings(listings)).includes("Unpriced Loft"));
  assert.ok(!titles(filterListings(listings, { budget: 10000000 })).includes("Unpriced Loft"));
  assert.ok(!titles(filterListings(listings, { beds: 3 })).includes("Unpriced Loft"));
});

test("filterListings returns an empty list when nothing matches", () => {
  assert.deepEqual(filterListings(listings, { loc: "Tokyo" }), []);
});

test("monthlyPayment matches the standard amortization formula", () => {
  // $4.25M, 25% down, 6.25%, 30 years -> loan $3,187,500
  assert.equal(Math.round(monthlyPayment(4250000, 25, 6.25, 30)), 19626);
  // $400k loan at 6% over 30 years is a textbook $2,398.20
  assert.equal(monthlyPayment(500000, 20, 6, 30).toFixed(2), "2398.20");
});

test("monthlyPayment edge cases", () => {
  assert.equal(monthlyPayment(1200000, 0, 0, 10), 10000);
  assert.equal(monthlyPayment(1000000, 100, 6, 30), 0);
});
