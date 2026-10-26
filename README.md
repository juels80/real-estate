# Meridian Estates

A concept website for a fictional luxury real estate brand, designed and built by [Xperience](https://www.xperiencestudio.org) as a portfolio piece. It shows how a listings site can feel editorial and cinematic while staying fast, accessible and honest about what it is.

Meridian Estates is not a real company. Every listing, price and figure on the site is made up.

## What's on the page

- **Hero:** a short looping film of a coastal home on desktop. Phones get a still photo instead and never download the video.
- **Listings:** eight sample residences you can filter by type, location, budget and bedrooms, and sort by price, bedrooms or size. Hearts save homes to a shortlist that is remembered in your browser. The address bar mirrors your filters and open listing, so any view can be shared by link. Homes can be marked "Under offer" or "Sold", and sold homes are hidden unless you tick *Include sold*. Hovering a card that has film plays a preview, and each listing opens in a detail view with a viewing request form. The form is a demo and sends nothing.
- **Gallery:** a slideshow of film and photos with wipe transitions, plus a photo and film grid that opens into a fullscreen viewer.
- **Scroll film:** a section where a framed video opens out to full screen as you scroll, followed by three short captions.
- **Mortgage calculator:** an estimate of principal and interest, with a clear disclaimer that it is not a loan offer.

## Built with

Plain HTML, CSS and JavaScript. There is no framework, build step or backend. Fonts come from Google Fonts. Everything else is in this repository.

## Run it locally

Open `index.html` in a browser. To serve it over HTTP instead, run any static server from the project folder, for example:

```sh
npx serve .
```

## Tests

The pure logic (price formatting, listing filters and mortgage math) lives in `js/lib.js` and is covered by tests written with Node's built-in test runner. With Node 22 or newer:

```sh
npm test
```

There are no dependencies to install.

## Project structure

```
index.html          Page markup
css/style.css       All styles
js/lib.js           Pure helpers shared by the page and the tests
js/main.js          Listings, gallery, scroll film, calculator and page behavior
tests/              node:test tests for js/lib.js
assets/images/      Photos (full size plus 800px versions for phones) and video poster frames
assets/videos/      Six clips, each 12 seconds or less, about 11 MB in total
```

## Accessibility and performance

- The listing view and fullscreen viewer keep keyboard focus inside while open and return it when closed. Every control has a visible focus style.
- The hero, slideshow and scroll film each have a pause button. The slideshow also pauses while you hover over it or move through it with the keyboard.
- With *reduce motion* turned on, nothing plays automatically and the scroll animations are skipped.
- Photos come in two sizes and load only as needed. Videos are trimmed, compressed and given still frames, so nothing shows as a blank box before playback.

## Credits

Photography from [Unsplash](https://unsplash.com) and film from [Mixkit](https://mixkit.co), both used under their free licenses. Design and development by [Xperience](https://www.xperiencestudio.org).
