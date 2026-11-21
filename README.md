# Four Wins

Vier gewinnt im Browser (Angular 22, NgRx Signals) — 1 VS 1 am selben Gerät oder gegen eine KI, inklusive dunklem Power-Stein.

## Struktur

| Datei/Ordner | Zweck |
| --- | --- |
| `src/app/app.component.*` | UI: Toolbar, Modus-Auswahl, Spielfeld, Spielstand, Footer |
| `src/app/app.config.ts` | Angular-Provider (zoneless, Animations) |
| `src/app/game/game.types.ts` | Typen: Board, Player, GameMode, GameStatus |
| `src/app/game/game-logic.ts` | Reine Spiellogik: Züge, Siegerkennung, KI (Minimax) |
| `src/app/game/game.store.ts` | Spielzustand (@ngrx/signals) |
| `src/styles.css` | Angular-Material-Theme, globale Basis |
| `test/game-logic.test.ts` | Unit-Tests der Spiellogik (Vitest) |
| `test/index.html` | Übersichtsseite der Test-Reports |
| `e2e/game.spec.ts` | E2E-Tests (Playwright, mit Video) |
| `scripts/copy-test-reports.mjs` | Kopiert Test-Reports in den Pages-Build |
| `docs/` | RELEASE-NOTES.md, openapi.yaml |
| `start.sh` | Installiert Abhängigkeiten und startet den Dev-Server |

## Lokal starten

```sh
./start.sh   # oder: pnpm install && pnpm start
```

Danach http://localhost:4200 öffnen.

## Tests

```sh
pnpm unit          # Unit-Tests (Vitest) → test-report/unit/
pnpm e2e           # E2E-Tests (Playwright, Video) → test-report/e2e/
pnpm check         # beides
pnpm build:pages   # Produktiv-Build, kopiert die Reports nach dist/.../test/
```

Live-Version: https://suadin.github.io/four-wins/ (Test-Reports dort unter `test/`, im Footer verlinkt.)
