import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// CI-SAFE route navigation tests.
//
// We cannot assert on any React-rendered content because AuthContext blocks
// all rendering until Firebase resolves (which it cannot do in CI).
//
// We instead assert on:
//   - HTTP status codes (the server responds correctly to all routes)
//   - URL navigation (the SPA accepts all routes without crashing)
//   - Page title (always rendered from static HTML, not React)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('SPA Route Navigation', () => {

    test('root route "/" serves the application', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(/SportsScheduler/i);
    });

    test('"/explore" route serves the application without a 404', async ({ page }) => {
        // Vite serves the SPA index.html for all routes in dev mode.
        // A 200 response confirms the server is correctly handling SPA routing.
        const response = await page.goto('/explore');
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(/SportsScheduler/i);
    });

    test('"/login" route serves the application without a 404', async ({ page }) => {
        const response = await page.goto('/login');
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(/SportsScheduler/i);
    });

    test('"/player" route serves the application without a 404', async ({ page }) => {
        const response = await page.goto('/player');
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(/SportsScheduler/i);
    });

});
