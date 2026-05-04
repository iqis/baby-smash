// Admin Panel - overlay configuration UI
// Activated by long-pressing any Ctrl key for 2 seconds
// All settings persist to localStorage

const ADMIN = (function () {
    'use strict';

    const STORAGE_KEY = 'babysmash_config';

    // Default configuration (matches CONFIG in app.js)
    const DEFAULTS = {
        // Timing
        elementDuration: 3000,
        fadeInTime: 400,
        fadeOutTime: 1200,
        cooldown: 100,
        autoRotateMin: 3,   // minutes (UI-friendly)
        autoRotateMax: 7,

        // Visuals
        maxElements: 8,
        minSize: 80,
        maxSize: 200,
        driftSpeed: 0.3,
        backgroundColor: '#faf8f5',

        // Audio
        masterVolume: 80,   // percentage
        ttsRate: 0.8,
        ttsPitch: 1.1,
        soundEnabled: true,
        ttsEnabled: true,

        // Modes (all enabled by default)
        enabledModes: {
            shapes: true,
            bubbles: true,
            nature: true,
            letters: true,
            music: true,
            animals: true,
            // Flashcard categories
            colors: true,
            animals_fc: true,
            fruits: true,
            vehicles: true,
            nature_words: true,
            numbers: true,
            body_parts: true,
        },

        // Languages
        enabledLanguages: {
            'ja-JP': true,
            'hi-IN': true,
            'es-ES': true,
        },
        ttsDelayBetween: 1200, // ms between language utterances
    };

    let config = null;
    let panelVisible = false;
    let panelEl = null;
    let ctrlPressStart = 0;
    let ctrlCheckInterval = null;

    // --- Persistence ---
    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                config = deepMerge(structuredClone(DEFAULTS), parsed);
            } else {
                config = structuredClone(DEFAULTS);
            }
        } catch (e) {
            config = structuredClone(DEFAULTS);
        }
        return config;
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.warn('Failed to save config:', e);
        }
    }

    function reset() {
        config = structuredClone(DEFAULTS);
        save();
        renderPanel();
        applyConfig();
    }

    function deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    // --- Long-press Detection ---
    function initLongPress() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Control' && ctrlPressStart === 0) {
                ctrlPressStart = Date.now();
                ctrlCheckInterval = setInterval(() => {
                    if (ctrlPressStart > 0 && Date.now() - ctrlPressStart >= 2000) {
                        clearInterval(ctrlCheckInterval);
                        ctrlCheckInterval = null;
                        togglePanel();
                    }
                }, 100);
            }
        }, true);

        window.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                ctrlPressStart = 0;
                if (ctrlCheckInterval) {
                    clearInterval(ctrlCheckInterval);
                    ctrlCheckInterval = null;
                }
            }
        }, true);
    }

    // --- Panel UI ---
    function togglePanel() {
        panelVisible = !panelVisible;
        if (panelVisible) {
            showPanel();
        } else {
            hidePanel();
        }
    }

    function showPanel() {
        if (!panelEl) createPanel();
        renderPanel();
        panelEl.style.display = 'flex';
        panelEl.style.opacity = '0';
        requestAnimationFrame(() => { panelEl.style.opacity = '1'; });
    }

    function hidePanel() {
        if (panelEl) {
            panelEl.style.opacity = '0';
            setTimeout(() => { panelEl.style.display = 'none'; }, 300);
        }
    }

    function createPanel() {
        panelEl = document.createElement('div');
        panelEl.id = 'admin-panel';
        panelEl.innerHTML = '<div class="admin-inner"></div>';
        document.body.appendChild(panelEl);

        const style = document.createElement('style');
        style.textContent = `
            #admin-panel {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.7);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: opacity 0.3s ease;
                cursor: default;
                font-family: system-ui, -apple-system, sans-serif;
            }
            #admin-panel .admin-inner {
                background: #1a1a2e;
                color: #e0e0e0;
                border-radius: 16px;
                padding: 32px;
                width: 90vw;
                max-width: 700px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            }
            #admin-panel h2 {
                margin: 0 0 20px 0;
                font-size: 1.4rem;
                color: #a7d8f4;
                font-weight: 400;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            #admin-panel h3 {
                margin: 20px 0 10px 0;
                font-size: 1rem;
                color: #b8e6c8;
                font-weight: 500;
                border-bottom: 1px solid #333;
                padding-bottom: 6px;
            }
            #admin-panel .field {
                display: flex;
                align-items: center;
                margin: 8px 0;
                gap: 12px;
            }
            #admin-panel .field label {
                flex: 0 0 160px;
                font-size: 0.85rem;
                color: #c0c0c0;
            }
            #admin-panel .field input[type="range"] {
                flex: 1;
                accent-color: #a7d8f4;
            }
            #admin-panel .field input[type="color"] {
                width: 40px; height: 30px;
                border: none; border-radius: 4px;
                cursor: pointer;
            }
            #admin-panel .field .value {
                flex: 0 0 50px;
                text-align: right;
                font-size: 0.8rem;
                color: #888;
                font-family: monospace;
            }
            #admin-panel .field input[type="checkbox"] {
                width: 18px; height: 18px;
                accent-color: #b8e6c8;
            }
            #admin-panel .toggle-row {
                display: flex;
                align-items: center;
                margin: 4px 0;
                gap: 8px;
            }
            #admin-panel .toggle-row label {
                font-size: 0.85rem;
                color: #c0c0c0;
                cursor: pointer;
            }
            #admin-panel .modes-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 4px 20px;
            }
            #admin-panel .btn-row {
                display: flex;
                gap: 12px;
                margin-top: 20px;
                justify-content: flex-end;
            }
            #admin-panel button {
                padding: 8px 20px;
                border: none;
                border-radius: 8px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: transform 0.1s;
            }
            #admin-panel button:active { transform: scale(0.95); }
            #admin-panel .btn-close {
                background: #a7d8f4;
                color: #1a1a2e;
            }
            #admin-panel .btn-reset {
                background: #444;
                color: #ccc;
            }
            #admin-panel .btn-close:hover { background: #8ec8f0; }
            #admin-panel .btn-reset:hover { background: #555; }
        `;
        document.head.appendChild(style);
    }

    function renderPanel() {
        const inner = panelEl.querySelector('.admin-inner');
        inner.innerHTML = `
            <h2>
                <span>⚙️ Admin Panel</span>
                <span style="font-size:0.7rem; color:#666;">Long-press Ctrl to close</span>
            </h2>

            <h3>⏱ Timing</h3>
            ${slider('elementDuration', 'Element Duration', 'ms', 1000, 8000, 100)}
            ${slider('fadeInTime', 'Fade In', 'ms', 100, 2000, 50)}
            ${slider('fadeOutTime', 'Fade Out', 'ms', 200, 4000, 100)}
            ${slider('cooldown', 'Key Cooldown', 'ms', 50, 500, 10)}
            ${slider('autoRotateMin', 'Auto-Rotate Min', 'min', 1, 15, 1)}
            ${slider('autoRotateMax', 'Auto-Rotate Max', 'min', 2, 20, 1)}

            <h3>🎨 Visuals</h3>
            ${slider('maxElements', 'Max Elements', '', 1, 20, 1)}
            ${slider('minSize', 'Min Size', 'px', 30, 150, 5)}
            ${slider('maxSize', 'Max Size', 'px', 100, 400, 10)}
            ${slider('driftSpeed', 'Drift Speed', 'px/f', 0, 2, 0.1)}
            ${colorPicker('backgroundColor', 'Background Color')}

            <h3>🔊 Audio</h3>
            ${slider('masterVolume', 'Master Volume', '%', 0, 100, 5)}
            ${slider('ttsRate', 'TTS Speed', '×', 0.3, 1.5, 0.1)}
            ${slider('ttsPitch', 'TTS Pitch', '×', 0.5, 2.0, 0.1)}
            ${toggle('soundEnabled', 'Sound Effects')}
            ${toggle('ttsEnabled', 'Text-to-Speech')}

            <h3>🎭 Modes</h3>
            <div class="modes-grid">
                ${modeToggle('shapes', '⬡ Shapes')}
                ${modeToggle('bubbles', '🫧 Bubbles')}
                ${modeToggle('nature', '🍃 Nature')}
                ${modeToggle('letters', '🔤 Letters')}
                ${modeToggle('music', '🎵 Music')}
                ${modeToggle('animals', '🐾 Animals')}
                ${modeToggle('colors', '🎨 Colors FC')}
                ${modeToggle('animals_fc', '🐘 Animals FC')}
                ${modeToggle('fruits', '🍎 Fruits FC')}
                ${modeToggle('vehicles', '🚗 Vehicles FC')}
                ${modeToggle('nature_words', '🌈 Nature FC')}
                ${modeToggle('numbers', '🔢 Numbers FC')}
                ${modeToggle('body_parts', '🖐 Body Parts FC')}
            </div>

            <h3>🌐 Languages (Third-language rotation)</h3>
            ${langToggle('ja-JP', '🇯🇵 Japanese')}
            ${langToggle('hi-IN', '🇮🇳 Hindi')}
            ${langToggle('es-ES', '🇪🇸 Spanish')}
            ${slider('ttsDelayBetween', 'Delay Between', 'ms', 500, 3000, 100)}

            <div class="btn-row">
                <button class="btn-reset" onclick="ADMIN.reset()">Reset Defaults</button>
                <button class="btn-close" onclick="ADMIN.togglePanel()">Close</button>
            </div>
        `;

        // Bind all inputs
        inner.querySelectorAll('input[data-key]').forEach(input => {
            input.addEventListener('input', () => {
                const key = input.dataset.key;
                const type = input.type;

                if (type === 'range' || type === 'number') {
                    const val = parseFloat(input.value);
                    config[key] = val;
                    const valueSpan = input.parentElement.querySelector('.value');
                    if (valueSpan) valueSpan.textContent = val + (input.dataset.unit || '');
                } else if (type === 'color') {
                    config[key] = input.value;
                } else if (type === 'checkbox') {
                    config[key] = input.checked;
                }
                save();
                applyConfig();
            });
        });

        inner.querySelectorAll('input[data-mode]').forEach(input => {
            input.addEventListener('change', () => {
                config.enabledModes[input.dataset.mode] = input.checked;
                save();
                applyConfig();
            });
        });

        inner.querySelectorAll('input[data-lang]').forEach(input => {
            input.addEventListener('change', () => {
                config.enabledLanguages[input.dataset.lang] = input.checked;
                save();
                applyConfig();
            });
        });
    }

    // --- HTML Helpers ---
    function slider(key, label, unit, min, max, step) {
        const val = config[key];
        return `<div class="field">
            <label>${label}</label>
            <input type="range" data-key="${key}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${val}">
            <span class="value">${val}${unit}</span>
        </div>`;
    }

    function colorPicker(key, label) {
        return `<div class="field">
            <label>${label}</label>
            <input type="color" data-key="${key}" value="${config[key]}">
        </div>`;
    }

    function toggle(key, label) {
        const checked = config[key] ? 'checked' : '';
        return `<div class="toggle-row">
            <input type="checkbox" data-key="${key}" id="toggle-${key}" ${checked}>
            <label for="toggle-${key}">${label}</label>
        </div>`;
    }

    function modeToggle(mode, label) {
        const checked = config.enabledModes[mode] ? 'checked' : '';
        return `<div class="toggle-row">
            <input type="checkbox" data-mode="${mode}" id="mode-${mode}" ${checked}>
            <label for="mode-${mode}">${label}</label>
        </div>`;
    }

    function langToggle(code, label) {
        const checked = config.enabledLanguages[code] ? 'checked' : '';
        return `<div class="toggle-row">
            <input type="checkbox" data-lang="${code}" id="lang-${code}" ${checked}>
            <label for="lang-${code}">${label}</label>
        </div>`;
    }

    // --- Config Application (callback set by app.js) ---
    let onConfigChange = null;

    function applyConfig() {
        if (onConfigChange) onConfigChange(config);
    }

    // --- Public API ---
    return {
        load,
        save,
        reset,
        togglePanel,
        initLongPress,
        get config() { return config; },
        set onConfigChange(fn) { onConfigChange = fn; },
    };
})();
