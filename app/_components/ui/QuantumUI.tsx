"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import gsap from 'gsap';

// Quantum Button Component
interface QuantumButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'quantum' | 'consciousness';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  glowIntensity?: number;
  quantumState?: 'superposed' | 'collapsed' | 'entangled';
}

export function QuantumButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  glowIntensity = 0.5,
  quantumState = 'collapsed'
}: QuantumButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quantumPhase, setQuantumPhase] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuantumPhase(prev => (prev + 0.1) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400',
    secondary: 'bg-gradient-to-r from-gray-600 to-gray-700 border-gray-400',
    quantum: 'bg-gradient-to-r from-cyan-500 to-pink-500 border-cyan-400',
    consciousness: 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const quantumEffect = quantumState === 'superposed' ? Math.sin(quantumPhase) * 0.5 + 0.5 : 1;

  return (
    <motion.button
      ref={buttonRef}
      className={`
        ${variantStyles[variant]} ${sizeStyles[size]}
        relative overflow-hidden rounded-lg border-2 
        text-white font-medium transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        transform-gpu
      `}
      disabled={disabled}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.05,
        filter: `brightness(${1.2 + glowIntensity * 0.3})`,
      }}
      whileTap={{ scale: 0.95 }}
      style={{
        opacity: quantumEffect,
        boxShadow: `0 0 ${(isHovered ? 20 : 10) + glowIntensity * 15}px rgba(100, 200, 255, ${glowIntensity})`
      }}
    >
      {/* Quantum particle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            transform: `translateX(${Math.sin(quantumPhase * 2) * 100}px)`,
            filter: 'blur(1px)'
          }}
        />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + Math.sin(quantumPhase + i) * 40}%`,
              animation: `quantum-float ${2 + i * 0.5}s infinite ease-in-out`
            }}
          />
        ))}
      </div>
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
      
      {/* Quantum state indicator */}
      {quantumState !== 'collapsed' && (
        <div className="absolute top-1 right-1 w-2 h-2">
          <div 
            className={`w-full h-full rounded-full ${
              quantumState === 'superposed' ? 'bg-yellow-400' : 'bg-purple-400'
            }`}
            style={{
              opacity: quantumEffect,
              animation: `pulse ${quantumState === 'superposed' ? '0.5' : '2'}s infinite`
            }}
          />
        </div>
      )}
    </motion.button>
  );
}

// Quantum Card Component
interface QuantumCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  glowColor?: string;
  consciousnessLevel?: number;
  quantumField?: boolean;
}

