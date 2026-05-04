// Baby Smash - Gentle keyboard-driven visuals and sounds for infants
// Design principles: soft pastels, slow animations, pentatonic tones, no overstimulation

(function () {
    'use strict';

    // --- Configuration ---
    const CONFIG = {
        maxElements: 8,         // max concurrent elements to avoid visual overload
        elementDuration: 3000,  // how long elements live (ms)
        fadeInTime: 400,        // gentle fade in (ms)
        fadeOutTime: 1200,      // slow fade out (ms)
        minSize: 80,
        maxSize: 200,
        driftSpeed: 0.3,       // slow upward drift (px/frame)
        cooldown: 100,         // min ms between keypresses (debounce rapid smashing)
        autoRotateMin: 3 * 60 * 1000,  // 3 minutes
        autoRotateMax: 7 * 60 * 1000,  // 7 minutes
    };

    // Soft pastel palette
    const COLORS = [
        '#f4a7bb', // soft pink
        '#a7d8f4', // soft blue
        '#b8e6c8', // soft green
        '#f4dda7', // soft yellow
        '#c8b8f4', // soft lavender
        '#f4c8a7', // soft peach
        '#a7f4e6', // soft mint
        '#e6a7f4', // soft orchid
    ];

    // Pentatonic scale frequencies (C major pentatonic)
    const PENTATONIC = [
        261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25
    ];

    // Full chromatic for music mode (one octave)
    const XYLOPHONE = [
        { note: 'C', freq: 523.25, color: '#f4a7bb' },
        { note: 'D', freq: 587.33, color: '#f4c8a7' },
        { note: 'E', freq: 659.25, color: '#f4dda7' },
        { note: 'F', freq: 698.46, color: '#b8e6c8' },
        { note: 'G', freq: 783.99, color: '#a7f4e6' },
        { note: 'A', freq: 880.00, color: '#a7d8f4' },
        { note: 'B', freq: 987.77, color: '#c8b8f4' },
        { note: 'C', freq: 1046.50, color: '#e6a7f4' },
    ];

    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMBERS = '0123456789';

    // Animal shapes drawn as simplified SVG-like paths
    const ANIMAL_NAMES = ['cat', 'bird', 'fish', 'bunny', 'bear', 'turtle'];

    const ALL_MODES = [
        'shapes', 'bubbles', 'nature', 'letters', 'music', 'animals',
        // Flashcard modes (mapped to FLASHCARDS.categoryKeys)
        'colors', 'animals_fc', 'fruits', 'vehicles', 'nature_words', 'numbers', 'body_parts',
    ];

    // Map flashcard mode names to FLASHCARDS category keys
    const FLASHCARD_MODE_MAP = {
        'colors': 'colors',
        'animals_fc': 'animals',
        'fruits': 'fruits',
        'vehicles': 'vehicles',
        'nature_words': 'nature_words',
        'numbers': 'numbers',
        'body_parts': 'body_parts',
    };

    // --- State ---
    let canvas, ctx;
    let elements = [];
    let audioCtx = null;
    let lastKeyTime = 0;
    let animationId = null;
    let currentMode = 0;
    let activeModes = ALL_MODES.slice(); // filtered by admin config
    let autoRotateTimer = null;
    let xyloIndex = 0;
    let thirdLangRotation = 0;
    let started = false;
    let activeConfig = null; // live reference to admin config
    let flashcardLocked = false; // lock input during flashcard TTS

    // --- Image Manifest & Cache ---
    let imageManifest = null;
    const imageCache = {}; // path -> HTMLImageElement

    function loadImageManifest() {
        fetch('image-manifest.json')
            .then(r => r.json())
            .then(data => {
                imageManifest = data;
                // Preload first image of each item
                Object.values(data).forEach(paths => {
                    if (paths[0]) preloadImage(paths[0]);
                });
            })
            .catch(() => { imageManifest = null; });
    }

    // --- Audio Manifest & Cache ---
    let audioManifest = null;
    const audioCache = {}; // path -> HTMLAudioElement

    function loadAudioManifest() {
        fetch('audio-manifest.json')
            .then(r => r.json())
            .then(data => {
                audioManifest = data;
                console.log('[BabySmash] Audio manifest loaded:', Object.keys(data).length, 'items');
                // Preload English audio for quick response
                Object.values(data).forEach(langs => {
                    if (langs.en) preloadAudio(langs.en);
                });
            })
            .catch(e => {
                audioManifest = null;
                console.warn('[BabySmash] Audio manifest failed (using browser TTS):', e.message || e);
            });
    }

    function preloadAudio(path) {
        if (audioCache[path]) return audioCache[path];
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = path;
        audioCache[path] = audio;
        return audio;
    }

    function getFlashcardAudio(categoryKey, itemEn, lang) {
        if (!audioManifest) return null;
        const key = categoryKey + '/' + itemEn.toLowerCase();
        const entry = audioManifest[key];
        if (!entry || !entry[lang]) return null;
        return preloadAudio(entry[lang]);
    }

    function playPregenAudio(audioEl, volume, fallbackFn) {
        if (!audioEl || !audioEl.src) {
            if (fallbackFn) fallbackFn();
            return;
        }
        // Reset and play the original element (already has data loaded)
        audioEl.currentTime = 0;
        audioEl.volume = volume;
        const playPromise = audioEl.play();
        if (playPromise) {
            playPromise.catch(() => {
                // Pre-gen audio failed, use browser TTS fallback
                if (fallbackFn) fallbackFn();
            });
        }
    }

    function preloadImage(path) {
        if (imageCache[path]) return imageCache[path];
        const img = new Image();
        img.src = path;
        imageCache[path] = img;
        return img;
    }

    function getFlashcardImage(categoryKey, itemEn) {
        if (!imageManifest) return null;
        const key = categoryKey + '/' + itemEn.toLowerCase();
        const paths = imageManifest[key];
        if (!paths || paths.length === 0) return null;
        const chosen = paths[Math.floor(Math.random() * paths.length)];
        return preloadImage(chosen);
    }

    // --- Audio ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playBellTone(frequency, volume) {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const vol = volume != null ? volume : 0.15;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol * masterScale, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(vol * 0.2 * masterScale, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain).connect(audioCtx.destination);
        osc2.connect(gain2).connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
        osc2.start(now);
        osc2.stop(now + 0.8);
    }

    function playPop() {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

        gain.gain.setValueAtTime(0.12 * masterScale, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // Wind chime hit: metallic resonant tone with harmonics
    function playWindChime() {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        // Pentatonic scale for pleasant random chimes
        const chimeScale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
        const fundamental = chimeScale[Math.floor(Math.random() * chimeScale.length)];

        // Fundamental
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(fundamental, now);
        gain1.gain.setValueAtTime(0.07 * masterScale, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc1.connect(gain1).connect(audioCtx.destination);
        osc1.start(now);
        osc1.stop(now + 2.5);

        // 2nd harmonic (slightly inharmonic for metallic character)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(fundamental * 2.76, now);
        gain2.gain.setValueAtTime(0.035 * masterScale, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc2.connect(gain2).connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + 1.8);

        // 3rd harmonic
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(fundamental * 5.4, now);
        gain3.gain.setValueAtTime(0.015 * masterScale, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc3.connect(gain3).connect(audioCtx.destination);
        osc3.start(now);
        osc3.stop(now + 1.0);
    }

    function playNatureSound(type) {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        // Always play a wind chime hit
        playWindChime();

        // Plus a type-specific accent
        if (type === 'raindrop') {
            // Gentle water drop plink
            const freq = 1800 + Math.random() * 600;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.2);
            gain.gain.setValueAtTime(0.04 * masterScale, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now + 0.05);
            osc.stop(now + 0.4);

        } else if (type === 'leaf') {
            // Soft rustle/whoosh
            const baseFreq = 250 + Math.random() * 150;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            const filter = audioCtx.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(baseFreq, now);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(baseFreq * 3, now);
            filter.frequency.linearRampToValueAtTime(baseFreq * 1.5, now + 0.5);
            filter.Q.setValueAtTime(0.8, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.025 * masterScale, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(filter).connect(gain).connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.6);

        } else if (type === 'cloud') {
            // Extra soft airy pad on top of chime
            const freq = 200 + Math.random() * 80;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.025 * masterScale, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.8);

        } else if (type === 'snowflake') {
            // Crystalline sparkle: high tiny ping
            const freq = 2400 + Math.random() * 800;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.3);
            gain.gain.setValueAtTime(0.03 * masterScale, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.5);

        } else if (type === 'butterfly') {
            // Fluttery: quick series of soft high notes
            const baseFreq = 900 + Math.random() * 400;
            for (let i = 0; i < 3; i++) {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq * (1 + i * 0.15), now + i * 0.08);
                gain.gain.setValueAtTime(0.025 * masterScale, now + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                osc.connect(gain).connect(audioCtx.destination);
                osc.start(now + i * 0.08);
                osc.stop(now + i * 0.08 + 0.2);
            }
        }
        // flower, sun, mushroom: just the wind chime is enough
    }

    function playXylophone(freq) {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2 * masterScale, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 3, now);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.04 * masterScale, now + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain).connect(audioCtx.destination);
        osc2.connect(gain2).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.0);
        osc2.start(now);
        osc2.stop(now + 0.3);
    }

    function playAnimalSound() {
        if (!audioCtx) return;
        if (activeConfig && !activeConfig.soundEnabled) return;
        const masterScale = activeConfig ? activeConfig.masterVolume / 100 : 1;
        const now = audioCtx.currentTime;

        // Gentle warbling tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();

        const baseFreq = 300 + Math.random() * 400;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(4 + Math.random() * 4, now);
        lfoGain.gain.setValueAtTime(30, now);

        lfo.connect(lfoGain).connect(osc.frequency);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1 * masterScale, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain).connect(audioCtx.destination);
        lfo.start(now);
        osc.start(now);
        osc.stop(now + 0.8);
        lfo.stop(now + 0.8);
    }

    function speakLetter(char) {
        if (!('speechSynthesis' in window)) return;
        if (activeConfig && !activeConfig.ttsEnabled) return;
        speechSynthesis.cancel(); // Prevent queue buildup
        const rate = activeConfig ? activeConfig.ttsRate : 0.8;
        const pitch = activeConfig ? activeConfig.ttsPitch : 1.2;
        const vol = activeConfig ? activeConfig.masterVolume / 100 : 0.7;
        const utter = new SpeechSynthesisUtterance(char);
        utter.lang = 'en-US';
        const voice = FLASHCARDS.getBestVoice && FLASHCARDS.getBestVoice('en-US');
        if (voice) utter.voice = voice;
        utter.rate = rate;
        utter.pitch = pitch;
        utter.volume = vol;
        // Small delay after cancel to avoid race condition
        setTimeout(() => { speechSynthesis.speak(utter); }, 50);
        playBellTone(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)], 0.08);
    }

    // --- Element Creation per Mode ---

    function createShapeElement() {
        const types = ['circle', 'rounded-square', 'star', 'heart', 'diamond'];
        const type = types[Math.floor(Math.random() * types.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
        const x = size + Math.random() * (canvas.width - size * 2);
        const y = size + Math.random() * (canvas.height - size * 2);

        elements.push({
            mode: 'shapes',
            type,
            x, y, size, color,
            rotation: Math.random() * Math.PI * 2,
            createdAt: Date.now(),
            opacity: 0,
        });

        playBellTone(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]);
    }

    function createBubbleElement() {
        const size = 60 + Math.random() * 140;
        const x = size + Math.random() * (canvas.width - size * 2);
        const y = canvas.height * 0.5 + Math.random() * (canvas.height * 0.4);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        elements.push({
            mode: 'bubbles',
            x, y, size, color,
            wobblePhase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02,
            createdAt: Date.now(),
            opacity: 0,
        });

        playPop();
    }

    function createNatureElement() {
        const types = ['leaf', 'cloud', 'raindrop', 'flower', 'butterfly', 'snowflake', 'sun', 'mushroom'];
        const type = types[Math.floor(Math.random() * types.length)];
        const size = type === 'cloud' ? 120 + Math.random() * 100 :
                     type === 'sun' ? 80 + Math.random() * 60 :
                     type === 'butterfly' ? 50 + Math.random() * 40 :
                     type === 'flower' ? 50 + Math.random() * 50 :
                     type === 'mushroom' ? 45 + Math.random() * 35 :
                     40 + Math.random() * 60;
        const x = Math.random() * canvas.width;
        const y = type === 'raindrop' || type === 'snowflake' ? -size :
                  type === 'sun' ? 60 + Math.random() * canvas.height * 0.3 :
                  Math.random() * canvas.height * 0.7;

        const natureColors = {
            leaf: ['#8bc78b', '#a3d4a3', '#6db86d', '#b8e6b8', '#d4a850'],
            cloud: ['#e8e8f0', '#d8dce8', '#f0f0f8'],
            raindrop: ['#a7d8f4', '#8ec8f0', '#b8e4ff'],
            flower: ['#f4a0b8', '#e87070', '#e8d870', '#b070e8', '#f0a0f0', '#ff9070'],
            butterfly: ['#e8a0d0', '#a0c8f0', '#f0d080', '#a0e8c0', '#d0a0f0'],
            snowflake: ['#d8e8ff', '#e0f0ff', '#c8d8f4', '#ffffff'],
            sun: ['#f4d03f', '#f0c040', '#f8e070'],
            mushroom: ['#e87070', '#f4a0a0', '#d4a878', '#e8c8a0'],
        };
        const colorSet = natureColors[type];
        const color = colorSet[Math.floor(Math.random() * colorSet.length)];

        elements.push({
            mode: 'nature',
            type, x, y, size, color,
            rotation: Math.random() * Math.PI * 2,
            drift: type === 'leaf' ? { dx: (Math.random() - 0.5) * 0.5, dy: 0.3 } :
                   type === 'raindrop' ? { dx: 0, dy: 1.5 } :
                   type === 'snowflake' ? { dx: (Math.random() - 0.5) * 0.3, dy: 0.4 } :
                   type === 'butterfly' ? { dx: (Math.random() - 0.5) * 1.2, dy: -0.3 } :
                   type === 'flower' ? { dx: 0, dy: 0 } :
                   type === 'mushroom' ? { dx: 0, dy: 0 } :
                   type === 'sun' ? { dx: 0, dy: 0 } :
                   { dx: 0.2, dy: 0 },
            wingPhase: Math.random() * Math.PI * 2, // for butterfly
            createdAt: Date.now(),
            opacity: 0,
        });

        playNatureSound(type);
    }

    function createLetterElement() {
        const chars = LETTERS + NUMBERS;
        const char = chars[Math.floor(Math.random() * chars.length)];
        const size = 120 + Math.random() * 80;
        const x = size + Math.random() * (canvas.width - size * 2);
        const y = size + Math.random() * (canvas.height - size * 2);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        elements.push({
            mode: 'letters',
            char, x, y, size, color,
            rotation: (Math.random() - 0.5) * 0.3,
            createdAt: Date.now(),
            opacity: 0,
        });

        speakLetter(char);
    }

    function createMusicElement() {
        const xylo = XYLOPHONE[xyloIndex % XYLOPHONE.length];
        xyloIndex++;

        const barWidth = canvas.width / XYLOPHONE.length;
        const barIndex = XYLOPHONE.indexOf(xylo);
        const x = barWidth * barIndex + barWidth / 2;
        const y = canvas.height / 2;

        elements.push({
            mode: 'music',
            note: xylo.note,
            x, y,
            size: barWidth * 0.8,
            color: xylo.color,
            barIndex,
            createdAt: Date.now(),
            opacity: 0,
        });

        playXylophone(xylo.freq);
    }

    function createAnimalElement() {
        const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
        const size = 120 + Math.random() * 80;
        const x = size + Math.random() * (canvas.width - size * 2);
        const y = size + Math.random() * (canvas.height - size * 2);
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        elements.push({
            mode: 'animals',
            animal, x, y, size, color,
            createdAt: Date.now(),
            opacity: 0,
        });

        playAnimalSound();
    }

    function createElement() {
        // In flashcard modes, lock input until TTS finishes
        if (flashcardLocked) return;

        const maxEl = activeConfig ? activeConfig.maxElements : CONFIG.maxElements;
        if (elements.length >= maxEl) {
            elements.shift();
        }

        const modeName = activeModes[currentMode % activeModes.length];

        // Check if it's a flashcard mode
        if (FLASHCARD_MODE_MAP[modeName]) {
            createFlashcardElement(FLASHCARD_MODE_MAP[modeName]);
            return;
        }

        switch (modeName) {
            case 'shapes': createShapeElement(); break;
            case 'bubbles': createBubbleElement(); break;
            case 'nature': createNatureElement(); break;
            case 'letters': createLetterElement(); break;
            case 'music': createMusicElement(); break;
            case 'animals': createAnimalElement(); break;
        }
    }

    // --- Flashcard Element ---
    function createFlashcardElement(categoryKey) {
        const item = FLASHCARDS.getRandomItem(categoryKey);
        const size = 300 + Math.random() * 90;
        const x = canvas.width * 0.5 + (Math.random() - 0.5) * canvas.width * 0.2;
        const y = canvas.height * 0.4;

        // Calculate how long TTS will take
        const delay = activeConfig ? activeConfig.ttsDelayBetween : 1200;
        const hasThirdLang = activeConfig ?
            Object.values(activeConfig.enabledLanguages).some(v => v) : true;
        const ttsDuration = hasThirdLang ? delay * 2 + 1500 : delay + 1500;
        const flashcardDuration = Math.max(ttsDuration + 500, 5000);

        // Try to get a photo for this item
        const photo = getFlashcardImage(categoryKey, item.en);

        // Clear previous flashcard elements (show one at a time)
        elements = elements.filter(el => el.mode !== 'flashcard');

        elements.push({
            mode: 'flashcard',
            categoryKey,
            item,
            photo,  // HTMLImageElement or null
            x, y, size,
            createdAt: Date.now(),
            customDuration: flashcardDuration,
            opacity: 0,
        });

        // Lock input during TTS
        flashcardLocked = true;
        setTimeout(() => { flashcardLocked = false; }, flashcardDuration - 500);

        // Play a gentle bell + TTS
        playBellTone(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)], 0.08);
        if (!activeConfig || activeConfig.ttsEnabled !== false) {
            speakFlashcard(item);
        }
    }

    function speakFlashcard(item) {
        const rate = activeConfig ? activeConfig.ttsRate : 0.8;
        const pitch = activeConfig ? activeConfig.ttsPitch : 1.1;
        const vol = activeConfig ? activeConfig.masterVolume / 100 : 0.8;
        const delay = activeConfig ? activeConfig.ttsDelayBetween : 1200;

        // Determine enabled third languages
        const enabledLangs = [];
        if (activeConfig) {
            if (activeConfig.enabledLanguages['ja-JP']) enabledLangs.push({ code: 'ja-JP', key: 'ja' });
            if (activeConfig.enabledLanguages['hi-IN']) enabledLangs.push({ code: 'hi-IN', key: 'hi' });
            if (activeConfig.enabledLanguages['es-ES']) enabledLangs.push({ code: 'es-ES', key: 'es' });
        } else {
            enabledLangs.push({ code: 'ja-JP', key: 'ja' }, { code: 'hi-IN', key: 'hi' }, { code: 'es-ES', key: 'es' });
        }

        // Build the TTS sequence: English, Chinese, + one rotating third language
        // Start with 100ms offset to avoid cancel/speak race condition
        const sequence = [
            { text: item.en, lang: 'en-US', langKey: 'en', delay: 100 },
            { text: item.zh, lang: 'zh-CN', langKey: 'zh', delay: delay + 100 },
        ];

        if (enabledLangs.length > 0) {
            const third = enabledLangs[thirdLangRotation % enabledLangs.length];
            thirdLangRotation++;
            sequence.push({ text: item[third.key], lang: third.code, langKey: third.key, delay: delay * 2 + 100 });
        }

        // Find the current flashcard's category key for audio lookup
        const currentEl = elements.find(el => el.mode === 'flashcard' && el.item === item);
        const catKey = currentEl ? currentEl.categoryKey : null;

        // Cancel any ongoing browser TTS
        if ('speechSynthesis' in window) speechSynthesis.cancel();

        sequence.forEach(({ text, lang, langKey, delay: d }) => {
            setTimeout(() => {
                const browserTtsFallback = () => {
                    if (!('speechSynthesis' in window)) return;
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.lang = lang;
                    const voice = FLASHCARDS.getBestVoice && FLASHCARDS.getBestVoice(lang);
                    if (voice) utter.voice = voice;
                    utter.rate = rate;
                    utter.pitch = pitch;
                    utter.volume = vol;
                    speechSynthesis.speak(utter);
                };

                // Try pre-generated audio first
                if (catKey) {
                    const audio = getFlashcardAudio(catKey, item.en, langKey);
                    if (audio && audio.src) {
                        playPregenAudio(audio, vol, browserTtsFallback);
                        return;
                    }
                }
                // No pre-gen available, use browser TTS directly
                browserTtsFallback();
            }, d);
        });
    }

    // --- Drawing Functions ---

    function getOpacity(el, now, customDuration) {
        const duration = customDuration || (activeConfig ? activeConfig.elementDuration : CONFIG.elementDuration);
        const fadeIn = activeConfig ? activeConfig.fadeInTime : CONFIG.fadeInTime;
        const fadeOut = activeConfig ? activeConfig.fadeOutTime : CONFIG.fadeOutTime;
        const age = now - el.createdAt;
        if (age < fadeIn) return age / fadeIn;
        if (age > duration - fadeOut) {
            return Math.max(0, (duration - age) / fadeOut);
        }
        return 1;
    }

    // Shape drawing helpers
    function drawCircle(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRoundedSquare(x, y, size) {
        const h = size / 2, r = size * 0.2;
        ctx.beginPath();
        ctx.moveTo(x - h + r, y - h);
        ctx.lineTo(x + h - r, y - h);
        ctx.quadraticCurveTo(x + h, y - h, x + h, y - h + r);
        ctx.lineTo(x + h, y + h - r);
        ctx.quadraticCurveTo(x + h, y + h, x + h - r, y + h);
        ctx.lineTo(x - h + r, y + h);
        ctx.quadraticCurveTo(x - h, y + h, x - h, y + h - r);
        ctx.lineTo(x - h, y - h + r);
        ctx.quadraticCurveTo(x - h, y - h, x - h + r, y - h);
        ctx.closePath();
        ctx.fill();
    }

    function drawStar(x, y, size) {
        const spikes = 5, outer = size / 2, inner = size / 4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const r = i % 2 === 0 ? outer : inner;
            const a = (i * Math.PI) / spikes - Math.PI / 2;
            const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawHeart(x, y, size) {
        const s = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.3);
        ctx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y + s * 0.1);
        ctx.bezierCurveTo(x - s, y + s * 0.6, x, y + s * 0.8, x, y + s);
        ctx.bezierCurveTo(x, y + s * 0.8, x + s, y + s * 0.6, x + s, y + s * 0.1);
        ctx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    function drawDiamond(x, y, size) {
        const h = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + h * 0.6, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - h * 0.6, y);
        ctx.closePath();
        ctx.fill();
    }

    // Bubble drawing
    function drawBubble(el) {
        ctx.save();
        ctx.globalAlpha = el.opacity * 0.6;
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.size / 2, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.globalAlpha = el.opacity * 0.3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(el.x - el.size * 0.15, el.y - el.size * 0.15, el.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Nature drawing
    function drawLeaf(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.quadraticCurveTo(x + size / 2, y, x, y + size / 2);
        ctx.quadraticCurveTo(x - size / 2, y, x, y - size / 2);
        ctx.closePath();
        ctx.fill();
        // Stem
        ctx.strokeStyle = '#6a9b6a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.lineTo(x, y + size / 2);
        ctx.stroke();
    }

    function drawCloud(x, y, size) {
        const r = size / 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.arc(x + r, y - r * 0.3, r * 0.8, 0, Math.PI * 2);
        ctx.arc(x - r, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
        ctx.arc(x + r * 0.5, y + r * 0.2, r * 0.6, 0, Math.PI * 2);
        ctx.arc(x - r * 0.6, y + r * 0.3, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRaindrop(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size / 2);
        ctx.quadraticCurveTo(x + size / 3, y, x, y + size / 2);
        ctx.quadraticCurveTo(x - size / 3, y, x, y - size / 2);
        ctx.closePath();
        ctx.fill();
    }

    function drawFlower(x, y, size, color) {
        const petalCount = 5 + Math.floor(Math.random() * 3);
        const petalR = size * 0.35;
        // Petals
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const px = x + Math.cos(angle) * petalR;
            const py = y + Math.sin(angle) * petalR;
            ctx.beginPath();
            ctx.ellipse(px, py, petalR * 0.6, petalR * 0.35, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        // Center
        ctx.fillStyle = '#f8e060';
        ctx.beginPath();
        ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawButterfly(x, y, size, color, wingPhase) {
        const wingSpread = 0.5 + Math.abs(Math.sin(wingPhase)) * 0.5;
        // Left wing
        ctx.save();
        ctx.scale(wingSpread, 1);
        ctx.beginPath();
        ctx.ellipse(x / wingSpread - size * 0.3, y - size * 0.1, size * 0.35, size * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Left lower wing
        ctx.beginPath();
        ctx.ellipse(x / wingSpread - size * 0.2, y + size * 0.15, size * 0.2, size * 0.18, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Right wing
        ctx.save();
        ctx.scale(wingSpread, 1);
        ctx.beginPath();
        ctx.ellipse(x / wingSpread + size * 0.3, y - size * 0.1, size * 0.35, size * 0.25, 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Right lower wing
        ctx.beginPath();
        ctx.ellipse(x / wingSpread + size * 0.2, y + size * 0.15, size * 0.2, size * 0.18, 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Body
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.05, size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        // Antennae
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.2);
        ctx.quadraticCurveTo(x - size * 0.15, y - size * 0.4, x - size * 0.1, y - size * 0.45);
        ctx.moveTo(x, y - size * 0.2);
        ctx.quadraticCurveTo(x + size * 0.15, y - size * 0.4, x + size * 0.1, y - size * 0.45);
        ctx.stroke();
    }

    function drawSnowflake(x, y, size) {
        ctx.strokeStyle = ctx.fillStyle;
        ctx.lineWidth = 2;
        const arms = 6;
        const r = size * 0.4;
        for (let i = 0; i < arms; i++) {
            const angle = (i / arms) * Math.PI * 2;
            const ex = x + Math.cos(angle) * r;
            const ey = y + Math.sin(angle) * r;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            // Small branches
            const branchLen = r * 0.35;
            const bx = x + Math.cos(angle) * r * 0.6;
            const by = y + Math.sin(angle) * r * 0.6;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(angle + 0.6) * branchLen, by + Math.sin(angle + 0.6) * branchLen);
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(angle - 0.6) * branchLen, by + Math.sin(angle - 0.6) * branchLen);
            ctx.stroke();
        }
        // Center dot
        ctx.beginPath();
        ctx.arc(x, y, size * 0.06, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawSun(x, y, size, color) {
        // Rays
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        const rays = 10;
        for (let i = 0; i < rays; i++) {
            const angle = (i / rays) * Math.PI * 2;
            const inner = size * 0.35;
            const outer = size * 0.5;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
            ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
            ctx.stroke();
        }
        // Circle body
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        // Happy face
        ctx.fillStyle = '#c89030';
        ctx.beginPath();
        ctx.arc(x - size * 0.1, y - size * 0.05, size * 0.04, 0, Math.PI * 2);
        ctx.arc(x + size * 0.1, y - size * 0.05, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c89030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + size * 0.05, size * 0.1, 0.1, Math.PI - 0.1);
        ctx.stroke();
    }

    function drawMushroom(x, y, size, color) {
        // Stem
        ctx.fillStyle = '#f0e8d8';
        ctx.beginPath();
        ctx.moveTo(x - size * 0.12, y);
        ctx.lineTo(x - size * 0.15, y + size * 0.35);
        ctx.quadraticCurveTo(x, y + size * 0.4, x + size * 0.15, y + size * 0.35);
        ctx.lineTo(x + size * 0.12, y);
        ctx.closePath();
        ctx.fill();
        // Cap
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y - size * 0.05, size * 0.35, size * 0.28, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        // Spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x - size * 0.12, y - size * 0.18, size * 0.06, 0, Math.PI * 2);
        ctx.arc(x + size * 0.1, y - size * 0.15, size * 0.05, 0, Math.PI * 2);
        ctx.arc(x + size * 0.02, y - size * 0.25, size * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }

    // Letter drawing
    function drawLetter(el) {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.rotate(el.rotation);
        ctx.globalAlpha = el.opacity;
        ctx.fillStyle = el.color;
        ctx.font = `bold ${el.size}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.char, 0, 0);
        ctx.restore();
    }

    // Music bar drawing
    function drawMusicBar(el) {
        ctx.save();
        ctx.globalAlpha = el.opacity;
        const barWidth = el.size;
        const barHeight = canvas.height * 0.6;
        const x = el.x - barWidth / 2;
        const y = canvas.height * 0.2;

        // Bar background
        ctx.fillStyle = el.color;
        ctx.beginPath();
        const r = barWidth * 0.15;
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barWidth - r, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + r);
        ctx.lineTo(x + barWidth, y + barHeight - r);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - r, y + barHeight);
        ctx.lineTo(x + r, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // Note label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${barWidth * 0.4}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.note, el.x, y + barHeight - barWidth * 0.5);

        ctx.restore();
    }

    // Animal drawing (simple silhouettes)
    function drawAnimal(el) {
        ctx.save();
        ctx.translate(el.x, el.y);
        ctx.globalAlpha = el.opacity;
        ctx.fillStyle = el.color;
        const s = el.size / 2;

        switch (el.animal) {
            case 'cat':
                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, s * 0.5, s * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(0, -s * 0.5, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Ears
                ctx.beginPath();
                ctx.moveTo(-s * 0.25, -s * 0.7);
                ctx.lineTo(-s * 0.1, -s * 0.95);
                ctx.lineTo(s * 0.05, -s * 0.7);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(s * 0.05, -s * 0.7);
                ctx.lineTo(s * 0.15, -s * 0.95);
                ctx.lineTo(s * 0.3, -s * 0.7);
                ctx.fill();
                break;
            case 'bird':
                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, s * 0.4, s * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(s * 0.3, -s * 0.2, s * 0.2, 0, Math.PI * 2);
                ctx.fill();
                // Beak
                ctx.beginPath();
                ctx.moveTo(s * 0.5, -s * 0.2);
                ctx.lineTo(s * 0.7, -s * 0.15);
                ctx.lineTo(s * 0.5, -s * 0.1);
                ctx.closePath();
                ctx.fill();
                // Wing
                ctx.beginPath();
                ctx.ellipse(-s * 0.1, -s * 0.1, s * 0.25, s * 0.15, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'fish':
                // Body
                ctx.beginPath();
                ctx.ellipse(0, 0, s * 0.5, s * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Tail
                ctx.beginPath();
                ctx.moveTo(-s * 0.45, 0);
                ctx.lineTo(-s * 0.75, -s * 0.25);
                ctx.lineTo(-s * 0.75, s * 0.25);
                ctx.closePath();
                ctx.fill();
                // Eye
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(s * 0.2, -s * 0.05, s * 0.08, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bunny':
                // Body
                ctx.beginPath();
                ctx.ellipse(0, s * 0.1, s * 0.35, s * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(0, -s * 0.4, s * 0.25, 0, Math.PI * 2);
                ctx.fill();
                // Ears
                ctx.beginPath();
                ctx.ellipse(-s * 0.12, -s * 0.8, s * 0.08, s * 0.25, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(s * 0.12, -s * 0.8, s * 0.08, s * 0.25, 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bear':
                // Body
                ctx.beginPath();
                ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.45, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(0, -s * 0.4, s * 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Ears
                ctx.beginPath();
                ctx.arc(-s * 0.25, -s * 0.6, s * 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(s * 0.25, -s * 0.6, s * 0.1, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'turtle':
                // Shell
                ctx.beginPath();
                ctx.ellipse(0, 0, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();
                // Head
                ctx.beginPath();
                ctx.arc(s * 0.45, 0, s * 0.15, 0, Math.PI * 2);
                ctx.fill();
                // Legs
                ctx.beginPath();
                ctx.ellipse(-s * 0.2, s * 0.3, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(s * 0.2, s * 0.3, s * 0.08, s * 0.12, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }

    // --- Main Draw Dispatcher ---
    function drawElement(el) {
        switch (el.mode) {
            case 'shapes':
                ctx.save();
                ctx.translate(el.x, el.y);
                ctx.rotate(el.rotation);
                ctx.globalAlpha = el.opacity;
                ctx.fillStyle = el.color;
                switch (el.type) {
                    case 'circle': drawCircle(0, 0, el.size); break;
                    case 'rounded-square': drawRoundedSquare(0, 0, el.size); break;
                    case 'star': drawStar(0, 0, el.size); break;
                    case 'heart': drawHeart(0, 0, el.size); break;
                    case 'diamond': drawDiamond(0, 0, el.size); break;
                }
                ctx.restore();
                break;
            case 'bubbles':
                drawBubble(el);
                break;
            case 'nature':
                ctx.save();
                ctx.translate(el.x, el.y);
                ctx.rotate(el.rotation);
                ctx.globalAlpha = el.opacity;
                ctx.fillStyle = el.color;
                switch (el.type) {
                    case 'leaf': drawLeaf(0, 0, el.size); break;
                    case 'cloud': drawCloud(0, 0, el.size); break;
                    case 'raindrop': drawRaindrop(0, 0, el.size); break;
                    case 'flower': drawFlower(0, 0, el.size, el.color); break;
                    case 'butterfly': drawButterfly(0, 0, el.size, el.color, el.wingPhase); break;
                    case 'snowflake': drawSnowflake(0, 0, el.size); break;
                    case 'sun': drawSun(0, 0, el.size, el.color); break;
                    case 'mushroom': drawMushroom(0, 0, el.size, el.color); break;
                }
                ctx.restore();
                break;
            case 'letters':
                drawLetter(el);
                break;
            case 'music':
                drawMusicBar(el);
                break;
            case 'animals':
                drawAnimal(el);
                break;
            case 'flashcard':
                drawFlashcard(el);
                break;
        }
    }

    // --- Flashcard Drawing ---
    function drawFlashcard(el) {
        ctx.save();
        ctx.globalAlpha = el.opacity;

        const imgSize = el.size;

        // Try photo first, fallback to programmatic drawing
        if (el.photo && el.photo.complete && el.photo.naturalWidth > 0) {
            // Draw photo centered, fitted into a rounded square
            const aspect = el.photo.naturalWidth / el.photo.naturalHeight;
            let dw, dh;
            if (aspect > 1) { dw = imgSize; dh = imgSize / aspect; }
            else { dh = imgSize; dw = imgSize * aspect; }

            const dx = el.x - dw / 2;
            const dy = el.y - dh / 2 - imgSize * 0.15;
            const radius = 16;

            // Rounded clip
            ctx.beginPath();
            ctx.moveTo(dx + radius, dy);
            ctx.lineTo(dx + dw - radius, dy);
            ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + radius);
            ctx.lineTo(dx + dw, dy + dh - radius);
            ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - radius, dy + dh);
            ctx.lineTo(dx + radius, dy + dh);
            ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - radius);
            ctx.lineTo(dx, dy + radius);
            ctx.quadraticCurveTo(dx, dy, dx + radius, dy);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(el.photo, dx, dy, dw, dh);

            // Subtle border
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            // Fallback: programmatic drawing from FLASHCARDS
            const cat = FLASHCARDS.CATEGORIES[el.categoryKey];
            if (cat && cat.draw) {
                cat.draw(ctx, el.item, el.x, el.y - imgSize * 0.15, el.size);
            }
        }

        // Draw the word below the visual
        const fontSize = el.size * 0.18;
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const textY = el.y + el.size * 0.35;

        // English
        ctx.fillStyle = '#5a6a7a';
        ctx.fillText(el.item.en, el.x, textY);
        // Chinese
        ctx.font = `${fontSize * 0.85}px system-ui`;
        ctx.fillStyle = '#7a8a9a';
        ctx.fillText(el.item.zh, el.x, textY + fontSize * 1.2);

        ctx.restore();
    }

    // --- Update ---
    function updateElement(el, now) {
        const baseDuration = activeConfig ? activeConfig.elementDuration : CONFIG.elementDuration;
        const duration = el.customDuration || baseDuration;
        const age = now - el.createdAt;
        if (age > duration) return false;

        el.opacity = getOpacity(el, now, duration);
        const drift = activeConfig ? activeConfig.driftSpeed : CONFIG.driftSpeed;

        switch (el.mode) {
            case 'shapes':
                el.y -= drift;
                el.rotation += 0.002;
                break;
            case 'bubbles':
                el.y -= drift * 1.5;
                el.wobblePhase += el.wobbleSpeed;
                el.x += Math.sin(el.wobblePhase) * 0.5;
                break;
            case 'nature':
                if (el.drift) {
                    el.x += el.drift.dx;
                    el.y += el.drift.dy;
                    if (el.type === 'leaf') el.rotation += 0.01;
                    if (el.type === 'snowflake') el.rotation += 0.005;
                    if (el.type === 'butterfly') {
                        el.wingPhase += 0.08;
                        el.y += Math.sin(el.wingPhase) * 0.3;
                    }
                    if (el.type === 'sun') el.rotation += 0.003;
                }
                break;
            case 'letters':
                el.y -= drift * 0.5;
                break;
            case 'music':
                break;
            case 'animals':
                el.y -= drift * 0.3;
                break;
            case 'flashcard':
                // Flashcards stay mostly still, very gentle float
                el.y -= drift * 0.15;
                break;
        }

        return true;
    }

    // --- Mode Management ---
    function rebuildActiveModes() {
        if (activeConfig) {
            activeModes = ALL_MODES.filter(m => activeConfig.enabledModes[m]);
        } else {
            activeModes = ALL_MODES.slice();
        }
        if (activeModes.length === 0) activeModes = ['shapes']; // fallback
        if (currentMode >= activeModes.length) currentMode = 0;
    }

    function switchMode(index) {
        currentMode = index % activeModes.length;
        elements = [];
        xyloIndex = 0;
        scheduleAutoRotate();
    }

    function nextMode() {
        switchMode((currentMode + 1) % activeModes.length);
    }

    function scheduleAutoRotate() {
        if (autoRotateTimer) { clearTimeout(autoRotateTimer); autoRotateTimer = null; }
        if (activeConfig && !activeConfig.autoRotateEnabled) return;
        const min = activeConfig ? activeConfig.autoRotateMin * 60 * 1000 : CONFIG.autoRotateMin;
        const max = activeConfig ? activeConfig.autoRotateMax * 60 * 1000 : CONFIG.autoRotateMax;
        const delay = min + Math.random() * (max - min);
        autoRotateTimer = setTimeout(nextMode, delay);
    }

    // --- Mode indicator (subtle, top-right) ---
    function drawModeIndicator() {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = '#6b7b8d';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        const modeName = activeModes[currentMode % activeModes.length] || '';
        ctx.fillText(modeName, canvas.width - 16, 16);
        ctx.restore();
    }

    // --- Animation Loop ---
    function animate() {
        const now = Date.now();
        const bg = activeConfig ? activeConfig.backgroundColor : '#faf8f5';
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const modeName = activeModes[currentMode % activeModes.length];
        if (modeName === 'music') {
            drawXylophoneBackground();
        }

        elements = elements.filter(el => {
            if (!updateElement(el, now)) return false;
            drawElement(el);
            return true;
        });

        drawModeIndicator();
        animationId = requestAnimationFrame(animate);
    }

    function drawXylophoneBackground() {
        const barWidth = canvas.width / XYLOPHONE.length;
        const barHeight = canvas.height * 0.6;
        const y = canvas.height * 0.2;

        ctx.save();
        ctx.globalAlpha = 0.1;
        XYLOPHONE.forEach((xylo, i) => {
            const x = barWidth * i + barWidth * 0.1;
            const w = barWidth * 0.8;
            const r = w * 0.15;
            ctx.fillStyle = xylo.color;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + barHeight - r);
            ctx.quadraticCurveTo(x + w, y + barHeight, x + w - r, y + barHeight);
            ctx.lineTo(x + r, y + barHeight);
            ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.fill();
        });
        ctx.restore();
    }

    // --- Canvas Setup ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // --- Event Handlers ---
    function handleKeyDown(e) {
        // Don't trigger app actions when admin panel is open
        if (ADMIN.isVisible) return;

        // Admin mode switch: Ctrl+Shift+1 through 9 (up to 13 modes)
        if (e.ctrlKey && e.shiftKey) {
            const num = parseInt(e.key);
            if (num >= 1 && num <= 9) {
                e.preventDefault();
                switchMode(num - 1);
                return;
            }
            if (e.key === 'N' || e.key === 'n') {
                e.preventDefault();
                nextMode();
                return;
            }
            if (e.key === 'P' || e.key === 'p') {
                e.preventDefault();
                switchMode((currentMode - 1 + activeModes.length) % activeModes.length);
                return;
            }
        }

        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        const cooldown = activeConfig ? activeConfig.cooldown : CONFIG.cooldown;
        if (now - lastKeyTime < cooldown) return;
        lastKeyTime = now;

        initAudio();
        createElement();
    }

    function handleStart() {
        if (started) return;
        started = true;
        const overlay = document.getElementById('start-overlay');
        overlay.style.display = 'none';

        initAudio();
        scheduleAutoRotate();

        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }

    function blockDangerousKeys(e) {
        // Don't block keys when admin panel is open (it handles its own keys)
        if (ADMIN.isVisible) return;
        if (e.ctrlKey && e.shiftKey) return;
        if (e.altKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if (e.key === 'Escape') { e.preventDefault(); return; }
        if (e.key.startsWith('F') && e.key.length > 1) e.preventDefault();
        if (e.key === 'Tab') e.preventDefault();
    }

    function handleInteraction() {
        if (!started) return;
        initAudio();
        const now = Date.now();
        const cooldown = activeConfig ? activeConfig.cooldown : CONFIG.cooldown;
        if (now - lastKeyTime < cooldown) return;
        lastKeyTime = now;
        createElement();
    }

    // --- Admin Config Callback ---
    function onConfigChange(cfg) {
        activeConfig = cfg;
        rebuildActiveModes();
        // Re-schedule or cancel auto-rotate based on config
        if (started) {
            if (cfg.autoRotateEnabled) {
                scheduleAutoRotate();
            } else {
                if (autoRotateTimer) { clearTimeout(autoRotateTimer); autoRotateTimer = null; }
            }
        }
    }

    function switchToModeByName(modeName) {
        const idx = activeModes.indexOf(modeName);
        if (idx >= 0) {
            switchMode(idx);
        }
    }

    function getCurrentModeName() {
        return activeModes[currentMode % activeModes.length] || '';
    }

    // --- Init ---
    function init() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        // Load image manifest for photo flashcards
        loadImageManifest();

        // Load audio manifest for pre-generated TTS
        loadAudioManifest();

        // Load admin config
        activeConfig = ADMIN.load();
        ADMIN.onConfigChange = onConfigChange;
        ADMIN.onSwitchMode = switchToModeByName;
        ADMIN.onNextMode = nextMode;
        ADMIN.onPrevMode = function () { switchMode((currentMode - 1 + activeModes.length) % activeModes.length); };
        ADMIN.getCurrentModeName = getCurrentModeName;
        ADMIN.initLongPress();
        rebuildActiveModes();

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        document.getElementById('start-overlay').addEventListener('click', handleStart);

        window.addEventListener('keydown', blockDangerousKeys, true);
        window.addEventListener('keydown', handleKeyDown);

        window.addEventListener('contextmenu', e => e.preventDefault());

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
