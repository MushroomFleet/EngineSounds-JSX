import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * AudioEngine - Arcade Racing Sound Effects Synthesizer
 * 
 * Emulates classic arcade racing game sounds (Outrun-style) using Web Audio API.
 * All sounds are synthesized in real-time - no samples required.
 * 
 * Props:
 *   throttle (0-1): Engine throttle position
 *   brake (boolean): Brake engaged
 *   turning (number): Turn intensity (-1 to 1, 0 = straight)
 *   speed (0-1): Current vehicle speed for wind/tire noise
 *   gear (1-5): Current gear for engine pitch
 *   onReady (function): Called when audio context is ready
 */

const AudioEngine = ({ 
  throttle = 0, 
  brake = false, 
  turning = 0, 
  speed = 0,
  gear = 1,
  onReady = () => {}
}) => {
  const audioContextRef = useRef(null);
  const nodesRef = useRef({});
  const isInitializedRef = useRef(false);
  const animationFrameRef = useRef(null);
  
  // Engine state refs for smooth interpolation
  const currentRPMRef = useRef(800);
  const targetRPMRef = useRef(800);
  
  // Initialize audio context and nodes
  const initAudio = useCallback(() => {
    if (isInitializedRef.current) return;
    
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;
    
    // Master output with compression
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);
    
    // ========== ENGINE SYNTHESIS ==========
    // Multiple oscillators create the characteristic arcade engine sound
    
    // Primary engine tone (low rumble)
    const engineOsc1 = ctx.createOscillator();
    engineOsc1.type = 'sawtooth';
    engineOsc1.frequency.value = 55;
    
    // Secondary harmonic (gives it that "whine")
    const engineOsc2 = ctx.createOscillator();
    engineOsc2.type = 'square';
    engineOsc2.frequency.value = 110;
    
    // High frequency component (arcade character)
    const engineOsc3 = ctx.createOscillator();
    engineOsc3.type = 'triangle';
    engineOsc3.frequency.value = 220;
    
    // Engine gains
    const engineGain1 = ctx.createGain();
    const engineGain2 = ctx.createGain();
    const engineGain3 = ctx.createGain();
    engineGain1.gain.value = 0.3;
    engineGain2.gain.value = 0.15;
    engineGain3.gain.value = 0.08;
    
    // Engine filter (simulates muffled engine at low RPM)
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 800;
    engineFilter.Q.value = 2;
    
    // Engine master gain
    const engineMaster = ctx.createGain();
    engineMaster.gain.value = 0.5;
    
    // Connect engine chain
    engineOsc1.connect(engineGain1);
    engineOsc2.connect(engineGain2);
    engineOsc3.connect(engineGain3);
    engineGain1.connect(engineFilter);
    engineGain2.connect(engineFilter);
    engineGain3.connect(engineFilter);
    engineFilter.connect(engineMaster);
    engineMaster.connect(masterGain);
    
    // Start oscillators
    engineOsc1.start();
    engineOsc2.start();
    engineOsc3.start();
    
    // ========== EXHAUST CRACKLE (noise-based) ==========
    const exhaustBufferSize = ctx.sampleRate * 2;
    const exhaustBuffer = ctx.createBuffer(1, exhaustBufferSize, ctx.sampleRate);
    const exhaustData = exhaustBuffer.getChannelData(0);
    for (let i = 0; i < exhaustBufferSize; i++) {
      exhaustData[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 3);
    }
    
    const exhaustNoise = ctx.createBufferSource();
    exhaustNoise.buffer = exhaustBuffer;
    exhaustNoise.loop = true;
    
    const exhaustFilter = ctx.createBiquadFilter();
    exhaustFilter.type = 'bandpass';
    exhaustFilter.frequency.value = 200;
    exhaustFilter.Q.value = 1;
    
    const exhaustGain = ctx.createGain();
    exhaustGain.gain.value = 0;
    
    exhaustNoise.connect(exhaustFilter);
    exhaustFilter.connect(exhaustGain);
    exhaustGain.connect(masterGain);
    exhaustNoise.start();
    
    // ========== TIRE SCREECH (oscillator-based) ==========
    // Primary screech tone
    const tireOsc1 = ctx.createOscillator();
    tireOsc1.type = 'sawtooth';
    tireOsc1.frequency.value = 900;
    
    // Secondary harmonic for richness
    const tireOsc2 = ctx.createOscillator();
    tireOsc2.type = 'square';
    tireOsc2.frequency.value = 1350;
    
    // High frequency squeal
    const tireOsc3 = ctx.createOscillator();
    tireOsc3.type = 'sine';
    tireOsc3.frequency.value = 1800;
    
    // LFO for frequency wobble
    const tireLFO = ctx.createOscillator();
    tireLFO.type = 'sine';
    tireLFO.frequency.value = 15;
    
    const tireLFOGain = ctx.createGain();
    tireLFOGain.gain.value = 50;
    
    tireLFO.connect(tireLFOGain);
    tireLFOGain.connect(tireOsc1.frequency);
    tireLFOGain.connect(tireOsc2.frequency);
    
    // Individual gains for mixing
    const tireOscGain1 = ctx.createGain();
    const tireOscGain2 = ctx.createGain();
    const tireOscGain3 = ctx.createGain();
    tireOscGain1.gain.value = 0.4;
    tireOscGain2.gain.value = 0.25;
    tireOscGain3.gain.value = 0.35;
    
    // Add some noise texture
    const tireNoiseBufferSize = ctx.sampleRate * 2;
    const tireNoiseBuffer = ctx.createBuffer(1, tireNoiseBufferSize, ctx.sampleRate);
    const tireNoiseData = tireNoiseBuffer.getChannelData(0);
    for (let i = 0; i < tireNoiseBufferSize; i++) {
      tireNoiseData[i] = Math.random() * 2 - 1;
    }
    
    const tireNoise = ctx.createBufferSource();
    tireNoise.buffer = tireNoiseBuffer;
    tireNoise.loop = true;
    
    const tireNoiseFilter = ctx.createBiquadFilter();
    tireNoiseFilter.type = 'bandpass';
    tireNoiseFilter.frequency.value = 3000;
    tireNoiseFilter.Q.value = 2;
    
    const tireNoiseGain = ctx.createGain();
    tireNoiseGain.gain.value = 0.15;
    
    // Master tire filter and gain
    const tireFilter = ctx.createBiquadFilter();
    tireFilter.type = 'bandpass';
    tireFilter.frequency.value = 1200;
    tireFilter.Q.value = 3;
    
    const tireGain = ctx.createGain();
    tireGain.gain.value = 0;
    
    // Connect oscillators
    tireOsc1.connect(tireOscGain1);
    tireOsc2.connect(tireOscGain2);
    tireOsc3.connect(tireOscGain3);
    tireOscGain1.connect(tireFilter);
    tireOscGain2.connect(tireFilter);
    tireOscGain3.connect(tireFilter);
    
    // Connect noise
    tireNoise.connect(tireNoiseFilter);
    tireNoiseFilter.connect(tireNoiseGain);
    tireNoiseGain.connect(tireFilter);
    
    tireFilter.connect(tireGain);
    tireGain.connect(masterGain);
    
    tireOsc1.start();
    tireOsc2.start();
    tireOsc3.start();
    tireLFO.start();
    tireNoise.start();
    
    // ========== BRAKE SQUEAL ==========
    const brakeOsc = ctx.createOscillator();
    brakeOsc.type = 'sine';
    brakeOsc.frequency.value = 3500;
    
    const brakeOsc2 = ctx.createOscillator();
    brakeOsc2.type = 'sine';
    brakeOsc2.frequency.value = 4200;
    
    const brakeGain = ctx.createGain();
    brakeGain.gain.value = 0;
    
    const brakeFilter = ctx.createBiquadFilter();
    brakeFilter.type = 'bandpass';
    brakeFilter.frequency.value = 3800;
    brakeFilter.Q.value = 10;
    
    brakeOsc.connect(brakeFilter);
    brakeOsc2.connect(brakeFilter);
    brakeFilter.connect(brakeGain);
    brakeGain.connect(masterGain);
    brakeOsc.start();
    brakeOsc2.start();
    
    // ========== WIND NOISE ==========
    const windBufferSize = ctx.sampleRate * 2;
    const windBuffer = ctx.createBuffer(1, windBufferSize, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);
    for (let i = 0; i < windBufferSize; i++) {
      windData[i] = Math.random() * 2 - 1;
    }
    
    const windNoise = ctx.createBufferSource();
    windNoise.buffer = windBuffer;
    windNoise.loop = true;
    
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;
    
    const windGain = ctx.createGain();
    windGain.gain.value = 0;
    
    windNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    windNoise.start();
    
    // Store references
    nodesRef.current = {
      ctx,
      masterGain,
      // Engine
      engineOsc1,
      engineOsc2,
      engineOsc3,
      engineGain1,
      engineGain2,
      engineGain3,
      engineFilter,
      engineMaster,
      // Exhaust
      exhaustFilter,
      exhaustGain,
      // Tires
      tireOsc1,
      tireOsc2,
      tireOsc3,
      tireLFO,
      tireLFOGain,
      tireFilter,
      tireGain,
      // Brakes
      brakeOsc,
      brakeOsc2,
      brakeGain,
      brakeFilter,
      // Wind
      windFilter,
      windGain
    };
    
    isInitializedRef.current = true;
    onReady();
  }, [onReady]);
  
  // Update audio parameters based on props
  useEffect(() => {
    if (!isInitializedRef.current || !nodesRef.current.ctx) return;
    
    const nodes = nodesRef.current;
    const ctx = nodes.ctx;
    const now = ctx.currentTime;
    
    // Calculate target RPM based on throttle and gear
    const minRPM = 800;
    const maxRPM = 8000;
    const gearMultipliers = [1, 0.85, 0.7, 0.6, 0.5];
    const gearMult = gearMultipliers[Math.min(gear - 1, 4)];
    
    targetRPMRef.current = minRPM + (throttle * (maxRPM - minRPM) * gearMult);
    
    // Smooth RPM interpolation
    const updateAudio = () => {
      const rpmDiff = targetRPMRef.current - currentRPMRef.current;
      const rpmSpeed = throttle > 0.1 ? 0.08 : 0.04; // Rev up faster than down
      currentRPMRef.current += rpmDiff * rpmSpeed;
      
      const rpm = currentRPMRef.current;
      const rpmNormalized = (rpm - minRPM) / (maxRPM - minRPM);
      
      // Update engine frequencies based on RPM
      const baseFreq = 30 + (rpm / 100);
      nodes.engineOsc1.frequency.value = baseFreq;
      nodes.engineOsc2.frequency.value = baseFreq * 2;
      nodes.engineOsc3.frequency.value = baseFreq * 4;
      
      // Engine filter opens up at higher RPM
      nodes.engineFilter.frequency.value = 400 + (rpmNormalized * 3000);
      
      // Engine volume increases with throttle
      const engineVol = 0.3 + (throttle * 0.5);
      nodes.engineMaster.gain.value = engineVol;
      
      // Harmonic balance shifts with RPM
      nodes.engineGain1.gain.value = 0.3 - (rpmNormalized * 0.1);
      nodes.engineGain2.gain.value = 0.15 + (rpmNormalized * 0.1);
      nodes.engineGain3.gain.value = 0.08 + (rpmNormalized * 0.12);
      
      // Exhaust crackle on deceleration
      const decel = targetRPMRef.current < currentRPMRef.current - 500;
      const exhaustVol = decel ? 0.15 * (1 - throttle) : 0;
      nodes.exhaustGain.gain.value = exhaustVol;
      nodes.exhaustFilter.frequency.value = 150 + (rpm / 20);
      
      // Wind noise based on speed
      nodes.windGain.gain.value = speed * 0.15;
      nodes.windFilter.frequency.value = 200 + (speed * 800);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(updateAudio);
    };
    
    updateAudio();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [throttle, gear, speed]);
  
  // Handle turning/skid
  useEffect(() => {
    if (!isInitializedRef.current || !nodesRef.current.ctx) return;
    
    const nodes = nodesRef.current;
    const turnIntensity = Math.abs(turning);
    
    // Tire screech - audible even at lower speeds when turning hard
    const speedFactor = Math.max(0.3, speed);
    const skidVolume = turnIntensity * speedFactor * 0.45;
    nodes.tireGain.gain.setTargetAtTime(skidVolume, nodes.ctx.currentTime, 0.05);
    
    // Pitch increases with speed and turn intensity
    const tireBaseFreq = 800 + (speed * 400);
    nodes.tireOsc1.frequency.value = tireBaseFreq + (turnIntensity * 200);
    nodes.tireOsc2.frequency.value = tireBaseFreq * 1.5 + (turnIntensity * 150);
    nodes.tireOsc3.frequency.value = tireBaseFreq * 2 + (turnIntensity * 100);
    
    // LFO wobble gets faster with harder turns
    nodes.tireLFO.frequency.value = 10 + (turnIntensity * 20);
    nodes.tireLFOGain.gain.value = 30 + (turnIntensity * 60);
    
    // Filter opens up with intensity
    nodes.tireFilter.frequency.value = 1000 + (turnIntensity * 1500) + (speed * 500);
    nodes.tireFilter.Q.value = 2 + (turnIntensity * 4);
  }, [turning, speed]);
  
  // Handle braking
  useEffect(() => {
    if (!isInitializedRef.current || !nodesRef.current.ctx) return;
    
    const nodes = nodesRef.current;
    const now = nodes.ctx.currentTime;
    
    if (brake && speed > 0.2) {
      // Brake squeal at higher speeds
      const brakeVol = 0.08 * speed;
      nodes.brakeGain.gain.setTargetAtTime(brakeVol, now, 0.02);
      
      // Slight frequency wobble for realism
      nodes.brakeOsc.frequency.value = 3500 + (Math.random() * 200);
      nodes.brakeOsc2.frequency.value = 4200 + (Math.random() * 200);
    } else {
      nodes.brakeGain.gain.setTargetAtTime(0, now, 0.1);
    }
  }, [brake, speed]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Public methods via ref or direct call
  const start = useCallback(() => {
    initAudio();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [initAudio]);
  
  const stop = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.suspend();
    }
  }, []);
  
  // Trigger effects (for one-shot sounds)
  const triggerBackfire = useCallback(() => {
    if (!isInitializedRef.current) return;
    
    const ctx = nodesRef.current.ctx;
    const now = ctx.currentTime;
    
    // Create a short burst of noise for backfire
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.1));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(nodesRef.current.masterGain);
    source.start(now);
  }, []);
  
  const triggerGearShift = useCallback(() => {
    if (!isInitializedRef.current) return;
    
    const ctx = nodesRef.current.ctx;
    const now = ctx.currentTime;
    
    // Brief engine cut on shift
    nodesRef.current.engineMaster.gain.setValueAtTime(0.2, now);
    nodesRef.current.engineMaster.gain.setTargetAtTime(0.5, now + 0.05, 0.03);
    
    // Mechanical click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.value = 150;
    
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    clickOsc.connect(clickGain);
    clickGain.connect(nodesRef.current.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }, []);
  
  const triggerCrash = useCallback(() => {
    if (!isInitializedRef.current) return;
    
    const ctx = nodesRef.current.ctx;
    const now = ctx.currentTime;
    
    // Metallic crash noise
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.2));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 2;
    
    const gain = ctx.createGain();
    gain.gain.value = 0.7;
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(nodesRef.current.masterGain);
    source.start(now);
  }, []);
  
  // Expose methods
  return {
    start,
    stop,
    triggerBackfire,
    triggerGearShift,
    triggerCrash,
    isReady: isInitializedRef.current
  };
};

// Hook version for easier use
export const useAudioEngine = (props = {}) => {
  const [isReady, setIsReady] = useState(false);
  const engineRef = useRef(null);
  
  useEffect(() => {
    // This hook manages the audio engine lifecycle
  }, []);
  
  return {
    ...engineRef.current,
    isReady
  };
};

export default AudioEngine;
