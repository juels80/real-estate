# Meridian Estates: a cinematic listings site that stays fast, accessible and honest

A concept luxury real estate site that feels editorial and cinematic without giving up performance, accessibility or honesty about what is real.

## Role & tools
**Role:** Design and front-end development, solo, at Xperience. [Add: timeline]
**Stack:** Plain HTML, CSS and JavaScript, with no framework, build step or backend. Node's built-in test runner covers the logic. Photos come from Unsplash and film from Mixkit.

## The problem
Luxury property sites tend to fail in one of two ways. Some are static grids of photos. Others are heavy video pages that stutter on phones, autoplay without consent and hide the facts a buyer needs. I wanted to see whether a site could feel like a film and still respect the people using it, including people on small screens, on data-saver connections, with motion sensitivity or using only a keyboard. [Add: any research or competitor review behind this framing]

## Process
Each decision below started from a constraint.

- **Phones get a still, not the video.** The hero film plays only on large screens. At 720px and below, or when the browser reports data-saver, visitors get a photo and the video is never downloaded. The reason: cinematic should not cost a mobile user their data plan.
- **Every clip is trimmed and given a poster frame.** The six clips run 12 seconds or less and total about 11 MB. Stills mean nothing renders as a black box before playback.
- **Motion is always optional.** Every autoplaying element (hero, slideshow, scroll film) has a pause button. With *reduce motion* on, nothing autoplays and the scroll animations are skipped.
- **Honesty over polish.** The brand is fictional, and the site says so. The viewing form sends nothing and tells you that. The mortgage calculator carries a "not a loan offer" disclaimer. Film captions name the listing they show, so footage is never passed off as another home.
- **Sold homes are hidden by default.** A tick-box brings them back, so stale inventory doesn't clutter search results.

[Add: any sketches, wireframes or early directions that changed]

## The solution
- **Hero:** a looping coastal film on desktop. [Image: hero on desktop vs. phone]
- **Listings:** eight sample residences, filterable by type, location, budget and bedrooms. Cards can be marked "Under offer" or "Sold", and hovering a card with film plays a preview. Each opens a detail view with a viewing request form. [Image: filtered grid and listing detail]
- **Gallery:** a slideshow with wipe transitions, plus a photo and film grid that opens a fullscreen viewer. [Image: slideshow]
- **Scroll film:** a framed video that opens to full bleed as you scroll, followed by three captions. [Image: scroll film in two states]
- **Mortgage calculator:** a principal-and-interest estimate that updates live.

## Front-end details
- **Testable logic.** Price formatting, listing filters and the payment formula live in `js/lib.js` as pure functions. They are shared by the page and by `node:test` tests, so there are no dependencies to install. The formula handles edge cases such as a 0% rate and a loan of zero.
- **Focus management.** The listing view and fullscreen viewer trap keyboard focus while open and return it to the opener on close. Every control has a visible focus style.
- **Considerate autoplay.** The slideshow's clock runs only while the stage is on screen. It pauses on mouse hover, while keyboard focus is inside the gallery, and while any overlay is open. Hover-pause is limited to mouse pointers, because touch never fires a matching leave event.
- **Screen-reader care.** Slides are labelled "3 of 6: title". Captions announce politely only after a user-triggered change, not on autoplay. The calculator sliders expose readable `aria-valuetext`.
- **Resilience.** Photos ship in two sizes with `srcset` and load lazily. Any image that fails is swapped for a neutral placeholder.
- **Scroll film.** Scroll updates are batched with `requestAnimationFrame`, and the video plays only while its section is visible.

## Outcome & reflection
It works as a proof that a visually ambitious site can be lean: no dependencies, about 11 MB of film in total, and a documented accessibility baseline. The commit history shows a review pass that tightened honesty, compliance, accessibility and performance, and I'd keep that review habit on future projects.

What I'd do next: add real data and a backend to the form, test with assistive technology and real users, and measure performance rather than assert it. [Add: Lighthouse or Core Web Vitals numbers] [Add: assistive-tech and usability test results] [Add: live site link]

---

## Gaps to fill
- `[Add: timeline]`
- `[Add: any research or competitor review behind this framing]`
- `[Add: any sketches, wireframes or early directions that changed]`
- `[Add: Lighthouse or Core Web Vitals numbers]`
- `[Add: assistive-tech and usability test results]`
- `[Add: live site link]`
- Screenshots: hero desktop vs. phone, filtered grid and detail, slideshow, scroll film in two states.
- Visual-design story: type, palette and layout decisions, which need `index.html` and `css/style.css`.
- The fair-housing and compliance review mentioned in the commit history. I could not confirm what it covered, so I left it out of the draft.

## Done: case study draft, 6 gaps to fill
