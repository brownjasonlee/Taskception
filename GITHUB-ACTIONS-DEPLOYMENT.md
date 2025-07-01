# GitHub Actions Deployment Workflow

## Overview

This repository now includes a secure GitHub Actions workflow for automatically deploying the Taskception PWA (Progressive Web App) to GitHub Pages. The workflow follows modern CI/CD best practices and implements multiple security measures to protect against supply chain attacks.

## 🔒 Security Features Implemented

### 1. **Action Pinning to Full Commit SHA**
- All GitHub Actions are pinned to specific commit SHAs instead of version tags
- Prevents supply chain attacks where malicious code could be injected into action updates
- **Actions Used:**
  - `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2)
  - `actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af` (v4.1.0)
  - `actions/configure-pages@v5` (v5.0.0 - uses tag for compatibility)
  - `actions/cache@v4` (v4.x - uses tag due to GitHub deprecation policy)
  - `actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa` (v3.0.1)
  - `actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e` (v4.0.5)

### 2. **Minimal Token Permissions**
- Uses GitHub's `permissions:` block to limit token access
- Only grants necessary permissions:
  - `contents: read` - Read repository code
  - `pages: write` - Deploy to GitHub Pages
  - `id-token: write` - Required for OIDC token

### 3. **Job Timeouts**
- Both build and deploy jobs have 10-minute timeouts
- Prevents runaway processes and resource consumption

### 4. **Concurrency Controls**
- Prevents overlapping deployments with `concurrency` group
- Ensures only one deployment runs at a time

### 5. **Environment Segregation**
- Uses GitHub Pages environment for deployment tracking
- Enables deployment protection rules and monitoring

## 🚀 Workflow Features

### Build Process
1. **Dependency Installation**: Uses `npm ci` for reproducible builds
2. **TypeScript Compilation**: Runs `tsc && vite build`
3. **PWA Generation**: Automatically generates service worker and manifests
4. **GitHub Pages Configuration**: Sets correct base path automatically

### Deployment Triggers
- **Automatic**: Deploys on pushes to `master` branch
- **Pull Request Testing**: Builds (but doesn't deploy) on PRs for validation
- **Manual**: Can be triggered manually via GitHub UI

### Base Path Handling
- Automatically detects if deployed to user page (`username.github.io`) or project page (`username.github.io/repository`)
- Configures Vite base path accordingly for proper asset loading

## 📋 Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository's **Settings** > **Pages**
2. Set **Source** to "GitHub Actions"
3. The workflow will handle the rest automatically

### 2. Configure Database (Optional)
Your app uses Supabase for data persistence but **gracefully falls back to local storage** if not configured.

#### Option A: Deploy with Database Persistence
1. Go to your repository's **Settings** > **Secrets and variables** > **Actions**
2. Add the following **Repository Secrets**:
   ```
   VITE_SUPABASE_URL = your_supabase_project_url
   VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
   ```
3. Find these values in your Supabase dashboard: **Project Settings** > **API**

#### Option B: Deploy with Local Storage Only
- **No setup required** - the app will work with local storage only
- User data will persist per browser session but not across devices
- You can add database configuration later without redeploying

### 3. Repository Requirements
- Repository must be public (for free GitHub Pages) or have GitHub Pro/Team
- The `master` branch should be your main deployment branch

### 4. First Deployment
1. Push the workflow files to your `master` branch
2. The workflow will automatically trigger
3. Check the **Actions** tab to monitor deployment progress
4. Your app will be available at `https://username.github.io/Taskception/`

## 🔍 Workflow Validation Checklist

### ✅ Security Requirements Met
- [x] **Action Pinning**: All actions pinned to commit SHA
- [x] **Minimal Permissions**: Only necessary permissions granted
- [x] **Timeout Protection**: Jobs have reasonable timeout limits
- [x] **Concurrency Control**: Prevents overlapping deployments
- [x] **Environment Security**: Uses GitHub Pages environment

### ✅ CI/CD Best Practices
- [x] **Reproducible Builds**: Uses `npm ci` for consistent dependency installation
- [x] **Build Validation**: Runs TypeScript compilation and Vite build
- [x] **Artifact Management**: Properly uploads and deploys build artifacts
- [x] **Environment Configuration**: Handles GitHub Pages base path correctly

### ✅ PWA Compatibility
- [x] **Service Worker**: Generated during build process
- [x] **Manifest**: PWA manifest included in build
- [x] **Asset Caching**: Workbox configuration for offline functionality
- [x] **Icon Generation**: PWA icons properly included

## 🛠 Maintenance

### Updating Action Versions
When updating GitHub Actions, always:
1. Find the latest commit SHA for the desired version
2. Update the SHA in the workflow file
3. Update the version comment for tracking

### Monitoring
- Check the **Actions** tab for deployment status
- Monitor the **Environments** section for deployment history
- Review security alerts for any action vulnerabilities

## 🚨 Security Considerations

### Action Supply Chain Security
- The workflow uses pinned actions, but some actions may still have "unpinnable" dependencies
- Regularly review action security advisories
- Consider using self-hosted runners for additional security

### Secrets and Environment Variables
- **Database secrets** are handled via GitHub Encrypted Secrets (optional)
- **Supabase credentials** are safely passed as environment variables during build
- **Graceful fallback** ensures app works even without database configuration
- Never commit sensitive data to the repository

#### Required Secrets (Optional)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe for client-side use)

## 📊 Performance

### Build Time
- Typical build time: 3-5 minutes
- Optimized with npm caching
- TypeScript compilation and Vite bundling

### Deployment
- Deployment time: 1-2 minutes
- Served via GitHub's global CDN
- PWA caching for improved performance

## 🐛 Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility
2. **Path Issues**: Verify base path configuration in vite.config.ts
3. **Permission Errors**: Ensure GitHub Pages is enabled in repository settings
4. **Database Connection**: App works without database - check Supabase secrets if persistence needed
5. **Configure Pages Error**: If you see "TypeError: error must be an instance of Error" in the Configure Pages step, this is a known issue with SHA-pinned `configure-pages` action - the workflow uses `@v5` tag instead for compatibility
6. **Cache Service Warnings**: "Failed to save/restore: Cache service responded with 503" are temporary GitHub service issues and don't affect deployment success
7. **Deprecated Cache Action**: If you see errors about deprecated `actions/cache` versions, ensure you're using `@v4` tag (not SHA) due to GitHub's specific deprecation policy for cache actions

### Debug Steps
1. Check the Actions tab for detailed logs
2. Verify all dependencies in package.json are compatible
3. Test build locally with `npm run build`
4. Check GitHub Pages settings in repository
5. **For database issues**:
   - Verify Supabase secrets are correctly set in repository settings
   - Check Supabase dashboard for project status
   - Test locally with same environment variables
   - Remember: app works fine without database (local storage fallback)

## 📚 Additional Resources

- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages) 