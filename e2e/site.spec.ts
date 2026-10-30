import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './fixtures';

// The standard moves; the suite must not. The versions come from the app's own runtime
// metadata, and the "newer" case is derived from that major.
const RUNTIME = JSON.parse(readFileSync(join(process.cwd(), 'public/basic-specs.json'), 'utf8'));
const STANDARD = RUNTIME.standard;
const [MAJOR, MINOR] = STANDARD.split('.').map(Number);
const NEXT_MINOR = `${MAJOR}.${MINOR + 1}.0`;
const NEXT_MAJOR = `${MAJOR + 1}.0.0`;

import type { Page } from '@playwright/test';

const metrics = {
  unit: {
    tests: 29,
    failures: 0,
    coverage: 95.3,
    measuredAt: '2026-10-27T18:09',
    durationSeconds: 12.3,
    perTest: 0.424,
  },
  e2e: {
    tests: 22,
    failures: 0,
    coverage: 88.1,
    measuredAt: '2026-10-27T18:10',
    durationSeconds: 31.2,
    perTest: 1.418,
  },
};

async function mockMetrics(page: Page): Promise<void> {
  await page.route('**/test-metrics.json', (route) => route.fulfill({ json: metrics }));
}

async function mockVersion(page: Page, latest: string | null = STANDARD): Promise<void> {
  if (latest === null) {
    await page.route('**/version.json', (route) => route.abort());
    return;
  }
  await page.route('**/version.json', (route) =>
    route.fulfill({
      json: { version: latest, releasedAt: '2026-10-27', url: '#' },
      headers: { 'access-control-allow-origin': '*' },
    }),
  );
}

async function openReader(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'README' }).click();
  await expect(page.locator('.doc-tab')).toHaveCount(4);
}

test('[BASIC-FOOTER-01] footer shows six items in order', async ({ page }) => {
  await mockVersion(page);
  await page.goto('/');
  const items = page.locator('.footer-item');
  await expect(items).toHaveCount(6);
  const icons = await page
    .locator('.footer-items svg, .footer-items img')
    .evaluateAll((nodes) => nodes.map((node) => node.outerHTML));
  expect(icons).toHaveLength(6);
  expect(new Set(icons).size).toBe(icons.length);
  const footer = page.locator('.footer');
  await expect(footer).toContainText('README');
  await expect(footer).toContainText('1.0.0');
  await expect(footer).toContainText(STANDARD);
  await expect(footer).toContainText('source');
  await expect(footer).toContainText('Unit');
  await expect(footer).toContainText('E2E');
});

test('[BASIC-FOOTER-02] footer shows counts and coverage', async ({ page }) => {
  await mockMetrics(page);
  await page.goto('/');
  await expect(page.locator('.footer')).toContainText('Unit 29 · 95.3 %');
  await expect(page.locator('.footer')).toContainText('E2E 22 · 88.1 %');
});

test('[BASIC-FOOTER-03] test tooltip has three rows', async ({ page }) => {
  await mockMetrics(page);
  await page.goto('/');
  const unit = page.locator('.footer-item[data-tip-wide]').first();
  await unit.hover();
  const tip = page.locator('.tooltip');
  await expect(tip).toBeVisible();
  await expect(tip).toHaveClass(/wide/);
  const lines = (await tip.innerText()).split('\n');
  expect(lines).toHaveLength(3);
  expect(lines[0]).toContain('Measured 2026-10-27 18:09');
});

test('[BASIC-READER-01] reader lists every document', async ({ page }) => {
  await openReader(page);
  const tabs = (await page.locator('.doc-tab').allTextContents()).map((text) => text.trim());
  expect(tabs).toEqual(['README', 'SPECS', 'BASIC SPECS', 'API']);
});

test('[BASIC-READER-05] SPECS starts with one Changelog page', async ({ page }) => {
  await openReader(page);
  await page.getByRole('tab', { name: 'SPECS', exact: true }).click();
  await expect(page.locator('.doc-tab.active')).toHaveText('SPECS');
  await expect(page.locator('.doc-section-title')).toHaveText('Changelog');
  await expect(page.locator('.doc-section').first()).toHaveAttribute('data-tip', 'Changelog');
  await expect(page.getByRole('tab', { name: 'RELEASE NOTES' })).toHaveCount(0);
  await expect(page.locator('.doc-body')).toContainText('2026-10-27');
  await expect(page.locator('.doc-body .doc-tests')).toBeVisible();
});

