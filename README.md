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

**Dark power disc:** every player gets **one dark disc** per game, dark red for red and dark
yellow for yellow. **Right-click** a column to drop it, or use the **Dark drop** button on
touch devices. Click the dark disc to use it: every opposing disc in the eight cells around
it becomes yours, the dark disc itself turns into a normal disc, and the power is gone for
the rest of the game. Using it costs a move, and it does nothing at all when no opposing
disc is around it. The two side indicators next to the board show who still holds their dark
disc. The AI plays by the same rule and spends its own disc when the position pays off.


## Tech stack

- **Angular 22** â€” standalone components, zoneless change detection, new control flow
- **Signals + NgRx Signal Store** (`@ngrx/signals`) for the reactive game state
  (`src/app/game/game.store.ts`)
- Pure, side-effect-free TypeScript game engine (`src/app/game/game-logic.ts`)
- AI: alpha-beta minimax with heuristic board evaluation (center preference, window scoring),
  plus a heuristic decision on when to arm and when to spend its own dark power disc
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

