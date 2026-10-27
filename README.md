# Four Wins (Connect Four)

## Play the game

**Live version:** **https://suadin.github.io/four-wins/**

Open the link in any modern browser (desktop or mobile) — no installation or account needed.
The game runs entirely in your browser. Every push to `main` is deployed automatically
via GitHub Actions → GitHub Pages.

## Game modes

| Mode       | Description                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| **1 VS 1** | Two players on the same device. Red starts; players alternate by clicking a column.     |
| **VS AI**  | You play **red** against a minimax AI (alpha-beta pruning, depth 6) playing **yellow**. |

**Rules:** The first player to connect **four discs** in a row — horizontally, vertically or
diagonally — wins. Winning discs are highlighted. Click **New game** to restart
(switching modes also resets the board).

**Bonus win:** a filled **2x2 block** of your own discs also wins. A line of four is
reported first when a single move achieves both.

**Dark power disc:** every player gets **one dark disc** per game, dark red for red and dark
yellow for yellow. **Right-click** a column to drop it, or use the **Dark drop** button on
touch devices. Click the dark disc to use it: **one** opposing disc from the eight cells around
it becomes yours, namely the one whose conversion is worth the most. The click costs a move,
the dark disc itself turns into a normal disc, and the power is gone for the rest of the game.
It does nothing at all when no opposing disc is around it. The two side indicators next to the
board show who still holds their dark disc. The AI plays by the same rule and spends its own
disc when the position pays off.

## Documentation and links

The footer carries four items: **README**, **source**, **unit**, and **E2E**, with one icon
each. Only README opens the reader; source opens
[github.com/suadin/four-wins](https://github.com/suadin/four-wins). Unit and E2E show their
test count and line coverage separately. A missing run is red and says `not executed`; a run
without coverage says `coverage not measured`. Test tooltips are the wide variant and
have three rows: measured date and time, duration, and time per test. A missing run's
tooltip is the single word `not executed`.

The reader opens in the main panel and leaves header and footer visible. It lists **README**,
**SPECS**, **SPECS Basic**, **RELEASE NOTES**, and **API** as tabs; only README has a footer
item. Every document is split at level-two headings, except RELEASE NOTES and API, which stay
one continuous page (release notes newest first). Sections are line icons, not text chips;
each icon has its own symbol, the tooltip gives the heading, and the active icon is yellow and
rotated by `-2deg`. Relative Markdown links between documents open in the reader.

Addresses are stable:

- `#/play/pvp` and `#/play/ai` select the mode; opening one starts a fresh game.
- `#/docs/readme/tests-and-metrics` restores the document and section after a reload.
- An unknown address returns to the start.

The board of a running game is **not** part of the address. That is the only unlinkable
state; the mode and the documentation are linkable.

## Tech stack

- **Angular 22** — standalone components, zoneless change detection, new control flow
- **Signals + NgRx Signal Store** (`@ngrx/signals`) for the reactive game state
  (`src/app/game/game.store.ts`)
- Pure, side-effect-free TypeScript game engine (`src/app/game/game-logic.ts`)
- AI: alpha-beta minimax with heuristic board evaluation (center preference, window scoring),
  plus a heuristic decision on when to arm and when to spend its own dark power disc
- Playwright for the browser suite; Node's test runner for the unit suite
- CI/CD: GitHub Actions runs the tests before building and deploying to GitHub Pages
  (`.github/workflows/deploy.yml`)

## Run locally

The project uses pnpm (`packageManager` in `package.json`):

```bash
pnpm install
pnpm start          # ng serve → http://localhost:4200
```

Production build:

```bash
pnpm build          # output: dist/four-wins/browser
pnpm build:pages    # production build with the /four-wins/ base href
```

## Tests and metrics

```bash
pnpm test           # 29 unit tests, with line coverage
pnpm test:e2e       # 24 Playwright tests in e2e/
pnpm metrics        # run both, write public/test-metrics.json
pnpm check          # metrics, production build, documentation drift check
```

The unit suite uses Node's own runner and type stripping (Node 22.6 or newer). Its coverage is
Node's built-in line coverage. The browser suite runs in Chromium through Playwright and
collects V8 coverage with `page.coverage`; `v8-to-istanbul` maps it back to `src/app` line
coverage. Both numbers are real measurements, not placeholders.

The page is static, so it cannot start a test run itself. `pnpm metrics` is the named command;
the footer reads the last `public/test-metrics.json`. Commit that file after a change so the
deployed page shows the current numbers.

The unit suite covers the engine, the reader helpers, and the metric formatting. The E2E suite
covers the game moves, the dark disc, the mode switch, the footer, the reader, deep links,
layout, colour scheme, focus, and dates. Every test names the rule it protects with a bracket
tag; both SPECS pages list the concrete names.

## API documentation

An **OpenAPI 3.1** definition describing the game engine's API surface (create game, make a
move, read state) is maintained in [`docs/openapi.yaml`](docs/openapi.yaml). The app itself is
client-side only; the spec documents the domain model for reuse in a future backend or
multiplayer service. The reader's **API** tab shows the same file without leaving the game.

