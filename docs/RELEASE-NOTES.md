# Release notes

## 2026-10-27 — Basic Specs 1.0.2

- Pinned the public Basic Specs standard in `basics.json`, `basics.lock` and `basics/`.
- The generated `BASIC-SPECS.md` is checked against the standard and against the
  tests. The suite now has 24 E2E journeys.

## 2026-10-27 — Contract pass

- Reader lists README, SPECS, SPECS Basic, RELEASE NOTES, and API; the reader now
  opens in the main panel and leaves header and footer visible.
- Footer gained the unit and E2E icons, count plus line coverage, three-row test
  tooltips, and red `not executed` states.
- Added a Playwright suite in `e2e/`, line coverage for unit and E2E, and the named
  `pnpm metrics` command. The project uses pnpm; CI runs both suites before building
  and deploying.
- Design moved to the workspace tokens: paper, card, ink, hard shadows, dashed lines,
  Comic Sans, and OS light/dark.
- Added the documentation drift check and removed the unused Angular scaffold.

## 2026-10-26 — Dark disc and reader

- Added the one-time dark power disc, the 2x2 block win, and the in-page documentation
  reader.
- Added the first unit suite for the engine and the reader.

## 2026-10-22 — Initial game

- Angular 22, signals, NgRx Signal Store, minimax AI, and GitHub Pages deployment.
