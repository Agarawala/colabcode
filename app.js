/**
 * Main Application
 * Initializes and coordinates all components
 */

class CollabCodeApp {
    constructor() {
        // Generate unique site ID for this user/session
        this.siteId = this.generateSiteId();
        this.userName = this.generateUserName();
        this.userColor = this.generateUserColor();
        
        // Initialize CRDT
        this.crdt = new CRDT(this.siteId);
        
        // Initialize sync engine
        this.syncEngine = new SyncEngine(
            this.crdt,
            (op) => this.handleRemoteOperation(op),
            (siteId, position, selection) => this.handleCursorUpdate(siteId, position, selection),
            (peerId) => this.handlePeerJoin(peerId),
            (peerId) => this.handlePeerLeave(peerId)
        );
        
        // Initialize editor
        const textarea = document.getElementById('editor');
        this.editor = new EditorController(textarea, this.crdt, this.syncEngine);
        
        // Remote cursors
        this.remoteCursors = new Map();
        
        // UI state
        this.undoStack = [];
        this.redoStack = [];
        
        this.setupUI();
        this.startUpdateLoop();
        
        // Log initialization
        this.logOperation('System initialized');
        this.logOperation(`Site ID: ${this.siteId.substring(0, 20)}...`);
        
        console.log('╔════════════════════════════════════════╗');
        console.log('║   CollabCode Initialized Successfully ║');
        console.log('╚════════════════════════════════════════╝');
        console.log('📌 Site ID:', this.siteId);
        console.log('📌 User Name:', this.userName);
        console.log('📌 Session ID:', this.syncEngine.sessionId);
        console.log('');
        console.log('💡 Open this same URL in another tab to test collaboration!');
        console.log('💡 Type in one tab and watch it appear in the other!');
        console.log('');
        console.log('🔧 Debug Commands:');
        console.log('   app.crdt.getState()          - View CRDT state');
        console.log('   app.syncEngine.getPeerCount() - Count connected peers');
        console.log('   window.DEBUG_MODE = true     - Enable verbose logging');
    }

    generateSiteId() {
        // Generate unique ID for THIS TAB/SESSION
        // Each tab needs a different ID to detect peers
        return 'user-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    }

    generateUserName() {
        // Check if we already have a name saved
        let userName = localStorage.getItem('collab-user-name');
        if (userName) {
            return userName;
        }
        
        // Generate new name and save it
        const adjectives = ['Swift', 'Bright', 'Clever', 'Bold', 'Quick', 'Smart', 'Wise', 'Sharp'];
        const nouns = ['Coder', 'Hacker', 'Dev', 'Engineer', 'Builder', 'Maker', 'Creator'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        userName = `${adj}${noun}`;
        
        // Save for next time
        localStorage.setItem('collab-user-name', userName);
        return userName;
    }

    generateUserColor() {
        const colors = [
            '#00ff41', '#ff0080', '#00ffff', '#ffff00', 
            '#ff00ff', '#00ff00', '#ff6600', '#0080ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupUI() {
        // Set user info
        document.getElementById('userName').textContent = this.userName;
        document.getElementById('userColor').style.background = this.userColor;
        document.getElementById('sessionId').textContent = this.syncEngine.sessionId;

        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.showShareModal();
        });

        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideShareModal();
        });

        // Copy link button
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            const input = document.getElementById('shareLinkInput');
            input.select();
            document.execCommand('copy');
            
            const btn = document.getElementById('copyLinkBtn');
            const originalText = btn.textContent;
            btn.textContent = 'COPIED!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        });

