# Journal Tools

A collection of frame plugin based tools that can be used to check for, and resolving problems that might arise with a page's journal.

The current tools include:
* Scanning the origin wiki for pages that have problems.
* Scanning an single wiki page for problems.
* An initial tool to compress a page's journal - this will condense edit actions that occur within a short while of each other.

## To Do:

Not in any particular order:

* [ ] Finalise the page names, and content.
* [ ] Add some reporting of the causes of a revision error.
* [ ] Add a second compression tool that reduces journal size to a greater ammount.

## Chrome/Safari iframe drops

Chrome and Safari currently drop `dragenter/dragover/drop` events when the source and target live inside the same wiki lineup column. We now ship a `data-jm-dnd-relay="auto"` script that places a transparent overlay over the Journalmatic frame, captures the drop, and forwards the payload to the iframe via `postMessage`. The relay defaults to Chrome/Safari and stays off for Firefox where native drops still work (see Chromium [40822630](https://issues.chromium.org/issues/40822630), [41443847](https://issues.chromium.org/issues/41443847), [41436540](https://issues.chromium.org/issues/41436540) and the [MDN DnD caveats](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)).

If you need to disable the overlay for troubleshooting, edit the page JSON and set `data-jm-dnd-relay="off"` on the helper script tag (or remove the helper entirely). Each drop zone now also exposes a "Send to Journalmatic" button so users can paste a page URL when drag-and-drop is blocked.

## Automated tests

* `npm test` runs the regression that exercises the drop payload parser without a browser.
* `npm run test:e2e` (requires `@playwright/test` + browsers via `npx playwright install --with-deps`) drives a relay harness that simulates a lineup → iframe drop across both Chromium and WebKit (Safari) so we can guard against regressions in the overlay shim.
