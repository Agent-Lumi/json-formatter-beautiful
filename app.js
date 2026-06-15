class JSONFormatter {
    constructor() {
        this.jsonInput = document.getElementById('jsonInput');
        this.jsonOutput = document.getElementById('jsonOutput');
        this.formatBtn = document.getElementById('formatBtn');
        this.minifyBtn = document.getElementById('minifyBtn');
        this.validateBtn = document.getElementById('validateBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.errorMsg = document.getElementById('errorMsg');
        this.indentSize = document.getElementById('indentSize');
        this.sortKeys = document.getElementById('sortKeys');
        this.escapeUnicode = document.getElementById('escapeUnicode');
        this.autoSave = document.getElementById('autoSave');
        this.autoFormat = document.getElementById('autoFormat');
        this.statsSection = document.getElementById('statsSection');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.importBtn = document.getElementById('importBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Store collapse state
        this.collapseState = new Map();
        this.currentData = null;
        
        // Undo/Redo history
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        // Theme state
        this.isDarkMode = true;
        
        this.init();
    }
    
    init() {
        this.loadSavedData();
        this.addEventListeners();
        this.setupKeyboardShortcuts();
        this.setupUndoRedo();
        this.loadTheme();
        this.setupToastManager();
        this.setupDiffModal();
        if (!this.jsonInput.value) {
            this.loadSampleData();
        }
    }
    
    loadSavedData() {
        const saved = localStorage.getItem('jsonFormatterInput');
        if (saved) {
            this.jsonInput.value = saved;
        }
    }
    
    saveData() {
        if (this.autoSave && this.autoSave.checked) {
            localStorage.setItem('jsonFormatterInput', this.jsonInput.value);
        }
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('jsonFormatterTheme');
        if (savedTheme !== null) {
            this.isDarkMode = savedTheme === 'dark';
        }
        this.applyTheme();
    }
    
    applyTheme() {
        document.body.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        if (this.themeToggle) {
            const icon = this.themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = this.isDarkMode ? '🌙' : '☀️';
        }
    }
    
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('jsonFormatterTheme', this.isDarkMode ? 'dark' : 'light');
        this.showToast(this.isDarkMode ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
    }
    
    addEventListeners() {
        if (this.formatBtn) this.formatBtn.addEventListener('click', () => this.format());
        if (this.minifyBtn) this.minifyBtn.addEventListener('click', () => this.minify());
        if (this.validateBtn) this.validateBtn.addEventListener('click', () => this.validate());
        if (this.clearBtn) this.clearBtn.addEventListener('click', () => this.clear());
        if (this.copyBtn) this.copyBtn.addEventListener('click', () => this.copy());
        if (this.downloadBtn) this.downloadBtn.addEventListener('click', () => this.download());
        if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        if (this.expandAllBtn) {
            this.expandAllBtn.addEventListener('click', () => this.expandAll());
        }
        if (this.collapseAllBtn) {
            this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
        }
        
        if (this.importBtn && this.fileInput) {
            this.importBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.handleFileImport(e));
        }
        
        // Add click delegation for collapsible nodes
        if (this.jsonOutput) {
            this.jsonOutput.addEventListener('click', (e) => this.handleNodeClick(e));
        }
        
        // Tab support and auto-format in textarea
        if (this.jsonInput) {
            this.jsonInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = this.jsonInput.selectionStart;
                    const end = this.jsonInput.selectionEnd;
                    const indent = e.shiftKey ? '' : '    ';
                    this.jsonInput.value = this.jsonInput.value.substring(0, start) + indent + 
                                           this.jsonInput.value.substring(end);
                    this.jsonInput.selectionStart = this.jsonInput.selectionEnd = start + indent.length;
                }
            });
            
            // Auto-save to history on input
            let debounceTimer;
            this.jsonInput.addEventListener('input', () => {
                this.saveData();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.saveToHistory(), 1000);
            });
            
            // Auto-format on paste if enabled
            this.jsonInput.addEventListener('paste', () => {
                if (this.autoFormat && this.autoFormat.checked) {
                    setTimeout(() => this.format(), 100);
                }
            });
        }
    }
    
    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.jsonInput.value = event.target.result;
            this.saveToHistory();
            this.format();
            this.showToast(`📁 Imported: ${file.name}`);
        };
        reader.onerror = () => {
            this.showToast('❌ Failed to read file');
        };
        reader.readAsText(file);
        
        // Reset file input
        this.fileInput.value = '';
    }
    
    download() {
        const content = this.jsonOutput.textContent;
        if (!content || content.includes('// Formatted JSON')) {
            this.showToast('❌ Nothing to download!');
            return;
        }
        
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `formatted-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('💾 Downloaded!');
    }
    
    setupDiffModal() {
        const diffBtn = document.getElementById('diffBtn');
        const diffModal = document.getElementById('diffModal');
        const closeDiffBtn = document.getElementById('closeDiffBtn');
        const compareBtn = document.getElementById('compareBtn');
        const clearDiffBtn = document.getElementById('clearDiffBtn');
        
        if (diffBtn && diffModal) {
            diffBtn.addEventListener('click', () => {
                diffModal.style.display = 'flex';
                // Pre-fill with current input if available
                const diffInput1 = document.getElementById('diffInput1');
                if (diffInput1 && this.jsonInput.value && !diffInput1.value) {
                    diffInput1.value = this.jsonInput.value;
                }
            });
        }
        
        if (closeDiffBtn && diffModal) {
            closeDiffBtn.addEventListener('click', () => {
                diffModal.style.display = 'none';
            });
        }
        
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compareJSON());
        }
        
        if (clearDiffBtn) {
            clearDiffBtn.addEventListener('click', () => {
                const diffInput1 = document.getElementById('diffInput1');
                const diffInput2 = document.getElementById('diffInput2');
                const diffResult = document.getElementById('diffResult');
                const diffOutput = document.getElementById('diffOutput');
                if (diffInput1) diffInput1.value = '';
                if (diffInput2) diffInput2.value = '';
                if (diffResult) diffResult.style.display = 'none';
                if (diffOutput) diffOutput.textContent = '';
            });
        }
        
        // Close modal on outside click
        if (diffModal) {
            diffModal.addEventListener('click', (e) => {
                if (e.target === diffModal) {
                    diffModal.style.display = 'none';
                }
            });
        }
    }
    
    compareJSON() {
        const diffInput1 = document.getElementById('diffInput1');
        const diffInput2 = document.getElementById('diffInput2');
        const diffResult = document.getElementById('diffResult');
        const diffOutput = document.getElementById('diffOutput');
        
        if (!diffInput1 || !diffInput2 || !diffResult || !diffOutput) return;
        
        const json1 = diffInput1.value.trim();
        const json2 = diffInput2.value.trim();
        
        if (!json1 || !json2) {
            this.showToast('❌ Please enter both JSON documents');
            return;
        }
        
        try {
            const obj1 = JSON.parse(json1);
            const obj2 = JSON.parse(json2);
            
            const differences = this.findDifferences(obj1, obj2);
            
            if (differences.length === 0) {
                diffOutput.innerHTML = '<span class="diff-same">✅ The JSON documents are identical!</span>';
            } else {
                diffOutput.innerHTML = differences.map(diff => {
                    const className = diff.type === 'added' ? 'diff-added' : 
                                     diff.type === 'removed' ? 'diff-removed' : 'diff-changed';
                    const icon = diff.type === 'added' ? '+' : diff.type === 'removed' ? '−' : '~';
                    return `<div class="diff-line ${className}"><span class="diff-icon">${icon}</span> ${diff.path}: ${diff.message}</div>`;
                }).join('');
            }
            
            diffResult.style.display = 'block';
        } catch (e) {
            this.showToast(`❌ Invalid JSON: ${e.message}`);
        }
    }
    
    findDifferences(obj1, obj2, path = '') {
        const differences = [];
        
        if (typeof obj1 !== typeof obj2) {
            differences.push({
                path: path || 'root',
                type: 'changed',
                message: `Type changed from ${typeof obj1} to ${typeof obj2}`
            });
            return differences;
        }
        
        if (obj1 === null && obj2 !== null) {
            differences.push({ path: path || 'root', type: 'changed', message: `Changed from null to ${JSON.stringify(obj2)}` });
            return differences;
        }
        
        if (obj1 !== null && obj2 === null) {
            differences.push({ path: path || 'root', type: 'changed', message: `Changed to null from ${JSON.stringify(obj1)}` });
            return differences;
        }
        
        if (typeof obj1 !== 'object') {
            if (obj1 !== obj2) {
                differences.push({
                    path: path || 'root',
                    type: 'changed',
                    message: `Value changed from ${JSON.stringify(obj1)} to ${JSON.stringify(obj2)}`
                });
            }
            return differences;
        }
        
        // Handle arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            const maxLen = Math.max(obj1.length, obj2.length);
            for (let i = 0; i < maxLen; i++) {
                const newPath = `${path}[${i}]`;
                if (i >= obj1.length) {
                    differences.push({ path: newPath, type: 'added', message: `Added: ${JSON.stringify(obj2[i])}` });
                } else if (i >= obj2.length) {
                    differences.push({ path: newPath, type: 'removed', message: `Removed: ${JSON.stringify(obj1[i])}` });
                } else {
                    differences.push(...this.findDifferences(obj1[i], obj2[i], newPath));
                }
            }
            return differences;
        }
        
        // Handle objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        const allKeys = new Set([...keys1, ...keys2]);
        
        for (const key of allKeys) {
            const newPath = path ? `${path}.${key}` : key;
            if (!(key in obj1)) {
                differences.push({ path: newPath, type: 'added', message: `Added key with value: ${JSON.stringify(obj2[key])}` });
            } else if (!(key in obj2)) {
                differences.push({ path: newPath, type: 'removed', message: `Removed key with value: ${JSON.stringify(obj1[key])}` });
            } else {
                differences.push(...this.findDifferences(obj1[key], obj2[key], newPath));
            }
        }
        
        return differences;
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter = Format
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.format();
            }
            // Ctrl/Cmd + Shift + M = Minify
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                this.minify();
            }
            // Ctrl/Cmd + Shift + V = Validate
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                this.validate();
            }
            // Ctrl/Cmd + Shift + C = Clear
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                this.clear();
            }
            // Ctrl/Cmd + Shift + E = Expand All
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                this.expandAll();
            }
            // Ctrl/Cmd + Shift + L = Collapse All
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.collapseAll();
            }
            // Ctrl/Cmd + Shift + D = Diff
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                const diffBtn = document.getElementById('diffBtn');
                if (diffBtn) diffBtn.click();
            }
            // Ctrl/Cmd + D = Toggle theme
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.shiftKey) {
                e.preventDefault();
                this.toggleTheme();
            }
            // Ctrl/Cmd + O = Import
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                if (this.fileInput) this.fileInput.click();
            }
            // Ctrl/Cmd + S = Download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.download();
            }
            // Ctrl/Cmd + ? = Shortcuts help
            if ((e.ctrlKey || e.metaKey) && e.key === '?') {
                e.preventDefault();
                const modal = document.getElementById('shortcutsModal');
                if (modal) modal.style.display = 'flex';
            }
        });
        
        // Close shortcuts modal
        const closeShortcutsBtn = document.getElementById('closeShortcutsBtn');
        const shortcutsModal = document.getElementById('shortcutsModal');
        if (closeShortcutsBtn && shortcutsModal) {
            closeShortcutsBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'none';
            });
            shortcutsModal.addEventListener('click', (e) => {
                if (e.target === shortcutsModal) shortcutsModal.style.display = 'none';
            });
        }
    }
    
    setupUndoRedo() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y = Redo
            if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
                e.preventDefault();
                this.redo();
            }
        });
    }
    
    saveToHistory() {
        const currentValue = this.jsonInput.value;
        // Don't save if same as last
        if (this.historyIndex >= 0 && this.history[this.historyIndex] === currentValue) {
            return;
        }
        
        // Remove future history if we're in the middle
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(currentValue);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.jsonInput.value = this.history[this.historyIndex];
            this.saveData();
            this.hideError();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.jsonInput.value = this.history[this.historyIndex];
            this.saveData();
            this.hideError();
        }
    }
    
    loadSampleData() {
        const sample = {
            "name": "JSON Formatter",
            "version": "2.1.0",
            "description": "A beautiful JSON formatter with syntax highlighting, diff comparison, and keyboard shortcuts",
            "features": [
                "Format JSON with proper indentation",
                "Minify JSON for production",
                "Validate JSON syntax",
                "Syntax highlighting with collapsible nodes",
                "JSON comparison/diff tool",
                "Keyboard shortcuts (Ctrl+Enter, Ctrl+Shift+M, etc.)",
                "Undo/Redo support",
                "Dark/Light theme toggle",
                "Auto-save to localStorage",
                "Auto-format on paste"
            ],
            "author": "Agent-Lumi",
            "github": "https://github.com/Agent-Lumi/json-formatter-beautiful",
            "stats": {
                "stars": 42,
                "forks": 12,
                "active": true
            },
            "nested": {
                "deep": {
                    "example": "value"
                }
            }
        };
        
        this.jsonInput.value = JSON.stringify(sample, null, 2);
        this.saveToHistory();
        this.saveData();
        this.format();
    }
    
    getIndent() {
        return this.indentSize && this.indentSize.checked ? 2 : 4;
    }
    
    parseJSON(text = null) {
        try {
            const jsonText = text !== null ? text : this.jsonInput.value.trim();
            if (!jsonText) {
                throw new Error('Please enter some JSON');
            }
            return JSON.parse(jsonText);
        } catch (e) {
            this.showError(e.message);
            return null;
        }
    }
    
    format() {
        const data = this.parseJSON();
        if (!data) return;
        
        this.currentData = data;
        this.hideError();
        const indent = this.getIndent();
        
        // Generate collapsible HTML
        const html = this.generateCollapsibleHTML(data, 0, '', true);
        this.jsonOutput.innerHTML = `<code>${html}</code>`;
        
        // Restore collapse state
        this.restoreCollapseState();
        
        // Update stats
        const formatted = JSON.stringify(data, null, indent);
        this.updateStats(data, formatted);
        
        this.showToast('✨ Formatted!');
    }
    
    minify() {
        const data = this.parseJSON();
        if (!data) return;
        
        this.hideError();
        const minified = JSON.stringify(data);
        this.displayOutput(minified);
        this.updateStats(data, minified);
        
        this.showToast('📦 Minified!');
    }
    
    validate() {
        const data = this.parseJSON();
        if (data) {
            this.hideError();
            this.showToast('✅ Valid JSON!');
            this.format();
        }
    }
    
    generateCollapsibleHTML(data, level, path, isLast) {
        const indent = '  '.repeat(level);
        
        if (data === null) {
            return `<span class="json-null">null</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
        }
        
        if (typeof data === 'boolean') {
            return `<span class="json-boolean">${data}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
        }
        
        if (typeof data === 'number') {
            return `<span class="json-number">${data}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
        }
        
        if (typeof data === 'string') {
            const escaped = this.escapeString(data);
            return `<span class="json-string">"${escaped}"</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
        }
        
        if (Array.isArray(data)) {
            if (data.length === 0) {
                return `<span class="json-bracket">[]</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
            }
            
            const currentPath = path || 'root';
            const itemCount = data.length;
            
            let html = `<span class="json-toggle" data-path="${currentPath}" data-type="array">`;
            html += `<span class="json-toggle-btn">▼</span>`;
            html += `<span class="json-bracket">[</span>`;
            html += `<span class="json-collapsed-count" style="display: none;"> ${itemCount} items</span>`;
            html += `</span>`;
            html += `<span class="json-toggle-content" data-path="${currentPath}">`;
            
            data.forEach((item, index) => {
                const itemPath = `${currentPath}[${index}]`;
                html += `\n${indent}  `;
                html += this.generateCollapsibleHTML(item, level + 1, itemPath, index === data.length - 1);
            });
            
            html += `\n${indent}<span class="json-bracket">]</span>`;
            html += `${isLast ? '' : '<span class="json-comma">,</span>'}`;
            html += `</span>`;
            
            return html;
        }
        
        if (typeof data === 'object') {
            const keys = this.sortKeys && this.sortKeys.checked ? Object.keys(data).sort() : Object.keys(data);
            
            if (keys.length === 0) {
                return `<span class="json-brace">{}</span>${isLast ? '' : '<span class="json-comma">,</span>'}`;
            }
            
            const currentPath = path || 'root';
            const itemCount = keys.length;
            
            let html = `<span class="json-toggle" data-path="${currentPath}" data-type="object">`;
            html += `<span class="json-toggle-btn">▼</span>`;
            html += `<span class="json-brace">{</span>`;
            html += `<span class="json-collapsed-count" style="display: none;"> ${itemCount} keys</span>`;
            html += `</span>`;
            html += `<span class="json-toggle-content" data-path="${currentPath}">`;
            
            keys.forEach((key, index) => {
                const itemPath = `${currentPath}.${key}`;
                html += `\n${indent}  `;
                html += `<span class="json-key">"${key}"</span>`;
                html += `<span class="json-colon">: </span>`;
                html += this.generateCollapsibleHTML(data[key], level + 1, itemPath, index === keys.length - 1);
            });
            
            html += `\n${indent}<span class="json-brace">}</span>`;
            html += `${isLast ? '' : '<span class="json-comma">,</span>'}`;
            html += `</span>`;
            
            return html;
        }
        
        return String(data);
    }
    
    escapeString(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }
    
    handleNodeClick(e) {
        const toggleBtn = e.target.closest('.json-toggle-btn');
        if (!toggleBtn) return;
        
        const toggle = toggleBtn.closest('.json-toggle');
        const path = toggle.dataset.path;
        const content = this.jsonOutput.querySelector(`.json-toggle-content[data-path="${path}"]`);
        const count = toggle.querySelector('.json-collapsed-count');
        
        if (!content) return;
        
        if (content.classList.contains('collapsed')) {
            // Expand
            content.classList.remove('collapsed');
            content.style.display = '';
            toggleBtn.textContent = '▼';
            toggleBtn.classList.remove('collapsed');
            if (count) count.style.display = 'none';
            this.collapseState.set(path, false);
        } else {
            // Collapse
            content.classList.add('collapsed');
            content.style.display = 'none';
            toggleBtn.textContent = '▶';
            toggleBtn.classList.add('collapsed');
            if (count) count.style.display = 'inline';
            this.collapseState.set(path, true);
        }
    }
    
    restoreCollapseState() {
        this.collapseState.forEach((isCollapsed, path) => {
            if (isCollapsed) {
                const toggle = this.jsonOutput.querySelector(`.json-toggle[data-path="${path}"]`);
                const content = this.jsonOutput.querySelector(`.json-toggle-content[data-path="${path}"]`);
                if (toggle && content) {
                    content.classList.add('collapsed');
                    content.style.display = 'none';
                    const btn = toggle.querySelector('.json-toggle-btn');
                    if (btn) {
                        btn.textContent = '▶';
                        btn.classList.add('collapsed');
                    }
                    const count = toggle.querySelector('.json-collapsed-count');
                    if (count) count.style.display = 'inline';
                }
            }
        });
    }
    
    expandAll() {
        const contents = this.jsonOutput.querySelectorAll('.json-toggle-content.collapsed');
        contents.forEach(content => {
            content.classList.remove('collapsed');
            content.style.display = '';
            const path = content.dataset.path;
            this.collapseState.set(path, false);
            
            const toggle = this.jsonOutput.querySelector(`.json-toggle[data-path="${path}"]`);
            if (toggle) {
                const btn = toggle.querySelector('.json-toggle-btn');
                if (btn) {
                    btn.textContent = '▼';
                    btn.classList.remove('collapsed');
                }
                const count = toggle.querySelector('.json-collapsed-count');
                if (count) count.style.display = 'none';
            }
        });
    }
    
    collapseAll() {
        const contents = this.jsonOutput.querySelectorAll('.json-toggle-content:not(.collapsed)');
        contents.forEach(content => {
            const path = content.dataset.path;
            if (path === 'root') return;
            
            content.classList.add('collapsed');
            content.style.display = 'none';
            this.collapseState.set(path, true);
            
            const toggle = this.jsonOutput.querySelector(`.json-toggle[data-path="${path}"]`);
            if (toggle) {
                const btn = toggle.querySelector('.json-toggle-btn');
                if (btn) {
                    btn.textContent = '▶';
                    btn.classList.add('collapsed');
                }
                const count = toggle.querySelector('.json-collapsed-count');
                if (count) count.style.display = 'inline';
            }
        });
    }
    
    displayOutput(json) {
        const highlighted = this.syntaxHighlight(json);
        this.jsonOutput.innerHTML = highlighted;
    }
    
    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
        
        return json.replace(
            /("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\d+\.?\d*)|([{}\[\]])|([:,])/g,
            (match, string, bool, number, brace, colon) => {
                if (string) {
                    const isKey = /:$/.test(json.substring(json.indexOf(match) + match.length, json.indexOf(match) + match.length + 1));
                    return `<span class="${isKey ? 'json-key' : 'json-string'}">${match}</span>`;
                }
                if (bool) return `<span class="json-boolean">${match}</span>`;
                if (number) return `<span class="json-number">${match}</span>`;
                if (brace === '{' || brace === '}') return `<span class="json-brace">${match}</span>`;
                if (brace === '[' || brace === ']') return `<span class="json-bracket">${match}</span>`;
                if (colon === ':') return `<span class="json-colon">${match}</span>`;
                if (colon === ',') return `<span class="json-comma">${match}</span>`;
                return match;
            }
        );
    }
    
    updateStats(data, formatted) {
        const size = new Blob([formatted]).size;
        const lines = formatted.split('\n').length;
        const keys = this.countKeys(data);
        const arrays = this.countArrays(data);
        const objects = this.countObjects(data);
        const depth = this.calculateDepth(data);
        
        const sizeEl = document.getElementById('sizeStat');
        const linesEl = document.getElementById('linesStat');
        const depthEl = document.getElementById('depthStat');
        const keysEl = document.getElementById('keysStat');
        const arraysEl = document.getElementById('arraysStat');
        const objectsEl = document.getElementById('objectsStat');
        
        if (sizeEl) sizeEl.textContent = this.formatBytes(size);
        if (linesEl) linesEl.textContent = lines;
        if (depthEl) depthEl.textContent = depth;
        if (keysEl) keysEl.textContent = keys;
        if (arraysEl) arraysEl.textContent = arrays;
        if (objectsEl) objectsEl.textContent = objects;
        
        if (this.statsSection) this.statsSection.style.display = 'block';
    }
    
    countKeys(obj) {
        if (typeof obj !== 'object' || obj === null) return 0;
        if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + this.countKeys(item), 0);
        return Object.keys(obj).length + Object.values(obj).reduce((sum, val) => sum + this.countKeys(val), 0);
    }
    
    countArrays(obj) {
        if (typeof obj !== 'object' || obj === null) return 0;
        if (Array.isArray(obj)) return 1 + obj.reduce((sum, item) => sum + this.countArrays(item), 0);
        return Object.values(obj).reduce((sum, val) => sum + this.countArrays(val), 0);
    }
    
    countObjects(obj) {
        if (typeof obj !== 'object' || obj === null) return 0;
        if (Array.isArray(obj)) return obj.reduce((sum, item) => sum + this.countObjects(item), 0);
        return 1 + Object.values(obj).reduce((sum, val) => sum + this.countObjects(val), 0);
    }
    
    calculateDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) return currentDepth;
        if (Array.isArray(obj)) {
            if (obj.length === 0) return currentDepth;
            return Math.max(...obj.map(item => this.calculateDepth(item, currentDepth + 1)));
        }
        const keys = Object.keys(obj);
        if (keys.length === 0) return currentDepth;
        return Math.max(...keys.map(key => this.calculateDepth(obj[key], currentDepth + 1)));
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    clear() {
        this.jsonInput.value = '';
        this.jsonOutput.innerHTML = '<code>// Formatted JSON will appear here...</code>';
        this.hideError();
        if (this.statsSection) this.statsSection.style.display = 'none';
        this.collapseState.clear();
        this.saveToHistory();
        this.saveData();
    }
    
    copy() {
        const code = this.jsonOutput.textContent;
        if (!code || code.includes('// Formatted JSON')) {
            this.showToast('❌ Nothing to copy!');
            return;
        }
        
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('📋 Copied to clipboard!');
        }).catch(() => {
            this.showToast('❌ Failed to copy');
        });
    }
    
    showError(message) {
        if (this.errorMsg) {
            this.errorMsg.textContent = `❌ ${message}`;
            this.errorMsg.classList.add('show');
        }
    }
    
    hideError() {
        if (this.errorMsg) this.errorMsg.classList.remove('show');
    }
    
    setupToastManager() {
        // Toast container already exists in HTML
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize formatter
const jsonFormatter = new JSONFormatter();

// ============================================
// JSONPath Query Controller
// ============================================
class JSONPathController {
    constructor() {
        this.input = document.getElementById('jsonpathInput');
        this.output = document.getElementById('jsonpathOutput');
        this.executeBtn = document.getElementById('jsonpathExecuteBtn');
        this.clearBtn = document.getElementById('clearJsonpathBtn');
        this.helpBtn = document.getElementById('jsonpathHelpBtn');
        this.copyBtn = document.getElementById('copyJsonpathBtn');
        this.matchCount = document.getElementById('jsonpathMatchCount');
        
        this.init();
    }
    
    init() {
        if (this.executeBtn) {
            this.executeBtn.addEventListener('click', () => this.execute());
        }
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clear());
        }
        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', () => this.showHelp());
        }
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyResult());
        }
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.execute();
            });
        }
        
        // Setup example buttons
        document.querySelectorAll('.jsonpath-example').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.input) {
                    this.input.value = btn.dataset.query;
                    this.execute();
                }
            });
        });
    }
    
    execute() {
        if (!this.input || !this.output) return;
        
        const query = this.input.value.trim();
        if (!query) {
            this.output.innerHTML = '<code>// Enter a JSONPath query...</code>';
            this.updateMatchCount(0, false);
            return;
        }
        
        const currentData = jsonFormatter.currentData;
        if (!currentData) {
            this.output.innerHTML = '<code>// Please format valid JSON first...</code>';
            this.updateMatchCount(0, false);
            return;
        }
        
        try {
            const result = this.queryJSONPath(currentData, query);
            const formatted = JSON.stringify(result, null, 2);
            this.output.innerHTML = `<code>${jsonFormatter.syntaxHighlight(formatted)}</code>`;
            const count = Array.isArray(result) ? result.length : 1;
            this.updateMatchCount(count, true);
        } catch (e) {
            this.output.innerHTML = `<code class="json-error">// Error: ${e.message}</code>`;
            this.updateMatchCount(0, false);
        }
    }
    
    queryJSONPath(data, path) {
        if (path === '$') return data;
        if (path.startsWith('$.') || path.startsWith('$[')) {
            const segments = this.parsePath(path.substring(1));
            return this.getValue(data, segments);
        }
        throw new Error('Query must start with $');
    }
    
    parsePath(path) {
        const segments = [];
        let i = 0;
        while (i < path.length) {
            if (path[i] === '.') {
                i++;
                let key = '';
                while (i < path.length && path[i] !== '.' && path[i] !== '[') {
                    key += path[i++];
                }
                if (key) segments.push(key);
            } else if (path[i] === '[') {
                i++;
                let index = '';
                while (i < path.length && path[i] !== ']') {
                    index += path[i++];
                }
                i++;
                if (index === '*') {
                    segments.push('*');
                } else if (!isNaN(index)) {
                    segments.push(parseInt(index));
                }
            } else {
                i++;
            }
        }
        return segments;
    }
    
    getValue(data, segments) {
        if (segments.length === 0) return data;
        
        const [first, ...rest] = segments;
        
        if (first === '*') {
            if (Array.isArray(data)) {
                const results = [];
                for (const item of data) {
                    const val = this.getValue(item, rest);
                    if (Array.isArray(val)) results.push(...val);
                    else results.push(val);
                }
                return results;
            }
            return [];
        }
        
        if (typeof first === 'number') {
            if (Array.isArray(data) && first < data.length) {
                return rest.length === 0 ? data[first] : this.getValue(data[first], rest);
            }
            return undefined;
        }
        
        if (data && typeof data === 'object' && first in data) {
            return rest.length === 0 ? data[first] : this.getValue(data[first], rest);
        }
        
        return undefined;
    }
    
    clear() {
        if (this.input) this.input.value = '';
        if (this.output) this.output.innerHTML = '<code>// Query results will appear here...</code>';
        this.updateMatchCount(0, false);
    }
    
    copyResult() {
        if (!this.output) return;
        const text = this.output.textContent;
        if (!text || text.startsWith('//')) {
            jsonFormatter.showToast('Nothing to copy!', 'error');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            jsonFormatter.showToast('📋 Copied!', 'success');
        });
    }
    
    updateMatchCount(count, hasResults) {
        if (!this.matchCount) return;
        this.matchCount.textContent = hasResults ? `${count} match${count !== 1 ? 'es' : ''}` : '';
        this.matchCount.className = 'jsonpath-match-count ' + (hasResults ? 'has-matches' : '');
    }
    
    showHelp() {
        const helpText = `JSONPath Query Help:

$           - Root object
.key        - Dot notation for property
[index]     - Array index (0-based)
[*]         - All array elements

Examples:
$.features[0]            - First feature
$.stats.stars            - Stars value
$.nested.deep.example    - Nested value

Note: Filter expressions (?(@...)) are not yet supported.`;
        
        alert(helpText);
    }
}

// Initialize after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.jsonPathController = new JSONPathController();
});

// Handle early DOM ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        window.jsonPathController = new JSONPathController();
    }, 1);
}
