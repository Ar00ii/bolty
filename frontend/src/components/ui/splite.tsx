'use client';
import dynamic from 'next/dynamic';
import { Component, ReactNode } from 'react';

// next/dynamic with ssr:false prevents @splinetool/runtime from evaluating
// during SSR *and* during client hydration before the component mounts,
// avoiding the "Super constructor null is not a constructor" crash.
const Spline = dynamic(() => import('@splinetool/react-spline'), { ssr: false });

interface SplineSceneProps {
  scene: string;
  className?: string;
}

interface ErrorBoundaryState {
  crashed: boolean;
}

class SplineErrorBoundary extends Component<{ children: ReactNode; className?: string }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { crashed: false };
  static getDerivedStateFromError() { return { crashed: true }; }
  render() {
    if (this.state.crashed) {
      return (
        <div className={`w-full h-full flex items-center justify-center ${this.props.className ?? ''}`}>
          <span className="w-8 h-8 rounded-full border-2 border-monad-400 border-t-transparent animate-spin" />
        </div>
      );
    }
    return this.props.children;
  }
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <SplineErrorBoundary className={className}>
      <Spline scene={scene} className={className} />
    </SplineErrorBoundary>
  );
}
