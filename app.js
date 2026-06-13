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
        this.statsSection = document.getElementById('statsSection');
        this.expandAllBtn = document.getElementById('expandAllBtn');
        this.collapseAllBtn = document.getElementById('collapseAllBtn');
        
        // Store collapse state
        this.collapseState = new Map();
        this.currentData = null;
        
        // Undo/Redo history
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        this.init();
    }
    
    init() {
        this.addEventListeners();
        this.setupKeyboardShortcuts();
        this.setupUndoRedo();
        this.loadSampleData();
    }
    
    addEventListeners() {
        this.formatBtn.addEventListener('click', () => this.format());
        this.minifyBtn.addEventListener('click', () => this.minify());
        this.validateBtn.addEventListener('click', () => this.validate());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.copyBtn.addEventListener('click', () => this.copy());
        
        if (this.expandAllBtn) {
            this.expandAllBtn.addEventListener('click', () => this.expandAll());
        }
        if (this.collapseAllBtn) {
            this.collapseAllBtn.addEventListener('click', () => this.collapseAll());
        }
        
        // Add click delegation for collapsible nodes
        this.jsonOutput.addEventListener('click', (e) => this.handleNodeClick(e));
        
        // Tab support in textarea
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
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.saveToHistory(), 1000);
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter = Format
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
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
        });
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
            this.hideError();
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.jsonInput.value = this.history[this.historyIndex];
            this.hideError();
        }
    }
    
    loadSampleData() {
        const sample = {
            "name": "JSON Formatter",
            "version": "1.0.0",
            "description": "A beautiful JSON formatter with syntax highlighting",
            "features": [
                "Format JSON with proper indentation",
                "Minify JSON for production",
                "Validate JSON syntax",
                "Syntax highlighting",
                "Collapsible nodes",
                "Keyboard shortcuts",
                "Undo/Redo support"
            ],
            "author": "Agent-Lumi",
            "github": "https://github.com/Agent-Lumi/json-formatter-beautiful",
            "stats": {
                "stars": 42,
                "forks": 12,
                "active": true,
                "nested": {
                    "deep": {
                        "value": "test"
                    }
                }
            }
        };
        
        this.jsonInput.value = JSON.stringify(sample, null, 2);
        this.saveToHistory();
        this.format();
    }
    
    getIndent() {
        return this.indentSize.checked ? 2 : 4;
    }
    
    parseJSON() {
        try {
            const text = this.jsonInput.value.trim();
            if (!text) {
                throw new Error('Please enter some JSON');
            }
            return JSON.parse(text);
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
        
        // Track this action
        if (window.usageDashboard) {
            window.usageDashboard.trackFormat();
        }
    }
    
    minify() {
        const data = this.parseJSON();
        if (!data) return;
        
        this.hideError();
        const minified = JSON.stringify(data);
        this.displayOutput(minified);
        this.updateStats(data, minified);
        
        if (window.usageDashboard) {
            window.usageDashboard.trackMinify();
        }
    }
    
    validate() {
        const data = this.parseJSON();
        if (data) {
            this.hideError();
            this.showToast('✅ Valid JSON!');
            this.format();
        }
        
        if (window.usageDashboard) {
            window.usageDashboard.trackValidate();
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
            const keys = this.sortKeys.checked ? Object.keys(data).sort() : Object.keys(data);
            
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
        // Fix: Properly escape special characters for HTML display
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/[\x00-\x1f\x7f-\x9f]/g, (c) => {
                return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
            });
    }
    
    handleNodeClick(e) {
        const toggleBtn = e.target.closest('.json-toggle-btn');
        if (!toggleBtn) return;
        
        const toggle = toggleBtn.closest('.json-toggle');
        const path = toggle.dataset.path;
        const content = this.jsonOutput.querySelector(`.json-toggle-content[data-path="${path}"]`);
        const count = toggle.querySelector('.json-collapsed-count');
        
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
            if (path === 'root') return; // Don't collapse root
            
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
        json = json.replace(/\u0026/g, '\u0026amp;')
                   .replace(/\u003c/g, '\u0026lt;')
                   .replace(/\u003e/g, '\u0026gt;');
        
        return json.replace(
            /("(?:[^"\\\\]|\\\\.)*")|(\b(?:true|false|null)\b)|(-?\d+\.?\d*)|([{}\[\]])|([:,])/g,
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
        
        document.getElementById('sizeStat').textContent = this.formatBytes(size);
        document.getElementById('linesStat').textContent = lines;
        document.getElementById('keysStat').textContent = keys;
        document.getElementById('arraysStat').textContent = arrays;
        
        this.statsSection.style.display = 'block';
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
        this.statsSection.style.display = 'none';
        this.collapseState.clear();
        this.saveToHistory();
    }
    
    copy() {
        const code = this.jsonOutput.textContent;
        if (!code || code.includes('// Formatted JSON')) {
            this.showToast('❌ Nothing to copy!');
            return;
        }
        
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('📋 Copied to clipboard!');
            if (window.usageDashboard) {
                window.usageDashboard.trackCopy();
            }
        }).catch(() => {
            this.showToast('❌ Failed to copy');
        });
    }
    
    showError(message) {
        this.errorMsg.textContent = `❌ ${message}`;
        this.errorMsg.classList.add('show');
    }
    
    hideError() {
        this.errorMsg.classList.remove('show');
    }
    
    showToast(message) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Make formatter globally accessible
