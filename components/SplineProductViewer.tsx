'use client'

import { Suspense, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, Maximize2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Dynamic import for Spline to avoid SSR issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-neutral-600">Loading 3D Model...</p>
      </div>
    </div>
  )
})

interface SplineProductViewerProps {
  sceneUrl: string
  productName: string
}

export default function SplineProductViewer({ sceneUrl, productName }: SplineProductViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      {/* Regular View */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl overflow-hidden shadow-xl border border-neutral-200">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        }>
          <Spline 
            scene={sceneUrl} 
            onLoad={() => setIsLoaded(true)}
            className="w-full h-full"
          />
        </Suspense>

        {/* Fullscreen Button */}
        <Button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-primary shadow-lg rounded-full p-3"
          size="icon"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>

        {/* 3D Badge */}
        <div className="absolute bottom-4 left-4 bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Interactive 3D
        </div>

        {/* Instructions */}
        {isLoaded && (
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-neutral-600">
            Drag to rotate | Scroll to zoom
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <Button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 z-10"
            size="icon"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="w-full h-full max-w-6xl max-h-[90vh] p-4">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
              </div>
            }>
              <Spline scene={sceneUrl} className="w-full h-full" />
            </Suspense>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-center">
            <p className="text-lg font-semibold mb-1">{productName}</p>
            <p className="text-sm text-white/70">Drag to rotate | Scroll to zoom | Pinch on mobile</p>
          </div>
        </div>
      )}
    </>
  )
}
