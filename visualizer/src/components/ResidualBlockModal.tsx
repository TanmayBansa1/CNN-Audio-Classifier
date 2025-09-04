"use client";

import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { webglManager } from "~/lib/webgl-context";

export default function ResidualBlockModal({ open, onClose, title }: { open: boolean; onClose: () => void; title: string }) {
  const [canRender, setCanRender] = useState(false);

  // Manage WebGL context when modal opens/closes
  useEffect(() => {
    if (open) {
      const canUseWebGL = webglManager.register('residual-modal', 1);
      setCanRender(canUseWebGL);
    } else {
      webglManager.unregister('residual-modal');
      setCanRender(false);
      //cleanup
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
    }

    return () => {
      webglManager.unregister('residual-modal');
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 24, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 24, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-[95vw] max-w-5xl rounded-3xl border border-rose-200/60 bg-white/95 p-6 shadow-2xl backdrop-blur"
          >
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h4 className="font-playfair text-2xl text-rose-700">{title}</h4>
                <p className="font-crimson text-sm text-gray-600 mt-1">Conv3×3 → BN → ReLU → Conv3×3 → BN + (Shortcut) → ReLU</p>
              </div>
              <button 
                onClick={onClose} 
                className="rounded-lg border border-orange-300/60 bg-gradient-to-r from-rose-400 to-orange-400 px-4 py-2 font-crimson text-white shadow hover:shadow-lg transition-shadow"
              >
                Close
              </button>
            </div>

            {/* 3D Visualization */}
            <div className="h-[480px] w-full rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 overflow-hidden">
              {canRender ? (
                <Canvas 
                camera={{ position: [4, 3, 6], fov: 45 }}
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
                gl={{ 
                  antialias: false,
                  alpha: true,
                  powerPreference: "high-performance",
                  stencil: false,
                  depth: true
                }}
              >
                <ambientLight intensity={0.7} />
                <directionalLight 
                  position={[8, 8, 5]} 
                  intensity={0.6} 
                  castShadow 
                  shadow-mapSize-width={512}
                  shadow-mapSize-height={512}
                  shadow-camera-near={1}
                  shadow-camera-far={20}
                  shadow-camera-left={-10}
                  shadow-camera-right={10}
                  shadow-camera-top={10}
                  shadow-camera-bottom={-10}
                />
                <directionalLight position={[-5, 5, -3]} intensity={0.3} />

                {/* Main processing path */}
                <group position={[-2.5, 1, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.4, 0.6, 0.6]} />
                    <meshStandardMaterial color="#f97316" roughness={0.3} metalness={0.1} />
                  </mesh>
                  <Html distanceFactor={12} position={[0, 1.2, 0]}>
                    <div className="rounded-lg border-2 border-orange-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                      <div className="text-orange-700 font-semibold">Conv 3×3</div>
                      <div className="text-xs text-gray-600">64→64</div>
                    </div>
                  </Html>
                </group>

                <group position={[-0.5, 1, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.5, 0.5]} />
                    <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.1} />
                  </mesh>
                  <Html distanceFactor={12} position={[0, 1.1, 0]}>
                    <div className="rounded-lg border-2 border-amber-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                      <div className="text-amber-700 font-semibold">BN → ReLU</div>
                    </div>
                  </Html>
                </group>

                <group position={[1.5, 1, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.4, 0.6, 0.6]} />
                    <meshStandardMaterial color="#f43f5e" roughness={0.3} metalness={0.1} />
                  </mesh>
                  <Html distanceFactor={12} position={[0, 1.2, 0]}>
                    <div className="rounded-lg border-2 border-rose-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                      <div className="text-rose-700 font-semibold">Conv 3×3</div>
                      <div className="text-xs text-gray-600">64→64</div>
                    </div>
                  </Html>
                </group>

                {/* Batch Norm after second conv */}
                <group position={[3.2, 1, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.8, 0.4, 0.4]} />
                    <meshStandardMaterial color="#ec4899" roughness={0.3} metalness={0.1} />
                  </mesh>
                  <Html distanceFactor={12} position={[0, 0.9, 0]}>
                    <div className="rounded-lg border-2 border-pink-300/70 bg-white/95 px-2 py-1 text-xs font-medium shadow-lg backdrop-blur">
                      <div className="text-pink-700 font-semibold">BN</div>
                    </div>
                  </Html>
                </group>

                {/* Shortcut path */}
                <group position={[-0.5, -0.8, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4.5, 0.3, 0.3]} />
                    <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.2} />
                  </mesh>
                  <Html distanceFactor={14} position={[0, -0.8, 0]}>
                    <div className="rounded-lg border-2 border-blue-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                      <div className="text-blue-700 font-semibold">Shortcut Connection</div>
                      <div className="text-xs text-gray-600">Identity or 1×1 Conv</div>
                    </div>
                  </Html>
                </group>

                {/* Addition operation */}
                <mesh position={[4, 0.1, 0]} castShadow receiveShadow>
                  <sphereGeometry args={[0.3, 32, 32]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.2} roughness={0.3} metalness={0.1} />
                </mesh>
                <Html distanceFactor={12} position={[4, -0.8, 0]}>
                  <div className="rounded-lg border-2 border-emerald-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                    <div className="text-emerald-700 font-semibold">⊕ Add</div>
                    <div className="text-xs text-gray-600">Elementwise</div>
                  </div>
                </Html>

                {/* Final ReLU */}
                <group position={[5.5, 1, 0]}>
                  <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.0, 0.5, 0.5]} />
                    <meshStandardMaterial color="#22c55e" roughness={0.3} metalness={0.1} />
                  </mesh>
                  <Html distanceFactor={12} position={[0, 1.0, 0]}>
                    <div className="rounded-lg border-2 border-green-300/70 bg-white/95 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur">
                      <div className="text-green-700 font-semibold">ReLU</div>
                      <div className="text-xs text-gray-600">Output</div>
                    </div>
                  </Html>
                </group>

                {/* Flow arrows */}
                {/* Main path arrows */}
                <mesh position={[-1.5, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.3, 8]} />
                  <meshStandardMaterial color="#666" />
                </mesh>
                <mesh position={[0.5, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.3, 8]} />
                  <meshStandardMaterial color="#666" />
                </mesh>
                <mesh position={[2.3, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.3, 8]} />
                  <meshStandardMaterial color="#666" />
                </mesh>
                <mesh position={[4.7, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <coneGeometry args={[0.1, 0.3, 8]} />
                  <meshStandardMaterial color="#666" />
                </mesh>

                {/* Convergence arrows */}
                <mesh position={[3.6, 0.5, 0]} rotation={[0, 0, Math.PI / 4]}>
                  <coneGeometry args={[0.08, 0.25, 8]} />
                  <meshStandardMaterial color="#10b981" />
                </mesh>
                <mesh position={[3.6, -0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
                  <coneGeometry args={[0.08, 0.25, 8]} />
                  <meshStandardMaterial color="#3b82f6" />
                </mesh>

                <OrbitControls 
                  enablePan={true} 
                  enableZoom={true} 
                  enableRotate={true}
                  maxDistance={12}
                  minDistance={3}
                  maxPolarAngle={Math.PI * 0.75}
                  minPolarAngle={Math.PI * 0.1}
                />
              </Canvas>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-300 rounded-full mx-auto animate-pulse"></div>
                    <p className="text-slate-600">3D View Unavailable</p>
                    <p className="text-xs text-slate-500">Another 3D view is active</p>
                  </div>
                </div>
              )}
            </div>

            {/* Parameters section */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-rose-50 p-4">
                <div className="font-playfair text-lg text-rose-700 mb-3">Block Parameters</div>
                <ul className="font-crimson space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Conv2d:</strong> kernel=3×3, stride=1, padding=1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>BatchNorm2d:</strong> after each convolution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Shortcut:</strong> Identity or 1×1 Conv with stride/expand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span><strong>Activation:</strong> ReLU throughout</span>
                  </li>
                </ul>
              </div>
              
              <div className="rounded-xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="font-playfair text-lg text-blue-700 mb-3">Key Benefits</div>
                <ul className="font-crimson space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span><strong>Gradient flow:</strong> Shortcut prevents vanishing gradients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span><strong>Deep networks:</strong> Enables training of 100+ layers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span><strong>Identity mapping:</strong> Learns residual functions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span><strong>Efficiency:</strong> Reuses feature representations</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


