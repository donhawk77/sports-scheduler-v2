import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// These tests are designed to be FULLY CI-SAFE.
//
// The core constraint: the app's AuthContext uses `{!loading && children}`,
// which blocks all React rendering until Firebase Auth resolves. In the CI
// environment, Firebase cannot connect (no live credentials), so the auth
// state never resolves and all React components remain hidden.
//
// Strategy: test assertions that don't depend on Firebase or React rendering:
//   1. The Vite dev server is running and returns a valid HTML page.
//   2. The static HTML <title> tag is correct.
//   3. The static HTML <div id="root"> mount point is present.
//
// This validates the build pipeline, server startup, and deployment integrity
// without requiring a live Firebase connection.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Application Shell & Infrastructure', () => {

    test('dev server responds and serves a valid HTML page', async ({ page }) => {
        const response = await page.goto('/');
        // The server should respond with HTTP 200
        expect(response?.status()).toBe(200);
    });

    test('page has correct title from index.html', async ({ page }) => {
        await page.goto('/');
        // This is a static string in index.html — always present, no JS needed
        await expect(page).toHaveTitle(/SportsScheduler/i);
    });

    test('React root mount point is present in DOM', async ({ page }) => {
        await page.goto('/');
        // The <div id="root"> is in static HTML, always present
        const rootDiv = page.locator('#root');
        await expect(rootDiv).toBeAttached();
    });

});
