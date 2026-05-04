# 🍼 Baby Smash

A gentle, full-screen interactive app for infants (6–18 months). Every keypress produces soft visuals and audio — designed to captivate without overstimulating.

Built for projection onto a wall or large display while baby smashes a spare keyboard.

## Quick Start

### Option A: Double-click `start.bat` (Windows, recommended)
Opens Chrome in kiosk mode — no address bar, no tabs, harder to accidentally close.

### Option B: Open `index.html` directly
Open in any modern browser, then press **F11** for fullscreen.

### First launch
Click anywhere or press any key to begin. This is required to unlock browser audio.

---

## Modes

The app has **6 interactive visual modes** and **7 flashcard vocabulary modes** that auto-rotate.

### Interactive Modes

| # | Mode | Visuals | Audio |
|---|------|---------|-------|
| 1 | Shapes | Pastel geometric shapes float upward | Pentatonic bell tones |
| 2 | Bubbles | Translucent circles wobble & pop | Gentle pop/plop sounds |
| 3 | Nature | Leaves, clouds, raindrops drift | Soft raindrop ambience |
| 4 | Letters | Large A–Z / 0–9 characters appear | Spoken letter via TTS |
| 5 | Music | Piano/xylophone bars light up | Sequential scale notes |
| 6 | Animals | Gentle animal silhouettes | Soft warbling sounds |

### Flashcard Modes (Vocabulary)

Each keypress shows one vocabulary item with a canvas-drawn illustration and **trilingual TTS**:
- **English** → **Chinese (Mandarin)** → **rotating 3rd language** (Japanese / Hindi / Spanish)

| # | Category | Examples |
|---|----------|----------|
| 7 | Colors | Red, Blue, Green, Yellow… |
| 8 | Animals | Cat, Dog, Elephant, Fish… |
| 9 | Fruits | Apple, Banana, Orange… |
| 10 | Vehicles | Car, Bus, Train, Airplane… |
| 11 | Nature | Sun, Moon, Star, Flower… |
| 12 | Numbers | 1–10 with visual dots |
| 13 | Body Parts | Hand, Eye, Nose, Mouth… |

> **Input Lock**: While TTS is speaking, keypresses are ignored so the current card isn't interrupted.

---

## Auto-Rotate

Modes switch automatically every **3–7 minutes** (randomized). Only enabled modes participate in rotation. You can pause/resume auto-rotate from the admin panel.

---

## Admin Panel (Control Panel)

### Opening
**Long-press Ctrl for 2 seconds** to open/close the admin panel.

### Navigation (keyboard only, game-style)

| Key | Action |
|-----|--------|
| ↑ / ↓ | Navigate between menu items |
| ← / → | Adjust slider values / toggle mode enabled |
| Enter / Space | Activate button / switch to mode |
| Esc | Close panel |

### Settings Available

- **Timing**: Element duration, fade in/out, input cooldown
- **Visuals**: Max elements on screen, drift speed, element size
- **Audio**: Master volume
- **Mode Management**: Enable/disable individual modes, switch active mode
- **Auto-Rotate**: Pause / Resume, adjust interval
- **Languages**: Toggle which languages TTS speaks

All settings persist in `localStorage` — they survive browser restarts.

---

## Hotkeys (while panel is closed)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+1` through `9` | Switch to mode N directly |
| `Ctrl+Shift+N` | Next mode |
| `Ctrl+Shift+P` | Previous mode |

---

## Design Philosophy

### For the Baby
- **Soft pastels** — no harsh primary colors that overstimulate
- **Slow animations** (2–3s lifetime) — easy to track visually
- **Pentatonic / nature sounds** — never jarring or startling
- **Max 8 elements** on screen — avoids visual clutter
- **100ms input cooldown** — absorbs rapid smashing gracefully

### For the Parent
- **Kiosk mode** blocks Alt+F4, Ctrl+W, Tab, and other escape routes
- **Admin panel** only accessible via long-press Ctrl (baby can't trigger it)
- **Flashcard lock** ensures vocabulary cards finish speaking before advancing
- **No network required** — everything runs locally with Web Audio + SpeechSynthesis APIs

---

## Technical Notes

- **Zero dependencies** — pure HTML/CSS/JS, no build step
- **Web Audio API** — all sounds synthesized in real-time
- **SpeechSynthesis API** — TTS for letters and flashcard modes
- **Canvas 2D** — all visuals drawn programmatically (no image assets)
- **~1500 lines total** across 3 JS files

### Browser Compatibility
Tested on Chrome (recommended). Should work on Edge, Firefox, Safari with varying TTS voice availability.

### File Structure
```
baby-smash/
├── index.html      # Shell HTML (canvas + start overlay)
├── app.js          # Core engine (modes, audio, animation, input)
├── flashcards.js   # Vocabulary data + canvas drawings + TTS
├── admin.js        # Game-style keyboard config panel
├── start.bat       # Chrome kiosk launcher (Windows)
└── README.md       # This file
```

---

## License

MIT — do whatever you want with it. 🎉
