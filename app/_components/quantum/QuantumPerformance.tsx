"use client";

import { useEffect, useRef } from 'react';

// WebWorker for quantum calculations
const quantumCalculationWorker = `
  // Quantum calculation worker
  self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
      case 'CALCULATE_SUPERPOSITION':
        calculateSuperposition(data);
        break;
      case 'CALCULATE_ENTANGLEMENT':
        calculateEntanglement(data);
        break;
      case 'CALCULATE_WAVE_FUNCTION':
        calculateWaveFunction(data);
        break;
      case 'CALCULATE_TUNNELING_PROBABILITY':
        calculateTunnelingProbability(data);
        break;
    }
  };

  function calculateSuperposition(data) {
    const { particles, time, superpositionLevel } = data;
    const results = [];
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      const phase = particle.phase + time;
      
      // Quantum superposition calculation
      const amplitude1 = Math.cos(phase) * Math.sqrt(superpositionLevel);
      const amplitude2 = Math.sin(phase) * Math.sqrt(1 - superpositionLevel);
      
      results.push({
        id: particle.id,
        amplitude1,
        amplitude2,
        probability: amplitude1 * amplitude1 + amplitude2 * amplitude2,
        phase: phase,
        position: {
          x: particle.position.x + Math.sin(phase) * superpositionLevel * 0.5,
          y: particle.position.y + Math.cos(phase) * superpositionLevel * 0.3,
          z: particle.position.z + Math.sin(phase * 2) * superpositionLevel * 0.2
        }
      });
    }
    
    self.postMessage({
      type: 'SUPERPOSITION_RESULT',
      data: results
    });
  }

  function calculateEntanglement(data) {
    const { pairs, measurement } = data;
    const results = [];
    
    pairs.forEach(pair => {
      const correlation = measurement ? -1 : 1; // Bell state correlation
      
      results.push({
        pairId: pair.id,
        particle1State: measurement,
        particle2State: measurement * correlation,
        correlationStrength: Math.abs(correlation),
        bellViolation: Math.sqrt(2) // Maximum Bell inequality violation
      });
    });
    
    self.postMessage({
      type: 'ENTANGLEMENT_RESULT',
      data: results
    });
  }

  function calculateWaveFunction(data) {
    const { x, momentum, time, hbar = 1 } = data;
    const results = [];
    
    for (let i = 0; i < x.length; i++) {
      const position = x[i];
      
      // Gaussian wave packet
      const sigma = 1.0; // Width parameter
      const k = momentum / hbar; // Wave number
      
      const gaussianEnvelope = Math.exp(-Math.pow(position, 2) / (2 * sigma * sigma));
      const planeWave = Math.cos(k * position - time);
      
      const waveFunction = gaussianEnvelope * planeWave;
      const probability = waveFunction * waveFunction;
      
      results.push({
        position,
        waveFunction,
        probability,
        phase: k * position - time
      });
    }
    
    self.postMessage({
      type: 'WAVE_FUNCTION_RESULT',
      data: results
    });
  }

  function calculateTunnelingProbability(data) {
    const { barrierHeight, particleEnergy, barrierWidth, mass = 1, hbar = 1 } = data;
    
    if (particleEnergy >= barrierHeight) {
      // Classical transmission
      self.postMessage({
        type: 'TUNNELING_RESULT',
        data: { probability: 1.0, quantum: false }
      });
      return;
    }
    
    // Quantum tunneling calculation
    const k = Math.sqrt(2 * mass * (barrierHeight - particleEnergy)) / hbar;
    const transmissionCoeff = Math.exp(-2 * k * barrierWidth);
    
    self.postMessage({
      type: 'TUNNELING_RESULT',
      data: { 
        probability: transmissionCoeff,
        quantum: true,
        waveNumber: k,
        attenuationLength: 1 / k
      }
    });
  }
`;