        // Language select
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.logOperation(`Language changed to ${e.target.value}`);
        });

        // Undo/Redo buttons
        document.getElementById('undoBtn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.redo();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            if (confirm('Clear all content? This cannot be undone.')) {
                this.editor.clear();
                this.logOperation('Document cleared');
            }
        });

        // Close modal on background click
        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.hideShareModal();
            }
        });
    }

    showShareModal() {
        const modal = document.getElementById('shareModal');
        const input = document.getElementById('shareLinkInput');
        
        // Generate shareable link (in production, this would be a real URL)
        const shareLink = `${window.location.origin}${window.location.pathname}?session=${this.syncEngine.sessionId}`;
        input.value = shareLink;
        
        modal.classList.add('active');
    }

    hideShareModal() {
        const modal = document.getElementById('shareModal');
        modal.classList.remove('active');
    }

    handleRemoteOperation(operation) {
        console.log('🔄 Handling remote operation:', operation.type, operation);
        this.editor.handleRemoteOperation(operation);
        
        // Log operation
        const opType = operation.type === 'insert' ? 'INSERT' : 'DELETE';
        const char = operation.char ? operation.char.value : '';
        this.logOperation(`Remote ${opType}: ${char ? `"${char}"` : 'char'} at pos ${operation.position}`);
    }

    handleCursorUpdate(siteId, position, selection) {
        this.updateRemoteCursor(siteId, position, selection);
    }

    handlePeerJoin(peerId) {
        console.log('🟢 Peer joined:', peerId);
        this.addUserToList(peerId);
        this.logOperation(`Peer joined: ${peerId.substring(0, 15)}...`);
        this.updateCursorCount();
    }

    handlePeerLeave(peerId) {
        console.log('🔴 Peer left:', peerId);
        this.removeUserFromList(peerId);
        this.removeRemoteCursor(peerId);
        this.logOperation(`Peer left: ${peerId.substring(0, 15)}...`);
        this.updateCursorCount();
    }

    addUserToList(peerId) {
        const usersList = document.getElementById('usersList');
        const existingUser = document.getElementById(`user-${peerId}`);
        
        if (!existingUser) {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.id = `user-${peerId}`;
            userItem.style.borderLeftColor = this.getUserColor(peerId);
            
            const dot = document.createElement('div');
            dot.className = 'user-dot';
            dot.style.background = this.getUserColor(peerId);
            
            const name = document.createElement('span');
            name.textContent = this.getUserName(peerId);
            
            userItem.appendChild(dot);
            userItem.appendChild(name);
            usersList.appendChild(userItem);
        }
    }

    removeUserFromList(peerId) {
        const userItem = document.getElementById(`user-${peerId}`);
        if (userItem) {
            userItem.remove();
        }
    }

    getUserColor(peerId) {
        // Generate consistent color for peer
        const hash = peerId.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        const colors = ['#00ff41', '#ff0080', '#00ffff', '#ffff00', '#ff00ff', '#ff6600'];
        return colors[Math.abs(hash) % colors.length];
    }

    getUserName(peerId) {
        return peerId.substring(0, 12);
    }

    updateRemoteCursor(siteId, position, selection) {
        const overlay = document.getElementById('cursorsOverlay');
        if (!overlay) return;

        let cursor = this.remoteCursors.get(siteId);
        
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'remote-cursor';
            cursor.style.background = this.getUserColor(siteId);
            
            const label = document.createElement('div');
            label.className = 'cursor-label';
            label.textContent = this.getUserName(siteId);
            label.style.background = this.getUserColor(siteId);
            
            cursor.appendChild(label);
            overlay.appendChild(cursor);
            this.remoteCursors.set(siteId, cursor);
        }

        // Calculate cursor position
        const textarea = document.getElementById('editor');
        const text = textarea.value;
        
        const beforeCursor = text.substring(0, position);
        const lines = beforeCursor.split('\n');
        const lineNumber = lines.length - 1;
        const columnNumber = lines[lines.length - 1].length;
        
        // Approximate positioning (in production, use proper measurement)
        const lineHeight = 22.4; // 14px * 1.6 line-height
        const charWidth = 8.4; // Approximate monospace char width
        
        cursor.style.top = `${lineNumber * lineHeight}px`;
        cursor.style.left = `${columnNumber * charWidth}px`;
    }

    removeRemoteCursor(siteId) {
        const cursor = this.remoteCursors.get(siteId);
        if (cursor) {
            cursor.remove();
            this.remoteCursors.delete(siteId);
        }
    }

    updateCursorCount() {
        const count = 1 + this.syncEngine.getPeerCount(); // 1 for local + peers
        const cursorCountEl = document.getElementById('cursorCount');
        if (cursorCountEl) {
            cursorCountEl.textContent = count;
        }
    }

    logOperation(message) {
        const log = document.getElementById('operationsLog');
        if (!log) return;

        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        
        log.appendChild(entry);
        
        // Keep only last 20 entries
        while (log.children.length > 20) {
            log.removeChild(log.firstChild);
        }
        
        // Scroll to bottom
        log.scrollTop = log.scrollHeight;
    }

    undo() {
        // Simplified undo - in production, implement proper undo/redo with CRDT
        this.logOperation('Undo requested (feature in development)');
    }

    redo() {
        // Simplified redo
        this.logOperation('Redo requested (feature in development)');
    }

    startUpdateLoop() {
        // Update stats periodically
        setInterval(() => {
            this.updateStats();
        }, 1000);
    }

    updateStats() {
        // Update latency (simulated)
        const latencyEl = document.getElementById('latency');
        if (latencyEl) {
            latencyEl.textContent = `${this.syncEngine.latency}ms`;
        }

        // Update connection status
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (this.syncEngine.isOnline) {
            statusDot.classList.remove('status-offline');
            statusDot.classList.add('status-online');
            statusText.textContent = 'ONLINE';
        } else {
            statusDot.classList.remove('status-online');
            statusDot.classList.add('status-offline');
            statusText.textContent = 'OFFLINE';
        }

        // Update CRDT state info
        const state = this.crdt.getState();
        this.logDebug(state);
    }

    logDebug(state) {
        // Log to console for debugging
        if (window.DEBUG_MODE) {
            console.log('CRDT State:', state);
        }
    }

    // Testing helpers
    simulateNetworkLatency(ms) {
        this.syncEngine.setLatency(ms);
        this.logOperation(`Network latency set to ${ms}ms`);
    }

    simulateOffline() {
        this.syncEngine.setOnline(false);
        this.logOperation('Gone offline (simulated)');
    }

    simulateOnline() {
        this.syncEngine.setOnline(true);
        this.logOperation('Back online (simulated)');
    }
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new CollabCodeApp();
    
    // Expose for debugging
    window.app = app;
    window.DEBUG_MODE = false; // Set to true for verbose logging
    
    // Add welcome message
    setTimeout(() => {
        const welcomeText = `// Welcome to CollabCode!
// This is a real-time collaborative code editor with CRDT synchronization.
//
// Try these features:
// 1. Open this page in multiple tabs to see real-time collaboration
// 2. Type simultaneously in different tabs - no conflicts!
// 3. Check the operations log to see CRDT operations
//
// Technical Details:
// - Uses Conflict-free Replicated Data Types (CRDT)
// - Vector clocks for causality tracking
// - Operational transformation for cursor positioning
// - Tombstone markers prevent position conflicts
//
// Known challenging bugs that were fixed:
// 1. Race conditions during simultaneous edits
// 2. Cursor jumping after remote operations
// 3. Out-of-bounds errors with concurrent deletions
//
// Start typing below!

`;
        app.editor.setValue(welcomeText);
        app.editor.textarea.setSelectionRange(0, 0);
    }, 100);
});

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app && app.syncEngine) {
        app.syncEngine.destroy();
    }
});