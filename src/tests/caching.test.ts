// Import necessary modules and services
import { CachingService } from '../services/caching.service';
import { CacheItem } from '../models/cache-item.model';

// Test suite for caching service
describe('CachingService', () => {
  let cachingService: CachingService;
  const cacheKey = 'testKey';
  const cacheValue: CacheItem = { data: 'testData', expirationTime: Date.now() + 60000 }; // 1 minute from now

  beforeEach(() => {
    cachingService = new CachingService(); // Initialize the service before each test
  });

  afterEach(() => {
    cachingService.clear(cacheKey); // Clear cache after each test to avoid interference between tests
  });

  it('should set a value in the cache', () => {
    cachingService.set(cacheKey, cacheValue);
    const cachedValue = cachingService.get(cacheKey);
    expect(cachedValue).toEqual(cacheValue);
  });

  it('should get a value from the cache', () => {
    cachingService.set(cacheKey, cacheValue);
    const retrievedValue = cachingService.get(cacheKey);
    expect(retrievedValue).toEqual(cacheValue);
  });

  it('should remove a value from the cache', () => {
    cachingService.set(cacheKey, cacheValue);
    cachingService.clear(cacheKey);
    const retrievedValue = cachingService.get(cacheKey);
    expect(retrievedValue).toBeUndefined();
  });

  it('should handle expiration of cache items', (done) => {
    cachingService.set(cacheKey, { ...cacheValue, expirationTime: Date.now() - 60000 }); // Expired value
    setTimeout(() => {
      const retrievedValue = cachingService.get(cacheKey);
      expect(retrievedValue).toBeUndefined();
      done();
    }, 100); // Wait for cache expiration
  });
});