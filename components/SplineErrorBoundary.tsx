'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class SplineErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any) {
    console.warn('[SplineErrorBoundary] caught:', error?.message)
    // Prevent the error from propagating
    if (typeof window !== 'undefined') {
      window.onerror = () => true
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-square bg-neutral-900 rounded-2xl flex items-center justify-center">
          <div className="text-center text-neutral-400 p-8">
            <p className="text-5xl mb-4">🧥</p>
            <p className="text-sm font-medium text-neutral-300">3D viewer unavailable</p>
            <p className="text-xs mt-2 text-neutral-500">WebGL is not supported in this browser</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
