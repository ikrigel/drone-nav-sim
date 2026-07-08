import { test, expect } from '@playwright/test';

test.describe('Drone Navigation Simulator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Drone Navigation Simulator');
  });

  test('should display header with menu buttons', async ({ page }) => {
    // Look for menu buttons
    const settingsBtn = page.locator('button:has-text("⚙️")');
    const aboutBtn = page.locator('button:has-text("ℹ️")');
    const helpBtn = page.locator('button:has-text("❓")');

    await expect(settingsBtn).toBeVisible();
    await expect(aboutBtn).toBeVisible();
    await expect(helpBtn).toBeVisible();
  });

  test('should display control buttons on startup', async ({ page }) => {
    // Enable Sensors button should be visible initially
    const enableBtn = page.locator('button:has-text("Enable Sensors")');
    await expect(enableBtn).toBeVisible();
  });

  test('should enable sensors and show Start Flight button', async ({ page }) => {
    const enableBtn = page.locator('button:has-text("Enable Sensors")');

    // Click Enable Sensors
    await enableBtn.click();

    // Wait a moment for state update
    await page.waitForTimeout(500);

    // Start Flight button should now be visible
    const startBtn = page.locator('button:has-text("Start Flight")');
    await expect(startBtn).toBeVisible();
  });

  test('should display HUD overlay with telemetry', async ({ page }) => {
    // HUD should be visible
    const hudOverlay = page.locator('.hud-overlay');
    await expect(hudOverlay).toBeVisible();

    // Check for HUD stats
    const hudStats = page.locator('.hud-stat');
    await expect(hudStats).toHaveCount(11); // Should have 11 HUD stats

    // Look for specific labels
    await expect(page.locator('text=HDG')).toBeVisible();
    await expect(page.locator('text=SPD')).toBeVisible();
    await expect(page.locator('text=ALT')).toBeVisible();
  });

  test('should display flight plotter canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('should open Settings modal', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({ hasText: '⚙️' });
    await settingsBtn.click();

    // Modal should appear with Settings title
    const modal = page.locator('.modal-header');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Font size options should be visible
    await expect(page.locator('button.option-btn')).toHaveCount(5);
  });

  test('should change font size', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({ hasText: '⚙️' });
    await settingsBtn.click();

    // Wait for modal
    await page.locator('.modal-header').waitFor({ state: 'visible' });

    // Find and click XL button - it's the 4th option button
    const xlBtn = page.locator('button.option-btn').nth(3);
    await xlBtn.click();

    // Close modal by clicking close button
    const closeBtn = page.locator('.modal-close').first();
    await closeBtn.click();

    // Modal should be hidden
    await page.locator('.modal-overlay').waitFor({ state: 'hidden' });

    // App container should have font-xl class
    const appContainer = page.locator('.app-container');
    const classes = await appContainer.getAttribute('class');
    expect(classes).toContain('font-xl');
  });

  test('should open Debug settings', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("⚙️")');
    await settingsBtn.click();

    // Debug checkbox should be visible
    const debugCheckbox = page.locator('input[type="checkbox"]');
    await expect(debugCheckbox).toBeVisible();
  });

  test('should open About modal', async ({ page }) => {
    const aboutBtn = page.locator('button:has-text("ℹ️")');
    await aboutBtn.click();

    // Modal should appear
    const modal = page.locator('.modal-header:has-text("About")');
    await expect(modal).toBeVisible();

    // Version should be displayed
    await expect(page.locator('text=Version 2.4.0')).toBeVisible();
  });

  test('should open Help modal', async ({ page }) => {
    const helpBtn = page.locator('button:has-text("❓")');
    await helpBtn.click();

    // Modal should appear
    const modal = page.locator('.modal-header:has-text("Help")');
    await expect(modal).toBeVisible();

    // Help content should reference camera
    await expect(page.locator('text=Camera-Based Navigation')).toBeVisible();
  });

  test('should close modals when close button clicked', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("⚙️")');
    await settingsBtn.click();

    // Modal should be visible
    let modal = page.locator('.modal-dialog');
    await expect(modal).toBeVisible();

    // Click close button
    const closeBtn = page.locator('.modal-close').first();
    await closeBtn.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible();
  });

  test('should close modals when clicking overlay', async ({ page }) => {
    const settingsBtn = page.locator('button').filter({ hasText: '⚙️' });
    await settingsBtn.click();

    // Wait for modal to be visible
    await page.locator('.modal-overlay').waitFor({ state: 'visible' });

    // Click on the overlay background (outside the dialog)
    await page.locator('.modal-overlay').click({ position: { x: 10, y: 10 } });

    // Modal should be hidden
    await page.locator('.modal-overlay').waitFor({ state: 'hidden', timeout: 5000 });
  });

  test('should have favicon', async ({ page }) => {
    const favicon = page.locator('link[rel="icon"]');
    const href = await favicon.getAttribute('href');
    expect(href).toBe('/favicon.svg');
  });

  test('should display responsive buttons on small screen', async ({ page }) => {
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });

    // Buttons should still be visible
    const buttons = page.locator('button.btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // All buttons should be visible (not hidden overflow)
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      await expect(btn).toBeInViewport();
    }
  });

  test('should start and stop flight', async ({ page }) => {
    // Click Enable Sensors
    const enableBtn = page.locator('button:has-text("Enable Sensors")');
    await enableBtn.click();

    await page.waitForTimeout(500);

    // Click Start Flight
    const startBtn = page.locator('button:has-text("Start Flight")');
    await startBtn.click();

    await page.waitForTimeout(500);

    // Stop Flight button should be visible
    const stopBtn = page.locator('button:has-text("Stop Flight")');
    await expect(stopBtn).toBeVisible();

    // Click Stop Flight
    await stopBtn.click();

    await page.waitForTimeout(500);

    // Start Flight should be back
    await expect(startBtn).toBeVisible();
  });

  test('should display all HUD data fields correctly', async ({ page }) => {
    // Check that HUD stats are present
    const hudStats = page.locator('.hud-stat');
    await expect(hudStats).toHaveCount(11);

    // Check HUD labels are visible
    const hudLabels = page.locator('.hud-label');
    await expect(hudLabels).toHaveCount(11);

    // Check HUD values are visible
    const hudValues = page.locator('.hud-value');
    await expect(hudValues).toHaveCount(11);
  });
});
