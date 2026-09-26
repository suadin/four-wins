# Four Wins (Connect Four)

## â–¶ Play the game

**Live version:** **https://suadin.github.io/four-wins/**

Open the link in any modern browser (desktop or mobile) â€” no installation or account needed.
The game runs entirely in your browser. Every push to `main` is deployed automatically
via GitHub Actions â†’ GitHub Pages.

## Game modes

| Mode      | Description                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------- |
| **1 VS 1** | Two players on the same device. Red starts; players alternate by clicking a column.             |
| **VS AI**  | You play **red** against a minimax AI (alpha-beta pruning, depth 6) playing **yellow**.          |

**Rules:** The first player to connect **four discs** in a row â€” horizontally, vertically or
diagonally â€” wins. Winning discs are highlighted. Click **New game** to restart
(switching modes also resets the board).

**Bonus win:** a filled **2x2 block** of your own discs also wins. A line of four is
reported first when a single move achieves both.


## Tech stack

- **Angular 22** â€” standalone components, zoneless change detection, new control flow
- **Signals + NgRx Signal Store** (`@ngrx/signals`) for the reactive game state
  (`src/app/game/game.store.ts`)
- Pure, side-effect-free TypeScript game engine (`src/app/game/game-logic.ts`)
- AI: alpha-beta minimax with heuristic board evaluation (center preference, window scoring)
- CI/CD: GitHub Actions workflow deploying to GitHub Pages (`.github/workflows/deploy.yml`)

## Run locally

```bash
npm install
npm start          # ng serve â†’ http://localhost:4200
```

Production build:

```bash
npm run build      # output: dist/four-wins/browser
```

## API documentation

An **OpenAPI 3.1** definition describing the game engine's API surface (create game, make a
move, read state) is maintained in [`docs/openapi.yaml`](docs/openapi.yaml). The app itself is
client-side only; the spec documents the domain model for reuse in a future backend or
multiplayer service.

## Project structure

```
src/app/
â”œâ”€â”€ app.component.*        # Board UI, mode switch, status display
â”œâ”€â”€ app.config.ts          # Zoneless change detection
â””â”€â”€ game/
    â”œâ”€â”€ game.types.ts      # Board, Player, GameMode, GameStatus types
    â”œâ”€â”€ game-logic.ts      # Pure engine: drop, win detection, minimax AI
    â””â”€â”€ game.store.ts      # NgRx Signal Store (state, computed, methods)
docs/
â””â”€â”€ openapi.yaml           # OpenAPI 3.1 documentation of the game API
.github/workflows/
â””â”€â”€ deploy.yml             # Auto-deploy to GitHub Pages on push to main
```

