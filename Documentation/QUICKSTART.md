# Quick Start Guide

Get CollabCode running in **under 2 minutes**!

## Instant Local Setup

### Option 1: Double-Click Method (Easiest)

1. Download all files to a folder
2. Double-click `index.html`
3. Opens in your default browser
4. **Done!** ✨

> **Note**: To test collaboration, open the same file in multiple browser tabs.

### Option 2: Python Web Server (Recommended)

```bash
# Navigate to project folder
cd collabcode

# Python 3 (most systems have this)
python -m http.server 8000

# Open browser
# Visit: http://localhost:8000
```

### Option 3: Node.js Server

```bash
# Install http-server globally (one time)
npm install -g http-server

# Run server
http-server

# Opens automatically in browser
```

### Option 4: VS Code Live Server

1. Open folder in VS Code
2. Install "Live Server" extension
3. Right-click `index.html`
4. Select "Open with Live Server"

## Test Collaboration in 30 Seconds

1. **Open the page** (any method above)
2. **Open same URL** in 2 more browser tabs
3. **Type "Hello"** in tab 1
4. **Watch it appear** in tabs 2 and 3!
5. **Type simultaneously** in all tabs
6. **All tabs sync** - no conflicts! 🎉

## Verify Everything Works

### ✅ Checklist

Open browser console (F12) and verify:

```javascript
// Should show your site ID
app.crdt.siteId
// Example: "user-abc123"

// Should show current state
app.crdt.getState()
// Should return object with vectorClock, characterCount, etc.

// Should show connected peers (in other tabs)
app.syncEngine.getPeerCount()
// Number of other tabs/windows
```

If all above work → **Perfect!** Everything is running correctly.

## Quick Demo Script

Impressive 2-minute demo for showing off:

```
1. [Open 3 tabs side-by-side]
   "This is a real-time collaborative code editor"

2. [Type in tab 1]
   "Watch as I type in this tab..."

3. [Point to tab 2 and 3]
   "...it appears instantly in all tabs!"

4. [Type in all 3 tabs simultaneously]
   "Even when everyone types at once..."

5. [Point to results]
   "...no conflicts! All tabs show the same result."

6. [Open Operations Log panel]
   "This shows the CRDT operations in real-time."

7. [Open browser console, run:]
   app.crdt.getState()
   "Vector clocks ensure causality..."

8. [Delete and insert concurrently]
   "Tombstone markers prevent position conflicts..."

9. [Explain]
   "The hardest bug: race conditions during simultaneous edits.
    Fixed with vector clocks for deterministic ordering!"

⏱️ Total time: 2 minutes
🎯 Impact: Maximum
```

## Common First-Time Issues

### Issue: "Page not found"
**Fix**: Make sure all files are in the same folder:
- index.html
- styles.css
- app.js
- crdt.js
- sync-engine.js
- editor.js

### Issue: "Changes don't sync between tabs"
**Fix**: 
- Tabs must be on the **same URL** (including localhost port)
- Check browser console for errors
- Try hard refresh: `Ctrl+Shift+R`

### Issue: "Fonts look weird"
**Fix**: You need internet connection to load Google Fonts. Or edit `index.html`:

```html
<!-- Remove this line for offline use -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono..." rel="stylesheet">
```

### Issue: "Console shows errors"
**Fix**: Check you're using a modern browser:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

## Quick Feature Tour

### 1. Operations Log
- Right sidebar → "OPERATIONS LOG"
- Shows every CRDT operation in real-time
- Watch vector clocks increment!

### 2. Connected Users
- Right sidebar → "CONNECTED USERS"
- Shows other tabs/users
- Each has unique color

### 3. Document Stats
- Right sidebar → "DOCUMENT INFO"
- Lines, Characters, Cursors, Edits
- Updates in real-time

### 4. Footer Stats
- Bottom bar shows:
  - Current line/column
  - Network latency
  - Total OT operations

### 5. Share Button
- Top right → "SHARE" button
- Get shareable link (for production)
- Currently shows demo link

## Advanced Quick Tests

### Test Network Latency
```javascript
// In browser console
app.simulateNetworkLatency(500); // 500ms delay
// Now type - see delayed sync!

app.simulateNetworkLatency(0); // Reset to instant
```

### Test Offline Mode
```javascript
app.simulateOffline();
// Type some text (only appears locally)

app.simulateOnline();
// Text syncs to other tabs!
```

