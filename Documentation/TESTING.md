# Testing Guide - Reproducing and Verifying Bug Fixes

This guide helps you reproduce the original bugs and verify they've been fixed.

## Setup

1. Open `index.html` in a browser
2. Open browser DevTools console (F12)
3. Open the same page in 2-3 additional tabs

## Test 1: Race Condition in Simultaneous Edits

### Original Bug Behavior
When two users edit the same position simultaneously, text becomes corrupted.

### Steps to Reproduce (if bug existed):
1. **Tab 1**: Type "Hello" and place cursor at end
2. **Tab 2**: Type "Hello" and place cursor at end
3. **Tab 1**: Type " World" rapidly
4. **Tab 2**: Type " There" at the same time
5. **Expected Bug**: Garbled text like "Hello Wor Therld" or inconsistent state across tabs

### Verification (Bug is Fixed):
1. Follow same steps
2. **Actual Result**: Both edits are preserved correctly
3. **Check**: Both tabs show identical text (eventual consistency)
4. **Why it works**: Vector clocks ensure deterministic operation ordering

### Debug Output:
```javascript
// In console
app.crdt.getState()
// Should show:
// - vectorClock with entries for each site
// - operations in deterministic order
```

---

## Test 2: Out-of-Bounds After Deletion

### Original Bug Behavior
Deleting a character causes concurrent operations to crash or insert at wrong position.

### Steps to Reproduce (if bug existed):
1. **Tab 1**: Type "Hello World"
2. **Tab 2**: Same text appears
3. **Tab 1**: Delete "o" (position 4) in "Hello"
4. **Tab 2**: Immediately insert "!" at position 5
5. **Expected Bug**: Console error "Index out of bounds" or character at wrong spot

### Verification (Bug is Fixed):
1. Follow same steps
2. **Actual Result**: Character inserts correctly, no errors
3. **Check**: Both tabs converge to same text
4. **Why it works**: Tombstones maintain stable positions

### Debug Output:
```javascript
// In console
app.crdt.characters.filter(c => !c.visible)
// Should show deleted characters (tombstones)
// These maintain positions for concurrent ops
```

---

## Test 3: Cursor Position Jumps

### Original Bug Behavior
Your cursor jumps to wrong position when someone else edits before your cursor.

### Steps to Reproduce (if bug existed):
1. **Tab 1**: Type "The quick brown fox"
2. **Tab 1**: Place cursor at position 15 (before "fox")
3. **Tab 2**: Insert "really " at position 4 (after "The ")
4. **Expected Bug**: Tab 1's cursor stays at position 15 instead of moving to 22

### Verification (Bug is Fixed):
1. Follow same steps
2. **Actual Result**: Cursor automatically adjusts to position 22
3. **Check**: Type in Tab 1 - characters insert at correct position
4. **Why it works**: Cursor positions are transformed using vector clocks

### Visual Test:
- Enable cursor visualization
- Move cursor in one tab
- Make edits in another tab
- Watch cursor indicator adjust in real-time

---

## Test 4: Infinite Loop (Recursive Updates)

### Original Bug Behavior
Setting textarea value triggers input event, causing infinite loop and browser freeze.

### Steps to Reproduce (if bug existed):
1. Type rapidly in one tab
2. **Expected Bug**: Browser freezes, "Maximum call stack exceeded" error

### Verification (Bug is Fixed):
1. Type as fast as possible in any tab
2. **Actual Result**: No freezing, smooth updates
3. **Check**: No console errors
4. **Why it works**: `isUpdating` flag prevents recursive calls

### Code Check:
```javascript
// editor.js
handleInput(e) {
    if (this.isUpdating) return; // This prevents the loop
    // ...
}
```

---

## Test 5: Memory Leak from Tombstones

### Original Bug Behavior
Long editing sessions cause memory to grow unbounded.

### Steps to Reproduce (if bug existed):
1. Type and delete repeatedly (1000+ operations)
2. Check memory usage in DevTools (Performance tab)
3. **Expected Bug**: Memory grows to several hundred MB

### Verification (Bug is Fixed):
1. Run in console:
```javascript
// Generate 1000 operations
for (let i = 0; i < 1000; i++) {
    app.editor.insertText('x');
    setTimeout(() => {
        app.crdt.localDelete(0);
    }, 10);
}

// Wait a moment, then check:
app.crdt.getState()
// tombstoneCount should be < 1000 (old ones garbage collected)

// Manually trigger GC
app.crdt.garbageCollect(100); // Keep only 100 recent tombstones
app.crdt.getState()
// Now tombstoneCount should be ~100
```

---

## Advanced Testing Scenarios

### Scenario 1: Network Partition
Simulate temporary network outage.

