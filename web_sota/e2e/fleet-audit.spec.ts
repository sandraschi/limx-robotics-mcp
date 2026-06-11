import { test, expect } from '@playwright/test';

const FE = 'http://localhost:11045';
const BE = 'http://localhost:11044';

test.describe('Fleet Audit', () => {
    test('Dashboard loads with health', async ({ page }) => {
        await page.goto(FE, { timeout: 15000 });
        await page.waitForSelector('#root', { timeout: 10000 });
        await page.waitForTimeout(3000);
        await expect(page.locator('#root')).toContainText(/limx|Ready|Not Ready/i);
    });

    test('Navigation sidebar has all links', async ({ page }) => {
        await page.goto(FE, { timeout: 15000 });
        await page.waitForTimeout(2000);
        const labels = ['Dashboard', 'Simulations', 'Models', 'Policies', 'Logging', 'LLM', 'Settings', 'Help'];
        for (const label of labels) {
            await expect(page.getByRole('link', { name: label })).toBeAttached({ timeout: 5000 });
        }
    });

    test('No console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                errors.push(`${msg.type()}: ${msg.text()}`);
            }
        });
        await page.goto(FE, { timeout: 15000 });
        await page.waitForTimeout(3000);
        const filtered = errors.filter(e => !e.includes('favicon'));
        expect(filtered).toEqual([]);
    });

    test('GET /api/health returns 200', async ({ request }) => {
        const resp = await request.get(`${BE}/api/health`);
        expect(resp.status()).toBe(200);
        const body = await resp.json();
        expect(body.status).toBe('ok');
    });

    test('GET /api/sim/status returns 200', async ({ request }) => {
        const resp = await request.get(`${BE}/api/sim/status`);
        expect(resp.status()).toBe(200);
    });

    test('GET /api/settings returns 200 with valid keys', async ({ request }) => {
        const resp = await request.get(`${BE}/api/settings`);
        expect(resp.status()).toBe(200);
        const body = await resp.json();
        expect(body.success).toBe(true);
    });

    test('GET /api/models/variants returns list', async ({ request }) => {
        const resp = await request.get(`${BE}/api/models/variants?platform=tron1`);
        expect(resp.status()).toBe(200);
    });

    test('POST /api/sim/start returns error for bad platform', async ({ request }) => {
        const resp = await request.post(`${BE}/api/sim/start`, {
            data: { platform: 'mars' },
        });
        expect(resp.status()).toBe(200);
    });

    test('POST invalid input returns 422', async ({ request }) => {
        const resp = await request.post(`${BE}/api/sim/start`, {
            data: { platform: null },
        });
        expect(resp.status()).toBe(422);
    });
});
