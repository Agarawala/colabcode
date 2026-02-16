# CollabCode

A real-time collaborative code editor that actually works. No servers, no complicated setup – just open it in multiple browser tabs and start typing.

## What is this?

I built this to learn how Google Docs does real-time collaboration without everyone's edits destroying each other. Turns out the answer is CRDTs (Conflict-free Replicated Data Types) and they're pretty cool once you wrap your head around them.

The interesting part isn't the editor itself – it's that **multiple people can edit the same spot at the same time** and it just... works. No "user locked this line" nonsense, no merge conflicts, everyone's changes survive.

## Try it

**Live demo:** https://agarawala.github.io/collabcode

Open it, then open the same link in another tab. Type in one tab, watch it appear in the other. Try typing in both at once – everything stays in sync.

## How does it work?

Instead of sending the whole document every time someone types, we send tiny "operations" like "user A inserted 'x' at position 5". Each operation has a timestamp (technically a vector clock) so all the tabs can agree on what order things happened in.

The tricky part is handling deletions. If I delete character 5 and you're trying to insert at character 6 at the same time, things get weird. The solution is "tombstones" – we don't actually delete anything, we just mark it as invisible. Sounds wasteful but it prevents all kinds of bugs.

## Running it locally

You'll need a web server because `file://` URLs don't support the localStorage events we use for syncing between tabs.

```bash
# Clone it
git clone https://agarawala.github.io/collabcode
cd collabcode

# Start any web server
npx serve
# or
python -m http.server 8000

# Open http://localhost:3000 (or :8000)
```

Then open that same localhost URL in 2-3 tabs and try typing.

## Tech stack

Pure vanilla JavaScript. No React, no Vue, no build step. I wanted to understand the algorithms without framework magic getting in the way.

The only external dependency is Google Fonts for the monospace fonts. Even that's optional – it'll fall back to system fonts if you're offline.

## The hardest bugs I fixed

**Race conditions during concurrent edits**  
When two people type at the same position simultaneously, naive implementations just pick one and lose the other. Vector clocks fix this by establishing a deterministic order that all clients agree on.

**Cursor jumping after remote operations**  
Your cursor is at position 10. Someone else inserts 5 characters at position 3. Now your cursor should be at 15, not 10. Had to implement operational transformation to adjust cursor positions based on what operations happened.

**Out-of-bounds errors after deletions**  
Alice deletes character 5. Bob tries to insert at character 6 (which no longer exists). Tombstones solve this – we keep deleted characters in the data structure, just mark them invisible.

**Infinite loops**  
Setting the textarea value triggers an input event, which updates the CRDT, which sets the textarea value, which triggers... yeah. Simple flag to prevent that.

**Memory leaks**  
Tombstones accumulate forever. Added garbage collection to clean up old ones after they're no longer needed.

## File structure

- `index.html` - The actual editor interface
- `styles.css` - Terminal-style brutalist design
- `crdt.js` - The core algorithm (vector clocks, character IDs, tombstones)
- `sync-engine.js` - Handles syncing between tabs via localStorage
- `editor.js` - Manages the textarea and UI updates
- `app.js` - Wires everything together

## Why localStorage?

Because this runs on GitHub Pages (static hosting only). In production you'd replace the localStorage sync with WebRTC for actual peer-to-peer, or WebSockets if you have a server.

The cool part is the CRDT algorithm doesn't care – swap out the sync layer and everything else stays the same.

## Deploying to GitHub Pages

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions, but the short version:

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://agarawala.github.io/collabcode
git push -u origin main
```

Then enable GitHub Pages in your repo settings (Settings → Pages → Source: main branch).

Your site will be live at `https://YOUR-USERNAME.github.io/collabcode/`

## What I learned

CRDTs are elegant but debugging them is hell. You can't just look at the text and see what's wrong – you have to trace through operation histories and vector clocks.

The hardest part wasn't the algorithm itself (plenty of papers explain that). It was all the edge cases: What if operations arrive out of order? What if the same operation arrives twice? What if someone's clock is way ahead?

Also learned that "deterministic" doesn't mean "simple". The character ordering logic has like 3 levels of tiebreakers to handle all the edge cases.

## Things I'd do differently

- Use a proper CRDT library instead of rolling my own (though I learned more this way)
- Add syntax highlighting (Monaco editor or CodeMirror)
- Real WebRTC instead of localStorage hack
- Better cursor rendering (right now it's just approximate positioning)
- Undo/redo that's CRDT-aware

## Contributing

This started as a learning project but if you want to improve it, go ahead! Open an issue or PR.

The code has comments explaining the tricky parts. If something's confusing, that's probably a place where I need better comments.

## Resources that helped

- [CRDT Tech Report](https://hal.inria.fr/inria-00555588/document) - The paper that explains how this all works
- [Logoot Algorithm](https://hal.archives-ouvertes.fr/hal-00432368/document) - Similar approach to character ordering
- Google's OT explanation from the Wave days (now archived)
- Lots of trial and error with console.log

## License

MIT - do whatever you want with it

---

Built because I was curious how Google Docs works. Turned out to be way more complicated than I expected, but now I get it.

If you find bugs (you probably will), open an issue. If you fix bugs, even better.