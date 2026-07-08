# Deployment Setup Guide

## GitHub Actions to Vercel Deployment

The app is automatically deployed to Vercel after tests pass. To enable this, you need to configure one secret in GitHub.

## Setup Instructions

### 1. Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it "GITHUB_ACTIONS" or similar
4. Copy the token (keep it safe!)

### 2. Add to GitHub Secrets

1. Go to your GitHub repo: https://github.com/ikrigel/drone-nav-sim
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Name: `VERCEL_TOKEN`
6. Value: Paste the token you copied
7. Click **Add secret**

### 3. Verify Setup

After adding the secret:

1. Make a small commit and push:
   ```bash
   git commit --allow-empty -m "Trigger CI/CD pipeline"
   git push origin main
   ```

2. Go to https://github.com/ikrigel/drone-nav-sim/actions
3. You should see the workflow running
4. It will:
   - ✅ Run TypeScript check
   - ✅ Build production bundle
   - ✅ Run 17 Playwright tests
   - ✅ Deploy to Vercel (if tests pass)

## Deployment Flow

```
Push to main
    ↓
GitHub Actions starts
    ↓
Type check → Build → Tests
    ↓
All pass?
    ↓ Yes
Deploy to Vercel → https://drone-nav-sim.vercel.app
    ↓ No
Workflow fails (red ❌)
```

## Viewing Deployment Status

- **GitHub Actions:** https://github.com/ikrigel/drone-nav-sim/actions
- **Vercel Dashboard:** https://vercel.com/ikrigels-projects/drone-nav-sim
- **Live Site:** https://drone-nav-sim.vercel.app

## Manual Deploy (without GitHub)

If you need to deploy manually:

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel deploy --prod
```

## Troubleshooting

### "Vercel repo not found" error

**Solution:** Ensure `VERCEL_TOKEN` is set in GitHub Secrets (see step 2 above)

### Deployment succeeded but site didn't update

- Vercel might be caching. Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R`)
- Wait 1-2 minutes for CDN cache to clear
- Check Vercel logs: https://vercel.com/ikrigels-projects/drone-nav-sim

### Tests pass but deployment skipped

- This is expected if you're not on the `main` branch
- Deployment only runs on pushes to `main`
- It does NOT run on pull requests (by design)

## Current Status

- ✅ Tests: 17/17 passing
- ✅ Build: Working
- ✅ Deployment: Ready (pending VERCEL_TOKEN setup)

## Related Files

- `.github/workflows/test-and-deploy.yml` — CI/CD workflow
- `TESTING.md` — Testing documentation
- `vercel.json` — Vercel build configuration
- `package.json` — Build and test scripts

## Environment Variables

If you need to add environment variables to Vercel:

1. Go to https://vercel.com/ikrigels-projects/drone-nav-sim/settings/environment-variables
2. Add variables (currently not needed for this app)
3. Redeploy to apply changes

## Rollback

To rollback to a previous deployment:

1. Go to Vercel dashboard
2. Click on a previous deployment
3. Click "Promote to Production"

Or use CLI:
```bash
vercel promote <deployment-url>
```

## Questions?

For issues:
- Check GitHub Actions logs: https://github.com/ikrigel/drone-nav-sim/actions
- Check Vercel logs: https://vercel.com/ikrigels-projects/drone-nav-sim/logs
- Review this guide: `DEPLOYMENT.md`
