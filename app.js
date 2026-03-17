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
        
        this.init();
    }
    
    init() {
        this.addEventListeners();
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
        
        this.jsonInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.jsonInput.selectionStart;
                const end = this.jsonInput.selectionEnd;
                this.jsonInput.value = this.jsonInput.value.substring(0, start) + '    ' + 
                                       this.jsonInput.value.substring(end);
                this.jsonInput.selectionStart = this.jsonInput.selectionEnd = start + 4;
            }
        });
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
                "Collapsible nodes"
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
    }
    
    minify() {
        const data = this.parseJSON();
        if (!data) return;
        
        this.hideError();
        const minified = JSON.stringify(data);
        this.displayOutput(minified);
        this.updateStats(data, minified);
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
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/\u007f-\uffff/g, (c) => {
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
        json = json.replace(/\u0026/g, '&amp;')
                   .replace(/\u003c/g, '&lt;')
                   .replace(/\u003e/g, '&gt;');
        
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
    }
    
    copy() {
        const code = this.jsonOutput.textContent;
        navigator.clipboard.writeText(code).then(() => {
            this.showToast('📋 Copied to clipboard!');
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

new JSONFormatter();