window.jsonFormatter = new JSONFormatter();

// ============================================
// USAGE STATISTICS DASHBOARD
// ============================================
class UsageDashboard {
    constructor() {
        this.stats = this.loadStats();
        this.sessionStart = Date.now();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.startSessionTimer();
        this.loadDarkMode();
        this.setupOfflineIndicator();
        this.setupShareButton();
        this.setupPWAInstall();
        
        // Track this visit
        if (!this.stats.firstVisit) {
            this.stats.firstVisit = new Date().toISOString();
        }
        this.stats.totalVisits = (this.stats.totalVisits || 0) + 1;
        this.stats.lastVisit = new Date().toISOString();
        this.saveStats();
        
        // Add initial activity
        this.addActivity('👋', 'App opened', 'Session started');
    }
    
    loadStats() {
        const saved = localStorage.getItem('jsonFormatterStats');
        return saved ? JSON.parse(saved) : {
            totalFormats: 0,
            totalValidations: 0,
            totalMinifies: 0,
            totalCopies: 0,
            totalExports: 0,
            totalImports: 0,
            activityLog: [],
            firstVisit: null,
            lastVisit: null,
            totalVisits: 0
        };
    }
    
    saveStats() {
        localStorage.setItem('jsonFormatterStats', JSON.stringify(this.stats));
    }
    