test('[BASIC-READER-03] sections are icons with tooltips', async ({ page }) => {
  await openReader(page);
  const sections = page.locator('.doc-section');
  const count = await sections.count();
  expect(count).toBeGreaterThan(1);
  const tips = await sections.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-tip')),
  );
  const icons = await sections.evaluateAll((nodes) => nodes.map((node) => node.innerHTML));
  expect(new Set(tips).size).toBe(count);
  expect(new Set(icons).size).toBe(count);
  await expect(sections.first()).toHaveClass(/active/);
  const background = await sections
    .first()
    .evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(background).toBe('rgb(255, 212, 92)');
  await sections.first().hover();
  await expect(page.locator('.tooltip')).toHaveText(tips[0] ?? '');
});

test('[BASIC-READER-04] a relative markdown link opens the reader', async ({ page }) => {
  await page.goto('/#/docs/app-specs/board-and-rules');
  await expect(page.locator('.doc-tab.active')).toHaveText('SPECS');
  await page.getByRole('link', { name: 'BASIC SPECS', exact: true }).click();
  await expect(page.locator('.doc-tab.active')).toHaveText('BASIC SPECS');
});

test('[BASIC-LINKS-01] a reload restores the docs section', async ({ page }) => {
  await page.goto('/#/docs/readme/tests-and-metrics');
  await expect(page.locator('.doc-section-title')).toHaveText('Tests and metrics');
  await expect(page.locator('.doc-tab.active')).toHaveText('README');
  await page.reload();
  await expect(page.locator('.doc-section-title')).toHaveText('Tests and metrics');
  await expect(page.locator('.doc-tab.active')).toHaveText('README');
});

test('[BASIC-LINKS-01] an unknown address returns to the start', async ({ page }) => {
  await page.goto('/#/docs/nope');
  await expect(page).toHaveURL(/#\/docs\/readme$/);
  await expect(page.locator('.doc-tab.active')).toHaveText('README');
  await page.goto('/#/nope');
  await expect(page).toHaveURL(/#\/play\/pvp$/);
});

test('[BASIC-LAYOUT-01] header and footer stay visible while the main panel scrolls', async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 600 });
  await openReader(page);
  const main = page.locator('.main-panel');
  const sizes = await main.evaluate((node) => ({
    scrollHeight: node.scrollHeight,
    clientHeight: node.clientHeight,
  }));
  expect(sizes.scrollHeight).toBeGreaterThan(sizes.clientHeight);
  await main.evaluate((node) => {
    node.scrollTop = node.scrollHeight;
  });
  expect(await main.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  const header = await page.locator('.topbar').boundingBox();
  const footer = await page.locator('.footer').boundingBox();
  expect(header?.y ?? -1).toBeGreaterThanOrEqual(0);
  expect((footer?.y ?? 0) + (footer?.height ?? 0)).toBeLessThanOrEqual(600);
});

test('[BASIC-LAYOUT-01] the reader does not cover header or footer', async ({ page }) => {
  await openReader(page);
  const header = await page.locator('.topbar').boundingBox();
  const footer = await page.locator('.footer').boundingBox();
  const main = await page.locator('.main-panel').boundingBox();
  expect(main?.y ?? 0).toBeGreaterThanOrEqual((header?.y ?? 0) + (header?.height ?? 0) - 1);
  expect((main?.y ?? 0) + (main?.height ?? 0)).toBeLessThanOrEqual((footer?.y ?? 0) + 1);
});

test('[BASIC-LAYOUT-02] header is one row with actions on the right', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const brand = await page.locator('.brand').boundingBox();
  const tagline = await page.locator('.tagline').boundingBox();
  const actions = await page.locator('.top-actions').boundingBox();
  const topbar = await page.locator('.topbar').boundingBox();
  expect(actions?.x ?? 0).toBeGreaterThan((brand?.x ?? 0) + (brand?.width ?? 0));
  expect(Math.abs((actions?.y ?? 0) - (brand?.y ?? 0))).toBeLessThan(20);
  expect(Math.abs((tagline?.y ?? 0) - (brand?.y ?? 0))).toBeLessThan(20);
  expect(topbar?.height ?? 999).toBeLessThan(100);
});

