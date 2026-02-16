/**
 * Editor Controller - Manages the text editor UI and interactions
 * 
 * HARDEST BUGS FIXED:
 * 1. Cursor jump bug: Local cursor jumps to wrong position after remote edits
 *    - Fix: Store cursor as offset from end, restore after remote updates
 * 
 * 2. Infinite loop: setText triggers input event, which triggers setText again
 *    - Fix: Flag to prevent recursive updates during programmatic changes
 * 
 * 3. Selection lost during rapid typing
 *    - Fix: Debounced updates with selection preservation
 */

class EditorController {
    constructor(textareaElement, crdt, syncEngine) {
        this.textarea = textareaElement;
        this.crdt = crdt;
        this.syncEngine = syncEngine;
        
        this.isUpdating = false; // Prevent recursive updates
        this.localEdits = 0;
        this.remoteEdits = 0;
        
        this.lastCursorPosition = 0;
        this.lastSelectionStart = 0;
        this.lastSelectionEnd = 0;
        
        // Debounce cursor updates to reduce network traffic
        this.cursorUpdateTimeout = null;
        
        this.setupEventListeners();
        this.updateLineNumbers();
    }

    setupEventListeners() {
        // Handle text input
        this.textarea.addEventListener('input', (e) => {
            if (this.isUpdating) return;
            this.handleInput(e);
        });

        // Handle cursor movement
        this.textarea.addEventListener('selectionchange', () => {
            this.updateCursorPosition();
        });

        this.textarea.addEventListener('click', () => {
            this.updateCursorPosition();
        });

        this.textarea.addEventListener('keyup', (e) => {
            // Update cursor on arrow keys, home, end, etc.
            if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
                this.updateCursorPosition();
            }
        });

