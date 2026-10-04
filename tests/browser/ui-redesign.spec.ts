import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildUIFixture, fixtureHTML } from './fixtures/build.cjs';

test.beforeAll(async () => { test.setTimeout(90000); await buildUIFixture(); });

async function mount(page: Page, { role = 'member', live = false, liveUrl = true, fail = false, route = '/' } = {}) {
  const html = await fixtureHTML();
  await page.route('**/__ui_assets/*.js', async request => {
    const filename = path.basename(new URL(request.request().url()).pathname);
    await request.fulfill({ contentType: 'application/javascript', body: await readFile(path.resolve('.next/ui-tests', filename)) });
  });
  await page.route('**/api/**', async request => {
    const url = new URL(request.request().url());
    let data: object = { items: [], next_cursor: null };
    if (url.pathname === '/api/media' && url.searchParams.get('view') === 'settings') data = { settings: { live, live_url: liveUrl ? 'https://www.youtube.com/watch?v=test' : null, schedules: [], revision: 1 } };
    else if (url.pathname === '/api/attendance' && url.searchParams.get('view') === 'analytics') data = { services: [{ id: '1', name: 'Sunday Worship Service', starts_at: '2026-10-04T09:00:00Z', present: 80, expected: 100, expected_present: 80, excused: 5 }], summary: { members: 100, at_risk: 3 }, average: 80, risk: [] };
    else if (url.pathname === '/api/core/prayers') data = { items: [{ id: '1', title: 'Pray for our community', visibility: 'public' }] };
    else if (url.pathname === '/api/finance') data = { items: [], totals: [{ currency: 'GHS', fund: 'offering', net_minor: '250000' }], monthly: [], attempts: [], next_cursor: null, next_attempt_cursor: null };
    else if (url.pathname === '/api/payments/configuration') data = { enabled: false };
    await request.fulfill({ status: fail ? 503 : 200, json: fail ? { error: 'Service unavailable.' } : data });
  });
  await page.route('**/*', async request => {
    if (request.request().isNavigationRequest()) await request.fulfill({ contentType: 'text/html', body: html });
    else await request.fallback();
  });
  await page.goto(`${route}?role=${role}`);
  await expect(page.locator('#main-content')).toBeVisible();
}

test('member worship card reflects available stream settings and keeps working destinations', async ({ page }) => {
  await mount(page, { live: true });
  await expect(page.getByRole('link', { name: 'Watch Live', exact: true })).toHaveAttribute('href', '/sermons');
  await expect(page.getByText('Live now', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My attendance' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Prayer highlights' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Online Giving Tithes/ })).toHaveAttribute('href', '/giving');
  const photo = page.locator('img[src*="worship-sunset"]');
  await expect.poll(() => photo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 320, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

for (const state of [{ live: false }, { live: true, liveUrl: false }, { fail: true }]) {
  test(`member worship card safely falls back: ${JSON.stringify(state)}`, async ({ page }) => {
    await mount(page, state);
    await expect(page.getByRole('link', { name: 'Explore Sermons', exact: true })).toBeVisible();
    await expect(page.getByText('Live now', { exact: true })).toHaveCount(0);
    if (state.fail) await expect(page.getByText('Prayer highlights unavailable.', { exact: true })).toBeVisible();
  });
}

for (const role of ['member', 'pastor', 'admin']) {
  test(`${role} has permitted navigation, readable layout and accessible colors`, async ({ page, isMobile }) => {
    await mount(page, { role });
    if (role === 'member') await expect(page.getByRole('heading', { name: 'Welcome, Daniel Thomas' })).toBeVisible();
    else {
      await expect(page.getByRole('heading', { name: 'Church dashboard' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Attendance overview' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /grow in faith|Join us in worship/ })).toHaveCount(0);
    }
    if (isMobile) {
      const shortcuts = page.getByRole('navigation', { name: 'Mobile shortcuts', exact: true });
      await expect(shortcuts).toBeVisible();
      await expect(shortcuts.getByRole('link')).toHaveCount(4);
      await expect(shortcuts.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    }
    const navigation = page.getByRole('navigation', { name: isMobile ? 'Mobile primary' : 'Primary', exact: true });
    await expect(navigation.getByRole('link', { name: 'Services & Attendance', exact: true })).toHaveCount(role === 'member' ? 0 : 1);
    await expect(navigation.getByRole('link', { name: 'Financial Ledger', exact: true })).toHaveCount(role === 'admin' ? 1 : 0);
    await expect(navigation.getByRole('link', { name: 'Admin Management Panel', exact: true })).toHaveCount(role === 'admin' ? 1 : 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    if (isMobile) {
      await page.keyboard.press('Escape');
      const dashboardResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(dashboardResult.violations).toEqual([]);
    }
    await page.screenshot({ path: `test-results/ui-${role}-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
  });
}

test('More traps focus, closes with Escape, restores focus and navigates to settings', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation interaction');
  await mount(page, { role: 'admin' });
  const opener = page.getByRole('button', { name: 'Open navigation', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Navigation', exact: true });
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
  for (let i = 0; i < 25; i++) { await page.keyboard.press('Shift+Tab'); expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true); }
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0); await expect(opener).toBeFocused();
  await opener.click(); await dialog.getByRole('link', { name: 'User Account Settings', exact: true }).click();
  await expect(page).toHaveURL(/\/settings/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('bottom navigation leaves clearance, layouts fit tablets and short sidebar scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mount(page);
  const main = await page.locator('#main-content').boundingBox();
  const lastCard = await page.getByRole('heading', { name: 'Prayer highlights' }).locator('..').boundingBox();
  expect(main!.y + main!.height - (lastCard!.y + lastCard!.height)).toBeGreaterThan(70);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1024, height: 500 });
  await page.goto('/?role=admin');
  const sidebar = page.getByRole('navigation', { name: 'Primary', exact: true });
  await expect.poll(() => sidebar.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await sidebar.getByRole('link', { name: 'User Account Settings', exact: true }).scrollIntoViewIfNeeded();
  await expect(sidebar.getByRole('link', { name: 'User Account Settings', exact: true })).toBeInViewport();
});

test('standalone pages have warm styling and no app navigation', async ({ page }) => {
  await mount(page, { route: '/login' });
  for (const route of ['/login', '/guest-intake', '/kiosk']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('giving and sermon screens retain forms and handle unavailable services without overflow', async ({ page }) => {
  test.setTimeout(60000);
  await mount(page, { route: '/giving', fail: true });
  for (const route of ['/giving', '/sermons', '/attendance', '/operations']) {
    await page.goto(`${route}?role=admin`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
  }
});

test('giving records remain keyboard accessible when no contributions are listed', async ({ page }) => {
  await mount(page, { route: '/giving' });
  const records = page.getByRole('region', { name: 'Giving records table', exact: true });
  await expect(records).toBeVisible();
  await records.focus();
  await expect(records).toBeFocused();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('attendance table supports keyboard scrolling on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Table overflows at mobile widths');
  await mount(page, { role: 'pastor' });
  const records = page.getByRole('region', { name: 'Completed service attendance table', exact: true });
  await expect(records).toBeVisible();
  await records.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => records.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
});

test('mobile sign-out failure stays actionable and a retry reaches sign-in', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile account controls');
  await mount(page, { fail: true });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Navigation', exact: true });
  await dialog.getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Sign-out failed. Please retry.');
  await page.route('**/api/auth/logout', request => request.fulfill({ json: { success: true } }));
  await dialog.getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test('reduced motion disables live animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, { live: true });
  const dot = page.locator('.animate-live-pulse');
  await expect(dot).toBeVisible();
  expect(await dot.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});
