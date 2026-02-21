import { test, expect } from '@playwright/test';

test.describe('Session Booking Flow', () => {

    test('user can navigate to the explore feed and start booking flow', async ({ page }) => {
        // 1. Authenticate (repeating for isolation)
        await page.goto('/');
        await page.getByRole('button', { name: /log in/i }).click();
        await page.getByText('Player', { exact: true }).click();
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[type="password"]').fill('password123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // 2. Navigate to Explore / Find Practice
        const findSessionBtn = page.getByText(/Find Session/i).first();
        await expect(findSessionBtn).toBeVisible({ timeout: 10000 });
        await findSessionBtn.click();

        // 3. Wait for network resolution / sessions to load
        // We expect the app to show a valid interface, even if zero sessions match criteria.
        // If sessions exist, it usually renders a "Location" or "Coach" text in cards
        const exploreHeader = page.getByRole('heading', { name: /Find Practice/i });
        await expect(exploreHeader).toBeVisible();

        // (This tests the critical viewing path. A full booking checkout test
        // would require mocking Stripe or a sandbox intercept.)
    });

});
