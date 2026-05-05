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

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-video bg-neutral-900 rounded-xl flex items-center justify-center">
          <div className="text-center text-neutral-400">
            <p className="text-sm font-medium">3D viewer unavailable</p>
            <p className="text-xs mt-1">WebGL is not supported in this browser</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
