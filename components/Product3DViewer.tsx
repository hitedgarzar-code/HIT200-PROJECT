'use client'

import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Environment, 
  PresentationControls,
  Float,
  Html,
  useTexture
} from '@react-three/drei'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { RotateCcw, Maximize2, X } from 'lucide-react'

// Suppress THREE.Clock deprecation warning (internal to drei/three)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (args[0]?.includes?.('THREE.Clock') || (typeof args[0] === 'string' && args[0].includes('Clock'))) {
      return
    }
    originalWarn.apply(console, args)
  }
}

interface Product3DViewerProps {
  productName: string
  productImage: string
  category: string
}

// Clothing item as a textured plane that can be rotated
function ClothingItem({ imageUrl, category }: { imageUrl: string; category: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const elapsedTime = useRef(0)
  
  // Load texture from image URL
  const texture = useTexture(imageUrl)
  
  // Auto-rotate effect using delta time instead of deprecated Clock
  useFrame((_, delta) => {
    elapsedTime.current += delta
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(elapsedTime.current * 0.5) * 0.3
    }
  })

  // Determine shape based on category
  const getShape = () => {
    switch (category.toLowerCase()) {
      case 'tops':
      case 'blazers':
      case 'jackets':
      case 'coats':
      case 'sweaters':
        return { width: 2, height: 2.5 }
      case 'pants':
      case 'skirts':
        return { width: 1.8, height: 3 }
      case 'dresses':
        return { width: 2, height: 3.5 }
      default:
        return { width: 2, height: 2.5 }
    }
  }

  const shape = getShape()

  return (
    <Float
      speed={2}
      rotationIntensity={0.5}
      floatIntensity={0.5}
    >
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.05 : 1}
      >
        <planeGeometry args={[shape.width, shape.height, 32, 32]} />
        <meshStandardMaterial 
          map={texture} 
          side={THREE.DoubleSide}
          transparent
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </Float>
  )
}

// Mannequin placeholder shape
function Mannequin() {
  return (
    <group position={[0, -0.5, -0.5]}>
      {/* Head */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.3, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      {/* Body */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.4, 1.2, 8, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.6, 1.2, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      <mesh position={[0.6, 1.2, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.2, -0.5, 0]}>
        <capsuleGeometry args={[0.12, 1, 8, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
      <mesh position={[0.2, -0.5, 0]}>
        <capsuleGeometry args={[0.12, 1, 8, 16]} />
        <meshStandardMaterial color="#e8d5c4" />
      </mesh>
    </group>
  )
}

// Loading fallback
function Loader() {
  return (
    <Html center>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-neutral-600">Loading 3D view...</p>
      </div>
    </Html>
  )
}

export default function Product3DViewer({ productName, productImage, category }: Product3DViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMannequin, setShowMannequin] = useState(true)
  const [autoRotate, setAutoRotate] = useState(true)

  const Scene = () => (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#d4a574" />
      
      <PresentationControls
        global
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 4, Math.PI / 4]}
        azimuth={[-Math.PI / 4, Math.PI / 4]}
        config={{ mass: 2, tension: 400 }}
        snap={{ mass: 4, tension: 400 }}
      >
        {showMannequin && <Mannequin />}
        <Suspense fallback={<Loader />}>
          <ClothingItem imageUrl={productImage} category={category} />
        </Suspense>
      </PresentationControls>

      <OrbitControls 
        enableZoom={true}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={2}
        minDistance={3}
        maxDistance={8}
      />
      
      <Environment preset="studio" />
    </>
  )

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-900">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
        
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            onClick={() => setIsFullscreen(false)}
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-full p-2">
          <Button
            onClick={() => setAutoRotate(!autoRotate)}
            size="sm"
            variant={autoRotate ? "default" : "ghost"}
            className="rounded-full"
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setShowMannequin(!showMannequin)}
            size="sm"
            variant={showMannequin ? "default" : "ghost"}
            className="rounded-full"
          >
            {showMannequin ? 'Hide' : 'Show'} Model
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 text-white/80 text-sm">
          <p>Drag to rotate | Scroll to zoom</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl overflow-hidden">
      <div className="aspect-square">
        <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>

      {/* 3D Badge */}
      <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        3D View
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
        <Button
          onClick={() => setAutoRotate(!autoRotate)}
          size="sm"
          variant={autoRotate ? "default" : "ghost"}
          className="rounded-full h-8 w-8 p-0"
          title={autoRotate ? "Stop rotation" : "Auto rotate"}
        >
          <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          onClick={() => setIsFullscreen(true)}
          size="sm"
          variant="ghost"
          className="rounded-full h-8 w-8 p-0"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Product Name */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
        <p className="text-sm font-medium text-primary">{productName}</p>
      </div>
    </div>
  )
}
