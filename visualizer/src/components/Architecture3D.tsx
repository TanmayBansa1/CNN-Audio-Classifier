"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import type { Group } from "three";
import ResidualBlockModal from "./ResidualBlockModal";
import { webglManager } from "~/lib/webgl-context";

type LayerSpec = {
  key: string;
  title: string;
  shortTitle: string;
  color: string;
  size: [number, number, number];
  position: [number, number, number];
  details: string[];
  paramCount?: string;
  operations?: string[];
  clickable?: boolean;
};

function LayerBox({ spec, onClick }: { spec: LayerSpec; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={spec.position}>
      {/* Main box with enhanced materials */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={spec.size} />
        <meshStandardMaterial 
          color={spec.color} 
          roughness={0.15} 
          metalness={0.3}
          emissive={spec.color}
          emissiveIntensity={hovered ? 0.15 : 0.05}
        />
      </mesh>

      {/* Permanent label */}
      <Text
        position={[0, -spec.size[1]/2 - 0.4, spec.size[2]/2 + 0.1]}
        fontSize={0.18}
        color="#dc2626"
        anchorX="center"
        anchorY="middle"
        maxWidth={spec.size[0] + 0.5}
        textAlign="center"
      >
        {spec.shortTitle}
      </Text>

      {/* Enhanced hover tooltip */}
      {hovered && (
        <Html distanceFactor={6} position={[0, (spec.size[1] / 2) + 0.8, 0]}>
          <div className="rounded-xl border border-rose-300/60 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="font-playfair text-base font-medium text-rose-700">{spec.title}</div>
            {spec.paramCount && (
              <div className="font-crimson mt-1 text-xs text-orange-600 font-medium">
                Parameters: {spec.paramCount}
              </div>
            )}
            <ul className="font-crimson mt-2 list-disc pl-4 text-xs text-gray-700 space-y-0.5">
              {spec.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            {spec.operations && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="font-crimson text-xs font-medium text-gray-700">Operations:</div>
                <div className="font-crimson text-xs text-gray-600 mt-0.5">
                  {spec.operations.join(" → ")}
                </div>
              </div>
            )}
            {spec.clickable && (
              <div className="mt-2 pt-2 border-t border-rose-200">
                <div className="font-crimson text-xs text-rose-600 italic">Click to explore internals</div>
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Subtle wireframe outline */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[spec.size[0] + 0.02, spec.size[1] + 0.02, spec.size[2] + 0.02]} />
        <meshBasicMaterial wireframe color="#ffffff" opacity={0.1} transparent />
      </mesh>
    </group>
  );
}

export default function Architecture3D({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [canRender, setCanRender] = useState(false);

  // Intersection Observer to only render when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        setIsVisible(visible);
        
        if (visible) {
          const canUseWebGL = webglManager.register('architecture3d', 0);
          setCanRender(canUseWebGL);
        } else {
          webglManager.unregister('architecture3d');
          setCanRender(false);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      webglManager.unregister('architecture3d');
    };
  }, []);

  // Listen for WebGL context restoration
  useEffect(() => {
    const handleContextRestored = (event: CustomEvent<{ canvasId: string }>) => {
      if (event.detail.canvasId === 'architecture3d' && isVisible) {
        setCanRender(true);
        console.log('Architecture3D: Context restored, can render again');
      }
    };

    window.addEventListener('webgl-context-restored', handleContextRestored as EventListener);
    
    return () => {
      window.removeEventListener('webgl-context-restored', handleContextRestored as EventListener);
    };
  }, [isVisible]);

  // Cleanup Three.js when component unmounts
  useEffect(() => {
    return () => {
      // Force garbage collection of Three.js objects when component unmounts
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    };
  }, []);

  const specs: LayerSpec[] = useMemo(() => {

    return [
      {
        key: "input",
        title: "Input Layer (Mel-Spectrogram)",
        shortTitle: "Input\nMel-Spec",
        color: "#fb7185",
        size: [2.8, 1.4, 0.25],
        position: [0, 0, 0],
        details: ["Shape: 1 × H × W", "Mel-scale frequency bins", "Normalized per-channel", "Time-frequency representation"],
        paramCount: "0",
        operations: ["Audio", "STFT", "Mel-filter", "Log"],
      },
      {
        key: "layer1",
        title: "Layer 1: Initial Convolution + MaxPool",
        shortTitle: "Conv 7×7\n+ MaxPool",
        color: "#f97316",
        size: [2.4, 1.2, 0.35],
        position: [3.2, 0, 0],
        details: ["Conv2d(1→64, kernel=7, stride=2, pad=3)", "BatchNorm2d(64)", "ReLU activation", "MaxPool2d(kernel=3, stride=2, pad=1)"],
        paramCount: "3.2K",
        operations: ["Conv2d", "BatchNorm", "ReLU", "MaxPool"],
      },
      {
        key: "layer2",
        title: "Layer 2: Residual Blocks (64 channels)",
        shortTitle: "3× ResBlock\n64ch",
        color: "#f59e0b",
        size: [2.2, 1.0, 0.35],
        position: [6.0, 0, 0],
        details: ["3 residual blocks", "64 → 64 channels", "stride=1 (no downsampling)", "Skip connections preserve gradients"],
        paramCount: "73.7K",
        operations: ["ResBlock", "ResBlock", "ResBlock"],
        clickable: true,
      },
      {
        key: "layer3",
        title: "Layer 3: Residual Blocks (128 channels)",
        shortTitle: "4× ResBlock\n128ch",
        color: "#f43f5e",
        size: [2.0, 0.9, 0.35],
        position: [8.6, 0, 0],
        details: ["4 residual blocks", "64 → 128 channels (first block)", "stride=2 downsampling (first block)", "Spatial resolution halved"],
        paramCount: "230K",
        operations: ["ResBlock↓", "ResBlock", "ResBlock", "ResBlock"],
        clickable: true,
      },
      {
        key: "layer4",
        title: "Layer 4: Residual Blocks (256 channels)",
        shortTitle: "6× ResBlock\n256ch",
        color: "#e11d48",
        size: [1.8, 0.8, 0.35],
        position: [11.0, 0, 0],
        details: ["6 residual blocks", "128 → 256 channels (first block)", "stride=2 downsampling (first block)", "Deep feature extraction"],
        paramCount: "1.18M",
        operations: ["ResBlock↓", "ResBlock", "ResBlock", "ResBlock", "ResBlock", "ResBlock"],
        clickable: true,
      },
      {
        key: "layer5",
        title: "Layer 5: Residual Blocks (512 channels)",
        shortTitle: "3× ResBlock\n512ch",
        color: "#db2777",
        size: [1.6, 0.7, 0.35],
        position: [13.2, 0, 0],
        details: ["3 residual blocks", "256 → 512 channels (first block)", "stride=2 downsampling (first block)", "High-level semantic features"],
        paramCount: "1.51M",
        operations: ["ResBlock↓", "ResBlock", "ResBlock"],
        clickable: true,
      },
      {
        key: "head",
        title: "Classification Head",
        shortTitle: "GAP +\nDropout + FC",
        color: "#f472b6",
        size: [1.2, 0.6, 0.25],
        position: [15.2, 0, 0],
        details: ["Global Average Pooling", "Dropout (p=0.5)", "Linear layer (512→50)", "Softmax for classification"],
        paramCount: "25.6K",
        operations: ["GAP", "Dropout", "Linear", "Softmax"],
      },
    ];
  }, []);

  const [residualKey, setResidualKey] = useState<string | null>(null);
  const [layerInfo, setLayerInfo] = useState<LayerSpec | null>(null);

  // Auto-rotation component
  function RotatingScene({ children, onInteractionChange }: { children: React.ReactNode; onInteractionChange?: (interacting: boolean) => void }) {
    const groupRef = useRef<Group>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleInteractionStart = () => {
      setIsInteracting(true);
      onInteractionChange?.(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleInteractionEnd = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsInteracting(false);
        onInteractionChange?.(false);
      }, 2000); // Resume rotation after 2 seconds of inactivity
    };

    useFrame((state, delta) => {
      if (groupRef.current && !isInteracting) {
        groupRef.current.rotation.y += delta * 0.12; // Slow, smooth rotation
      }
    });

    return (
      <group 
        ref={groupRef} 
        onPointerDown={handleInteractionStart}
        onPointerUp={handleInteractionEnd}
      >
        {children}
      </group>
    );
  }

  return (
    <div className={className} ref={containerRef}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl border border-rose-200/50 bg-white/50 p-4 shadow-xl backdrop-blur md:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-playfair bg-gradient-to-r from-rose-700 via-orange-600 to-amber-600 bg-clip-text text-2xl font-medium text-transparent">
              Model Architecture (3D)
            </h3>
            <p className="font-crimson text-sm text-gray-600">Auto-rotating · Click to pause · Hover and click layers for details</p>
          </div>
        </div>
        <div className="h-[420px] w-full md:h-[520px]">
          {isVisible && canRender ? (
            <Canvas 
              camera={{ position: [5, 3, 9], fov: 50 }} 
              shadows
              dpr={[1, 2]} // Clamp device pixel ratio for performance
              performance={{ min: 0.5 }} // Allow frame rate to drop to maintain performance
              gl={{ 
                antialias: false, // Disable antialias for performance
                alpha: true,
                powerPreference: "high-performance",
                stencil: false,
                depth: true
              }}
            >
            {/* Optimized lighting setup */}
            <ambientLight intensity={0.5} />
            <directionalLight 
              position={[10, 10, 5]} 
              intensity={1.0} 
              castShadow 
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-near={1}
              shadow-camera-far={50}
              shadow-camera-left={-20}
              shadow-camera-right={20}
              shadow-camera-top={20}
              shadow-camera-bottom={-20}
            />
            <directionalLight position={[-5, -4, -3]} intensity={0.4} />
            
            {/* Fog for depth */}
            <fog attach="fog" args={["#fef7ed", 15, 35]} />

            <RotatingScene>
              {/* Enhanced ground grid */}
              <gridHelper args={[40, 40, "#fb7185", "#fecaca"]} position={[8, -1.5, 0]} />
              
              {/* Background plane */}
              <mesh position={[8, -1.52, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 40]} />
                <meshStandardMaterial color="#fef7ed" opacity={0.8} transparent />
              </mesh>

              {specs.map((spec) => (
                <LayerBox
                  key={spec.key}
                  spec={spec}
                  onClick={() => {
                    setLayerInfo(spec);
                    if (spec.clickable) setResidualKey(spec.key);
                  }}
                />
              ))}

              {/* Enhanced flow arrows */}
              {specs.map((spec, i) => {
                const next = specs[i + 1];
                if (!next) return null;
                const from: [number, number, number] = [spec.position[0] + spec.size[0] / 2 + 0.2, spec.position[1], spec.position[2]];
                const to: [number, number, number] = [next.position[0] - next.size[0] / 2 - 0.2, next.position[1], next.position[2]];
                const mid: [number, number, number] = [(from[0] + to[0]) / 2, from[1] + 0.1, from[2]];
                const distance = to[0] - from[0];
                
                return (
                  <group key={`flow-${spec.key}`}>
                    {/* Main flow cylinder */}
                    <mesh position={mid} rotation={[0, 0, Math.PI / 2]} castShadow>
                      <cylinderGeometry args={[0.03, 0.03, Math.max(0.2, distance), 16]} />
                      <meshStandardMaterial 
                        color="#ef4444" 
                        emissive="#ef4444" 
                        emissiveIntensity={0.2}
                        metalness={0.3}
                        roughness={0.4}
                      />
                    </mesh>
                    
                    {/* Arrow head */}
                    <mesh position={[to[0] - 0.15, to[1] + 0.1, to[2]]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                      <coneGeometry args={[0.08, 0.2, 8]} />
                      <meshStandardMaterial 
                        color="#dc2626" 
                        emissive="#dc2626" 
                        emissiveIntensity={0.3}
                      />
                    </mesh>
                  </group>
                );
              })}
            </RotatingScene>

            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              dampingFactor={0.05}
              enableDamping={true}
            />
          </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full bg-white/20 rounded-2xl">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/30 rounded-full mx-auto animate-pulse"></div>
                <p className="text-gray-600">3D Architecture Loading...</p>
              </div>
            </div>
          )}
        </div>

        {/* Details panel */}
        {layerInfo && (
          <div className="mt-4 rounded-2xl border border-orange-200/60 bg-white/70 p-4">
            <div className="font-playfair text-lg text-rose-700">{layerInfo.title}</div>
            <ul className="font-crimson mt-1 list-disc pl-5 text-sm text-gray-700">
              {layerInfo.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}

        <ResidualBlockModal
          open={Boolean(residualKey)}
          title={layerInfo?.title ?? "Residual Block"}
          onClose={() => setResidualKey(null)}
        />
      </motion.div>
    </div>
  );
}


