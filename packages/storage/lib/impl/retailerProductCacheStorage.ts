import type { RetailerProduct } from '../base/types.js';
import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

type RetailerProductStorage = BaseStorage<Record<string, { data: RetailerProduct, timestamp: number }>>;

const storage = createStorage<Record<string, { data: RetailerProduct, timestamp: number }>>(
    'retailer-product-cache-storage-key', 
    {}, 
    { storageEnum: StorageEnum.Local, liveUpdate: true }
);

export const retailerProductCacheStorage: RetailerProductStorage = { 
    ...storage
};
