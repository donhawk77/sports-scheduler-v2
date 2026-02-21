import { test, expect } from '@playwright/test';

test.describe('Session Booking Flow', () => {

    test('public Explore feed renders without authentication', async ({ page }) => {
        // The /explore route is publicly accessible (no RequireAuth guard),
        // allowing us to test that the session feed UI loads correctly in CI
        // without needing a real Firebase account.
        await page.goto('/explore');

        // The page should load correctly – look for stable structural elements.
        // The heading text is defined in ExploreView (or similar).
        // We wait generously to account for slow CI machines.
        await expect(
            page.getByRole('heading', { name: /Find Practice/i })
        ).toBeVisible({ timeout: 20000 });
    });

    test('unauthenticated user is redirected to login from the player dashboard', async ({ page }) => {
        // Navigating to a RequireAuth-wrapped route should redirect to /login.
        await page.goto('/player');

        // Wait for the redirect and confirm we are on the login page.
        await expect(page.getByText(/Player Login/i)).toBeVisible({ timeout: 15000 });
    });

});