## Design

The interface follows [Basic Specs](https://github.com/suadin/basic-specs) and uses the shared tokens: paper, card, ink,
muted, hard ink shadows, dashed ink lines, Comic Sans, and the OS light/dark scheme. Yellow
marks selection, red warns, green marks good and links, purple marks the special dark-disc
action. The two players keep red and yellow discs because those are the game's content, not UI
status colours. Browser zoom scales the layout; header and footer stay visible while the main
panel scrolls.

## Project structure

```
src/app/
├── app.component.*        # Header, board UI, mode switch, status, footer
├── app.config.ts          # Zoneless change detection
├── metrics.ts             # Footer labels and three-row tooltips
├── docs/
│   ├── docs.component.*   # Reader in the main panel
│   └── reader.ts          # Documents, Markdown pages, icons, routes, renderer
├── game/
│   ├── game.types.ts      # Board, Player, GameMode, GameStatus types
│   ├── game-logic.ts      # Pure engine: drop, win detection, minimax AI
│   └── game.store.ts      # NgRx Signal Store (state, computed, methods)
└── ui/
    └── tooltip.directive.ts
test/
├── game-logic.test.ts     # Engine checks
├── reader.test.ts         # Reader pages, icons, routes, Markdown
├── metrics.test.ts        # Footer labels, tooltips, dates
├── register.mjs           # Loads the TypeScript resolver
└── ts-resolver.mjs        # Resolves Angular's extensionless imports
e2e/
├── fixtures.ts            # Starts and stores V8 coverage per test
├── game.spec.ts           # Game moves, wins, dark disc, mode, reset
├── reporter.ts            # Writes e2e-results.json
└── site.spec.ts           # Footer, reader, links, layout, design, dates
scripts/
├── coverage.mjs           # V8 coverage → src/app line coverage
├── check-docs.mjs         # Documentation drift check
└── metrics.mjs            # Writes public/test-metrics.json
docs/
├── APP-SPECS.md           # Four Wins rules and test names
├── BASIC-SPECS.md         # Reusable app rules and test names
├── RELEASE-NOTES.md       # Continuous release history
└── openapi.yaml           # OpenAPI 3.1 documentation of the game API
.github/workflows/
└── deploy.yml             # Tests, build, deploy to GitHub Pages
```

## Contract notes

Four Wins is a single-board game: there is no list, no pager, no calendar, and no private data.
The board is bounded, so there is nothing to page. The reader's API tab is an extra document,
not a fifth footer item. The contract says both “not measured” and “not executed”; the Tests
section is more specific, so a missing run says `not executed`, while a run without coverage
says `coverage not measured`, never `0`.
