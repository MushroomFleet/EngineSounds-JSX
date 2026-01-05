# Outrun Audio Engine Integration Guide

A comprehensive plan for integrating the synthesized arcade racing audio engine into an existing game codebase.

---

## Phase 1: Codebase Analysis

Before integration, thoroughly analyze the target codebase to understand its architecture and existing audio implementation.

### 1.1 Identify Core Game Systems

Locate and document the following in the target codebase:

| System | What to Find | Notes |
|--------|--------------|-------|
| **Game Loop** | Main update/render cycle | Where physics and input are processed per frame |
| **Vehicle Controller** | Player car logic | Throttle, brake, steering input handling |
| **Physics System** | Speed, velocity, collision | Source of truth for vehicle state |
| **Input Handler** | Keyboard/gamepad bindings | How player controls are captured |
| **Audio Manager** | Existing sound system | What we're replacing or wrapping |

### 1.2 Map Existing Audio Implementation

Document the current audio approach:

```
□ What audio library is used? (Web Audio API, Howler.js, Tone.js, custom)
□ Are sounds sample-based (.mp3/.wav) or synthesized?
□ Is there a central audio manager or distributed audio calls?
□ How is audio volume/muting handled globally?
□ Are there existing sound effect triggers? List them:
  - Engine sound
  - Tire/skid sound
  - Brake sound
  - Collision/crash sound
  - Gear shift sound
  - Wind/ambient sound
  - Other: ___________
```

### 1.3 Identify Vehicle State Variables

The audio engine requires these real-time values. Find their equivalents in the codebase:

| Audio Engine Input | Type | Your Codebase Equivalent |
|--------------------|------|--------------------------|
| `throttle` | 0.0 - 1.0 | ___________________ |
| `brake` | boolean | ___________________ |
| `turning` | -1.0 to 1.0 | ___________________ |
| `speed` | 0.0 - 1.0 (normalized) | ___________________ |
| `gear` | 1 - 5 | ___________________ |

---

## Phase 2: Integration Architecture

### 2.1 Choose Integration Pattern

**Option A: Direct Integration (Recommended for simple games)**
- Instantiate audio engine in main game file
- Pass vehicle state directly each frame

**Option B: Wrapper/Adapter (Recommended for complex games)**
- Create an adapter class that translates game state to audio engine format
- Useful when game uses different units or coordinate systems

**Option C: Event-Driven (Recommended for ECS architectures)**
- Audio engine subscribes to game events
- Game emits events on state changes

### 2.2 Integration Point

The audio engine should be updated in the game loop, after physics but before render:

```
┌─────────────────────────────────────────┐
│              GAME LOOP                  │
├─────────────────────────────────────────┤
│  1. Process Input                       │
│  2. Update Physics                      │
│  3. Update Game Logic                   │
│  4. ► UPDATE AUDIO ENGINE ◄             │
│  5. Render Frame                        │
└─────────────────────────────────────────┘
```

---

## Phase 3: Implementation Steps

### 3.1 Install/Import the Audio Engine

**For vanilla JavaScript (HTML games):**
```javascript
// Copy the OutrunAudioEngine class from demo.html into your project
// Or extract to separate file: outrun-audio-engine.js

import { OutrunAudioEngine } from './outrun-audio-engine.js';
// or
const engine = new OutrunAudioEngine();
```

**For React projects:**
```javascript
import AudioEngine from './audio-engine.jsx';

// In your game component:
const [audioState, setAudioState] = useState({
  throttle: 0,
  brake: false,
  turning: 0,
  speed: 0,
  gear: 1
});
```

### 3.2 Initialize on User Interaction

Web Audio API requires user gesture to start. Initialize on first input:

```javascript
let audioInitialized = false;

function onFirstUserInput() {
  if (!audioInitialized) {
    await audioEngine.init();
    audioInitialized = true;
  }
}

// Attach to your existing input handlers
document.addEventListener('keydown', onFirstUserInput, { once: true });
document.addEventListener('click', onFirstUserInput, { once: true });
document.addEventListener('touchstart', onFirstUserInput, { once: true });
```

### 3.3 Create State Mapping Function

Normalize your game's vehicle state to audio engine format:

```javascript
function mapVehicleStateToAudio(vehicle) {
  return {
    // Normalize speed: convert your units to 0-1 range
    // Example: if max speed is 200 km/h
    speed: Math.min(1, vehicle.currentSpeed / vehicle.maxSpeed),
    
    // Throttle: usually already 0-1 from input
    throttle: vehicle.throttleInput,
    
    // Brake: convert to boolean if needed
    brake: vehicle.brakeInput > 0.5,
    
    // Turning: normalize steering angle to -1 to 1
    // Example: if max steering is 45 degrees
    turning: vehicle.steeringAngle / 45,
    
    // Gear: clamp to 1-5 range
    gear: Math.max(1, Math.min(5, vehicle.currentGear))
  };
}
```

### 3.4 Update Audio in Game Loop

```javascript
function gameLoop() {
  // ... existing physics/input code ...
  
  // Update audio engine with current vehicle state
  const audioState = mapVehicleStateToAudio(playerVehicle);
  
  audioEngine.setThrottle(audioState.throttle);
  audioEngine.setBrake(audioState.brake);
  audioEngine.setTurning(audioState.turning);
  audioEngine.setGear(audioState.gear);
  // Note: speed is handled internally based on throttle/brake
  
  // ... existing render code ...
  
  requestAnimationFrame(gameLoop);
}
```

### 3.5 Wire Up One-Shot Effects

Connect game events to audio triggers:

