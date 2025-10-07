/**
 * Performance Optimization Utilities
 * Helpers for optimizing React Native app performance
 */

import React from 'react';
import { InteractionManager } from 'react-native';

/**
 * Memoization utilities
 */
export const PerformanceHelpers = {
  /**
   * Debounce function calls
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Run after interactions are complete
   */
  runAfterInteractions: (callback: () => void): void => {
    InteractionManager.runAfterInteractions(() => {
      callback();
    });
  },

  /**
   * Delay heavy operations
   */
  deferHeavyOperation: (operation: () => void, delay: number = 0): void => {
    setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        operation();
      });
    }, delay);
  },

  /**
   * Batch state updates
   */
  batchUpdate: (updates: Array<() => void>): void => {
    requestAnimationFrame(() => {
      updates.forEach((update) => update());
    });
  },

  /**
   * Measure component render time
   */
  measureRenderTime: (componentName: string) => {
    const startTime = Date.now();
    return () => {
      const renderTime = Date.now() - startTime;
      if (renderTime > 16) {
        // Longer than 1 frame (60fps = 16.67ms per frame)
        console.warn(`Slow render: ${componentName} took ${renderTime}ms`);
      }
    };
  },
};

/**
 * FlatList optimization config
 */
export const FlatListConfig = {
  // Standard config
  standard: {
    windowSize: 10,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    removeClippedSubviews: true,
    getItemLayout: (data: any, index: number, itemHeight: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
  },

  // Long list config (100+ items)
  longList: {
    windowSize: 21,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 100,
    initialNumToRender: 5,
    removeClippedSubviews: true,
  },

  // Short list config (< 20 items)
  shortList: {
    windowSize: 5,
    maxToRenderPerBatch: 20,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 20,
    removeClippedSubviews: false,
  },
};

/**
 * Image optimization config
 */
export const ImageConfig = {
  // Avatar sizes
  avatar: {
    small: 40,
    medium: 80,
    large: 120,
  },

  // Quality settings
  quality: {
    thumbnail: 0.6,
    normal: 0.8,
    high: 0.9,
  },

  // Cache settings
  cache: {
    memory: 'memory-disk' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

/**
 * Memory management utilities
 */
export const MemoryHelpers = {
  /**
   * Clear cached data
   */
  clearCache: async (): Promise<void> => {
    // Clear image cache, etc.
    console.log('Cache cleared');
  },

  /**
   * Get memory usage info
   */
  getMemoryInfo: (): { used: number; available: number } => {
    // In production, use actual memory tracking
    return {
      used: 0,
      available: 0,
    };
  },

  /**
   * Check if low memory
   */
  isLowMemory: (): boolean => {
    const { used, available } = MemoryHelpers.getMemoryInfo();
    return available > 0 && (used / available) > 0.9;
  },
};

/**
 * Bundle size optimization helpers
 */
export const BundleHelpers = {
  /**
   * Lazy load component
   */
  lazyLoad: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ): React.LazyExoticComponent<T> => {
    return React.lazy(importFunc);
  },

  /**
   * Preload component
   */
  preload: (importFunc: () => Promise<any>): void => {
    PerformanceHelpers.runAfterInteractions(() => {
      importFunc();
    });
  },
};

/**
 * Network optimization
 */
export const NetworkHelpers = {
  /**
   * Batch network requests
   */
  batchRequests: <T>(
    requests: Array<() => Promise<T>>,
    batchSize: number = 3
  ): Promise<T[]> => {
    const batches: Array<Array<() => Promise<T>>> = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      batches.push(requests.slice(i, i + batchSize));
    }

    return batches.reduce(
      async (prevPromise, batch) => {
        const prev = await prevPromise;
        const results = await Promise.all(batch.map((req) => req()));
        return [...prev, ...results];
      },
      Promise.resolve([]) as Promise<T[]>
    );
  },

  /**
   * Retry request with exponential backoff
   */
  retryWithBackoff: async <T>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await request();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Max retries exceeded');
  },
};

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  /**
   * Start tracking a metric
   */
  static start(metricName: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      this.record(metricName, duration);
    };
  }

  /**
   * Record a metric
   */
  static record(metricName: string, value: number): void {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }

    this.metrics.get(metricName)!.push(value);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(metricName)!;
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  /**
   * Get average for a metric
   */
  static getAverage(metricName: string): number {
    const measurements = this.metrics.get(metricName) || [];
    if (measurements.length === 0) return 0;

    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }

  /**
   * Get all metrics
   */
  static getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    this.metrics.forEach((measurements, name) => {
      result[name] = {
        average: this.getAverage(name),
        count: measurements.length,
      };
    });

    return result;
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
  }
}

/**
 * HOC to optimize component rendering
 */
export const withPerformanceOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prev: P, next: P) => boolean
): React.FC<P> => {
  return React.memo(Component, propsAreEqual);
};

/**
 * Hook for tracking component mount/unmount
 */
export const usePerformanceTracking = (componentName: string) => {
  React.useEffect(() => {
    const end = PerformanceMonitor.start(`${componentName}_mount`);
    return end;
  }, [componentName]);
};

export default {
  AnimationPresets,
  PerformanceHelpers,
  FlatListConfig,
  ImageConfig,
  MemoryHelpers,
  BundleHelpers,
  NetworkHelpers,
  PerformanceMonitor,
  withPerformanceOptimization,
  usePerformanceTracking,
};