// Performance monitoring and optimization
export class QuantumPerformanceManager {
  private workers: Worker[] = [];
  private frameRate: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private performanceMetrics: any = {};
  private adaptiveQuality: number = 1.0;

  constructor(workerCount: number = 4) {
    this.initializeWorkers(workerCount);
    this.startPerformanceMonitoring();
  }

  private initializeWorkers(count: number) {
    if (typeof window === 'undefined') return;

    for (let i = 0; i < count; i++) {
      try {
        const blob = new Blob([quantumCalculationWorker], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        
        worker.onmessage = (e) => this.handleWorkerMessage(e);
        worker.onerror = (error) => console.error('Quantum worker error:', error);
        
        this.workers.push(worker);
      } catch (error) {
        console.warn('WebWorkers not supported, falling back to main thread calculations');
      }
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, data } = e.data;
    
    // Emit custom events for component consumption
    window.dispatchEvent(new CustomEvent(`quantum:${type.toLowerCase()}`, {
      detail: data
    }));
  }

  public calculateSuperposition(particles: any[], time: number, superpositionLevel: number) {
    if (this.workers.length > 0) {
      const workerIndex = Math.floor(Math.random() * this.workers.length);
      this.workers[workerIndex].postMessage({
        type: 'CALCULATE_SUPERPOSITION',
        data: { particles, time, superpositionLevel }
      });
    } else {
      // Fallback to main thread
      this.calculateSuperpositionMainThread(particles, time, superpositionLevel);
    }
  }

  public calculateEntanglement(pairs: any[], measurement: number) {
    if (this.workers.length > 0) {
      const workerIndex = Math.floor(Math.random() * this.workers.length);
      this.workers[workerIndex].postMessage({
        type: 'CALCULATE_ENTANGLEMENT',
        data: { pairs, measurement }
      });
    }
  }

  public calculateTunnelingProbability(params: any) {
    if (this.workers.length > 0) {
      const workerIndex = Math.floor(Math.random() * this.workers.length);
      this.workers[workerIndex].postMessage({
        type: 'CALCULATE_TUNNELING_PROBABILITY',
        data: params
      });
    }
  }

  private calculateSuperpositionMainThread(particles: any[], time: number, superpositionLevel: number) {
    // Simplified main thread calculation for fallback
    const results = particles.map(particle => ({
      id: particle.id,
      amplitude1: Math.cos(time + particle.phase) * Math.sqrt(superpositionLevel),
      amplitude2: Math.sin(time + particle.phase) * Math.sqrt(1 - superpositionLevel),
      position: {
        x: particle.position.x + Math.sin(time + particle.phase) * superpositionLevel * 0.5,
        y: particle.position.y + Math.cos(time + particle.phase) * superpositionLevel * 0.3,
        z: particle.position.z + Math.sin((time + particle.phase) * 2) * superpositionLevel * 0.2
      }
    }));

    window.dispatchEvent(new CustomEvent('quantum:superposition_result', {
      detail: results
    }));
  }

  private startPerformanceMonitoring() {
    const monitor = () => {
      const currentTime = performance.now();
      
      if (this.lastFrameTime) {
        const deltaTime = currentTime - this.lastFrameTime;
        this.frameRate = 1000 / deltaTime;
        this.frameCount++;
        
        // Calculate adaptive quality based on performance
        if (this.frameRate < 30) {
          this.adaptiveQuality = Math.max(0.3, this.adaptiveQuality - 0.05);
        } else if (this.frameRate > 55) {
          this.adaptiveQuality = Math.min(1.0, this.adaptiveQuality + 0.02);
        }
        
        // Update metrics every 60 frames
        if (this.frameCount % 60 === 0) {
          this.updatePerformanceMetrics();
        }
      }
      
      this.lastFrameTime = currentTime;
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  private updatePerformanceMetrics() {
    this.performanceMetrics = {
      frameRate: this.frameRate,
      adaptiveQuality: this.adaptiveQuality,
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
        total: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
        limit: (performance as any).memory.jsHeapSizeLimit / 1024 / 1024
      } : null,
      timestamp: Date.now()
    };

    // Emit performance update event
    window.dispatchEvent(new CustomEvent('quantum:performance_update', {
      detail: this.performanceMetrics
    }));
  }

  public getAdaptiveQuality(): number {
    return this.adaptiveQuality;
  }

  public getPerformanceMetrics() {
    return this.performanceMetrics;
  }

  public destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}

// GPU acceleration utilities
export class QuantumGPUAccelerator {
  private gl: WebGLRenderingContext | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  private buffers: Map<string, WebGLBuffer> = new Map();

  constructor(canvas?: HTMLCanvasElement) {
    if (typeof window !== 'undefined' && canvas) {
      this.initializeWebGL(canvas);
    }
  }

  private initializeWebGL(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.warn('WebGL not supported, falling back to CPU calculations');
      return;
    }

    // Enable necessary extensions
    this.gl.getExtension('OES_texture_float');
    this.gl.getExtension('OES_texture_float_linear');
  }

  public compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  public createProgram(vertexShaderSource: string, fragmentShaderSource: string, name: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program linking error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    this.programs.set(name, program);
    return program;
  }

  public createBuffer(name: string, data: Float32Array): WebGLBuffer | null {
    if (!this.gl) return null;

    const buffer = this.gl.createBuffer();
    if (!buffer) return null;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW);

    this.buffers.set(name, buffer);
    return buffer;
  }