### Generate Test Data
```javascript
// Add 100 random characters
for (let i = 0; i < 100; i++) {
    app.editor.insertText(String.fromCharCode(65 + Math.random() * 26));
}
```

### Check Performance
```javascript
console.time('1000 ops');
for (let i = 0; i < 1000; i++) {
    app.crdt.localInsert(0, 'x');
}
console.timeEnd('1000 ops');
// Should be < 100ms
```

## Project File Overview

```
📁 collabcode/
├── 📄 index.html          # Main page (OPEN THIS)
├── 🎨 styles.css          # Brutalist terminal design
├── 🧠 crdt.js            # CRDT algorithm (THE MAGIC)
├── 🔄 sync-engine.js     # Network synchronization
├── ⌨️  editor.js          # Text editor controller
├── 🚀 app.js             # Application entry point
├── 📚 README.md          # Full documentation
├── 🧪 TESTING.md         # Test all the bugs!
└── 🌐 DEPLOYMENT.md      # GitHub Pages setup
```

**Start here**: Open `index.html`  
**Understand bugs**: Read `TESTING.md`  
**Deploy online**: Follow `DEPLOYMENT.md`  

## What to Explore First

### For Understanding the Code:
1. Open `crdt.js` → Read the comments on VectorClock class
2. Find the `localInsert` and `localDelete` methods
3. Look for "BUG FIX" comments - explains the hardest bugs!

### For Testing:
1. Open `TESTING.md`
2. Try "Test 1: Race Condition"
3. Watch the operations log while testing

### For Learning:
1. Type in one tab
2. Watch console: `app.crdt.operationHistory`
3. See how operations are structured
4. Each has a vectorClock showing causality!

## Next Actions

### Immediate (2 minutes):
- [ ] Open index.html
- [ ] Test in 2-3 tabs
- [ ] Verify sync works

### Short-term (30 minutes):
- [ ] Read TESTING.md
- [ ] Reproduce all 5 bug scenarios
- [ ] Understand why fixes work

### Medium-term (2 hours):
- [ ] Read through crdt.js with comments
- [ ] Understand vector clock algorithm
- [ ] Experiment with the code

### Long-term (1 day):
- [ ] Deploy to GitHub Pages
- [ ] Share with friends
- [ ] Present at hackathon!

## Help & Resources

**Stuck?** Check these in order:

1. **Browser Console** (F12) - Shows errors
2. **README.md** - Full documentation
3. **TESTING.md** - Detailed test scenarios
4. **Code Comments** - Every complex section explained

**Still stuck?**
- Check browser compatibility
- Try different browser
- Hard refresh the page
- Clear localStorage: `localStorage.clear()`

## Success Criteria

You've successfully started if:

- ✅ Page loads without errors
- ✅ Can type in the editor
- ✅ Text syncs between tabs
- ✅ Operations log shows activity
- ✅ No console errors

## Pro Tips

💡 **For Demos**: Open in split-screen with 3 tabs visible at once  
💡 **For Testing**: Enable `window.DEBUG_MODE = true` for verbose logging  
💡 **For Learning**: Read code comments while watching operations log  
💡 **For Hackathons**: Focus on explaining the race condition bug fix  
💡 **For Performance**: Use Chrome DevTools Performance tab to profile  

## Keyboard Shortcuts

While in the editor:
- `Tab` → Insert 4 spaces (tab character disabled)
- `Ctrl+A` → Select all
- `Ctrl+Z` → Undo (basic, not CRDT-aware yet)
- `Arrow keys` → Move cursor

## Customization Quick Wins

Want to personalize? Edit these:

### Change Colors (styles.css, lines 3-12):
```css
--accent-primary: #00ff41;  /* Change to your color! */
--accent-secondary: #ff0080;
```

### Change App Name (index.html, line 25):
```html
<span class="logo-text">YourAppName</span>
```

### Change Welcome Message (app.js, lines 230-250):
```javascript
const welcomeText = `Your custom welcome message!`;
```

## That's It!

You're ready to go! 🚀

**Remember**: The magic is in `crdt.js` - that's where the complex CRDT algorithm lives.

**Pro tip**: Open `TESTING.md` next to understand what makes this hackathon-level complexity!

---

Questions? Everything is documented in the code comments!

**Happy Coding!** 💚
