import { WindowThumbnail, ThumbnailOptions } from "./thumbnailCapture";

interface CacheEntry {
  thumbnail: WindowThumbnail;
  lastAccessed: number;
  captureHash: string; // hash of window title + dimensions for change detection
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
}

class ThumbnailCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly maxAge: number; // in milliseconds
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };

  constructor(maxSize = 50, maxAgeMinutes = 5) {
    this.maxSize = maxSize;
    this.maxAge = maxAgeMinutes * 60 * 1000;
  }

  /**
   * Generate a cache key for a window
   */
  private generateCacheKey(
    windowId: string,
    options: ThumbnailOptions
  ): string {
    const {
      width = 300,
      height = 200,
      scaleFactor = 1.0,
      quality = 85,
    } = options;
    return `${windowId}_${width}x${height}_${scaleFactor}_${quality}`;
  }

  /**
   * Generate a hash for change detection
   */
  private generateCaptureHash(
    windowTitle: string,
    windowRect?: { width: number; height: number }
  ): string {
    const rectStr = windowRect
      ? `${windowRect.width}x${windowRect.height}`
      : "";
    return `${windowTitle}_${rectStr}_${Date.now()}`.substring(0, 32);
  }

  /**
   * Check if a cached thumbnail is still valid
   */
  private isValidCacheEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    const isNotExpired = now - entry.thumbnail.timestamp < this.maxAge;
    const isRecentlyAccessed = now - entry.lastAccessed < this.maxAge;

    return isNotExpired && isRecentlyAccessed;
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = Date.now();
    const entriesToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidCacheEntry(entry)) {
        entriesToRemove.push(key);
      }
    }

    entriesToRemove.forEach((key) => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.stats.totalSize = this.cache.size;
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size <= this.maxSize) {
      return;
    }

    let oldestKey = "";
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.totalSize = this.cache.size;
    }
  }

  /**
   * Get a cached thumbnail if available and valid
   */
  get(
    windowId: string,
    windowTitle: string,
    options: ThumbnailOptions,
    windowRect?: { width: number; height: number }
  ): WindowThumbnail | null {
    const key = this.generateCacheKey(windowId, options);
    const entry = this.cache.get(key);

    if (!entry || !this.isValidCacheEntry(entry)) {
      this.stats.misses++;
      return null;
    }

    // Update access time
    entry.lastAccessed = Date.now();
    this.cache.set(key, entry);

    this.stats.hits++;
    console.log(`Cache hit for ${windowId} (${windowTitle})`);
    return entry.thumbnail;
  }

  /**
   * Store a thumbnail in the cache
   */
  set(
    windowId: string,
    windowTitle: string,
    thumbnail: WindowThumbnail,
    options: ThumbnailOptions,
    windowRect?: { width: number; height: number }
  ): void {
    const key = this.generateCacheKey(windowId, options);
    const captureHash = this.generateCaptureHash(windowTitle, windowRect);

    const entry: CacheEntry = {
      thumbnail,
      lastAccessed: Date.now(),
      captureHash,
    };

    // Cleanup expired entries first
    this.cleanup();

    // Evict LRU if needed
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.totalSize = this.cache.size;

    console.log(`Cached thumbnail for ${windowId} (${windowTitle})`);
  }

  /**
   * Check if window has changed and cached thumbnail should be invalidated
   */
  shouldRefresh(
    windowId: string,
    windowTitle: string,
    options: ThumbnailOptions,
    windowRect?: { width: number; height: number }
  ): boolean {
    const key = this.generateCacheKey(windowId, options);
    const entry = this.cache.get(key);

    if (!entry || !this.isValidCacheEntry(entry)) {
      return true;
    }

    const currentHash = this.generateCaptureHash(windowTitle, windowRect);
    return entry.captureHash !== currentHash;
  }

  /**
   * Manually invalidate a specific window's cache
   */
  invalidate(windowId: string, options?: ThumbnailOptions): void {
    if (options) {
      const key = this.generateCacheKey(windowId, options);
      this.cache.delete(key);
    } else {
      // Invalidate all entries for this window
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${windowId}_`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
    }

    this.stats.totalSize = this.cache.size;
    console.log(`Invalidated cache for ${windowId}`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0,
    };
    console.log("Thumbnail cache cleared");
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Get cache size information
   */
  getSize(): { current: number; max: number; percentage: number } {
    const current = this.cache.size;
    const percentage = (current / this.maxSize) * 100;

    return {
      current,
      max: this.maxSize,
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}

// Export a singleton instance
export const thumbnailCache = new ThumbnailCache();
export { ThumbnailCache };
