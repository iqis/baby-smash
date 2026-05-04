// Admin Panel - Game-style keyboard-navigable settings overlay
// Activated by long-pressing any Ctrl key for 2 seconds
// Navigation: ↑↓ move, ←→ adjust values, Enter/Space toggle, Esc close
// All settings persist to localStorage

const ADMIN = (function () {
    'use strict';

    const STORAGE_KEY = 'babysmash_config';

    // Default configuration
    const DEFAULTS = {
        elementDuration: 3000,
        fadeInTime: 400,
        fadeOutTime: 1200,
        cooldown: 100,
        autoRotateMin: 3,
        autoRotateMax: 7,
        maxElements: 8,
        minSize: 80,
        maxSize: 200,
        driftSpeed: 0.3,
        backgroundColor: '#faf8f5',
        masterVolume: 80,
        ttsRate: 0.8,
        ttsPitch: 1.1,
        soundEnabled: true,
        ttsEnabled: true,
        enabledModes: {
            shapes: true, bubbles: true, nature: true,
            letters: true, music: true, animals: true,
            colors: true, animals_fc: true, fruits: true,
            vehicles: true, nature_words: true, numbers: true, body_parts: true,
        },
        enabledLanguages: { 'ja-JP': true, 'hi-IN': true, 'es-ES': true },
        ttsDelayBetween: 1200,
        autoRotateEnabled: true,
    };

    let config = null;
    let panelVisible = false;
    let panelEl = null;
    let ctrlPressStart = 0;
    let ctrlCheckInterval = null;
    let focusIndex = 0;
    let menuItems = []; // flat list of interactive items

    // --- Persistence ---
    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                config = deepMerge(structuredClone(DEFAULTS), JSON.parse(saved));
            } else {
                config = structuredClone(DEFAULTS);
            }
        } catch (e) {
            config = structuredClone(DEFAULTS);
        }
        return config;
    }

    function save() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch (e) {}
    }

    function reset() {
        config = structuredClone(DEFAULTS);
        save();
        applyConfig();
        if (panelVisible) { buildMenu(); renderPanel(); }
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

    // --- Menu Item Definitions ---
    // Each item: { type, label, key?, get, set, min?, max?, step?, options?, group? }
    function buildMenu() {
        const currentModeName = typeof getCurrentModeName === 'function' ? getCurrentModeName() : '';
        menuItems = [
            // -- Quick close at top --
            { type: 'action', label: '✕ Close Panel  [Q]', action: () => hidePanel() },

            // -- Now Playing --
            { type: 'header', label: '🎮 NOW PLAYING' },
            { type: 'action', label: '◀ Previous Mode', action: () => { if (onPrevMode) onPrevMode(); buildMenu(); } },
            { type: 'action', label: '▶ Next Mode', action: () => { if (onNextMode) onNextMode(); buildMenu(); } },
            { type: 'toggle', label: 'Auto-Rotate', get: () => config.autoRotateEnabled, set: (v) => { config.autoRotateEnabled = v; save(); applyConfig(); } },

            { type: 'header', label: '🎭 SWITCH MODE' },
            // Interactive modes
            ...buildModeGroup('Interactive', [
                ['shapes', '⬡ Shapes'], ['bubbles', '🫧 Bubbles'], ['nature', '🍃 Nature'],
                ['letters', '🔤 Letters'], ['music', '🎵 Music'], ['animals', '🐾 Animals'],
            ], currentModeName),
            { type: 'header', label: '🃏 FLASHCARD MODES' },
            ...buildModeGroup('Flashcard', [
                ['colors', '🎨 Colors'], ['animals_fc', '🐘 Animals'], ['fruits', '🍎 Fruits'],
                ['vehicles', '🚗 Vehicles'], ['nature_words', '🌈 Nature'], ['numbers', '🔢 Numbers'],
                ['body_parts', '🖐 Body Parts'],
            ], currentModeName),

            // -- Timing --
            { type: 'header', label: '⏱ TIMING' },
            { type: 'slider', label: 'Element Duration', key: 'elementDuration', min: 1000, max: 8000, step: 200, unit: 'ms' },
            { type: 'slider', label: 'Fade In', key: 'fadeInTime', min: 100, max: 2000, step: 100, unit: 'ms' },
            { type: 'slider', label: 'Fade Out', key: 'fadeOutTime', min: 200, max: 4000, step: 200, unit: 'ms' },
            { type: 'slider', label: 'Key Cooldown', key: 'cooldown', min: 50, max: 500, step: 25, unit: 'ms' },
            { type: 'slider', label: 'Auto-Rotate Min', key: 'autoRotateMin', min: 1, max: 15, step: 1, unit: 'min' },
            { type: 'slider', label: 'Auto-Rotate Max', key: 'autoRotateMax', min: 2, max: 20, step: 1, unit: 'min' },

            // -- Visuals --
            { type: 'header', label: '🎨 VISUALS' },
            { type: 'slider', label: 'Max Elements', key: 'maxElements', min: 1, max: 20, step: 1, unit: '' },
            { type: 'slider', label: 'Min Size', key: 'minSize', min: 30, max: 150, step: 10, unit: 'px' },
            { type: 'slider', label: 'Max Size', key: 'maxSize', min: 100, max: 400, step: 20, unit: 'px' },
            { type: 'slider', label: 'Drift Speed', key: 'driftSpeed', min: 0, max: 2, step: 0.1, unit: '' },

            // -- Audio --
            { type: 'header', label: '🔊 AUDIO' },
            { type: 'slider', label: 'Master Volume', key: 'masterVolume', min: 0, max: 100, step: 5, unit: '%' },
            { type: 'slider', label: 'TTS Speed', key: 'ttsRate', min: 0.3, max: 1.5, step: 0.1, unit: '×' },
            { type: 'slider', label: 'TTS Pitch', key: 'ttsPitch', min: 0.5, max: 2.0, step: 0.1, unit: '×' },
            { type: 'toggle', label: 'Sound Effects', get: () => config.soundEnabled, set: (v) => { config.soundEnabled = v; save(); applyConfig(); } },
            { type: 'toggle', label: 'Text-to-Speech', get: () => config.ttsEnabled, set: (v) => { config.ttsEnabled = v; save(); applyConfig(); } },

            // -- Languages --
            { type: 'header', label: '🌐 LANGUAGES' },
            { type: 'toggle', label: '🇯🇵 Japanese', get: () => config.enabledLanguages['ja-JP'], set: (v) => { config.enabledLanguages['ja-JP'] = v; save(); applyConfig(); } },
            { type: 'toggle', label: '🇮🇳 Hindi', get: () => config.enabledLanguages['hi-IN'], set: (v) => { config.enabledLanguages['hi-IN'] = v; save(); applyConfig(); } },
            { type: 'toggle', label: '🇪🇸 Spanish', get: () => config.enabledLanguages['es-ES'], set: (v) => { config.enabledLanguages['es-ES'] = v; save(); applyConfig(); } },
            { type: 'slider', label: 'Delay Between', key: 'ttsDelayBetween', min: 500, max: 3000, step: 100, unit: 'ms' },

            // -- Actions --
            { type: 'header', label: '⚡ ACTIONS' },
            { type: 'action', label: '↺ Reset All to Defaults', action: reset },
        ];

        // Ensure focusIndex is on an interactive item
        if (focusIndex >= menuItems.length) focusIndex = 0;
        while (menuItems[focusIndex] && menuItems[focusIndex].type === 'header') {
            focusIndex++;
            if (focusIndex >= menuItems.length) focusIndex = 0;
        }
    }

    function buildModeGroup(groupName, modes, currentModeName) {
        return modes.map(([key, label]) => ({
            type: 'mode',
            label: label,
            modeKey: key,
            isActive: () => (typeof getCurrentModeName === 'function' && getCurrentModeName() === key),
            isEnabled: () => config.enabledModes[key],
            activate: () => { if (onSwitchMode) onSwitchMode(key); buildMenu(); },
            toggleEnabled: () => { config.enabledModes[key] = !config.enabledModes[key]; save(); applyConfig(); },
        }));
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

    // --- Panel Keyboard Handler ---
    function handlePanelKey(e) {
        if (!panelVisible) return;

        e.preventDefault();
        e.stopPropagation();

        const item = menuItems[focusIndex];
        if (!item) return;

        switch (e.key) {
            case 'ArrowUp':
                moveFocus(-1);
                break;
            case 'ArrowDown':
                moveFocus(1);
                break;
            case 'ArrowLeft':
                adjustItem(item, -1);
                break;
            case 'ArrowRight':
                adjustItem(item, 1);
                break;
            case 'Enter':
            case ' ':
                activateItem(item);
                break;
            case 'q':
            case 'Q':
            case 'Backspace':
                hidePanel();
                break;
        }
        renderPanel();
    }

    function moveFocus(dir) {
        let next = focusIndex + dir;
        // Skip headers
        while (next >= 0 && next < menuItems.length && menuItems[next].type === 'header') {
            next += dir;
        }
        if (next >= 0 && next < menuItems.length) {
            focusIndex = next;
        }
    }

    function adjustItem(item, dir) {
        if (item.type === 'slider') {
            const step = item.step || 1;
            let val = config[item.key] + step * dir;
            val = Math.round(val * 1000) / 1000; // avoid float drift
            val = Math.max(item.min, Math.min(item.max, val));
            config[item.key] = val;
            save();
            applyConfig();
        } else if (item.type === 'mode') {
            // Left/Right toggle enabled status
            item.toggleEnabled();
            buildMenu();
        }
    }

    function activateItem(item) {
        switch (item.type) {
            case 'toggle':
                item.set(!item.get());
                break;
            case 'action':
                item.action();
                break;
            case 'mode':
                // Enter activates (switches to) the mode
                item.activate();
                break;
            case 'slider':
                // Enter on slider does nothing special (use arrows)
                break;
        }
    }

    // --- Panel UI ---
    function togglePanel() {
        panelVisible = !panelVisible;
        if (panelVisible) showPanel();
        else hidePanel();
    }

    function showPanel() {
        panelVisible = true;
        if (!panelEl) createPanel();
        buildMenu();
        renderPanel();
        panelEl.style.display = 'flex';
        panelEl.style.opacity = '0';
        requestAnimationFrame(() => { panelEl.style.opacity = '1'; });
    }

    function hidePanel() {
        panelVisible = false;
        if (panelEl) {
            panelEl.style.opacity = '0';
            setTimeout(() => { if (panelEl) panelEl.style.display = 'none'; }, 300);
        }
    }

    function createPanel() {
        panelEl = document.createElement('div');
        panelEl.id = 'admin-panel';
        panelEl.innerHTML = '<div class="admin-inner"></div>';
        document.body.appendChild(panelEl);

        // Keyboard handler (capture phase, only when panel visible)
        window.addEventListener('keydown', (e) => {
            if (panelVisible) handlePanelKey(e);
        }, true);

        const style = document.createElement('style');
        style.textContent = `
            #admin-panel {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.8);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                transition: opacity 0.3s ease;
                cursor: default;
                font-family: 'Consolas', 'SF Mono', monospace;
            }
            #admin-panel .admin-inner {
                background: #0d0d1a;
                color: #c8d0d8;
                border: 1px solid #2a2a4a;
                border-radius: 12px;
                padding: 24px 32px;
                width: 90vw;
                max-width: 560px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 0 40px rgba(100,150,255,0.1);
            }
            #admin-panel .panel-title {
                text-align: center;
                color: #6a8aaa;
                font-size: 0.75rem;
                margin-bottom: 12px;
                letter-spacing: 1px;
            }
            #admin-panel .menu-item {
                display: flex;
                align-items: center;
                padding: 6px 12px;
                margin: 2px 0;
                border-radius: 6px;
                font-size: 0.85rem;
                transition: background 0.1s;
                min-height: 28px;
            }
            #admin-panel .menu-item.focused {
                background: #1a2a4a;
                outline: 1px solid #4a7aaa;
            }
            #admin-panel .menu-item .label {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            #admin-panel .menu-item .val {
                color: #8ab8e8;
                font-size: 0.8rem;
                margin-left: 12px;
                min-width: 60px;
                text-align: right;
            }
            #admin-panel .menu-header {
                color: #5a7a5a;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 1.5px;
                padding: 12px 12px 4px;
                border-bottom: 1px solid #1a2a1a;
                margin-top: 4px;
            }
            #admin-panel .bar-track {
                width: 100px;
                height: 6px;
                background: #1a1a2e;
                border-radius: 3px;
                margin-left: 12px;
                position: relative;
                border: 1px solid #2a2a4a;
            }
            #admin-panel .bar-fill {
                height: 100%;
                border-radius: 3px;
                background: #4a8aba;
                transition: width 0.1s;
            }
            #admin-panel .focused .bar-fill {
                background: #6ab0e8;
            }
            #admin-panel .toggle-indicator {
                margin-left: 12px;
                font-size: 0.8rem;
            }
            #admin-panel .toggle-indicator.on { color: #6ae87a; }
            #admin-panel .toggle-indicator.off { color: #666; }
            #admin-panel .mode-active {
                color: #6ae87a;
                margin-left: 8px;
                font-size: 0.7rem;
            }
            #admin-panel .mode-disabled {
                color: #555;
                margin-left: 8px;
                font-size: 0.7rem;
            }
            #admin-panel .mode-enabled {
                color: #4a8aba;
                margin-left: 8px;
                font-size: 0.7rem;
            }
            #admin-panel .hint-bar {
                display: flex;
                justify-content: center;
                gap: 16px;
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid #1a2a3a;
                font-size: 0.65rem;
                color: #4a5a6a;
            }
            #admin-panel .hint-bar span { white-space: nowrap; }
        `;
        document.head.appendChild(style);
    }

    function renderPanel() {
        if (!panelEl) return;
        const inner = panelEl.querySelector('.admin-inner');
        let html = `<div class="panel-title">SETTINGS — ↑↓ Navigate · ←→ Adjust · Enter Select · Esc Close</div>`;

        menuItems.forEach((item, i) => {
            if (item.type === 'header') {
                html += `<div class="menu-header">${item.label}</div>`;
                return;
            }

            const focused = i === focusIndex ? ' focused' : '';
            html += `<div class="menu-item${focused}" data-idx="${i}">`;

            switch (item.type) {
                case 'slider': {
                    const val = config[item.key];
                    const pct = ((val - item.min) / (item.max - item.min)) * 100;
                    const display = Number.isInteger(val) ? val : val.toFixed(1);
                    html += `<span class="label">${item.label}</span>`;
                    html += `<span class="val">${display}${item.unit}</span>`;
                    html += `<div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>`;
                    break;
                }
                case 'toggle': {
                    const on = item.get();
                    html += `<span class="label">${item.label}</span>`;
                    html += `<span class="toggle-indicator ${on ? 'on' : 'off'}">${on ? '● ON' : '○ OFF'}</span>`;
                    break;
                }
                case 'action': {
                    html += `<span class="label">${item.label}</span>`;
                    break;
                }
                case 'mode': {
                    const active = item.isActive();
                    const enabled = item.isEnabled();
                    html += `<span class="label">${item.label}</span>`;
                    if (active) html += `<span class="mode-active">▶ PLAYING</span>`;
                    else if (enabled) html += `<span class="mode-enabled">✓</span>`;
                    else html += `<span class="mode-disabled">—</span>`;
                    break;
                }
            }
            html += `</div>`;
        });

        html += `<div class="hint-bar">
            <span>↑↓ Move</span>
            <span>←→ Adjust/Toggle Enable</span>
            <span>Enter Switch/Toggle</span>
            <span>Esc Close</span>
        </div>`;

        inner.innerHTML = html;

        // Scroll focused item into view
        const focusedEl = inner.querySelector('.focused');
        if (focusedEl) focusedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // --- Config Application (callbacks set by app.js) ---
    let onConfigChange = null;
    let onSwitchMode = null;
    let onNextMode = null;
    let onPrevMode = null;
    let getCurrentModeName = null;

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
        get isVisible() { return panelVisible; },
        set onConfigChange(fn) { onConfigChange = fn; },
        set onSwitchMode(fn) { onSwitchMode = fn; },
        set onNextMode(fn) { onNextMode = fn; },
        set onPrevMode(fn) { onPrevMode = fn; },
        set getCurrentModeName(fn) { getCurrentModeName = fn; },
    };
})();

