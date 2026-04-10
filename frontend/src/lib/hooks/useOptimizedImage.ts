/**
 * Hook for rendering optimized images with lazy loading
 * Provides a consistent way to handle image loading with fallbacks
 */
import { useState, useCallback } from 'react';

interface UseOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

interface ImageState {
  isLoading: boolean;
  isError: boolean;
}

export function useOptimizedImage(props: UseOptimizedImageProps) {
  const [state, setState] = useState<ImageState>({
    isLoading: true,
    isError: false,
  });

  const handleLoad = useCallback(() => {
    setState({ isLoading: false, isError: false });
    props.onLoad?.();
  }, [props]);

  const handleError = useCallback(() => {
    setState({ isLoading: false, isError: true });
    props.onError?.();
  }, [props]);

  // Image component props for optimization
  const imageProps = {
    src: props.src,
    alt: props.alt,
    ...(props.width && { width: props.width }),
    ...(props.height && { height: props.height }),
    loading: props.priority ? 'eager' : 'lazy',
    onLoad: handleLoad,
    onError: handleError,
    decoding: 'async' as const,
  };

  return {
    ...state,
    imageProps,
  };
}