```javascript
// Tab 1 console
app.simulateOffline();
// Make edits...
// Tab 1 shows edits, Tab 2 doesn't

// Reconnect
app.simulateOnline();
// Edits sync immediately
```

### Scenario 2: High Latency Network
```javascript
// Simulate 500ms network delay
app.simulateNetworkLatency(500);

// Type in one tab
// Notice ~500ms delay before appearing in other tabs
// But operations still arrive in correct order!
```

### Scenario 3: Three-Way Merge
Most complex case - 3 users editing same position.

1. Open 3 tabs
2. All tabs type "Start"
3. **Tab 1**: Insert "A" at position 5
4. **Tab 2**: Insert "B" at position 5 (simultaneously)
5. **Tab 3**: Insert "C" at position 5 (simultaneously)
6. **Result**: All tabs converge to same order (e.g., "StartABC")
7. **Why**: Deterministic ordering by vector clock → site ID

---

## Performance Testing

### Test Operation Throughput
```javascript
// Measure how many ops/second the CRDT can handle
console.time('1000 operations');
for (let i = 0; i < 1000; i++) {
    app.crdt.localInsert(0, 'x');
}
console.timeEnd('1000 operations');
// Should complete in < 100ms
```

### Test with Large Document
```javascript
// Generate large document (10,000 characters)
const largeText = 'x'.repeat(10000);
app.editor.setValue(largeText);

// Now try editing
// Should remain responsive
```

---

## Debugging Tips

### Enable Verbose Logging
```javascript
window.DEBUG_MODE = true;
// Now all CRDT operations are logged to console
```

### Monitor Operations Log
Watch the "OPERATIONS LOG" panel in the UI - it shows every CRDT operation in real-time.

### Inspect CRDT State
```javascript
// Check current state
app.crdt.getState()

// Output:
// {
//     siteId: "user-abc123",
//     vectorClock: { "user-abc123": 42, "user-xyz789": 17 },
//     characterCount: 150,      // Total chars (including tombstones)
//     visibleCount: 120,        // Visible chars
//     tombstoneCount: 30,       // Deleted chars
//     operations: 200           // Total operations
// }
```

### Examine Operations History
```javascript
// View all operations
app.crdt.operationHistory

// View last 10 operations
app.crdt.operationHistory.slice(-10)
```

### Check Peers
```javascript
// See connected peers
app.syncEngine.getPeers()

// Get peer count
app.syncEngine.getPeerCount()
```

---

## Expected Behaviors

### ✅ Correct Behaviors

1. **Eventually Consistent**: All tabs show identical text within 100ms
2. **No Lost Edits**: Every character typed appears somewhere
3. **Deterministic**: Same operations → same result every time
4. **No Crashes**: Can type indefinitely without errors
5. **Memory Stable**: Long sessions don't cause memory leaks

### ❌ What Should NOT Happen

1. **Text Corruption**: Characters mixed up or duplicated
2. **Lost Characters**: Typed characters disappear
3. **Divergent States**: Different tabs show different text permanently
4. **Browser Freeze**: UI becomes unresponsive
5. **Console Errors**: Uncaught exceptions or warnings

---

## Benchmarks

Expected performance on modern hardware:

- **Operation Processing**: 10,000+ ops/second
- **Network Sync**: < 50ms latency in demo mode
- **UI Update**: 60fps even during concurrent edits
- **Memory**: < 50MB for 10,000 character document
- **Startup**: < 100ms initialization time

---

## Troubleshooting

### Problem: Changes not syncing between tabs
**Solution**: Check browser localStorage is enabled. Try hard refresh (Ctrl+Shift+R).

### Problem: Console shows errors
**Solution**: Check browser compatibility (requires ES6). Use Chrome/Firefox/Edge.

### Problem: UI feels laggy
**Solution**: Reduce network latency (`app.simulateNetworkLatency(0)`). Check if too many operations accumulated.

### Problem: Tabs show different text
**Solution**: This should NEVER happen. If it does, it's a bug! Please report with steps to reproduce.

---

## Success Criteria

Your implementation passes all tests if:

- ✅ All 5 bug tests show "Bug is Fixed" behavior
- ✅ No console errors during any test
- ✅ All tabs converge to identical text
- ✅ Performance benchmarks met
- ✅ No memory leaks after extended use

---

## Hackathon Demo Script

For maximum impact when demoing:

1. **Open 3 browser tabs** side-by-side
2. **Type "Hello" simultaneously** in all tabs
3. **Show Operations Log** - point out vector clocks
4. **Delete concurrently** in two tabs - no crashes!
5. **Enable network latency** - show operations still work correctly
6. **Explain the hardest bug** (race condition) while showing the code
7. **Show CRDT state** in console with explanation

Time: ~5 minutes for full demo

---

Questions? Check the inline code comments - every complex section is documented!
