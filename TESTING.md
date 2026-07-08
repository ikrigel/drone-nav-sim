# Testing Guide

## Playwright E2E Tests

This project uses Playwright for end-to-end testing. All tests verify the camera-based drone navigation system works correctly.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests with UI (interactive mode):**
```bash
npm test:ui
```

**Debug tests (step through with inspector):**
```bash
npm test:debug
```

### Test Coverage

17 comprehensive tests covering:

1. **App Initialization**
   - Page loads correctly
   - Title is set
   - Favicon is present

2. **UI Components**
   - Menu buttons (⚙️, ℹ️, ❓) visible
   - Control buttons (Enable Sensors, Start Flight) visible
   - HUD overlay displays all telemetry data
   - Flight plotter canvas renders

3. **Settings Modal**
   - Opens and closes correctly
   - Font size options (Small, Medium, Large, XL, XXL)
   - Font size changes apply to app
   - Debug logging toggle
   - Modal closes on close button click
   - Modal closes on overlay click

4. **About Modal**
   - Opens correctly
   - Displays version 2.1.0
   - Closes properly

5. **Help Modal**
   - Opens correctly
   - Contains camera-based navigation instructions
   - Closes properly

6. **Flight Controls**
   - Start Flight button becomes available after Enable Sensors
   - Stop Flight button appears when flying
   - Flight can be started and stopped

7. **Responsive Design**
   - Buttons visible and functional on small screens (375×667)
   - No overflow or hidden elements

### Test Results

All tests passing: **17/17 ✅**

### CI/CD Integration

Tests are automatically run by GitHub Actions before deployment:

1. TypeScript type checking
2. Production build
3. Playwright tests
4. Vercel deployment (only if tests pass)

See `.github/workflows/test-and-deploy.yml` for workflow configuration.

### Test Files

- `tests/app.spec.ts` — Main test suite with 17 tests
- `playwright.config.ts` — Playwright configuration

### Debugging Failed Tests

1. **Run in UI mode**: `npm test:ui` shows interactive test browser
2. **Debug mode**: `npm test:debug` opens Playwright Inspector
3. **Check test results**: Test artifacts in `playwright-report/` after run
4. **View video**: Each failed test records video in `test-results/`

### GitHub Actions Status

View CI/CD pipeline status:
- GitHub: https://github.com/ikrigel/drone-nav-sim/actions
- All tests run before Vercel deployment
- Deployment only proceeds if all tests pass

### Adding New Tests

To add tests:

1. Edit `tests/app.spec.ts`
2. Add test case to `test.describe('Drone Navigation Simulator', ...)`
3. Run `npm test` to verify
4. Commit and push (GitHub Actions will run tests automatically)

Example:
```typescript
test('should do something', async ({ page }) => {
  await page.goto('/');
  
  // Your test here
  await expect(page.locator('some-selector')).toBeVisible();
});
```

### Performance

Test suite runs in ~12 seconds on CI.

### Dependencies

- `@playwright/test@^1.61.1` — E2E testing framework
- Playwright browsers auto-installed by `npm install`

### Troubleshooting

**"Playwright browsers not found":**
```bash
npx playwright install
```

**Tests timeout on CI:**
- Increase timeout in `playwright.config.ts`
- Check GitHub Actions runners have sufficient resources

**Tests pass locally but fail on CI:**
- May be timing issues on slower CI runners
- Increase timeouts in `.waitFor()` calls
- Check for race conditions

### Future Improvements

- [ ] Screenshot comparison tests
- [ ] Performance benchmarking tests
- [ ] Camera functionality mocking tests
- [ ] Accessibility (a11y) tests
- [ ] Cross-browser testing (Firefox, WebKit)
