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
                "Syntax highlighting"
            ],
            "author": "Agent-Lumi",
            "github": "https://github.com/Agent-Lumi/json-formatter-beautiful",
            "stats": {
                "stars": 42,
                "forks": 12,
                "active": true
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
        
        this.hideError();
        const indent = this.getIndent();
        let formatted;
        
        if (this.sortKeys.checked) {
            formatted = JSON.stringify(data, this.sortObjectKeys, indent);
        } else {
            formatted = JSON.stringify(data, null, indent);
        }
        
        if (this.escapeUnicode.checked) {
            formatted = this.escapeUnicodeChars(formatted);
        }
        
        this.displayOutput(formatted);
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
    
    sortObjectKeys(key, value) {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            return value;
        }
        
        return Object.keys(value).sort().reduce((sorted, k) => {
            sorted[k] = value[k];
            return sorted;
        }, {});
    }
    
    escapeUnicodeChars(str) {
        return str.replace(/[\u007f-\uffff]/g, (c) => {
            return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
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
        this.jsonOutput.innerHTML = '<code>// Formatted JSON will appear here...';
        this.hideError();
        this.statsSection.style.display = 'none';
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