```javascript
// Gear changes
vehicle.onGearChange = (oldGear, newGear) => {
  audioEngine.triggerGearShift();
};

// Collisions
collision.onImpact = (force) => {
  if (force > CRASH_THRESHOLD) {
    audioEngine.triggerCrash();
  }
};

// Backfire (on sudden throttle lift at high RPM)
vehicle.onThrottleLift = (rpm, throttleDelta) => {
  if (rpm > 6000 && throttleDelta < -0.5) {
    audioEngine.triggerBackfire();
  }
};
```

---

## Phase 4: Remove Existing Audio

### 4.1 Locate All Existing Sound Calls

Search the codebase for these patterns:

```
□ .play()
□ new Audio(
□ AudioContext
□ createOscillator
□ Howl(
□ sound.
□ sfx.
□ audio.
□ .mp3
□ .wav
□ .ogg
```

### 4.2 Disable or Remove

For each existing sound effect:

| Sound | File/Location | Action |
|-------|---------------|--------|
| Engine loop | ___________ | Remove - replaced by audio engine |
| Tire screech | ___________ | Remove - replaced by audio engine |
| Brake sound | ___________ | Remove - replaced by audio engine |
| Crash sound | ___________ | Remove - replaced by audio engine |
| Gear shift | ___________ | Remove - replaced by audio engine |
| Wind/ambient | ___________ | Remove - replaced by audio engine |
| Music | ___________ | KEEP - not replaced |
| UI sounds | ___________ | KEEP - not replaced |
| Other vehicles | ___________ | KEEP or duplicate engine for AI cars |

### 4.3 Remove Audio Asset Files (Optional)

Once confirmed working, remove unused audio files:
- Engine samples
- Tire screech samples
- Impact/crash samples
- Any other replaced effects

---

## Phase 5: Testing Checklist

### 5.1 Core Functionality

```
□ Audio initializes on first user input
□ Engine sound plays at idle (throttle = 0)
□ Engine pitch increases with throttle
□ Engine pitch responds to gear changes
□ Tire screech plays when turning
□ Tire screech intensity scales with turn + speed
□ Brake sound plays when braking at speed
□ Wind noise increases with speed
□ Exhaust crackle on throttle lift
```

### 5.2 One-Shot Effects

```
□ Gear shift click/cut sound triggers
□ Backfire triggers correctly
□ Crash sound triggers on collision
```

### 5.3 Edge Cases

```
□ No audio glitches on rapid input changes
□ Audio stops cleanly on game pause
□ Audio resumes correctly after pause
□ No memory leaks on long play sessions
□ Works on mobile browsers (touch input)
□ Handles tab visibility change (background tab)
```

### 5.4 Performance

```
□ No frame drops when audio is active
□ CPU usage acceptable (check with DevTools)
□ No audio crackling or distortion
```

---

## Phase 6: Optional Enhancements

### 6.1 Add Pause/Resume Support

```javascript
function pauseGame() {
  audioEngine.stop();
  // ... other pause logic
}

function resumeGame() {
  audioEngine.start();
  // ... other resume logic
}
```

### 6.2 Add Volume Control

```javascript
// Add to audio engine class or wrap externally
function setMasterVolume(volume) {
  audioEngine.nodes.masterGain.gain.value = volume * 0.7;
}
```

### 6.3 Multiple Vehicles (AI Cars)

For AI/opponent vehicle sounds, create additional engine instances:

```javascript
const aiEngines = opponents.map(() => new OutrunAudioEngine());

// In game loop, update each AI engine with that vehicle's state
opponents.forEach((opponent, i) => {
  const state = mapVehicleStateToAudio(opponent);
  aiEngines[i].setThrottle(state.throttle);
  // ... etc
  
  // Optional: reduce volume based on distance to player
  const distance = getDistance(player, opponent);
  const volume = Math.max(0, 1 - distance / MAX_AUDIBLE_DISTANCE);
  aiEngines[i].nodes.masterGain.gain.value = volume * 0.4;
});
```

### 6.4 Doppler Effect (Advanced)

For passing vehicles, modulate pitch based on relative velocity:

```javascript
function applyDopplerEffect(aiEngine, relativeVelocity) {
  const dopplerShift = 1 + (relativeVelocity / SPEED_OF_SOUND);
  // Apply to all engine oscillators
  aiEngine.nodes.engineOsc1.detune.value = (dopplerShift - 1) * 1200;
}
```

---

## Quick Reference: Audio Engine API

### Properties (set these each frame)
| Method | Parameter | Description |
|--------|-----------|-------------|
| `setThrottle(v)` | 0.0 - 1.0 | Gas pedal position |
| `setBrake(v)` | boolean | Brake engaged |
| `setTurning(v)` | -1.0 to 1.0 | Steering (-1=left, 1=right) |
| `setGear(v)` | 1 - 5 | Current gear |

### One-Shot Triggers
| Method | Description |
|--------|-------------|
| `triggerBackfire()` | Exhaust pop sound |
| `triggerGearShift()` | Mechanical shift click |
| `triggerCrash()` | Collision impact sound |

### Lifecycle
| Method | Description |
|--------|-------------|
| `init()` | Initialize audio context (call on user gesture) |
| `start()` | Resume audio after pause |
| `stop()` | Pause all audio |

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No sound at all | Audio context not started | Ensure `init()` called on user gesture |
| Sound cuts out | Tab went to background | Add visibility change handler to suspend/resume |
| Crackling/distortion | Too many oscillators or CPU overload | Reduce polyphony or check for other heavy processing |
| Tire screech too quiet | Speed value not normalized | Ensure speed is 0-1 range |
| Engine doesn't rev | Throttle value wrong | Verify throttle is 0-1, not 0-100 |
| Gear has no effect | Gear value out of range | Clamp gear to 1-5 |
