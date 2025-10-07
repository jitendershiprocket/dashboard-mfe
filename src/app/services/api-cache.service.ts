import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

/**
 * Cache entry structure with data and expiry time
 */
interface CacheEntry {
  data: any;
  expiryTime: number;
}

/**
 * API Cache Service
 * 
 * Provides intelligent caching for API responses to reduce redundant calls.
 * Features:
 * - In-memory caching (automatically clears on page refresh)
 * - Configurable TTL (Time To Live) per cache entry
 * - URL + params based cache keys for uniqueness
 * - Manual cache clearing support
 * 
 * Usage:
 * 1. Check if data exists in cache using has()
 * 2. Get cached data using get()
 * 3. Set data in cache using set()
 * 4. Clear specific cache or all cache using clear()
 */
@Injectable({
  providedIn: 'root',
})
export class ApiCacheService {
  // In-memory cache storage (clears on page refresh automatically)
  private cache = new Map<string, CacheEntry>();
  
  // Default cache TTL: 5 minutes (300000 ms)
  // This means cached data expires after 5 minutes
  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  constructor() {
    console.log('[ApiCacheService] Initialized - Cache will persist for tab session only');
  }

  /**
   * Generate a unique cache key from URL and parameters
   * @param url API endpoint URL
   * @param params Request parameters
   * @returns Unique string key for caching
   */
  private generateKey(url: string, params: any = {}): string {
    const sortedParams = this.sortObject(params);
    return `${url}::${JSON.stringify(sortedParams)}`;
  }

  /**
   * Sort object keys to ensure consistent cache keys
   * @param obj Object to sort
   * @returns Sorted object
   */
  private sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }
    
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = this.sortObject(obj[key]);
        return result;
      }, {});
  }

  /**
   * Check if valid cached data exists for given URL and params
   * @param url API endpoint URL
   * @param params Request parameters
   * @returns true if valid cache exists, false otherwise
   */
  has(url: string, params: any = {}): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if cache has expired
    const now = Date.now();
    if (now > entry.expiryTime) {
      // Remove expired entry
      this.cache.delete(key);
      console.log(`[ApiCacheService] Cache expired for: ${url}`);
      return false;
    }
    
    return true;
  }

  /**
   * Get cached data for given URL and params
   * @param url API endpoint URL
   * @param params Request parameters
   * @returns Cached data as Observable or null if not found
   */
  get(url: string, params: any = {}): Observable<any> | null {
    if (!this.has(url, params)) {
      return null;
    }
    
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);
    
    if (entry) {
      console.log(`[ApiCacheService] Cache HIT for: ${url}`);
      return of(entry.data);
    }
    
    return null;
  }

  /**
   * Store data in cache with optional TTL
   * @param url API endpoint URL
   * @param params Request parameters
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (optional, uses DEFAULT_TTL if not provided)
   */
  set(url: string, params: any = {}, data: any, ttl?: number): void {
    const key = this.generateKey(url, params);
    const expiryTime = Date.now() + (ttl || this.DEFAULT_TTL);
    
    this.cache.set(key, {
      data,
      expiryTime
    });
    
    console.log(`[ApiCacheService] Cache SET for: ${url} (TTL: ${(ttl || this.DEFAULT_TTL) / 1000}s)`);
  }

  /**
   * Clear specific cache entry or all cache
   * @param url Optional API endpoint URL to clear specific cache
   * @param params Optional request parameters
   */
  clear(url?: string, params?: any): void {
    if (url) {
      const key = this.generateKey(url, params || {});
      this.cache.delete(key);
      console.log(`[ApiCacheService] Cleared cache for: ${url}`);
    } else {
      this.cache.clear();
      console.log('[ApiCacheService] Cleared all cache');
    }
  }

  /**
   * Clear all expired cache entries
   * This is useful for periodic cleanup
   */
  clearExpired(): void {
    const now = Date.now();
    let count = 0;
    
    this.cache.forEach((entry, key) => {
      if (now > entry.expiryTime) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      console.log(`[ApiCacheService] Cleared ${count} expired cache entries`);
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns Object with cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Helper method to wrap an API call with caching logic
   * @param url API endpoint URL
   * @param params Request parameters
   * @param apiCall Function that returns the actual API call Observable
   * @param ttl Optional TTL for this specific cache entry
   * @returns Observable with cached or fresh data
   */
  cacheableRequest<T>(
    url: string,
    params: any = {},
    apiCall: () => Observable<T>,
    ttl?: number
  ): Observable<T> {
    // Check if we have valid cached data
    const cachedData = this.get(url, params);
    
    if (cachedData) {
      return cachedData;
    }
    
    // No cache - make the API call and cache the result
    console.log(`[ApiCacheService] Cache MISS for: ${url} - Fetching from API`);
    return apiCall().pipe(
      tap(data => {
        this.set(url, params, data, ttl);
      })
    );
  }
}