    setupEventListeners() {
        // Dashboard toggle
        const toggleBtn = document.getElementById('toggleDashboard');
        const dashboardContent = document.getElementById('dashboardContent');
        if (toggleBtn && dashboardContent) {
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = dashboardContent.classList.toggle('collapsed');
                toggleBtn.textContent = isCollapsed ? '▶ Show' : '▼ Hide';
            });
        }
        
        // Dark mode toggle
        const darkModeBtn = document.getElementById('darkModeToggle');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark-mode');
                darkModeBtn.textContent = isDark ? '☀️' : '🌙';
                localStorage.setItem('darkMode', isDark);
            });
        }
        
        // Import button
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,.txt';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const textarea = document.getElementById('jsonInput');
                        if (textarea) {
                            textarea.value = e.target.result;
                            this.trackImport(file.name);
                            // Auto-format after import
                            if (window.jsonFormatter) {
                                window.jsonFormatter.format();
                            }
                        }
                    };
                    reader.onerror = () => {
                        this.showToast('❌ Failed to read file');
                    };
                    reader.readAsText(file);
                };
                input.click();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const content = document.getElementById('jsonOutput').textContent;
                if (!content || content.includes('// Formatted JSON')) {
                    this.showToast('❌ Nothing to export!');
                    return;
                }
                
                const blob = new Blob([content], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `formatted-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.trackExport();
            });
        }
        
        // Intercept formatter methods to track usage
        this.interceptFormatter();
    }
    
    interceptFormatter() {
        // Wait for formatter to initialize
        setTimeout(() => {
            const formatBtn = document.getElementById('formatBtn');
            const minifyBtn = document.getElementById('minifyBtn');
            const validateBtn = document.getElementById('validateBtn');
            const copyBtn = document.getElementById('copyBtn');
            
            if (formatBtn) {
                formatBtn.addEventListener('click', () => this.trackFormat(), true);
            }
            if (minifyBtn) {
                minifyBtn.addEventListener('click', () => this.trackMinify(), true);
            }
            if (validateBtn) {
                validateBtn.addEventListener('click', () => this.trackValidate(), true);
            }
            if (copyBtn) {
                copyBtn.addEventListener('click', () => this.trackCopy(), true);
            }
        }, 100);
    }
    
    trackFormat() {
        this.stats.totalFormats++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('✨', 'JSON Formatted', 'Document formatted');
    }
    
    trackMinify() {
        this.stats.totalMinifies++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('📦', 'JSON Minified', 'Document minified');
    }
    
    trackValidate() {
        this.stats.totalValidations++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('✅', 'JSON Validated', 'Validation check');
    }
    
    trackCopy() {
        this.stats.totalCopies++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('📋', 'Copied', 'Output copied to clipboard');
    }
    
    trackExport(filename) {
        this.stats.totalExports++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('💾', 'Exported', `Saved to ${filename || 'file'}`);
    }
    
    trackImport(filename) {
        this.stats.totalImports++;
        this.saveStats();
        this.updateDisplay();
        this.addActivity('📁', 'Imported', `Loaded ${filename || 'file'}`);
    }
    
    addActivity(icon, action, detail) {
        const activity = {
            icon,
            action,
            detail,
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString()
        };
        
        this.stats.activityLog.unshift(activity);
        // Keep only last 20 activities
        if (this.stats.activityLog.length > 20) {
            this.stats.activityLog = this.stats.activityLog.slice(0, 20);
        }
        
        this.saveStats();
        this.updateActivityLog();
    }
    
    updateDisplay() {
        // Update counters
        document.getElementById('totalFormats').textContent = this.stats.totalFormats || 0;
        document.getElementById('totalValidations').textContent = this.stats.totalValidations || 0;
        document.getElementById('totalMinifies').textContent = this.stats.totalMinifies || 0;
        document.getElementById('totalCopies').textContent = this.stats.totalCopies || 0;
        
        // Update first visit
        if (this.stats.firstVisit) {
            const date = new Date(this.stats.firstVisit);
            document.getElementById('firstVisit').textContent = 
                date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        
        this.updateActivityLog();
    }
    
    updateActivityLog() {
        const container = document.getElementById('activityLog');
        if (!container) return;
        
        if (!this.stats.activityLog || this.stats.activityLog.length === 0) {
            container.innerHTML = '<div class="activity-empty">No activity yet. Start formatting JSON!</div>';
            return;
        }
        
        container.innerHTML = this.stats.activityLog.map(activity => `
            <div class="activity-item">
                <span class="activity-icon">${activity.icon}</span>
                <span class="activity-text">${activity.action}${activity.detail ? ` <small>(${activity.detail})</small>` : ''}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        `).join('');
    }
    
    startSessionTimer() {
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStart) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            const timerEl = document.getElementById('sessionTime');
            if (timerEl) timerEl.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    loadDarkMode() {
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            const toggle = document.getElementById('darkModeToggle');
            if (toggle) toggle.textContent = '☀️';
        }
    }
    
    setupOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (!indicator) return;
        
        const updateOnlineStatus = () => {
            indicator.style.display = navigator.onLine ? 'none' : 'block';
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }
    
    setupShareButton() {
        const shareBtn = document.getElementById('shareBtn');
        if (!shareBtn) return;
        
        shareBtn.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'JSON Formatter \u0026 Beautifier',
                        text: 'Check out this awesome JSON formatter!',
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Share cancelled');
                }
            } else {
                // Fallback to clipboard
                navigator.clipboard.writeText(window.location.href);
                this.showToast('✅ URL copied to clipboard!');
            }
        });
    }
    
    setupPWAInstall() {
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Store the event for later use
            this.deferredPrompt = e;
            // Show install button if exists
            this.showInstallButton();
        });
        
        // Hide install button when app is installed
        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }
    
    showInstallButton() {
        // Check if button already exists
        let installBtn = document.getElementById('installBtn');
        if (!installBtn && this.deferredPrompt) {
            installBtn = document.createElement('button');
            installBtn.id = 'installBtn';
            installBtn.className = 'install-button';
            installBtn.innerHTML = '📱 Install App';
            document.body.appendChild(installBtn);
            
            installBtn.addEventListener('click', async () => {
                if (!this.deferredPrompt) return;
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    this.showToast('✅ App installed!');
                }
                this.deferredPrompt = null;
                this.hideInstallButton();
            });
        }
    }
    
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }
    
    showToast(message) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// ============================================
// JSONPath Query Engine
// ============================================
class JSONPathEngine {
    constructor() {
        this.currentData = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const executeBtn = document.getElementById('jsonpathExecuteBtn');
        const input = document.getElementById('jsonpathInput');
        const clearBtn = document.getElementById('clearJsonpathBtn');
        const copyBtn = document.getElementById('copyJsonpathBtn');
        const helpBtn = document.getElementById('jsonpathHelpBtn');
        const examples = document.querySelectorAll('.jsonpath-example');
        
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.execute());
        }
        
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.execute();
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clear());
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResult());
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                const modal = document.getElementById('jsonpathHelpModal');
                if (modal) modal.style.display = 'flex';
            });
        }
        
        examples.forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                if (query && input) {
                    input.value = query;
                    this.execute();
                }
            });
        });
        
        // Listen for format events to update current data
        const formatBtn = document.getElementById('formatBtn');
        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                setTimeout(() => this.updateCurrentData(), 100);
            });
        }
        
        // Close modal on outside click
        const modal = document.getElementById('jsonpathHelpModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
    
    updateCurrentData() {
        const jsonInput = document.getElementById('jsonInput');
        const jsonpathSection = document.getElementById('jsonpathSection');
        
        if (!jsonInput || !jsonpathSection) return;
        
        try {
            const text = jsonInput.value.trim();
            if (text) {
                this.currentData = JSON.parse(text);
                jsonpathSection.style.display = 'block';
            }
        } catch (e) {
            // Invalid JSON, hide section
            jsonpathSection.style.display = 'none';
        }
    }
    
    execute() {
        this.updateCurrentData();
        
        if (!this.currentData) {
            this.showError('Please format valid JSON first');
            return;
        }
        
        const input = document.getElementById('jsonpathInput');
        const query = input.value.trim();
        
        if (!query) {
            this.showError('Please enter a JSONPath query');
            return;
        }
        
        try {
            const results = this.evaluate(query, this.currentData);
            this.displayResults(results);
            this.updateMatchCount(results);
            
            // Track JSONPath execution
            if (window.usageDashboard) {
                window.usageDashboard.trackActivity('🔍', 'JSONPath executed', query.substring(0, 30) + '...');
            }
        } catch (e) {
            this.showError('Query error: ' + e.message);
        }
    }
    
    // JSONPath implementation
    evaluate(path, json) {
        if (path === '
) return [json];
        
        let results = [json];
        let i = 0;
        
        while (i < path.length) {
            const char = path[i];
            
            if (char === '
) {
                i++;
                continue;
            }
            
            if (char === '.') {
                // Check for recursive descent
                if (path[i + 1] === '.') {
                    i += 2;
                    const key = this.readKey(path, i);
                    i += key.length;
                    results = this.recursiveDescent(results, key);
                } else {
                    i++;
                    const key = this.readKey(path, i);
                    i += key.length;
                    results = this.selectProperty(results, key);
                }
            } else if (char === '[') {
                const end = path.indexOf(']', i);
                if (end === -1) throw new Error('Unmatched bracket');
                
                const content = path.substring(i + 1, end);
                results = this.handleBracket(content, results);
                i = end + 1;
            } else {
                i++;
            }
        }
        
        return results;
    }
    
    readKey(path, start) {
        let end = start;
        while (end < path.length && !['.', '[', ' '].includes(path[end])) {
            end++;
        }
        return path.substring(start, end);
    }
    
    selectProperty(data, key) {
        const results = [];
        for (const item of data) {
            if (item && typeof item === 'object' && key in item) {
                results.push(item[key]);
            }
        }
        return results;
    }
    
    recursiveDescent(data, key) {
        const results = [];
        const visited = new Set();
        
        const traverse = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (visited.has(obj)) return;
            visited.add(obj);
            
            if (key && key in obj) {
                results.push(obj[key]);
            }
            
            for (const val of Object.values(obj)) {
                traverse(val);
            }
        };
        
        for (const item of data) {
            traverse(item);
        }
        
        return results;
    }
    
    handleBracket(content, data) {
        // Filter expression
        if (content.startsWith('?(')) {
            return this.handleFilter(content.slice(2, -1), data);
        }
        
        // Union
        if (content.includes(',')) {
            const indices = content.split(',').map(s => parseInt(s.trim()));
            const results = [];
            for (const item of data) {
                if (Array.isArray(item)) {
                    for (const idx of indices) {
                        if (idx >= 0 && idx < item.length) {
                            results.push(item[idx]);
                        }
                    }
                }
            }
            return results;
        }
        
        // Slice
        if (content.includes(':')) {
            const parts = content.split(':').map(s => s.trim() === '' ? null : parseInt(s.trim()));
            const results = [];
            for (const item of data) {
                if (Array.isArray(item)) {
                    const start = parts[0] || 0;
                    const end = parts[1] !== null ? parts[1] : item.length;
                    const sliced = item.slice(start, end);
                    results.push(...sliced);
                }
            }
            return results;
        }
        
        // Single index or key
        const index = parseInt(content);
        if (!isNaN(index)) {
            const results = [];
            for (const item of data) {
                if (Array.isArray(item) && index >= 0 && index < item.length) {
                    results.push(item[index]);
                }
            }
            return results;
        }
        
        // Wildcard
        if (content === '*') {
            const results = [];
            for (const item of data) {
                if (Array.isArray(item)) {
                    results.push(...item);
                } else if (item && typeof item === 'object') {
                    results.push(...Object.values(item));
                }
            }
            return results;
        }
        
        return data;
    }
    
    handleFilter(expr, data) {
        const results = [];
        
        for (const item of data) {
            if (!Array.isArray(item) && !(item && typeof item === 'object')) continue;
            
            const items = Array.isArray(item) ? item : [item];
            
            for (const subItem of items) {
                if (this.evaluateFilter(expr, subItem)) {
                    results.push(subItem);
                }
            }
        }
        
        return results;
    }
    
    evaluateFilter(expr, data) {
        // Handle comparison expressions
        // @.property operator value
        const match = expr.match(/@(?:\.(\w+)|\['([^']+)'\])\s*([=!<>]+|in|contains)\s*(.+)/);
        
        if (!match) {
            // Simple existence check
            const key = expr.replace(/^@\.?/, '');
            return key in data;
        }
        
        const prop1 = match[1] || match[2];
        const operator = match[3];
        let value = match[4].trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        
        const actualValue = data[prop1];
        
        switch (operator) {
            case '==':
                return String(actualValue) === value;
            case '!=':
                return String(actualValue) !== value;
            case '<':
                return Number(actualValue) < Number(value);
            case '>':
                return Number(actualValue) > Number(value);
            case '<=':
                return Number(actualValue) <= Number(value);
            case '>=':
                return Number(actualValue) >= Number(value);
            case '=~':
                return new RegExp(value).test(String(actualValue));
            case 'in':
                if (Array.isArray(actualValue)) {
                    return actualValue.includes(value);
                }
                return false;
            case 'contains':
                return String(actualValue).includes(value);
            default:
                return false;
        }
    }
    
    displayResults(results) {
        const output = document.getElementById('jsonpathOutput');
        if (!output) return;
        
        const formatted = JSON.stringify(results, null, 2);
        output.innerHTML = `<code>${this.syntaxHighlight(formatted)}</code>`;
    }
    
    updateMatchCount(results) {
        const countEl = document.getElementById('jsonpathMatchCount');
        if (!countEl) return;
        
        const count = results.length;
        countEl.textContent = `${count} match${count !== 1 ? 'es' : ''}`;
        countEl.className = 'jsonpath-match-count ' + (count > 0 ? 'has-matches' : 'no-matches');
    }
    
    syntaxHighlight(json) {
        json = json.replace(/\u0026/g, '\u0026amp;')
                   .replace(/\u003c/g, '\u0026lt;')
                   .replace(/\u003e/g, '\u0026gt;');
        
        return json.replace(
            /("(?:[^"\\\\]|\\\\.)*")|(\b(?:true|false|null)\b)|(-?\d+\.?\d*)|([{}\[\]])|([:,])/g,
            (match, string, bool, number, brace, colon) => {
                if (string) return `<span class="json-string">${match}</span>`;
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
    
    clear() {
        const input = document.getElementById('jsonpathInput');
        const output = document.getElementById('jsonpathOutput');
        const countEl = document.getElementById('jsonpathMatchCount');
        
        if (input) input.value = '';
        if (output) output.innerHTML = '<code>// Query results will appear here...</code>';
        if (countEl) {
            countEl.textContent = '';
            countEl.className = 'jsonpath-match-count';
        }
    }
    
    copyResult() {
        const output = document.getElementById('jsonpathOutput');
        if (!output) return;
        
        const text = output.textContent;
        if (!text || text.includes('// Query results')) {
            this.showToast('❌ Nothing to copy!');
            return;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('📋 JSONPath result copied!');
        }).catch(() => {
            this.showToast('❌ Failed to copy');
        });
    }
    
    showError(message) {
        const output = document.getElementById('jsonpathOutput');
        if (output) {
            output.innerHTML = `<code style="color: #ff6b6b;">❌ ${message}</code>`;
        }
    }
    
    showToast(message) {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Initialize JSONPath engine
window.jsonPathEngine = new JSONPathEngine();

// Initialize usage dashboard and make it globally accessible
window.usageDashboard = new UsageDashboard();
