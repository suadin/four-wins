# Four Wins (Connect Four)

## ▶ Play the game

**Live version:** **https://suadin.github.io/four-wins/**

Open the link in any modern browser (desktop or mobile) — no installation or account needed.
The game runs entirely in your browser. Every push to `main` is deployed automatically
via GitHub Actions → GitHub Pages.

## Game modes

| Mode      | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| **1 VS 1** | Two players on the same device. Red starts; players alternate by clicking a column.             |
| **VS AI**  | You play **red** against a minimax AI (alpha-beta pruning, depth 6) playing **yellow**.          |

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

- The footer opens this README and the OpenAPI document inside the page, one page per
  level-two heading, with a row of line icons for the sections. `#/docs/readme` and `#/docs/api` are stable addresses; a reload restores
  the same document and section.
- The game mode is part of the address: `#/play/pvp` and `#/play/ai`. Opening one starts a
  fresh game in that mode, so a shared link lands in the right mode.
- The footer also carries the source repository and the last unit-test measurement. A missing
  measurement reads “not measured”, never zero.

The interface follows the workspace contract where it applies: README and source in one
centred footer, deep links, quiet colours, one name for one thing. Three rules do not apply to
a single-board game: there is no list to page, no calendar, and no E2E suite yet. The static
page cannot start a test run itself, so the unit number is the last measurement written by
`npm run metrics`. Coverage is not measured yet, and the board of a running game is not in the
address — only the mode and the documentation are.

## Tech stack

- **Angular 22** — standalone components, zoneless change detection, new control flow
- **Signals + NgRx Signal Store** (`@ngrx/signals`) for the reactive game state
  (`src/app/game/game.store.ts`)
- Pure, side-effect-free TypeScript game engine (`src/app/game/game-logic.ts`)
- AI: alpha-beta minimax with heuristic board evaluation (center preference, window scoring),
  plus a heuristic decision on when to arm and when to spend its own dark power disc
- CI/CD: GitHub Actions workflow deploying to GitHub Pages (`.github/workflows/deploy.yml`)

## Run locally

```bash
npm install
npm start          # ng serve → http://localhost:4200
```

Production build:

```bash
npm run build      # output: dist/four-wins/browser
```

## Tests and metrics

The engine and the documentation reader have a unit suite that needs no browser and no test
framework beyond Node's own runner:

```bash
npm test           # 21 tests for the engine and the reader
npm run metrics    # run them again and write public/test-metrics.json
```

The footer reads `public/test-metrics.json`; commit it after a change so the page shows the
current count. The runner uses Node's type stripping, so Node 22.6 or newer is required.
There is no E2E suite and no coverage measurement yet, and the footer says so rather than
showing zero.

## API documentation

An **OpenAPI 3.1** definition describing the game engine's API surface (create game, make a
move, read state) is maintained in [`docs/openapi.yaml`](docs/openapi.yaml). The app itself is
client-side only; the spec documents the domain model for reuse in a future backend or
multiplayer service. The footer’s **API** tab shows the same file without leaving the game.

## Project structure

```
src/app/
├── app.component.*        # Board UI, mode switch, status display, footer
├── app.config.ts          # Zoneless change detection
├── docs/
│   ├── docs.component.*   # In-page README and API reader, icon sections
│   └── reader.ts          # Markdown pages, icons, routes, renderer
└── game/
    ├── game.types.ts      # Board, Player, GameMode, GameStatus types
    ├── game-logic.ts      # Pure engine: drop, win detection, minimax AI
    └── game.store.ts      # NgRx Signal Store (state, computed, methods)
test/
├── game-logic.test.ts     # Node test runner checks for the engine
├── reader.test.ts         # Reader pages, icons, routes, Markdown
├── register.mjs           # Loads the TypeScript resolver
└── ts-resolver.mjs        # Resolves Angular's extensionless imports
scripts/
└── metrics.mjs            # Writes public/test-metrics.json
docs/
└── openapi.yaml           # OpenAPI 3.1 documentation of the game API
.github/workflows/
└── deploy.yml             # Auto-deploy to GitHub Pages on push to main
```