test('[BASIC-DESIGN-01] the page follows the OS colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe('rgb(32, 31, 37)');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .toBe('rgb(245, 240, 229)');
});

test('[BASIC-DESIGN-02] focus uses the green outline', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: 'New game' });
  await button.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await button.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      color: style.outlineColor,
      width: style.outlineWidth,
      offset: style.outlineOffset,
      style: style.outlineStyle,
    };
  });
  expect(outline).toEqual({
    color: 'rgb(88, 139, 85)',
    width: '3px',
    offset: '2px',
    style: 'solid',
  });
});

test('[BASIC-DATES-01] the footer measurement uses yyyy-mm-dd hh:mm', async ({ page }) => {
  await mockMetrics(page);
  await page.goto('/');
  await page.locator('.footer-item[data-tip-wide]').first().hover();
  const tip = page.locator('.tooltip');
  await expect(tip).toBeVisible();
  const first = (await tip.innerText()).split('\n')[0] ?? '';
  expect(first).toMatch(/^Measured \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  await expect(tip).toContainText('Measured 2026-10-27 18:09');
});

test('[BASIC-FOOTER-04] the footer is fixed and wraps cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 720 });
  await page.goto('/');
  const footer = page.locator('.footer');
  await expect(footer).toBeVisible();
  const box = await footer.boundingBox();
  expect(box?.y ?? 9999).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 9999) + (box?.height ?? 9999)).toBeLessThanOrEqual(720);
  await expect(page.locator('.footer-item')).toHaveCount(6);
  expect(
    await page
      .locator('.footer-item')
      .first()
      .evaluate((node) => getComputedStyle(node).whiteSpace),
  ).toBe('nowrap');
});

test('[BASIC-DESIGN-04] the root stays at 100%', async ({ page }) => {
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe(
    '16px',
  );
  await page.setViewportSize({ width: 800, height: 700 });
  await expect(page.locator('.main-panel')).toBeVisible();
});

test('[BASIC-VERSION-01] the app version opens SPECS and never turns red', async ({ page }) => {
  await mockVersion(page, '2.0.0');
  await page.goto('/');
  await expect(page.locator('.footer-items button').nth(1)).toHaveText('1.0.0');
  const appItem = page.locator('.footer-items button').nth(1);
  await expect(appItem).not.toHaveClass(/outdated/);
  await expect(appItem).toHaveAttribute('data-tip', 'four-wins 1.0.0 — open SPECS');
  await appItem.click();
  await expect(page).toHaveURL(/#\/docs\/app-specs$/);
});

test('[BASIC-VERSION-02] the Basic Specs version opens BASIC SPECS', async ({ page }) => {
  await mockVersion(page);
  await page.goto('/');
  const basicItem = page.locator('.footer-items button').nth(2);
  await expect(basicItem).toHaveText(STANDARD);
  await basicItem.click();
  await expect(page).toHaveURL(/#\/docs\/basic-specs$/);
  await expect(page.locator('.doc-tab.active')).toHaveText('BASIC SPECS');
});

test('[BASIC-VERSION-03] only a major update turns red', async ({ page }) => {
  await mockVersion(page, NEXT_MINOR);
  await page.goto('/');
  const basicItem = page.locator('.footer-items button').nth(2);
  await expect(basicItem).not.toHaveClass(/outdated/);
  await expect(basicItem).toHaveAttribute(
    'data-tip', new RegExp(`${NEXT_MINOR.replaceAll('.', '\\.')} available`));
  await mockVersion(page, NEXT_MAJOR);
  await page.reload();
  await expect(basicItem).toHaveClass(/outdated/);
  await expect(basicItem).toHaveAttribute('data-tip', /2\.0\.0 available/);
});

test('[BASIC-VERSION-04] an unavailable latest version stays neutral', async ({ page }) => {
  await mockVersion(page, null);
  await page.goto('/');
  const basicItem = page.locator('.footer-items button').nth(2);
  await expect(basicItem).not.toHaveClass(/outdated/);
  await expect(basicItem).toHaveAttribute('data-tip', /latest not checked/);
});
