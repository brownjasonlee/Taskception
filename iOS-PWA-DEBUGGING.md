# 📱 iOS PWA Installation Debugging Guide

## 🚨 **Issue: "Add to Home Screen" works on Mac but not iPhone**

This is a common issue with iOS PWA installation. Here's how to debug and fix it:

## 🔧 **Step-by-Step Debugging**

### 1. **Use Production Build (CRITICAL)**
iOS Safari is stricter with dev servers. Always test with production build:

```bash
# Build and serve production version
npm run build-pwa
npm run preview

# The preview server should show: Local: http://localhost:4173
```

### 2. **HTTPS Access for iPhone**
iOS requires HTTPS. Use localtunnel for testing:

```bash
# Terminal 1: Start preview server
npm run preview

# Terminal 2: Create HTTPS tunnel
npx localtunnel --port 4173 --subdomain old-actors-rest
# This gives you: https://old-actors-rest.loca.lt
```

### 3. **Test on iPhone Safari**
1. Open `https://old-actors-rest.loca.lt` in iPhone Safari
2. Wait 10-15 seconds for full page load
3. Tap the Share button (square with arrow up)
4. Look for "Add to Home Screen" option

## ✅ **iOS PWA Requirements Checklist**

### Required Manifest Properties
- ✅ `name` and `short_name`
- ✅ `start_url` set to `/`
- ✅ `display: "standalone"`
- ✅ Icons with 192x192 and 512x512 sizes
- ✅ `theme_color` and `background_color`

### Required Meta Tags
- ✅ `apple-mobile-web-app-capable: yes`
- ✅ `apple-mobile-web-app-title`
- ✅ `apple-touch-icon` link

### Technical Requirements
- ✅ HTTPS (production requirement)
- ✅ Service Worker registered
- ✅ Manifest served with correct MIME type

## 🐛 **Debugging Steps**

### 1. **Check Browser Console on iPhone**
- Open Safari Developer Menu (if enabled)
- Look for service worker or manifest errors

### 2. **Verify Manifest Loading**
On iPhone Safari, navigate to:
```
https://your-tunnel-url.loca.lt/manifest.webmanifest
```
Should show JSON, not 404.

### 3. **Test Service Worker Registration**
In iPhone Safari console (if available):
```javascript
navigator.serviceWorker.getRegistrations().then(console.log)
```

### 4. **Check Network Tab**
- Ensure all icon files are loading (200 status)
- Verify manifest.webmanifest loads successfully

## 🔧 **Common Fixes**

### Fix 1: Force Production Testing
```bash
# Never test PWA installation with dev server on iOS
npm run build-pwa  # This builds AND generates icons
npm run preview    # Serves production build
```

### Fix 2: Clear Safari Cache
On iPhone:
1. Settings > Safari > Clear History and Website Data
2. Or Settings > Safari > Advanced > Website Data > Remove All

### Fix 3: Wait for Service Worker
iOS needs time to register service worker:
- Wait 10-15 seconds after page load
- Refresh page once
- Then try "Add to Home Screen"

### Fix 4: Check Icon Accessibility
Icons must be accessible over HTTPS:
```bash
# Test these URLs work on iPhone:
https://your-url.loca.lt/pwa-192x192.png
https://your-url.loca.lt/pwa-512x512.png
https://your-url.loca.lt/apple-touch-icon.png
```

## 📱 **iOS Safari Specific Behavior**

### Installation Trigger
- iOS doesn't show automatic install prompts
- Must manually use Safari's "Add to Home Screen"
- Our custom install prompt won't work on iOS Safari

### Timing Issues
- iOS takes longer to validate PWA requirements
- Service worker must be fully registered
- All assets must load successfully first

### Visual Indicators
- No install button in address bar (unlike desktop)
- Look for Share button > "Add to Home Screen"
- If missing, PWA requirements not met

## 🏆 **Success Criteria for iOS**

When working correctly:
1. ✅ "Add to Home Screen" appears in Share menu
2. ✅ App installs with custom icon
3. ✅ Launches in standalone mode (no Safari UI)
4. ✅ Shows splash screen with app icon
5. ✅ Works offline

## 🆘 **Still Not Working?**

### Last Resort: Production Deployment
Test with real HTTPS deployment:
1. Deploy to Vercel/Netlify/GitHub Pages
2. Test with real HTTPS URL
3. Production environment often resolves edge cases

### Enable Safari Developer Tools
1. iPhone: Settings > Safari > Advanced > Web Inspector
2. Mac: Safari > Develop > [Your iPhone] > [Page]
3. Check console for specific errors

### Test Basic PWA Requirements
Visit: https://web.dev/pwa-checklist/
Run Lighthouse audit on production URL.

---

**The key insight: iOS Safari is much pickier than desktop browsers. Always test the production build over HTTPS, never the dev server! 📱** 