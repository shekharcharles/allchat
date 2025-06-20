/**
 * Performance monitoring utilities
 */

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memory?: NodeJS.MemoryUsage;
  operation: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();

  start(operation: string): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.metrics.set(id, {
      startTime: Date.now(),
      operation,
      memory: process.memoryUsage(),
    });
    return id;
  }

  end(id: string): PerformanceMetrics | null {
    const metric = this.metrics.get(id);
    if (!metric) return null;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;

    const finalMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memory: process.memoryUsage(),
    };

    this.metrics.set(id, finalMetric);
    return finalMetric;
  }

  getMetric(id: string): PerformanceMetrics | null {
    return this.metrics.get(id) || null;
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
  }

  // Get average duration for an operation
  getAverageDuration(operation: string): number {
    const operationMetrics = Array.from(this.metrics.values())
      .filter(m => m.operation === operation && m.duration !== undefined);
    
    if (operationMetrics.length === 0) return 0;
    
    const totalDuration = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / operationMetrics.length;
  }

  // Get memory usage statistics
  getMemoryStats(): {
    current: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    average: NodeJS.MemoryUsage;
  } {
    const current = process.memoryUsage();
    const allMemory = Array.from(this.metrics.values())
      .map(m => m.memory)
      .filter(Boolean) as NodeJS.MemoryUsage[];

    if (allMemory.length === 0) {
      return { current, peak: current, average: current };
    }

    const peak = allMemory.reduce((max, mem) => ({
      rss: Math.max(max.rss, mem.rss),
      heapTotal: Math.max(max.heapTotal, mem.heapTotal),
      heapUsed: Math.max(max.heapUsed, mem.heapUsed),
      external: Math.max(max.external, mem.external),
      arrayBuffers: Math.max(max.arrayBuffers || 0, mem.arrayBuffers || 0),
    }));

    const average = allMemory.reduce((sum, mem) => ({
      rss: sum.rss + mem.rss,
      heapTotal: sum.heapTotal + mem.heapTotal,
      heapUsed: sum.heapUsed + mem.heapUsed,
      external: sum.external + mem.external,
      arrayBuffers: (sum.arrayBuffers || 0) + (mem.arrayBuffers || 0),
    }), { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 });

    const count = allMemory.length;
    return {
      current,
      peak,
      average: {
        rss: Math.round(average.rss / count),
        heapTotal: Math.round(average.heapTotal / count),
        heapUsed: Math.round(average.heapUsed / count),
        external: Math.round(average.external / count),
        arrayBuffers: Math.round((average.arrayBuffers || 0) / count),
      },
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility function for timing async operations
export async function timeAsync<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const id = performanceMonitor.start(operation);
  try {
    const result = await fn();
    const metrics = performanceMonitor.end(id)!;
    return { result, metrics };
  } catch (error) {
    performanceMonitor.end(id);
    throw error;
  }
}

// Utility function for timing sync operations
export function timeSync<T>(
  operation: string,
  fn: () => T
): { result: T; metrics: PerformanceMetrics } {
  const id = performanceMonitor.start(operation);
  try {
    const result = fn();
    const metrics = performanceMonitor.end(id)!;
    return { result, metrics };
  } catch (error) {
    performanceMonitor.end(id);
    throw error;
  }
}

// Format memory usage for display
export function formatMemoryUsage(memory: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)}MB`;
  };

  return `RSS: ${formatBytes(memory.rss)}, Heap: ${formatBytes(memory.heapUsed)}/${formatBytes(memory.heapTotal)}, External: ${formatBytes(memory.external)}`;
}
