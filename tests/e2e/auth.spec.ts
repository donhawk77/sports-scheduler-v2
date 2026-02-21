import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation Flow', () => {

    test('user can log in as a Player and view the dashboard', async ({ page }) => {
        // Navigate to local dev server
        await page.goto('/');

        // 1. Enter the login pipeline from landing page
        await page.getByRole('button', { name: /log in/i }).click();

        // 2. Select Player role
        await page.getByText('Player', { exact: true }).click();

        // 3. Fill in credentials
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[type="password"]').fill('password123');

        // 4. Submit
        await page.getByRole('button', { name: /sign in/i }).click();

        // 5. Verify successful navigation to the authenticated dashboard
        // The exact URL or heading might differ, but 'Find Session' or dashboard structural elements should exist
        await expect(page.getByText(/Find Session/i).first()).toBeVisible({ timeout: 10000 });
    });

});