  public isSupported(): boolean {
    return this.gl !== null;
  }

  public getContext(): WebGLRenderingContext | null {
    return this.gl;
  }
}

// React hook for quantum performance optimization
export function useQuantumPerformance() {
  const performanceManagerRef = useRef<QuantumPerformanceManager | null>(null);
  const gpuAcceleratorRef = useRef<QuantumGPUAccelerator | null>(null);

  useEffect(() => {
    // Initialize performance manager
    performanceManagerRef.current = new QuantumPerformanceManager();

    // Initialize GPU accelerator
    gpuAcceleratorRef.current = new QuantumGPUAccelerator();

    return () => {
      performanceManagerRef.current?.destroy();
    };
  }, []);

  return {
    performanceManager: performanceManagerRef.current,
    gpuAccelerator: gpuAcceleratorRef.current,
    calculateSuperposition: (particles: any[], time: number, level: number) => {
      performanceManagerRef.current?.calculateSuperposition(particles, time, level);
    },
    calculateEntanglement: (pairs: any[], measurement: number) => {
      performanceManagerRef.current?.calculateEntanglement(pairs, measurement);
    },
    calculateTunneling: (params: any) => {
      performanceManagerRef.current?.calculateTunnelingProbability(params);
    }
  };
}

// Memory management for quantum visualizations
export class QuantumMemoryManager {
  private allocatedObjects: WeakSet<any> = new WeakSet();
  private objectPools: Map<string, any[]> = new Map();

  public createObjectPool(type: string, createFn: () => any, initialSize: number = 100) {
    const pool = [];
    for (let i = 0; i < initialSize; i++) {
      pool.push(createFn());
    }
    this.objectPools.set(type, pool);
  }

  public getFromPool(type: string): any | null {
    const pool = this.objectPools.get(type);
    return pool && pool.length > 0 ? pool.pop() : null;
  }

  public returnToPool(type: string, object: any) {
    const pool = this.objectPools.get(type);
    if (pool && pool.length < 200) { // Prevent pool from growing too large
      // Reset object properties if needed
      if (object.reset && typeof object.reset === 'function') {
        object.reset();
      }
      pool.push(object);
    }
  }

  public trackObject(object: any) {
    this.allocatedObjects.add(object);
  }

  public cleanup() {
    this.objectPools.clear();
  }
}