export function QuantumCard({
  children,
  title,
  className = '',
  glowColor = '#00f4ff',
  consciousnessLevel = 0,
  quantumField = false
}: QuantumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (quantumField && cardRef.current) {
      const card = cardRef.current;
      
      gsap.to(card, {
        backgroundPosition: '100% 0%',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, [quantumField]);

  return (
    <motion.div
      ref={cardRef}
      className={`
        relative p-6 rounded-xl border border-gray-700/50 
        bg-gradient-to-br from-gray-900/80 to-black/90
        backdrop-blur-sm overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: `0 0 ${20 + consciousnessLevel * 30}px ${glowColor}${Math.floor((0.3 + consciousnessLevel * 0.4) * 255).toString(16)}`,
        background: quantumField 
          ? `linear-gradient(-45deg, rgba(0,244,255,0.1) 0%, rgba(255,0,244,0.1) 25%, rgba(244,255,0,0.1) 50%, rgba(0,244,255,0.1) 75%, rgba(255,0,244,0.1) 100%)`
          : undefined,
        backgroundSize: quantumField ? '400% 400%' : undefined
      }}
      whileHover={{ 
        scale: 1.02,
        rotateY: 2,
        rotateX: 1
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Quantum field overlay */}
      {quantumField && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-px h-px bg-blue-400 opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `twinkle ${1 + Math.random() * 3}s infinite ease-in-out ${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Card title */}
      {title && (
        <motion.h3
          className="text-xl font-bold mb-4 text-white"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {title}
        </motion.h3>
      )}

      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Consciousness level indicator */}
      {consciousnessLevel > 0 && (
        <div className="absolute top-4 right-4">
          <div 
            className="w-3 h-3 rounded-full bg-yellow-400"
            style={{
              opacity: consciousnessLevel,
              boxShadow: `0 0 ${consciousnessLevel * 20}px #f4ff00`
            }}
          />
        </div>
      )}

      {/* Hover effect border */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-blue-400/50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Quantum Slider Component
interface QuantumSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  quantumVisualization?: boolean;
}

export function QuantumSlider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  quantumVisualization = false
}: QuantumSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="quantum-slider space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}: {value.toFixed(step < 1 ? 2 : 0)}
        </label>
      )}
      
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newValue = min + (clickX / rect.width) * (max - min);
            onChange(Math.max(min, Math.min(max, newValue)));
          }}
        >
          {/* Track */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600" />
          
          {/* Quantum field visualization */}
          {quantumVisualization && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-pink-400/20"
                style={{
                  transform: `translateX(${Math.sin(Date.now() * 0.001) * 10}px)`,
                  animation: 'quantum-wave 2s infinite ease-in-out'
                }}
              />
            </div>
          )}
          
          {/* Progress fill */}
          <motion.div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${percentage}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          
          {/* Quantum uncertainty visualization */}
          {quantumVisualization && (
            <div 
              className="absolute top-0 h-full w-4 bg-gradient-to-r from-yellow-400/50 to-transparent"
              style={{
                left: `${Math.max(0, percentage - 2)}%`,
                filter: 'blur(2px)'
              }}
            />
          )}
        </div>
        
        {/* Slider thumb */}
        <motion.div
          className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer"
          style={{
            left: `${percentage}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: isDragging 
              ? '0 0 20px rgba(100, 200, 255, 0.8)' 
              : '0 0 10px rgba(100, 200, 255, 0.4)'
          }}
          whileHover={{ scale: 1.2 }}
          whileDrag={{ scale: 1.3 }}
          drag="x"
          dragConstraints={sliderRef}
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          onDrag={(_, info) => {
            if (sliderRef.current) {
              const rect = sliderRef.current.getBoundingClientRect();
              const newPercentage = Math.max(0, Math.min(100, (info.point.x - rect.left) / rect.width * 100));
              const newValue = min + (newPercentage / 100) * (max - min);
              onChange(Math.max(min, Math.min(max, newValue)));
            }
          }}
        >
          {/* Quantum glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-sm" />
        </motion.div>
      </div>
      
      {/* Quantum measurement indicators */}
      {quantumVisualization && (
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>|0⟩</span>
          <span>Ψ = α|0⟩ + β|1⟩</span>
          <span>|1⟩</span>
        </div>
      )}
    </div>
  );
}

// Quantum Progress Bar
interface QuantumProgressProps {
  value: number;
  max?: number;
  label?: string;
  showWaveFunction?: boolean;
  consciousnessLevel?: number;
}

export function QuantumProgress({
  value,
  max = 100,
  label,
  showWaveFunction = false,
  consciousnessLevel = 0
}: QuantumProgressProps) {
  const percentage = Math.min(100, (value / max) * 100);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => prev + 0.1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="quantum-progress space-y-2">
      {label && (
        <div className="flex justify-between text-sm text-gray-300">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        {/* Background quantum field */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700">
          {showWaveFunction && Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 w-px h-full bg-blue-400/20"
              style={{
                left: `${i * 2}%`,
                opacity: Math.sin(phase + i * 0.2) * 0.5 + 0.5
              }}
            />
          ))}
        </div>
        
        {/* Progress fill with quantum effects */}
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={{ width: `${percentage}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          {/* Quantum wave overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
            style={{
              transform: `translateX(${Math.sin(phase) * 20}px)`,
              filter: 'blur(1px)'
            }}
          />
        </motion.div>
        
        {/* Consciousness enhancement */}
        {consciousnessLevel > 0 && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-transparent"
            style={{
              width: `${percentage * consciousnessLevel}%`,
              filter: 'blur(2px)'
            }}
          />
        )}
        
        {/* Leading edge quantum uncertainty */}
        <div 
          className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent to-white/30"
          style={{
            left: `${Math.max(0, percentage - 8)}%`,
            filter: 'blur(3px)',
            opacity: showWaveFunction ? 0.8 : 0.4
          }}
        />
      </div>
    </div>
  );
}

// Quantum Navigation Menu
interface QuantumNavProps {
  items: Array<{
    id: string;
    label: string;
    href: string;
    quantumState?: 'active' | 'superposed' | 'entangled';
  }>;
  activeItem?: string;
  onItemClick?: (id: string) => void;
  consciousnessLevel?: number;
}

export function QuantumNav({
  items,
  activeItem,
  onItemClick,
  consciousnessLevel = 0
}: QuantumNavProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <nav className="quantum-nav flex flex-wrap gap-2">
      {items.map((item, index) => {
        const isActive = activeItem === item.id;
        const isHovered = hoveredItem === item.id;
        const quantumState = item.quantumState || 'active';
        
        return (
          <motion.a
            key={item.id}
            href={item.href}
            className={`
              relative px-4 py-2 rounded-lg border transition-all duration-300
              ${isActive 
                ? 'bg-blue-600/50 border-blue-400 text-white' 
                : 'bg-gray-800/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
              }
            `}
            onClick={(e) => {
              e.preventDefault();
              onItemClick?.(item.id);
            }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: isActive || isHovered 
                ? `0 0 ${15 + consciousnessLevel * 10}px rgba(100, 200, 255, 0.5)` 
                : 'none'
            }}
          >
            {item.label}
            
            {/* Quantum state indicator */}
            {quantumState !== 'active' && (
              <div className={`
                absolute top-1 right-1 w-2 h-2 rounded-full
                ${quantumState === 'superposed' ? 'bg-yellow-400' : 'bg-purple-400'}
              `}>
                <div 
                  className="w-full h-full rounded-full animate-ping"
                  style={{
                    backgroundColor: quantumState === 'superposed' ? '#f59e0b' : '#a855f7'
                  }}
                />
              </div>
            )}
            
            {/* Quantum tunnel effect on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="absolute inset-0 rounded-lg border border-blue-400/50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0.8, 1.1, 1.2],
                    rotate: [0, 180, 360]
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.6 }}
                />
              )}
            </AnimatePresence>
          </motion.a>
        );
      })}
    </nav>
  );
}

// Add custom CSS animations
const quantumStyles = `
  @keyframes quantum-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes quantum-wave {
    0%, 100% { transform: translateX(0px) scaleX(1); }
    50% { transform: translateX(10px) scaleX(1.1); }
  }
  
  @keyframes twinkle {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1.5); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = quantumStyles;
  document.head.appendChild(styleElement);
}
