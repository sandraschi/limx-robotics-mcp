import { test } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FE = 'http://localhost:11045';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../docs/screenshots');

test.describe('Page screenshots', () => {
    test('Dashboard screenshot', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(FE, { timeout: 15000 });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dashboard.png'), fullPage: false });
    });

    test('Help page screenshot with Troubleshooting tab', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto(`${FE}/help`, { timeout: 15000 });
        await page.getByRole('button', { name: 'Troubleshooting' }).click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'help.png'), fullPage: false });
    });
});
