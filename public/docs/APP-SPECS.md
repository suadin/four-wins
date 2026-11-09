# App specs — Four Wins

## Board and rules

These rules are specific to Four Wins and extend [BASIC SPECS](BASIC-SPECS.md).
[README](../README.md) explains setup, operation, and deployment.

- The board has six rows and seven columns. It starts empty.
- Red starts. Players alternate, and the mode decides whether the second player is a
  human or the AI.
- A disc falls to the lowest free row of its column. The previous board is never
  changed in place.
- A full column refuses another disc.
- Four discs of one player in a row, a column, or a diagonal win. Winning cells are
  highlighted.
- A filled 2x2 block of one player also wins. When one move creates a line and a
  block, the line is reported first.
- A full board without a winner is a draw.

## Dark disc

- Every player has one dark disc per game: dark red for red, dark yellow for yellow.
- A player drops it by right-clicking a column, or by arming **Dark drop** and then
  clicking a column on a device without a right mouse button.
- Clicking the dark disc turns exactly one opposing disc in the eight surrounding
  cells into the player's disc. The converted disc is the one worth the most.
- Using the dark disc costs a move, turns the dark disc into a normal disc, and spends
  the power for the rest of the game. With no opposing neighbour it does nothing.
- The side indicators next to the board show which player still holds a dark disc.
- The AI follows the same rules and spends its dark disc when the position pays off.

## Modes and reset

- **1 VS 1** and **VS AI** are the only mode names. The address carries the mode as
  `#/play/pvp` or `#/play/ai`.
- Switching mode starts a fresh game in that mode. **New game** starts a fresh game
  and keeps the current mode.
- The board of a running game is not part of the address. README names this
  unlinkable state.

## Documentation and address

- The footer opens the reader. README, SPECS, BASIC SPECS, and API are tabs; README,
  the app version and the Basic Specs version are the footer items.
- SPECS begins with the one-page Changelog from `RELEASE-NOTES.md`, followed by the app
  rules. API stays one continuous page.
- Sections are a row of line icons. Each icon has its own symbol, its tooltip gives
  the heading, and the active icon is yellow and rotated by `-2deg`.
- Relative Markdown links between documents open in the reader.
- `#/docs/<document>/<section>` is stable across a reload. An unknown address returns
  to the start.

## Design exception

The two players keep red and yellow discs because those are the game's content, not
UI status colours. The interface itself follows the workspace colour conventions:
yellow marks selection, red warns, green marks good and links, purple marks the
special dark-disc action.

## Automated tests

Unit tests:

- `[GAME-01] an empty board has the agreed shape`
- `[GAME-02] the opponent swaps players`
- `[GAME-03] a disc falls to the lowest free row and the old board stays`
- `[GAME-04] a full column refuses another disc`
- `[GAME-05] four discs in a row are a line win`
- `[GAME-05] four discs in a column are a line win`
- `[GAME-05] four discs on a diagonal are a line win`
- `[GAME-06] a filled 2x2 block wins as well`
- `[GAME-07] a full board is a draw`
- `[GAME-08] a conversion turns one disc and leaves the rest alone`
- `[GAME-08] a conversion picks an opposing neighbour`
- `[GAME-10] the best move takes an immediate win`
- `[GAME-10] the AI action is a legal column for an empty board`

E2E tests:

- `[GAME-03] a disc falls into the clicked column`
- `[GAME-05] four in a row wins and highlights`
- `[GAME-06] a 2x2 block wins`
- `[GAME-08] the dark disc converts a neighbour`
- `[GAME-09] using the dark disc costs a move`
- `[GAME-11] the mode switch updates the address`
- `[GAME-12] new game resets the board`
