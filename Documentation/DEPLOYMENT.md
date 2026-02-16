# GitHub Pages Deployment Guide

Step-by-step guide to deploy CollabCode to GitHub Pages.

## Prerequisites

- GitHub account
- Git installed on your computer
- Basic command line knowledge

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **"New repository"** (green button)
3. Repository name: `collabcode` (or your choice)
4. Description: "Real-time collaborative code editor with CRDT"
5. Public repository
6. **Do NOT** initialize with README, .gitignore, or license
7. Click **"Create repository"**

## Step 2: Prepare Local Files

```bash
# Navigate to the project directory
cd /path/to/collabcode

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit: Real-time collaborative code editor"
```

## Step 3: Push to GitHub

```bash
# Add remote repository (replace YOUR-USERNAME)
git remote add origin https://agarawala.github.io/collabcode

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** tab
3. Scroll to **"Pages"** in left sidebar
4. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **"Save"**

## Step 5: Wait for Deployment

- GitHub Pages takes 1-5 minutes to build
- You'll see: "Your site is live at https://YOUR-USERNAME.github.io/collabcode/"
- Click the link to visit your site!

## Step 6: Test the Deployment

1. Open the deployed site
2. Open the same URL in another browser tab
3. Type in one tab - should appear in the other tab!
4. Success! 🎉

## Project Structure

Your repository should look like this:

```
collabcode/
├── index.html          # Main HTML file
├── styles.css          # Stylesheet
├── app.js             # Main application
├── crdt.js            # CRDT implementation
├── sync-engine.js     # Synchronization
├── editor.js          # Editor controller
├── README.md          # Documentation
└── TESTING.md         # Testing guide
```

## Custom Domain (Optional)

To use a custom domain like `collabcode.yourdomain.com`:

1. In repository Settings → Pages
2. Enter your custom domain under "Custom domain"
3. Add CNAME record in your DNS settings:
   ```
   CNAME collabcode YOUR-USERNAME.github.io
   ```
4. Wait for DNS propagation (up to 48 hours)

## Updating Your Site

After making changes:

```bash
# Add changed files
git add .

# Commit with descriptive message
git commit -m "Fixed cursor positioning bug"

# Push to GitHub
git push origin main
```

GitHub Pages automatically rebuilds (takes 1-5 minutes).

## Troubleshooting

### Site not loading
- Check GitHub Pages status in Settings → Pages
- Ensure all files are in root directory (not in subfolder)
- Wait 5-10 minutes after first deployment

### Changes not showing
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Wait a few minutes for GitHub Pages to rebuild

### Collaboration not working
- GitHub Pages is static hosting only
- Current implementation uses localStorage (same browser only)
- For true P2P, you'd need to integrate WebRTC with a signaling server

### Console errors
- Check browser console (F12)
- Ensure all `.js` files are loaded (check Network tab)
- Verify paths are correct (no leading `/` in script tags)

## Limitations of GitHub Pages

✅ **What Works:**
- Static HTML, CSS, JavaScript
- Client-side only applications
- LocalStorage, IndexedDB
- Web Workers, Service Workers
- WebRTC (with external signaling)

❌ **What Doesn't Work:**
- Server-side code (Node.js, Python, PHP)
- Backend APIs
- Databases
- Server-side rendering

## Production Enhancements

For a production-ready deployment, consider:

### 1. Real P2P with WebRTC

Replace localStorage sync with WebRTC:

```javascript
// Use PeerJS (free signaling server)
const peer = new Peer('unique-peer-id', {
    host: 'peerjs.com',
    port: 443,
    secure: true
});

// Or set up your own signaling server
```

### 2. Persistent Storage

Use a real-time database:

```javascript
// Firebase Realtime Database (free tier)
import firebase from 'firebase/app';
import 'firebase/database';

const db = firebase.database();
db.ref('sessions/' + sessionId).on('value', handleUpdate);
```

### 3. CDN for Performance

Add to `<head>` in `index.html`:

```html
<!-- Cloudflare CDN for fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="dns-prefetch" href="https://fonts.gstatic.com">
```

### 4. Progressive Web App

Create `manifest.json`:

```json
{
  "name": "CollabCode",
  "short_name": "CollabCode",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#00ff41",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

Add to `<head>`:
```html
<link rel="manifest" href="manifest.json">
```

### 5. Analytics (Optional)

Add Google Analytics to track usage:

```html
<!-- In <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

## Security Considerations

For GitHub Pages:

1. **No Sensitive Data**: Don't commit API keys or secrets
2. **Client-Side Only**: All code is visible to users
3. **CORS**: Some APIs may block requests from GitHub Pages
4. **Rate Limits**: Be mindful of external API usage

## Sharing Your Project

Share your live demo:

```
 CollabCode - Real-time Collaborative Editor
https://agarawala.github.io/collabcode

Features:
 Real-time collaboration
 CRDT synchronization
 No backend required
 Works on GitHub Pages!

Try it: Open in multiple tabs and type simultaneously!
```

## Alternative Hosting Options

If GitHub Pages limitations are too restrictive:

### Netlify (Free)
- Drag-and-drop deployment
- Automatic HTTPS
- Custom domains
- Faster builds than GitHub Pages

### Vercel (Free)
- Optimized for frontend frameworks
- Serverless functions available
- Great for Next.js, React, etc.

### Cloudflare Pages (Free)
- Ultra-fast CDN
- Unlimited bandwidth
- Direct Git integration

All of these support the same static files as GitHub Pages!

## Success Checklist

Before sharing your deployment:

- [ ] Site loads without errors
- [ ] Multiple tabs can edit simultaneously
- [ ] Operations log shows CRDT operations
- [ ] No console errors
- [ ] Mobile responsive (test on phone)
- [ ] README is updated with your URL
- [ ] Share URL works from any device
- [ ] Browser back/forward buttons work

## Next Steps

1.  Star the repository to track it
2.  Fork to create your own version
3.  Share the link on Twitter, LinkedIn, etc.
4.  Write a blog post explaining the CRDT implementation
5.  Record a demo video showing concurrent editing
6.  Submit to hackathons or coding showcases

---

**Need Help?**
- GitHub Pages Docs: https://docs.github.com/pages
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

**Questions?** Create an issue in the repository!
