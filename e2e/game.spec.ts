import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

function dropButton(page: Page, column: number) {
  return page.getByRole('button', { name: `Drop a disc into column ${column}` });
}

async function drop(page: Page, column: number): Promise<void> {
  await dropButton(page, column).click();
}

test('[GAME-03] a disc falls into the clicked column', async ({ page }) => {
  await page.goto('/#/play/pvp');
  await drop(page, 4);
  await expect(page.locator('.column').nth(3).locator('.cell').last()).toHaveClass(/p1/);
  await expect(page.getByRole('status')).toContainText("Player 2's turn (yellow)");
});

test('[GAME-05] four in a row wins and highlights', async ({ page }) => {
  await page.goto('/#/play/pvp');
  for (const column of [1, 2, 1, 2, 1, 2, 1]) {
    await drop(page, column);
  }
  await expect(page.getByRole('status')).toContainText('Player 1 (red) wins!');
  await expect(page.locator('.cell.win')).toHaveCount(4);
  await expect(dropButton(page, 1)).toBeDisabled();
});

test('[GAME-06] a 2x2 block wins', async ({ page }) => {
  await page.goto('/#/play/pvp');
  for (const column of [1, 3, 2, 4, 1, 5, 2]) {
    await drop(page, column);
  }
  await expect(page.getByRole('status')).toContainText('Player 1 (red) wins!');
  await expect(page.getByRole('status')).toContainText('2x2 block');
  await expect(page.locator('.cell.win')).toHaveCount(4);
});

async function playIntoDarkDisc(page: Page): Promise<void> {
  await page.goto('/#/play/pvp');
  await drop(page, 1);
  await drop(page, 2);
  await dropButton(page, 3).click({ button: 'right' });
  await drop(page, 4);
}

test('[GAME-08] the dark disc converts a neighbour', async ({ page }) => {
  await playIntoDarkDisc(page);
  await expect(page.locator('.cell.dark-p1')).toHaveCount(1);
  await page.locator('.cell.dark-p1').click();
  await expect(page.locator('.cell.dark-p1')).toHaveCount(0);
  await expect(page.locator('.cell.p1')).toHaveCount(3);
  await expect(page.locator('.cell.p2')).toHaveCount(1);
});

test('[GAME-09] using the dark disc costs a move', async ({ page }) => {
  await playIntoDarkDisc(page);
  await page.locator('.cell.dark-p1').click();
  await expect(page.getByRole('status')).toContainText("Player 2's turn (yellow)");
});

test('[GAME-11] the mode switch updates the address', async ({ page }) => {
  await page.goto('/#/play/pvp');
  await page.getByRole('button', { name: 'VS AI' }).click();
  await expect(page).toHaveURL(/#\/play\/ai$/);
  await page.getByRole('button', { name: '1 VS 1' }).click();
  await expect(page).toHaveURL(/#\/play\/pvp$/);
});

test('[GAME-12] new game resets the board', async ({ page }) => {
  await page.goto('/#/play/pvp');
  await drop(page, 1);
  await drop(page, 2);
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.locator('.cell.p1, .cell.p2')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText("Player 1's turn (red)");
});
