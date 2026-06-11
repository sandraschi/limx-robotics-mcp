import { test, expect } from '@playwright/test';

const FE = 'http://localhost:11045';

test.describe('Page-specific tests', () => {
    test('Help page has 4 tabs', async ({ page }) => {
        await page.goto(`${FE}/help`, { timeout: 15000 });
        const tabButtons = page.locator('button').filter({ hasText: /Prerequisites|Troubleshooting|Architecture|LimX FOSS/ });
        await expect(tabButtons).toHaveCount(4);
        for (const label of ['Prerequisites', 'Troubleshooting', 'Architecture', 'LimX FOSS']) {
            await page.getByRole('button', { name: label }).click();
            await page.waitForTimeout(300);
        }
    });

    test('Logging page has level selector', async ({ page }) => {
        await page.goto(`${FE}/logging`, { timeout: 15000 });
        await page.waitForTimeout(1000);
        await expect(page.getByRole('heading', { name: 'Logging' })).toBeVisible();
        await expect(page.getByText('Level')).toBeVisible();
        await expect(page.locator('.bg-slate-900').first()).toBeAttached();
    });

    test('LLM page has provider selector', async ({ page }) => {
        await page.goto(`${FE}/llm`, { timeout: 15000 });
        await expect(page.getByText('Provider')).toBeVisible();
        await expect(page.getByText('Model', { exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('Type a message…')).toBeAttached();
    });

    test('Models page has platform selector', async ({ page }) => {
        await page.goto(`${FE}/models`, { timeout: 15000 });
        await expect(page.getByText('Platform')).toBeVisible();
        await expect(page.locator('select')).toHaveCount(1);
    });

    test('Settings page has editable fields', async ({ page }) => {
        await page.goto(`${FE}/settings`, { timeout: 15000 });
        await page.waitForTimeout(2000);
        const inputs = page.locator('input[type="text"]');
        const count = await inputs.count();
        expect(count).toBeGreaterThanOrEqual(2);
        await expect(page.getByText('Save Changes')).toBeAttached();
    });
});