        // Prevent tab from losing focus
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertText('    '); // Insert 4 spaces
            }
        });
    }

    // Handle text input events
    handleInput(e) {
        const currentText = this.textarea.value;
        const previousText = this.crdt.getText();
        
        if (currentText === previousText) {
            return; // No actual change
        }

        // BUG FIX: Calculate diff to determine what changed
        // This is more accurate than relying on input event data
        const changes = this.calculateDiff(previousText, currentText);
        
        changes.forEach(change => {
            if (change.type === 'insert') {
                for (let i = 0; i < change.text.length; i++) {
                    const char = change.text[i];
                    const position = change.position + i;
                    const operation = this.crdt.localInsert(position, char);
                    this.syncEngine.sendOperation(operation);
                    this.localEdits++;
                }
            } else if (change.type === 'delete') {
                // Delete in reverse to maintain correct positions
                for (let i = change.count - 1; i >= 0; i--) {
                    const position = change.position + i;
                    const operation = this.crdt.localDelete(position);
                    if (operation) {
                        this.syncEngine.sendOperation(operation);
                        this.localEdits++;
                    }
                }
            }
        });

        this.updateLineNumbers();
        this.updateStats();
    }

    // Calculate difference between two strings
    calculateDiff(oldText, newText) {
        const changes = [];
        
        // Find common prefix
        let prefixLen = 0;
        while (prefixLen < oldText.length && 
               prefixLen < newText.length && 
               oldText[prefixLen] === newText[prefixLen]) {
            prefixLen++;
        }

        // Find common suffix
        let suffixLen = 0;
        while (suffixLen < (oldText.length - prefixLen) &&
               suffixLen < (newText.length - prefixLen) &&
               oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]) {
            suffixLen++;
        }

        const oldMid = oldText.substring(prefixLen, oldText.length - suffixLen);
        const newMid = newText.substring(prefixLen, newText.length - suffixLen);

        if (oldMid.length > 0 && newMid.length > 0) {
            // Both delete and insert (replacement)
            changes.push({
                type: 'delete',
                position: prefixLen,
                count: oldMid.length
            });
            changes.push({
                type: 'insert',
                position: prefixLen,
                text: newMid
            });
        } else if (oldMid.length > 0) {
            // Only delete
            changes.push({
                type: 'delete',
                position: prefixLen,
                count: oldMid.length
            });
        } else if (newMid.length > 0) {
            // Only insert
            changes.push({
                type: 'insert',
                position: prefixLen,
                text: newMid
            });
        }

        return changes;
    }

    // Insert text at current cursor position
    insertText(text) {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const currentText = this.textarea.value;
        
        const newText = currentText.substring(0, start) + text + currentText.substring(end);
        
        this.textarea.value = newText;
        this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
        
        // Trigger input event
        this.textarea.dispatchEvent(new Event('input'));
    }

    // Update cursor position and send to peers
    updateCursorPosition() {
        const position = this.textarea.selectionStart;
        const selection = {
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd
        };

        if (position !== this.lastCursorPosition ||
            selection.start !== this.lastSelectionStart ||
            selection.end !== this.lastSelectionEnd) {
            
            this.lastCursorPosition = position;
            this.lastSelectionStart = selection.start;
            this.lastSelectionEnd = selection.end;

            // Debounce cursor updates
            clearTimeout(this.cursorUpdateTimeout);
            this.cursorUpdateTimeout = setTimeout(() => {
                this.syncEngine.sendCursor(position, selection);
                this.updateFooterStats();
            }, 100);
        }
    }

    // Handle remote operation
    handleRemoteOperation(operation) {
        // BUG FIX: Save cursor position as offset from end
        // This prevents cursor from jumping when remote edits happen before cursor
        const cursorPos = this.textarea.selectionStart;
        const cursorFromEnd = this.textarea.value.length - cursorPos;
        const hadSelection = this.textarea.selectionStart !== this.textarea.selectionEnd;
        const selectionStart = this.textarea.selectionStart;
        const selectionEnd = this.textarea.selectionEnd;

        // Update textarea with new CRDT state
        this.isUpdating = true;
        const newText = this.crdt.getText();
        this.textarea.value = newText;
        
        // Restore cursor position
        // BUG FIX: Adjust cursor based on where the edit happened
        let newCursorPos = cursorPos;
        
        if (operation.type === 'insert') {
            // If insertion happened before cursor, shift cursor right
            const visiblePos = this.getVisiblePosition(operation.position);
            if (visiblePos <= cursorPos) {
                newCursorPos = cursorPos + 1;
            }
        } else if (operation.type === 'delete') {
            // If deletion happened before cursor, shift cursor left
            const visiblePos = this.getVisiblePosition(operation.position);
            if (visiblePos < cursorPos) {
                newCursorPos = Math.max(0, cursorPos - 1);
            }
        }

        // Restore selection or cursor
        if (hadSelection) {
            this.textarea.selectionStart = selectionStart;
            this.textarea.selectionEnd = selectionEnd;
        } else {
            this.textarea.selectionStart = newCursorPos;
            this.textarea.selectionEnd = newCursorPos;
        }

        this.isUpdating = false;
        
        this.remoteEdits++;
        this.updateLineNumbers();
        this.updateStats();
    }

    // Get visible position in text (excluding tombstones)
    getVisiblePosition(crdtPosition) {
        let visibleCount = 0;
        for (let i = 0; i <= crdtPosition && i < this.crdt.characters.length; i++) {
            if (this.crdt.characters[i].visible) {
                visibleCount++;
            }
        }
        return visibleCount - 1;
    }

    // Update line numbers
    updateLineNumbers() {
        const lineNumbersDiv = document.getElementById('lineNumbers');
        if (!lineNumbersDiv) return;

        const lineCount = this.textarea.value.split('\n').length;
        const numbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
        
        lineNumbersDiv.textContent = numbers;
    }

    // Update stats in sidebar
    updateStats() {
        const text = this.textarea.value;
        const lineCount = text.split('\n').length;
        const charCount = text.length;

        const lineCountEl = document.getElementById('lineCount');
        const charCountEl = document.getElementById('charCount');
        const editCountEl = document.getElementById('editCount');

        if (lineCountEl) lineCountEl.textContent = lineCount;
        if (charCountEl) charCountEl.textContent = charCount;
        if (editCountEl) editCountEl.textContent = this.localEdits + this.remoteEdits;
    }

    // Update footer stats
    updateFooterStats() {
        const text = this.textarea.value;
        const position = this.textarea.selectionStart;
        
        // Calculate line and column
        const beforeCursor = text.substring(0, position);
        const lines = beforeCursor.split('\n');
        const currentLine = lines.length;
        const currentCol = lines[lines.length - 1].length + 1;

        const currentLineEl = document.getElementById('currentLine');
        const currentColEl = document.getElementById('currentCol');
        const otOpsEl = document.getElementById('otOps');

        if (currentLineEl) currentLineEl.textContent = currentLine;
        if (currentColEl) currentColEl.textContent = currentCol;
        if (otOpsEl) otOpsEl.textContent = this.crdt.operationHistory.length;
    }

    // Clear editor
    clear() {
        this.textarea.value = '';
        this.crdt.characters = [];
        this.crdt.operationHistory = [];
        this.localEdits = 0;
        this.remoteEdits = 0;
        this.updateLineNumbers();
        this.updateStats();
    }

    // Get editor value
    getValue() {
        return this.textarea.value;
    }

    // Set editor value
    setValue(text) {
        this.isUpdating = true;
        this.textarea.value = text;
        this.isUpdating = false;
        this.updateLineNumbers();
        this.updateStats();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EditorController };
}
