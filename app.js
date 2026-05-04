// Baby Smash - Gentle keyboard-driven visuals and sounds for infants
// Design principles: soft pastels, slow animations, pentatonic tones, no overstimulation

(function () {
    'use strict';

    // --- Configuration ---
    const CONFIG = {
        maxShapes: 8,           // max concurrent shapes to avoid visual overload
        shapeDuration: 3000,    // how long shapes live (ms)
        fadeInTime: 400,        // gentle fade in (ms)
        fadeOutTime: 1200,      // slow fade out (ms)
        minSize: 80,
        maxSize: 200,
        driftSpeed: 0.3,       // slow upward drift (px/frame)
        cooldown: 100,         // min ms between keypresses (debounce rapid smashing)
    };

    // Soft pastel palette - gentle on infant eyes
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

    // Pentatonic scale frequencies (C major pentatonic) - always harmonious
    const PENTATONIC = [
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
        659.25, // E5
    ];

    // Shape types
    const SHAPES = ['circle', 'rounded-square', 'star', 'heart', 'diamond'];

    // --- State ---
    let canvas, ctx;
    let shapes = [];
    let audioCtx = null;
    let lastKeyTime = 0;
    let animationId = null;

    // --- Audio ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(frequency) {
        if (!audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const now = audioCtx.currentTime;

        // Soft sine wave with gentle envelope
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now);

        // Add a subtle harmonic for warmth
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(frequency * 2, now);
        gain2.gain.setValueAtTime(0.1, now);

        // Gentle bell-like envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.03, now + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
        osc2.start(now);
        osc2.stop(now + 0.8);
    }

    // --- Shapes ---
    function createShape() {
        const now = Date.now();
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const type = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const size = CONFIG.minSize + Math.random() * (CONFIG.maxSize - CONFIG.minSize);
        const x = size + Math.random() * (canvas.width - size * 2);
        const y = size + Math.random() * (canvas.height - size * 2);
        const rotation = Math.random() * Math.PI * 2;
        const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];

        // Remove oldest shape if at max
        if (shapes.length >= CONFIG.maxShapes) {
            shapes.shift();
        }

        shapes.push({
            type,
            x,
            y,
            size,
            color,
            rotation,
            createdAt: now,
            opacity: 0,
        });

        playTone(note);
    }

    function getOpacity(shape, now) {
        const age = now - shape.createdAt;
        if (age < CONFIG.fadeInTime) {
            return age / CONFIG.fadeInTime;
        } else if (age > CONFIG.shapeDuration - CONFIG.fadeOutTime) {
            const remaining = CONFIG.shapeDuration - age;
            return Math.max(0, remaining / CONFIG.fadeOutTime);
        }
        return 1;
    }

    // --- Drawing ---
    function drawCircle(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawRoundedSquare(x, y, size) {
        const half = size / 2;
        const radius = size * 0.2;
        ctx.beginPath();
        ctx.moveTo(x - half + radius, y - half);
        ctx.lineTo(x + half - radius, y - half);
        ctx.quadraticCurveTo(x + half, y - half, x + half, y - half + radius);
        ctx.lineTo(x + half, y + half - radius);
        ctx.quadraticCurveTo(x + half, y + half, x + half - radius, y + half);
        ctx.lineTo(x - half + radius, y + half);
        ctx.quadraticCurveTo(x - half, y + half, x - half, y + half - radius);
        ctx.lineTo(x - half, y - half + radius);
        ctx.quadraticCurveTo(x - half, y - half, x - half + radius, y - half);
        ctx.closePath();
        ctx.fill();
    }

    function drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
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
        const half = size / 2;
        ctx.beginPath();
        ctx.moveTo(x, y - half);
        ctx.lineTo(x + half * 0.6, y);
        ctx.lineTo(x, y + half);
        ctx.lineTo(x - half * 0.6, y);
        ctx.closePath();
        ctx.fill();
    }

    function drawShape(shape) {
        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rotation);
        ctx.globalAlpha = shape.opacity;
        ctx.fillStyle = shape.color;

        switch (shape.type) {
            case 'circle':
                drawCircle(0, 0, shape.size);
                break;
            case 'rounded-square':
                drawRoundedSquare(0, 0, shape.size);
                break;
            case 'star':
                drawStar(0, 0, shape.size);
                break;
            case 'heart':
                drawHeart(0, 0, shape.size);
                break;
            case 'diamond':
                drawDiamond(0, 0, shape.size);
                break;
        }

        ctx.restore();
    }

    // --- Animation Loop ---
    function animate() {
        const now = Date.now();

        // Clear with warm off-white background
        ctx.fillStyle = '#faf8f5';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw shapes
        shapes = shapes.filter(shape => {
            const age = now - shape.createdAt;
            if (age > CONFIG.shapeDuration) return false;

            shape.opacity = getOpacity(shape, now);
            // Gentle upward drift
            shape.y -= CONFIG.driftSpeed;
            // Very slow rotation
            shape.rotation += 0.002;

            drawShape(shape);
            return true;
        });

        animationId = requestAnimationFrame(animate);
    }

    // --- Canvas Setup ---
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // --- Event Handlers ---
    function handleKeyDown(e) {
        // Allow Escape for parents to exit fullscreen
        if (e.key === 'Escape') return;

        e.preventDefault();
        e.stopPropagation();

        const now = Date.now();
        if (now - lastKeyTime < CONFIG.cooldown) return;
        lastKeyTime = now;

        initAudio();
        createShape();
    }

    function handleStart() {
        const overlay = document.getElementById('start-overlay');
        overlay.style.display = 'none';

        initAudio();

        // Enter fullscreen
        const el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }

    // Block all key combos that might navigate away or close the tab
    function blockDangerousKeys(e) {
        if (e.key === 'Escape') return; // allow parent exit
        // Block Alt+F4, Ctrl+W, Ctrl+Tab, etc.
        if (e.altKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        // Block F-keys, Tab
        if (e.key.startsWith('F') && e.key.length > 1) {
            e.preventDefault();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
        }
    }

    // --- Init ---
    function init() {
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Start overlay click
        document.getElementById('start-overlay').addEventListener('click', handleStart);

        // Keyboard events
        window.addEventListener('keydown', blockDangerousKeys, true);
        window.addEventListener('keydown', handleKeyDown);

        // Also respond to mouse clicks/touches (in case baby hits the trackpad)
        window.addEventListener('mousedown', (e) => {
            if (document.getElementById('start-overlay').style.display !== 'none') return;
            initAudio();
            const now = Date.now();
            if (now - lastKeyTime < CONFIG.cooldown) return;
            lastKeyTime = now;
            createShape();
        });

        window.addEventListener('touchstart', (e) => {
            if (document.getElementById('start-overlay').style.display !== 'none') return;
            e.preventDefault();
            initAudio();
            const now = Date.now();
            if (now - lastKeyTime < CONFIG.cooldown) return;
            lastKeyTime = now;
            createShape();
        });

        // Prevent context menu
        window.addEventListener('contextmenu', e => e.preventDefault());

        // Start animation loop
        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
