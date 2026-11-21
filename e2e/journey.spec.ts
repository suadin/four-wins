import { expect, test } from "@playwright/test";

// One video for the whole happy path: open the game, drop discs, win with
// four in a row and see the highlight. The screencast records a single file,
// draws the mouse cursor, a marker on every click and a chapter title first.

test.describe.configure({ mode: "serial" });

test("four-wins happy path", async ({ page }, testInfo) => {
  const videoPath = testInfo.outputPath("journey.webm");
  await page.screencast.start({ path: videoPath, size: { width: 1280, height: 900 } });
  await page.screencast.showActions({
    cursor: "pointer",
    duration: 700,
    style: {
      point: "width: 18px; height: 18px; border-radius: 50%; background: #dc3545; box-shadow: 0 0 0 5px rgba(220,53,69,.25)",
      highlight: "outline: 3px solid #d6336c; background: rgba(214,51,108,.10); border-radius: 8px",
      title: "font-size: 14px; background: #212529; color: #fff; padding: 3px 9px; border-radius: 5px",
    },
  });

  const chapter = (title: string, description: string) =>
    page.screencast.showChapter(title, { description, duration: 2200 });
  const beat = () => page.waitForTimeout(1600);
  const drop = (column: number) =>
    page.getByRole("button", { name: `Drop a disc into column ${column}` }).click();

  // 1 · open the game
  chapter("1 · Spiel öffnen", "Zwei Spieler, ein leeres Brett.");
  await beat();
  await page.goto("/#/play/pvp");
  await expect(page.locator(".column")).toHaveCount(7);

  // 2 · drop discs
  chapter("2 · Steine fallen lassen", "Abwechselnd wird je ein Stein geworfen.");
  await beat();
  for (const column of [1, 2, 1, 2, 1, 2]) {
    await drop(column);
    await page.waitForTimeout(250);
  }

  // 3 · win with four in a row
  chapter("3 · Vier in einer Reihe", "Der letzte Stein macht vier — und gewinnt.");
  await beat();
  await drop(1);
  await expect(page.getByRole("status")).toContainText("Player 1 (red) wins!");
  await expect(page.locator(".cell.win")).toHaveCount(4);

  // 4 · highlight
  chapter("4 · Gewinn hervorgehoben", "Die vier Siegerfelder leuchten.");
  await beat();

  await page.screencast.stop();
  await testInfo.attach("journey", { path: videoPath, contentType: "video/webm" });
});
