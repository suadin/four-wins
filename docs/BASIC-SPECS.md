# Basic specs

These are the reusable rules for a small, static web app in this workspace. Four Wins
applies them directly; the game-specific rules are in [APP SPECS](APP-SPECS.md). The
shared workspace contract is the source for both. [README](../README.md) explains
setup, operation, and deployment.

## Footer

- One centred footer carries README, source, unit, and E2E, separated by `|`. Each
  item has its own icon: README a book, source chevrons, unit a clipboard with a
  check mark, E2E a browser with a play triangle.
- Only README is a documentation item. It opens the reader. Source opens the
  repository.
- Unit and E2E show their count and line coverage separately. A failure count appears
  only when at least one test failed, and then in red. A missing run is red and says
  `not executed`; a run without coverage says `coverage not measured`, never `0`.
- The footer stays on one line at desktop width and wraps cleanly when narrow.
- The footer is fixed and always visible. The main panel scrolls.

## Reader

- The footer opens the reader in the main panel. It never covers or hides the header
  or footer.
- The reader lists every document as a tab: README, SPECS, SPECS Basic, RELEASE
  NOTES, and the project's API document. No document gets its own footer item.
- One page per level-two heading. RELEASE NOTES stays one continuous page, newest
  first. API stays one continuous page.
- Sections are a row of line icons, not text chips. Each icon has its own symbol, its
  tooltip gives the heading, and the active icon is yellow and rotated by `-2deg`.
  Within one document no icon repeats.
- Relative Markdown links between documents open in the reader.
- The root README is the single source. Copied deploy files are checked against their
  source by a drift test.

## Links

- Every view has a stable hash: `#/play/pvp`, `#/play/ai`,
  `#/docs/readme/tests`, `#/docs/app-specs/board-and-rules`. A reload restores the
  view; an unknown address returns to the start.
- Search text and mode are in the address when they define the view. Unlinkable state
  is named in README.
- A list, when present, pages in fixed windows with arrows and lazy loading. A bounded
  view says there is nothing to page. Four Wins has neither a list nor a pager, and
  README names that.

## Tests and coverage

- Every app has unit tests and a Playwright E2E suite in `e2e/`. The footer shows both
  counts separately.
- Coverage is line coverage, measured with a real library: Node's built-in test
  coverage for the TypeScript unit suite, Playwright `page.coverage` for browser JS.
  It is never a placeholder.
- Tests are always executed: a static page runs them by the named command
  `pnpm metrics` and reads the result.
- A missing run is red and says `not executed`. A run without coverage shows the count
  and `coverage not measured`; a missing percentage is a defect, not a display state.
- Every automated test names the rule it protects with a bracket tag such as
  `[BASIC-FOOTER-02]`. Each SPECS page lists the concrete test names under
  “Automated tests”.
- A run's test tooltip always shows three rows: `Measured <date> <time>`,
  `Duration <s> s`, `Per test <s> s`. A missing value is `—`. A missing run's
  tooltip is the single word `not executed`. Test tooltips are the wide variant.
- Bug → fix code. Change a test only for a changed requirement.

## Layout and design

- The visual reference is `repos/diary/web/style.css`. Tokens may be renamed; the
  effect stays: paper, card, ink, muted, hard ink shadows, dashed ink lines.
- Light and dark follow the operating system. Yellow marks selection and emphasis,
  red warns, green marks good and links, purple marks a special action. Yellow is a
  fill, not a second accent.
- Type is `"Comic Sans MS","Trebuchet MS",sans-serif`; code is
  `ui-monospace,monospace`. Headings are 800–900, body 400–500. Eyebrows are
  `.72rem`/900/`.12em` uppercase. Dates, times, counts, and pagers use tabular
  numerals.
- The root stays at `100%`. Sizes use `rem`, widths use `clamp()`, so browser zoom
  scales the page and the layout fits at 80–200%.
- Header and footer are fixed. The header is one row: icon, `1.5rem`/900 title, small
  catch phrase, actions right. Both header and footer use a dashed ink line.
- Cards use `2px solid ink`, radius `.625–1.5rem`, hard shadow `4px 4px 0 ink`;
  large panels may use `9px`. Focus is `3px solid green` with offset `2px`.
- Buttons use `2px solid ink`, radius `.75rem`, shadow `4px 4px 0 ink`, and on hover
  `translate(2px,2px)` with a `2px` shadow. Icon sections are `2.5rem` squares.
- Tooltips are ink bubbles with paper text, a rotated square arrow, and
  `white-space: pre-line`; hover and focus only. They never replace `aria-label`.
- Cursors: pointer for clickable, default for plain text, `help` for a tooltip
  without an action. Tooltip plus clickable uses the pointer.
- All motion is behind `prefers-reduced-motion`. Use one name for one thing and short
  sentences.

## Dates

Dates use `yyyy-mm-dd` and times use `hh24:mi`.

## Data and access

Four Wins is a static page. It reads only; it has no token, no account, no private
data, and no browser mutation.

## Automated tests

Unit tests:

- `[BASIC-READER-02] a heading becomes a slug`
- `[BASIC-READER-02] a document is split at level-two headings`
- `[BASIC-READER-02] repeated headings get their own slug`
- `[BASIC-READER-02] release notes stay one continuous page`
- `[BASIC-READER-03] sections pick an icon and fall back to a dot`
- `[BASIC-READER-03] section icons are unique within one document`
- `[BASIC-READER-04] html is escaped before markup is added`
- `[BASIC-READER-04] markdown renders lists, tables and code`
- `[BASIC-READER-04] relative markdown links map to reader documents`
- `[BASIC-LINKS-01] routes survive a reload`
- `[BASIC-LINKS-01] address helpers agree with the parser`
- `[BASIC-LINKS-01] unknown routes return to the start`
- `[BASIC-FOOTER-02] metric labels show count and coverage`
- `[BASIC-FOOTER-03] measurement tooltips have three rows`
- `[BASIC-FOOTER-03] a missing run is not executed`
- `[BASIC-DATES-01] measured dates use yyyy-mm-dd hh:mm`

E2E tests:

- `[BASIC-FOOTER-01] footer shows README, source, unit and E2E icons`
- `[BASIC-FOOTER-02] footer shows counts and coverage`
- `[BASIC-FOOTER-03] test tooltip has three rows`
- `[BASIC-READER-01] reader lists every document`
- `[BASIC-READER-02] release notes stay one page`
- `[BASIC-READER-03] sections are icons with tooltips`
- `[BASIC-READER-04] a relative markdown link opens the reader`
- `[BASIC-LINKS-01] a reload restores the docs section`
- `[BASIC-LINKS-01] an unknown address returns to the start`
- `[BASIC-LAYOUT-01] header and footer stay visible while the main panel scrolls`
- `[BASIC-LAYOUT-01] the reader does not cover header or footer`
- `[BASIC-LAYOUT-02] header is one row with actions on the right`
- `[BASIC-DESIGN-01] the page follows the OS colour scheme`
- `[BASIC-DESIGN-02] focus uses the green outline`
- `[BASIC-DATES-01] the footer measurement uses yyyy-mm-dd hh:mm`
