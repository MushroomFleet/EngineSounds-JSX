# 🏎️ EngineSounds-JSX

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio-API-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![React](https://img.shields.io/badge/React-Component-61DAFB.svg?logo=react)](https://reactjs.org/)

A fully synthesized arcade racing audio engine inspired by classic 80s games like **Outrun**. All sounds are generated in real-time using the Web Audio API — no samples required.

![Outrun Demo](https://img.shields.io/badge/demo-interactive-ff6b35?style=for-the-badge)

---

## ✨ Features

- **🎵 Pure Synthesis** — All sounds generated via oscillators and noise, zero audio files needed
- **🏁 Authentic Arcade Feel** — Captures the spirit of classic 80s racing game audio
- **⚡ Real-time Reactive** — Engine pitch, tire screech, and effects respond instantly to game state
- **🎮 Game-Ready** — Designed for easy integration into existing racing game codebases
- **📦 Lightweight** — Single component, no dependencies beyond React (or vanilla JS version)

### Sound Effects Included

| Effect | Description |
|--------|-------------|
| **Engine** | Multi-oscillator synthesis with RPM-responsive pitch and harmonics |
| **Tire Screech** | Oscillator-based squeal with LFO wobble, triggered by hard turns |
| **Brake Squeal** | High-frequency squeal when braking at speed |
| **Exhaust Crackle** | Pops and burbles on throttle lift |
| **Wind Noise** | Speed-dependent ambient rushing |
| **Gear Shift** | Mechanical click with brief engine cut |
| **Backfire** | Explosive pop effect |
| **Crash** | Metallic impact noise burst |

---

## 🚀 Quick Start

### Live Demo

Open **`demo.html`** in your browser for an interactive preview with full controls:

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/EngineSounds-JSX.git

# Open the demo
open demo.html
# or on Windows
start demo.html
```

The demo features a retro synthwave UI with:
- Throttle slider and hold-to-gas button
- Brake and turning controls
- 5-speed gear shifting
- Live RPM and speed meters
- Special effect triggers (backfire, crash)
- Full keyboard support (WASD/Arrows)

---

## 📦 Installation

### For React Projects

Copy `audio-engine.jsx` into your project:

```bash
cp audio-engine.jsx /your-project/src/components/
```

```jsx
import AudioEngine from './components/audio-engine';

function Game() {
  const [throttle, setThrottle] = useState(0);
  const [brake, setBrake] = useState(false);
  const [turning, setTurning] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState(1);

  // AudioEngine returns control methods
  const engine = AudioEngine({
    throttle,
    brake,
    turning,
    speed,
    gear,
    onReady: () => console.log('Audio ready!')
  });

  // Start on user interaction
  const handleStart = () => engine.start();

  return (
    <button onClick={handleStart}>Start Engine</button>
  );
}
```

### For Vanilla JavaScript

Extract the `OutrunAudioEngine` class from `demo.html` or use it directly:

```javascript
const engine = new OutrunAudioEngine();

// Initialize on user gesture (required by browsers)
button.onclick = async () => {
  await engine.init();
};

// Update each frame
function gameLoop() {
  engine.setThrottle(playerInput.gas);      // 0-1
  engine.setBrake(playerInput.brake);       // boolean
  engine.setTurning(playerInput.steering);  // -1 to 1
  engine.setGear(car.currentGear);          // 1-5
  
  requestAnimationFrame(gameLoop);
}
```

---

## 🎮 API Reference

### State Setters (call each frame)

| Method | Parameter | Description |
|--------|-----------|-------------|
| `setThrottle(value)` | `0.0 - 1.0` | Gas pedal position |
| `setBrake(active)` | `boolean` | Brake pedal engaged |
| `setTurning(value)` | `-1.0 to 1.0` | Steering input (negative=left, positive=right) |
| `setGear(gear)` | `1 - 5` | Current transmission gear |

### One-Shot Triggers

| Method | Description |
|--------|-------------|
| `triggerBackfire()` | Play exhaust backfire pop |
| `triggerGearShift()` | Play gear shift mechanical sound |
| `triggerCrash()` | Play collision impact sound |

### Lifecycle Methods

| Method | Description |
|--------|-------------|
| `init()` | Initialize audio context (must call on user gesture) |
| `start()` | Resume audio playback |
| `stop()` | Pause/suspend audio |

---

## 🔧 Integration Guide

For detailed instructions on integrating this audio engine into an existing game codebase, see:

**📄 [`soundengine-integration.md`](./soundengine-integration.md)**

The integration guide covers:
- Analyzing your target codebase
- Mapping vehicle state to audio parameters
- Removing/replacing existing audio
- Testing checklist
- Advanced features (multiple vehicles, doppler effect)

---

## 📁 Repository Contents

```
EngineSounds-JSX/
├── README.md                    # This file
├── audio-engine.jsx             # React component
├── demo.html                    # Interactive demo with retro UI
└── soundengine-integration.md   # Detailed integration guide
```

---

## 🎛️ Customization

### Adjusting Engine Character

In the audio engine class, modify oscillator types and frequencies:

```javascript
// More aggressive sound
engineOsc1.type = 'sawtooth';  // Try: 'square', 'triangle', 'sine'

// Higher idle RPM
const minRPM = 1200;  // Default: 800

// Different harmonic balance
engineGain1.gain.value = 0.4;  // Primary tone
engineGain2.gain.value = 0.2;  // Secondary harmonic
```

### Adjusting Tire Screech

```javascript
// Higher pitch screech
const tireBaseFreq = 1200 + (this.speed * 600);  // Default: 800 + (speed * 400)

// More aggressive wobble
this.nodes.tireLFO.frequency.value = 20 + (turnIntensity * 40);  // Default: 10 + (turn * 20)
```

---

## 🌐 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full (requires user gesture) |
| Edge | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full (requires user gesture) |

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- 🐛 Report bugs
- 💡 Suggest new sound effects
- 🔧 Submit pull requests
- ⭐ Star the repo if you find it useful

---

## 📄 License

MIT License — feel free to use in personal and commercial projects.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{enginesounds_jsx,
  title = {EngineSounds-JSX: Synthesized Arcade Racing Audio Engine},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/EngineSounds-JSX},
  version = {1.0.0}
}
```

### Donate

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)

---

<p align="center">
  <i>Built with 🎧 and nostalgia for the golden age of arcade racing</i>
</p>
